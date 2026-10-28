"""Fresh current-APK scoped UI QA: persisted session, real Android PIN, pending tutorial/portfolio.
No signup, email, SQL, build, payment, OTA or release. Historical scopes never become new observations.
"""
import ast,base64,hashlib,json,os,pathlib,re,shlex,signal,sys,time,xml.etree.ElementTree as ET
import native_ui_140 as ui
from candidate_c21 import load_candidate
ROOT=pathlib.Path(__file__).resolve().parent
OUT=pathlib.Path('evidence-private');OUT.mkdir(exist_ok=True)
DEVICE_PIN='421963'  # Disposable emulator fixture only; never a user's secret.
SYSTEM_PACKAGES=frozenset(('com.android.settings','com.android.systemui','android'))
SWITCH='Desbloquear con la seguridad del móvil'
QA_NAME='QA_APK21_LOCAL_'+os.environ.get('GITHUB_RUN_ID','PREPARATION_ONLY')
report={'schemaVersion':1,'scope':'current-apk-session-system-credential-and-pending-flows','status':'not-started','phase':'not-started',
  'checks':{},'full20PointQA':False,'releaseApproved':False,'visualReviewCompleted':False,'localQADataRemoved':False,
  'noPostsNoPaymentsNoEmailsNoSQL':True,'biometricHardwareNotTested':True,
  'historicalScopes':{'apk20':['radar26','groups','detail-font15','five-images-and-documentary-facts','ES-EN57-fields','Academy-lesson'],
    'observationPerformedInThisRun':False,'historicalPackageIdentityReused':False,'automaticCandidateCompatibilityClaim':False}}
PHASES=frozenset(('initial-login','catalog-counts','persistent-session','device-lock','tutorial','portfolio','logout'))

# Reuse only the already reviewed UI-flow function definitions. Crucially, do not
# import/execute the old module's globals, candidate20 gate, baselines or main().
HELPERS=('require','locate','click','field','capture','authenticated_ui','require_login_inputs','login_confirmed',
  'check_visible_box','tutorial_content_ready','wait_tutorial_content','tutorial','money','portfolio',
  'safe_exception_diagnostic','emit_result_backup')
def load_flow_helpers():
    source=(ROOT/'android-authenticated-140.py').read_text(encoding='utf-8');tree=ast.parse(source)
    functions={node.name:node for node in tree.body if isinstance(node,ast.FunctionDef)}
    selected=[functions[name] for name in HELPERS]
    assert all(not node.decorator_list for node in selected)
    # The sole data-deletion guard is explicitly upgraded to the APK21 QA prefix.
    portfolio_node=functions['portfolio']
    for node in ast.walk(portfolio_node):
        if isinstance(node,ast.Constant) and node.value=='QA_APK20_LOCAL_':node.value='QA_APK21_LOCAL_'
    exec(compile(ast.fix_missing_locations(ast.Module(body=selected,type_ignores=[])),str(ROOT/'android-authenticated-140.py'),'exec'),globals())
    source=(ROOT/'native_catalog_checks_140.py').read_text(encoding='utf-8')
    counter=next(n for n in ast.parse(source).body if isinstance(n,ast.FunctionDef) and n.name=='reach_catalog_total')
    exec(compile(ast.Module(body=[counter],type_ignores=[]),str(ROOT/'native_catalog_checks_140.py'),'exec'),globals())
    for name in ('dump','display_size'):globals()[name]=getattr(ui,name)
load_flow_helpers()

def persist():
    OUT.joinpath('authenticated-result.json').write_text(ui.sanitize(json.dumps(report,indent=2,ensure_ascii=False)),encoding='utf-8')

def note_phase(name):
    assert name in PHASES;report['phase']=name;persist();print('RWADAR_QA_PHASE '+json.dumps({'phase':name}),flush=True)

def complete(name,value=True):
    report['checks'][name]=value;persist()

def valid_box(node,size):
    b=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
    return node.get('visible')=='true' and len(b)==4 and 0<=b[0]<b[2]<=size[0] and 0<=b[1]<b[3]<=size[1]

def tap_node(node,size):
    require(valid_box(node,size) and node.get('enabled')!='false','Observed system control is unavailable or clipped')
    b=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
    ui.adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))

def system_pin_fields(root,size):
    return [n for n in root.iter('node') if n.get('package') in SYSTEM_PACKAGES
      and n.get('class')=='android.widget.EditText' and n.get('password')=='true' and n.get('enabled')!='false' and valid_box(n,size)]

def switch_node(root,expected=None):
    # A transient TextView can share the label while the actual Switch is busy.
    nodes=[n for n in root.iter('node') if n.get('visible')!='false' and n.get('checkable')=='true'
      and any(n.get(k,'')==SWITCH for k in ('text','content-desc'))]
    require(len(nodes)==1,'Security option must expose one real checked control')
    n=nodes[0];bounds=list(map(int,re.findall(r'-?\d+',n.get('bounds',''))))
    require(len(bounds)==4 and 0<=bounds[0]<bounds[2] and 0<=bounds[1]<bounds[3],'Security option has no current bounds')
    if expected is not None:require(n.get('checked')==str(expected).lower(),'Security option state differs from its verified result')
    return n

def wait_switch(expected,timeout=20):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        try:
            root=locate(SWITCH);node=switch_node(root)
            if node.get('enabled')!='false' and node.get('checked')==str(expected).lower():return root
        except AssertionError:
            # A label or disabled intermediate frame is not PASS and is not final.
            pass
        time.sleep(.3)
    raise AssertionError('Security option did not reach its expected native checked state')

def private_hidden(root):
    values=set(ui.visible_text(root).splitlines())
    require('Tu radar está protegido' in values,'Expected retained-session device lock, not login')
    require(not values.intersection(('Inicio','Buscar','Academy','Perfil','Mis inversiones','Tu perfil','Registrar inversión','49 en el catálogo','Entra en tu cuenta')),
      'Private content or login was exposed behind the retained-session lock')

def account_is_exact_qa():
    # Observe the actual profile email only in memory before the shared sanitizer.
    click('Perfil');locate('[REDACTED]')
    old=ui.inspect_login_input_values;allowed=ui.CAPTURE_ALLOWED;matched=[];size=ui.display_size()
    def inspect(raw):
        old(raw);tree=ET.fromstring(raw)
        matched.append(any(n.get('package')==ui.APP_PACKAGE and n.get('text')==os.environ['RWADAR_QA_EMAIL'] and valid_box(n,size) for n in tree.iter('node')))
    try:
        ui.inspect_login_input_values=inspect;ui.CAPTURE_ALLOWED=False;ui.dump()
    finally:ui.inspect_login_input_values=old;ui.CAPTURE_ALLOWED=allowed
    require(matched==[True],'Restored profile does not physically identify the exact QA account')

def reopen():
    ui.adb('shell','am','force-stop',ui.APP_PACKAGE);time.sleep(.4)
    ui.adb('shell','am','start','-W','-n',ui.APP_PACKAGE+'/.MainActivity')

def wait_system_pin(timeout=25):
    deadline=time.monotonic()+timeout;size=ui.display_size();fallback_used=False
    fallback_labels={'Use PIN','Use pin','Use device PIN','Use screen lock','Usar PIN','Usar código del dispositivo','Usar código'}
    while time.monotonic()<deadline:
        root=ui.dump(timeout=min(8,max(.1,deadline-time.monotonic())))
        fields=system_pin_fields(root,size)
        if len(fields)==1:return root,fields[0],size
        require(len(fields)<2,'Ambiguous Android credential entry')
        fallback=[n for n in root.iter('node') if n.get('package') in SYSTEM_PACKAGES and n.get('enabled')!='false'
          and valid_box(n,size) and any(n.get(k,'') in fallback_labels for k in ('text','content-desc'))]
        if fallback and not fallback_used:tap_node(fallback[0],size);fallback_used=True
        time.sleep(.3)
    raise AssertionError('Actual Android system PIN prompt was not observed')

def enter_system_pin(step):
    require(step in ('enable','unlock-after-cancel','unlock-after-force-stop','disable'),'Unexpected static PIN proof label')
    root,node,size=wait_system_pin();capture('c21-system-pin-'+step)
    tap_node(node,size);ui.type_text_observed(DEVICE_PIN);ui.adb('shell','input','keyevent','KEYCODE_ENTER');time.sleep(.6)
    root=ui.dump()
    if system_pin_fields(root,size):
        labels={'Continue','Next','Done','OK','Confirm','Continuar','Siguiente','Hecho','Aceptar'}
        buttons=[n for n in root.iter('node') if n.get('package') in SYSTEM_PACKAGES and n.get('clickable')=='true'
          and n.get('enabled')!='false' and valid_box(n,size) and any(n.get(k,'') in labels for k in ('text','content-desc'))]
        require(len(buttons)==1,'System PIN remains open without one observed confirmation control');tap_node(buttons[0],size)

def cancel_system_pin():
    root,_,size=wait_system_pin();capture('c21-system-pin-cancel')
    buttons=[n for n in root.iter('node') if n.get('package') in SYSTEM_PACKAGES and n.get('enabled')!='false'
      and valid_box(n,size) and any(n.get(k,'').casefold() in ('cancel','cancelar') for k in ('text','content-desc'))]
    if buttons:tap_node(buttons[0],size)
    else:
        ui.adb('shell','input','keyevent','KEYCODE_BACK');time.sleep(.4)
        if system_pin_fields(ui.dump(),size):ui.adb('shell','input','keyevent','KEYCODE_BACK')
    root=ui.wait_ui('Tu radar está protegido',timeout=20);private_hidden(root);capture('c21-cancel-remains-locked')

def catalog_counts():
    click('Buscar');root=ui.wait_ui('Mostrar plataformas 26','Mostrar ofertas 49',timeout=30)
    check_visible_box(root,'Mostrar plataformas 26');check_visible_box(root,'Mostrar ofertas 49')
    capture('c21-current-counts26-49');click('Mostrar ofertas 49')
    root=reach_catalog_total()
    require('49 en el catálogo' in ui.visible_text(root),'Complete current catalogue count missing')
    capture('c21-current-catalog49');complete('currentCatalogueVisible',{'platforms':26,'offers':49,'fullRadarTraversalRepeated':False})

def session_and_lock():
    note_phase('persistent-session');account_is_exact_qa();wait_switch(False);capture('c21-default-security-off')
    reopen();ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=45);account_is_exact_qa();wait_switch(False)
    complete('forceStopRestoresSameAccountWithoutPassword');capture('c21-session-restored')
    # This PIN is set only on the newly created disposable emulator, never on a user device.
    require(ui.adb('shell','getprop','ro.kernel.qemu').strip()=='1','PIN setup is restricted to the disposable emulator')
    ui.adb('shell','locksettings','set-pin',DEVICE_PIN)
    note_phase('device-lock');click(SWITCH);enter_system_pin('enable');wait_switch(True);capture('c21-security-enabled')
    complete('enableRequiresActualAndroidPin')
    ui.adb('shell','input','keyevent','KEYCODE_HOME');time.sleep(.6);ui.adb('shell','am','start','-W','-n',ui.APP_PACKAGE+'/.MainActivity')
    root=ui.wait_ui('Tu radar está protegido',timeout=25);private_hidden(root);capture('c21-background-hidden')
    click('Desbloquear RWAdar');cancel_system_pin();complete('cancelKeepsPrivateContentHidden')
    click('Desbloquear RWAdar');enter_system_pin('unlock-after-cancel');ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=30);account_is_exact_qa()
    complete('validAndroidPinUnlocksSameAccount');capture('c21-valid-pin-unlocked')
    reopen();root=ui.wait_ui('Tu radar está protegido',timeout=45);private_hidden(root);capture('c21-force-stop-still-locked')
    complete('forceStopKeepsOptionalLock')
    click('Desbloquear RWAdar');enter_system_pin('unlock-after-force-stop');ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=30);account_is_exact_qa();wait_switch(True)
    click(SWITCH);enter_system_pin('disable');wait_switch(False);complete('disableRequiresActualAndroidPin');capture('c21-security-disabled')
    reopen();ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=45);account_is_exact_qa();wait_switch(False)
    complete('disabledLockStillRestoresVerifiedSession')

def logout_persisted():
    click('Perfil');click('Cerrar sesión');ui.wait_ui('Entra en tu cuenta',timeout=25)
    reopen();root=ui.wait_ui('Entra en tu cuenta',timeout=40)
    require(not authenticated_ui(root),'Logout/reopen restored a cleared account')
    require(not any(value in ui.visible_text(root).splitlines() for value in ('Inicio','Buscar','Academy','Perfil','Mis inversiones','49 en el catálogo')),'Logout exposed private content')
    capture('c21-logout-reopen-requires-login');complete('logoutClearsStoredSessionAndReopenRequiresLogin')


SESSION_SCOPE_CHECKS = ('forceStopRestoresSameAccountWithoutPassword', 'enableRequiresActualAndroidPin', 'cancelKeepsPrivateContentHidden', 'validAndroidPinUnlocksSameAccount', 'forceStopKeepsOptionalLock', 'disableRequiresActualAndroidPin', 'disabledLockStillRestoresVerifiedSession')
SESSION_SCOPE_RESULT_SHA = '973fe692c2d02cbd41454a38bcc25831ba75b5faf0966d0ffd8634e1a07c5222'
SESSION_SCOPE_MANIFEST_SHA = '6f52ca9f3e511e190fb9df49f6b46ad3747858ebb7c170fac02b35f9be05a770'

def reuse_completed_session_scope(candidate, result_path=None, manifest_path=None):
    assert candidate.get('status')=='ready','Current frozen candidate must remain ready'
    raw=(pathlib.Path(result_path) if result_path else ROOT/'baseline-c22-session-40682735526-result.json').read_bytes()
    manifest_raw=(pathlib.Path(manifest_path) if manifest_path else ROOT/'baseline-c22-session-40682735526.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()==SESSION_SCOPE_RESULT_SHA,'Completed session raw report identity changed'
    assert hashlib.sha256(manifest_raw).hexdigest()==SESSION_SCOPE_MANIFEST_SHA,'Completed session evidence manifest changed'
    old=json.loads(raw);manifest=json.loads(manifest_raw)
    assert old['status']=='failed' and old['phase']=='tutorial' and old['full20PointQA'] is False and old['releaseApproved'] is False,'Original global tutorial failure must remain failed'
    assert manifest['runId']==40682735526 and manifest['originalStatus']=='failed' and manifest['originalFailurePhase']=='tutorial'
    assert manifest['rawReportSha256']==SESSION_SCOPE_RESULT_SHA and manifest['reusedChecks']==list(SESSION_SCOPE_CHECKS)
    identity=('version','versionCode','package','apkSha256','apkBytes','sourceHeadSha','easBuildId','certificateSha256')
    assert candidate['versionCode']==22 and all(old[k]==candidate[k]==manifest['identity'][k] for k in identity),'Completed session evidence belongs to another APK/source'
    assert all(old['checks'].get(key) is True for key in SESSION_SCOPE_CHECKS),'Completed original session scope is incomplete'
    assert manifest['observationPerformedInThisRun'] is False and manifest['inheritedFlagsReferToOriginalRun'] is True
    assert manifest['postReopenCaptureSaved'] is False and manifest['captureNamesAreOriginal'] is True
    assert len(manifest['captures'])==26 and all(item['runId']==40682735526
      and re.fullmatch(r'c21-[a-z0-9-]+\.(?:png|xml)',item['file']) and re.fullmatch(r'[a-f0-9]{64}',item['sha256'])
      and type(item['bytes']) is int and item['bytes']>0 for item in manifest['captures']),'Original capture references are incomplete'
    metadata={'runId':40682735526,'harnessHeadSha':manifest['harnessHeadSha'],'originalStatus':'failed','originalFailurePhase':'tutorial',
      'rawReportSha256':SESSION_SCOPE_RESULT_SHA,'manifestSha256':SESSION_SCOPE_MANIFEST_SHA,'archiveSha256':manifest['archiveSha256'],
      'reusedChecks':list(SESSION_SCOPE_CHECKS),'observationPerformedInThisRun':False,'inheritedFlagsReferToOriginalRun':True,
      'postReopenCaptureSaved':False,'postReopenEvidence':manifest['postReopenEvidence'],'captures':manifest['captures'],
      'identity':manifest['identity'],'sessionAndPinRepeatedInCurrentRun':False,'originalTutorialStillFailed':True}
    return {key:True for key in SESSION_SCOPE_CHECKS},metadata

def main():
    require(os.environ.get('GITHUB_REPOSITORY')=='victorJorques/RWADAR' and os.environ.get('GITHUB_EVENT_NAME')=='workflow_dispatch','Private manual QA required')
    require(os.environ.get('QA_ACCOUNT_ACK')=='CONFIRMED_TEST_ACCOUNT','Existing confirmed QA account required')
    require(bool(os.environ.get('RWADAR_QA_EMAIL')) and bool(os.environ.get('RWADAR_QA_PASSWORD')),'Two current QA secrets required')
    c=load_candidate();report.update({k:c[k] for k in ('version','versionCode','package','apkSha256','apkBytes','sourceHeadSha','certificateSha256','easBuildId')})
    identity=json.loads((OUT/'candidate-current-package.json').read_text(encoding='utf-8'))
    require(identity['status']=='verified-native-package-only' and all(identity[k]==c[k] for k in ('versionCode','apkSha256','apkBytes','sourceHeadSha','certificateSha256'))
      and identity['all49AssetsFreshlyScannedInThisApk'] is True and identity['historicalApkIdentityReused'] is False,'Fresh current-APK package verification required')
    with pathlib.Path('rwadar.apk').open('rb') as stream:require(hashlib.file_digest(stream,'sha256').hexdigest()==c['apkSha256'],'Installed artifact source hash mismatch')
    complete('freshCandidatePackageSignatureAnd49Assets');ui._SECRET_VALUES=(*ui._SECRET_VALUES,DEVICE_PIN)
    ui.start_snapshot_bridge();ui.adb('logcat','-c')
    ui.adb('shell','am','start','-W','-n',ui.APP_PACKAGE+'/.MainActivity')
    note_phase('initial-login');login_confirmed();capture('c21-login-success')
    note_phase('catalog-counts');catalog_counts()
    inherited,reuse=reuse_completed_session_scope(c)
    report['checks'].update(inherited)
    report['completedSessionScopeReuse']=reuse
    report['scope']='current-apk-pending-flows-with-completed-session-scope-reused'
    (OUT/'completed-session-reuse-metadata.json').write_text(json.dumps(reuse,indent=2),encoding='utf-8')
    persist()
    note_phase('tutorial');tutorial();persist()
    note_phase('portfolio');portfolio();persist();require(report['localQADataRemoved'] is True,'Own local QA row cleanup required before logout')
    note_phase('logout');logout_persisted()
    errors=ui.sanitize(ui.adb('logcat','-d','-v','threadtime','AndroidRuntime:E','ReactNativeJS:E','*:S'))
    (OUT/'runtime-errors-private.log').write_text(errors[-65536:],encoding='utf-8')
    require(not re.search(r'FATAL EXCEPTION|ReactNativeJS.*(?:TypeError|ReferenceError|Invariant Violation|Error:)',errors),'Native or JavaScript runtime exception')
    complete('noRuntimeException');report['status']='passed-scoped-only';persist()

def deadline(*_):
    report.update(status='failed',failureType='QaDeadlineExceeded',hardDeadlineExceeded=True);persist()
    raise ui.QaDeadlineExceeded('Current APK scoped QA reached its hard1800second limit')

if __name__=='__main__':
    exit_code=1
    try:signal.signal(signal.SIGALRM,deadline);signal.alarm(1800);main();exit_code=0
    except BaseException as error:
        report['status']='failed';report['diagnostic']=safe_exception_diagnostic(error);report['failureType']=type(error).__name__;persist()
        print('RWADAR_QA_FAILURE '+json.dumps({'phase':report['phase'],'diagnostic':report['diagnostic']}),flush=True)
        if ui.CAPTURE_ALLOWED and not isinstance(error,ui.QaDeadlineExceeded):ui.capture_failure('failure-c21-private')
    finally:
        signal.alarm(0)
        try:ui.stop_snapshot_bridge()
        except Exception as error:report['snapshotCleanupFailure']=type(error).__name__
        persist();emit_result_backup()
        print(json.dumps({'status':report['status'],'scope':report['scope'],'full20PointQA':False,'releaseApproved':False,'localQADataRemoved':report['localQADataRemoved']}),flush=True)
    sys.exit(exit_code)
