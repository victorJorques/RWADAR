"""Offline fixture controls only. No adb, SDK, credentials, account or network call."""
import importlib.util,io,json,pathlib,sys,tempfile,unittest,xml.etree.ElementTree as ET
from unittest import mock
ROOT=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
import candidate_c21 as gate
spec=importlib.util.spec_from_file_location('session_lock_c21',ROOT/'android-session-lock-140.py')
smoke=importlib.util.module_from_spec(spec);spec.loader.exec_module(smoke)

def tree(nodes):
    root=ET.Element('hierarchy')
    for attrs in nodes:ET.SubElement(root,'node',{'visible':'true','enabled':'true','bounds':'[10,10][200,90]',**attrs})
    return root

class CandidateControls(unittest.TestCase):
    def test_not_ready_rejected_before_source_or_network(self):
        current=json.loads((ROOT/'candidate-current.json').read_text(encoding='utf-8'))
        self.assertEqual(current['versionCode'],22);self.assertEqual(current['status'],'not-ready')
        for key in ('sourceHeadSha','baselineSourceHeadSha','certificateSha256','apkUrl','apkSha256','apkBytes','easBuildId'):
            self.assertIsNone(current[key])
        with mock.patch.object(gate,'git',side_effect=AssertionError('Offline test forbids git/network')), \
                mock.patch.object(gate.subprocess,'run',side_effect=AssertionError('Offline test forbids subprocess/network')):
            with self.assertRaisesRegex(AssertionError,'not ready'):gate.prepare()


    def test_current22_requires_own_manifest_source_hash_and_signature(self):
        historical=(ROOT/'candidate-c21.json').read_bytes()
        c=json.loads(historical)
        c.update(status='ready',versionCode=22,sourceHeadSha='2'*40,apkSha256='3'*64,
          apkUrl='https://expo.dev/artifacts/eas/fixture-only-current22.apk',apkBytes=64*1024*1024,
          easBuildId='22222222-3333-4444-5555-666666666666')
        with tempfile.TemporaryDirectory(dir=ROOT) as folder:
            file=pathlib.Path(folder)/'current-fixture.json';file.write_text(json.dumps(c),encoding='utf-8')
            validated=gate.load_candidate(file);self.assertEqual(validated['versionCode'],22)
            for key,value in [('versionCode',True),('versionCode',20),('sourceHeadSha',None),('apkSha256',None),('certificateSha256','0'*64)]:
                file.write_text(json.dumps({**c,key:value}),encoding='utf-8')
                with self.assertRaises(AssertionError):gate.load_candidate(file)
        signature='Signer #1 certificate SHA-256 digest: '+gate.CERT+'\nVerified using v2 scheme (APK Signature Scheme v2): true\n'
        manifest="package: name='com.rwadar.app' versionCode='22' versionName='1.4.0'\nsdkVersion:'24'\n"
        gate.check_native_metadata(validated,signature,manifest)
        with self.assertRaises(AssertionError):gate.check_native_metadata(validated,signature,manifest.replace("versionCode='22'","versionCode='21'"))
        with self.assertRaises(AssertionError):gate.check_native_metadata(validated,signature.replace(gate.CERT,'0'*64),manifest)
        fake=mock.MagicMock();fake.stat.return_value=mock.Mock(st_size=c['apkBytes']);fake.open.return_value=io.BytesIO(b'offline fixture, not an APK')
        with mock.patch.object(gate,'load_candidate',return_value=validated),mock.patch.object(gate.pathlib,'Path',return_value=fake), \
                mock.patch.object(gate,'command',side_effect=AssertionError('Native tools must not run after a wrong hash')):
            with self.assertRaises(AssertionError):gate.identity('fixture.apk')
        with mock.patch.object(gate,'git',return_value='rwadar-movil/App.js') as checked:
            with self.assertRaises(AssertionError):gate.source_guard(validated)
            checked.assert_called_once_with('diff','--name-only',validated['sourceHeadSha'],'HEAD','--','rwadar-movil')
        self.assertEqual((ROOT/'candidate-c21.json').read_bytes(),historical)

    def test_ready_schema_rejects_foreign_url_or_missing_identity(self):
        c=json.loads((ROOT/'candidate-c21.json').read_text(encoding='utf-8'))
        c.update(status='ready',sourceHeadSha='a'*40,certificateSha256=gate.CERT,apkUrl='https://expo.dev/artifacts/eas/fixture.apk',
          apkSha256='b'*64,apkBytes=64*1024*1024,easBuildId='11111111-2222-3333-4444-555555555555')
        with tempfile.TemporaryDirectory(dir=ROOT) as d:
            self.assertEqual(pathlib.Path(d).resolve().parent,ROOT)
            file=pathlib.Path(d)/'candidate.json';file.write_text(json.dumps(c),encoding='utf-8');self.assertEqual(gate.load_candidate(file)['versionCode'],21)
            for key,value in [('apkUrl','https://example.test/app.apk'),('apkUrl','https://expo.dev/artifacts/eas/a.apk?token=x'),('apkSha256',None),('sourceHeadSha',''),('certificateSha256','c'*64),('versionCode',20),('schemaVersion',True)]:
                bad={**c,key:value};file.write_text(json.dumps(bad),encoding='utf-8')
                with self.assertRaises(AssertionError):gate.load_candidate(file)

    def test_android_pin_requires_system_masked_field_and_real_bounds(self):
        valid={'package':'com.android.settings','class':'android.widget.EditText','password':'true'}
        self.assertEqual(len(smoke.system_pin_fields(tree([valid]),(1080,2400))),1)
        for change in [{'package':'com.rwadar.app'},{'package':'example.app'},{'password':'false'},{'visible':'false'},{'bounds':'[0,0][0,0]'},{'bounds':'[10,10][1200,50]'}]:
            self.assertEqual(smoke.system_pin_fields(tree([{**valid,**change}]),(1080,2400)),[])

    def test_security_switch_needs_native_checked_state(self):
        root=tree([{'content-desc':smoke.SWITCH,'checkable':'true','checked':'false','clickable':'true'}])
        self.assertEqual(smoke.switch_node(root,False).get('checked'),'false')
        with self.assertRaises(AssertionError):smoke.switch_node(root,True)
        root.find('node').set('checkable','false')
        with self.assertRaises(AssertionError):smoke.switch_node(root,False)

    def test_cancelled_lock_rejects_login_or_private_content(self):
        locked=[{'text':'Tu radar está protegido'}];smoke.private_hidden(tree(locked))
        for private in ('Inicio','Buscar','Academy','Perfil','Mis inversiones','Tu perfil','Registrar inversión','49 en el catálogo','Entra en tu cuenta'):
            with self.assertRaises(AssertionError):smoke.private_hidden(tree(locked+[{'text':private}]))
        with self.assertRaises(AssertionError):smoke.private_hidden(tree([{'text':'Entra en tu cuenta'}]))

    def test_helper_reuse_cannot_import_old_candidate_or_grant_old_identity(self):
        self.assertNotIn('candidate_140',sys.modules)
        for name in ('SHA','SOURCE','OLD_SHA','CANDIDATE'):self.assertNotIn(name,vars(smoke))
        self.assertIn('QA_APK21_LOCAL_',smoke.portfolio.__code__.co_consts)
        self.assertNotIn('QA_APK20_LOCAL_',smoke.portfolio.__code__.co_consts)
        self.assertFalse(smoke.report['full20PointQA']);self.assertFalse(smoke.report['releaseApproved'])
        self.assertTrue(smoke.report['biometricHardwareNotTested'])
        self.assertFalse(smoke.report['historicalScopes']['observationPerformedInThisRun'])

    def test_workflow_and_native_deadlines_are_bounded_and_manual(self):
        workflow=(ROOT.parent/'workflows/android-session-lock-140.yml').read_text(encoding='utf-8')
        self.assertIn("github.event_name == 'workflow_dispatch' && github.event.repository.private == true",workflow)
        self.assertIn('timeout-minutes: 35',workflow);self.assertIn('candidate_c21.py prepare',workflow)
        self.assertIn('candidate_c21.py identity rwadar.apk',workflow);self.assertIn('android-session-lock-140.py',workflow)
        self.assertNotIn('reuse-identity',workflow);self.assertNotIn('eas build',workflow)
        self.assertNotIn('eas update',workflow);self.assertNotIn('release edit',workflow)
        native=(ROOT/'android-session-lock-140.py').read_text(encoding='utf-8');self.assertIn('signal.alarm(1800)',native)

if __name__=='__main__':unittest.main()
