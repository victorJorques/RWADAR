"""SDK57 own Updates DB only; never inspect SecureStore or another package."""
import datetime,json,os,pathlib,re,sqlite3,subprocess,tempfile,time,uuid
ROOT=pathlib.Path(__file__).resolve().parent
SOURCE='c1f7106a49e988ca1dde214f0e75b7fe7d4d2719'
DB='/data/user/0/com.rwadar.app/databases/updates.db'

def git_result(*args):
    return subprocess.run(['git',*args],cwd=ROOT.parent.parent,check=False,capture_output=True,timeout=30)

def source_compatibility(candidate,ota_source=None,runner=None):
    runner=runner or git_result
    apk_source=candidate['sourceHeadSha']
    assert apk_source==SOURCE,'APK source identity must stay frozen'
    if ota_source is None:
        result=runner('rev-parse','HEAD');assert result.returncode==0
        ota_source=result.stdout.decode('utf-8').strip()
    assert isinstance(ota_source,str) and re.fullmatch(r'[a-f0-9]{40}',ota_source),'Actual full OTA git commit required'
    for commit in (apk_source,ota_source):
        assert runner('cat-file','-e',commit+'^{commit}').returncode==0,'Both real source commits must be available locally'
    assert runner('diff','--quiet',apk_source,ota_source,'--','rwadar-movil').returncode==0,'OTA commit changes mobile source from compiled APK'
    assert runner('diff','--quiet',apk_source,'HEAD','--','rwadar-movil').returncode==0,'Current committed mobile source differs from APK'
    status=runner('status','--porcelain','--','rwadar-movil')
    assert status.returncode==0 and not status.stdout.strip(),'Working mobile tree must be clean including untracked files'
    return {'apkSourceHeadSha':apk_source,'otaSourceHeadSha':ota_source,
            'mobileSourceIdentical':True,'workingMobileTreeClean':True}

def guard_publish(candidate):
    proof=source_compatibility(candidate)
    config=json.loads((ROOT.parent.parent/'rwadar-movil/app.json').read_text(encoding='utf-8'))['expo']
    eas=json.loads((ROOT.parent.parent/'rwadar-movil/eas.json').read_text(encoding='utf-8'))
    assert config['version']=='1.4.1' and config['android']['versionCode']==23 and config['android']['package']=='com.rwadar.app'
    assert config['runtimeVersion']=={'policy':'nativeVersion'} and config['updates']['enabled'] is True
    assert config['updates']['url']=='https://u.expo.dev/43de8651-0c57-40fc-8cdb-c9a8c72e6835'
    assert eas['build']['editorial']['channel']=='production' and eas['build']['editorial']['environment']=='production'
    return {**proof,'runtimeVersion':'1.4.1(23)','channel':'production','publicationPerformed':False}

def metadata_from_eas_json(rows,candidate):
    assert isinstance(rows,list)
    android=[r for r in rows if r.get('platform')=='android']
    assert len(android)==1,'One actual Android platform update required'
    r=android[0]
    assert r['runtimeVersion']=='1.4.1(23)'
    proof=source_compatibility(candidate,r['gitCommitHash'])
    assert r.get('isRollBackToEmbedded') is False
    m={'schemaVersion':2,'status':'ready','platform':'android','updateId':r['id'],'groupId':r['group'],
       'runtimeVersion':r['runtimeVersion'],'channel':'production',**proof,
       'easGitCommitHash':r['gitCommitHash'],'publishedAt':r['createdAt']}
    assert str(uuid.UUID(m['updateId']))==m['updateId'] and str(uuid.UUID(m['groupId']))==m['groupId'] and m['updateId']!=m['groupId']
    return m

def load_ota(candidate,path=None):
    m=json.loads((pathlib.Path(path) if path else ROOT/'ota.json').read_text(encoding='utf-8'))
    assert m.get('status')=='ready','OTA pending: real Android ID required before account access'
    assert m['schemaVersion']==2 and m['platform']=='android' and m['channel']=='production'
    assert m['runtimeVersion']=='1.4.1(23)' and m['apkSourceHeadSha']==candidate['sourceHeadSha']==SOURCE
    assert m['easGitCommitHash']==m['otaSourceHeadSha'],'EAS real gitCommitHash must be retained unchanged'
    proof=source_compatibility(candidate,m['otaSourceHeadSha'])
    assert m['mobileSourceIdentical'] is True and m['workingMobileTreeClean'] is True
    assert str(uuid.UUID(m['updateId']))==m['updateId'] and str(uuid.UUID(m['groupId']))==m['groupId']
    assert m['updateId']!=m['groupId'],'Android platform ID required, not group ID'
    assert datetime.datetime.fromisoformat(m['publishedAt'].replace('Z','+00:00')).tzinfo
    return m

def parse_database(connection,meta):
    assert connection.execute('PRAGMA user_version').fetchone()==(13,),'SDK57 schema13 required'
    rows=connection.execute('SELECT id,runtime_version,status,successful_launch_count,failed_launch_count,launch_asset_id FROM updates WHERE id=?',(uuid.UUID(meta['updateId']).bytes,)).fetchall()
    assert len(rows)<=1
    if not rows:return None
    ident,runtime,status,successful,failed,asset=rows[0]
    assert ident==uuid.UUID(meta['updateId']).bytes and runtime==meta['runtimeVersion']
    assert type(status)is int and type(successful)is int and type(failed)is int and successful>=0 and failed==0
    return {'updateId':str(uuid.UUID(bytes=ident)),'runtimeVersion':runtime,'status':status,
      'successfulLaunchCount':successful,'failedLaunchCount':failed,'launchAssetPresent':asset is not None}

def prepare_device(ui):
    assert ui.adb('shell','getprop','ro.kernel.qemu').strip()=='1'
    assert ui.adb('shell','getprop','ro.build.type').strip()=='userdebug','Root restricted to disposable userdebug emulator'
    ui.adb('root');ui.adb('wait-for-device',timeout=20)
    assert ui.adb('shell','id','-u').strip()=='0','Emulator adbd root required for own DB read'

def read_stopped_db(ui,meta):
    ui.adb('shell','am','force-stop','com.rwadar.app')
    # The stopped process cannot change DB/WAL between these two exact-path reads.
    with tempfile.TemporaryDirectory(prefix='rwadar-updates-only-',dir=os.environ.get('RUNNER_TEMP') or os.getcwd()) as folder:
        for suffix,limit in (('',8*1024*1024),('-wal',16*1024*1024)):
            path=DB+suffix
            exists=subprocess.run(['adb','shell','test','-f',path],capture_output=True,timeout=8)
            if exists.returncode:
                assert suffix=='-wal','Own Updates DB missing';continue
            data=subprocess.run(['adb','exec-out','cat',path],check=True,capture_output=True,timeout=15).stdout
            assert len(data)<=limit and (data or suffix=='-wal'),'Bounded own DB read required'
            pathlib.Path(folder,'updates.db'+suffix).write_bytes(data)
        local=pathlib.Path(folder,'updates.db')
        connection=sqlite3.connect(local.as_uri()+'?mode=ro',uri=True)
        try:
            connection.execute('PRAGMA query_only=ON')
            return parse_database(connection,meta)
        finally:connection.close()
    # Temporary copies are deleted. Only selected update fields are retained.

def assert_not_downloaded(ui,meta):
    assert read_stopped_db(ui,meta) is None,'OTA already present offline: cannot prove a fresh download'

def prove_cold_launch(ui,meta,reopen,account_check):
    time.sleep(30)  # ON_LOAD automatic download; no fetch/reload API or product change.
    before=read_stopped_db(ui,meta)
    assert before and before['status']==1 and before['launchAssetPresent'],'Expected Android OTA must be READY/downloaded'
    reopen();ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=35);account_check()
    ui.screen('141-ota-cold-launch-account-retained',ui.dump());time.sleep(2)
    after=read_stopped_db(ui,meta)
    assert after and after['status']==1 and after['updateId']==before['updateId']
    assert after['successfulLaunchCount']>before['successfulLaunchCount'],'Same OTA ID must gain successful content-appeared launch after cold start'
    reopen();ui.wait_ui('Inicio','Buscar','Academy','Perfil',timeout=35);account_check()
    return {'androidUpdateId':meta['updateId'],'downloadObserved':True,'successfulColdLaunchObserved':True,
      'beforeSuccessfulLaunchCount':before['successfulLaunchCount'],'afterSuccessfulLaunchCount':after['successfulLaunchCount'],
      'apkSourceHeadSha':meta['apkSourceHeadSha'],'otaSourceHeadSha':meta['otaSourceHeadSha'],
      'easGitCommitHash':meta['easGitCommitHash'],'mobileSourceIdentical':True,
      'runtimeVersion':meta['runtimeVersion'],'onlyOwnUpdatesDatabaseRead':True}

if __name__=='__main__':
    import sys
    from gate import load_candidate
    if sys.argv[1:]==['guard-publish']:
        print(json.dumps(guard_publish(load_candidate()),indent=2))
    elif len(sys.argv)==3 and sys.argv[1]=='record-eas-json':
        meta=metadata_from_eas_json(json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8')),load_candidate())
        # Run only against JSON from the exact --channel production publication below.
        (ROOT/'ota.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
        load_ota(load_candidate())
        print('Recorded actual Android OTA identity and distinct real source commits; no network/account operation')
    else:raise AssertionError('Use guard-publish before OTA publication, or record-eas-json with its saved actual JSON')
