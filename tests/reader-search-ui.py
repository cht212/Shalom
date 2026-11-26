"""Public reader checks; run with production server on localhost:3700."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

out=Path(tempfile.mkdtemp(prefix='shalom-reader-'))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [320,375,768,1280]:
        for theme in ['light','dark']:
            page=browser.new_page(viewport={'width':width,'height':812},service_workers='block')
            page.add_init_script(f"localStorage.setItem('shalom-theme','{theme}')")
            page.goto('http://localhost:3700',wait_until='networkidle')
            page.locator('.home-verse q').wait_for()
            assert page.locator('.church-social-links a').get_attribute('href')=='https://www.facebook.com/misioncristianashalomves?locale=es_LA'
            geometry=page.evaluate("""()=>{
                const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top+r.height/2};
                return {logo:rect('.readerheader .shalom-emblem'),search:rect('.header-bible-search'),theme:rect('.reader-header-actions>.theme-inline'),shadow:getComputedStyle(document.querySelector('.readerheader .shalom-emblem')).boxShadow,margin:getComputedStyle(document.querySelector('.header-bible-search')).marginTop}
            }""")
            assert abs(geometry['logo']-geometry['search'])<2,geometry
            assert abs(geometry['theme']-geometry['search'])<2,geometry
            assert geometry['shadow']=='none' and geometry['margin']=='0px',geometry
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if width==375:page.screenshot(path=str(out/f'home-{theme}.png'))
            search=page.get_by_role('combobox',name='Buscar libro o referencia bíblica')
            search.fill('Ped')
            assert page.get_by_role('option').count()==2
            assert 'Pedro' in page.get_by_role('option').first.inner_text()
            search.fill('Juan 3:')
            assert page.get_by_role('option').count()==1
            search.fill('Juan 3:16')
            page.get_by_role('option').first.click()
            page.locator('#bible-verse-16.versechosen').wait_for()
            assert page.locator('.bible-compact-selectors').count()==1
            assert page.get_by_label('Libro de la Biblia',exact=True).input_value()=='JHN'
            assert page.get_by_label('Capítulo de la Biblia',exact=True).input_value()=='3'
            assert page.get_by_label('Versículo de la Biblia',exact=True).input_value()=='16'
            page.get_by_label('Libro de la Biblia',exact=True).select_option('PSA')
            page.get_by_label('Capítulo de la Biblia',exact=True).select_option('23')
            page.locator('.chapterheading h2').filter(has_text='23').wait_for()
            page.wait_for_function("!document.querySelector('[aria-label=\"Versículo de la Biblia\"]').disabled")
            page.get_by_label('Versículo de la Biblia',exact=True).select_option('2')
            page.locator('#bible-verse-2.versechosen').wait_for()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if width in [375,1280]:page.screenshot(path=str(out/f'reader-{width}-{theme}.png'))
            search.fill('Mate')
            search.press('ArrowDown')
            search.press('Enter')
            page.locator('.chapterheading h2').filter(has_text='Mateo 1').wait_for()
            page.close()
            print('PASS aligned header, no logo shadow, live suggestions, keyboard search, compact selectors',width,theme,flush=True)
    page=browser.new_page(viewport={'width':375,'height':812},is_mobile=True,has_touch=True,service_workers='block')
    page.goto('http://localhost:3700',wait_until='networkidle')
    page.get_by_role('combobox',name='Buscar libro o referencia bíblica').fill('Salmo 23')
    page.get_by_role('option').first.tap()
    page.locator('.chapterheading h2').filter(has_text='Salmos 23').wait_for()
    assert page.get_by_role('combobox',name='Buscar libro o referencia bíblica').input_value()==''
    print('PASS touch selection and cleared search after navigation',flush=True)
    page.close()
    browser.close()
print('Screenshots:',out,flush=True)
