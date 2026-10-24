"""Private, scoped APK19 UI QA. No account creation, email, SQL or release."""
import hashlib, json, os, pathlib, re, shlex, signal, sys, time
import native_ui_140 as ui
import native_catalog_checks_140 as catalog

ROOT = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path('evidence-private')
OUT.mkdir(exist_ok=True)
SHA = 'f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624'
SOURCE = '1ecf7e7aa8941400d6ad954680cd6deb89107c42'
TITLE = 'Vivienda Â· Pottendorfer StraÃŸe 62, Wr. Neustadt'
QA_NAME = 'QA_APK19_LOCAL_' + os.environ.get('GITHUB_RUN_ID', 'PREPARATION_ONLY')
report = {'scope':'private-confirmed-account-ui-only', 'status':'not-started',
          'apkSha256':SHA, 'apkBytes':88961445, 'version':'1.4.0', 'versionCode':19,
          'sourceHeadSha':SOURCE, 'checks':{}, 'full20PointQA':False,
          'releaseApproved':False, 'visualReviewCompleted':False,
          'noPostsNoPaymentsNoEmailsNoSQL':True, 'localQADataRemoved':False}


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
    root = locate(label)
    nodes = [n for n in root.iter('node') if n.get('class') == 'android.widget.EditText'
             and n.get('content-desc') == label and n.get('visible') != 'false']
    require(len(nodes) == 1, 'Need one observed native field')
    if secret:
        require(nodes[0].get('password') == 'true', 'Password field must be masked')
    click(label)
    # The wrapper suppresses subprocess args/stdout/stderr in every error path.
    # shlex.quote prevents Android's shell from interpreting credential characters.
    ui.adb('shell','input','keycombination','113','29')
    ui.adb('shell','input','keyevent','KEYCODE_DEL')
    ui.adb('shell','input','text',shlex.quote(value.replace(' ','%s')))
    ime=ui.adb('shell','dumpsys','input_method')
    if re.search(r'\b(?:mInputShown|mIsInputViewShown|isInputViewShown)=true\b',ime):
        ui.adb('shell','input','keyevent','KEYCODE_BACK')
    time.sleep(.15)


def capture(name):
    ui.screen(name, ui.dump())


def authenticated_ui(root, language='es'):
    labels=('Home','Search','Academy','Profile') if language=='en' else ('Inicio','Buscar','Academy','Perfil')
    values={value for n in root.iter('node') if n.get('visible')!='false'
            for value in (n.get('text',''),n.get('content-desc',''))}
    return all(label in values for label in labels)


def login_confirmed(language='es'):
    # Resizes/restarts can race an already completed admission. Four authenticated
    # tabs are success; never search for another Entrar button on Home/Launcher.
    ui.CAPTURE_ALLOWED=False
    english=language=='en'
    root=ui.dump()
    if not authenticated_ui(root,language):
        ui.wait_ui('Sign in to your account' if english else 'Entra en tu cuenta',timeout=30)
        field('Email' if english else 'Correo',os.environ['RWADAR_QA_EMAIL'])
        field('Password' if english else 'ContraseÃ±a',os.environ['RWADAR_QA_PASSWORD'],secret=True)
        root=ui.dump()
        if not authenticated_ui(root,language):
            label='Sign in' if english else 'Entrar'
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
                    ui.tap_observed(root,label)
            else:
                ui.tap_observed(root,label)
        ui.wait_ui(*(('Home','Search','Academy','Profile') if english else ('Inicio','Buscar','Academy','Perfil')),timeout=40)
    ui.CAPTURE_ALLOWED=True
    report['checks']['confirmedAccountLogin']=True

def check_visible_box(root, label, starts=False):
    _,b = ui.find_node(root,label,starts)
    w,h = ui.display_size()
    require(0 <= b[0] < b[2] <= w and 0 <= b[1] < b[3] <= h,
            'Observed native element has zero height or lies outside display')
    return b


def catalog_and_detail():
    click('Buscar')
    ui.wait_ui('49 en el catÃ¡logo',timeout=40)
    for label in ('Mostrar principales 24','Mostrar reventa 21','Mostrar prÃ³ximas 4'):
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
    field('Buscar ofertas por nombre, proveedor, paÃ­s o mÃ©trica','Pottendorfer')
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
    locate('Ver en la fuente Â·',True)
    capture('04-detail-source-reachable')
    click('Cerrar ' + TITLE)
    ui.wait_ui('49 en el catÃ¡logo',timeout=15)
    click('Ver ficha de ' + TITLE,True)
    ui.wait_ui('Cerrar ' + TITLE,timeout=15)
    ui.adb('shell','input','keyevent','KEYCODE_BACK')
    root = ui.wait_ui('49 en el catÃ¡logo',timeout=15)
    require('Cerrar ' + TITLE not in ui.visible_text(root), 'Android Back did not close detail')
    report['checks']['catalog49AndList'] = {'total':49,'main':24,'resale':21,'upcoming':4,
                                            'resultCardBounds':row_bounds,'nativeListNonzero':True}
    report['checks']['detailFont15CloseAndBack'] = {'fontScale':'1.5','close':True,
                                                  'androidBack':True,'sourceReachableNotOpened':True}


def tutorial():
    click('Academy')
    click('LecciÃ³n 1:',True)
    ui.wait_ui('LecciÃ³n 1 de','Volver a las lecciones',timeout=20)
    capture('18-academy-real-lesson')
    click('Volver a las lecciones')
    ui.wait_ui('Empezar tutorial 3D',timeout=20)
    report['checks']['academyLesson']=True
    click('Empezar tutorial 3D')
    root = ui.wait_ui('Paso 1 de 4',timeout=35)
    require(any(n.get('class') == 'android.webkit.WebView' for n in root.iter('node')),
            'Expected the real authenticated web tutorial; native fallback is not certified')
    steps = []
    for step in range(1,5):
        root = ui.wait_ui('Paso ' + str(step) + ' de 4',timeout=15)
        capture('05-tutorial-step-' + str(step))
        steps.append(step)
        # No automatic timers or JS injection: each transition is a real UI press.
        if step < 4:
            click('Siguiente â†’')
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
    click('Registrar inversiÃ³n')
    field('Nombre de la inversiÃ³n',QA_NAME)
    click('EUR')
    field('Cantidad de unidades','2')
    field('Precio pagado por unidad','50')
    field('ComisiÃ³n (0 si no hubo)','0')
    click('Guardar movimiento')
    ui.wait_ui('Movimiento guardado.',timeout=15)
    report['checks']['localPurchase'] = {'name':QA_NAME,'units':2,'unitPrice':50,'commission':0,'currency':'EUR'}
    click('Actualizar precio Â· ' + QA_NAME)
    field('Precio actual por unidad','60')
    click('Guardar precio')
    ui.wait_ui('Precio y fecha guardados.',timeout=15)
    click('AÃ±adir movimiento Â· ' + QA_NAME)
    click('Cobro')
    field('Importe cobrado','5')
    click('Guardar movimiento')
    ui.wait_ui('Movimiento guardado.',timeout=15)
    for label,expected in (('Aportado','100,00 EUR'),('Valor actual','120,00 EUR'),
                           ('Cobrado','5,00 EUR'),('Costes registrados','0,00 EUR'),
                           ('Resultado','25,00 EUR'),('Resultado sin anualizar','25,00 %')):
        money(label,expected)
        capture('07-portfolio-' + re.sub(r'[^a-z]+','-',label.lower()).strip('-'))
    report['checks']['localValuationPaymentAndCalculation'] = {'contributed':100,'value':120,
        'received':5,'costs':0,'result':25,'nonAnnualizedPercent':25,'currency':'EUR'}
    click('Movimientos de ' + QA_NAME)
    click('Eliminar inversiÃ³n Â· ' + QA_NAME)
    root = ui.wait_ui('Eliminar inversiÃ³n',QA_NAME,timeout=10)
    # This exact QA-only name is the sole destructive target, on the disposable device.
    require(QA_NAME.startswith('QA_APK19_LOCAL_'), 'Local deletion target is not QA')
    # Android can render native Alert labels in capitals. Match only its exact
    # destructive label after the dialog above has named our own QA record.
    candidates = [n for n in root.iter('node') if n.get('class') == 'android.widget.Button'
                  and n.get('text','').casefold() == 'eliminar' and n.get('visible') != 'false']
    require(len(candidates) == 1, 'Need one native QA deletion confirmation button')
    b = list(map(int,re.findall(r'-?\d+',candidates[0].get('bounds',''))))
    require(len(b) == 4 and b[0] < b[2] and b[1] < b[3], 'Invalid native QA deletion button')
    ui.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
    root = ui.wait_ui('InversiÃ³n eliminada.',timeout=15)
    require(QA_NAME not in ui.visible_text(root), 'QA investment still visible after deletion')
    report['localQADataRemoved'] = True
    capture('08-local-qa-deleted')


def sign_out():
    click('Cerrar sesiÃ³n')
    root = ui.wait_ui('Tu radar, con tu cuenta','Entra en tu cuenta',timeout=25)
    blocked = ('Inicio','Buscar','Academy','Perfil','Mis inversiones','49 en el catÃ¡logo')
    require(not any(value in ui.visible_text(root).splitlines() for value in blocked),
            'Catalog or local portfolio remains available after sign out')
    ui.adb('shell','input','keyevent','KEYCODE_BACK')
    ui.adb('shell','am','start','-W','-n','com.rwadar.app/.MainActivity')
    root = ui.wait_ui('Entra en tu cuenta',timeout=15)
    require('49 en el catÃ¡logo' not in ui.visible_text(root), 'Back/reopen bypassed access after sign out')
    capture('09-signed-out-blocked')
    report['checks']['signOutBlocksCatalogAndLocalPortfolio'] = True


def main():
    require(os.environ.get('GITHUB_REPOSITORY') == 'victorJorques/RWADAR','Private repository required')
    require(os.environ.get('QA_ACCOUNT_ACK') == 'CONFIRMED_TEST_ACCOUNT','Confirmed disposable test account acknowledgement required')
    require(os.environ.get('GITHUB_EVENT_NAME') == 'workflow_dispatch','Manual dispatch required')
    apk = pathlib.Path('rwadar.apk')
    require(apk.stat().st_size == 88961445 and hashlib.file_digest(apk.open('rb'),'sha256').hexdigest() == SHA,
            'Exact APK19 identity mismatch')
    baseline = json.loads(ROOT.joinpath('baseline-c19-guest.json').read_text())
    require(baseline['apkSha256'] == SHA and baseline['versionCode'] == 19,'Baseline is not APK19')
    report['reusedBaseline'] = {'runId':40023081613,'jobId':120652334625,
        'reportSha256':'842b1960939bb78ee297c00478f676d8657385a5bc6f0265d2397e619738ca59',
        'checks':['photos49','packageIdentity','standard'],'historicalStatus':'failed'}
    continuation_bytes=ROOT.joinpath('baseline-c19-guest-continuation.json').read_bytes()
    require(hashlib.sha256(continuation_bytes).hexdigest()=='4aee7315d605006a9bc8da668c5b18dce7084f5ccc3adc61990b058951aef3c1',
            'Guest continuation report identity mismatch')
    continuation=json.loads(continuation_bytes)
    require(continuation['status']=='passed-scoped-only' and continuation['apkSha256']==SHA,
            'Guest continuation is not scoped passed on this APK19')
    report['reusedGuestContinuation']={'runId':40119180570,'workflowConclusion':'cancelled',
        'jobConclusion':'cancelled','reportStatus':'passed-scoped-only',
        'zipSha256':'217f5357a212beedb0e0a9f49006b1c3eda6905696e61936027e3591054959e8',
        'reportSha256':'4aee7315d605006a9bc8da668c5b18dce7084f5ccc3adc61990b058951aef3c1',
        'reusedChecks':['font15','rotationAttempt','noRuntimeException'],
        'scope':'Guest forms only; cancellation is preserved and is not a green workflow'}
    email = os.environ['RWADAR_QA_EMAIL']
    password = os.environ['RWADAR_QA_PASSWORD']
    require(re.fullmatch(r'[A-Za-z0-9_.+\-]+@[A-Za-z0-9.\-]+',email) is not None,
            'QA email must use the supported ASCII input alphabet')
    require(re.fullmatch(r'[A-Za-z0-9_\-]{20,120}',password) is not None,
            'QA password must use the supported 20+ character ASCII input alphabet')
    ui.adb('logcat','-c')
    catalog.RADAR_RESTORE={'density':ui.adb('shell','wm','density'),
                           'size':ui.adb('shell','wm','size'),
                           'font':ui.adb('shell','settings','get','system','font_scale').strip()}
    ui.adb('shell','wm','density','480')
    ui.adb('shell','wm','size','960x1920')
    ui.adb('shell','settings','put','system','font_scale','1.0')
    ui.adb('shell','am','start','-W','-n','com.rwadar.app/.MainActivity')
    email = password = None
    login_confirmed('es')
    report['status'] = 'running'
    catalog.REAUTHENTICATE=login_confirmed
    catalog.CLICK=click; catalog.FIELD=field; catalog.LOCATE=locate
    report['checks']['radar26Centers320dp']=catalog.radar_center_checks()
    ui.adb('shell','settings','put','system','font_scale','1.5')
    ui.adb('shell','wm','size','900x1600')
    catalog_and_detail()
    # Font1.5 guest/giro is already reused, and authenticated detail1.5 is now
    # complete. The remaining new criteria use the normal display; do not turn
    # their long headers into another font1.5 battery or repeat the guest run.
    ui.adb('shell','settings','put','system','font_scale','1.0')
    ui.adb('shell','wm','size','reset')
    if 'Entra en tu cuenta' in ui.visible_text(ui.dump()):
        login_confirmed('es')
    ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=20)
    report['checks']['providerGroups']=catalog.groups_pending()
    documentary=catalog.documentary_and_five_images()
    report['checks']['nativeCardDecisionFacts']=documentary['cards']
    report['checks']['fiveNativeImagesAndAlt']=True
    report['checks']['datesSeparated']=documentary['datesSeparated']
    report['checks']['historicalReferences']=documentary['historicalReferencesContextualized']
    report['checks']['fourRisksBeforeSingleCta']=documentary['riskAndCta']
    report['checks']['languagesAndFavoritePersistence']=catalog.languages_and_favorite()
    tutorial()
    portfolio()
    sign_out()
    errors = ui.sanitize(ui.adb('logcat','-d','-v','threadtime','AndroidRuntime:E','ReactNativeJS:E','*:S'))
    OUT.joinpath('runtime-errors-private.log').write_text(errors[-65536:],encoding='utf-8')
    require(not re.search(r'FATAL EXCEPTION|ReactNativeJS.*(?:TypeError|ReferenceError|Invariant Violation|Error:)',errors),
            'Android or JavaScript exception recorded')
    report['checks']['noRuntimeException'] = True
    report['status'] = 'passed-scoped-only'


def timeout_handler(*_):
    raise TimeoutError('Private scoped QA reached its bounded time limit')


def safe_exception_diagnostic(error):
    # Read code metadata only: never locals, argv, exception args or source text.
    result={'exceptionName':type(error).__name__,'frames':[]}
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
        signal.alarm(360)
        main()
        exit_code = 0
    except BaseException as error:
        # Never stringify CalledProcessError/TimeoutExpired: they contain argv.
        report['status'] = 'failed'
        report['failureType'] = type(error).__name__
        report['diagnostic'] = safe_exception_diagnostic(error)
        report['failure'] = ui.sanitize(str(error)) if isinstance(error,(AssertionError,TimeoutError)) else 'Details withheld to protect credentials'
        if 'undefinedName' in report['diagnostic']:
            report['failure']='Undefined static identifier: '+report['diagnostic']['undefinedName']
        if ui.CAPTURE_ALLOWED:
            ui.capture_failure('failure-authenticated-private')
    finally:
        signal.alarm(0)
        matrix = json.loads(ROOT.joinpath('matrix-20.json').read_text())
        for point in matrix['points']:
            required = point.get('newChecksRequired',[])
            if required and all(report['checks'].get(key) for key in required):
                point['newScopedObservation'] = 'passed'
        matrix['full20PointQA'] = False
        OUT.joinpath('matrix-20-result.json').write_text(json.dumps(matrix,indent=2,ensure_ascii=False),encoding='utf-8')
        OUT.joinpath('authenticated-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')
        # Machine summary contains no account identifiers, values or exception args.
        print(json.dumps({'status':report['status'],'full20PointQA':False,'releaseApproved':False,
                          'localQADataRemoved':report['localQADataRemoved']}))
    sys.exit(exit_code)
