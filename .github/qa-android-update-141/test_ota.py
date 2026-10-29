import sqlite3,unittest,uuid
from types import SimpleNamespace
from unittest.mock import patch
import ota
class Controls(unittest.TestCase):
    OTA_SOURCE='28e954cb48500099e7ab84073272848cdaba0294'
    def git_fixture(self,mobile_changed=False,dirty=False):
        calls=[]
        def run(*args):
            calls.append(args)
            if args==('rev-parse','HEAD'):return SimpleNamespace(returncode=0,stdout=(self.OTA_SOURCE+'\n').encode())
            changed=args==('diff','--quiet',ota.SOURCE,self.OTA_SOURCE,'--','rwadar-movil') and mobile_changed
            status=b' M rwadar-movil/App.js\n' if args[0]=='status' and dirty else b''
            return SimpleNamespace(returncode=int(changed),stdout=status)
        return run,calls
    def test_distinct_real_nonmobile_commit_is_admitted(self):
        runner,calls=self.git_fixture()
        proof=ota.source_compatibility({'sourceHeadSha':ota.SOURCE},self.OTA_SOURCE,runner)
        self.assertEqual(proof['apkSourceHeadSha'],ota.SOURCE);self.assertEqual(proof['otaSourceHeadSha'],self.OTA_SOURCE)
        self.assertIn(('cat-file','-e',ota.SOURCE+'^{commit}'),calls)
        self.assertIn(('cat-file','-e',self.OTA_SOURCE+'^{commit}'),calls)
        self.assertIn(('diff','--quiet',ota.SOURCE,self.OTA_SOURCE,'--','rwadar-movil'),calls)
    def test_mobile_commit_change_or_dirty_mobile_is_rejected(self):
        for change in ({'mobile_changed':True},{'dirty':True}):
            runner,_=self.git_fixture(**change)
            with self.assertRaises(AssertionError):ota.source_compatibility({'sourceHeadSha':ota.SOURCE},self.OTA_SOURCE,runner)
    def meta(self):return {'updateId':'11111111-2222-3333-4444-555555555555','runtimeVersion':'1.4.1(23)'}
    def fixture(self,status=1,success=0,failed=0,runtime='1.4.1(23)',version=13):
        c=sqlite3.connect(':memory:');c.execute('PRAGMA user_version='+str(version))
        c.execute('CREATE TABLE updates(id BLOB PRIMARY KEY,runtime_version TEXT,status INTEGER,successful_launch_count INTEGER,failed_launch_count INTEGER,launch_asset_id INTEGER)')
        c.execute('INSERT INTO updates VALUES(?,?,?,?,?,?)',(uuid.UUID(self.meta()['updateId']).bytes,runtime,status,success,failed,17));return c
    def test_actual_uuid_blob_ready_and_launch_count(self):
        with self.fixture(success=2) as c:
            r=ota.parse_database(c,self.meta());self.assertEqual(r['status'],1);self.assertEqual(r['successfulLaunchCount'],2);self.assertEqual(r['updateId'],self.meta()['updateId'])
    def test_absent_id_is_not_a_download(self):
        with self.fixture() as c:
            c.execute('DELETE FROM updates');self.assertIsNone(ota.parse_database(c,self.meta()))
    def test_wrong_schema_runtime_or_failed_launch_rejected(self):
        for change in ({'version':12},{'runtime':'1.4.0(22)'},{'failed':1}):
            with self.fixture(**change) as c:
                with self.assertRaises(AssertionError):ota.parse_database(c,self.meta())
    def test_pending_before_accounts(self):
        with self.assertRaisesRegex(AssertionError,'OTA pending'):ota.load_ota({'sourceHeadSha':ota.SOURCE})
    def test_eas_android_id_is_selected_instead_of_group_id(self):
        row={'id':self.meta()['updateId'],'group':'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee','platform':'android',
          'runtimeVersion':'1.4.1(23)','gitCommitHash':self.OTA_SOURCE,'createdAt':'2026-10-28T18:00:00Z','isRollBackToEmbedded':False}
        runner,_=self.git_fixture()
        with patch.object(ota,'git_result',side_effect=runner):m=ota.metadata_from_eas_json([row],{'sourceHeadSha':ota.SOURCE})
        self.assertEqual(m['updateId'],row['id']);self.assertEqual(m['groupId'],row['group'])
        self.assertEqual(m['apkSourceHeadSha'],ota.SOURCE);self.assertEqual(m['otaSourceHeadSha'],self.OTA_SOURCE)
        self.assertEqual(m['easGitCommitHash'],row['gitCommitHash']);self.assertEqual(row['gitCommitHash'],self.OTA_SOURCE)
        runner,_=self.git_fixture(mobile_changed=True)
        with patch.object(ota,'git_result',side_effect=runner):
            with self.assertRaises(AssertionError):ota.metadata_from_eas_json([row],{'sourceHeadSha':ota.SOURCE})
if __name__=='__main__':unittest.main()
