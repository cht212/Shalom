"""UI regression checks. Start the production server on localhost:3700 first.
Authenticated responses are fixtures; this does not validate a live database.
"""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

output = Path(tempfile.mkdtemp(prefix='shalom-formation-'))
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in [375, 768, 1280, 1920]:
        for theme in ['light', 'dark']:
            page = browser.new_page(viewport={'width': width, 'height': 900}, service_workers='block')
            page.add_init_script(f"localStorage.setItem('shalom-theme', '{theme}')")
            page.goto('http://localhost:3700', wait_until='networkidle')
            assert page.locator('.formation-section').count() == 0, 'Guest sees private library'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Home overflow'
            page.goto('http://localhost:3700/?view=bible', wait_until='networkidle')
            page.locator('.verses .verse').first.wait_for()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Reader overflow'
            colors = page.evaluate("""() => ({
                bg: getComputedStyle(document.querySelector('.bible-main')).backgroundColor,
                paper: getComputedStyle(document.querySelector('.readerpaper')).backgroundColor,
                navDisplay: getComputedStyle(document.querySelector('.bible-navigation')).display
            })""")
            if theme == 'dark':
                assert colors['bg'] == 'rgb(23, 27, 29)', colors
                assert colors['paper'] == 'rgb(33, 39, 41)', colors
            assert colors['navDisplay'] == 'contents', colors
            before = page.locator('.verses').evaluate('(el) => parseFloat(getComputedStyle(el).fontSize)')
            page.get_by_role('button', name='Aumentar tamaño de letra').click()
            after = page.locator('.verses').evaluate('(el) => parseFloat(getComputedStyle(el).fontSize)')
            assert after == before + 1, (before, after)
            page.get_by_role('button', name='Reducir tamaño de letra').click()
            if width in [375, 1280]:
                page.screenshot(path=str(output / f'reader-{width}-{theme}.png'))
            page.close()
    page = browser.new_page(viewport={'width': 375, 'height': 812}, service_workers='block')
    actor = {'id': 'member1', 'role': 'disciple', 'person': 'p1', 'cell': 'c1', 'name': 'Ana', 'email': 'ana@example.invalid', 'sector': None}
    page.route('**/api/session', lambda route: route.fulfill(json={'actor': actor}))
    page.route('**/api/formation', lambda route: route.fulfill(json={'books': [{'id': 'discipulado-1', 'title': 'Discipulado 1'}], 'own': [{'book': 'discipulado-1'}]}))
    page.route('**/api/study', lambda route: route.fulfill(status=401, json={'error': 'Fixture without cloud sync'}))
    page.goto('http://localhost:3700', wait_until='domcontentloaded')
    page.locator('.formation-book h3').wait_for()
    assert page.locator('.formation-book h3').inner_text() == 'Discipulado 1'
    assert page.locator('.formation-book p').count() == 0
    page.screenshot(path=str(output / 'assigned-mobile.png'))
    page.close()
    page = browser.new_page()
    response = page.request.get('http://localhost:3700/api/formation')
    assert response.status == 401, response.status
    browser.close()
print('PASS: guest privacy, assigned-book UI, 4 sizes, both themes, no overflow, API authentication')
print(output)
