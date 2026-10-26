"""Native snapshot/scroll wrappers reused from the reviewed APK19 harness.
Private evidence only; the product APK is never modified.
"""
import json, os, pathlib, re, secrets, shlex, socket, struct, subprocess, time, xml.etree.ElementTree as ET
out = pathlib.Path('evidence-private')
out.mkdir(exist_ok=True)
scroll_gestures = []
CAPTURE_ALLOWED = False
APP_PACKAGE = 'com.rwadar.app'
LAST_KEYBOARD_DIAGNOSTIC = {}
LAST_EDITABLE_DIAGNOSTIC = {}
EDITABLE_LABELS = frozenset((
    'Correo','Email','Contraseña','Password',
    'Buscar ofertas por nombre, proveedor, país o métrica',
    'Nombre de la inversión','Cantidad de unidades','Precio pagado por unidad',
    'Comisión (0 si no hubo)','Precio actual por unidad','Importe cobrado'))
_SECRET_VALUES = tuple(v for v in (os.environ.get('RWADAR_QA_EMAIL'),os.environ.get('RWADAR_QA_PASSWORD')) if v)

LAST_LOGIN_INPUT_DIAGNOSTIC = []
LAST_LOGIN_SUBMIT_DIAGNOSTIC = None
LOGIN_MESSAGE_CODES = {'Escribe un correo válido.': 'invalid-email', 'Escribe tu contraseña.': 'empty-password', 'El correo o la contraseña no son correctos.': 'invalid-credentials', 'Confirma tu correo antes de entrar. Puedes pedir otro enlace.': 'email-not-confirmed', 'La sesión no se ha podido verificar. Vuelve a entrar.': 'session-unverified', 'No se ha podido comprobar el acceso. Inténtalo en la web oficial.': 'captcha-failed', 'Has hecho varios intentos. Espera un momento antes de repetir.': 'rate-limited', 'La conexión tarda demasiado. Comprueba tu red y vuelve a intentarlo.': 'request-timeout', 'No se ha podido completar la operación. Inténtalo de nuevo más tarde.': 'generic-error', 'No se pudo completar la operación. Comprueba la conexión e inténtalo de nuevo.': 'operation-error', 'Espera a que termine la operación anterior.': 'busy', 'Las cuentas todavía no están abiertas en esta versión.': 'accounts-closed', 'Ya has entrado. Tu vigilancia se guarda con esta cuenta.': 'login-success', 'Enter a valid email address.': 'invalid-email', 'Enter your password.': 'empty-password', 'The email or password is incorrect.': 'invalid-credentials', 'Confirm your email before signing in. You can request another link.': 'email-not-confirmed', 'Could not verify your session. Sign in again.': 'session-unverified', 'Could not verify access. Try on the official website.': 'captcha-failed', 'You have made several attempts. Wait a moment before trying again.': 'rate-limited', 'The connection is taking too long. Check your network and try again.': 'request-timeout', 'Could not complete the action. Try again later.': 'generic-error', 'Could not complete the action. Check your connection and try again.': 'operation-error', 'Wait for the previous action to finish.': 'busy', 'Accounts are not open in this version yet.': 'accounts-closed', 'You are signed in. Your watchlist is saved with this account.': 'login-success'}


def inspect_login_input_values(raw_xml):
    global LAST_LOGIN_INPUT_DIAGNOSTIC
    # Raw UI values exist only in this stack frame, before the normal sanitizer.
    # Persist booleans/lengths only; never values, prefixes, hashes or exception args.
    root=ET.fromstring(raw_xml)
    fields=[]
    targets={'Correo':'RWADAR_QA_EMAIL','Email':'RWADAR_QA_EMAIL',
             'Contraseña':'RWADAR_QA_PASSWORD','Password':'RWADAR_QA_PASSWORD'}
    for node in root.iter('node'):
        label=node.get('content-desc','')
        if node.get('package')!=APP_PACKAGE or node.get('class')!='android.widget.EditText' or label not in targets:
            continue
        value=node.get('text',''); expected=os.environ.get(targets[label])
        mask_only=bool(value) and all(c in '\u2022\u25cf*\u00b7' for c in value)
        fields.append({'field':'password' if targets[label].endswith('PASSWORD') else 'email',
                       'empty':not bool(value),'visibleLength':len(value),
                       'passwordMasked':node.get('password')=='true','maskOnly':mask_only,
                       'expectedValueMatch':None if expected is None or mask_only else value==expected,
                       'expectedLengthMatch':None if expected is None else len(value)==len(expected)})
    LAST_LOGIN_INPUT_DIAGNOSTIC=fields


def login_control_metadata(node):
    classes={'android.view.View','android.view.ViewGroup','android.widget.Button','android.widget.TextView'}
    bounds=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
    return {'class':node.get('class') if node.get('class') in classes else 'other',
            'clickable':node.get('clickable')=='true','enabled':node.get('enabled')!='false',
            'bounds':bounds if len(bounds)==4 else None}


def remember_login_submit(root,label):
    global LAST_LOGIN_SUBMIT_DIAGNOSTIC
    assert label in ('Entrar','Sign in'), 'Unexpected login submit label'
    node,_=find_node(root,label)
    LAST_LOGIN_SUBMIT_DIAGNOSTIC=login_control_metadata(node)


def safe_login_diagnostic():
    result={'inputFields':LAST_LOGIN_INPUT_DIAGNOSTIC.copy(),
            'selectedSubmitControl':LAST_LOGIN_SUBMIT_DIAGNOSTIC}
    try:
        root=dump(timeout=3)
        result['inputFields']=LAST_LOGIN_INPUT_DIAGNOSTIC.copy()
        codes=set();controls=[]
        for node in root.iter('node'):
            if node.get('visible')=='false':continue
            values=(node.get('text',''),node.get('content-desc',''))
            for value in values:
                if value in LOGIN_MESSAGE_CODES:codes.add(LOGIN_MESSAGE_CODES[value])
            if any(value in ('Entrar','Sign in') for value in values):
                controls.append(login_control_metadata(node))
        result['messageCodes']=sorted(codes)
        result['submitControls']=controls
    except Exception as error:
        result['snapshotErrorClass']=type(error).__name__
    return result


def sanitize(value):
    for secret in _SECRET_VALUES:
        value = value.replace(secret,'[REDACTED]')
    value = re.sub(r'(?i)Bearer\s+[^\s<"\\]+','Bearer [REDACTED]',value)
    return re.sub(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[REDACTED_JWT]',value)

def adb(*args, timeout=20):
    started=time.monotonic();status='error'
    operation='adb-input' if args[:2]==('shell','input') else 'adb-window' if args[:3]==('shell','dumpsys','window') else 'adb-logcat' if args[:1]==('logcat',) else 'adb-other'
    try:
        try:
            result = subprocess.run(['adb',*args],check=False,capture_output=True,timeout=timeout)
        except (subprocess.SubprocessError,OSError):
            raise RuntimeError('Native command failed; sensitive details withheld') from None
        if result.returncode:
            raise RuntimeError('Native command returned failure; sensitive details withheld') from None
        status='ok'
        return result.stdout.decode('utf-8',errors='replace')
    finally:
        record_timing(operation,started,status)


def type_text_observed(value):
    # Real native key input gives controlled React fields time to accept each key.
    # The existing adb wrapper withholds argv and subprocess output on failures.
    assert isinstance(value,str) and len(value)<=254, 'Native text input exceeds the supported bounded scope'
    assert all(32<=ord(character)<=126 for character in value), 'Native text input requires printable ASCII'
    time.sleep(.1)
    for character in value:
        adb('shell','input','text',shlex.quote('%s' if character==' ' else character))
        time.sleep(.09)
    time.sleep(.2)


class QaDeadlineExceeded(BaseException):
    # A hard global deadline must escape socket/OS/subprocess retries and also
    # diagnostic "except Exception" blocks. Only main's BaseException handles it.
    pass


_TIMING_COUNT=0
def record_timing(operation,started,status='ok'):
    global _TIMING_COUNT
    if _TIMING_COUNT>=5000:return
    _TIMING_COUNT+=1
    assert operation in ('adb-input','adb-window','adb-logcat','adb-other','snapshot','snapshot-root','snapshot-tree')
    try:
        with out.joinpath('operation-timings.log').open('a',encoding='utf-8') as target:
            target.write(json.dumps({'operation':operation,'elapsedMs':round((time.monotonic()-started)*1000),
                                     'status':status})+'\n')
    except OSError:
        pass


class TransientSnapshotError(Exception):
    pass


_SNAPSHOT_PROCESS = None
_SNAPSHOT_PORT = None
_SNAPSHOT_SEQUENCE = 0


def start_snapshot_bridge():
    global _SNAPSHOT_PROCESS, _SNAPSHOT_PORT
    assert _SNAPSHOT_PROCESS is None, 'Snapshot helper already started'
    raw = adb('forward','tcp:0','localabstract:rwadar_qa_snapshot_140').strip()
    assert re.fullmatch(r'\d{1,5}',raw) and 0 < int(raw) < 65536, 'Invalid loopback port'
    _SNAPSHOT_PORT = int(raw)
    _SNAPSHOT_PROCESS = subprocess.Popen(
        ['adb','shell','am','instrument','-w','-r','com.rwadar.smoketest/.DumpRunner'],
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    deadline = time.monotonic()+12
    while time.monotonic()<deadline:
        if _SNAPSHOT_PROCESS.poll() is not None:
            raise RuntimeError('Read-only snapshot helper exited during startup')
        try:
            return dump_once(timeout=min(2,max(.1,deadline-time.monotonic())))
        except (OSError,EOFError,TransientSnapshotError):
            time.sleep(.1)
    raise TimeoutError('Read-only snapshot helper did not start')


def stop_snapshot_bridge():
    global _SNAPSHOT_PROCESS, _SNAPSHOT_PORT
    # No UI or credential data are written by the helper. Force-stop closes
    # UiAutomation/AF_UNIX; removing only our forward closes loopback exposure.
    try:
        adb('shell','am','force-stop','com.rwadar.smoketest',timeout=5)
    finally:
        if _SNAPSHOT_PORT is not None:
            try: adb('forward','--remove','tcp:'+str(_SNAPSHOT_PORT),timeout=5)
            finally: _SNAPSHOT_PORT=None
        if _SNAPSHOT_PROCESS is not None:
            _SNAPSHOT_PROCESS.terminate()
            try: _SNAPSHOT_PROCESS.wait(timeout=3)
            except subprocess.TimeoutExpired: _SNAPSHOT_PROCESS.kill()
            _SNAPSHOT_PROCESS=None


def read_snapshot_response(stream, nonce):
    # Per-connection request ID and bounded exact read prevent stale snapshots,
    # truncated XML, unbounded payloads and reuse of an earlier successful root.
    echoed = stream.readline(32)
    # adb forward can accept before the device abstract socket has bound.
    # Empty EOF is a startup/transport transition, not a valid stale response.
    if echoed == b'':
        raise EOFError('Snapshot transport closed before its response')
    assert echoed == (nonce+'\n').encode('ascii'), 'Fresh snapshot nonce mismatch'
    length = stream.readline(12)
    assert re.fullmatch(rb'(?:0|[1-9]\d{0,7})\n',length), 'Invalid snapshot size'
    count=int(length)
    assert count<=8*1024*1024, 'Snapshot exceeds bounded size'
    if count==0: raise TransientSnapshotError('No current active UI root')
    payload=stream.read(count)
    if len(payload)!=count: raise EOFError('Incomplete fresh snapshot')
    raw_xml=payload.decode('utf-8')
    if not CAPTURE_ALLOWED:
        inspect_login_input_values(raw_xml)
    xml=sanitize(raw_xml)
    raw_xml=None
    root=ET.fromstring(xml)
    assert root.tag=='hierarchy', 'Invalid fresh snapshot root'
    metrics=root.find('snapshot-metrics')
    if metrics is not None:
        for attribute,operation in (('root-ms','snapshot-root'),('tree-ms','snapshot-tree')):
            value=metrics.get(attribute,'')
            if re.fullmatch(r'\d{1,7}',value):
                record_timing(operation,time.monotonic()-int(value)/1000)
    return root,xml


def dump_once(timeout=30):
    global _SNAPSHOT_SEQUENCE
    assert _SNAPSHOT_PORT is not None, 'Read-only snapshot helper is not running'
    _SNAPSHOT_SEQUENCE += 1
    assert _SNAPSHOT_SEQUENCE < 10**8, 'Snapshot sequence exceeds bounded cycle'
    nonce=str(secrets.randbelow(10**20))+str(_SNAPSHOT_SEQUENCE).zfill(8)
    started=time.monotonic();status='error'
    try:
        with socket.create_connection(('127.0.0.1',_SNAPSHOT_PORT),timeout=timeout) as channel:
            channel.settimeout(timeout)
            channel.sendall((nonce+'\n').encode('ascii'))
            with channel.makefile('rb') as stream:
                root,xml=read_snapshot_response(stream,nonce)
        status='ok'
    finally:
        record_timing('snapshot',started,status)
    if CAPTURE_ALLOWED:
        out.joinpath('latest-ui.xml').write_text(xml,encoding='utf-8')
    return root


def dump(timeout=30):
    deadline = time.monotonic() + timeout
    while True:
        try:
            return dump_once(timeout=max(.1, deadline - time.monotonic()))
        except (TransientSnapshotError, socket.timeout, EOFError) as error:
            with out.joinpath('snapshot-errors.log').open('a', encoding='utf-8') as log:
                log.write(str(error) + '\n')
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise
            time.sleep(min(2, remaining))


def visible_text(root):
    return '\n'.join(value for node in root.iter('node') if node.get('visible') != 'false' for value in [node.get('text', ''), node.get('content-desc', '')] if value)


def wait_ui(*texts, timeout=75, absent=()):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            root = dump(timeout=min(30, max(.1, deadline - time.monotonic())))
            visible = visible_text(root)
            if all(text in visible for text in texts) and not any(text in visible for text in absent):
                return root
        except (subprocess.SubprocessError, ET.ParseError, TransientSnapshotError) as error:
            with out.joinpath('snapshot-errors.log').open('a', encoding='utf-8') as log:
                log.write(str(error) + '\n')
        time.sleep(2)
    raise AssertionError('Native UI did not visibly show: ' + ', '.join(texts))


def parse_window_state(raw):
    # Only current WindowManager metadata is accepted. InputMethod history and
    # mInputShown are deliberately excluded: either can outlive the actual IME.
    focus = re.search(r'^\s*mCurrentFocus=Window\{[^\r\n}]*\bu\d+\s+([A-Za-z][A-Za-z0-9_.]*)/', raw, re.M)
    package = focus.group(1) if focus else None
    windows = re.split(r'(?m)^\s*Window #\d+ ', raw)[1:]
    ime_visible = any(re.match(r'Window\{[^\r\n}]*\bInputMethod\}:', block)
                      and re.search(r'\bmHasSurface=true\b', block)
                      and re.search(r'\bisOnScreen=true\b', block)
                      for block in windows)
    return {'focusPackage':package, 'appFocused':package == APP_PACKAGE,
            'imeWindowVisible':bool(ime_visible)}


def window_state():
    # Android 15 prints mCurrentFocus in DisplayContent.dump, outside the
    # windows subcommand. Read both current sections; a full dump also includes
    # historical last-ANR state before them, which must not authorize input.
    displays = adb('shell','dumpsys','window','displays',timeout=5)
    windows = adb('shell','dumpsys','window','windows',timeout=5)
    return parse_window_state(displays + '\n' + windows)


def editable_metadata(root):
    # Never read text/value or emit an arbitrary content-desc. Only known static
    # labels and structural EditText attributes can leave the credentials phase.
    result=[]
    for node in root.iter('node'):
        if node.get('class')!='android.widget.EditText' or node.get('package')!=APP_PACKAGE:
            continue
        label=node.get('content-desc','')
        bounds=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
        item={'label':label if label in EDITABLE_LABELS else 'other-editable',
              'class':'android.widget.EditText',
              'bounds':bounds if len(bounds)==4 else None}
        for key in ('focused','password','visible','enabled'):
            value=node.get(key)
            item[key]=value if value in ('true','false') else None
        result.append(item)
    return result


def observed_scroll_viewport(root,dimensions=None,ancestor_of=None):
    # Android ScrollView is vertical; HorizontalScrollView is a different class.
    # Recycler/WebView nested scrollers are excluded by an observed outer scroll
    # ancestor, not by width/height guesses that reject legitimate short lists.
    kinds=('android.widget.ScrollView','androidx.recyclerview.widget.RecyclerView','android.webkit.WebView')
    parents={child:parent for parent in root.iter() for child in parent}
    candidates={}
    for node in root.iter('node'):
        if node.get('visible')=='false' or node.get('class') not in kinds:continue
        if ancestor_of is not None and not any(child is ancestor_of for child in node.iter('node')):continue
        box=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
        if len(box)!=4 or not (0<=box[0]<box[2] and 0<=box[1]<box[3] and box[3]-box[1]>=80):continue
        if dimensions is not None and not (box[2]<=dimensions[0] and box[3]<=dimensions[1]):continue
        candidates[node]=box
    outer=[]
    for node,box in candidates.items():
        parent=parents.get(node)
        while parent is not None and parent not in candidates:parent=parents.get(parent)
        if parent is None:outer.append((node,box))
    assert len(outer)==1, 'Need one fully observed outer vertical scroll viewport'
    return outer[0]


def editable_scroll_direction(root,node,width,height):
    viewport,box=observed_scroll_viewport(root,(width,height),ancestor_of=node)
    bounds=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
    assert len(bounds)==4 and box[0]<=bounds[0]<bounds[2]<=box[2], 'Native field horizontal bounds are ambiguous'
    if box[1]<bounds[1]<bounds[3]<box[3] and node.get('visible')!='false':
        return box,bounds,None
    # Accessibility clips off-screen fields to the viewport, sometimes yielding
    # inverted vertical bounds. Their edge relative to this real viewport still
    # establishes direction, but never authorizes a tap on the clipped rectangle.
    if bounds[1]>=box[3] or (box[1]<=bounds[1] and bounds[3]>=box[3]):
        return box,bounds,True
    if bounds[3]<=box[1] or (bounds[1]<=box[1] and bounds[3]<=box[3]):
        return box,bounds,False
    raise AssertionError('Native field clipping has no unambiguous scroll direction')


def focus_exact_editable(label, secret=False):
    global LAST_EDITABLE_DIAGNOSTIC
    assert label in EDITABLE_LABELS, 'Native field label is outside the static QA whitelist'
    LAST_EDITABLE_DIAGNOSTIC={'targetLabel':label,'scrolls':[]}
    width,height=display_size()
    root=dump()
    for attempt in range(6):
        LAST_EDITABLE_DIAGNOSTIC['beforeTap']=editable_metadata(root)
        nodes=[n for n in root.iter('node') if n.get('package')==APP_PACKAGE
               and n.get('class')=='android.widget.EditText'
               and n.get('content-desc')==label and n.get('enabled')!='false']
        assert len(nodes)==1, 'Need exactly one enabled native EditText'
        node=nodes[0]
        assert not secret or node.get('password')=='true', 'Password field must be masked'
        viewport,bounds,forward=editable_scroll_direction(root,node,width,height)
        assert window_state()['appFocused'], 'Native field interaction requires current app focus'
        if forward is None:
            adb('shell','input','tap',str((bounds[0]+bounds[2])//2),str((bounds[1]+bounds[3])//2))
            return wait_editable(label,secret=secret)
        assert attempt<5, 'Native EditText did not become fully visible within the bounded scrolls'
        LAST_EDITABLE_DIAGNOSTIC['scrolls'].append({'viewportBounds':viewport,'fieldBounds':bounds,'forward':forward})
        # Existing observed free-margin geometry is the only authorized gesture.
        # scroll_step returns a fresh tree and never stores field values.
        root,moved=scroll_step(forward,root)
        assert moved, 'Observed native field scroll made no progress'


def wait_editable(label, secret=False, timeout=12):
    global LAST_EDITABLE_DIAGNOSTIC
    if LAST_EDITABLE_DIAGNOSTIC.get('targetLabel')!=label:
        LAST_EDITABLE_DIAGNOSTIC={'targetLabel':label if label in EDITABLE_LABELS else 'other-editable'}
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            root = dump(timeout=min(5, max(.1, deadline - time.monotonic())))
        except (ET.ParseError, TransientSnapshotError):
            time.sleep(.15)
            continue
        LAST_EDITABLE_DIAGNOSTIC['afterTap']=editable_metadata(root)
        nodes = [n for n in root.iter('node') if n.get('package') == APP_PACKAGE
                 and n.get('class') == 'android.widget.EditText'
                 and n.get('content-desc') == label and n.get('visible') != 'false'
                 and n.get('enabled') != 'false' and n.get('focused') == 'true']
        if len(nodes) == 1:
            bounds = list(map(int,re.findall(r'-?\d+',nodes[0].get('bounds',''))))
            if len(bounds) == 4 and bounds[0] < bounds[2] and bounds[1] < bounds[3]:
                assert not secret or nodes[0].get('password') == 'true', 'Password field must be masked'
                assert window_state()['appFocused'], 'Native input requires the current app window focus'
                return root
        time.sleep(.15)
    raise AssertionError('Native editable did not acquire visible focus')


def dismiss_keyboard_if_visible():
    global LAST_KEYBOARD_DIAGNOSTIC
    state = window_state()
    LAST_KEYBOARD_DIAGNOSTIC = dict(state, action='no-back-without-visible-ime')
    assert state['appFocused'], 'Native input left the app window'
    if not state['imeWindowVisible']:
        return
    # A single Back is allowed only with current app focus and a surfaced,
    # on-screen IME window. Never repeat Back based on a stale global flag.
    LAST_KEYBOARD_DIAGNOSTIC['action'] = 'single-back-for-visible-ime'
    adb('shell','input','keyevent','KEYCODE_BACK')
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        state = window_state()
        LAST_KEYBOARD_DIAGNOSTIC['after'] = state
        if state['focusPackage'] is None:
            # Window transitions may briefly have no focus. Read only until
            # RWAdar regains it; a real different package still fails below.
            time.sleep(.1)
            continue
        assert state['appFocused'], 'App window focus lost after keyboard dismissal'
        if not state['imeWindowVisible']:
            return
        time.sleep(.1)
    raise AssertionError('Visible keyboard did not dismiss after one Back')


def safe_device_diagnostic():
    # Raw dumpsys/logcat, UI values and exception arguments never leave memory.
    result = {'lastKeyboard':LAST_KEYBOARD_DIAGNOSTIC.copy(),
              'editableAttempt':LAST_EDITABLE_DIAGNOSTIC.copy()}
    try:
        result['window'] = window_state()
    except Exception as error:
        result['windowReadFailure'] = type(error).__name__
    try:
        process = subprocess.run(['adb','shell','pidof',APP_PACKAGE],
                                 check=False,capture_output=True,timeout=5)
        if process.returncode == 0 and re.fullmatch(rb'\d+(?:\s+\d+)*',process.stdout.strip()):
            result['appProcessAlive'] = True
        elif process.returncode == 1 and not process.stdout.strip() and not process.stderr.strip():
            result['appProcessAlive'] = False
        else:
            result['processReadFailure'] = 'UnrecognizedProcessResult'
    except Exception as error:
        # A missing PID does not by itself prove a crash. Never expose argv.
        result['processReadFailure'] = type(error).__name__
    return result


def screen(name, root=None):
    if not CAPTURE_ALLOWED:
        return
    image = subprocess.run(['adb', 'exec-out', 'screencap', '-p'], check=True, capture_output=True, timeout=20).stdout
    assert image.startswith(b'\x89PNG'), 'Screenshot must be a real PNG'
    out.joinpath(name + '.png').write_bytes(image)
    if root is not None:
        out.joinpath(name + '.xml').write_text(ET.tostring(root, encoding='unicode'), encoding='utf-8')


def capture_failure(name):
    if not CAPTURE_ALLOWED:
        return
    # Capture the failing viewport before finally restores display/font settings.
    # Keep the original assertion if either diagnostic operation also fails.
    for kind, operation in [('png', lambda: screen(name)),
                            ('xml', lambda: out.joinpath(name + '.xml').write_text(
                                ET.tostring(dump(timeout=10), encoding='unicode'), encoding='utf-8'))]:
        try:
            operation()
        except Exception as error:
            with out.joinpath('failure-capture-errors.log').open('a', encoding='utf-8') as log:
                log.write(name + '.' + kind + ': ' + type(error).__name__ + '\n')


def display_size():
    data = subprocess.run(['adb', 'exec-out', 'screencap', '-p'], check=True, capture_output=True, timeout=20).stdout
    assert data.startswith(b'\x89PNG'), 'Need actual rotated display dimensions'
    return struct.unpack('>II', data[16:24])


def find_node(root, label, starts=False):
    candidates = []
    for node in root.iter('node'):
        values = [node.get('content-desc', ''), node.get('text', '')]
        if node.get('visible') != 'false' and any(v.startswith(label) if starts else v == label for v in values):
            candidates.append(node)
    candidates.sort(key=lambda n: n.get('clickable') != 'true')
    for node in candidates:
        bounds = list(map(int, re.findall(r'-?\d+', node.get('bounds', ''))))
        if len(bounds) == 4 and bounds[2] > bounds[0] and bounds[3] > bounds[1]:
            return node, bounds
    raise AssertionError('Accessible control not found: ' + label)


def tap_observed(root, label, starts=False):
    node, bounds = find_node(root, label, starts)
    adb('shell', 'input', 'tap', str((bounds[0]+bounds[2])//2), str((bounds[1]+bounds[3])//2))
    return node


def scroll_trajectories(root, dimensions, forward):
    # Pure geometry: keep the whole vertical path in an observed content margin.
    # In particular, a swipe starting inside EditText can be consumed by that field.
    width, height = dimensions
    viewport,bounds=observed_scroll_viewport(root,dimensions)
    left, top, right, bottom = bounds
    low = top + int((bottom-top)*.16)
    high = top + int((bottom-top)*.84)
    start, end = (high, low) if forward else (low, high)
    assert top < min(start,end) < max(start,end) < bottom, 'Gesture must stay inside the observed viewport'
    excluded = []
    is_web = viewport.get('class') == 'android.webkit.WebView'
    for node in viewport.iter('node'):
        if node is viewport:
            continue
        if is_web and not (node.get('clickable') == 'true' or node.get('class') == 'android.widget.EditText'):
            continue
        if node.get('visible') == 'false' or not (node.get('text') or node.get('content-desc')
                or node.get('clickable') == 'true' or node.get('class') == 'android.widget.EditText'):
            continue
        item = list(map(int, re.findall(r'-?\d+', node.get('bounds', ''))))
        if len(item) == 4 and item[0] < item[2] and item[1] < item[3] and item[1] < high and item[3] > low:
            clipped = [max(left,item[0]), max(top,item[1]), min(right,item[2]), min(bottom,item[3])]
            if clipped[0] < clipped[2] and clipped[1] < clipped[3]:
                excluded.append(clipped)
    clearance = 2 if is_web else max(2, min(16, (right-left)//100))
    content_left = min((item[0] for item in excluded), default=right)
    content_right = max((item[2] for item in excluded), default=left)
    margins = [(left+clearance, content_left-clearance), (content_right+clearance, right-clearance)]
    trajectories = []
    for margin_left, margin_right in margins:
        if margin_right-margin_left < clearance:
            continue
        x = (margin_left+margin_right)//2
        assert left < x < right and all(not (item[0] <= x <= item[2]) for item in excluded)
        if any(path['start'][0] == x for path in trajectories):
            continue
        trajectories.append({'display':[width,height], 'bounds':bounds,
            'direction':'forward' if forward else 'backward', 'start':[x,start], 'end':[x,end],
            'freeMargin':[margin_left,low,margin_right,high], 'excludedBounds':excluded})
    assert trajectories, 'No observed free content margin for a native vertical swipe'
    return trajectories


def swipe_scroll(forward, root, alternative=False):
    paths = scroll_trajectories(root, display_size(), forward)
    index = 1 if alternative else 0
    assert index < len(paths), 'No second distinct observed free margin for a stalled swipe'
    gesture = paths[index]
    gesture['attempt'] = 'alternative' if alternative else 'primary'
    scroll_gestures.append(gesture)
    out.joinpath('native-scroll-gestures.json').write_text(json.dumps(scroll_gestures,indent=2),encoding='utf-8')
    adb('shell','input','swipe',str(gesture['start'][0]),str(gesture['start'][1]),
        str(gesture['end'][0]),str(gesture['end'][1]),'450')
    return gesture


def scroll_step(forward, root):
    before = scroll_position(root)
    for alternative in (False, True):
        gesture = swipe_scroll(forward, root, alternative=alternative)
        time.sleep(.5)
        root = dump()
        gesture['positionChanged'] = scroll_position(root) != before
        out.joinpath('native-scroll-gestures.json').write_text(json.dumps(scroll_gestures,indent=2),encoding='utf-8')
        if gesture['positionChanged']:
            return root, True
    return root, False


MAX_SCROLL_OBSERVATIONS=64

def scroll_top():
    root = dump()
    for _ in range(MAX_SCROLL_OBSERVATIONS):
        root, moved = scroll_step(forward=False, root=root)
        if not moved:
            return
    capture_failure('scroll-top-not-reached')
    raise AssertionError('Native scrolling did not reach a stable top edge')


def reach_control(label, starts=False):
    root = dump()
    for _ in range(MAX_SCROLL_OBSERVATIONS):
        try:
            find_node(root, label, starts=starts)
            return root
        except AssertionError:
            root, moved = scroll_step(forward=True, root=root)
            if not moved:
                break
    capture_failure('control-not-reached-' + re.sub(r'[^a-z0-9]+','-',label.lower()).strip('-')[:70])
    raise AssertionError('Control not reachable by native scrolling: ' + label)


def scroll_position(root):
    # Observe actual scroll content, never status bars, fixed navigation, input
    # values, clocks, or Radar's continuously rotating SVG descendant bounds.
    viewport,box=observed_scroll_viewport(root)
    anchors=[]
    for node in viewport.iter('node'):
        kind=node.get('class','')
        if node is viewport or node.get('visible')=='false' or kind.startswith('com.horcrux.svg.') or kind in ('android.widget.TextClock','android.widget.AnalogClock'):continue
        desc=node.get('content-desc','')
        semantic=kind in ('android.widget.TextView','android.widget.EditText','android.widget.Button','android.widget.ImageView') or bool(desc) or bool(node.get('text'))
        if not semantic:continue
        bounds=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
        if len(bounds)!=4 or not (box[0]<=bounds[0]<bounds[2]<=box[2] and box[1]<=bounds[1]<bounds[3]<=box[3]):continue
        # Stable accessible controls distinguish virtualized rows occupying the
        # same coordinates. Editable values never establish progress.
        identity=desc if kind=='android.widget.EditText' else (desc or node.get('text',''))
        anchors.append((kind,identity,tuple(bounds)))
    assert anchors, 'No stable observed content anchors for scroll progress'
    return tuple(sorted(anchors))
