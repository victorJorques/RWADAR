import ast,email.message,io,json,os,pathlib,re,socket,ssl,types,unittest,urllib.request,urllib.error
from unittest.mock import patch

tree=ast.parse(pathlib.Path(__file__).with_name('run.py').read_text(encoding='utf-8'))
selected=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ('bff_failure_only','production_bff_same_fixture')]
assert len(selected)==2

def scope():
    report={'status':'failed','releaseApproved':False};writes=[]
    def require(value,message):
        if not value:raise AssertionError(message)
    env={'urllib':urllib,'socket':socket,'ssl':ssl,'re':re,'json':json,'os':os,
         'require':require,'require_qa_identity':lambda *args,**kwargs:None,
         'report':report,'persist':lambda:writes.append(json.dumps(report))}
    exec(compile(ast.Module(body=selected,type_ignores=[]),'safe-bff-diagnostics','exec'),env)
    return env,report,writes

def http_error(status,retry=None):
    headers=email.message.Message();headers['Set-Cookie']='NEVER_PRINT'
    if retry is not None:headers['Retry-After']=retry
    return urllib.error.HTTPError('https://rwadar.pages.dev/api/acceso/entrar?secret=NEVER_PRINT',status,
                                  'NEVER_PRINT',headers,io.BytesIO(b'NEVER_PRINT'))

class BffDiagnostics(unittest.TestCase):
    def test_http_status_and_bounded_numeric_retry_after_only(self):
        env,_,_=scope();diagnose=env['bff_failure_only']
        self.assertEqual(diagnose('entrar',http_error(429,'120')),{'route':'entrar','kind':'http','status':429,'retryAfter':120})
        for status in (403,503):
            for retry in ('86401','-1','Mon, 29 Oct 2026','60 NEVER_PRINT','000000001'):
                self.assertEqual(diagnose('cartera',http_error(status,retry)),{'route':'cartera','kind':'http','status':status})
        self.assertIsNone(diagnose('entrar?secret=NEVER_PRINT',http_error(503)))

    def test_transport_reasons_are_whitelisted_without_messages(self):
        env,_,_=scope();diagnose=env['bff_failure_only']
        cases=((TimeoutError('NEVER_PRINT'),'timeout'),(ssl.SSLError('NEVER_PRINT'),'ssl'),
               (ConnectionRefusedError('NEVER_PRINT'),'connection'),(socket.gaierror('NEVER_PRINT'),'connection'),('NEVER_PRINT','other'))
        for reason,expected in cases:
            result=diagnose('sesion',urllib.error.URLError(reason))
            self.assertEqual(result,{'route':'sesion','kind':'url','reasonClass':expected})
            self.assertNotIn('NEVER_PRINT',json.dumps(result))
        self.assertEqual(diagnose('salir',TimeoutError('NEVER_PRINT')),{'route':'salir','kind':'timeout','reasonClass':'timeout'})

    def test_actual_bff_http_failure_persists_once_without_retry_and_keeps_failed(self):
        env,report,writes=scope();calls=[]
        def open_request(req,timeout):
            calls.append((req.full_url,req.get_method(),timeout));raise http_error(429,'60')
        with patch.dict(os.environ,{'QA_USER_ID':'local-qa','RWADAR_QA_EMAIL':'local@example.invalid','RWADAR_QA_PASSWORD':'NEVER_PRINT'}),\
             patch.object(urllib.request,'build_opener',return_value=types.SimpleNamespace(open=open_request)):
            with self.assertRaisesRegex(RuntimeError,'sensitive response withheld'):
                env['production_bff_same_fixture']()
        self.assertEqual(calls,[('https://rwadar.pages.dev/api/acceso/entrar','POST',10)])
        self.assertEqual(report['bffFailure'],{'route':'entrar','kind':'http','status':429,'retryAfter':60})
        self.assertEqual(report['status'],'failed');self.assertFalse(report['releaseApproved'])
        self.assertEqual(len(writes),1);self.assertNotIn('NEVER_PRINT',writes[0])

if __name__=='__main__':unittest.main()
