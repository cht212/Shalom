"""Current product scope: verse-only guest home, management navigation, deferred books.
Run through scripts/verify-formation.mjs with an isolated database schema.
"""
import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

base='http://localhost:3700'
out=Path(tempfile.mkdtemp(prefix='shalom-management-'))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    guest=browser.new_context(service_workers='block')
    page=guest.new_page()
    for width in [320,375,768,1280]:
        page.set_viewport_size({'width':width,'height':812})
        page.goto(base,wait_until='networkidle')
        page.locator('.home-verse q').wait_for()
        assert page.locator('.home-dashboard>.home-welcome,.formation-section').count()==0
        assert page.locator('.home-dashboard>button').count()==1
        search=page.get_by_role('combobox',name='Buscar libro o referencia bíblica')
        assert search.get_attribute('placeholder')==''
        assert page.locator('.header-bible-search>button').inner_text()==''
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        if width==375:
            page.screenshot(path=str(out/'guest-home.png'))
            search.fill('Juan 3:16')
            page.locator('.header-bible-search>button').click()
            page.locator('#bible-verse-16.versechosen').wait_for()
    print('PASS guest sees only daily verse; text-free direct search works; 4 widths',flush=True)
    page.close();guest.close()
    for role,username,password in [('admin','admin.shalom',os.environ['SHALOM_TEST_ADMIN_PASSWORD']),('leader','albert',os.environ['SHALOM_TEST_LEADER_PASSWORD']),('jenni','jenni',os.environ['SHALOM_TEST_SECOND_LEADER_PASSWORD']),('sector','verification-sector-account',os.environ['SHALOM_TEST_MEMBER_PASSWORD']),('pastor','verification-pastor-account',os.environ['SHALOM_TEST_MEMBER_PASSWORD']),('member','verification-account',os.environ['SHALOM_TEST_MEMBER_PASSWORD'])]:
        context=browser.new_context(service_workers='block')
        api=context.request
        assert api.post(base+'/api/auth/login',data={'username':username,'password':password}).status==200
        assert api.get(base+'/api/formation').status==503
        assert api.post(base+'/api/formation/books',data={'title':'Must not be saved'}).status==503
        page=context.new_page()
        page.goto(base+'/perfil',wait_until='networkidle')
        assert page.locator('.admin-books-placeholder').count()==(1 if role=='admin' else 0)
        page.goto(base+'/formacion/discipulado-1',wait_until='networkidle')
        assert page.url.endswith('/perfil')
        if role!='member':
            for width in ([320,375,768,1280] if role in ['admin','leader'] else [375]):
                for theme in (['light','dark'] if role in ['admin','leader'] else ['light']):
                    page.set_viewport_size({'width':width,'height':812})
                    page.goto(base+'/panel',wait_until='networkidle')
                    page.evaluate("theme=>{localStorage.setItem('shalom-theme',theme);document.documentElement.dataset.theme=theme}",theme)
                    assert page.locator('.management-header').count()==1
                    assert page.locator('.reader-nav-shell,.header-bible-search').count()==0
                    assert page.locator('.panel-section-nav').count()==0
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(role,width,theme)
                    if width==375 and role in ['admin','leader']:
                        page.screenshot(path=str(out/f'{role}-{theme}.png'))
                    if width<1100:
                        if role=='admin':
                            page.get_by_role('button',name='Más secciones',exact=True).click()
                            page.locator('.management-more').get_by_role('button',name='Accesos y roles',exact=True).click()
                            page.locator('.accountform').wait_for()
                            assert not page.locator('.management-more').is_visible()
                        else:
                            page.locator('.management-nav').get_by_role('button',name='Personas',exact=True).click()
                            page.locator('.memberregistry').wait_for()
            assert 'Discipulado' not in page.locator('.management-nav').inner_text()
        page.goto(base,wait_until='networkidle')
        assert page.locator('.formation-section,.formation-book').count()==0
        page.goto(base+'/perfil',wait_until='networkidle')
        if role=='admin':
            page.set_viewport_size({'width':375,'height':812})
            page.screenshot(path=str(out/'admin-profile.png'),full_page=True)
        page.close();context.close()
        print('PASS',role,'placeholder scope, deferred APIs, navigation and layout',flush=True)
    browser.close()
print('Screenshots:',out,flush=True)
