import ast, json, pathlib, unittest
from unittest.mock import patch
import gate
import re, types, xml.etree.ElementTree as ET

class Controls(unittest.TestCase):
    def test_exact_existing_qa_uuid_marker_and_email_are_required(self):
        env={'QA_USER_ID':gate.EXPECTED_QA_ID,'QA_ACCOUNT_MARKER':gate.EXPECTED_QA_MARKER,'RWADAR_QA_EMAIL':gate.EXPECTED_QA_EMAIL}
        gate.require_qa_identity(env,require_email=True)
        for change in ({'QA_USER_ID':'00000000-0000-0000-0000-000000000001'},
                       {'QA_ACCOUNT_MARKER':'another-marker'}, {'RWADAR_QA_EMAIL':'other@example.invalid'}):
            with self.assertRaises(AssertionError):gate.require_qa_identity(dict(env,**change),require_email=True)

    def test_auth_user_requires_exact_identity_and_confirmed_email(self):
        user={'id':gate.EXPECTED_QA_ID,'email':gate.EXPECTED_QA_EMAIL,'created_at':gate.EXPECTED_QA_CREATED_AT,
              'user_metadata':{'nombre':gate.EXPECTED_QA_NAME},'email_confirmed_at':'2026-10-24T18:34:00Z','is_anonymous':False}
        gate.validate_auth_qa_user(user)
        for change in ({'id':'00000000-0000-0000-0000-000000000001'}, {'email':'other@example.invalid'},
                       {'created_at':'2026-10-28T00:00:00Z'}, {'user_metadata':{'nombre':'Admin'}},
                       {'email_confirmed_at':None}, {'is_anonymous':True}):
            with self.assertRaises(AssertionError):gate.validate_auth_qa_user(dict(user,**change))

    def test_pending_fails_before_any_subprocess_or_environment_output(self):
        with patch.object(gate,'command',side_effect=AssertionError('Must not execute')), patch.dict(gate.os.environ,{},clear=True):
            with self.assertRaisesRegex(AssertionError,'Candidate pending'): gate.prepare()

    def test_ready_requires_finished_and_complete_actual_identity(self):
        c=json.loads((gate.ROOT/'candidate.json').read_text(encoding='utf-8'))
        for change in ({'status':'ready'}, {'status':'ready','easStatus':'FINISHED'}):
            with patch.object(pathlib.Path,'read_text',return_value=json.dumps(dict(c,**change))):
                with self.assertRaises(AssertionError):gate.load_candidate('unused.json')

    def test_manifest_metadata_resolves_actual_resource_and_escaped_headers(self):
        data={
          'expo.modules.updates.ENABLED':'(type 0x12)0xffffffff',
          'expo.modules.updates.EXPO_RUNTIME_VERSION':'@0x7f120001',
          'expo.modules.updates.EXPO_UPDATE_URL':json.dumps(gate.UPDATE_URL),
          'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY':json.dumps(json.dumps({'expo-channel-name':'production'},separators=(',',':')))}
        xml='\n'.join('  E: meta-data (line=1)\n    A: android:name(0x01010003)='+json.dumps(k)+'\n    A: android:value(0x01010024)='+v for k,v in data.items())
        resources='  resource 0x7f120001 com.rwadar.app:string/expo_runtime_version: t=0x03\n    (string8) "1.4.1(23)"\n'
        unrelated='  E: meta-data (line=1)\n    A: android:name(0x01010003)="unrelated.notification.icon"\n    A: android:value(0x01010024)=@0x7f080001\n'
        xml=unrelated+xml
        with self.assertRaises(AssertionError):gate.check_updates(xml,'')
        with self.assertRaises(AssertionError):gate.check_updates(xml.replace('production','preview'),resources)
        proof=gate.check_updates(xml,resources)
        self.assertTrue(proof['enabled']);self.assertFalse(proof['otaDeliveryObserved'])
        with self.assertRaises(AssertionError):gate.check_updates(xml.replace('0xffffffff','0x0'),resources)
        with self.assertRaises(AssertionError):gate.check_updates(xml,resources.replace('1.4.1(23)','1.4.0(22)'))

    def test_new_harness_has_no_uninstall_or_clear_before_update(self):
        source=(gate.ROOT/'run.py').read_text(encoding='utf-8');ast.parse(source)
        self.assertIn("ui.adb('install','--no-streaming','-r','rwadar.apk'",source)
        self.assertNotIn("'uninstall'",source);self.assertNotIn("'pm','clear'",source)
        self.assertNotIn('tutorial_ocr',source);self.assertNotIn('session_and_lock()',source)

    def test_duplicate_result_is_scoped_to_summary_or_qa_position(self):
        source=ast.parse((gate.ROOT/'run.py').read_text(encoding='utf-8'))
        selected=[n for n in source.body if isinstance(n,ast.FunctionDef) and n.name in ('datum_value','bounds')]
        def require(value,message):
            if not value:raise AssertionError(message)
        scope={'re':re,'QA_NAME':'QA_FIXTURE','require':require,'visible':lambda n:True}
        exec(compile(ast.Module(body=selected,type_ignores=[]),'bounded-selector-test','exec'),scope)
        root=ET.fromstring('''<hierarchy><node><node><node text="Tu resumen"/><node><node text="Resultado"/><node text="0,30 EUR"/></node></node>
          <node><node text="QA_FIXTURE"/><node><node text="Resultado"/><node text="9,99 EUR"/></node></node></node></hierarchy>''')
        self.assertTrue(scope['datum_value'](root,'Resultado','0,30 EUR','Tu resumen'))
        self.assertTrue(scope['datum_value'](root,'Resultado','9,99 EUR','QA_FIXTURE'))
        with self.assertRaises(AssertionError):scope['datum_value'](root,'Resultado','0,30 EUR','QA_FIXTURE')

if __name__=='__main__':unittest.main()
