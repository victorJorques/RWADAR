"""One offline control: exact APK22-only reuse; original global tutorial failure preserved."""
import ast,hashlib,json,pathlib,re,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parent

class CompletedSessionReuse(unittest.TestCase):
    def test_same_apk22_scope_preserves_provenance_and_rejects_changed_inputs(self):
        source=(ROOT/'android-session-lock-140.py').read_text(encoding='utf-8');tree=ast.parse(source)
        nodes=[n for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id.startswith('SESSION_SCOPE_') for t in n.targets)]
        nodes+=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='reuse_completed_session_scope']
        namespace={'ROOT':ROOT,'hashlib':hashlib,'json':json,'pathlib':pathlib,'re':re}
        exec(compile(ast.Module(body=nodes,type_ignores=[]),'<actual-session-scope-reuse>','exec'),namespace)
        manifest=json.loads((ROOT/'baseline-c22-session-40682735526.json').read_text(encoding='utf-8'))
        candidate={**manifest['identity'],'status':'ready'};reuse=namespace['reuse_completed_session_scope']
        checks,metadata=reuse(candidate)
        self.assertEqual(list(checks),manifest['reusedChecks']);self.assertTrue(all(value is True for value in checks.values()))
        self.assertEqual(metadata['runId'],40682735526);self.assertEqual(metadata['originalStatus'],'failed');self.assertEqual(metadata['originalFailurePhase'],'tutorial')
        self.assertFalse(metadata['observationPerformedInThisRun']);self.assertTrue(metadata['inheritedFlagsReferToOriginalRun'])
        self.assertFalse(metadata['sessionAndPinRepeatedInCurrentRun']);self.assertFalse(metadata['postReopenCaptureSaved'])
        self.assertEqual(len(metadata['captures']),26);self.assertTrue(all(item['runId']==40682735526 for item in metadata['captures']))
        for key,value in [('status','not-ready'),('versionCode',21),('apkSha256','0'*64),('sourceHeadSha','0'*40),('easBuildId','changed'),('apkBytes',1),('certificateSha256','0'*64)]:
            with self.subTest(candidateField=key),self.assertRaises(AssertionError):reuse({**candidate,key:value})
        with tempfile.TemporaryDirectory(dir=ROOT) as folder:
            self.assertEqual(pathlib.Path(folder).resolve().parent,ROOT)
            changed=pathlib.Path(folder)/'raw.json';changed.write_text('{}',encoding='utf-8')
            with self.assertRaises(AssertionError):reuse(candidate,result_path=changed)
            with self.assertRaises(AssertionError):reuse(candidate,manifest_path=changed)
        main=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='main')
        calls={n.func.id for n in ast.walk(main) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name)}
        self.assertNotIn('session_and_lock',calls);self.assertNotIn('enter_system_pin',calls);self.assertNotIn('cancel_system_pin',calls)
        self.assertTrue({'login_confirmed','catalog_counts','reuse_completed_session_scope','tutorial','portfolio','logout_persisted'}<=calls)
        original=json.loads((ROOT/'baseline-c22-session-40682735526-result.json').read_text(encoding='utf-8'))
        self.assertEqual((original['status'],original['phase']),('failed','tutorial'));self.assertFalse(original['full20PointQA']);self.assertFalse(original['releaseApproved'])

if __name__=='__main__':unittest.main()
