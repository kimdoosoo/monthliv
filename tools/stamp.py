"""Cache busting for GitHub Pages.

GitHub Pages lets browsers keep files for about 10 minutes. After changing any
file, run this once before committing so every visitor gets the new version:

    python3 tools/stamp.py

It rewrites the local file links in index.html to  file?v=<content hash>.
"""
import hashlib, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, 'index.html')

def main():
    html = open(INDEX, encoding='utf-8').read()
    changed = []

    def rep(m):
        attr, path, old = m.group(1), m.group(2), m.group(3) or ''
        f = os.path.join(ROOT, path)
        if not os.path.isfile(f):
            return m.group(0)
        v = hashlib.sha1(open(f, 'rb').read()).hexdigest()[:8]
        if old != '?v=' + v:
            changed.append(path)
        return f'{attr}="{path}?v={v}"'

    out = re.sub(r'\b(src|href)="((?!https?:|//|#|data:)[^"?#]+)(\?v=[0-9a-f]+)?"', rep, html)
    open(INDEX, 'w', encoding='utf-8').write(out)
    print('stamped', len(changed), 'changed file(s)' + (': ' + ', '.join(changed) if changed else ''))

if __name__ == '__main__':
    main()
