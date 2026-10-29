import ast,json,os,pathlib,subprocess,types,unittest
from unittest.mock import patch
TREE=ast.parse(pathlib.Path(__file__).with_name('run.py').read_text(encoding='utf-8'))
KEYS={'productionBffObserved','sameExpectedAccount','sameUniqueName','sameCurrency','samePurchase','sameManualPrice','sameIncome','webLocalLogoutConfirmed'}
def load(names,scope):
    nodes=[n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name in names]
    assert {n.name for n in nodes}==set(names)
    def require(value,message):
        if not value:raise AssertionError(message)
    scope.update(require=require,require_qa_identity=lambda *a,**kw:None,os=os,json=json,ROOT=pathlib.Path(__file__).parent)
    exec(compile(ast.Module(body=nodes,type_ignores=[]),'run.py','exec'),scope)
    return scope
class CrossFixtureNode(unittest.TestCase):
    def test_wrapper_accepts_only_boolean_proof_and_credentials_are_not_arguments(self):
        calls=[];proof={key:True for key in KEYS}
        def run(args,**kwargs):
            calls.append((args,kwargs));return types.SimpleNamespace(returncode=0,stdout=json.dumps({'status':'passed','proof':proof,'cleanupConfirmed':True}).encode())
        scope=load(['production_bff_same_fixture'],{})
        with patch.object(subprocess,'run',side_effect=run):self.assertEqual(scope['production_bff_same_fixture'](),proof)
        args,kwargs=calls[0];self.assertEqual(args[0],'node');self.assertTrue(args[1].endswith('production-bff-native-fixture.cjs'))
        self.assertNotIn('env',kwargs);self.assertEqual(kwargs,{'capture_output':True,'timeout':55,'check':False})
    def test_failed_node_result_preserves_only_static_http_diagnosis(self):
        report={};scope=load(['production_bff_same_fixture'],{'report':report,'persist':lambda:None})
        value={'status':'failed','failure':{'route':'entrar','kind':'http','status':403,'body':'NEVER_EXPORT'},'cleanupConfirmed':False}
        with patch.object(subprocess,'run',return_value=types.SimpleNamespace(returncode=1,stdout=json.dumps(value).encode())):
            with self.assertRaisesRegex(RuntimeError,'sensitive response withheld'):scope['production_bff_same_fixture']()
        self.assertEqual(report,{'bffFailure':{'route':'entrar','kind':'http','status':403}})
    def test_false_or_unknown_proof_cannot_pass(self):
        for proof in ({**{key:True for key in KEYS},'unapproved':True},{**{key:True for key in KEYS},'sameIncome':False}):
            scope=load(['production_bff_same_fixture'],{})
            result=types.SimpleNamespace(returncode=0,stdout=json.dumps({'status':'passed','proof':proof,'cleanupConfirmed':True}).encode())
            with patch.object(subprocess,'run',return_value=result),self.assertRaises(AssertionError):scope['production_bff_same_fixture']()
    def test_post_ota_gate_observes_loaded_summary_before_fixture_lookup(self):
        calls=[]
        ui=types.SimpleNamespace(wait_ui=lambda *args,**kwargs:calls.append(('wait',args,kwargs)))
        scope=load(['wait_saved_portfolio_after_cold_launch'],{'ui':ui,'scroll_top_ready':lambda:calls.append(('top',))})
        scope['wait_saved_portfolio_after_cold_launch']()
        self.assertEqual(calls,[('top',),('wait',('Tu resumen',),{'timeout':30,'absent':('Cargando mis inversiones',)})])
        function=next(n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name=='portfolio')
        expressions=[n for n in ast.walk(function) if isinstance(n,ast.Call)]
        gate_line=next(n.lineno for n in expressions if isinstance(n.func,ast.Name) and n.func.id=='wait_saved_portfolio_after_cold_launch')
        locate_line=next(n.lineno for n in expressions if isinstance(n.func,ast.Name) and n.func.id=='locate' and n.args and isinstance(n.args[0],ast.Name) and n.args[0].id=='QA_NAME')
        self.assertLess(gate_line,locate_line)
if __name__=='__main__':unittest.main()
