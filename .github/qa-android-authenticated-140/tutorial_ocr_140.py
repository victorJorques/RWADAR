"""Real screenshot OCR controls. No UIA/DOM/JS query during the WebView tutorial."""
import argparse,csv,hashlib,io,json,pathlib,re,struct,subprocess,time,unicodedata
MIN_CONFIDENCE=45.0
METHOD='real-device-screenshot-ocr-and-adb-observed-boxes'
HEADER=('level','page_num','block_num','par_num','line_num','word_num','left','top','width','height','conf','text')

def normalized(value):
    return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode().lower())

def dimensions(data):
    assert data.startswith(b'\x89PNG\r\n\x1a\n') and data[12:16]==b'IHDR','Actual PNG required'
    width,height=struct.unpack('>II',data[16:24]);assert 0<width<=8000 and 0<height<=8000
    return width,height

def parse_tsv(text,size):
    assert len(text.encode('utf-8'))<=4*1024*1024,'Bounded OCR response required'
    rows=csv.DictReader(io.StringIO(text),delimiter='\t');assert tuple(rows.fieldnames or ())==HEADER,'Unexpected Tesseract TSV format'
    words=[]
    for index,row in enumerate(rows):
        assert index<20000,'Too many OCR rows'
        if row['level']!='5':continue
        try:
            left,top,width,height=(int(row[k]) for k in ('left','top','width','height'));confidence=float(row['conf'])
            line=tuple(int(row[k]) for k in ('page_num','block_num','par_num','line_num'))
        except (ValueError,TypeError):raise AssertionError('Invalid OCR numeric field') from None
        if confidence<MIN_CONFIDENCE or not normalized(row['text']):continue
        assert confidence<=100 and 0<=left<left+width<=size[0] and 0<=top<top+height<=size[1],'OCR box outside actual PNG'
        words.append({'text':row['text'],'normalized':normalized(row['text']),'box':[left,top,left+width,top+height],
          'confidence':confidence,'line':line})
    return words

def phrases(words,text):
    target=normalized(text);lines=[];found=[]
    # Sparse OCR can split one rendered line into separate blocks. Join only
    # words whose observed vertical boxes agree, keeping the exact text match.
    for word in sorted(words,key=lambda w:(w['box'][1],w['box'][0])):
        b=word['box'];height=b[3]-b[1];centre=(b[1]+b[3])/2
        matches=[]
        for row in lines:
            anchor=row[0]['box'];other_height=anchor[3]-anchor[1]
            overlap=min(b[3],anchor[3])-max(b[1],anchor[1])
            if overlap>=.65*min(height,other_height) and abs(centre-(anchor[1]+anchor[3])/2)<=.35*max(height,other_height):
                matches.append(row)
        assert len(matches)<=1,'Ambiguous physical OCR line'
        if matches:matches[0].append(word)
        else:lines.append([word])
    for row in lines:
        row.sort(key=lambda w:w['box'][0])
        for start in range(len(row)):
            for end in range(start+1,min(len(row),start+6)+1):
                selected=row[start:end]
                if ''.join(w['normalized'] for w in selected)!=target:continue
                box=[min(w['box'][0] for w in selected),min(w['box'][1] for w in selected),
                     max(w['box'][2] for w in selected),max(w['box'][3] for w in selected)]
                found.append({'box':box,'confidence':min(w['confidence'] for w in selected),
                  'words':[{'text':w['text'],'box':w['box'],'confidence':w['confidence']} for w in selected]})
    return found

def green_button_box(png_bytes,progress_box):
    from PIL import Image
    image=Image.open(io.BytesIO(png_bytes)).convert('RGB');width,height=image.size
    assert len(progress_box)==4 and 0<=progress_box[0]<progress_box[2]<=width and 0<=progress_box[1]<progress_box[3]<=height
    pixels=image.load();green=set()
    for y in range(progress_box[3],height):
        for x in range(width):
            r,g,b=pixels[x,y]
            if r<=80 and g>=180 and 80<=b<=200 and g-b>=35:green.add(y*width+x)
    candidates=[]
    while green:
        point=green.pop();stack=[point];area=0;x0=width;y0=height;x1=y1=0
        while stack:
            point=stack.pop();x=point%width;y=point//width;area+=1
            x0=min(x0,x);y0=min(y0,y);x1=max(x1,x+1);y1=max(y1,y+1)
            neighbours=[point-width,point+width]
            if x>0:neighbours.append(point-1)
            if x+1<width:neighbours.append(point+1)
            for neighbour in neighbours:
                if neighbour in green:green.remove(neighbour);stack.append(neighbour)
        bw,bh=x1-x0,y1-y0
        if (bw>=width*.18 and bh>=height*.02 and 2<=bw/bh<=12 and area/(bw*bh)>=.60
                and x0>0 and x1<width and y1<height):candidates.append([x0,y0,x1,y1])
    return candidates[0] if len(candidates)==1 else None

def step_and_control(words,step,png_bytes=None):
    assert step in (1,2,3,4)
    progress=phrases(words,'Paso '+str(step)+' de 4')
    if len(progress)!=1:return None
    control=phrases(words,'Siguiente' if step<4 else 'Volver a Academy')
    # The real navigation follows the lesson; paragraph occurrences above its
    # progress indicator cannot authorize a tap. Ambiguity always fails closed.
    height=progress[0]['box'][3]-progress[0]['box'][1]
    control=[c for c in control if c['box'][1]>=progress[0]['box'][1]-height]
    if len(control)==1:return {'step':step,'progress':progress[0],'control':control[0]}
    if control or step==4 or png_bytes is None:return None
    box=green_button_box(png_bytes,progress[0]['box'])
    if box is None:return None
    return {'step':step,'progress':progress[0],'control':{'box':box,'confidence':None,'words':[],
      'controlObservationMethod':'green-pixels-below-ocr-progress','rootLabelReviewRequired':True}}

def ocr_image(image,output_tsv,timeout=15,sanitize=lambda value:value):
    image=pathlib.Path(image);output_tsv=pathlib.Path(output_tsv);data=image.read_bytes();size=dimensions(data)
    result=subprocess.run(['tesseract',str(image),'stdout','-l','spa+eng','--psm','11','tsv'],
      capture_output=True,check=False,timeout=timeout)
    assert result.returncode==0,'Real Tesseract OCR failed; details withheld'
    text=result.stdout.decode('utf-8');words=parse_tsv(text,size)
    output_tsv.write_text(sanitize(text),encoding='utf-8')
    return {'image':image,'tsv':output_tsv,'bytes':data,'size':size,'words':words,
      'sha256':hashlib.sha256(data).hexdigest(),'ocrSha256':hashlib.sha256(output_tsv.read_bytes()).hexdigest()}

def foreground(ui):
    state=ui.window_state()
    assert state.get('appFocused') is True and state.get('focusPackage')==ui.APP_PACKAGE,'RWAdar foreground required for OCR controls'

def fresh(ui):
    foreground(ui);started=time.monotonic();ui.screen('ocr-working')  # PNG only; never ui.dump/capture.
    shot=ocr_image(ui.out/'ocr-working.png',ui.out/'ocr-working.tsv.txt',sanitize=ui.sanitize)
    shot['capturedMonotonic']=started
    return shot

def save_observation(ui,shot,name):
    png=ui.out/(name+'.png');tsv=ui.out/(name+'.tsv.txt')
    png.write_bytes(shot['bytes']);tsv.write_bytes(shot['tsv'].read_bytes())
    return {'screenshot':png.name,'sha256':shot['sha256'],'ocrTsv':tsv.name,'ocrSha256':shot['ocrSha256'],
      'width':shot['size'][0],'height':shot['size'][1]}

def swipe_forward(ui,shot):
    foreground(ui);width,height=shot['size'];lefts=[w['box'][0] for w in shot['words'] if w['box'][0]>0]
    assert lefts,'Observed text margin required for scrolling'
    # Native vertical scroll in the observed empty left text margin. This avoids
    # dragging the interactive 3D canvas; these are gestures, never guessed buttons.
    x=max(2,int(min(lefts)*.65));assert x<width*.2
    start,end=(x,int(height*.78)),(x,int(height*.38))
    ui.adb('shell','input','swipe',*map(str,(*start,*end)),'550');time.sleep(.45)

def run_tutorial(ui,click,report,source_file):
    component=pathlib.Path(source_file).read_bytes();source=component.decode('utf-8')
    assert "import { WebView } from 'react-native-webview'" in source and "https://rwadar.pages.dev/#explain" in source,'Frozen compiled WebView component required'
    click('Academy');ui.wait_ui('Empezar tutorial 3D',timeout=20);click('Empezar tutorial 3D')
    report['tutorialOcrActive']=True
    # From here until the observed return press, no accessibility tree is queried.
    deadline=time.monotonic()+65;renderer=None
    while time.monotonic()<deadline:
        shot=fresh(ui)
        if len(phrases(shot['words'],'Entero'))==1 and phrases(shot['words'],'Academy Tutorial 3D'):
            renderer=save_observation(ui,shot,'05-tutorial-webview-real');break
        time.sleep(.5)
    assert renderer,'Actual Entero scene label and native tutorial header were not recognized'
    renderer.update(kind='compiled-webview-first-scene',sourceFile='rwadar-movil/componentes/Explicador.js',
      sourceSha256=hashlib.sha256(component).hexdigest(),rootVisualReviewRequired=True)
    # Only the first counter is OCR-certified. Subsequent PNGs require the
    # root reviewer's real visual observations before any final approval.
    observed=[];step_evidence=[];scrolls=0;recognized=None
    deadline=time.monotonic()+95
    while time.monotonic()<deadline:
        shot=fresh(ui);progress=phrases(shot['words'],'Paso 1 de 4')
        if len(progress)==1:
            box=green_button_box(shot['bytes'],progress[0]['box'])
            if box is not None:
                recognized=progress[0];break
        assert scrolls<18,'Bounded observed scrolling did not reveal first progress and green button'
        swipe_forward(ui,shot);scrolls+=1
    assert recognized,'Actual first progress and green button were not observed'
    progress_box=recognized['box'];viewport=shot['size']
    for expected in (1,2,3):
        if expected>1:
            deadline=time.monotonic()+25;box=None
            while time.monotonic()<deadline:
                shot=fresh(ui)
                assert shot['size']==viewport,'Viewport geometry changed between assisted step captures'
                box=green_button_box(shot['bytes'],progress_box)
                if box is not None:break
                time.sleep(.4)
            assert box is not None,'Actual current PNG did not expose one green next control'
        foreground(ui);assert time.monotonic()-shot['capturedMonotonic']<=30,'OCR image too old for a native tap'
        evidence=save_observation(ui,shot,'05-tutorial-step-'+str(expected))
        x=(box[0]+box[2])//2;y=(box[1]+box[3])//2
        evidence.update(step=expected,stepObservation='root-visual-review-required',rootLabelReviewRequired=True,
          control='Siguiente →',box=box,tap=[x,y],confidence=None,foregroundVerified=True,
          progressBox=progress_box,progressConfidence=recognized['confidence'] if expected==1 else None,
          controlObservationMethod='green-pixels-below-ocr-progress')
        step_evidence.append(dict(evidence));observed.append(evidence)
        report['tutorialOcrProgress']={'rendererEvidence':renderer,'stepEvidence':list(step_evidence),
          'observedPresses':list(observed),'scrollGestures':scrolls,'rootVisualReviewRequired':True}
        ui.adb('shell','input','tap',str(x),str(y));time.sleep(.7)
    # Capture the final state in the same viewport. Do not press its Next
    # control; whether it is disabled is established by the root PNG review.
    shot=fresh(ui);assert shot['size']==viewport,'Final assisted step viewport geometry changed'
    evidence=save_observation(ui,shot,'05-tutorial-step-4')
    evidence.update(step=4,stepObservation='root-visual-review-required',rootLabelReviewRequired=True,confidence=None)
    step_evidence.append(evidence)
    report['tutorialOcrProgress']={'rendererEvidence':renderer,'stepEvidence':list(step_evidence),
      'observedPresses':list(observed),'scrollGestures':scrolls,'rootVisualReviewRequired':True}
    # The return CTA may legitimately require scrolling. Its exact OCR words
    # authorize the return press without requiring a counter in that viewport.
    deadline=time.monotonic()+65;return_control=None
    while time.monotonic()<deadline:
        shot=fresh(ui)
        controls=phrases(shot['words'],'Volver a Academy')+phrases(shot['words'],'Volver Academy')
        if len(controls)==1:return_control=controls[0];break
        assert scrolls<24,'Bounded observed scrolling did not reveal the return control'
        swipe_forward(ui,shot);scrolls+=1
    assert return_control,'One actual OCR return control was not observed'
    foreground(ui);assert time.monotonic()-shot['capturedMonotonic']<=30,'Return image too old for a native tap'
    return_evidence=save_observation(ui,shot,'05-tutorial-return-control')
    box=return_control['box'];x=(box[0]+box[2])//2;y=(box[1]+box[3])//2
    return_evidence.update(control='Volver a Academy',box=box,tap=[x,y],confidence=return_control['confidence'],
      foregroundVerified=True,controlObservationMethod='tesseract-tsv-observed-words')
    report['tutorialOcrProgress'].update(returnControlEvidence=return_evidence,scrollGestures=scrolls)
    ui.adb('shell','input','tap',str(x),str(y));time.sleep(.5)
    # Confirm the return from a fresh real image before querying UIA again.
    deadline=time.monotonic()+30;returned=None
    while time.monotonic()<deadline:
        shot=fresh(ui)
        if phrases(shot['words'],'Empezar tutorial 3D'):
            returned=save_observation(ui,shot,'06-academy-return');break
        time.sleep(.4)
    assert returned,'Native Academy return was not observed by OCR'
    report['tutorialOcrActive']=False;ui.wait_ui('Empezar tutorial 3D',timeout=25)
    report['checks']['academyTutorialManual4Steps']={'steps':[1,2,3,4],'stepsObservedByOcr':[1],
      'stepNumbersRepresentExpectedOrder':True,'rootVisualReviewRequired':True,'returned':True,'actualWebView':True,
      'fallbackAccepted':False,'observationMethod':'real-device-screenshots-assisted-root-review',
      'nativeXmlUsedForSteps':False,'freshScreenshots':True,'scrollBetweenStepCaptures':False,
      'rendererEvidence':renderer,'stepEvidence':step_evidence,'observedPresses':observed,
      'returnControlEvidence':return_evidence,'returnEvidence':returned,'scrollGestures':scrolls,'minimumConfidence':MIN_CONFIDENCE,
      'webViewIdentityBasis':'frozen compiled WebView component, recognized first scene, and mandatory root visual review'}
    for name in ('ocr-working.png','ocr-working.tsv.txt'):
        (ui.out/name).unlink(missing_ok=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check-real-image',required=True);parser.add_argument('--output-tsv',required=True)
    args=parser.parse_args();proof=ocr_image(args.check_real_image,args.output_tsv)
    assert len(proof['words'])>=3,'Real screenshot preflight requires recognized text and observed boxes'
    print(json.dumps({'status':'passed-real-image-ocr-only','method':METHOD,'width':proof['size'][0],
      'height':proof['size'][1],'recognizedWords':len(proof['words']),'imageSha256':proof['sha256'],'ocrSha256':proof['ocrSha256']}))
