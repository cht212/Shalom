"""Provision Sector 6 and two disciple accounts in the local database only."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import hashlib,json,secrets,sqlite3,uuid

root=Path(__file__).resolve().parents[1]
candidates=[]
for path in (root/'.wrangler/state/v3/d1').rglob('*.sqlite'):
    with sqlite3.connect(path) as connection:
        tables={r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if {'accounts','credentials','church'}<=tables:candidates.append(path)
if len(candidates)!=1:raise SystemExit('Expected exactly one migrated local database. No changes made.')

credentials=[]
with sqlite3.connect(candidates[0],timeout=20) as db:
    db.execute('BEGIN IMMEDIATE')
    row=db.execute("SELECT data FROM church WHERE id='shalom'").fetchone()
    if not row:raise SystemExit('Church data not found. No changes made.')
    data=json.loads(row[0])
    sector=next((s for s in data['sectors'] if s['name'].strip().casefold()=='sector 6'),None)
    if not sector:
        sector={'id':str(uuid.uuid4()),'name':'Sector 6'}
        data['sectors'].append(sector)
    cell=next((c for c in data['cells'] if c['sector']==sector['id'] and c['name'].strip().casefold()=='sector 6'),None)
    if not cell:
        cell={'id':str(uuid.uuid4()),'sector':sector['id'],'name':'Sector 6','leader':'','day':'','address':''}
        data['cells'].append(cell)
    for username,name in [('albert','Albert'),('jenni','Jenni')]:
        if db.execute('SELECT account FROM credentials WHERE username=?',(username,)).fetchone():
            print('Existing username preserved:',username)
            continue
        email=username+'@shalom.local'
        if db.execute('SELECT id FROM accounts WHERE email=?',(email,)).fetchone():
            raise RuntimeError('An account with this contact already exists; no changes saved.')
        person={'id':str(uuid.uuid4()),'name':name,'phone':'','email':'','age':None,'address':'','cell':cell['id'],'joined':datetime.now(ZoneInfo('America/Lima')).date().isoformat()}
        data['people'].append(person)
        account=str(uuid.uuid4());password=secrets.token_urlsafe(14);salt=secrets.token_hex(32)
        hashed=hashlib.pbkdf2_hmac('sha256',password.encode(),salt.encode(),100000).hex()
        db.execute('INSERT INTO accounts (id,email,user_id,name,role,cell,person,active) VALUES (?,?,?,?,?,?,?,1)',(account,email,account,name,'disciple',cell['id'],person['id']))
        db.execute('INSERT INTO credentials (account,username,salt,hash,must_change) VALUES (?,?,?,?,0)',(account,username,salt,hashed))
        credentials.append(f'{name}\nUsuario: {username}\nContraseña: {password}\nRol: Discípulo\nSector y célula: Sector 6\n')
    if credentials:
        destination=root/'.sites-runtime/USUARIOS_SECTOR_6.txt'
        destination.parent.mkdir(exist_ok=True)
        with destination.open('a',encoding='utf-8') as f:f.write('\n'.join(credentials)+'\n')
    db.execute("UPDATE church SET data=?,revision=revision+1 WHERE id='shalom'",(json.dumps(data,ensure_ascii=False),))
print('Sector 6 ready. New accounts:',len(credentials))
print('Private credentials: .sites-runtime/USUARIOS_SECTOR_6.txt')
