"""Fail closed before downloads/account access; inspect the actual signed APK.

No EAS build/update, SQL, Auth admin or publication operations.
"""
import datetime, hashlib, json, os, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
OLD = ROOT.parent / 'qa-android-authenticated-140'
CERT = 'f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72'
UPDATE_URL = 'https://u.expo.dev/43de8651-0c57-40fc-8cdb-c9a8c72e6835'
EXPECTED_QA_ID = '8871c88e-b0af-415b-9346-dcceb182c2ac'
EXPECTED_QA_MARKER = 'ba8cb4645588067ff77ef11a'
EXPECTED_QA_EMAIL = 'vcicrack+rwadar-qa-' + EXPECTED_QA_MARKER + '@gmail.com'
EXPECTED_QA_CREATED_AT = '2026-10-24T18:33:39.958597Z'
EXPECTED_QA_NAME = 'QA APK140 ' + EXPECTED_QA_MARKER

def require_qa_identity(env, require_email=False):
    assert env.get('QA_USER_ID') == EXPECTED_QA_ID, 'Only the exact existing dedicated QA UUID is allowed'
    assert env.get('QA_ACCOUNT_MARKER') == EXPECTED_QA_MARKER, 'Existing QA ownership marker required'
    if require_email:
        assert env.get('RWADAR_QA_EMAIL','').lower() == EXPECTED_QA_EMAIL, 'Existing QA email required; other accounts are prohibited'

def validate_auth_qa_user(user):
    assert isinstance(user,dict) and user.get('id') == EXPECTED_QA_ID, 'Auth user is not the exact QA account'
    assert user.get('email','').lower() == EXPECTED_QA_EMAIL, 'Auth QA email mismatch'
    assert user.get('created_at') == EXPECTED_QA_CREATED_AT, 'Auth QA creation date mismatch'
    assert user.get('user_metadata',{}).get('nombre') == EXPECTED_QA_NAME, 'Auth QA ownership marker mismatch'
    assert user.get('is_anonymous') is not True and not user.get('deleted_at'), 'Confirmed non-anonymous QA required'
    confirmed=user.get('email_confirmed_at') or user.get('confirmed_at')
    assert isinstance(confirmed,str) and confirmed, 'QA email confirmation required'
    try: parsed=datetime.datetime.fromisoformat(confirmed.replace('Z','+00:00'))
    except (ValueError,TypeError): raise AssertionError('QA confirmation timestamp invalid') from None
    assert parsed.tzinfo is not None, 'QA confirmation timezone required'

def command(*args):
    p = subprocess.run(list(map(str, args)), check=True, capture_output=True, timeout=45)
    return p.stdout.decode('utf-8', errors='strict').strip()

def load_candidate(path=None):
    c = json.loads((pathlib.Path(path) if path else ROOT / 'candidate.json').read_text(encoding='utf-8'))
    assert c.get('status') == 'ready' and c.get('easStatus') == 'FINISHED', 'Candidate pending: require actual EAS FINISHED identity first'
    assert c['schemaVersion'] == 1 and c['package'] == 'com.rwadar.app'
    assert c['version'] == '1.4.1' and type(c['versionCode']) is int and c['versionCode'] == 23
    assert c['certificateSha256'] == CERT
    assert re.fullmatch(r'[0-9a-f]{40}', c['sourceHeadSha'] or '')
    assert re.fullmatch(r'[0-9a-f]{64}', c['apkSha256'] or '')
    assert re.fullmatch(r'https://expo\.dev/artifacts/eas/[A-Za-z0-9_-]+\.apk', c['apkUrl'] or '')
    assert re.fullmatch(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}', c['easBuildId'] or '')
    assert type(c['apkBytes']) is int and 32*1024*1024 <= c['apkBytes'] <= 160*1024*1024
    return c

def prepare():
    c = load_candidate()  # Deliberately first: no network, account or env output while pending.
    assert os.environ['GITHUB_REPOSITORY'] == 'victorJorques/RWADAR'
    assert os.environ['GITHUB_EVENT_NAME'] == 'workflow_dispatch'
    assert os.environ['QA_ACCOUNT_ACK'] == 'CONFIRMED_TEST_ACCOUNT'
    require_qa_identity(os.environ)
    # Checkout must include the frozen compiled source commit in its own history.
    command('git', 'cat-file', '-e', c['sourceHeadSha'] + '^{commit}')
    assert not command('git', 'diff', '--name-only', c['sourceHeadSha'], 'HEAD', '--', 'rwadar-movil')
    assert not command('git', 'status', '--porcelain', '--', 'rwadar-movil')
    baseline = json.loads((ROOT / 'baseline-c22.json').read_text(encoding='utf-8'))
    assert baseline['status'] == 'ready' and baseline['versionCode'] == 22 and baseline['version'] == '1.4.0'
    assert baseline['package'] == c['package'] and baseline['certificateSha256'] == c['certificateSha256']
    with open(os.environ['GITHUB_ENV'], 'a', encoding='utf-8') as target:
        for prefix, item in (('APK', c), ('BASELINE_APK', baseline)):
            for suffix, key in (('URL','apkUrl'),('SHA256','apkSha256'),('BYTES','apkBytes')):
                target.write(f'{prefix}_{suffix}={item[key]}\n')
    out = pathlib.Path('evidence-private'); out.mkdir(exist_ok=True)
    (out/'candidate-141-source.json').write_text(json.dumps({'sourceHeadSha':c['sourceHeadSha'],
      'mobileTreeMatchesCompiledSource':True, 'candidateReady':True, 'easStatus':'FINISHED'}), encoding='utf-8')

def string_resources(resources):
    result = {}
    for block in re.split(r'(?m)^\s*resource ', resources)[1:]:
        ref = re.match(r'(0x[0-9a-fA-F]+)\s',block)
        value = re.search(r'\(string(?:8|16)?\)\s+("(?:\\.|[^"\\])*")',block)
        if ref and value: result[ref.group(1).lower()] = json.loads(value.group(1))
    return result

def manifest_metadata(xml, resources=''):
    # aapt xmltree represents each Android meta-data element as one name/value pair.
    records = {}
    for block in re.split(r'(?m)^\s*E: meta-data ', xml)[1:]:
        block = re.split(r'(?m)^\s*E: ', block)[0]
        name = re.search(r'A: android:name\([^)]*\)="([^"]+)"', block)
        value = re.search(r'A: android:value\([^)]*\)=(.*)', block)
        if not name or not value: continue
        raw = value.group(1)
        raw = raw.strip()
        if raw.startswith('"'):
            records[name.group(1)] = json.JSONDecoder().raw_decode(raw)[0]
        elif raw.startswith('@0x'):
            ref = re.match(r'@(0x[0-9a-fA-F]+)',raw).group(1).lower()
            assert ref in string_resources(resources), 'Unresolved actual APK metadata string resource'
            records[name.group(1)] = string_resources(resources)[ref]
        else: records[name.group(1)] = raw
    return records

def check_updates(xml, resources=''):
    meta = manifest_metadata(xml, resources)
    assert meta.get('expo.modules.updates.ENABLED') == '(type 0x12)0xffffffff', 'Native Updates must be enabled'
    assert meta.get('expo.modules.updates.EXPO_RUNTIME_VERSION') == '1.4.1(23)', 'Actual native runtime mismatch'
    assert meta.get('expo.modules.updates.EXPO_UPDATE_URL') == UPDATE_URL
    headers = json.loads(meta['expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY'])
    assert headers == {'expo-channel-name':'production'}, 'Actual APK Updates channel mismatch'
    return {'enabled':True,'runtimeVersion':'1.4.1(23)','url':UPDATE_URL,'channel':'production',
            'actualManifestObserved':True,'otaDeliveryObserved':False,'otaPublishedByThisQA':False}

def identity(apk, baseline=False):
    c = json.loads((ROOT/'baseline-c22.json').read_text(encoding='utf-8')) if baseline else load_candidate()
    apk = pathlib.Path(apk)
    assert apk.stat().st_size == c['apkBytes']
    with apk.open('rb') as stream: assert hashlib.file_digest(stream,'sha256').hexdigest() == c['apkSha256']
    tools = pathlib.Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0'
    sys.path.insert(0,str(OLD))
    from candidate_c21 import check_native_metadata
    check_native_metadata(c, command(tools/'apksigner','verify','--verbose','--print-certs',apk),
                          command(tools/'aapt','dump','badging',apk))
    proof = {k:c[k] for k in ('version','versionCode','package','sourceHeadSha','apkSha256','certificateSha256')}
    proof.update({'actualNativeIdentityVerified':True,'releaseApproved':False})
    if not baseline:
        xml = command(tools/'aapt','dump','xmltree',apk,'AndroidManifest.xml')
        assert re.search(r'A: android:allowBackup\([^)]*\)=\(type 0x12\)0x0\b',xml)
        config=json.loads(command('git','show',c['sourceHeadSha']+':rwadar-movil/app.json'))['expo']
        actual_permissions=set(re.findall(r"^uses-permission(?:-sdk-\d+)?: name='([^']+)'",command(tools/'aapt','dump','permissions',apk),re.M))
        assert not actual_permissions.intersection(config['android']['blockedPermissions'])
        assert {'android.permission.USE_BIOMETRIC','android.permission.USE_FINGERPRINT'}<=actual_permissions
        proof['blockedPermissionsAbsent']=True
        proof['updates'] = check_updates(xml,command(tools/'aapt','dump','--values','resources',apk))
    pathlib.Path('evidence-private').mkdir(exist_ok=True)
    pathlib.Path('evidence-private', 'baseline-c22-package.json' if baseline else 'candidate-141-package.json').write_text(json.dumps(proof,indent=2),encoding='utf-8')

if __name__ == '__main__':
    if sys.argv[1:] == ['prepare']: prepare()
    elif len(sys.argv) == 3 and sys.argv[1] in ('identity','baseline-identity'): identity(sys.argv[2],sys.argv[1]=='baseline-identity')
    else: raise AssertionError('Unsupported action')
