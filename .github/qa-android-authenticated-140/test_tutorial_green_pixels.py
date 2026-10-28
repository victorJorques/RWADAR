"""Offline detector checks on a historical real screenshot; no native QA result."""
import hashlib,io,json,os,pathlib,unittest
from PIL import Image,ImageDraw
from tutorial_ocr_140 import dimensions,parse_tsv,phrases,step_and_control,green_button_box

@unittest.skipUnless(os.environ.get('RWADAR_OCR_REAL_DIR'),'Provide the saved real screenshot/TSV directory')
class GreenPixels(unittest.TestCase):
    def setUp(self):
        folder=pathlib.Path(os.environ['RWADAR_OCR_REAL_DIR']);self.png=(folder/'ocr-working.png').read_bytes()
        self.words=parse_tsv((folder/'ocr-working.tsv.txt').read_text(encoding='utf-8'),dimensions(self.png))
        self.progress=phrases(self.words,'Paso 1 de 4')[0]

    def test_real_screenshot_uses_observed_green_pixels_without_fabricating_ocr_confidence(self):
        self.assertIsNone(step_and_control(self.words,1),'Original text-only method must reproduce the observed miss')
        proof=step_and_control(self.words,1,self.png)
        # Golden bbox measured independently on this exact immutable fixture;
        # the runtime detector calculates it from pixels and contains no coordinates.
        self.assertEqual(proof['control']['box'],[559,1889,1040,2015])
        self.assertIsNone(proof['control']['confidence']);self.assertEqual(proof['control']['controlObservationMethod'],'green-pixels-below-ocr-progress')
        self.assertIsNone(step_and_control(self.words,2,self.png))
        print(json.dumps({'scope':'offline-detector-on-real-run40692619149-PNG','sourcePngSha256':hashlib.sha256(self.png).hexdigest(),
          'observedBox':proof['control']['box'],'ocrConfidence':None,'progressConfidence':proof['progress']['confidence'],'deviceOrCiExecuted':False}))

    def test_two_large_green_regions_are_rejected(self):
        # Unit-only ambiguity input: keep the real image in memory and add a
        # second region. It is never saved or emitted as device evidence.
        image=Image.open(io.BytesIO(self.png)).convert('RGB');ImageDraw.Draw(image).rectangle((40,1890,500,2014),fill=(37,227,154))
        buffer=io.BytesIO();image.save(buffer,format='PNG')
        self.assertIsNone(green_button_box(buffer.getvalue(),self.progress['box']))
        self.assertIsNone(step_and_control(self.words,1,buffer.getvalue()))

if __name__=='__main__':unittest.main()
