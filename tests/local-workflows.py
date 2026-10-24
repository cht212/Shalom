"""Integration checks against the local dev server, with isolated test records."""
import io,json,os,re,urllib.request,urllib.error,zipfile,uuid,sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000').rstrip('/')
marker='workflow-'+uuid.uuid4().hex
cookies={}
def request(path,role=None,body=None,method=None):
    headers={'Content-Type':'application/json'}
    if role:headers['Cookie']=cookies[role]
    req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
    try:
        with urllib.request.urlopen(req,timeout=60) as r:raw=r.read();status=r.status;head=r.headers
    except urllib.error.HTTPError as e:raw=e.read();status=e.code;head=e.headers
    return status,json.loads(raw) if 'application/json' in head.get('Content-Type','') else raw,head
def check(condition,label):
    assert condition,label
    print('PASS',label)
creds=re.findall(r'Usuario: (.+)\n[^\n:]+: (.+)',(ROOT/'.sites-runtime/USUARIOS_PRUEBA.txt').read_text(encoding='utf-8'))
for username,password in creds:
    status,_,headers=request('/api/auth/login',body={'username':username,'password':password})
    assert status==200,(username,status)
    cookie=headers['Set-Cookie'].split(';')[0]
    req=urllib.request.Request(BASE+'/api/profile',headers={'Cookie':cookie})
    with urllib.request.urlopen(req) as r:profile=json.load(r)
    cookies[profile['actor']['role']]=cookie
check(len(cookies)==5,'five own-password roles sign in')
for role in cookies:
    check(request('/perfil',role)[0]==200 and request('/panel',role)[0]==200,role+' profile and panel render')
cell='demo-cell-shalom';month='2099-12';created_person=None;original_person=None
try:
    check(request('/api/devotions',body={'book':'JHN','chapter':1,'reflection':marker})[0]==401,'anonymous devotional denied')
    check(request('/api/invites','disciple',{'cell':cell})[0]==403,'disciple cannot generate QR')
    for role in ['admin','pastor','sector_leader','cell_leader']:
        status,invite,_=request('/api/invites',role,{'cell':cell})
        check(status==200,role+' can generate QR')
    check(request('/api/invites','cell_leader',{'cell':'outside-scope'})[0]==403,'cross-cell invitation denied')
    token=invite['url'].split('invitacion=')[1]
    status,public,_=request('/api/enrollment?invitacion='+token)
    check(status==200 and set(public)=={'cell'} and set(public['cell'])=={'name','leader','sector'},'public QR exposes only cell details')
    check(request('/api/enrollment',body={'token':token,'name':marker,'phone':'999876543','age':24,'consent':True})[0]==201,'new member enrollment')
    _,profile,_=request('/api/profile','cell_leader')
    created_person=next(p['id'] for p in profile['data']['people'] if p['name']==marker)
    check(any(a['person']==created_person for a in profile['data']['attendance']),'first attendance recorded')
    account_body={'name':marker,'email':marker+'@shalom.local','role':'disciple','cell':cell,'person':created_person}
    check(request('/api/accounts','cell_leader',account_body)[0]==403,'leader cannot issue accounts')
    status,account,_=request('/api/accounts','admin',account_body)
    check(status==200,'administrator assigns account')
    password=uuid.uuid4().hex
    check(request('/api/credentials','admin',{'account':account['account'],'username':marker,'password':password})[0]==200,'administrator assigns password')
    check(request('/api/auth/login',body={'username':marker,'password':password})[0]==200,'new assigned credentials work')
    _,disciple,_=request('/api/profile','disciple')
    check(len(disciple['data']['people'])==1,'disciple sees only own person')
    original_person=disciple['person']
    own={**original_person,'phone':'999123456','age':25,'address':'Direccion de prueba','maritalStatus':'Soltero/a'}
    check(request('/api/profile','disciple',own,'PATCH')[0]==200,'disciple completes own address')
    check(request('/api/devotions','disciple',{'book':'JHN','chapter':1,'reflection':marker})[0]==201,'personal devotional submission')
    _,history,_=request('/api/devotions?mine=1','disciple')
    entry=next(d for d in history['devotions'] if d['reflection']==marker)
    check(all(d['author']=='demo-account-disciple' for d in history['devotions']),'personal history ownership')
    _,review,_=request('/api/devotions','cell_leader')
    check(any(d['id']==entry['id'] for d in review['devotions']),'leader sees disciple devotional')
    check(request('/api/devotions','cell_leader',{'id':entry['id'],'feedback':'Leido en prueba'},'PATCH')[0]==200,'leader feedback saved')
    path='/api/report-workflow?cell='+cell+'&month='+month
    check(request(path,'pastor')[0]==403,'pastor cannot read unsent report')
    status,preview,_=request(path,'cell_leader')
    check(status==200 and len(preview['snapshot']['sections'])==6,'six report sections prepared')
    payload={'cell':cell,'month':month,'previewToken':preview['previewToken'],'action':'send','notes':marker}
    check(request('/api/report-workflow','cell_leader',payload)[0]==409,'sending before review denied')
    status,word,_=request(path+'&format=word','cell_leader')
    archive=zipfile.ZipFile(io.BytesIO(word));xml=archive.read('word/document.xml').decode()
    check(status==200 and marker in xml and xml.count('<w:tbl>')==6,'Word generated with six populated tables')
    payload['action']='review'
    check(request('/api/report-workflow','cell_leader',payload)[0]==200,'review confirmed')
    payload['action']='send'
    check(request('/api/report-workflow','cell_leader',{**payload,'notes':'Changed'})[0]==409,'changed notes require review again')
    check(request('/api/report-workflow','cell_leader',payload)[0]==200,'report sent after review')
    status,received,_=request(path,'pastor')
    check(status==200 and received['status']=='sent','pastor receives reviewed report')
    check(request('/api/report-workflow','cell_leader',payload)[0]==409,'sent snapshot protected')
finally:
    # Fetch fresh state so concurrent unrelated edits are preserved.
    status,current,_=request('/api/data','admin')
    if status==200:
        data=current['data']
        ids={p['id'] for p in data['people'] if p['name']==marker}
        data['people']=[original_person if original_person and p['id']==original_person['id'] else p for p in data['people'] if p['id'] not in ids]
        data['attendance']=[a for a in data['attendance'] if a['person'] not in ids]
        data['reports']=[r for r in data['reports'] if not(r['cell']==cell and r['month']==month and r.get('notes')==marker)]
        assert request('/api/data','admin',{'data':data,'revision':current['revision']},'PUT')[0]==200,'cleanup church data'
    for path in (ROOT/'.wrangler/state/v3/d1').rglob('*.sqlite'):
        db=sqlite3.connect(path)
        try:
            db.execute('DELETE FROM devotions WHERE reflection=?',(marker,))
            account=db.execute('SELECT id FROM accounts WHERE email=?',(marker+'@shalom.local',)).fetchone()
            if account:
                db.execute('DELETE FROM sessions WHERE account=?',account)
                db.execute('DELETE FROM credentials WHERE account=?',account)
                db.execute('DELETE FROM accounts WHERE id=?',account)
            db.commit()
        except sqlite3.OperationalError:pass
        finally:db.close()
