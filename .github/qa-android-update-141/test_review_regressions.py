"""Offline tests of newly fixed harness transitions, without loading credentials."""
import ast, os, pathlib, re, types, unittest, xml.etree.ElementTree as ET
from unittest.mock import patch

SOURCE = pathlib.Path(__file__).with_name('run.py')

def functions(names, scope):
    tree = ast.parse(SOURCE.read_text(encoding='utf-8'))
    selected = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in names]
    assert {n.name for n in selected} == set(names)
    def require(value, message):
        if not value: raise AssertionError(message)
    scope.update({'require': require, 'ET': ET, 'os': os, 're': re})
    exec(compile(ast.Module(body=selected, type_ignores=[]), str(SOURCE), 'exec'), scope)
    return scope

class ReviewRegressions(unittest.TestCase):
    def test_account_scan_observes_raw_email_below_portfolio_and_returns_to_top(self):
        class UI:
            APP_PACKAGE = 'com.rwadar.app'
            CAPTURE_ALLOWED = True
            position = 0
            tops = 0
            inspect_login_input_values = staticmethod(lambda raw: None)
            def scroll_top(self): self.position = 0; self.tops += 1
            def dump(self):
                assert not self.CAPTURE_ALLOWED
                visible = 'true' if self.position == 2 else 'false'
                raw = '<hierarchy><node package="com.rwadar.app" text="qa@example.invalid" visible="'+visible+'"/></hierarchy>'
                self.inspect_login_input_values(raw)
                return ET.fromstring(raw.replace('qa@example.invalid', '[REDACTED]'))
            def scroll_step(self, forward, root):
                assert forward
                self.position += 1
                return self.dump(), True
        ui = UI(); original = ui.inspect_login_input_values
        scope = functions(['exact_qa_account'], {'ui': ui, 'scroll_top_ready': ui.scroll_top, 'click': lambda label: None, 'visible': lambda n: True})
        with patch.dict(os.environ, {'RWADAR_QA_EMAIL': 'qa@example.invalid'}): scope['exact_qa_account']()
        self.assertEqual(ui.tops, 2); self.assertEqual(ui.position, 0)
        self.assertIs(ui.inspect_login_input_values, original); self.assertTrue(ui.CAPTURE_ALLOWED)

    def test_offline_wait_observes_async_disconnect_and_stops_on_deadline(self):
        class Clock:
            now = 0
            def monotonic(self): return self.now
            def sleep(self, seconds): self.now += seconds
        clock = Clock(); calls = []
        def adb(*args):
            calls.append(args)
            return 'Active default network: 100' if len(calls) == 1 else 'Active default network: none'
        scope = functions(['wait_offline_default_network'], {'time': clock, 'ui': types.SimpleNamespace(adb=adb)})
        scope['wait_offline_default_network'](); self.assertEqual(len(calls), 2)
        self.assertEqual(clock.now, .5)
        scope['ui'].adb = lambda *args: 'Active default network: 100'
        with self.assertRaises(AssertionError): scope['wait_offline_default_network']()
        self.assertLessEqual(clock.now, 10.5)

    def test_ambiguous_save_cleanup_reloads_and_verifies_before_only_qa_delete(self):
        events = []; qa = 'QA_APK23_CLOUD_TEST'
        class UI:
            def wait_ui(self, *args, **kwargs):
                if args == ('Eliminar inversión', qa):
                    return ET.fromstring('<hierarchy><node class="android.widget.Button" text="Eliminar" visible="true" bounds="[1,1][3,3]"/></hierarchy>')
                return ET.fromstring('<hierarchy/>')
            def adb(self, *args): events.append(('adb', args))
            def scroll_top(self): events.append(('top',))
            def visible_text(self, root): return 'Tu resumen '+qa
        scope = functions(['remove_qa_position'], {'ui': UI(), 'scroll_top_ready': lambda: events.append(('top',)), 'QA_NAME': qa, 'created': True, 'report': {},
            'reopen': lambda: events.append(('reopen',)),
            'exact_qa_account': lambda: events.append(('identity',)),
            'click': lambda label: events.append(('click', label)),
            'bounds': lambda node: [1,1,3,3], 'visible': lambda node: True,
            'locate': lambda label: ET.fromstring('<hierarchy/>'), 'persist': lambda: None, 'capture': lambda name: None,
            'qa_fixture_absent': lambda root: True,
            'wait_mutation_confirmation': lambda message,**kw: events.append(('confirm',message)),
            'wait_empty_portfolio_ready': lambda: ET.fromstring('<hierarchy/>')})
        scope['remove_qa_position']()
        self.assertEqual(events[:2], [('reopen',), ('identity',)])
        self.assertIn(('click', 'Movimientos de '+qa), events)
        self.assertIn(('click', 'Eliminar inversión · '+qa), events)
        self.assertFalse(scope['created']); self.assertTrue(scope['report']['qaPortfolioRemoved'])

if __name__ == '__main__': unittest.main()
