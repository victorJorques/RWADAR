"""Bounded offline checks of the real asynchronous native portfolio gate."""
import ast, pathlib, types, unittest, xml.etree.ElementTree as ET


def load(ui, clock, locate):
    source=pathlib.Path(__file__).with_name('run.py').read_text(encoding='utf-8')
    tree=ast.parse(source)
    functions=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='wait_empty_portfolio_ready']
    assert len(functions)==1
    def require(value,message):
        if not value:raise AssertionError(message)
    scope={'ui':ui,'time':clock,'locate':locate,'require':require}
    exec(compile(ast.Module(body=functions,type_ignores=[]),'real-portfolio-wait','exec'),scope)
    return scope['wait_empty_portfolio_ready']


class Clock:
    def __init__(self):self.now=0
    def monotonic(self):return self.now
    def sleep(self,seconds):self.now+=seconds


class UI:
    def __init__(self,states):self.states=states;self.index=0;self.current=None;self.tops=0;self.dumps=0
    def scroll_top(self):self.tops+=1
    def dump(self,timeout):
        assert 0<timeout<=8
        self.current=self.states[min(self.index,len(self.states)-1)];self.index+=1;self.dumps+=1
        return ET.fromstring('<hierarchy><node text="'+self.current[0]+'"/><node text="Registrar inversión" enabled="'+str(self.current[1]).lower()+'"/></hierarchy>')
    def visible_text(self,root):return '\n'.join(n.get('text','') for n in root.iter('node'))
    def find_node(self,root,label):
        return next(n for n in root.iter('node') if n.get('text')==label),[1,1,3,3]


class PortfolioReady(unittest.TestCase):
    def test_spinner_then_loaded_summary_advances_only_after_ready(self):
        ui=UI([('Cargando mis inversiones',False),('Tu resumen Sin compras',True)])
        clock=Clock();searched=[]
        def locate(label):
            self.assertEqual(ui.current,('Tu resumen Sin compras',True));searched.append(label)
            return ui.dump(timeout=1)
        result=load(ui,clock,locate)()
        self.assertEqual(searched,['Registrar inversión']);self.assertEqual(clock.now,.5)
        self.assertEqual(ui.tops,1);self.assertIsNotNone(result)

    def test_loaded_but_disabled_control_does_not_advance(self):
        ui=UI([('Tu resumen Sin compras',False),('Tu resumen Sin compras',True)])
        clock=Clock();searched=[]
        def locate(label):
            searched.append(label)
            return ET.fromstring('<hierarchy><node text="Registrar inversión" enabled="'+str(ui.current[1]).lower()+'"/></hierarchy>')
        load(ui,clock,locate)()
        self.assertEqual(len(searched),2);self.assertEqual(clock.now,.5)

    def test_visible_real_loading_error_fails_without_search_or_form(self):
        ui=UI([('No se pudieron leer tus inversiones. No se sobrescribirá lo guardado.',False)])
        def forbidden(_):raise AssertionError('Must not search or advance to the form')
        with self.assertRaisesRegex(AssertionError,'real loading error'):load(ui,Clock(),forbidden)()
        self.assertEqual(ui.dumps,1)

    def test_persistent_spinner_has_a_real_bounded_deadline(self):
        ui=UI([('Cargando mis inversiones',False)]);clock=Clock()
        def forbidden(_):raise AssertionError('Must not search or advance during loading')
        with self.assertRaisesRegex(AssertionError,'bounded wait'):load(ui,clock,forbidden)(timeout=2)
        self.assertEqual(clock.now,2);self.assertEqual(ui.dumps,4)

    def test_portfolio_wait_precedes_first_register_click(self):
        source=pathlib.Path(__file__).with_name('run.py').read_text(encoding='utf-8')
        tree=ast.parse(source);function=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='portfolio')
        operations=[n.value for n in ast.walk(function) if isinstance(n,ast.Expr) and isinstance(n.value,ast.Call)]
        wait=next(n.lineno for n in operations if isinstance(n.func,ast.Name) and n.func.id=='wait_empty_portfolio_ready')
        register=next(n.lineno for n in operations if isinstance(n.func,ast.Name) and n.func.id=='click' and n.args and isinstance(n.args[0],ast.Constant) and n.args[0].value=='Registrar inversión')
        self.assertLessEqual(wait,register)


if __name__=='__main__':unittest.main()
