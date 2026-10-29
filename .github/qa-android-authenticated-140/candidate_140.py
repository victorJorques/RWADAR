"""Strict private candidate gate. No build, account, email, SQL or release action."""
import base64,hashlib,json,os,pathlib,re,subprocess,sys,urllib.parse,zipfile
ROOT=pathlib.Path(__file__).resolve().parent
BASE='1ecf7e7aa8941400d6ad954680cd6deb89107c42'
SOURCE='7c64b6c15a826ddb3189c8ab195b4fa36201ca51'
OLD_SHA='f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624'
CERT='f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72'
BASE_REPORT='842b1960939bb78ee297c00478f676d8657385a5bc6f0265d2397e619738ca59'
CHANGED={'rwadar-movil/lib/cuentas.js','rwadar-movil/tests/cuentas-catalogo-transporte.test.cjs'}

def load_candidate():
    data=json.loads(ROOT.joinpath('candidate-c20.json').read_text(encoding='utf-8'))
    assert set(data)=={'schemaVersion','status','version','versionCode','package','sourceHeadSha','baselineSourceHeadSha','certificateSha256','apkUrl','apkSha256','apkBytes','easBuildId'},'Candidate schema mismatch'
    assert type(data['schemaVersion']) is int and data['schemaVersion']==1 and data['status']=='ready','Candidate not ready: wait for the actual EAS artifact'
    assert data['version']=='1.4.0' and type(data['versionCode']) is int and data['versionCode']==20
    assert data['package']=='com.rwadar.app' and data['sourceHeadSha']==SOURCE and data['baselineSourceHeadSha']==BASE
    assert data['certificateSha256']==CERT
    assert isinstance(data['apkUrl'],str) and re.fullmatch(r'https://expo\.dev/artifacts/eas/[A-Za-z0-9_-]+\.apk',data['apkUrl']),'Only an exact HTTPS Expo artifact URL is accepted'
    assert isinstance(data['apkSha256'],str) and re.fullmatch(r'[0-9a-f]{64}',data['apkSha256']) and data['apkSha256']!=OLD_SHA
    assert type(data['apkBytes']) is int and 32*1024*1024<=data['apkBytes']<=160*1024*1024
    assert isinstance(data['easBuildId'],str) and re.fullmatch(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}',data['easBuildId'])
    return data

def git(*args):
    p=subprocess.run(['git',*args],check=True,capture_output=True,timeout=30)
    return p.stdout.decode('utf-8').strip()

def source_guard():
    assert set(git('diff','--name-only',BASE,SOURCE,'--','rwadar-movil').splitlines())==CHANGED,'Product diff differs from the reviewed transport-only fix'
    assert not git('diff','--name-only',SOURCE,'HEAD','--','rwadar-movil'),'Mobile source changed after frozen candidate source'
    assert not git('diff','--name-only','HEAD','--','rwadar-movil'),'Uncommitted mobile source changes'
    assert not git('ls-files','--others','--exclude-standard','--','rwadar-movil'),'Untracked mobile source changes'
    return {'baselineSourceHeadSha':BASE,'candidateSourceHeadSha':SOURCE,
            'changedProductPaths':sorted(CHANGED),'uiAssetsDependenciesAppConfigGitIdenticalToC19':True,
            'workingMobileTreeMatchesCandidateSource':True,
            'reuseScope':'Historical APK19 guest UI only; transport changed and requires new authenticated candidate observations'}

def fetch_frozen_source_trees():
    # Never fetch branch history/tags or persist an Actions credential in Git.
    # A process-only config header is restricted to HTTPS github.com; it never
    # appears in argv, output, files, FETCH_HEAD or repository configuration.
    origin=git('remote','get-url','origin')
    assert origin in ('https://github.com/victorJorques/RWADAR','https://github.com/victorJorques/RWADAR.git'),'Unexpected private source remote'
    token=os.environ.get('GH_TOKEN');assert token,'Read-only Actions token required'
    env=os.environ.copy()
    env.update({'GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'http.https://github.com/.extraheader',
                'GIT_CONFIG_VALUE_0':'AUTHORIZATION: basic '+base64.b64encode(('x-access-token:'+token).encode()).decode(),
                'GIT_TERMINAL_PROMPT':'0'})
    token=None
    try:
        result=subprocess.run(['git','fetch','--depth=1','--filter=blob:none','--no-tags',
                               '--no-recurse-submodules','origin',BASE,SOURCE],
                              env=env,check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=90)
        assert result.returncode==0,'Could not obtain the two frozen commit trees'
    finally:
        env.pop('GIT_CONFIG_VALUE_0',None)

def prepare():
    c=load_candidate()
    fetch_frozen_source_trees()
    provenance=source_guard()
    out=pathlib.Path('evidence-private');out.mkdir(exist_ok=True)
    out.joinpath('candidate-source-provenance.json').write_text(json.dumps(provenance,indent=2),encoding='utf-8')
    assert os.environ.get('GITHUB_ENV'),'Private Actions environment required'
    with open(os.environ['GITHUB_ENV'],'a',encoding='utf-8') as target:
        for key,value in [('APK_URL',c['apkUrl']),('APK_SHA256',c['apkSha256']),('APK_BYTES',c['apkBytes']),('SOURCE_HEAD_SHA',SOURCE)]:
            target.write(key+'='+str(value)+'\n')
    print('Ready candidate and transport-only source provenance verified; no publication')

def command(*args):
    return subprocess.run(list(map(str,args)),check=True,capture_output=True,timeout=40).stdout.decode('utf-8',errors='strict')

def verify_identity(apk):
    c=load_candidate();apk=pathlib.Path(apk)
    assert apk.stat().st_size==c['apkBytes']
    with apk.open('rb') as stream: assert hashlib.file_digest(stream,'sha256').hexdigest()==c['apkSha256']
    tools=pathlib.Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0'
    signature=command(tools/'apksigner','verify','--verbose','--print-certs',apk)
    signers=re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([0-9a-f]{64})$',signature,re.M)
    assert signers==[CERT],'Candidate signing certificate mismatch or multiple signers'
    assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
    badging=command(tools/'aapt','dump','badging',apk)
    identity=re.search(r"^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging,re.M)
    assert identity and identity.groups()==('com.rwadar.app','20','1.4.0'),'Candidate native identity mismatch'
    assert re.search(r"^sdkVersion:'24'$",badging,re.M),'Candidate minSdk must remain24'
    app_config=json.loads(git('show',SOURCE+':rwadar-movil/app.json'))
    blocked=app_config['expo']['android']['blockedPermissions']
    assert isinstance(blocked,list) and blocked and all(isinstance(p,str) and p for p in blocked)
    permission_output=command(tools/'aapt','dump','permissions',apk)
    permissions=set(re.findall(r"^uses-permission(?:-sdk-\d+)?: name='([^']+)'",permission_output,re.M))
    assert permissions,'Candidate native permissions could not be parsed'
    assert not permissions.intersection(blocked),'Candidate declares a permission blocked by frozen app.json'
    raw=ROOT.joinpath('baseline-c19-guest.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()==BASE_REPORT
    baseline=json.loads(raw);photos=baseline['checks']['photos49']
    assert baseline['apkSha256']==OLD_SHA and baseline['versionCode']==19 and len(photos)==49
    expected={p['sha256']:p for p in photos};assert len(expected)==49
    matches={};scanned=0
    with zipfile.ZipFile(apk) as archive:
        infos=archive.infolist();assert len(infos)<20000 and len({i.filename for i in infos})==len(infos)
        for info in infos:
            if not info.filename.lower().endswith(('.webp','.png','.jpg','.jpeg','.avif')):continue
            assert info.file_size<=16*1024*1024
            scanned+=info.file_size;assert scanned<=128*1024*1024
            content=archive.read(info);digest=hashlib.sha256(content).hexdigest()
            if digest in expected:
                assert len(content)==expected[digest]['bytes']
                matches.setdefault(digest,info.filename)
    assert set(matches)==set(expected),'Candidate does not contain all 49 unchanged editorial assets'
    provenance=json.loads(pathlib.Path('evidence-private/candidate-source-provenance.json').read_text())
    assert provenance['candidateSourceHeadSha']==SOURCE and provenance['uiAssetsDependenciesAppConfigGitIdenticalToC19'] is True
    report={'status':'verified-native-package-only','apkSha256':c['apkSha256'],'apkBytes':c['apkBytes'],
            'version':'1.4.0','versionCode':20,'package':'com.rwadar.app','certificateSha256':CERT,
            'minSdkVersion':24,'blockedPermissionsAbsent':True,'blockedPermissionsChecked':len(blocked),
            'sourceHeadSha':SOURCE,'easBuildId':c['easBuildId'],'sourceProvenance':provenance,
            'photos49':[{'slug':p['slug'],'sha256':p['sha256'],'bytes':p['bytes'],'apkEntry':matches[p['sha256']]} for p in photos],
            'guestC20Executed':False,'authenticatedC20Passed':False,'releaseApproved':False}
    pathlib.Path('evidence-private/candidate-package-identity.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Candidate c20 package, certificate and all49 asset contents verified before install')

C20_PACKAGE_REPORT='3c7ad874262b9dfd648252b0809d654aa3b6b4878db3e25f8eb9613eaef59fea'
C20_IMMUTABLE_APK='c20a45889c7eccdf0ac9cfb4fd18345a09c64e05b130a8af4b44177fb2e7e614'

def reuse_identity(apk):
    # Only completed package/signature/49-assets observations are reused. The
    # original workflow failed later in UI and stays failed; it is never release QA.
    c=load_candidate();apk=pathlib.Path(apk)
    assert c['apkSha256']==C20_IMMUTABLE_APK and c['apkBytes']==88961845
    assert c['easBuildId']=='24546ab7-9015-4886-a91c-ab3a57a230cb'
    assert apk.stat().st_size==c['apkBytes']
    with apk.open('rb') as stream:
        assert hashlib.file_digest(stream,'sha256').hexdigest()==c['apkSha256']
    raw=ROOT.joinpath('baseline-c20-package-40373551753.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()==C20_PACKAGE_REPORT,'Exact private package proof identity mismatch'
    report=json.loads(raw)
    assert report['status']=='verified-native-package-only'
    assert all(report.get(k)==c[k] for k in ('apkSha256','apkBytes','version','versionCode','package','certificateSha256','sourceHeadSha','easBuildId'))
    assert report['minSdkVersion']==24 and report['blockedPermissionsAbsent'] is True and report['blockedPermissionsChecked']==27
    baseline_raw=ROOT.joinpath('baseline-c19-guest.json').read_bytes()
    assert hashlib.sha256(baseline_raw).hexdigest()==BASE_REPORT
    original=json.loads(baseline_raw)['checks']['photos49'];photos=report['photos49']
    assert len(photos)==49 and len({p['sha256'] for p in photos})==49
    assert {(p['slug'],p['sha256'],p['bytes']) for p in photos}=={(p['slug'],p['sha256'],p['bytes']) for p in original}
    current=json.loads(pathlib.Path('evidence-private/candidate-source-provenance.json').read_text())
    assert report['sourceProvenance']==current,'Current frozen-source provenance differs from the verified package proof'
    out=pathlib.Path('evidence-private')
    # Exact bytes preserve the pinned proof. No signature tools or archive asset
    # scans are rerun. A freshly downloaded matching APK is still installed below.
    out.joinpath('candidate-package-identity.json').write_bytes(raw)
    reuse={'scope':'same-APK20-package-signature-assets-only','runId':40373551753,
           'jobId':121750402352,'historicalWorkflowConclusion':'failure',
           'packageObservationStatus':'verified-native-package-only',
           'reportSha256':C20_PACKAGE_REPORT,'apkSha256':c['apkSha256'],
           'apkBytes':c['apkBytes'],'sourceHeadSha':SOURCE,
           'freshDownloadHashMatched':True,'signatureAndAssetsRepeated':False,
           'authenticatedUiReused':False,'releaseApproved':False}
    out.joinpath('candidate-package-identity-reuse.json').write_text(json.dumps(reuse,indent=2),encoding='utf-8')
    print('Reused exact completed APK20 package/signature/49-assets proof; fresh APK hash matched; previous UI failure preserved')

if __name__=='__main__':
    assert os.environ.get('GITHUB_REPOSITORY')=='victorJorques/RWADAR'
    assert os.environ.get('GITHUB_EVENT_NAME')=='workflow_dispatch'
    if sys.argv[1:]==['prepare']:prepare()
    elif len(sys.argv)==3 and sys.argv[1]=='identity':verify_identity(sys.argv[2])
    elif len(sys.argv)==3 and sys.argv[1]=='reuse-identity':reuse_identity(sys.argv[2])
    else:raise AssertionError('Unsupported candidate gate action')
