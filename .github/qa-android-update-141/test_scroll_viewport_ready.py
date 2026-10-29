import ast,os,pathlib,types,unittest,xml.etree.ElementTree as ET
from unittest.mock import patch
TREE=ast.parse(pathlib.Path(__file__).with_name('run.py').read_text(encoding='utf-8'))
def load(names,scope):
    nodes=[n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name in names]
    assert {n.name for n in nodes}==set(names)
    def require(value,message):
        if not value:raise AssertionError(message)
    scope.update(ET=ET,os=os,require=require)
    exec(compile(ast.Module(body=nodes,type_ignores=[]),'run.py','exec'),scope)
    return scope
class Clock:
    def __init__(self):self.now=0
    def monotonic(self):return self.now
    def sleep(self,seconds):self.now+=seconds
class Viewports(unittest.TestCase):
    def test_transient_viewport_waits_read_only_then_scrolls_with_real_observation(self):
        clock=Clock();events=[]
        class UI:
            def dump(self,timeout):events.append('dump');return len(events)
            def display_size(self):return (390,844)
            def observed_scroll_viewport(self,root,size):
                if clock.now<1:raise AssertionError('Need one fully observed outer vertical scroll viewport')
                events.append('viewport-observed');return ('actual-node',[0,0,390,800])
            def scroll_top(self):events.append('scroll-top')
        scope=load(['wait_scroll_viewport','scroll_top_ready'],{'ui':UI(),'time':clock})
        scope['scroll_top_ready']()
        self.assertEqual(clock.now,1);self.assertEqual(events[-2:],['viewport-observed','scroll-top'])
    def test_timeout_has_no_gesture_and_other_assertions_are_not_swallowed(self):
        clock=Clock();gestures=[]
        ui=types.SimpleNamespace(dump=lambda **kw:None,display_size=lambda:(390,844),scroll_top=lambda:gestures.append(True))
        def missing(*args):raise AssertionError('Need one fully observed outer vertical scroll viewport')
        ui.observed_scroll_viewport=missing
        scope=load(['wait_scroll_viewport','scroll_top_ready'],{'ui':ui,'time':clock})
        with self.assertRaisesRegex(AssertionError,'within deadline'):scope['scroll_top_ready'](timeout=1)
        self.assertEqual(clock.now,1);self.assertEqual(gestures,[])
        def other(*args):raise AssertionError('A different security assertion')
        ui.observed_scroll_viewport=other
        with self.assertRaisesRegex(AssertionError,'different security'):scope['scroll_top_ready']()
    def test_hard_deadline_baseexception_escapes_immediately(self):
        class Deadline(BaseException):pass
        def expired(**kwargs):raise Deadline()
        scope=load(['wait_scroll_viewport','scroll_top_ready'],{'ui':types.SimpleNamespace(dump=expired),'time':Clock()})
        with self.assertRaises(Deadline):scope['scroll_top_ready']()
    def test_fully_visible_exact_email_returns_without_any_scroll(self):
        class UI:
            APP_PACKAGE='com.rwadar.app';CAPTURE_ALLOWED=True
            inspect_login_input_values=staticmethod(lambda raw:None)
            def dump(self):
                self.assert_capture_off=not self.CAPTURE_ALLOWED
                raw='<hierarchy><node package="com.rwadar.app" text="qa@example.invalid" visible="true"/></hierarchy>'
                self.inspect_login_input_values(raw);return ET.fromstring(raw.replace('qa@example.invalid','REDACTED'))
        ui=UI();original=ui.inspect_login_input_values
        def forbidden():raise AssertionError('Visible account must not scroll')
        scope=load(['exact_qa_account'],{'ui':ui,'click':lambda label:None,'visible':lambda n:True,'scroll_top_ready':forbidden})
        with patch.dict(os.environ,{'RWADAR_QA_EMAIL':'qa@example.invalid'}):scope['exact_qa_account']()
        self.assertTrue(ui.assert_capture_off);self.assertTrue(ui.CAPTURE_ALLOWED);self.assertIs(ui.inspect_login_input_values,original)
if __name__=='__main__':unittest.main()
