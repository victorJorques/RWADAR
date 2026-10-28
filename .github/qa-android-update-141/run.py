"""Directed new-APK observations; all mutation is an acknowledged QA-only portfolio.

Old PIN/tutorial/catalog scopes remain historical. Credentials never enter evidence.
"""
import ast, json, os, pathlib, re, shlex, signal, sys, time, xml.etree.ElementTree as ET
import urllib.request
from reuse import load_reused_native_evidence, validate_package
import ota
from gate import ROOT, OLD, load_candidate, require_qa_identity, validate_auth_qa_user
sys.path.insert(0,str(OLD))
import native_ui_140 as ui
OUT = pathlib.Path('evidence-private')
QA_NAME = 'QA_APK23_CLOUD_' + os.environ.get('GITHUB_RUN_ID','LOCAL_TEST')
report = {'schemaVersion':1,'scope':'apk23-portfolio-ota-detail-logout-continuation','status':'not-started','checks':{},
          'releaseApproved':False,'full20PointQA':False,'visualReviewCompleted':False,
          'qaPortfolioRemoved':False,'otaPublished':False,'otaDeliveryObserved':False,
          'repeatedHistoricalScopes':[]}
created = False

def persist():
    OUT.mkdir(exist_ok=True)
    (OUT/'android-update-141-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')

def complete(name, value=True):
    report['checks'][name] = value; persist()

def phase(name):
    require(re.fullmatch(r'[a-z0-9-]{1,64}',name),'Static harness phase required')
    report['phase']=name;persist();print('RWADAR_DIRECTED_PHASE '+name,flush=True)

def error_location(error):
    allowed={'run.py','ota.py','gate.py','reuse.py','native_ui_140.py','android-authenticated-140.py'}
    result=[];frame=error.__traceback__
    while frame:
        filename=pathlib.Path(frame.tb_frame.f_code.co_filename).name
        if filename in allowed:result.append({'filename':filename,'line':frame.tb_lineno})
        frame=frame.tb_next
    return result[-12:]

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

def production_bff_same_fixture():
    from decimal import Decimal
    require_qa_identity(os.environ,require_email=True)
    origin='https://rwadar.pages.dev'; cookie=''; uid=os.environ['QA_USER_ID']
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs): return None
    opener=urllib.request.build_opener(NoRedirect())
    def web(route,method='GET',data=None):
        require((route,method) in (('entrar','POST'),('sesion','GET'),('cartera','GET'),('salir','POST')),'Fixed QA BFF routes only')
        headers={'Origin':origin,'Content-Type':'application/json','X-RWAdar-Usuario':uid,**({'Cookie':cookie} if cookie else {})}
        req=urllib.request.Request(origin+'/api/acceso/'+route,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
        try:
            with opener.open(req,timeout=10) as r:
                require(r.status==200,'QA BFF request rejected'); raw=r.read(128*1024+1)
                require(len(raw)<=128*1024,'QA BFF response exceeds cap')
                return json.loads(raw),r.headers
        except Exception: raise RuntimeError('QA BFF request failed; sensitive response withheld') from None
    try:
        login,headers=web('entrar','POST',{'correo':os.environ['RWADAR_QA_EMAIL'],'clave':os.environ['RWADAR_QA_PASSWORD']})
        cookies=headers.get_all('Set-Cookie') or []; require(len(cookies)==1,'One QA host cookie required')
        match=re.fullmatch(r'(__Host-rwadar-acceso=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+); Path=/; HttpOnly; Secure; SameSite=Lax',cookies[0])
        require(match,'QA host cookie invalid'); cookie=match.group(1)
        session,_=web('sesion'); require(all(d.get('autenticada') is True and d.get('usuario',{}).get('id')==uid for d in (login,session)),'QA BFF identity mismatch')
        doc,_=web('cartera'); require(type(doc.get('version')) is int and doc['version']>0 and len(doc.get('posiciones',[]))==1,'One saved QA fixture required')
        p=doc['posiciones'][0]; require(p.get('nombre')==QA_NAME and p.get('moneda')=='EUR','QA fixture identity mismatch')
        require(p.get('valoracion',{}).get('origen')=='manual' and Decimal(p['valoracion']['precio'])==Decimal('1.1'),'QA manual valuation mismatch')
        moves=p.get('movimientos',[]); require(len(moves)==2 and {m.get('tipo') for m in moves}=={'compra','cobro'},'QA movements mismatch')
        buy=next(m for m in moves if m['tipo']=='compra'); income=next(m for m in moves if m['tipo']=='cobro')
        require((Decimal(buy['cantidad']),Decimal(buy['precio']),Decimal(buy['comision']),Decimal(income['importe']))==(Decimal('2'),Decimal('1'),Decimal('0'),Decimal('0.1')),'QA purchase or income mismatch')
    finally:
        if cookie:
            closed,_=web('salir','POST',{}); cookie=''
            require(closed.get('cerrado') is True and closed.get('cierreRemoto') is True,'QA web local logout not confirmed')
    return {'productionBffObserved':True,'sameExpectedAccount':True,'sameUniqueName':True,'sameCurrency':True,'samePurchase':True,'sameManualPrice':True,'sameIncome':True,'webLocalLogoutConfirmed':True}

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
        matches[:] = [sum(1 for n in tree.iter('node') if n.get('package')==ui.APP_PACKAGE and n.get('text')==os.environ['RWADAR_QA_EMAIL'] and n.get('visible')!='false' and visible(n))]
    try:
        ui.CAPTURE_ALLOWED=False; ui.inspect_login_input_values=inspect
        # Cuenta is below MisInversiones. Never search the sanitized tree for
        # its redacted email, and never persist a raw account snapshot.
        ui.scroll_top()
        for _ in range(20):
            matches.clear(); root=ui.dump()
            require(matches in ([0],[1]),'QA account is not uniquely observed')
            if matches==[1]: break
            _,moved=ui.scroll_step(True,root)
            if not moved: break
        require(matches==[1],'Visible account must be exactly the dedicated QA account')
    finally:
        ui.inspect_login_input_values=old; ui.CAPTURE_ALLOWED=allowed
    ui.scroll_top()

def wait_offline_default_network():
    end=time.monotonic()+10
    while True:
        offline=ui.adb('shell','dumpsys','connectivity')
        if re.search(r'Active default network:\s*(?:none|null)\b',offline,re.I): return
        require(time.monotonic()<end,'Observe no default Android network before claiming offline')
        time.sleep(.5)

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

def wait_mutation_confirmation(message,timeout=25,phase_name=None):
    # Mutation messages live above the form/list, not at the current scroll.
    ui.scroll_top()
    failed=False
    try:root=ui.wait_ui(message,timeout=timeout)
    except AssertionError:
        failed=True;root=ui.dump(timeout=8)
    prefix='No se pudo confirmar el guardado.'
    errors=[n for n in root.iter('node') if n.get('text','').startswith(prefix)]
    observation={'successVisible':message in ui.visible_text(root),
      'saveErrorPresent':bool(errors),'saveErrorVisible':any(n.get('visible')!='false' for n in errors)}
    current=phase_name or report.get('phase','unknown')
    require(re.fullmatch(r'[a-z0-9-]{1,64}',current),'Static mutation phase required')
    report.setdefault('mutationObservations',{})[current]=observation;persist()
    if failed or errors or not observation['successVisible']:
        report['mutationFailureCode']='portfolio-save-rejected' if errors else 'mutation-confirmation-not-observed';persist()
        raise AssertionError('Portfolio mutation confirmation failed; see static phase diagnosis')
    return root

def qa_fixture_absent(root):
    return not any(QA_NAME in n.get('text','') or QA_NAME in n.get('content-desc','') for n in root.iter('node'))

def remove_qa_position():
    global created
    require(QA_NAME.startswith('QA_APK23_CLOUD_'),'Deletion target is not the fixture')
    # A successful RPC with a lost response may leave the old form on screen.
    # Reload the cloud document before locating this run's sole deletion target.
    reopen(); ui.wait_ui('Perfil',timeout=30); exact_qa_account()
    click('Perfil');ui.scroll_top()
    loaded=ui.wait_ui('Tu resumen',timeout=30,absent=('Cargando mis inversiones',))
    if 'Sin compras' in ui.visible_text(loaded) and qa_fixture_absent(loaded):
        created=False;report['qaPortfolioRemoved']=True;report['qaFixtureAlreadyAbsentAfterReload']=True;persist();return
    click('Movimientos de '+QA_NAME); click('Eliminar inversión · '+QA_NAME)
    root=ui.wait_ui('Eliminar inversión',QA_NAME,timeout=12)
    nodes=[n for n in root.iter('node') if n.get('class')=='android.widget.Button' and n.get('text','').casefold()=='eliminar' and n.get('visible')!='false']
    require(len(nodes)==1 and visible(nodes[0]),'Unique QA-only Android deletion confirmation required')
    b=bounds(nodes[0]); ui.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
    wait_mutation_confirmation('Inversión eliminada.',timeout=20,phase_name='cleanup-confirm-deletion')
    reopen(); ui.wait_ui('Perfil',timeout=30); click('Perfil');root=wait_empty_portfolio_ready()
    require(qa_fixture_absent(root),'Own cloud QA fixture still present after reload')
    created=False; report['qaPortfolioRemoved']=True; persist(); capture('141-qa-cloud-cleaned')

def wait_empty_portfolio_ready(timeout=30):
    """Observe completed cloud loading before searching/pressing the form control."""
    end=time.monotonic()+timeout
    ui.scroll_top()
    while time.monotonic()<end:
        root=ui.dump(timeout=min(8,max(.1,end-time.monotonic())))
        text=ui.visible_text(root)
        require('No se pudieron leer tus inversiones.' not in text,'Cloud portfolio reported a real loading error')
        require('Entra en tu cuenta' not in text,'Cloud portfolio lost its authenticated account')
        if 'Cargando mis inversiones' not in text and 'Tu resumen' in text and 'Sin compras' in text:
            # Only after the summary exists may scrolling seek the control.
            root=locate('Registrar inversión')
            button,_=ui.find_node(root,'Registrar inversión')
            if button.get('enabled')!='false': return root
        time.sleep(.5)
    raise AssertionError('Cloud portfolio did not become empty and ready within the bounded wait')


def portfolio():
    global created
    click('Perfil'); root=locate('Registro manual de tu cuenta, compartido con la web.',starts=True)
    require('Registro manual de tu cuenta, compartido con la web.' in ui.visible_text(root),'Cloud portfolio contract must be visible')
    phase('wait-cloud-portfolio-ready');wait_empty_portfolio_ready()
    phase('register-qa-purchase');click('Registrar inversión')
    field('Nombre de la inversión',QA_NAME); click('EUR')
    field('Cantidad de unidades','2'); field('Precio pagado por unidad','1'); field('Comisión (0 si no hubo)','0')
    # Mark intent before submit so finally also attempts cleanup after an ambiguous network result.
    created=True; click('Guardar movimiento'); wait_mutation_confirmation('Movimiento guardado.'); capture('141-cloud-purchase')
    phase('record-manual-price');click('Actualizar precio · '+QA_NAME); field('Precio actual por unidad','1.1'); click('Guardar precio'); wait_mutation_confirmation('Precio y fecha guardados.')
    phase('record-qa-income');click('Añadir movimiento · '+QA_NAME); click('Cobro'); field('Importe cobrado','0.1'); click('Guardar movimiento'); wait_mutation_confirmation('Movimiento guardado.')
    phase('production-bff-same-fixture');web_proof=production_bff_same_fixture()
    phase('observe-real-ota-cold-launch');ota_proof=ota.prove_cold_launch(ui,OTA,reopen,exact_qa_account)
    locate(QA_NAME)  # Same single cloud fixture must survive the successful OTA launch.
    complete('productionBffReadsSameNativeFixture',{**web_proof,'nativeSessionAndFixturePreservedAfterWebLogout':True})
    report['otaDeliveryObserved']=True;ota_proof['sameQaPortfolioSurvives']=True
    complete('actualOtaDownloadedAndColdLaunched',ota_proof)
    complete('cloudPortfolioSurvivesColdReload',{'qaName':QA_NAME,'observation':'native row after cold restart and source-backed cloud read','independentRemoteQuery':False})
    phase('observe-portfolio-labels-and-values')
    for section, expected in (('Tu resumen',[('Invertido','2,00 EUR'),('Valor registrado','2,20 EUR'),('Cobrado','0,10 EUR'),('Resultado','0,30 EUR')]),
                              (QA_NAME,[('Aportado','2,00 EUR'),('Valor actual','2,20 EUR'),('Cobrado','0,10 EUR'),('Resultado','0,30 EUR'),('Resultado sin anualizar','15,00 %')])):
        for i,(label,value) in enumerate(expected):
            root=observe_datum(label,value,section)
            ui.screen('141-'+('summary' if section=='Tu resumen' else 'position')+'-'+str(i),root)
    complete('manualPurchaseValuationIncomeResult',{'units':2,'unitPrice':1,'valuationUnitPrice':1.1,'received':0.1,'invested':2,'value':2.2,'result':0.3,'percent':15,'currency':'EUR'})
    phase('remove-own-qa-fixture');remove_qa_position()

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
    global OTA
    phase('candidate-and-history-gates')
    c=load_candidate();OTA=ota.load_ota(c)  # Includes exact mobile-tree compatibility before account access.
    report['reusedNativeEvidence']=load_reused_native_evidence(c);persist()
    require(os.environ.get('QA_ACCOUNT_ACK')=='CONFIRMED_TEST_ACCOUNT','Dedicated QA acknowledgement required')
    require_qa_identity(os.environ,require_email=True)
    require(os.environ.get('RWADAR_QA_EMAIL') and os.environ.get('RWADAR_QA_PASSWORD'),'QA env credentials required')
    phase('verify-existing-qa-auth');verify_auth_qa_identity()
    phase('prepare-disposable-adbd');ota.prepare_device(ui)
    report['status']='running';persist()
    phase('install-candidate23-before-login')
    ui.adb('shell','am','force-stop',ui.APP_PACKAGE)
    ui.adb('install','--no-streaming','-r','rwadar.apk',timeout=90)
    phase('verify-current-package23')
    installed=ui.adb('shell','dumpsys','package',ui.APP_PACKAGE)
    require(re.search(r'\bversionCode=23\b',installed) and re.search(r'\bversionName=1\.4\.1\b',installed),'Actual continuation package must be23/1.4.1')
    actual=validate_package(c,json.loads((OUT/'candidate-141-package.json').read_text(encoding='utf-8')))
    complete('candidate23PackageAndSourceVerified',{'versionCode':23,'version':'1.4.1','sourceHeadSha':c['sourceHeadSha'],'apkSha256':c['apkSha256'],'actualNativeIdentityVerified':actual['actualNativeIdentityVerified']})
    phase('observe-ota-absence-before-first-candidate-launch')
    require(ota.read_stopped_db(ui,OTA,allow_initial_missing=True) is None,'The expected OTA must be absent before the first candidate launch')
    complete('otaAbsentBeforeFirstCandidateLaunch',True)
    phase('start-private-snapshot-bridge');ui.start_snapshot_bridge()
    phase('login-candidate23');launch();login_confirmed()
    phase('verify-visible-qa-account');exact_qa_account();complete('candidate23ConfirmedAccountLogin')
    phase('cloud-portfolio');portfolio()
    phase('large-font-detail');detail_font()
    phase('explicit-logout');click('Perfil');click('Cerrar sesión');ui.wait_ui('Entra en tu cuenta',timeout=25)
    phase('cold-relaunch-after-logout');reopen();root=ui.wait_ui('Entra en tu cuenta',timeout=25)
    require(not authenticated_ui(root) and QA_NAME not in ui.visible_text(root),'Logout/relaunch must deny personal access')
    ui.CAPTURE_ALLOWED=True;capture('141-logout-relaunch-denied');complete('logoutRelaunchDeniesPersonalAccess')
    phase('continuation-completed');report['status']='passed-directed-technical-qa';persist()


def deadline(*_): raise ui.QaDeadlineExceeded('Directed QA deadline')

if __name__=='__main__':
    signal.signal(signal.SIGALRM,deadline);signal.alarm(540)
    try: main()
    except BaseException as error:
        report['status']='failed';report['errorClass']=type(error).__name__;report['errorLocation']=error_location(error);persist()
        try:ui.capture_failure('141-failure')
        except BaseException:pass
    finally:
        signal.alarm(60)  # Bounded best-effort own-row cleanup even after the main deadline.
        try:
            ui.adb('shell','cmd','connectivity','airplane-mode','disable')
            ui.adb('shell','svc','wifi','enable');ui.adb('shell','svc','data','enable')
            if created: remove_qa_position()
        except BaseException as error:
            report['cleanupErrorClass']=type(error).__name__;report['cleanupErrorLocation']=error_location(error);report['qaPortfolioRemoved']=False;persist()
        try:ui.stop_snapshot_bridge()
        except BaseException:pass
        signal.alarm(0)
        persist()
    if report['status']!='passed-directed-technical-qa' or not report['qaPortfolioRemoved']:sys.exit(1)
