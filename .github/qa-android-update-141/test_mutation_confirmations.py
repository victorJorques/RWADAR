import ast,pathlib,re,types,unittest,xml.etree.ElementTree as ET
SOURCE=pathlib.Path(__file__).with_name('run.py')
def load(names,scope):
    nodes=[n for n in ast.parse(SOURCE.read_text(encoding='utf-8')).body if isinstance(n,ast.FunctionDef) and n.name in names]
    assert {n.name for n in nodes}==set(names)
    def require(value,message):
        if not value:raise AssertionError(message)
    scope.update(require=require,re=re)
    if 'ui' in scope:scope.setdefault('scroll_top_ready',scope['ui'].scroll_top)
    exec(compile(ast.Module(body=nodes,type_ignores=[]),'run.py','exec'),scope)
    return scope

class Confirmations(unittest.TestCase):
    def test_scroll_to_top_precedes_wait_and_success_is_actually_observed(self):
        events=[];root=ET.fromstring('<hierarchy><node text="Movimiento guardado." visible="true"/></hierarchy>')
        class UI:
            def scroll_top(self):events.append('top')
            def wait_ui(self,message,timeout):events.append(('wait',message));return root
            def visible_text(self,root):return '\n'.join(n.get('text','') for n in root.iter('node') if n.get('visible')!='false')
        scope=load(['wait_mutation_confirmation'],{'ui':UI(),'report':{'phase':'register-qa-purchase'},'persist':lambda:None})
        self.assertIs(scope['wait_mutation_confirmation']('Movimiento guardado.'),root)
        self.assertEqual(events,['top',('wait','Movimiento guardado.')])
        self.assertEqual(scope['report']['mutationObservations']['register-qa-purchase'],{'successVisible':True,'saveErrorPresent':False,'saveErrorVisible':False})

    def test_hidden_real_save_error_is_reported_as_failure_without_exposing_values(self):
        root=ET.fromstring('<hierarchy><node text="No se pudo confirmar el guardado. PRIVATE_DATA" visible="false"/></hierarchy>')
        class UI:
            def scroll_top(self):pass
            def wait_ui(self,*args,**kw):raise AssertionError('Not visible')
            def dump(self,timeout):return root
            def visible_text(self,root):return ''
        scope=load(['wait_mutation_confirmation'],{'ui':UI(),'report':{'phase':'record-manual-price'},'persist':lambda:None})
        with self.assertRaisesRegex(AssertionError,'static phase'):scope['wait_mutation_confirmation']('Precio y fecha guardados.')
        report=scope['report'];self.assertEqual(report['mutationFailureCode'],'portfolio-save-rejected')
        self.assertTrue(report['mutationObservations']['record-manual-price']['saveErrorPresent'])
        self.assertFalse(report['mutationObservations']['record-manual-price']['saveErrorVisible'])
        self.assertNotIn('PRIVATE_DATA',str(report))

    def test_hidden_success_is_not_a_pass_and_fixture_scan_includes_offscreen_nodes(self):
        hidden=ET.fromstring('<hierarchy><node text="Movimiento guardado." visible="false"/><node content-desc="Movimientos de QA_ONLY" visible="false"/></hierarchy>')
        class UI:
            def scroll_top(self):pass
            def wait_ui(self,*args,**kwargs):raise AssertionError('Not visible')
            def dump(self,timeout):return hidden
            def visible_text(self,root):return ''
        scope=load(['qa_fixture_absent','wait_mutation_confirmation'],{'QA_NAME':'QA_ONLY','ui':UI(),'report':{'phase':'record-qa-income'},'persist':lambda:None})
        with self.assertRaises(AssertionError):scope['wait_mutation_confirmation']('Movimiento guardado.')
        self.assertEqual(scope['report']['mutationFailureCode'],'mutation-confirmation-not-observed')
        self.assertFalse(scope['qa_fixture_absent'](hidden))
        self.assertTrue(scope['qa_fixture_absent'](ET.fromstring('<hierarchy><node text="Sin compras"/></hierarchy>')))

    def test_already_removed_fixture_requires_loaded_empty_portfolio_before_acceptance(self):
        events=[]
        class UI:
            def wait_ui(self,*args,**kwargs):events.append(('wait',args,kwargs));return ET.fromstring('<hierarchy><node text="Sin compras"/></hierarchy>')
            def scroll_top(self):events.append(('top',))
            def visible_text(self,root):return 'Tu resumen Sin compras'
        scope=load(['remove_qa_position','qa_fixture_absent'],{'ui':UI(),'QA_NAME':'QA_APK23_CLOUD_ONLY','created':True,'report':{},
          'reopen':lambda:events.append(('reopen',)),'exact_qa_account':lambda:events.append(('identity',)),
          'click':lambda label:events.append(('click',label)),'persist':lambda:None})
        scope['remove_qa_position']()
        self.assertFalse(scope['created']);self.assertTrue(scope['report']['qaPortfolioRemoved'])
        self.assertTrue(scope['report']['qaFixtureAlreadyAbsentAfterReload'])
        self.assertFalse(any(event[0]=='click' and 'Eliminar' in event[1] for event in events))
        self.assertTrue(any(event[0]=='wait' and event[2].get('absent')==('Cargando mis inversiones',) for event in events))

if __name__=='__main__':unittest.main()
