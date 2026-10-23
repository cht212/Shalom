"""Import the public-domain RV1909 from a pinned BibleAquifer revision."""
import concurrent.futures, json, pathlib, re, urllib.request, xml.etree.ElementTree as ET
COMMIT = '84a071324be17c7c66db17dd204d7804e66d728b'
ROOT = pathlib.Path(__file__).resolve().parents[1] / 'public' / 'bible'
ROOT.mkdir(parents=True, exist_ok=True)
def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=20) as response: return response.read()
        except Exception:
            if attempt == 2: raise
tree = json.loads(get(f'https://api.github.com/repos/BibleAquifer/ReinaValera1909/contents/spa/usx?ref={COMMIT}'))
paths = sorted(x['path'] for x in tree if x['path'].endswith('.usx'))
assert len(paths) == 66
def convert(path):
    root = ET.fromstring(get(f'https://raw.githubusercontent.com/BibleAquifer/ReinaValera1909/{COMMIT}/{path}'))
    code = root.find('book').get('code')
    name = next(''.join(p.itertext()).strip() for p in root.findall('para') if p.get('style') == 'toc2')
    chapters = {}; chapter = None; verse = None
    def visit(node):
        nonlocal chapter, verse
        if node.tag in ('note', 'figure'): return
        if node.tag == 'chapter' and node.get('number'):
            chapter = int(node.get('number')); chapters[chapter] = {}; verse = None
        if node.tag == 'verse':
            verse = node.get('number')
            if verse: chapters[chapter][verse] = []
        if verse and node.text: chapters[chapter][verse].append(node.text)
        for child in node:
            visit(child)
            if verse and child.tail: chapters[chapter][verse].append(child.tail)
    visit(root)
    result = {str(c):[{'verse':v,'text':re.sub(r'\s+', ' ', ''.join(parts)).strip()} for v,parts in verses.items()] for c,verses in chapters.items()}
    result = {c:[v for v in vs if v['text']] for c,vs in result.items()}
    assert result and all(result.values()), path
    (ROOT / f'{code}.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    return {'id':code,'name':name,'chapters':len(chapters),'verses':sum(map(len, result.values()))}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: books = list(pool.map(convert, paths))
(ROOT / 'books.json').write_text(json.dumps(books,ensure_ascii=False),encoding='utf-8')
(ROOT / 'SOURCE.md').write_text(f'Reina-Valera 1909 Â· Public domain / CC0\nSource: https://github.com/BibleAquifer/ReinaValera1909\nPinned revision: {COMMIT}\nVerse text extracted from USX; Strong annotations and editorial headings excluded.\n',encoding='utf-8')
print(f'Imported {len(books)} books, {sum(b["chapters"] for b in books)} chapters, {sum(b["verses"] for b in books)} verses.')


