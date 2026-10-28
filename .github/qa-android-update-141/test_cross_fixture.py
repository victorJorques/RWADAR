import ast, email.message, json, os, pathlib, re, types, unittest, urllib.request
from unittest.mock import patch

class CrossFixture(unittest.TestCase):
    def fixture(self, change=None, oversized=False):
        uid='11111111-1111-4111-8111-111111111111'; calls=[]; handlers=[]
        position={'nombre':'QA_APK23_CLOUD_TEST','moneda':'EUR','valoracion':{'precio':'1.1','origen':'manual'},
          'movimientos':[{'tipo':'compra','cantidad':'2','precio':'1','comision':'0'},{'tipo':'cobro','importe':'0.1'}]}
        if change: position.update(change)
        def require(value, message):
            if not value: raise AssertionError(message)
        class Response:
            status=200
            def __init__(self,body,cookie=False):
                self.body=body; self.headers=email.message.Message()
                if cookie:self.headers['Set-Cookie']='__Host-rwadar-acceso=aaa.bbb.ccc; Path=/; HttpOnly; Secure; SameSite=Lax'
            def __enter__(self):return self
            def __exit__(self,*args):return False
            def read(self,limit):return self.body[:limit]
        def open_request(req,timeout):
            route=req.full_url.rsplit('/',1)[1]; calls.append((route,req.get_method(),timeout))
            self.assertTrue(req.full_url.startswith('https://rwadar.pages.dev/api/acceso/'))
            if route=='entrar':return Response(json.dumps({'autenticada':True,'usuario':{'id':uid}}).encode(),True)
            self.assertEqual(req.get_header('Cookie'),'__Host-rwadar-acceso=aaa.bbb.ccc')
            if route=='sesion':return Response(json.dumps({'autenticada':True,'usuario':{'id':uid}}).encode())
            if route=='salir':return Response(b'{"cerrado":true,"cierreRemoto":true}')
            self.assertEqual(req.get_header('X-rwadar-usuario'),uid)
            return Response(b'x'*(128*1024+1) if oversized else json.dumps({'version':3,'posiciones':[position]}).encode())
        def build(handler):handlers.append(handler);return types.SimpleNamespace(open=open_request)
        scope={'require':require,'require_qa_identity':lambda env,require_email:require(env['QA_USER_ID']==uid,'Wrong QA'),
            'os':os,'urllib':urllib,'json':json,'re':re,'QA_NAME':'QA_APK23_CLOUD_TEST'}
        tree=ast.parse(pathlib.Path(__file__).with_name('run.py').read_text(encoding='utf-8'))
        selected=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='production_bff_same_fixture']
        exec(compile(ast.Module(body=selected,type_ignores=[]),'cross-client-fixture','exec'),scope)
        env={'QA_USER_ID':uid,'RWADAR_QA_EMAIL':'qa@example.invalid','RWADAR_QA_PASSWORD':'fake-local-test'}
        def run():
            with patch.dict(os.environ,env),patch.object(urllib.request,'build_opener',side_effect=build):
                return scope['production_bff_same_fixture']()
        return run,calls,handlers
    def test_fixed_reads_actual_body_and_local_logout_only_boolean_proof(self):
        run,calls,handlers=self.fixture();proof=run()
        self.assertTrue(proof and all(v is True for v in proof.values()))
        self.assertEqual(calls,[('entrar','POST',10),('sesion','GET',10),('cartera','GET',10),('salir','POST',10)])
        self.assertIsNone(handlers[0].redirect_request(None,None,None,None,None,None))
    def test_wrong_fixture_still_closes_only_web_session(self):
        run,calls,_=self.fixture({'nombre':'otra-inversion'})
        with self.assertRaisesRegex(AssertionError,'QA fixture identity mismatch'):run()
        self.assertEqual(calls[-1],('salir','POST',10))
    def test_response_cap_still_logs_out_without_exposing_body(self):
        run,calls,_=self.fixture(oversized=True)
        with self.assertRaisesRegex(RuntimeError,'sensitive response withheld'):run()
        self.assertEqual(calls[-1],('salir','POST',10))

if __name__=='__main__':unittest.main()
