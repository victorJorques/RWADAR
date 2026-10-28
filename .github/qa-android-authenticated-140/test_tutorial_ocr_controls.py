"""Parser fixtures only. These TSV rows are unit inputs, never device QA evidence."""
import unittest
from tutorial_ocr_140 import parse_tsv,step_and_control,phrases,MIN_CONFIDENCE
HEAD='level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n'
def row(text,x,y,line=1,confidence=95,width=75):
    return f'5\t1\t1\t1\t{line}\t1\t{x}\t{y}\t{width}\t30\t{confidence}\t{text}\n'
def fixture(step=1):
    return HEAD+row('Paso',300,1600)+row(str(step),390,1600)+row('de',480,1600)+row('4',570,1600)+row('Siguiente',800,1600,width=150)

class OcrControls(unittest.TestCase):
    def test_real_tsv_parser_requires_actual_progress_and_unambiguous_control_boxes(self):
        parsed=parse_tsv(fixture(),(1080,2400));proof=step_and_control(parsed,1)
        self.assertEqual(proof['step'],1);self.assertEqual(proof['control']['box'],[800,1600,950,1630])
        self.assertGreaterEqual(proof['control']['confidence'],MIN_CONFIDENCE)
        self.assertIsNone(step_and_control(parsed,2))
        self.assertIsNone(step_and_control(parse_tsv(fixture()+row('Siguiente',800,1770,line=2,width=150),(1080,2400)),1))
        self.assertIsNotNone(step_and_control(parse_tsv(fixture()+row('Siguiente',300,600,line=2,width=150),(1080,2400)),1))
        self.assertIsNone(step_and_control(parse_tsv(fixture().replace('95\tSiguiente','20\tSiguiente'),(1080,2400)),1))
        self.assertIsNone(step_and_control(parse_tsv(fixture(4),(1080,2400)),4),'Disabled Siguiente must not authorize the final return')
        fourth=fixture(4)+row('Volver',400,1770,line=2)+row('a',490,1770,line=2,width=25)+row('Academy',530,1770,line=2,width=150)
        self.assertEqual(step_and_control(parse_tsv(fourth,(1080,2400)),4)['control']['box'],[400,1770,680,1800])

    def test_malformed_or_out_of_image_ocr_cannot_authorize_a_tap(self):
        with self.assertRaises(AssertionError):parse_tsv('not tesseract TSV',(1080,2400))
        with self.assertRaises(AssertionError):parse_tsv(HEAD+row('Siguiente',1000,1600,width=200),(1080,2400))
        with self.assertRaises(AssertionError):parse_tsv(HEAD+row('Siguiente',10,-20),(1080,2400))
        words=parse_tsv(HEAD+row('1',40,800,width=20)+row('·',70,800,width=10)+row('ENTERO',100,800,width=130),(1080,2400))
        self.assertEqual(len(phrases(words,'1 Entero')),1)

if __name__=='__main__':unittest.main()
