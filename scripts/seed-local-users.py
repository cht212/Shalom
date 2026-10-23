"""Create the five requested local test accounts. Never runs against production."""
from pathlib import Path
import sqlite3,json,secrets,hashlib
ROOT=Path(__file__).resolve().parents[1]
found=[]
for candidate in (ROOT/'.wrangler/state/v3/d1').rglob('*.sqlite'):
    conn=sqlite3.connect(candidate)
    names={r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if {'church','credentials','accounts'}<=names:found.append(candidate)
    conn.close()
if len(found)!=1:raise SystemExit('Expected exactly one migrated local Shalom database.')
db=sqlite3.connect(found[0],timeout=20)
row=db.execute("SELECT data FROM church WHERE id='shalom'").fetchone()
data=json.loads(row[0]) if row else {k:[] for k in ['sectors','cells','people','attendance','reports','devotions']}
if not any(s['id']=='demo-sector-shalom' for s in data['sectors']):data['sectors'].append({'id':'demo-sector-shalom','name':'Sector de pruebas'})
if not any(c['id']=='demo-cell-shalom' for c in data['cells']):data['cells'].append({'id':'demo-cell-shalom','sector':'demo-sector-shalom','name':'Célula de pruebas','leader':'Líder de prueba','day':'Viernes · 7:00 p. m.','address':'Por completar'})
output=['CUENTAS LOCALES DE PRUEBA SHALOM','No publicar este archivo. Cambia las contraseñas antes de usar cuentas reales.','']
for role,username,name in [('admin','admin.shalom','Administrador Shalom'),('disciple','discipulo.shalom','Discípulo de prueba'),('cell_leader','lider.celula','Líder de célula de prueba'),('sector_leader','lider.sector','Líder de sector de prueba'),('pastor','pastor.shalom','Pastor de prueba')]:
    if db.execute('SELECT account FROM credentials WHERE username=?',(username,)).fetchone():continue
    account='demo-account-'+role;person='demo-person-'+role
    if not any(p['id']==person for p in data['people']):data['people'].append({'id':person,'name':name,'phone':'','age':None,'address':'','email':'','cell':'demo-cell-shalom','joined':'2026-10-23'})
    db.execute('INSERT OR IGNORE INTO accounts (id,email,user_id,name,role,cell,sector,person,active) VALUES (?,?,?,?,?,?,?,?,1)',(account,username+'@shalom.local',account,name,role,'demo-cell-shalom' if role in ('disciple','cell_leader') else None,'demo-sector-shalom' if role=='sector_leader' else None,person))
    password=secrets.token_urlsafe(12);salt=secrets.token_hex(32);hashed=hashlib.pbkdf2_hmac('sha256',password.encode(),salt.encode(),100000).hex()
    db.execute('INSERT INTO credentials (account,username,salt,hash,must_change) VALUES (?,?,?,?,0)',(account,username,salt,hashed))
    output.append(f'{name}\nUsuario: {username}\nContraseña: {password}\n')
if row:db.execute("UPDATE church SET data=?,revision=revision+1 WHERE id='shalom'",(json.dumps(data,ensure_ascii=False),))
else:db.execute('INSERT INTO church (id,data,revision) VALUES (?,?,0)',('shalom',json.dumps(data,ensure_ascii=False)))
db.commit();db.close()
if len(output)>3:
    dest=ROOT/'.sites-runtime/USUARIOS_PRUEBA.txt'
    with dest.open('a',encoding='utf-8') as f:f.write('\n'.join(output)+'\n')
print('Local test accounts ready. Credentials: .sites-runtime/USUARIOS_PRUEBA.txt (not public).')
