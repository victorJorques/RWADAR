"""One fixed QA-only production BFF login/session/logout; no browser or portfolio."""
import ast,json,os,pathlib,re,socket,ssl,sys,urllib.request,urllib.error

ORIGIN='https://rwadar.pages.dev'
UID='8871c88e-b0af-415b-9346-dcceb182c2ac'
MARKER='ba8cb4645588067ff77ef11a'
EMAIL='vcicrack+rwadar-qa-'+MARKER+'@gmail.com'

class Rejected(Exception):pass

def require_qa(env):
    if not (env.get('QA_ACCOUNT_ACK')=='CONFIRMED_TEST_ACCOUNT' and env.get('QA_USER_ID')==UID and
            env.get('QA_ACCOUNT_MARKER')==MARKER and env.get('RWADAR_QA_EMAIL')==EMAIL and
            isinstance(env.get('RWADAR_QA_PASSWORD'),str) and len(env['RWADAR_QA_PASSWORD'])>=12):
        raise Rejected('qa_identity_rejected')

def failure_only(route,error):
    if route not in ('entrar','sesion','salir'):return None
    if isinstance(error,urllib.error.HTTPError):
        if type(error.code) is not int or not 100<=error.code<=599:return None
        result={'route':route,'kind':'http','status':error.code}
        retry=error.headers.get('Retry-After') if error.headers else None
        if isinstance(retry,str) and re.fullmatch(r'[0-9]{1,5}',retry) and int(retry)<=86400:result['retryAfter']=int(retry)
        return result
    if isinstance(error,urllib.error.URLError):
        reason=error.reason
        category='timeout' if isinstance(reason,TimeoutError) else 'ssl' if isinstance(reason,ssl.SSLError) else 'connection' if isinstance(reason,(ConnectionError,socket.gaierror)) else 'other'
        return {'route':route,'kind':'url','reasonClass':category}
    if isinstance(error,TimeoutError):return {'route':route,'kind':'timeout','reasonClass':'timeout'}
    return {'route':route,'kind':'invalid_response'}

def probe(env,opener_factory=urllib.request.build_opener):
    report={'status':'failed','origin':ORIGIN,'transport':'python-urllib','httpStatuses':[],
            'sameQaLogin':False,'sameQaSession':False,'logoutLocal':False,'retries':0,'credentialsRecorded':False}
    cookie='';own_login=False
    try:
        require_qa(env)
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self,*args,**kwargs):return None
        opener=opener_factory(NoRedirect())
        agents=[value for name,value in getattr(opener,'addheaders',[]) if name.lower()=='user-agent']
        if len(agents)==1 and isinstance(agents[0],str) and re.fullmatch(r'Python-urllib/[0-9]+\.[0-9]+',agents[0]):
            report['defaultUserAgent']=agents[0]  # Observed default; never impersonate Node or Chrome.
        def request(route,method='GET',body=None):
            allowed={'entrar':'POST','sesion':'GET','salir':'POST'}
            if allowed.get(route)!=method:raise Rejected('fixed_route_required')
            headers={'Origin':ORIGIN,'Content-Type':'application/json','X-RWAdar-Usuario':UID}
            if cookie:headers['Cookie']=cookie
            req=urllib.request.Request(ORIGIN+'/api/acceso/'+route,method=method,headers=headers,
                data=None if body is None else json.dumps(body).encode('utf-8'))
            try:
                with opener.open(req,timeout=10) as response:
                    report['httpStatuses'].append({'route':route,'status':response.status})
                    if response.status!=200:raise Rejected('bff_response_rejected')
                    raw=response.read(128*1024+1)
                    if len(raw)>128*1024:raise Rejected('bff_response_rejected')
                    result=json.loads(raw)
                    if type(result) is not dict:raise Rejected('bff_response_rejected')
                    return result,response.headers
            except Exception as error:
                report.setdefault('bffFailure',failure_only(route,error))
                raise Rejected('bff_request_failed') from None
        try:
            login,headers=request('entrar','POST',{'correo':EMAIL,'clave':env['RWADAR_QA_PASSWORD']})
            own_login=login.get('autenticada') is True and login.get('usuario',{}).get('id')==UID
            if not own_login:raise Rejected('login_identity_rejected')
            cookies=headers.get_all('Set-Cookie') or []
            if len(cookies)!=1:raise Rejected('host_cookie_rejected')
            match=re.fullmatch(r'(__Host-rwadar-acceso=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+); Path=/; HttpOnly; Secure; SameSite=Lax',cookies[0])
            if not match:raise Rejected('host_cookie_rejected')
            cookie=match.group(1);report['sameQaLogin']=True
            session,_=request('sesion')
            report['sameQaSession']=session.get('autenticada') is True and session.get('usuario',{}).get('id')==UID
            if not report['sameQaSession']:raise Rejected('session_identity_rejected')
            report['status']='passed'
        finally:
            if cookie and own_login:
                try:
                    closed,_=request('salir','POST',{})
                    report['logoutLocal']=closed.get('cerrado') is True and closed.get('cierreRemoto') is True
                except Rejected:pass
            cookie=''
            if report['status']=='passed' and not report['logoutLocal']:
                report['status']='failed';report['failureCode']='local_logout_not_confirmed'
    except Rejected as error:report['failureCode']=str(error)
    except Exception:report['failureCode']='probe_failed'
    return report

if __name__=='__main__':
    report=probe(os.environ)
    output=pathlib.Path('evidence-private/python-bff-141-result.json');output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report))
    if report['status']!='passed':sys.exit(1)
