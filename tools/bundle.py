"""Single-file build (for Claude artifacts or offline demos).

    python3 tools/bundle.py            ->  dist/monthliv.html

Inlines the stylesheet and every script index.html loads, in the same order,
except config.js (keys never go into the bundle). The output has no <html>/<body>
wrapper because the Claude artifact host adds its own; open it in a browser
as-is and it still works.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()

def main():
    index = read('index.html')
    scripts = [s.split('?')[0] for s in re.findall(r'<script src="([^"]+)"', index)]
    scripts = [s for s in scripts if not s.startswith('http') and s != 'config.js']
    code = '\n'.join(read(s) for s in scripts)
    assert '</script' not in code.lower(), 'a script contains </script'
    css = read('assets/styles.css')
    fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com[^"]+)"', index).group(1)
    page = f'''<title>monthliv 플랫폼</title>
<meta name="description" content="monthliv 이용자 사이트 · 점주 PMS · 운영 Admin">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
<style>
{css}
</style>
<div id="app"></div>
<script>
{code}
</script>
'''
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    out = os.path.join(ROOT, 'dist', 'monthliv.html')
    open(out, 'w', encoding='utf-8').write(page)
    print('wrote dist/monthliv.html', round(os.path.getsize(out) / 1024), 'KB from', len(scripts), 'scripts')

if __name__ == '__main__':
    main()
