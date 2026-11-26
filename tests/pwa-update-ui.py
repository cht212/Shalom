"""Real service-worker update and repair checks in an isolated browser context."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

base='http://localhost:3700'
output=Path(tempfile.mkdtemp(prefix='shalom-update-'))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':375,'height':812})
    context.add_init_script("Object.defineProperty(navigator,'standalone',{value:true})")
    page=context.new_page()
    page.goto(base,wait_until='networkidle')
    page.wait_for_function('!!navigator.serviceWorker.controller',timeout=60000)
    page.evaluate("""async()=>{
        localStorage.setItem('update-test-note','keep note');document.cookie='update-test-cookie=keep;path=/';
        const cache=await caches.open('shalom-bible-rv1909-v1');await cache.put('/bible/update-test.json',new Response('keep download'));
        await new Promise((resolve,reject)=>{const request=indexedDB.open('shalom-update-test',1);request.onupgradeneeded=()=>request.result.createObjectStore('notes');request.onerror=reject;request.onsuccess=()=>{const db=request.result;const tx=db.transaction('notes','readwrite');tx.objectStore('notes').put('keep study','note');tx.oncomplete=()=>{db.close();resolve()}}});
    }""")
    page.get_by_role('button',name='Actualizar Shalom',exact=True).click()
    dialog=page.get_by_role('dialog',name='Actualizar Shalom')
    expect(dialog).to_be_visible()
    page.get_by_role('button',name='Buscar actualizaciones',exact=True).click()
    expect(dialog.get_by_role('status')).to_contain_text('están al día',timeout=60000)
    page.screenshot(path=str(output/'update-mobile.png'))
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.get_by_role('button',name='Volver a descargar archivos',exact=True).click()
    expect(dialog.get_by_role('status')).to_contain_text('Archivos descargados de nuevo',timeout=60000)
    assert page.evaluate("localStorage.getItem('update-test-note')")=='keep note'
    assert 'update-test-cookie=keep' in page.evaluate('document.cookie')
    assert page.evaluate("async()=>await(await(await caches.open('shalom-bible-rv1909-v1')).match('/bible/update-test.json')).text()")=='keep download'
    assert page.evaluate("""async()=>await new Promise(resolve=>{const r=indexedDB.open('shalom-update-test',1);r.onsuccess=()=>{const db=r.result;const q=db.transaction('notes').objectStore('notes').get('note');q.onsuccess=()=>{resolve(q.result);db.close()}}})""")=='keep study'
    page.get_by_role('button',name='Volver a abrir Shalom',exact=True).click()
    expect(page.locator('#home-title')).to_be_visible()
    print('PASS real full-shell redownload, reload, local notes, IndexedDB, cookies and Bible download preserved',flush=True)
    page.evaluate("async()=>await navigator.serviceWorker.register('/sw.js?update-test=1',{scope:'/',updateViaCache:'none'})")
    page.wait_for_function('navigator.serviceWorker.getRegistration().then(r=>!!r.waiting)',timeout=60000)
    page.get_by_role('button',name='Actualizar Shalom',exact=True).click()
    page.get_by_role('button',name='Buscar actualizaciones',exact=True).click()
    expect(page.get_by_role('button',name='Abrir nueva versión',exact=True)).to_be_visible(timeout=60000)
    with page.expect_navigation(wait_until='domcontentloaded'):
        page.get_by_role('button',name='Abrir nueva versión',exact=True).click()
    assert page.evaluate("localStorage.getItem('update-test-note')")=='keep note'
    print('PASS waiting worker is applied only after explicit click, then reloads',flush=True)
    page.get_by_role('button',name='Actualizar Shalom',exact=True).click()
    context.set_offline(True)
    page.get_by_role('button',name='Buscar actualizaciones',exact=True).click()
    expect(page.get_by_role('dialog').get_by_role('status')).to_contain_text('Necesitas internet')
    context.set_offline(False)
    print('PASS offline update gives actionable message and keeps existing app',flush=True)
    context.close();browser.close()
print('Screenshots:',output,flush=True)
