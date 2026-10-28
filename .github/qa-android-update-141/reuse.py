"""Exact historical native observations; a failed run never becomes approval."""
import hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parent
RUN_ID='40783151032'
FILES={
 'android-update-141-result.json':'367fd69edf27b5018abbc64b42797640184820cdab2814e68acf1b38f1611570',
 'candidate-141-source.json':'e668174987e490fb2c448379478e3e1e34bf43adc4896cbabbe812e3b873463d',
 'candidate-141-package.json':'e8afe4b84f90bce183f9e7213f0cdddd7c4da4cc2a14e36b05afd0318e24b08e',
}
CHECKS=('baseline22ConfirmedAccountLogin','apk22ReplacedBy23WithoutUninstall','offlineEmbeddedStartsWithoutLogout','navigationForegroundAndColdLaunchPreserveSameAccount')

def validate_package(candidate,proof):
    for key in ('sourceHeadSha','apkSha256','certificateSha256','package','version','versionCode'):
        assert proof.get(key)==candidate[key],'Native package identity must match the exact finished candidate'
    assert proof.get('actualNativeIdentityVerified') is True and proof.get('blockedPermissionsAbsent') is True
    assert proof.get('updates',{}).get('runtimeVersion')=='1.4.1(23)' and proof['updates'].get('actualManifestObserved') is True
    return proof

def load_reused_native_evidence(candidate,folder=None):
    folder=pathlib.Path(folder) if folder is not None else ROOT/('baseline-'+RUN_ID)
    docs={}
    for name,digest in FILES.items():
        file=folder/name
        assert file.is_file() and not file.is_symlink() and file.stat().st_size<=128*1024,'Bounded original native evidence required'
        raw=file.read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,'Original native evidence SHA mismatch'
        docs[name]=json.loads(raw)
    report=docs['android-update-141-result.json'];source=docs['candidate-141-source.json']
    assert report['status']=='failed' and report['releaseApproved'] is False and report['full20PointQA'] is False
    assert source=={'sourceHeadSha':candidate['sourceHeadSha'],'mobileTreeMatchesCompiledSource':True,'candidateReady':True,'easStatus':'FINISHED'}
    validate_package(candidate,docs['candidate-141-package.json'])
    checks=report['checks'];assert checks[CHECKS[0]] is True and checks[CHECKS[3]] is True
    assert checks[CHECKS[1]]=={'package':candidate['package'],'sameSigningCertificate':True,'dataNotClearedBeforeUpdate':True}
    assert checks[CHECKS[2]]=={'observedNativeUI':True,'privateAccessObserved':False,'storedSessionRetryObserved':True,'otaDeliveryObserved':False}
    return {'runId':RUN_ID,'originalStatus':report['status'],'originalReleaseApproved':False,'originalFull20PointQA':False,
      'reportSha256':FILES['android-update-141-result.json'],'sourceJsonSha256':FILES['candidate-141-source.json'],
      'packageJsonSha256':FILES['candidate-141-package.json'],'sourceHeadSha':candidate['sourceHeadSha'],
      'apkSha256':candidate['apkSha256'],'checks':{name:checks[name] for name in CHECKS},'repeatedInThisRun':False}
