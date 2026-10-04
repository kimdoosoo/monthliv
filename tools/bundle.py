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
    # Claude artifacts load stylesheets only from Google Fonts, so the Pretendard CDN link is
    # left out; if build/fonts/pretendard-subset.woff2 exists (a subset of the free Pretendard
    # font, made with fonttools pyftsubset) it is inlined instead, otherwise system fonts are used.
    fonts = [f for f in re.findall(r'<link rel="stylesheet" href="(https://[^"]+)"', index) if 'fonts.googleapis.com' in f]
    assert fonts, 'Google Fonts link missing'
    sub = os.path.join(ROOT, 'build', 'fonts', 'pretendard-subset.woff2')
    face = ''
    if os.path.isfile(sub):
        import base64
        b64 = base64.b64encode(open(sub, 'rb').read()).decode()
        face = ("@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;"
                f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}\n")
    page = f'''<title>monthliv 플랫폼</title>
<meta name="description" content="monthliv 이용자 사이트 · 점주 PMS · 운영 Admin">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{''.join(f'<link rel="stylesheet" href="{f}">' for f in fonts)}
<style>
{face}{css}
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
