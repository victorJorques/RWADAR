import ast, contextlib, io, pathlib, unittest

source=pathlib.Path(__file__).with_name('ota.py').read_text(encoding='utf-8')
function=next(n for n in ast.parse(source).body if isinstance(n,ast.FunctionDef) and n.name=='prepare_device')

class Clock:
    def __init__(self):self.now=0
    def monotonic(self):return self.now
    def sleep(self,seconds):self.now+=seconds

class UI:
    def __init__(self,states,uid='0',root_error=False,userdebug='userdebug'):
        self.states=list(states);self.uid=uid;self.root_error=root_error;self.userdebug=userdebug;self.calls=[]
    def adb(self,*args,timeout):
        self.calls.append(args);assert 0<timeout<=4
        if args==('shell','getprop','ro.kernel.qemu'):return '1'
        if args==('shell','getprop','ro.build.type'):return self.userdebug
        if args==('root',):
            if self.root_error:raise RuntimeError('Sensitive transport details must never be printed')
            return 'restarting adbd as root'
        if args==('get-state',):
            state=self.states.pop(0) if len(self.states)>1 else self.states[0]
            if state=='transport-error':raise RuntimeError('Sensitive transport details must never be printed')
            return state
        if args==('shell','id','-u'):return self.uid
        raise AssertionError('Unexpected command')

def run(ui,clock,timeout=2):
    scope={'time':clock};exec(compile(ast.Module(body=[function],type_ignores=[]),'proposed-adbd-reconnect','exec'),scope)
    return scope['prepare_device'](ui,timeout=timeout)

class AdbdReconnect(unittest.TestCase):
    def test_root_transport_race_then_offline_device_uid0(self):
        ui=UI(['transport-error','offline','device'],root_error=True);clock=Clock();logs=io.StringIO()
        with contextlib.redirect_stdout(logs):run(ui,clock)
        self.assertEqual(clock.now,1)
        self.assertEqual(ui.calls.count(('root',)),1)
        self.assertEqual(ui.calls[-1],('shell','id','-u'))
        self.assertIn('root-ready',logs.getvalue());self.assertNotIn('Sensitive',logs.getvalue())

    def test_already_root_ready_requires_observed_device_and_uid0(self):
        ui=UI(['device']);clock=Clock()
        with contextlib.redirect_stdout(io.StringIO()):run(ui,clock)
        self.assertEqual(clock.now,0)
        self.assertEqual(ui.calls[-2:],[('get-state',),('shell','id','-u')])

    def test_offline_or_nonroot_fails_at_bounded_deadline(self):
        for ui in (UI(['offline']),UI(['device'],uid='2000')):
            clock=Clock()
            with contextlib.redirect_stdout(io.StringIO()),self.assertRaisesRegex(AssertionError,'within deadline'):run(ui,clock)
            self.assertEqual(clock.now,2)

    def test_non_userdebug_rejected_before_root(self):
        ui=UI(['device'],userdebug='user')
        with contextlib.redirect_stdout(io.StringIO()),self.assertRaisesRegex(AssertionError,'userdebug'):run(ui,Clock())
        self.assertNotIn(('root',),ui.calls)

if __name__=='__main__':unittest.main()
