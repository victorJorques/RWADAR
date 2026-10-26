"""Pending native catalog criteria reused from android-suite-140.py; no APK18 PASS."""
import hashlib, json, os, pathlib, re, sys, time, xml.etree.ElementTree as ET
import native_ui_140 as ui
out=ui.out
expected_counts={'plataformas':26,'principales':24,'secundario':21,'en_camino':4}
collections={k:expected_counts[k] for k in ('principales','secundario','en_camino')}
geometry=[]
traversals={}
editorial_checked=[]
REAUTHENTICATE=None
RADAR_RESTORE=None
CLICK=None
FIELD=None
LOCATE=None
for _name in ('adb','dump','visible_text','wait_ui','screen','capture_failure','display_size','find_node','tap_observed','scroll_top','reach_control'):
    globals()[_name]=getattr(ui,_name)


# Private progress is evidence of completed observations, never release approval.
_CATALOG_PROGRESS=None
_RADAR_PRIOR_SHA='6c84d3f90648bb66b1f3bb824ee5fcf8d9a0416d9d83679a13f7ab4ca7feccee'

def _checkpoint(criterion, status, details):
    global _CATALOG_PROGRESS
    from candidate_140 import load_candidate
    candidate=load_candidate()
    identity={k:candidate[k] for k in ('apkSha256','apkBytes','versionCode','sourceHeadSha')}
    if _CATALOG_PROGRESS is None:
        _CATALOG_PROGRESS={'schemaVersion':1,'runId':os.environ.get('GITHUB_RUN_ID'),
            **identity,'harnessHeadSha':os.environ.get('GITHUB_SHA'),'criteria':{},
            'full20PointQA':False,'releaseApproved':False}
    assert all(_CATALOG_PROGRESS[k]==v for k,v in identity.items()), 'Checkpoint candidate identity changed'
    _CATALOG_PROGRESS['criteria'][criterion]={'status':status,'details':details}
    data=json.dumps(_CATALOG_PROGRESS,ensure_ascii=False,indent=2)
    target=out/'native-catalog-checkpoints.json';temporary=out/'.native-catalog-checkpoints.tmp'
    with temporary.open('w',encoding='utf-8') as stream:
        stream.write(data);stream.flush();os.fsync(stream.fileno())
    os.replace(temporary,target)


def _radar_prior():
    from candidate_140 import load_candidate
    candidate=load_candidate()
    raw=pathlib.Path(__file__).resolve().parent.joinpath('baseline-c20-radar-partial-40377929429.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()==_RADAR_PRIOR_SHA, 'Private partial radar proof identity mismatch'
    prior=json.loads(raw)
    assert prior['runId']==40377929429 and prior['jobId']==121765988236
    assert prior['historicalOutcome']=='interrupted-timeout' and prior['radarCriterionComplete'] is False
    assert prior['full20PointQA'] is False and prior['releaseApproved'] is False
    assert all(prior[k]==candidate[k] for k in ('apkSha256','apkBytes','versionCode','sourceHeadSha'))
    assert prior['harnessHeadSha']=='a9ccdb8793df2bbe1f9913d601bf485e42689710'
    assert prior['harnessFileSha256']=='6610692be5d2a644c0d86057ca888c88f0831cd8b61025e0b58d162a6c9f7a93'
    observations=prior['reusableObservations'];witnesses=prior['xmlWitnesses']
    assert len(observations)==21 and len(witnesses)==22 and [p['index'] for p in observations]==list(range(21))
    assert len({p['platformName'] for p in observations})==21
    assert all(p['platformName']==witnesses[p['index']]['platformName'] and p['modalXmlSha256']==witnesses[p['index']]['sha256'] for p in observations)
    assert all(p['originalCentreValuesRetained'] is False and p['originalEventPayloadRetained'] is False for p in observations)
    # The pinned manifest is root-reviewable inference, not invented coordinates
    # or copied native event payloads. No authenticated result is inherited.
    return prior


def scroll_down():
    _,moved=ui.scroll_step(True,ui.dump())
    return moved

editorial_samples = [
  {
    "query": "Spiko",
    "title": "Spiko Letras del Tesoro Euro",
    "slug": "spiko-letras-del-tesoro-euro",
    "group": "principales",
    "location": "Zona euro",
    "alt": "Ilustración editorial de un edificio ministerial neoclásico genérico, como imagen de un fondo que compra letras del Tesoro de la zona euro, imagen generada con IA. Pasos: compras participaciones; el fondo compra letras; pides el reembolso. No es una foto del activo real."
  },
  {
    "query": "Outeiro",
    "title": "Casa de Outeiro",
    "slug": "casa-de-outeiro",
    "group": "principales",
    "location": "Ribeira Sacra · Lugo",
    "alt": "Ilustración editorial de una casa solariega de piedra restaurada entre viñedos en terrazas sobre un cañón fluvial de la Ribeira Sacra, parecida a la real, imagen generada con IA. Pasos: suscribes la ampliación; recibes tus acciones; socio de bodega y hotel. No es una foto del activo real."
  },
  {
    "query": "Prosegur",
    "title": "Prosegur Digital Gold",
    "slug": "prosegur-digital-gold",
    "group": "principales",
    "location": "Custodia en España",
    "alt": "Ilustración editorial de unos lingotes de oro sin marcas en una cámara acorazada, imagen generada con IA. Pasos: compras gramos de oro; se guarda en una cámara; vendes y cobras en euros. No es una foto del activo real."
  },
  {
    "query": "GreenPoint",
    "title": "Fotovoltaica GreenPoint",
    "slug": "fotovoltaica-greenpoint",
    "group": "principales",
    "location": "Wiener Neustadt · Austria",
    "alt": "Ilustración editorial de unos paneles solares en la cubierta de un edificio de oficinas de una ciudad austriaca, imagen generada con IA. Pasos: compras participaciones; los paneles dan energía; reparto del excedente. No es una foto del activo real."
  },
  {
    "query": "Houston 3",
    "title": "Houston 3",
    "slug": "reental-secundario-houston-3",
    "group": "secundario",
    "location": "Houston · EE. UU.",
    "alt": "Ilustración editorial de una hilera de casas estrechas de tres plantas con garaje en Houston, parecida a la real, imagen generada con IA. Pasos: compras si hay oferta; la casa se alquila; reparto o reventa. No es una foto del activo real."
  }
]

def reach_catalog_total(english=False,root=None):
    # The counter is inside FlatList's scrollable header, below selectors and
    # explanatory copy. Being loaded never implies being in the viewport.
    target='49 in the catalogue' if english else '49 en el catálogo'
    width,height=display_size()
    root=root if root is not None else dump(timeout=5)
    for attempt in range(6):
        nodes=[n for n in root.iter('node') if target in n.get('text','') or target in n.get('content-desc','')]
        if not nodes:
            # Its source position is the list header; return there using only
            # observed free-margin geometry, never a guessed swipe coordinate.
            assert attempt==0, 'Loaded catalog counter is absent from its header'
            ui.scroll_top();root=dump(timeout=5);continue
        assert len(nodes)==1, 'Catalog counter is ambiguous'
        # This passive text may align exactly with an observed viewport edge.
        # Editable focus retains its separate, strict inset requirement.
        _,box=ui.observed_scroll_viewport(root,(width,height),ancestor_of=nodes[0])
        bounds=list(map(int,re.findall(r'-?\d+',nodes[0].get('bounds',''))))
        if (nodes[0].get('visible')=='true' and len(bounds)==4
                and box[0]<=bounds[0]<bounds[2]<=box[2]
                and box[1]<=bounds[1]<bounds[3]<=box[3]):return root
        _,_,forward=ui.editable_scroll_direction(root,nodes[0],width,height)
        if forward is None:return root
        assert attempt<5, 'Catalog counter did not enter the bounded observed viewport'
        root,moved=ui.scroll_step(forward,root)
        assert moved, 'Observed scroll made no progress toward the catalog counter'
    raise AssertionError('Catalog counter not fully observed')


def open_offer_catalog(english=False):
    # Selecting Search preserves its last inner view. Set both navigation levels
    # explicitly, including after an Activity recreation that returned to Home.
    labels=('Home','Search','Profile') if english else ('Inicio','Buscar','Perfil')
    root=wait_ui(*labels)
    tap_observed(root,'Search' if english else 'Buscar')
    offers='Show offers' if english else 'Mostrar ofertas'
    root=wait_ui(offers)
    tap_observed(root,offers,starts=True)
    wait_ui('Show offers 49' if english else 'Mostrar ofertas 49',timeout=40)
    return reach_catalog_total(english)


def open_platform_radar(english=False):
    open_offer_catalog(english)
    ui.scroll_top()
    platforms='Show platforms' if english else 'Mostrar plataformas'
    root=wait_ui(platforms)
    tap_observed(root,platforms,starts=True)
    wait_ui('26 platforms' if english else '26 plataformas',timeout=40)
    return wait_ui('Explore documented information' if english else 'Explora lo verificado')


def radar_center_checks():
    # Exercise actual input events at each observed visible point centre. The
    # native receiver may be a different overlapping box; the opened platform
    # and the release's local event trace must both identify the visible point.
    assert isinstance(RADAR_RESTORE,dict), 'Initial display restoration metadata required'
    prior_density=RADAR_RESTORE['density']; prior_size=RADAR_RESTORE['size']; prior_font=RADAR_RESTORE['font']
    reports = []
    _radar_direct_checkpoint=[]
    prior=_radar_prior()
    reused=prior['reusableObservations']
    _checkpoint('radar26Centers320dp','running',{'inferredCount':21,'directCount':0,'priorManifestSha256':_RADAR_PRIOR_SHA,'historicalOutcome':'interrupted-timeout'})
    try:
        assert display_size()==(960,1920), 'Main must configure320dp before the first authenticated launch'
        assert float(adb('shell','settings','get','system','font_scale').strip())==1.0
        open_platform_radar()
        ui.scroll_top()
        current=dump()
        width,height=display_size()
        visited={p['platformName'] for p in reused}
        seen_current_names=set()
        for step in range(52):
            viewports=[]
            for node in current.iter('node'):
                if node.get('class') not in ('android.widget.ScrollView','androidx.recyclerview.widget.RecyclerView') or node.get('visible')=='false':continue
                box=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
                if len(box)==4 and 0<=box[0]<box[2]<=width and 0<=box[1]<box[3]<=height and box[3]-box[1]>=max(80,(box[2]-box[0])//2):viewports.append((node,box))
            assert len(viewports)==1, 'Need one observed vertical radar viewport'
            viewport,viewbox=viewports[0]
            points=[]
            for node in viewport.iter('node'):
                label=node.get('content-desc','')
                if node.get('visible')=='false' or '. Estado de acceso: ' not in label or not label.endswith('. Abrir ficha.'):continue
                bounds=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
                # Native bounds are clipped by ScrollView. A full44dp box at
                #480dpi is132px; its centre is trustworthy only when unclipped.
                if len(bounds)!=4 or not (viewbox[0]<=bounds[0]<bounds[2]<=viewbox[2] and viewbox[1]<=bounds[1]<bounds[3]<=viewbox[3]):continue
                if not (131<=bounds[2]-bounds[0]<=133 and 131<=bounds[3]-bounds[1]<=133):continue
                name=label.split('. Estado de acceso: ',1)[0].rsplit('. ',1)[0]
                seen_current_names.add(name)
                if name not in visited:points.append({'name':name,'label':label,'bounds':bounds})
            if not points:
                assert len(visited)<expected_counts['plataformas']
                current,moved=ui.scroll_step(True,current)
                assert moved, 'Reached end of radar viewport before observing all26 complete point boxes'
                continue
            point=points[0];bounds=point['bounds']
            centre=[(bounds[0]+bounds[2])//2,(bounds[1]+bounds[3])//2]
            adb('shell','input','tap',*map(str,centre))
            current=wait_ui('Cerrar ficha de '+point['name'],timeout=30)
            find_node(current,point['name'])
            index=len(visited)
            out.joinpath('00-radar-centro-%02d.xml' % index).write_text(ET.tostring(current,encoding='unicode'),encoding='utf-8')
            if index in (0,13,25):screen('00-radar-centro-%02d' % index,current)
            log=adb('logcat','-d','-v','raw','ReactNativeJS:I','*:S')
            events=[]
            for line in log.splitlines():
                if 'RWADAR_RADAR_TOUCH' not in line:continue
                match=re.search(r'(\{.*\})',line)
                if match:
                    try:events.append(json.loads(match[1]))
                    except json.JSONDecodeError:pass
            assert events, 'Actual release must expose the local native event-shape evidence'
            event=events[-1]
            assert event['selectedName']==point['name'], 'Observed centre must open its own platform'
            assert type(event['changedTouches']) is int and event['changedTouches']>=1, 'Android onPress must carry a real end-event touch sequence'
            assert event['eventType']!='click', 'Requires physical pointer input, not accessibility click'
            assert point['name'] not in visited
            visited.add(point['name'])
            reports.append({'name':point['name'],'centre':centre,'bounds':bounds,'viewportBounds':viewbox,'event':event,'openedOwnPlatform':True})
            tap_observed(current,'Cerrar ficha de '+point['name'])
            current=wait_ui(point['label'],absent=('Cerrar ficha de '+point['name'],))
            # Commit only after event assertions AND observed close/return.
            snapshot=out/('00-radar-centro-%02d.xml' % index)
            direct={'index':index,'name':point['name'],'centre':centre,'bounds':bounds,'viewportBounds':viewbox,
                    'event':{'selectedName':event['selectedName'],'changedTouches':event['changedTouches'],'eventType':event['eventType']},
                    'openedOwnPlatform':True,'closedAndReturned':True,'modalXml':snapshot.name,
                    'modalXmlSha256':hashlib.sha256(snapshot.read_bytes()).hexdigest()}
            _checkpoint('radar26Centers320dp','running',{'inferredCount':len(reused),'directCount':len(reports),
                'priorManifestSha256':_RADAR_PRIOR_SHA,'historicalOutcome':'interrupted-timeout',
                'inferredObservations':reused,'directObservations':_radar_direct_checkpoint+[direct]})
            _radar_direct_checkpoint.append(direct)
            if len(visited)==expected_counts['plataformas']:break
        if seen_current_names!=visited:
            # Reuse never substitutes for observing the current full catalogue.
            # If the five fresh opens did not expose every prior point, make
            # one bounded coverage-only scroll; no platform is tapped again.
            ui.scroll_top();current=dump()
            for coverage_step in range(52):
                viewports=[]
                for node in current.iter('node'):
                    if node.get('class') not in ('android.widget.ScrollView','androidx.recyclerview.widget.RecyclerView') or node.get('visible')=='false':continue
                    box=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
                    if len(box)==4 and 0<=box[0]<box[2]<=width and 0<=box[1]<box[3]<=height and box[3]-box[1]>=max(80,(box[2]-box[0])//2):viewports.append((node,box))
                assert len(viewports)==1, 'Need one observed radar viewport for current-name coverage'
                viewport,viewbox=viewports[0]
                for node in viewport.iter('node'):
                    label=node.get('content-desc','')
                    if node.get('visible')=='false' or '. Estado de acceso: ' not in label or not label.endswith('. Abrir ficha.'):continue
                    bounds=list(map(int,re.findall(r'-?\d+',node.get('bounds',''))))
                    if len(bounds)!=4 or not (viewbox[0]<=bounds[0]<bounds[2]<=viewbox[2] and viewbox[1]<=bounds[1]<bounds[3]<=viewbox[3]):continue
                    if not (131<=bounds[2]-bounds[0]<=133 and 131<=bounds[3]-bounds[1]<=133):continue
                    seen_current_names.add(label.split('. Estado de acceso: ',1)[0].rsplit('. ',1)[0])
                if seen_current_names==visited:break
                current,moved=ui.scroll_step(True,current)
                if not moved:break
        assert {p['platformName'] for p in reused}<=seen_current_names, 'All21 reused radar names must still be fully observed in this run'
        assert seen_current_names==visited and len(seen_current_names)==26, 'Current radar identities differ from the26 combined observations'
        assert len(reused)==21 and len(reports)==5 and len(visited)==26, 'Need21 inferred completed observations plus5 new unique direct real centre taps'
        out.joinpath('radar-native-centres.json').write_text(json.dumps({'display':[width,height],
            'densityDpi':480,'widthDp':320,'points':reports,
            'reusedInferredObservations':reused,'priorManifestSha256':_RADAR_PRIOR_SHA,
            'priorRunId':40377929429,'priorHistoricalOutcome':'interrupted-timeout',
            'directCount':5,'inferredCount':21,'originalEventValuesRetainedForDirectOnly':True,
            'all26NamesObservedInCurrentRun':True,'currentObservedNames':sorted(seen_current_names),
            'simultaneousVisibilityRequired':False,'scope':'26 unique exact centres observed across safe scroll positions; not exclusive44dp regions or TalkBack traversal'},indent=2),encoding='utf-8')
    except Exception as error:
        _checkpoint('radar26Centers320dp','interrupted',{'inferredCount':len(reused),'directCount':len(_radar_direct_checkpoint),
            'directObservations':_radar_direct_checkpoint,'priorManifestSha256':_RADAR_PRIOR_SHA,'exceptionClass':type(error).__name__})
        capture_failure('00-radar-320dp-failure')
        raise
    finally:
        # Cleanup must preserve the original QA exception and the JS session.
        original_error_active=sys.exc_info()[0] is not None
        density=re.search(r'Override density:\s*(\d+)',prior_density)
        size=re.search(r'Override size:\s*(\d+x\d+)',prior_size)
        cleanup_errors=[]
        commands=[('shell','wm','density',density[1] if density else 'reset'),
                  ('shell','wm','size',size[1] if size else 'reset'),
                  ('shell','settings','put','system','font_scale',prior_font if prior_font not in ('','null') else '1.0')]
        for command in commands:
            try: adb(*command)
            except Exception as error: cleanup_errors.append(type(error).__name__)
        if cleanup_errors:
            out.joinpath('radar-cleanup-errors.json').write_text(json.dumps(cleanup_errors),encoding='utf-8')
            if not original_error_active: raise RuntimeError('Radar display restoration failed; sensitive details withheld')
    summary={'checked':True,'count':len(reused)+len(reports),'widthDp':320,'changedTouchesPresent':True,
             'allVisibleCentresOpenOwnPlatform':True,'exclusive44DpRegionsTested':False,
             'inferredCount':21,'directCount':5,'all26NamesObservedInCurrentRun':True,
             'currentObservedNames':sorted(seen_current_names),'priorManifestSha256':_RADAR_PRIOR_SHA,
             'priorRunId':40377929429,'priorHistoricalOutcome':'interrupted-timeout',
             'inferenceScope':'Prior21 assertion observations inferred from pinned code and next-iteration XML;5 direct fresh observations; no prior coordinate/event values invented'}
    _checkpoint('radar26Centers320dp','validated-scope-only',{'summary':summary,'inferredObservations':reused,'directObservations':_radar_direct_checkpoint})
    return summary


def document_detail(prefix, title, required, forbidden=(), inspect=None, scan_to_end=False, capture_all=False, language='es'):
    root = wait_ui(('Close ' if language == 'en' else 'Cerrar ') + title)
    remaining = set(required)
    previous_text = None
    observed = []
    for index in range(40):
        root = dump()
        text = visible_text(root)
        observed.append(text)
        if inspect:
            inspect(root)
        assert not any(item in text for item in forbidden), 'Commercial claim in documentary detail: ' + text
        newly = {item for item in remaining if item in text}
        if newly or index == 0 or capture_all:
            screen(prefix + '-%02d' % index, root)
        remaining -= newly
        if not remaining and not scan_to_end:
            if scan_to_end:
                screen(prefix + '-complete', root)
            traversals[prefix] = observed
            return root
        previous_text = text
        if not scroll_down():
            assert not remaining, 'Missing visible documentary evidence: ' + ', '.join(sorted(remaining))
            traversals[prefix] = observed
            screen(prefix + '-complete',dump())
            return dump()
    raise AssertionError('Missing visible documentary evidence: ' + ', '.join(sorted(remaining)))


def search(root, query):
    # Reset through the actual accessible native control; do not rely
    # on a stale tree, keyboard shortcuts, or an unobserved coordinate.
    scroll_top()
    root = dump()
    try:
        find_node(root, 'Limpiar búsqueda y filtros de ofertas')
    except AssertionError:
        pass
    else:
        tap_observed(root, 'Limpiar búsqueda y filtros de ofertas')
        time.sleep(.5)
        root = wait_ui('Ofertas específicas')
    root = reach_control('Buscar ofertas por nombre, proveedor, país o métrica')
    ui.focus_exact_editable('Buscar ofertas por nombre, proveedor, país o métrica')
    ui.type_text_observed(query)
    ui.dismiss_keyboard_if_visible()
    # The query and result counter occupy different viewport positions. Verify
    # the actual native EditText value, then observe the counter separately.
    root=dump()
    inputs=[node for node in root.iter('node') if node.get('package')=='com.rwadar.app'
            and node.get('class')=='android.widget.EditText'
            and node.get('content-desc')=='Buscar ofertas por nombre, proveedor, país o métrica']
    assert len(inputs)==1 and inputs[0].get('text')==query, 'Observed native search field does not contain the exact query'
    reach_catalog_total(root=root)
    return wait_ui('1 de ')


def open_collection(collection):
    assert collection in ('principales','secundario'), 'Collection must use a static supported selector'
    scroll_top()
    root = dump()
    try:
        find_node(root, 'Limpiar búsqueda y filtros de ofertas')
    except AssertionError:
        pass
    else:
        tap_observed(root, 'Limpiar búsqueda y filtros de ofertas')
        time.sleep(.5)
    label = ('Mostrar principales ' if collection == 'principales' else 'Mostrar reventa ') + str(expected_counts[collection])
    root = reach_control(label)
    diagnostic={'selector':label,'attempts':[]}
    target=out.joinpath('collection-selector-'+collection+'.json')

    def observe(current):
        node,bounds=find_node(current,label)
        selected=node.get('selected')
        return node,{'bounds':bounds,'selected':True if selected=='true' else False if selected=='false' else None}

    previous_after=None
    for attempt in range(2):
        node,before=observe(root)
        observation={'before':before}
        diagnostic['attempts'].append(observation)
        target.write_text(json.dumps(diagnostic,indent=2),encoding='utf-8')
        if before['selected'] is True:return root
        assert before['selected'] is False, 'Collection selector does not expose its selected state'
        width,height=display_size()
        bounds=before['bounds']
        assert (node.get('visible')=='true' and node.get('enabled')!='false'
                and 0<=bounds[0]<bounds[2]<=width and 0<=bounds[1]<bounds[3]<=height), 'Collection selector is not fully visible and enabled'
        if previous_after is not None:
            assert bounds==previous_after['bounds'], 'Collection selector layout did not stabilize before bounded retry'
        tap_observed(root,label)
        time.sleep(.35)
        root=dump()
        _,after=observe(root)
        observation['after']=after
        target.write_text(json.dumps(diagnostic,indent=2),encoding='utf-8')
        if after['selected'] is True:return root
        previous_after=after
        if attempt==0:
            # A second fresh tree must retain the same valid geometry before retry.
            time.sleep(.35)
            root=dump()
    raise AssertionError('Collection selector was not selected after the bounded native taps')


def assert_modal_top(root, title, prefix):
    _, close = find_node(root, 'Cerrar ' + title)
    title_node, heading = find_node(root, title)
    width, height = display_size()
    for box in (close, heading):
        assert 0 <= box[0] < box[2] <= width and 0 <= box[1] < box[3] <= height, 'Modal control outside visible display'
    assert heading[1] >= close[3], 'Full title must start below the persistent modal controls'
    assert title in (title_node.get('text', ''), title_node.get('content-desc', '')), 'Full title missing from the fresh native hierarchy'
    geometry.append({'capture':prefix,'display':[width,height],'closeBounds':close,'titleBounds':heading,'title':title})
    screen(prefix, root)


def group_roundtrip(provider, collection, prefix):
    open_collection(collection)
    label = provider + ': ver '
    root = reach_control(label, starts=True)
    node, _ = find_node(root, label, starts=True)
    match = re.fullmatch(re.escape(provider) + r': ver (\d+) referencias', node.get('content-desc', ''))
    assert match and 2 <= int(match[1]) <= 1000
    size = int(match[1])
    screen(prefix + '-grupo', root)
    tap_observed(root, label, starts=True)
    # A group keeps its list offset. Its banner precedes search and the
    # counter, so observe each required element at its own scroll position.
    scroll_top()
    root=reach_control('Referencias de '+provider,starts=True)
    screen(prefix + '-abierto', root)
    root=reach_catalog_total(root=root)
    assert re.search(r'\b' + str(size) + r' de \d+ fichas', visible_text(root)), 'Group count must count its individual offers'
    root=LOCATE('Volver a la colección completa de ofertas')
    tap_observed(root, 'Volver a la colección completa de ofertas')
    root = wait_ui('Ofertas específicas')
    root=reach_catalog_total(root=root)
    assert str(sum(collections.values())) + ' en el catálogo' in visible_text(root), 'Total catalog count must remain visible'
    root = reach_control(label, starts=True)
    screen(prefix + '-vuelta', root)
    result={'provider':provider,'collection':collection,'references':size,'returned':True}
    _checkpoint('providerGroup.'+provider,'validated-scope-only',result)
    return result


def open_observed_offer(query, title):
    root = search(dump(), query)
    label = 'Ver ficha de ' + title + '.'
    root = reach_control(label, starts=True)
    tap_observed(root, label, starts=True)
    return wait_ui('Cerrar ' + title)


def editorial_detail(sample, prefix):
    root = wait_ui('Cerrar ' + sample['title'])
    root = reach_control(sample['alt'])
    assert 'Sin ilustración editorial disponible' not in visible_text(root)
    assert 'imagen generada con IA' in sample['alt']
    assert 'No es una foto del activo real.' in sample['alt']
    time.sleep(.75)
    root = dump()
    find_node(root, sample['alt'])
    screen(prefix + '-foto-detalle', root)
    editorial_checked.append(sample['slug'])
    return root


PROVIDER_GROUP_REUSE_METADATA=None

def _completed_brickwise():
    from candidate_140 import load_candidate
    candidate=load_candidate()
    raw=pathlib.Path(__file__).resolve().parent.joinpath('baseline-c20-brickwise-complete-40399378362-checkpoints.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()=='4ec914b68458c3705837b309672524341be37b969b86b79c449be6204a95dcf4', 'Completed Brickwise checkpoint identity mismatch'
    previous=json.loads(raw)
    assert previous['runId']=='40399378362' and previous['harnessHeadSha']=='79067a648642698ac0f45faa19b092b61c7b3675'
    assert previous['full20PointQA'] is False and previous['releaseApproved'] is False
    assert all(previous[key]==candidate[key] for key in ('apkSha256','apkBytes','versionCode','sourceHeadSha'))
    checkpoint=previous['criteria']['providerGroup.Brickwise']
    expected={'provider':'Brickwise','collection':'principales','references':12,'returned':True}
    assert checkpoint['status']=='validated-scope-only' and checkpoint['details']==expected, 'Completed Brickwise round trip missing'
    return dict(expected),{'runId': 40399378362, 'originalStatus': 'failed', 'originalFailurePhase': 'provider-groups', 'harnessHeadSha': '79067a648642698ac0f45faa19b092b61c7b3675', 'checkpointsSha256': '4ec914b68458c3705837b309672524341be37b969b86b79c449be6204a95dcf4', 'zipSha256': '166af75ce935f491d67cac158c9468cc06c3c30c2f9c8cc0c66152977ca3f8b5', 'apkSha256': 'c20a45889c7eccdf0ac9cfb4fd18345a09c64e05b130a8af4b44177fb2e7e614', 'sourceHeadSha': '7c64b6c15a826ddb3189c8ab195b4fa36201ca51', 'reusedProvider': 'Brickwise', 'reusedReferences': 12, 'newProvider': 'Reental', 'newReferences': 21, 'brickwiseObservationPerformedInThisRun': False, 'reentalObservationPerformedInThisRun': True, 'inheritedFlagsReferToOriginalRun': True, 'providerGroupScopeOnly': True}


def groups_pending():
    global PROVIDER_GROUP_REUSE_METADATA
    brickwise,metadata=_completed_brickwise()
    open_offer_catalog()
    result=[brickwise,group_roundtrip('Reental','secundario','11-reental')]
    assert [item['references'] for item in result] == [12,21], 'Published provider group counts changed'
    PROVIDER_GROUP_REUSE_METADATA=metadata
    _checkpoint('providerGroups','validated-scope-only',{'groups':result,'reuseMetadata':metadata})
    out.joinpath('provider-groups-reuse-metadata.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    return result


def documentary_and_five_images():
    """One ES traversal supplies dates/history/risks/CTA and the first photo."""
    risks=['¿Puedo perder dinero?','¿Puedo vender cuando quiera?',
           '¿Quién custodia el activo?','¿Quién supervisa esta oferta?']
    audit={'risks':{},'primary':{},'maxPrimaryInOneViewport':0,'viewport':0}
    def inspect(root):
        index=audit['viewport']; audit['viewport']+=1
        primary=[]
        for order,node in enumerate(root.iter('node')):
            if node.get('visible') == 'false': continue
            text=node.get('text',''); desc=node.get('content-desc','')
            for risk in risks:
                if text == risk or desc == risk: audit['risks'].setdefault(risk,[index,order])
            if desc.startswith('Ver en la fuente ·'):
                primary.append(desc); audit['primary'].setdefault(desc,[index,order])
        audit['maxPrimaryInOneViewport']=max(audit['maxPrimaryInOneViewport'],len(primary))
    card_reports=[]
    for index,sample in enumerate(editorial_samples):
        open_collection(sample['group'])
        root=search(dump(),sample['query'])
        root=reach_control('Ver ficha de '+sample['title'],starts=True)
        card,_=find_node(root,'Ver ficha de '+sample['title'],starts=True)
        label=card.get('content-desc','')
        for part in ('Mínimo publicado en euros:','Acceso desde España:','Cómo recuperar el dinero:'):
            assert part in label, 'Missing decision fact in native offer card'
        assert sample['location'] in label, 'Native card lost the offer location'
        # Expired price/rate is intentionally hidden. A consultation condition is
        # acceptable; never demand a fresh amount from an expired reference.
        assert re.search(r'\d[\d.,]*\s*(?:EUR|USD|CHF|€|%)',label) or re.search(r'consult|no documentad|sin comprobar',label,re.I)
        screen('12-card-%02d' % index,root)
        tap_observed(root,'Ver ficha de '+sample['title'],starts=True)
        editorial_detail(sample,'13-image-%02d' % index)
        card_reports.append({'slug':sample['slug'],'decisionFacts':True,'editorialAlt':sample['alt'],
                             'expiredAmountsMayBeHidden':True})
        if index == 0:
            scroll_top()
            document_detail('14-spiko-es',sample['title'],[
                'Revisión del catálogo:','Última consulta citada:','Fecha del dato en esa referencia:',
                'REFERENCIAS FECHADAS','No son precios actuales','FR001400ODL1',*risks,'Ver en la fuente'],
                inspect=inspect,scan_to_end=True)
            assert len(audit['risks'])==4 and len(audit['primary'])==1, 'Need four risks and exactly one primary source CTA'
            assert audit['maxPrimaryInOneViewport']==1, 'Duplicate primary source CTA in a native viewport'
            first_cta=min(audit['primary'].values())
            assert all(position <= first_cta for position in audit['risks'].values()), 'Risks must precede the source CTA'
            LOCATE('Guardar '+sample['title']+' en Perfil')
            CLICK('Guardar '+sample['title']+' en Perfil')
            wait_ui('Quitar '+sample['title']+' de guardadas')
        CLICK('Cerrar '+sample['title'])
        wait_ui('Ofertas específicas')
    assert len(editorial_checked)==5 and len(set(editorial_checked))==5
    out.joinpath('documentary-risk-cta.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
    out.joinpath('five-native-images.json').write_text(json.dumps(card_reports,ensure_ascii=False,indent=2),encoding='utf-8')
    _checkpoint('documentaryAndFiveImages','validated-scope-only',{'cardSlugs':[x['slug'] for x in card_reports],
        'fiveNativeImagesAndAlt':True,'datesSeparated':True,'historicalReferencesContextualized':True,
        'fourRisksBeforeSingleCta':audit})
    return {'cards':card_reports,'riskAndCta':audit,'historicalReferencesContextualized':True,
            'datesSeparated':True,'favoritePrepared':'Spiko Letras del Tesoro Euro'}


def languages_and_favorite():
    """Only the missing ES/EN and local persistence criteria; real relogin after restart."""
    title='Spiko Letras del Tesoro Euro'
    CLICK('Perfil'); CLICK('English')
    root=wait_ui('Home','Search','Academy','Profile')
    assert find_node(root,'English')[0].get('checked') == 'true'
    adb('shell','am','force-stop','com.rwadar.app')
    adb('shell','am','start','-W','-n','com.rwadar.app/.MainActivity')
    root=wait_ui('Sign in to your account','English')
    assert find_node(root,'English')[0].get('checked') == 'true', 'English selection did not persist'
    REAUTHENTICATE('en')
    CLICK('Profile')
    root=LOCATE(title+'.',True)
    screen('15-english-favorite-after-restart',root)
    CLICK(title+'.',True)
    wait_ui('Close '+title,'Remove '+title+' from saved items')
    scroll_top()
    required=['Original source text (Spanish)','DATES FOR THIS ENTRY','DATED REFERENCES',
              'Could I lose money?','Can I sell whenever I want?','Who holds the asset?',
              'Who supervises this offer?','FR001400ODL1','View at source']
    document_detail('16-spiko-en',title,required,scan_to_end=True,language='en')
    spanish='\n'.join(traversals['14-spiko-es']); english='\n'.join(traversals['16-spiko-en'])
    tokens=lambda text:set(re.findall(r'[0-9][0-9.,]*\s*(?:EUR|USD|CHF|GBP|€|%)|(?:EUR|USD|CHF|GBP|€)\s*[0-9][0-9.,]*',text))
    dates=lambda text:set(re.findall(r'\b\d{2}/\d{2}/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b',text))
    urls=lambda text:set(re.findall(r'https://[^\s<>]+',text))
    assert tokens(spanish)==tokens(english), 'Language switch changed observed amounts or units'
    assert dates(spanish) and dates(spanish)==dates(english), 'Language switch changed observed source dates'
    assert urls(spanish) and urls(spanish)==urls(english), 'Language switch changed observed source destinations'
    CLICK('Close '+title); CLICK('Español')
    wait_ui('Inicio','Buscar','Academy','Perfil')
    adb('shell','am','force-stop','com.rwadar.app')
    adb('shell','am','start','-W','-n','com.rwadar.app/.MainActivity')
    root=wait_ui('Entra en tu cuenta','Español')
    assert find_node(root,'Español')[0].get('checked') == 'true', 'Spanish selection did not persist'
    REAUTHENTICATE('es')
    CLICK('Perfil'); root=LOCATE(title+'.',True)
    screen('17-spanish-favorite-after-restart',root)
    CLICK(title+'.',True)
    wait_ui('Cerrar '+title,'Quitar '+title+' de guardadas')
    CLICK('Quitar '+title+' de guardadas')
    wait_ui('Guardar '+title+' en Perfil')
    CLICK('Cerrar '+title)
    result={'englishTabs':True,'spanishTabs':True,'englishPersistedAfterRestart':True,
            'spanishPersistedAfterRestart':True,'favoritePersistedAcrossRestartAndRelogin':True,
            'qaFavoriteRemoved':True,'amountsAndUnitsUnchanged':True,'sourceDatesUnchanged':True,
            'sourceUrlsUnchanged':True,'emptyFinancialTokenSetAllowedWhenBothLocalesHideExpiredAmounts':True,
            'spanish':traversals['14-spiko-es'],'english':traversals['16-spiko-en']}
    out.joinpath('language-and-favorite.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    _checkpoint('languagesAndFavoritePersistence','validated-scope-only',{k:v for k,v in result.items() if type(v) is bool})
    return result
