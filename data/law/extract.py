"""Turn a zakonyprolidi.cz law page into citable fragments (the corpus that
data/explanations.json quotes; src/domain/explanations.test.ts checks every quote against it).

Each fragment: {"ref": "§ 5 odst. 1 písm. b)", "anchor": "p5-1-b", "text": "..."}; annex rows of
vyhláška 294/2015 Sb. become {"ref": "příloha č. 1, značka A 1a", "anchor": "sign-A1a", ...}.
Law texts are úřední díla (§ 3 zákona č. 121/2000 Sb.), free to reuse.

Refresh (consolidated wording as published on zakonyprolidi.cz):
  curl -sS -o /tmp/z.html https://www.zakonyprolidi.cz/cs/2000-361
  python3 -I data/law/extract.py /tmp/z.html data/law/361-2000.json "361/2000 Sb."
  (likewise 2015-294 → 294-2015.json "294/2015 Sb.", 2001-56 → 56-2001.json "56/2001 Sb.",
   2000-247 → 247-2000.json "247/2000 Sb."), then run npm test.
"""
import html
import json
import re
import sys

src, out, code = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding="utf-8").read()
start = s.find('class="Frags"')
body = s[start:]

frag_re = re.compile(r'<(p|h3)[^>]*>(.*?)</\1>', re.S)
anchor_re = re.compile(r'<i id="(p[0-9a-z]+(?:-[0-9a-z]+)*)"></i>')


def clean(x: str) -> str:
    x = re.sub(r'<a class="linknote".*?</a>', '', x, flags=re.S)  # footnote markers
    x = re.sub(r'<[^>]+>', '', x)
    return re.sub(r'\s+', ' ', html.unescape(x)).strip()


def ref_of(anchor: str) -> str:
    parts = anchor[1:].split('-')
    r = f'§ {parts[0]}'
    if len(parts) > 1:
        r += f' odst. {parts[1]}'
    if len(parts) > 2:
        r += f' písm. {parts[2]})'
    if len(parts) > 3:
        r += f' bod {parts[3]}'
    return r


frags = []
for m in frag_re.finditer(body):
    a = anchor_re.search(m.group(2))
    text = clean(m.group(2))
    if not a or not text:
        continue
    anchor = a.group(1)
    if not re.match(r'p\d', anchor) or '-' not in anchor and text.startswith('§'):
        continue  # bare "§ 5" headings carry no rule
    frags.append({"ref": ref_of(anchor), "anchor": anchor, "text": text})

# Annex tables (vyhláška 294/2015 Sb.: one row per sign — number, picture, meaning).
annex_re = re.compile(r'Příloha č\. (\d+) k vyhlášce.*?(?=Příloha č\. \d+ k vyhlášce|$)', re.S)
row_re = re.compile(r'<tr><th[^>]*>((?:(?!</tr>).)*?)</th><td[^>]*>(?:(?!</td>).)*</td><td[^>]*>((?:(?!</tr>).)*?)</td></tr>', re.S)
for am in annex_re.finditer(body):
    for rm in row_re.finditer(am.group(0)):
        num, text = clean(rm.group(1)), clean(rm.group(2).replace('<br/>', ' '))
        if not num or not text or num == 'Číslo':
            continue
        # The cell is "Name<br/> meaning and use": keep the official name on its own.
        name = clean(rm.group(2).split('<br/>')[0])
        frags.append({"ref": f'příloha č. {am.group(1)}, značka {num}',
                      "anchor": f'sign-{num.replace(" ", "")}', "text": text, "name": name})

json.dump({"code": code, "fragments": frags}, open(out, "w"), ensure_ascii=False, indent=1)
print(len(frags), 'fragments')
