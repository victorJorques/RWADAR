"""Directed new-APK observations; all mutation is an acknowledged QA-only portfolio.

Old PIN/tutorial/catalog scopes remain historical. Credentials never enter evidence.
"""
import ast, json, os, pathlib, re, shlex, signal, sys, time, xml.etree.ElementTree as ET
import urllib.request
from gate import ROOT, OLD, load_candidate, require_qa_identity, validate_auth_qa_user
sys.path.insert(0,str(OLD))
import native_ui_140 as ui
OUT = pathlib.Path('evidence-private')
QA_NAME = 'QA_APK23_CLOUD_' + os.environ.get('GITHUB_RUN_ID','LOCAL_TEST')
report = {'schemaVersion':1,'scope':'apk22-to-apk23-directed-update','status':'not-started','checks':{},
          'releaseApproved':False,'full20PointQA':False,'visualReviewCompleted':False,
          'qaPortfolioRemoved':False,'otaPublished':False,'otaDeliveryObserved':False,
          'repeatedHistoricalScopes':[]}
created = False

def persist():
    OUT.mkdir(exist_ok=True)
    (OUT/'android-update-141-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')

def complete(name, value=True):
    report['checks'][name] = value; persist()

def load_helpers():
    wanted = ('require','locate','click','field','capture','authenticated_ui','require_login_inputs','login_confirmed')
    source = ast.parse((OLD/'android-authenticated-140.py').read_text(encoding='utf-8'))
    selected = [n for n in source.body if isinstance(n,ast.FunctionDef) and n.name in wanted]
    assert {n.name for n in selected} == set(wanted) and all(not n.decorator_list for n in selected)
    exec(compile(ast.Module(body=selected,type_ignores=[]),str(OLD/'android-authenticated-140.py'),'exec'),globals())
load_helpers()

def verify_auth_qa_identity():
    """A short QA-only password session remains in memory and is locally revoked.

    Use the source's public client configuration, never an admin key or endpoint.
    /user must independently confirm the exact four account fields and email confirmation.
    """
    require_qa_identity(os.environ,require_email=True)
    source=(ROOT.parent.parent/'rwadar-movil/lib/cuentas.js').read_text(encoding='utf-8')
    origin=re.search(r"const URL_CUENTAS = '([^']+)';",source).group(1)
    key=re.search(r"const CLAVE_PUBLICABLE = '([^']+)';",source).group(1)
    require(origin=='https://exgpmjpaaebyoolpwced.supabase.co' and key.startswith('sb_publishable_'),'Only the compiled source public Auth project is allowed')
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs):return None
    opener=urllib.request.build_opener(NoRedirect())
    token=None;session=None;revoked=False
    def request(path,method='GET',data=None,access=None):
        require(path in ('/auth/v1/token?grant_type=password','/auth/v1/user','/auth/v1/logout?scope=local'),'Unsupported QA Auth operation')
        headers={'apikey':key,'Content-Type':'application/json'}
        if access:headers['Authorization']='Bearer '+access
        req=urllib.request.Request(origin+path,data=None if data is None else json.dumps(data).encode('utf-8'),headers=headers,method=method)
        try:
            with opener.open(req,timeout=8) as response:
                require(response.status==(204 if 'logout?' in path else 200),'QA Auth response status mismatch')
                body=response.read(128*1024+1);require(len(body)<=128*1024,'QA Auth response too large')
                return json.loads(body) if body else None
        except Exception:
            raise RuntimeError('QA Auth verification failed; sensitive response withheld') from None
    try:
        session=request('/auth/v1/token?grant_type=password','POST',{'email':os.environ['RWADAR_QA_EMAIL'],'password':os.environ['RWADAR_QA_PASSWORD']})
        token=session.get('access_token');require(isinstance(token,str) and 32<len(token)<=8192,'Bounded QA access token required')
        user=request('/auth/v1/user',access=token);validate_auth_qa_user(user);user=None
    finally:
        if token:
            request('/auth/v1/logout?scope=local','POST',access=token);revoked=True
        token=None;session=None;key=None
    require(revoked,'Short QA API session must be revoked before device QA')
    complete('exactExistingQaAuthUserVerified',{'fourIdentityFieldsMatch':True,'emailConfirmed':True,'authUserEndpointObserved':True,'shortQaApiSessionRevoked':True})

def bounds(node):
    return list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))

def visible(node):
    b=bounds(node); w,h=ui.display_size()
    return node.get('visible')!='false' and len(b)==4 and 0<=b[0]<b[2]<=w and 0<=b[1]<b[3]<=h

def launch():
    ui.adb('shell','am','start','-W','-n',ui.APP_PACKAGE+'/.MainActivity')

def reopen():
    ui.adb('shell','am','force-stop',ui.APP_PACKAGE); launch()

def exact_qa_account():
    click('Perfil'); old=ui.inspect_login_input_values; allowed=ui.CAPTURE_ALLOWED; matches=[]
    def inspect(raw):
        old(raw); tree=ET.fromstring(raw)
        matches.append(sum(1 for n in tree.iter('node') if n.get('package')==ui.APP_PACKAGE and n.get('text')==os.environ['RWADAR_QA_EMAIL'] and n.get('visible')!='false'))
    try:
        ui.CAPTURE_ALLOWED=False; ui.inspect_login_input_values=inspect; ui.dump()
    finally:
        ui.inspect_login_input_values=old; ui.CAPTURE_ALLOWED=allowed
    require(matches==[1],'Visible account must be exactly the dedicated QA account')

def datum_value(root,label,expected,section):
    """Scope duplicated summary/detail labels to a real UI ancestor containing its own heading."""
    parents={child:parent for parent in root.iter() for child in parent}
    candidates=[n for n in root.iter('node') if n.get('text')==label and n.get('visible')!='false']
    pairs=[]
    for node in candidates:
        # Dato is one View containing its two Text children; enclosing section must identify QA/summary.
        cell=parents.get(node); ancestor=cell; scoped=False
        while ancestor is not None:
            headings={n.get('text') for n in ancestor.iter('node')}
            if section in headings:
                # Reject the full page ancestor that also contains the opposite section.
                opposite=QA_NAME if section=='Tu resumen' else 'Tu resumen'
                scoped=opposite not in headings; break
            ancestor=parents.get(ancestor)
        if not scoped or cell is None: continue
        values=[n for n in cell.iter('node') if n.get('text','').replace('\u00a0',' ')==expected and n.get('visible')!='false']
        if len(values)==1: pairs.append((node,values[0]))
    require(len(pairs)==1,'Need one actual label/value pair in its own observed portfolio section')
    for node in pairs[0]: require(visible(node),'Portfolio label/value is clipped')
    return True

def observe_datum(label,expected,section):
    ui.scroll_top()
    for _ in range(20):
        root=ui.dump()
        try:
            datum_value(root,label,expected,section); return root
        except AssertionError: ui.scroll_step(True,root)
    raise AssertionError('No uniquely observed portfolio datum in required section')

def remove_qa_position():
    global created
    require(QA_NAME.startswith('QA_APK23_CLOUD_'),'Deletion target is not the fixture')
    click('Perfil'); click('Movimientos de '+QA_NAME); click('Eliminar inversión · '+QA_NAME)
    root=ui.wait_ui('Eliminar inversión',QA_NAME,timeout=12)
    nodes=[n for n in root.iter('node') if n.get('class')=='android.widget.Button' and n.get('text','').casefold()=='eliminar' and n.get('visible')!='false']
    require(len(nodes)==1 and visible(nodes[0]),'Unique QA-only Android deletion confirmation required')
    b=bounds(nodes[0]); ui.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
    ui.wait_ui('Inversión eliminada.',timeout=20)
    reopen(); ui.wait_ui('Perfil',timeout=30); click('Perfil'); root=locate('Registrar inversión')
    require(QA_NAME not in ui.visible_text(root),'Own cloud QA fixture still present after reload')
    created=False; report['qaPortfolioRemoved']=True; persist(); capture('141-qa-cloud-cleaned')

def portfolio():
    global created
    click('Perfil'); root=locate('Registro manual de tu cuenta, compartido con la web.',starts=True)
    require('Registro manual de tu cuenta, compartido con la web.' in ui.visible_text(root),'Cloud portfolio contract must be visible')
    locate('Sin compras'); click('Registrar inversión')
    field('Nombre de la inversión',QA_NAME); click('EUR')
    field('Cantidad de unidades','2'); field('Precio pagado por unidad','1'); field('Comisión (0 si no hubo)','0')
    # Mark intent before submit so finally also attempts cleanup after an ambiguous network result.
    created=True; click('Guardar movimiento'); locate('Movimiento guardado.'); capture('141-cloud-purchase')
    click('Actualizar precio · '+QA_NAME); field('Precio actual por unidad','1.1'); click('Guardar precio'); locate('Precio y fecha guardados.')
    click('Añadir movimiento · '+QA_NAME); click('Cobro'); field('Importe cobrado','0.1'); click('Guardar movimiento'); locate('Movimiento guardado.')
    reopen(); ui.wait_ui('Perfil',timeout=35); exact_qa_account(); locate(QA_NAME)
    complete('cloudPortfolioSurvivesColdReload',{'qaName':QA_NAME,'observation':'native row after cold restart and source-backed cloud read','independentRemoteQuery':False})
    for section, expected in (('Tu resumen',[('Invertido','2,00 EUR'),('Valor registrado','2,20 EUR'),('Cobrado','0,10 EUR'),('Resultado','0,30 EUR')]),
                              (QA_NAME,[('Aportado','2,00 EUR'),('Valor actual','2,20 EUR'),('Cobrado','0,10 EUR'),('Resultado','0,30 EUR'),('Resultado sin anualizar','15,00 %')])):
        for i,(label,value) in enumerate(expected):
            root=observe_datum(label,value,section)
            ui.screen('141-'+('summary' if section=='Tu resumen' else 'position')+'-'+str(i),root)
    complete('manualPurchaseValuationIncomeResult',{'units':2,'unitPrice':1,'valuationUnitPrice':1.1,'received':0.1,'invested':2,'value':2.2,'result':0.3,'percent':15,'currency':'EUR'})
    remove_qa_position()

def detail_font():
    ui.adb('shell','settings','put','system','font_scale','1.5')
    try:
        reopen(); ui.wait_ui('Buscar',timeout=30); click('Buscar')
        root=ui.dump()
        for _ in range(18):
            cards=[n for n in root.iter('node') if n.get('clickable')=='true' and n.get('content-desc','').startswith('') and n.get('content-desc','').find('Mínimo (EUR):')>=0 and visible(n)]
            if cards:break
            ui.scroll_step(True,root);root=ui.dump()
        require(bool(cards),'A real offer card with three documented facts must be visible')
        label=cards[0].get('content-desc'); require(all(t in label for t in ('Mínimo (EUR):','España:','Salida:')),'Offer card three facts absent')
        ui.screen('141-offer-card-three-facts-font15',root)
        b=bounds(cards[0]);ui.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
        root=ui.wait_ui('Ficha de la oferta',timeout=15)
        closes=[n for n in root.iter('node') if n.get('clickable')=='true' and n.get('content-desc','').startswith('Cerrar ') and visible(n)]
        require(len(closes)==1,'Offer X must remain fully visible at font1.5')
        ui.screen('141-detail-font15-visible-x',root)
        b=bounds(closes[0]);ui.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2));ui.wait_ui('Buscar',timeout=15)
        complete('font15OfferThreeFactsAndVisibleClose')
    finally: ui.adb('shell','settings','put','system','font_scale','1.0')

def main():
    c=load_candidate(); require(os.environ.get('QA_ACCOUNT_ACK')=='CONFIRMED_TEST_ACCOUNT','Dedicated QA acknowledgement required')
    require_qa_identity(os.environ,require_email=True)
    require(os.environ.get('RWADAR_QA_EMAIL') and os.environ.get('RWADAR_QA_PASSWORD'),'QA env credentials required')
    verify_auth_qa_identity()
    require(ui.adb('shell','getprop','ro.kernel.qemu').strip()=='1','Disposable emulator only')
    report['status']='running'; persist(); ui.start_snapshot_bridge(); launch(); login_confirmed(); exact_qa_account()
    complete('baseline22ConfirmedAccountLogin')
    ui.adb('shell','am','force-stop',ui.APP_PACKAGE)
    ui.adb('install','--no-streaming','-r','rwadar.apk',timeout=90)  # Never uninstall/clear before this update.
    installed=ui.adb('shell','dumpsys','package',ui.APP_PACKAGE)
    require(re.search(r'\bversionCode=23\b',installed) and re.search(r'\bversionName=1\.4\.1\b',installed),'Actual replacement package must be23/1.4.1')
    complete('apk22ReplacedBy23WithoutUninstall',{'package':c['package'],'sameSigningCertificate':True,'dataNotClearedBeforeUpdate':True})
    ui.adb('shell','cmd','connectivity','airplane-mode','enable')
    ui.adb('shell','svc','wifi','disable');ui.adb('shell','svc','data','disable')
    offline=ui.adb('shell','dumpsys','connectivity')
    require(re.search(r'Active default network:\s*(?:none|null)\b',offline,re.I),'Observe no default Android network before claiming offline')
    launch();end=time.monotonic()+25
    while time.monotonic()<end:
        root=ui.dump(timeout=8);text=ui.visible_text(root)
        if authenticated_ui(root) or 'Reintentar sesión guardada' in text:break
        time.sleep(.5)
    require(authenticated_ui(root) or 'Reintentar sesión guardada' in text,'Offline embedded launch must retain account state or its explicit retry')
    require('Entra en tu cuenta' not in text,'Offline launch unexpectedly lost the saved session')
    capture('141-offline-embedded-session-retained'); complete('offlineEmbeddedStartsWithoutLogout',{'observedNativeUI':True,'otaDeliveryObserved':False})
    ui.adb('shell','cmd','connectivity','airplane-mode','disable')
    ui.adb('shell','svc','wifi','enable');ui.adb('shell','svc','data','enable')
    if 'Reintentar sesión guardada' in text:click('Reintentar sesión guardada')
    ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=40); exact_qa_account()
    for tab in ('Buscar','Academy','Perfil'):
        click(tab); require(authenticated_ui(ui.dump()),'Navigation must preserve authenticated tabs'); capture('141-nav-'+tab.lower())
    ui.adb('shell','input','keyevent','KEYCODE_HOME');launch();ui.wait_ui('Perfil',timeout=25);exact_qa_account()
    reopen();ui.wait_ui('Perfil',timeout=35);exact_qa_account();complete('navigationForegroundAndColdLaunchPreserveSameAccount')
    portfolio();detail_font();click('Perfil');click('Cerrar sesión');ui.wait_ui('Entra en tu cuenta',timeout=25)
    reopen();root=ui.wait_ui('Entra en tu cuenta',timeout=25)
    require(not authenticated_ui(root) and QA_NAME not in ui.visible_text(root),'Logout/relaunch must deny personal access')
    ui.CAPTURE_ALLOWED=True;capture('141-logout-relaunch-denied');complete('logoutRelaunchDeniesPersonalAccess')
    report['status']='passed-directed-technical-qa';persist()

def deadline(*_): raise ui.QaDeadlineExceeded('Directed QA deadline')

if __name__=='__main__':
    signal.signal(signal.SIGALRM,deadline);signal.alarm(540)
    try: main()
    except BaseException as error:
        report['status']='failed';report['errorClass']=type(error).__name__;persist();ui.capture_failure('141-failure')
    finally:
        signal.alarm(60)  # Bounded best-effort own-row cleanup even after the main deadline.
        try:
            ui.adb('shell','cmd','connectivity','airplane-mode','disable')
            ui.adb('shell','svc','wifi','enable');ui.adb('shell','svc','data','enable')
            if created: remove_qa_position()
        except BaseException as error:
            report['cleanupErrorClass']=type(error).__name__;report['qaPortfolioRemoved']=False;persist()
        try:ui.stop_snapshot_bridge()
        except BaseException:pass
        signal.alarm(0)
        persist()
    if report['status']!='passed-directed-technical-qa' or not report['qaPortfolioRemoved']:sys.exit(1)
