"""Offline continuation controls: provenance, order, safe diagnosis and absence."""
import ast,json,os,pathlib,re,shutil,tempfile,types,unittest
from unittest.mock import patch
import gate,ota,reuse

ROOT=pathlib.Path(__file__).resolve().parent
TREE=ast.parse((ROOT/'run.py').read_text(encoding='utf-8'))
def selected(names,scope):
    nodes=[n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name in names]
    assert {n.name for n in nodes}==set(names)
    exec(compile(ast.Module(body=nodes,type_ignores=[]),'run.py','exec'),scope)
    return scope

class Continuation(unittest.TestCase):
    def test_history_is_exact_failed_and_separate_with_four_scoped_observations(self):
        value=reuse.load_reused_native_evidence(gate.load_candidate())
        self.assertEqual(value['originalStatus'],'failed');self.assertFalse(value['originalReleaseApproved'])
        self.assertFalse(value['originalFull20PointQA']);self.assertFalse(value['repeatedInThisRun'])
        self.assertEqual(tuple(value['checks']),reuse.CHECKS)
        self.assertFalse(value['checks']['offlineEmbeddedStartsWithoutLogout']['privateAccessObserved'])

    def test_modified_historical_bytes_or_candidate_identity_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            for name in reuse.FILES:shutil.copyfile(ROOT/'baseline-40783151032'/name,pathlib.Path(folder)/name)
            file=pathlib.Path(folder)/'android-update-141-result.json';file.write_bytes(file.read_bytes()+b' ')
            with self.assertRaisesRegex(AssertionError,'SHA mismatch'):reuse.load_reused_native_evidence(gate.load_candidate(),folder)
        changed={**gate.load_candidate(),'apkSha256':'0'*64}
        with self.assertRaisesRegex(AssertionError,'identity'):reuse.load_reused_native_evidence(changed)

    def test_direct_install_precedes_login_and_old_offline_navigation_are_not_run(self):
        candidate=gate.load_candidate();events=[];report={'checks':{}}
        class UI:
            APP_PACKAGE='com.rwadar.app';CAPTURE_ALLOWED=False
            def adb(self,*args,**kwargs):
                events.append(('adb',args))
                return 'versionCode=23 versionName=1.4.1' if args[:3]==('shell','dumpsys','package') else ''
            def start_snapshot_bridge(self):events.append(('bridge',))
            def wait_ui(self,*args,**kwargs):return None
            def visible_text(self,root):return ''
        def require(value,message):
            if not value:raise AssertionError(message)
        with tempfile.TemporaryDirectory() as folder:
            out=pathlib.Path(folder);shutil.copyfile(ROOT/'baseline-40783151032/candidate-141-package.json',out/'candidate-141-package.json')
            scope={'report':report,'re':re,'json':json,'pathlib':pathlib,'os':os,'OUT':out,'QA_NAME':'QA_APK23_CLOUD_TEST',
              'require':require,'persist':lambda:None,'load_candidate':lambda:candidate,
              'load_reused_native_evidence':reuse.load_reused_native_evidence,'validate_package':reuse.validate_package,
              'ui':UI(),'ota':types.SimpleNamespace(load_ota=lambda c:{},prepare_device=lambda ui:events.append(('adbd',)),read_stopped_db=lambda *a,**kw:None),
              'require_qa_identity':lambda *a,**kw:None,'verify_auth_qa_identity':lambda:events.append(('auth',)),
              'launch':lambda:events.append(('launch',)),'login_confirmed':lambda:events.append(('login',)),
              'exact_qa_account':lambda:events.append(('visible-account',)),'portfolio':lambda:events.append(('portfolio',)),
              'detail_font':lambda:events.append(('detail',)),'click':lambda label:events.append(('click',label)),
              'reopen':lambda:events.append(('reopen-after-logout',)),'authenticated_ui':lambda root:False,'capture':lambda label:None,
              'complete':lambda name,value=True:report['checks'].__setitem__(name,value)}
            selected(['main','phase'],scope)
            with patch.dict(os.environ,{'QA_ACCOUNT_ACK':'CONFIRMED_TEST_ACCOUNT','RWADAR_QA_EMAIL':'mock','RWADAR_QA_PASSWORD':'mock'}),patch('builtins.print'):
                scope['main']()
        install=events.index(('adb',('install','--no-streaming','-r','rwadar.apk')))
        self.assertLess(install,events.index(('login',)));self.assertLess(install,events.index(('launch',)))
        self.assertFalse(any('airplane-mode' in str(event) or 'KEYCODE_HOME' in str(event) for event in events))
        self.assertEqual(set(report['checks']).intersection(reuse.CHECKS),set())
        self.assertIn('candidate23ConfirmedAccountLogin',report['checks'])
        self.assertEqual(report['reusedNativeEvidence']['originalStatus'],'failed')

    def test_traceback_exports_only_allowed_filename_and_line(self):
        scope=selected(['error_location'],{'pathlib':pathlib})
        try:exec(compile("raise RuntimeError('NEVER_EXPORT_SECRET')",'/private/path/run.py','exec'),{})
        except RuntimeError as error:value=scope['error_location'](error)
        self.assertEqual(value,[{'filename':'run.py','line':1}]);self.assertNotIn('NEVER',json.dumps(value))

    def test_initial_missing_db_requires_exact_test_exit1_and_empty_stderr(self):
        ui=types.SimpleNamespace(adb=lambda *a:None)
        for code,stderr,allowed in ((1,b'',True),(1,b'adb offline',False),(2,b'',False)):
            result=types.SimpleNamespace(returncode=code,stderr=stderr)
            with patch.object(ota.subprocess,'run',return_value=result):
                if allowed:self.assertIsNone(ota.read_stopped_db(ui,{},allow_initial_missing=True))
                else:
                    with self.assertRaises(AssertionError):ota.read_stopped_db(ui,{},allow_initial_missing=True)
        with patch.object(ota.subprocess,'run',return_value=types.SimpleNamespace(returncode=1,stderr=b'')):
            with self.assertRaisesRegex(AssertionError,'DB missing'):ota.read_stopped_db(ui,{})

if __name__=='__main__':unittest.main()
