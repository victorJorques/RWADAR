"""Private, scoped ready-candidate APK20 UI QA. No account creation, email, SQL or release."""
import base64, hashlib, json, os, pathlib, re, shlex, signal, sys, time
import native_ui_140 as ui
import native_catalog_checks_140 as catalog
from candidate_140 import load_candidate, OLD_SHA

ROOT = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path('evidence-private')
OUT.mkdir(exist_ok=True)
CANDIDATE=load_candidate()
SHA=CANDIDATE['apkSha256']
SOURCE=CANDIDATE['sourceHeadSha']
TITLE = 'Vivienda · Pottendorfer Straße 62, Wr. Neustadt'
QA_NAME = 'QA_APK20_LOCAL_' + os.environ.get('GITHUB_RUN_ID', 'PREPARATION_ONLY')
report = {'scope':'private-confirmed-account-ui-only', 'status':'not-started',
          'apkSha256':SHA, 'apkBytes':CANDIDATE['apkBytes'], 'version':'1.4.0', 'versionCode':20,
          'certificateSha256':CANDIDATE['certificateSha256'],'easBuildId':CANDIDATE['easBuildId'],
          'sourceHeadSha':SOURCE, 'checks':{}, 'full20PointQA':False,
          'releaseApproved':False, 'visualReviewCompleted':False,
          'noPostsNoPaymentsNoEmailsNoSQL':True, 'localQADataRemoved':False}


PHASES=frozenset(('initial-login','radar-reuse','large-font-detail','provider-groups','documentary-details','languages','tutorial','portfolio','logout'))


def note_phase(name):
    assert name in PHASES, 'Unexpected static QA phase'
    report['phase']=name
    print('RWADAR_QA_PHASE '+json.dumps({'phase':name}),flush=True)


def emit_result_backup():
    # Exact bounded final JSON is backed up independently of the ZIP exporter.
    # It was already private evidence; sanitize again before any log emission.
    path=OUT.joinpath('authenticated-result.json')
    raw=ui.sanitize(path.read_text(encoding='utf-8')).encode('utf-8')
    path.write_bytes(raw)
    digest=hashlib.sha256(raw).hexdigest()
    if len(raw)>256*1024:
        print('RWADAR_PRIVATE_QA_RESULT_OMITTED '+json.dumps({'bytes':len(raw),'sha256':digest,'reason':'bounded-backup-size'}),flush=True)
        return
    chunks=[base64.b64encode(raw[i:i+576]).decode('ascii') for i in range(0,len(raw),576)]
    print('RWADAR_PRIVATE_QA_RESULT_META',digest,len(raw),len(chunks),flush=True)
    for index,chunk in enumerate(chunks):
        print('RWADAR_PRIVATE_QA_RESULT_DATA',f'{index:06d}',chunk,flush=True)


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def locate(label, starts=False):
    root = ui.dump()
    try:
        ui.find_node(root, label, starts)
        return root
    except AssertionError:
        ui.scroll_top()
        return ui.reach_control(label, starts)


def click(label, starts=False):
    root = locate(label, starts)
    node, bounds = ui.find_node(root, label, starts)
    require(node.get('enabled') != 'false', 'Required UI control is disabled')
    w,h = ui.display_size()
    require(0 <= bounds[0] < bounds[2] <= w and 0 <= bounds[1] < bounds[3] <= h,
            'Required UI control is clipped')
    ui.tap_observed(root, label, starts)
    time.sleep(.2)


def field(label, value, secret=False):
    locate(label)
    # Campo has a visible Text label and a distinct EditText with the same label.
    # Generic click(label) may select the Text; never repeat that ambiguous lookup.
    ui.focus_exact_editable(label,secret=secret)
    # The wrapper suppresses subprocess args/stdout/stderr in every error path.
    # shlex.quote prevents Android's shell from interpreting credential characters.
    ui.adb('shell','input','keycombination','113','29')
    ui.adb('shell','input','keyevent','KEYCODE_DEL')
    ui.type_text_observed(value)
    ui.dismiss_keyboard_if_visible()
    time.sleep(.15)


def capture(name):
    ui.screen(name, ui.dump())


def authenticated_ui(root, language='es'):
    labels=('Home','Search','Academy','Profile') if language=='en' else ('Inicio','Buscar','Academy','Perfil')
    values={value for n in root.iter('node') if n.get('visible')!='false'
            for value in (n.get('text',''),n.get('content-desc',''))}
    return all(label in values for label in labels)


def require_login_inputs():
    # The bridge compares RAW values in memory before sanitizing the UI tree.
    # Only this bounded boolean metadata may authorize the observed submit.
    fields=ui.LAST_LOGIN_INPUT_DIAGNOSTIC
    report['loginInputVerification']={'inputFields':list(fields)}
    email=[item for item in fields if item.get('field')=='email']
    password=[item for item in fields if item.get('field')=='password']
    require(len(fields)==2 and len(email)==1 and len(password)==1,
            'Login input verification is incomplete; submit was not attempted')
    require(email[0].get('expectedValueMatch') is True,
            'Login email verification failed; submit was not attempted')
    require(password[0].get('expectedValueMatch') is True
            or (password[0].get('maskOnly') is True
                and password[0].get('expectedLengthMatch') is True),
            'Login password verification failed; submit was not attempted')


def login_confirmed(language='es', gate_language=None):
    # Resizes/restarts can race an already completed admission. Four authenticated
    # tabs are success; never search for another Entrar button on Home/Launcher.
    ui.CAPTURE_ALLOWED=False
    english=language=='en'
    # The current gate precedes locale hydration; session tabs may use another locale.
    gate_english=(gate_language or language)=='en'
    root=ui.dump()
    if not authenticated_ui(root,language):
        ui.wait_ui('Sign in to your account' if gate_english else 'Entra en tu cuenta',timeout=30)
        field('Email' if gate_english else 'Correo',os.environ['RWADAR_QA_EMAIL'])
        field('Password' if gate_english else 'Contraseña',os.environ['RWADAR_QA_PASSWORD'],secret=True)
        root=ui.dump()
        if not authenticated_ui(root,language):
            label='Sign in' if gate_english else 'Entrar'
            try:
                ui.find_node(root,label)
            except AssertionError:
                # Recheck admission before any scrolling; a successful transition
                # must not become a missing-button failure or a second submission.
                root=ui.dump()
                if not authenticated_ui(root,language):
                    require(any(n.get('package')=='com.rwadar.app' for n in root.iter('node')),
                            'Login left the app window; no scroll or submit was attempted')
                    root=locate(label)
                    ui.remember_login_submit(root,label)
                    require_login_inputs()
                    ui.tap_observed(root,label)
            else:
                ui.remember_login_submit(root,label)
                require_login_inputs()
                ui.tap_observed(root,label)
        try:
            ui.wait_ui(*(('Home','Search','Academy','Profile') if english else ('Inicio','Buscar','Academy','Perfil')),timeout=40)
        except Exception:
            report['loginDiagnostic']=ui.safe_login_diagnostic()
            raise
    ui.CAPTURE_ALLOWED=True
    report['checks']['confirmedAccountLogin']=True

def check_visible_box(root, label, starts=False):
    _,b = ui.find_node(root,label,starts)
    w,h = ui.display_size()
    require(0 <= b[0] < b[2] <= w and 0 <= b[1] < b[3] <= h,
            'Observed native element has zero height or lies outside display')
    return b


def catalog_and_detail():
    catalog.open_offer_catalog()
    for label in ('Mostrar principales 24','Mostrar reventa 21','Mostrar próximas 4'):
        locate(label)
    root = ui.dump()
    lists = [n for n in root.iter('node') if n.get('class') in
             ('android.widget.ScrollView','androidx.recyclerview.widget.RecyclerView')
             and n.get('visible') != 'false']
    require(lists, 'Catalog has no visible native list')
    for node in lists:
        b = list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
        require(len(b) == 4 and b[2] > b[0] and b[3] > b[1], 'Catalog native list has zero height')
    capture('01-catalog49-list')
    field('Buscar ofertas por nombre, proveedor, país o métrica','Pottendorfer')
    catalog.reach_catalog_total()
    root = ui.wait_ui('1 de 24 fichas',timeout=20)
    root = locate('Ver ficha de ' + TITLE,True)
    row_bounds = check_visible_box(root,'Ver ficha de ' + TITLE,True)
    capture('02-result-card-nonzero')
    click('Ver ficha de ' + TITLE,True)
    root = ui.wait_ui('Cerrar ' + TITLE,timeout=20)
    check_visible_box(root,'Cerrar ' + TITLE)
    catalog.assert_modal_top(root,TITLE,'03-long-title-native-geometry')
    report['checks']['fullTitleAndPersistentControls']=True
    capture('03-detail-font15')
    # Reach the source CTA, but never activate the provider link.
    locate('Ver en la fuente ·',True)
    capture('04-detail-source-reachable')
    click('Cerrar ' + TITLE)
    catalog.reach_catalog_total()
    click('Ver ficha de ' + TITLE,True)
    ui.wait_ui('Cerrar ' + TITLE,timeout=15)
    ui.adb('shell','input','keyevent','KEYCODE_BACK')
    root = catalog.reach_catalog_total()
    require('Cerrar ' + TITLE not in ui.visible_text(root), 'Android Back did not close detail')
    report['checks']['catalog49AndList'] = {'total':49,'main':24,'resale':21,'upcoming':4,
                                            'resultCardBounds':row_bounds,'nativeListNonzero':True}
    report['checks']['detailFont15CloseAndBack'] = {'fontScale':'1.5','close':True,
                                                  'androidBack':True,'sourceReachableNotOpened':True}



LANGUAGE_REUSE_META={'runId': 40562598549, 'jobId': 122395343247, 'originalStatus': 'failed', 'originalFailurePhase': 'tutorial', 'harnessHeadSha': 'f05332c2a639a30011283e8882674b27f6b98e81', 'resultSha256': '9781d5be0b2aa0d4b281f4feef5568306082971d081891ed47146daf3b14afd9', 'checkpointsSha256': '753d06760ab9219b78c22ea72a06a34565cba826e29c4cd8e6595717a23b01b4', 'zipSha256': '765246ea7530c56587ccc4fc282eb5f6b19492c0cd3c2930d44d2a48ea0cef6b', 'apkSha256': 'c20a45889c7eccdf0ac9cfb4fd18345a09c64e05b130a8af4b44177fb2e7e614', 'sourceHeadSha': '7c64b6c15a826ddb3189c8ab195b4fa36201ca51', 'observationPerformedInThisRun': False, 'inheritedFlagsReferToOriginalRun': True, 'languageReportSha256': 'ee1e0f5008d01bd49f49529a5445d527bbbce8efa30a70b2f9a42216f0072e98', 'invariantObservationsSha256': '701bf811aa3e554f37329a650ca2f14012ade6155ad87a2bb09dcdd5030be20b', 'languagesAndFavoritePersistenceScopeOnly': True, 'reusedChecks': ['languagesAndFavoritePersistence']}
ACADEMY_LESSON_REUSE_META={'runId': 40562598549, 'jobId': 122395343247, 'originalStatus': 'failed', 'originalFailurePhase': 'tutorial', 'harnessHeadSha': 'f05332c2a639a30011283e8882674b27f6b98e81', 'resultSha256': '9781d5be0b2aa0d4b281f4feef5568306082971d081891ed47146daf3b14afd9', 'checkpointsSha256': '753d06760ab9219b78c22ea72a06a34565cba826e29c4cd8e6595717a23b01b4', 'zipSha256': '765246ea7530c56587ccc4fc282eb5f6b19492c0cd3c2930d44d2a48ea0cef6b', 'apkSha256': 'c20a45889c7eccdf0ac9cfb4fd18345a09c64e05b130a8af4b44177fb2e7e614', 'sourceHeadSha': '7c64b6c15a826ddb3189c8ab195b4fa36201ca51', 'observationPerformedInThisRun': False, 'inheritedFlagsReferToOriginalRun': True, 'lessonXmlSha256': '6f087b7b8a2f57dde37a0eb62c40454201bb5707a83c09c52a2bb0fecbb966b0', 'academyLessonScopeOnly': True, 'reusedChecks': ['academyLesson']}

def reuse_completed_languages_and_lesson():
    def pinned(label,digest):
        raw=ROOT.joinpath('baseline-c20-languages-complete-40562598549-'+label+'.json').read_bytes()
        require(hashlib.sha256(raw).hexdigest()==digest,'Completed language evidence identity mismatch')
        return json.loads(raw)
    previous=pinned('result',LANGUAGE_REUSE_META['resultSha256'])
    checkpoints=pinned('checkpoints',LANGUAGE_REUSE_META['checkpointsSha256'])
    language=pinned('language',LANGUAGE_REUSE_META['languageReportSha256'])
    observations=pinned('observations',LANGUAGE_REUSE_META['invariantObservationsSha256'])
    require(previous['status']=='failed' and previous['phase']=='tutorial' and previous['full20PointQA'] is False and previous['releaseApproved'] is False,'Original tutorial failure must stay failed')
    require(all(all(data[key]==CANDIDATE[key] for key in ('apkSha256','apkBytes','versionCode','sourceHeadSha')) for data in (previous,checkpoints)),'Language evidence belongs to another candidate')
    require(checkpoints['runId']=='40562598549' and checkpoints['harnessHeadSha']==LANGUAGE_REUSE_META['harnessHeadSha'],'Completed language run provenance mismatch')
    require(previous['checks']['languagesAndFavoritePersistence']==language and language['invariantObservations']==observations,'Language report is not its original exact observation')
    require(language['invariantObservationsSha256']==LANGUAGE_REUSE_META['invariantObservationsSha256'],'Language observation digest mismatch')
    require(all(language[key] is True for key in ('englishTabs','spanishTabs','englishPersistedAfterRestart','spanishPersistedAfterRestart','favoritePersistedAcrossRestartAndRelogin','qaFavoriteRemoved','amountsAndUnitsUnchanged','sourceDatesUnchanged','sourceUrlsUnchanged','physicalInvariantCoverageComplete')),'Completed language criterion is incomplete')
    for locale,count in (('es',38),('en',39)):
        scan=observations[locale]
        catalog.assert_language_invariant_coverage(scan)
        require(len(scan['signature'])==57 and len(scan['frames'])==count and scan['signatureSha256']=='a89c73e0a749b6bd4371b0dbf107121d8ba3538aa76cc89d9cd0f9bb7343b2d5','Completed language physical coverage differs')
    catalog.assert_language_invariant_equality(observations['es'],observations['en'])
    require(checkpoints['criteria']['languagesAndFavoritePersistence']['status']=='validated-scope-only','Completed language checkpoint missing')
    lesson=ROOT.joinpath('baseline-c20-academy-lesson-40562598549.xml').read_bytes()
    require(hashlib.sha256(lesson).hexdigest()==ACADEMY_LESSON_REUSE_META['lessonXmlSha256'] and previous['checks']['academyLesson'] is True,'Completed Academy lesson evidence mismatch')
    report['languageReuseMetadata']=LANGUAGE_REUSE_META
    report['academyLessonReuseMetadata']=ACADEMY_LESSON_REUSE_META
    return {'languagesAndFavoritePersistence':language,'academyLesson':True}


def tutorial_content_ready(root,dimensions):
    def box(node,outer):
        b=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
        return (node.get('visible')=='true' and len(b)==4 and outer[0]<=b[0]<b[2]<=outer[2] and outer[1]<=b[1]<b[3]<=outer[3])
    display=[0,0,*dimensions]
    if any(node.get('text')=='Levantando el edificio…' and box(node,display) for node in root.iter('node')):return False
    for view in root.iter('node'):
        if view.get('class')!='android.webkit.WebView' or not box(view,display):continue
        bounds=list(map(int,re.findall(r'-?\d+',view.get('bounds',''))))
        if any(node.get('text','').casefold() in ('1 · entero','paso 1 de 4') and box(node,bounds) for node in view.iter('node')):return True
    return False


def wait_tutorial_content():
    deadline=time.monotonic()+60
    while time.monotonic()<deadline:
        root=ui.dump()
        if tutorial_content_ready(root,ui.display_size()):return root
        time.sleep(.5)
    capture('05-tutorial-not-physically-ready')
    raise AssertionError('Real web tutorial never became physically ready; loading or offscreen DOM is not step1')


def tutorial():
    click('Academy')
    ui.wait_ui('Empezar tutorial 3D',timeout=20)
    click('Empezar tutorial 3D')
    root = wait_tutorial_content()
    require(any(n.get('class') == 'android.webkit.WebView' for n in root.iter('node')),
            'Expected the real authenticated web tutorial; native fallback is not certified')
    steps = []
    for step in range(1,5):
        root = ui.wait_ui('Paso ' + str(step) + ' de 4',timeout=15)
        control='Siguiente →' if step<4 else 'Volver a Academy'
        root=locate(control)
        check_visible_box(root,'Paso ' + str(step) + ' de 4')
        check_visible_box(root,control)
        capture('05-tutorial-step-' + str(step))
        steps.append(step)
        # No automatic timers or JS injection: each transition is a real UI press.
        if step < 4:
            click('Siguiente →')
    click('Volver a Academy')
    ui.wait_ui('Empezar tutorial 3D',timeout=20)
    capture('06-academy-return')
    report['checks']['academyTutorialManual4Steps'] = {'steps':steps,'returned':True,
                                                     'actualWebView':True,'fallbackAccepted':False}


def money(label, expected):
    root = locate(label)
    try:
        ui.find_node(root,expected)
    except AssertionError:
        root = ui.reach_control(expected)
    values = [n.get('text','').replace('\u00a0',' ').strip() for n in root.iter('node')
              if n.get('visible') != 'false' and n.get('text')]
    candidates = []
    for index,value in enumerate(values):
        if value == label:
            following = [v for v in values[index+1:index+4]
                         if re.fullmatch(r'-?[0-9.,]+ (?:EUR|%)',v)]
            if following:
                candidates.append(following[0])
    require(candidates == [expected], 'Portfolio calculation mismatch for ' + label)


def portfolio():
    click('Perfil')
    click('Registrar inversión')
    field('Nombre de la inversión',QA_NAME)
    click('EUR')
    field('Cantidad de unidades','2')
    field('Precio pagado por unidad','50')
    field('Comisión (0 si no hubo)','0')
    click('Guardar movimiento')
    locate('Movimiento guardado.')
    report['checks']['localPurchase'] = {'name':QA_NAME,'units':2,'unitPrice':50,'commission':0,'currency':'EUR'}
    click('Actualizar precio · ' + QA_NAME)
    field('Precio actual por unidad','60')
    click('Guardar precio')
    locate('Precio y fecha guardados.')
    click('Añadir movimiento · ' + QA_NAME)
    click('Cobro')
    field('Importe cobrado','5')
    click('Guardar movimiento')
    locate('Movimiento guardado.')
    for label,expected in (('Aportado','100,00 EUR'),('Valor actual','120,00 EUR'),
                           ('Cobrado','5,00 EUR'),('Costes registrados','0,00 EUR'),
                           ('Resultado','25,00 EUR'),('Resultado sin anualizar','25,00 %')):
        money(label,expected)
        capture('07-portfolio-' + re.sub(r'[^a-z]+','-',label.lower()).strip('-'))
    report['checks']['localValuationPaymentAndCalculation'] = {'contributed':100,'value':120,
        'received':5,'costs':0,'result':25,'nonAnnualizedPercent':25,'currency':'EUR'}
    click('Movimientos de ' + QA_NAME)
    click('Eliminar inversión · ' + QA_NAME)
    root = ui.wait_ui('Eliminar inversión',QA_NAME,timeout=10)
    # This exact QA-only name is the sole destructive target, on the disposable device.
    require(QA_NAME.startswith('QA_APK20_LOCAL_'), 'Local deletion target is not QA')
    # Android can render native Alert labels in capitals. Match only its exact
    # destructive label after the dialog above has named our own QA record.
    candidates = [n for n in root.iter('node') if n.get('class') == 'android.widget.Button'
                  and n.get('text','').casefold() == 'eliminar' and n.get('visible') != 'false']
    require(len(candidates) == 1, 'Need one native QA deletion confirmation button')
    b = list(map(int,re.findall(r'-?\d+',candidates[0].get('bounds',''))))
    require(len(b) == 4 and b[0] < b[2] and b[1] < b[3], 'Invalid native QA deletion button')
    ui.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
    root = ui.wait_ui('Inversión eliminada.',timeout=15)
    require(QA_NAME not in ui.visible_text(root), 'QA investment still visible after deletion')
    report['localQADataRemoved'] = True
    capture('08-local-qa-deleted')


def sign_out():
    click('Cerrar sesión')
    root = ui.wait_ui('Tu radar, con tu cuenta','Entra en tu cuenta',timeout=25)
    blocked = ('Inicio','Buscar','Academy','Perfil','Mis inversiones','49 en el catálogo')
    require(not any(value in ui.visible_text(root).splitlines() for value in blocked),
            'Catalog or local portfolio remains available after sign out')
    ui.adb('shell','input','keyevent','KEYCODE_BACK')
    ui.adb('shell','am','start','-W','-n','com.rwadar.app/.MainActivity')
    root = ui.wait_ui('Entra en tu cuenta',timeout=15)
    require('49 en el catálogo' not in ui.visible_text(root), 'Back/reopen bypassed access after sign out')
    capture('09-signed-out-blocked')
    report['checks']['signOutBlocksCatalogAndLocalPortfolio'] = True


def reuse_completed_radar():
    def pinned(filename,digest):
        raw=ROOT.joinpath(filename).read_bytes()
        require(hashlib.sha256(raw).hexdigest()==digest,'Completed radar baseline identity mismatch')
        return json.loads(raw)
    previous=pinned('baseline-c20-radar-complete-40384575403-result.json','04df2f7b238489c301a37f236a70c77307163adcde16060da79dffb31d03e087')
    checkpoints=pinned('baseline-c20-radar-complete-40384575403-checkpoints.json','11135c1f27868fdbf7efe65decd65cf2147aedda9066c2dfb6c93241efa7baba')
    manifest=pinned('baseline-c20-radar-complete-40384575403-manifest.json','3d6cfa1f2a7bf2e18cd98e727ecb706cbb6d176a69e629ebd99d44c1ea9ed5f3')
    require(previous['status']=='failed' and previous['phase']=='large-font-detail'
            and previous['full20PointQA'] is False and previous['releaseApproved'] is False,
            'Historical overall failure must remain failed')
    require(manifest['runId']==40384575403 and manifest['jobId']==121789341836
            and manifest['harnessHeadSha']=='02ccdeb5d1ccd3ec1baeb8af3dfe1e0fa8481032',
            'Unexpected original completed radar observation')
    for data in (previous,checkpoints,manifest):
        require(data['apkSha256']==SHA and data['apkBytes']==CANDIDATE['apkBytes']
                and data['versionCode']==20 and data['sourceHeadSha']==SOURCE,
                'Completed radar does not bind the exact unchanged APK20/source')
    radar=previous['checks']['radar26Centers320dp']
    checkpoint=checkpoints['criteria']['radar26Centers320dp']
    require(checkpoint['status']=='validated-scope-only' and checkpoint['details']['summary']==radar,
            'Completed radar durable checkpoint is missing')
    require(radar['checked'] is True and radar['count']==26 and radar['widthDp']==320
            and radar['inferredCount']==21 and radar['directCount']==5
            and radar['all26NamesObservedInCurrentRun'] is True
            and radar['changedTouchesPresent'] is True and radar['allVisibleCentresOpenOwnPlatform'] is True,
            'Original radar26 criterion is incomplete')
    direct=checkpoint['details']['directObservations'];inferred=checkpoint['details']['inferredObservations']
    require(len(direct)==5 and [p['index'] for p in direct]==[21,22,23,24,25] and len(inferred)==21,
            'Original completed radar needs21 inferred and5 direct observations')
    for point in direct:
        event=point['event']
        require(event['selectedName']==point['name'] and type(event['changedTouches']) is int
                and event['changedTouches']>=1 and event['eventType']!='click'
                and point['openedOwnPlatform'] is True and point['closedAndReturned'] is True,
                'Original direct native radar event was not validated')
    require(set(radar['currentObservedNames'])=={p['name'] for p in direct}|{p['platformName'] for p in inferred}
            and len(set(radar['currentObservedNames']))==26,'Original current-name coverage is incomplete')
    metadata={'runId':40384575403,'jobId':121789341836,'originalStatus':'failed',
        'originalFailurePhase':'large-font-detail','resultSha256':manifest['resultSha256'],
        'checkpointsSha256':manifest['checkpointsSha256'],'manifestSha256':'3d6cfa1f2a7bf2e18cd98e727ecb706cbb6d176a69e629ebd99d44c1ea9ed5f3',
        'apkSha256':SHA,'sourceHeadSha':SOURCE,'observationPerformedInThisRun':False,
        'inheritedFlagsReferToOriginalRun':True,'radarScopeOnly':True,'priorInferredCount':21,'originalDirectCount':5}
    report['radarReuseMetadata']=metadata
    OUT.joinpath('radar-reuse-metadata.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    return radar


def reuse_completed_font15():
    raw=ROOT.joinpath('baseline-c20-font15-complete-40396305477-result.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()=='935912194be2cd8020996858e47bd1336e54c6658b649c432d0df41445302a74','Completed font1.5 baseline identity mismatch')
    previous=json.loads(raw)
    require(previous['status']=='failed' and previous['phase']=='large-font-detail'
            and previous['full20PointQA'] is False and previous['releaseApproved'] is False,
            'Historical font1.5 overall failure must remain failed')
    require(previous['apkSha256']==SHA and previous['apkBytes']==CANDIDATE['apkBytes']
            and previous['versionCode']==20 and previous['sourceHeadSha']==SOURCE,
            'Completed font1.5 does not bind the exact unchanged APK20/source')
    checks=previous['checks'];detail=checks['detailFont15CloseAndBack'];catalogue=checks['catalog49AndList']
    require(checks['fullTitleAndPersistentControls'] is True,'Completed long-title geometry missing')
    require(all(catalogue.get(key)==value for key,value in [('total',49),('main',24),('resale',21),('upcoming',4)])
            and catalogue.get('nativeListNonzero') is True,'Completed catalogue49 proof missing')
    require(detail.get('fontScale')=='1.5' and all(detail.get(key) is True for key in ('close','androidBack','sourceReachableNotOpened')),
            'Completed font1.5 close/back/source proof missing')
    metadata={'runId': 40396305477, 'jobId': 121830148685, 'originalStatus': 'failed', 'originalFailurePhase': 'large-font-detail', 'harnessHeadSha': '618490ef88832c4f96777bd0c9145cc71d49fbd2', 'resultSha256': '935912194be2cd8020996858e47bd1336e54c6658b649c432d0df41445302a74', 'zipSha256': 'b978e3e1d7262d47d6106871fbfaadd4a2823fcca1174c45a20b37b73a6d7100', 'apkSha256': 'c20a45889c7eccdf0ac9cfb4fd18345a09c64e05b130a8af4b44177fb2e7e614', 'sourceHeadSha': '7c64b6c15a826ddb3189c8ab195b4fa36201ca51', 'observationPerformedInThisRun': False, 'inheritedFlagsReferToOriginalRun': True, 'font15ScopeOnly': True, 'reusedChecks': ['fullTitleAndPersistentControls', 'catalog49AndList', 'detailFont15CloseAndBack']}
    report['font15ReuseMetadata']=metadata
    OUT.joinpath('font15-reuse-metadata.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    return {key:checks[key] for key in metadata['reusedChecks']}


def main():
    require(os.environ.get('GITHUB_REPOSITORY') == 'victorJorques/RWADAR','Private repository required')
    require(os.environ.get('QA_ACCOUNT_ACK') == 'CONFIRMED_TEST_ACCOUNT','Confirmed disposable test account acknowledgement required')
    require(os.environ.get('GITHUB_EVENT_NAME') == 'workflow_dispatch','Manual dispatch required')
    apk = pathlib.Path('rwadar.apk')
    require(apk.stat().st_size == CANDIDATE['apkBytes'] and hashlib.file_digest(apk.open('rb'),'sha256').hexdigest() == SHA,
            'Exact ready APK20 candidate identity mismatch')
    baseline = json.loads(ROOT.joinpath('baseline-c19-guest.json').read_text())
    require(baseline['apkSha256'] == OLD_SHA and baseline['versionCode'] == 19,'Baseline is not APK19')
    identity=json.loads(OUT.joinpath('candidate-package-identity.json').read_text())
    require(identity['status']=='verified-native-package-only' and identity['apkSha256']==SHA
            and identity['apkBytes']==CANDIDATE['apkBytes'] and identity['versionCode']==20
            and identity['certificateSha256']==CANDIDATE['certificateSha256']
            and identity['sourceHeadSha']==SOURCE and len(identity['photos49'])==49,
            'New candidate package identity gate was not completed before install')
    report['checks']['candidatePackageIdentity']=True
    report['candidateIdentity']=identity
    report['sourceReuseProvenance']=identity['sourceProvenance']
    report['reusedBaseline'] = {'runId':40023081613,'jobId':120652334625,
        'reportSha256':'842b1960939bb78ee297c00478f676d8657385a5bc6f0265d2397e619738ca59',
        'checks':['standard'],'historicalStatus':'failed','historicalVersionCode':19,
        'historicalApkSha256':OLD_SHA,'reuseBasis':'Guest UI only: Git-proven identical UI/assets/deps/config; no APK19 identity transferred'}
    continuation_bytes=ROOT.joinpath('baseline-c19-guest-continuation.json').read_bytes()
    require(hashlib.sha256(continuation_bytes).hexdigest()=='4aee7315d605006a9bc8da668c5b18dce7084f5ccc3adc61990b058951aef3c1',
            'Guest continuation report identity mismatch')
    continuation=json.loads(continuation_bytes)
    require(continuation['status']=='passed-scoped-only' and continuation['apkSha256']==OLD_SHA,
            'Historical guest continuation is not scoped passed on APK19')
    report['reusedGuestContinuation']={'runId':40119180570,'workflowConclusion':'cancelled',
        'jobConclusion':'cancelled','reportStatus':'passed-scoped-only',
        'zipSha256':'217f5357a212beedb0e0a9f49006b1c3eda6905696e61936027e3591054959e8',
        'reportSha256':'4aee7315d605006a9bc8da668c5b18dce7084f5ccc3adc61990b058951aef3c1',
        'reusedChecks':['font15','rotationAttempt','noRuntimeException'],
        'scope':'Historical APK19 guest forms only; Git-proven same UI/assets/deps/config on candidate20. Transport changed; cancellation stays cancelled',
        'historicalApkSha256':OLD_SHA,'historicalVersionCode':19}
    email = os.environ['RWADAR_QA_EMAIL']
    password = os.environ['RWADAR_QA_PASSWORD']
    require(re.fullmatch(r'[A-Za-z0-9_.+\-]+@[A-Za-z0-9.\-]+',email) is not None,
            'QA email must use the supported ASCII input alphabet')
    require(re.fullmatch(r'[A-Za-z0-9_\-]{20,120}',password) is not None,
            'QA password must use the supported 20+ character ASCII input alphabet')
    ui.start_snapshot_bridge()
    ui.adb('logcat','-c')
    ui.adb('shell','settings','put','system','font_scale','1.0')
    ui.adb('shell','am','start','-W','-n','com.rwadar.app/.MainActivity')
    email = password = None
    note_phase('initial-login')
    login_confirmed('es')
    report['status'] = 'running'
    catalog.REAUTHENTICATE=login_confirmed
    catalog.CLICK=click; catalog.FIELD=field; catalog.LOCATE=locate
    note_phase('radar-reuse')
    report['checks']['radar26Centers320dp']=reuse_completed_radar()
    note_phase('large-font-detail')
    # Exact completed scope reused from failed run40396305477; no font1.5 detail repeated.
    report['checks'].update(reuse_completed_font15())
    # Continue in this same normal-display Activity and authenticated session.
    ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=20)
    note_phase('provider-groups')
    report['checks']['providerGroups']=catalog.groups_pending()
    report['providerGroupsReuseMetadata']=catalog.PROVIDER_GROUP_REUSE_METADATA
    note_phase('documentary-details')
    documentary=catalog.documentary_and_five_images()
    report['documentaryReuseMetadata']=catalog.DOCUMENTARY_REUSE_METADATA
    report['checks']['nativeCardDecisionFacts']=documentary['cards']
    report['checks']['fiveNativeImagesAndAlt']=True
    report['checks']['datesSeparated']=documentary['datesSeparated']
    report['checks']['historicalReferences']=documentary['historicalReferencesContextualized']
    report['checks']['fourRisksBeforeSingleCta']=documentary['riskAndCta']
    note_phase('languages')
    report['checks'].update(reuse_completed_languages_and_lesson())
    OUT.joinpath('authenticated-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')
    note_phase('tutorial')
    tutorial()
    note_phase('portfolio')
    portfolio()
    note_phase('logout')
    sign_out()
    errors = ui.sanitize(ui.adb('logcat','-d','-v','threadtime','AndroidRuntime:E','ReactNativeJS:E','*:S'))
    OUT.joinpath('runtime-errors-private.log').write_text(errors[-65536:],encoding='utf-8')
    require(not re.search(r'FATAL EXCEPTION|ReactNativeJS.*(?:TypeError|ReferenceError|Invariant Violation|Error:)',errors),
            'Android or JavaScript exception recorded')
    report['checks']['noRuntimeException'] = True
    report['status'] = 'passed-scoped-only'


def timeout_handler(*_):
    # Persist before unwinding device cleanup, diagnostics, or failure capture.
    report['status']='failed'
    report['failureType']='QaDeadlineExceeded'
    report['failure']='Private scoped QA reached its hard1800second limit'
    report['hardDeadlineExceeded']=True
    OUT.joinpath('authenticated-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')
    raise ui.QaDeadlineExceeded('Private scoped QA reached its hard1800second limit')


def safe_exception_diagnostic(error):
    # Read code metadata only: never locals, argv, exception args or source text.
    result={'exceptionName':type(error).__name__,'frames':[]}
    context=error.__cause__ if error.__cause__ is not None else error.__context__
    if context is not None: result['contextExceptionName']=type(context).__name__
    frame=error.__traceback__
    while frame is not None:
        code=frame.tb_frame.f_code
        result['frames'].append({'file':pathlib.Path(code.co_filename).name,
                                 'line':frame.tb_lineno,'function':code.co_name})
        frame=frame.tb_next
    if isinstance(error,NameError) and isinstance(error.name,str) and re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*',error.name):
        result['undefinedName']=error.name
    return result


if __name__ == '__main__':
    exit_code = 1
    try:
        signal.signal(signal.SIGALRM,timeout_handler)
        signal.alarm(1800)
        main()
        exit_code = 0
    except BaseException as error:
        # Never stringify CalledProcessError/TimeoutExpired: they contain argv.
        report['status'] = 'failed'
        report['failureType'] = type(error).__name__
        report['diagnostic'] = safe_exception_diagnostic(error)
        # Only static error metadata is logged before any slow device diagnosis.
        print('RWADAR_QA_FAILURE '+json.dumps({'phase':report.get('phase','not-started'),
            'failureType':type(error).__name__,'diagnostic':report['diagnostic'],
            'messageCode':'hard-deadline' if isinstance(error,ui.QaDeadlineExceeded) else 'assertion-failed' if isinstance(error,AssertionError) else 'unexpected-exception'}),flush=True)
        hard_deadline=isinstance(error,ui.QaDeadlineExceeded)
        report['deviceDiagnostic'] = {'skippedAtHardDeadline':True} if hard_deadline else ui.safe_device_diagnostic()
        report['failure'] = ui.sanitize(str(error)) if isinstance(error,(AssertionError,TimeoutError,ui.QaDeadlineExceeded)) else 'Details withheld to protect credentials'
        if 'undefinedName' in report['diagnostic']:
            report['failure']='Undefined static identifier: '+report['diagnostic']['undefinedName']
        # Durable failure always precedes optional slow diagnostic captures.
        OUT.joinpath('authenticated-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')
        if ui.CAPTURE_ALLOWED and not hard_deadline:
            ui.capture_failure('failure-authenticated-private')
    finally:
        signal.alarm(0)
        try: ui.stop_snapshot_bridge()
        except Exception as error:
            report['snapshotCleanupFailure']=type(error).__name__
        matrix = json.loads(ROOT.joinpath('matrix-20.json').read_text())
        for point in matrix['points']:
            required = point.get('newChecksRequired',[])
            if required and all(report['checks'].get(key) for key in required):
                point['newScopedObservation'] = 'passed'
        matrix['full20PointQA'] = False
        OUT.joinpath('matrix-20-result.json').write_text(json.dumps(matrix,indent=2,ensure_ascii=False),encoding='utf-8')
        OUT.joinpath('authenticated-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')
        try: emit_result_backup()
        except Exception as error:
            print('RWADAR_PRIVATE_QA_RESULT_BACKUP_ERROR '+json.dumps({'exceptionName':type(error).__name__}),flush=True)
        # Machine summary contains no account identifiers, values or exception args.
        print(json.dumps({'status':report['status'],'full20PointQA':False,'releaseApproved':False,
                          'localQADataRemoved':report['localQADataRemoved']}))
    sys.exit(exit_code)
