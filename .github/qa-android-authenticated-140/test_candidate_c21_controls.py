"""Offline fixture controls only. No adb, SDK, credentials, account or network call."""
import importlib.util,json,pathlib,sys,tempfile,unittest,xml.etree.ElementTree as ET
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
        with mock.patch.object(gate,'git',side_effect=AssertionError('Offline test forbids git/network')):
            with self.assertRaisesRegex(AssertionError,'not ready'):gate.load_candidate()

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
