"""Installation entry and launch screen checks against a production server."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base='http://localhost:3700'
output=Path(tempfile.mkdtemp(prefix='shalom-launch-'))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [320,375,1280]:
        page=browser.new_page(viewport={'width':width,'height':812},service_workers='block')
        page.goto(base,wait_until='networkidle')
        expect(page.locator('.app-launch-screen')).to_be_hidden()
        button=page.get_by_role('button',name='Instalar Shalom',exact=True)
        expect(button).to_be_visible()
        button.click()
        expect(page.get_by_role('dialog',name='Instalar Shalom')).to_be_visible()
        expect(page.get_by_role('dialog')).to_contain_text('Instalar aplicación')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.get_by_role('button',name='Cerrar instrucciones de instalación').click()
        page.evaluate("""()=>{window.prompts=0;const event=new Event('beforeinstallprompt');event.prompt=async()=>{window.prompts++};event.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(event)}""")
        button.click()
        expect(page.get_by_role('dialog',name='Instalar Shalom')).to_be_hidden()
        assert page.evaluate('window.prompts')==1
        button.click()
        expect(page.get_by_role('dialog',name='Instalar Shalom')).to_be_visible()
        page.evaluate("window.dispatchEvent(new Event('appinstalled'))")
        expect(button).to_have_count(0)
        expect(page.get_by_role('dialog',name='Instalar Shalom')).to_be_hidden()
        page.close()
        print('PASS visible install, fallback, native prompt, dismissal and installed state',width,flush=True)
    page=browser.new_page(viewport={'width':375,'height':812},service_workers='block',user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')
    page.goto(base,wait_until='networkidle')
    page.get_by_role('button',name='Instalar Shalom',exact=True).click()
    expect(page.get_by_role('dialog',name='Instalar Shalom')).to_contain_text('Compartir')
    expect(page.get_by_role('dialog',name='Instalar Shalom')).to_contain_text('Safari')
    page.close()
    print('PASS iPhone installation instructions',flush=True)
    for theme in ['light','dark']:
        page=browser.new_page(viewport={'width':375,'height':812},service_workers='block',reduced_motion='reduce')
        page.add_init_script(f"localStorage.setItem('shalom-theme','{theme}');Object.defineProperty(navigator,'standalone',{{value:true}})")
        pending=[]
        page.route('**/*facebook-primary*',lambda route:pending.append(route))
        page.goto(base,wait_until='domcontentloaded')
        splash=page.locator('.app-launch-screen')
        expect(splash).to_be_visible()
        assert splash.evaluate('(el)=>getComputedStyle(el).backgroundColor')=='rgb(7, 91, 216)'
        assert splash.bounding_box()['height']==812
        expect(splash.locator('img')).to_have_attribute('src','/branding/shalom-2026-icon.png')
        page.screenshot(path=str(output/f'launch-{theme}.png'))
        for route in pending:route.continue_()
        page.unroute('**/*facebook-primary*')
        expect(splash).to_have_count(0,timeout=5000)
        expect(page.get_by_role('button',name='Instalar Shalom',exact=True)).to_have_count(0)
        page.locator('.home-verse q').wait_for()
        page.locator('.home-verse').click()
        page.locator('.verses .verse').first.wait_for()
        expect(splash).to_have_count(0)
        page.close()
        print('PASS full blue launch, current logo, bounded loading, no replay or installation button',theme,flush=True)
    api=p.request.new_context()
    manifest=api.get(base+'/manifest.webmanifest').json()
    assert manifest['background_color']=='#075bd8'
    assert manifest['theme_color']=='#075bd8'
    assert manifest['id']=='/' and manifest['start_url']=='/'
    browser.close()
print('Screenshots:',output,flush=True)
