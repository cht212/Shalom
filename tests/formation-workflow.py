"""Run only through scripts/verify-formation.mjs (isolated PostgreSQL schema)."""
import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

base='http://localhost:3700'
out=Path(tempfile.mkdtemp(prefix='shalom-verified-'))
def check(response,status,label):
    assert response.status==status,(label,response.status,response.text()[:300])
    print('PASS',label,flush=True)
    return response.json() if response.headers.get('content-type','').startswith('application/json') else None

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    contexts={}
    for role,user,password in [('admin','admin.shalom',os.environ['SHALOM_TEST_ADMIN_PASSWORD']),('leader','albert',os.environ['SHALOM_TEST_LEADER_PASSWORD']),('jenni','jenni',os.environ['SHALOM_TEST_SECOND_LEADER_PASSWORD']),('member','verification-account',os.environ['SHALOM_TEST_MEMBER_PASSWORD']),('outside','verification-other-account',os.environ['SHALOM_TEST_MEMBER_PASSWORD'])]:
        context=browser.new_context(service_workers='block')
        check(context.request.post(base+'/api/auth/login',data={'username':user,'password':password}),200,role+' credentials sign in')
        contexts[role]=context
    admin=contexts['admin'].request;leader=contexts['leader'].request;member=contexts['member'].request;outside=contexts['outside'].request
    payload={'action':'assign','book':'discipulado-1','kind':'member','targets':[os.environ['SHALOM_TEST_MEMBER_ID']]}
    # A dedicated book avoids depending on any pre-existing assignments.
    book_payload={'title':'Libro de verificación','published':False,'lessons':[{'id':'lesson1','title':'Lección de verificación','text':'Contenido exclusivo para comprobar el funcionamiento.','questions':[{'id':'q1','text':'¿Qué aprendiste?'}]}]}
    check(leader.post(base+'/api/formation/books',data=book_payload),403,'leader cannot edit books')
    check(admin.post(base+'/api/formation/books',data=book_payload),200,'admin creates draft with lesson and question')
    data=admin.get(base+'/api/formation').json();book=next(b for b in data['books'] if b['title']=='Libro de verificación');bid=book['id'];payload['book']=bid
    check(leader.post(base+'/api/formation',data=payload),403,'leader needs grant before assigning')
    check(admin.post(base+'/api/formation',data={'action':'assign','book':bid,'kind':'leader','targets':[os.environ['SHALOM_TEST_LEADER_ID']]}),200,'admin grants book to leader')
    check(leader.post(base+'/api/formation',data={**payload,'targets':[os.environ['SHALOM_TEST_OUTSIDE_ID']]}),403,'cross-cell assignment rejected')
    check(leader.post(base+'/api/formation',data=payload),200,'leader assigns book within own cell')
    assert not any(b['id']==bid for b in outside.get(base+'/api/formation').json()['books'])
    print('PASS other member cannot see assigned book',flush=True)
    check(admin.post(base+'/api/formation/assets',multipart={'book':bid,'kind':'cover','file':{'name':'invalid.svg','mimeType':'image/svg+xml','buffer':b'<svg xmlns="http://www.w3.org/2000/svg"></svg>'}}),400,'SVG cover rejected')
    page=contexts['admin'].new_page();page.set_content('<div style="width:320px;height:200px;background:#657c68">Portada de prueba</div>');png=page.locator('div').screenshot();page.close()
    check(admin.post(base+'/api/formation/assets',multipart={'book':bid,'kind':'cover','file':{'name':'cover.png','mimeType':'image/png','buffer':png}}),200,'admin uploads real raster cover')
    check(admin.post(base+'/api/formation/assets',multipart={'book':bid,'kind':'pdf','file':{'name':'test.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\n% verification document\n%%EOF'}}),200,'admin uploads PDF')
    check(member.get(base+'/api/formation/assets?book='+bid+'&kind=pdf'),403,'draft asset withheld from member')
    check(admin.post(base+'/api/formation/books',data={**book_payload,'id':bid,'published':True}),200,'admin publishes book')
    check(outside.get(base+'/api/formation/assets?book='+bid+'&kind=cover'),403,'private cover rejected for unassigned member')
    cover=member.get(base+'/api/formation/assets?book='+bid+'&kind=cover');assert cover.status==200 and cover.headers['content-type']=='image/jpeg'
    data=member.get(base+'/api/formation').json();assignment=next(a for a in data['own'] if a['book']==bid);aid=assignment['id']
    answer={'action':'answer','assignment':aid,'lesson':'lesson1','answers':{'q1':'Aprendí en esta prueba.'},'submit':False}
    check(outside.post(base+'/api/formation/responses',data=answer),403,'other account cannot write answers')
    check(member.post(base+'/api/formation/responses',data=answer),200,'member saves draft')
    check(member.post(base+'/api/formation/responses',data={**answer,'answers':{},'submit':True}),400,'incomplete submission rejected')
    ui=contexts['member'].new_page()
    ui.set_viewport_size({'width':375,'height':812})
    ui.goto(base+'/formacion/'+bid,wait_until='networkidle')
    ui.get_by_label('1. ¿Qué aprendiste?').fill('Aprendí mediante el formulario de la aplicación.')
    with ui.expect_response(lambda r:'/api/formation/responses' in r.url and r.request.method=='POST') as saved:
        ui.get_by_role('button',name='Guardar borrador',exact=True).click()
    assert saved.value.status==200
    with ui.expect_response(lambda r:'/api/formation/responses' in r.url and r.request.method=='POST') as submitted:
        ui.get_by_role('button',name='Enviar al líder',exact=True).click()
    assert submitted.value.status==200
    ui.get_by_text('Enviada · pendiente de revisión',exact=True).wait_for()
    ui.close()
    print('PASS member saves and submits through mobile UI',flush=True)
    check(member.post(base+'/api/formation/responses',data=answer),409,'submitted answer protected')
    check(admin.post(base+'/api/formation/books',data={**book_payload,'id':bid,'published':True,'lessons':[]}),409,'lessons with answers cannot be overwritten')
    review={'action':'review','assignment':aid,'lesson':'lesson1','approved':False,'feedback':'Completa tu reflexión.'}
    check(member.post(base+'/api/formation/responses',data=review),403,'member cannot approve own lesson')
    check(leader.post(base+'/api/formation/responses',data=review),200,'leader returns lesson with feedback')
    check(member.post(base+'/api/formation/responses',data={**answer,'submit':True}),200,'member corrects and resubmits')
    check(leader.post(base+'/api/formation/responses',data={**review,'approved':True,'feedback':'Buen trabajo.'}),200,'leader approves lesson')
    data=member.get(base+'/api/formation').json();assert next(a for a in data['own'] if a['id']==aid)['status']=='completed'
    print('PASS reviewed book completes automatically',flush=True)
    for role,path in [('admin','/panel?tab=discipulado'),('leader','/panel?tab=discipulado'),('member','/formacion/'+bid)]:
        page=contexts[role].new_page()
        for width in [375,1280]:
            for theme in ['light','dark']:
                page.set_viewport_size({'width':width,'height':900})
                page.add_init_script(f"localStorage.setItem('shalom-theme','{theme}')")
                page.goto(base+path,wait_until='networkidle')
                if role=='admin':
                    page.locator('.book-editor>summary').click()
                    page.get_by_label('Editar libro',exact=True).select_option(bid)
                    page.locator('.book-editor input[type=checkbox]').wait_for()
                assert page.locator('.reader-nav-shell').count()==1
                assert page.locator('.mobilenav,.rolenavmobile').count()==0
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(role,width,theme)
                page.screenshot(path=str(out/f'{role}-{width}-{theme}.png'))
        page.close()
    for role,tabs in [('admin',['inicio','celulas','personas','informes','devocionales','cuentas']),('leader',['inicio','personas','informes','devocionales'])]:
        page=contexts[role].new_page()
        page.set_viewport_size({'width':375,'height':812})
        for tab in tabs:
            page.goto(base+'/panel?tab='+tab,wait_until='networkidle')
            assert page.locator('.reader-nav-shell').count()==1
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(role,tab)
        page.close()
        print('PASS',role,'all panel sections render with shared navigation',flush=True)
    check(admin.post(base+'/api/formation',data={'action':'revoke','id':next(a for a in admin.get(base+'/api/formation').json()['assignments'] if a['book']==bid and a['kind']=='leader')['id']}),200,'revoking leader grant also removes delegated assignments')
    assert not any(b['id']==bid for b in member.get(base+'/api/formation').json()['books'])
    for context in contexts.values():context.close()
    browser.close()
print('Screenshots:',out,flush=True)
