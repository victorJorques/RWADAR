"""Fresh current-APK identity gate. Read-only, except private evidence/GITHUB_ENV files."""
import base64,hashlib,json,os,pathlib,re,subprocess,sys,zipfile
ROOT=pathlib.Path(__file__).resolve().parent
CERT='f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72'
ASSET_MANIFEST_SHA='842b1960939bb78ee297c00478f676d8657385a5bc6f0265d2397e619738ca59'

def load_candidate(file=None):
    c=json.loads((pathlib.Path(file) if file else ROOT/'candidate-current.json').read_text(encoding='utf-8'))
    assert set(c)=={'schemaVersion','status','version','versionCode','package','sourceHeadSha','baselineSourceHeadSha','certificateSha256','apkUrl','apkSha256','apkBytes','easBuildId'},'Candidate schema mismatch'
    assert type(c['schemaVersion']) is int and c['schemaVersion']==1 and c['status']=='ready','Current APK not ready: actual finished build identity is required'
    assert c['version']=='1.4.0' and type(c['versionCode']) is int and c['versionCode']>=21 and c['package']=='com.rwadar.app'
    assert isinstance(c['sourceHeadSha'],str) and re.fullmatch(r'[a-f0-9]{40}',c['sourceHeadSha'])
    assert isinstance(c['baselineSourceHeadSha'],str) and re.fullmatch(r'[a-f0-9]{40}',c['baselineSourceHeadSha'])
    assert c['certificateSha256']==CERT,'Existing signing identity must be preserved'
    assert isinstance(c['apkUrl'],str) and re.fullmatch(r'https://expo\.dev/artifacts/eas/[A-Za-z0-9_-]+\.apk',c['apkUrl'])
    assert isinstance(c['apkSha256'],str) and re.fullmatch(r'[a-f0-9]{64}',c['apkSha256'])
    assert type(c['apkBytes']) is int and 32*1024*1024<=c['apkBytes']<=160*1024*1024
    assert isinstance(c['easBuildId'],str) and re.fullmatch(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}',c['easBuildId'])
    return c

def git(*args):
    return subprocess.run(['git',*args],check=True,capture_output=True,timeout=30).stdout.decode('utf-8').strip()

def source_guard(c):
    source=c['sourceHeadSha']
    assert not git('diff','--name-only',source,'HEAD','--','rwadar-movil'),'Mobile source differs from the actual compiled candidate'
    assert not git('diff','--name-only','HEAD','--','rwadar-movil'),'Uncommitted mobile source'
    assert not git('ls-files','--others','--exclude-standard','--','rwadar-movil'),'Untracked mobile source'
    return {'sourceHeadSha':source,'workingMobileTreeMatchesCandidateSource':True,
      'historicalEvidenceIsSeparate':True,'historicalApkIdentityReused':False}

def prepare():
    c=load_candidate()  # Must fail before network or environment output while not-ready.
    assert git('remote','get-url','origin') in ('https://github.com/victorJorques/RWADAR','https://github.com/victorJorques/RWADAR.git')
    token=os.environ.get('GH_TOKEN');assert token,'Read-only Actions credential required'
    env=os.environ.copy();env.update({'GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'http.https://github.com/.extraheader',
      'GIT_CONFIG_VALUE_0':'AUTHORIZATION: basic '+base64.b64encode(('x-access-token:'+token).encode()).decode(),'GIT_TERMINAL_PROMPT':'0'})
    try:
        p=subprocess.run(['git','fetch','--depth=1','--filter=blob:none','--no-tags','--no-recurse-submodules','origin',c['sourceHeadSha']],
          env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=90)
        assert p.returncode==0,'Unable to read frozen candidate source'
    finally:env.pop('GIT_CONFIG_VALUE_0',None);token=None
    proof=source_guard(c);out=pathlib.Path('evidence-private');out.mkdir(exist_ok=True)
    (out/'candidate-current-source.json').write_text(json.dumps(proof,indent=2),encoding='utf-8')
    assert os.environ.get('GITHUB_ENV')
    with open(os.environ['GITHUB_ENV'],'a',encoding='utf-8') as target:
        for key,value in [('APK_URL',c['apkUrl']),('APK_SHA256',c['apkSha256']),('APK_BYTES',c['apkBytes'])]:target.write(key+'='+str(value)+'\n')
    print('Frozen current-APK source checked; no build, account or publication action')

def command(*args):
    return subprocess.run(list(map(str,args)),check=True,capture_output=True,timeout=40).stdout.decode('utf-8',errors='strict')

def check_native_metadata(c, signature, badging):
    # Version comes only from the fully validated current-candidate file.
    assert re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([0-9a-f]{64})$',signature,re.M)==[CERT]
    assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
    match=re.search(r"^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging,re.M)
    assert match and match.groups()==(c['package'],str(c['versionCode']),c['version']),'Actual current-APK native identity mismatch'
    assert re.search(r"^sdkVersion:'24'$",badging,re.M),'Unexpected minSdk'

def identity(apk):
    c=load_candidate();apk=pathlib.Path(apk);assert apk.stat().st_size==c['apkBytes']
    with apk.open('rb') as stream:assert hashlib.file_digest(stream,'sha256').hexdigest()==c['apkSha256']
    tools=pathlib.Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0'
    signature=command(tools/'apksigner','verify','--verbose','--print-certs',apk)
    badging=command(tools/'aapt','dump','badging',apk)
    check_native_metadata(c,signature,badging)
    config=json.loads(git('show',c['sourceHeadSha']+':rwadar-movil/app.json'))
    blocked=config['expo']['android']['blockedPermissions'];assert isinstance(blocked,list) and blocked
    permissions=set(re.findall(r"^uses-permission(?:-sdk-\d+)?: name='([^']+)'",command(tools/'aapt','dump','permissions',apk),re.M))
    assert permissions and not permissions.intersection(blocked)
    assert {'android.permission.USE_BIOMETRIC','android.permission.USE_FINGERPRINT'}<=permissions,'System authentication permissions missing'
    manifest_xml=command(tools/'aapt','dump','xmltree',apk,'AndroidManifest.xml')
    assert re.search(r'A: android:allowBackup\([^)]*\)=\(type 0x12\)0x0\b',manifest_xml),'Actual APK backup must remain disabled'
    manifest=(ROOT/'baseline-c19-guest.json').read_bytes();assert hashlib.sha256(manifest).hexdigest()==ASSET_MANIFEST_SHA
    photos=json.loads(manifest)['checks']['photos49'];expected={p['sha256']:p for p in photos};assert len(photos)==len(expected)==49
    matches={};scanned=0
    with zipfile.ZipFile(apk) as archive:
        infos=archive.infolist();assert len(infos)<20000 and len({i.filename for i in infos})==len(infos)
        for info in infos:
            if not info.filename.lower().endswith(('.webp','.png','.jpg','.jpeg','.avif')):continue
            assert info.file_size<=16*1024*1024;scanned+=info.file_size;assert scanned<=128*1024*1024
            data=archive.read(info);digest=hashlib.sha256(data).hexdigest()
            if digest in expected:assert len(data)==expected[digest]['bytes'];matches.setdefault(digest,info.filename)
    assert set(matches)==set(expected),'Current APK lacks a declared editorial image'
    proof=json.loads(pathlib.Path('evidence-private/candidate-current-source.json').read_text(encoding='utf-8'))
    assert proof['sourceHeadSha']==c['sourceHeadSha'] and proof['workingMobileTreeMatchesCandidateSource'] is True
    report={'status':'verified-native-package-only',**{k:c[k] for k in ('apkSha256','apkBytes','version','versionCode','package','certificateSha256','sourceHeadSha','easBuildId')},
      'minSdkVersion':24,'blockedPermissionsAbsent':True,'systemBiometricPermission':True,'systemFingerprintPermission':True,
      'androidBackupDisabled':True,'historicalApkIdentityReused':False,
      'assetManifestExpectedHashesOnly':ASSET_MANIFEST_SHA,'all49AssetsFreshlyScannedInThisApk':True,
      'photos49':[{'slug':p['slug'],'sha256':p['sha256'],'bytes':p['bytes'],'apkEntry':matches[p['sha256']]} for p in photos],
      'authenticatedUiPassed':False,'releaseApproved':False}
    pathlib.Path('evidence-private/candidate-current-package.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Fresh current-APK package, signature, permissions and49asset byte contents verified')

if __name__=='__main__':
    assert os.environ.get('GITHUB_REPOSITORY')=='victorJorques/RWADAR' and os.environ.get('GITHUB_EVENT_NAME')=='workflow_dispatch'
    if sys.argv[1:]==['prepare']:prepare()
    elif len(sys.argv)==3 and sys.argv[1]=='identity':identity(sys.argv[2])
    else:raise AssertionError('Unsupported read-only candidate gate action')
