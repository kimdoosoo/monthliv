"""Seoul district geometry for the built-in map  ->  data/seoul-geo.js

    python3 tools/make_geo.py

Source: southkorea/seoul-maps (KOSTAT 2013 topojson, tools/seoul_kostat_2013.topo.json).
Arcs are simplified individually so shared borders stay identical between neighbours.
"""
import json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'seoul_kostat_2013.topo.json')
d = json.load(open(SRC))
sx, sy = d['transform']['scale']
tx, ty = d['transform']['translate']

arcs = []
for a in d['arcs']:
    x = y = 0
    pts = []
    for dx, dy in a:
        x += dx; y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)

geoms = d['objects']['seoul_municipalities_geo']['geometries']

LNG_MIN, LNG_MAX = 126.755, 127.195
LAT_MIN, LAT_MAX = 37.418, 37.708
LAT0 = 37.563
COS = math.cos(math.radians(LAT0))
W = 1000.0
K = W / ((LNG_MAX - LNG_MIN) * COS)
H = (LAT_MAX - LAT_MIN) * K

def proj(p):
    lng, lat = p
    return ((lng - LNG_MIN) * COS * K, (LAT_MAX - lat) * K)

def dp(points, tol):
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    best, idx = -1, 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        dist = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / L
        if dist > best:
            best, idx = dist, i
    if best > tol:
        left = dp(points[: idx + 1], tol)
        right = dp(points[idx:], tol)
        return left[:-1] + right
    return [points[0], points[-1]]

TOL = 0.55
parcs = [[proj(p) for p in a] for a in arcs]
sarcs = [dp(a, TOL) for a in parcs]

def ring_points(ring):
    out = []
    for ai in ring:
        if ai >= 0:
            pts = sarcs[ai]
        else:
            pts = list(reversed(sarcs[~ai]))
        if out:
            pts = pts[1:]
        out.extend(pts)
    return out

def fmt(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith('.0') else s

def path_of(rings):
    parts = []
    for r in rings:
        pts = ring_points(r)
        seg = 'M' + fmt(pts[0][0]) + ' ' + fmt(pts[0][1])
        prev = pts[0]
        for p in pts[1:]:
            seg += 'l' + fmt(p[0] - prev[0]) + ' ' + fmt(p[1] - prev[1])
            prev = (prev[0] + float(fmt(p[0] - prev[0])), prev[1] + float(fmt(p[1] - prev[1])))
        parts.append(seg + 'z')
    return ''.join(parts)

def centroid(pts):
    a = cx = cy = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        c = x0 * y1 - x1 * y0
        a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    a *= 0.5
    return (cx / (6 * a), cy / (6 * a))

HANJA = {
 '강동구': ('江東区', '江东区', '江東區'), '송파구': ('松坡区', '松坡区', '松坡區'),
 '강남구': ('江南区', '江南区', '江南區'), '서초구': ('瑞草区', '瑞草区', '瑞草區'),
 '관악구': ('冠岳区', '冠岳区', '冠岳區'), '동작구': ('銅雀区', '铜雀区', '銅雀區'),
 '영등포구': ('永登浦区', '永登浦区', '永登浦區'), '금천구': ('衿川区', '衿川区', '衿川區'),
 '구로구': ('九老区', '九老区', '九老區'), '강서구': ('江西区', '江西区', '江西區'),
 '양천구': ('陽川区', '阳川区', '陽川區'), '마포구': ('麻浦区', '麻浦区', '麻浦區'),
 '서대문구': ('西大門区', '西大门区', '西大門區'), '은평구': ('恩平区', '恩平区', '恩平區'),
 '노원구': ('蘆原区', '芦原区', '蘆原區'), '도봉구': ('道峰区', '道峰区', '道峰區'),
 '강북구': ('江北区', '江北区', '江北區'), '성북구': ('城北区', '城北区', '城北區'),
 '중랑구': ('中浪区', '中浪区', '中浪區'), '동대문구': ('東大門区', '东大门区', '東大門區'),
 '광진구': ('広津区', '广津区', '廣津區'), '성동구': ('城東区', '城东区', '城東區'),
 '용산구': ('龍山区', '龙山区', '龍山區'), '중구': ('中区', '中区', '中區'),
 '종로구': ('鍾路区', '钟路区', '鍾路區'),
}
# hand nudges for label placement (svg units)
NUDGE = {'강서구': (14, -6), '서초구': (-10, -22), '강남구': (-6, -8), '송파구': (-4, -6),
         '노원구': (4, -18), '은평구': (6, -4), '관악구': (0, -6), '중구': (2, 3), '용산구': (0, 6),
         '종로구': (6, 10), '양천구': (2, 4), '구로구': (8, -6), '영등포구': (6, 10), '성동구': (0, 2)}

gus = []
for g in geoms:
    p = g['properties']
    rings = g['arcs'] if g['type'] == 'Polygon' else [r for poly in g['arcs'] for r in poly]
    outer = ring_points(rings[0])
    cx, cy = centroid(outer)
    nx, ny = NUDGE.get(p['name'], (0, 0))
    ja, zh, tw = HANJA[p['name']]
    gus.append({
        'ko': p['name'], 'en': p['name_eng'].replace('-gu', ''), 'ja': ja, 'zh-CN': zh, 'zh-TW': tw,
        'd': path_of(rings), 'x': round(cx + nx, 1), 'y': round(cy + ny, 1),
    })

# ---- Han River midline: shared arcs between north- and south-bank districts
def endpoints(i):
    return parcs[i][0], parcs[i][-1]

def near(a, b):
    return abs(a[0] - b[0]) < 0.6 and abs(a[1] - b[1]) < 0.6

chain_ids = [30, 21, 22, 20, 14, 9, 10, 6, 3, 2]
line = []
for i in chain_ids:
    pts = parcs[i]
    if not line:
        # orient so the chain runs west -> east
        nxt = parcs[chain_ids[1]]
        if near(pts[0], nxt[0]) or near(pts[0], nxt[-1]):
            pts = list(reversed(pts))
        line = list(pts)
        continue
    if near(line[-1], pts[0]):
        line.extend(pts[1:])
    elif near(line[-1], pts[-1]):
        line.extend(list(reversed(pts))[1:])
    else:
        raise SystemExit(f'chain break at arc {i}: {line[-1]} vs {pts[0]} / {pts[-1]}')

# west extension: Gangseo outer boundary from the Mapo junction up to its northern tip
west = parcs[32]
if not near(west[0], line[0]):
    west = list(reversed(west))
assert near(west[0], line[0]), 'west junction mismatch'
tip = min(range(len(west)), key=lambda k: west[k][1])
west_part = list(reversed(west[: tip + 1]))
# east extension: Gangdong outer boundary from the Gwangjin junction to its northern tip
east = parcs[0]
if not near(east[0], line[-1]):
    east = list(reversed(east))
assert near(east[0], line[-1]), 'east junction mismatch'
tip = min(range(len(east)), key=lambda k: east[k][1])
east_part = east[: tip + 1]

river = west_part[:-1] + line + east_part[1:]
river = dp(river, 0.9)
# smooth a little with Chaikin so the stroke reads as water
for _ in range(2):
    sm = [river[0]]
    for a, b in zip(river, river[1:]):
        sm.append((0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]))
        sm.append((0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]))
    sm.append(river[-1])
    river = sm
river = dp(river, 0.35)
rd = 'M' + ' '.join(fmt(x) + ' ' + fmt(y) for x, y in river)

# outer outline of the city (arcs used by one geometry only)
use = {}
for g in geoms:
    rings = g['arcs'] if g['type'] == 'Polygon' else [r for poly in g['arcs'] for r in poly]
    for r in rings:
        for ai in r:
            idx = ai if ai >= 0 else ~ai
            use[idx] = use.get(idx, 0) + 1
outer_ids = [i for i, n in use.items() if n == 1]
od = ''
for i in outer_ids:
    pts = sarcs[i]
    od += 'M' + ' '.join(fmt(x) + ' ' + fmt(y) for x, y in pts)

out = {
    'w': W, 'h': round(H, 1),
    'proj': {'lngMin': LNG_MIN, 'latMax': LAT_MAX, 'cos': COS, 'k': K},
    'gu': gus, 'river': rd, 'outline': od,
}
OUT = os.path.join(ROOT, 'data', 'seoul-geo.js')
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('/* Seoul districts for the built-in map - generated by tools/make_geo.py */\n')
    f.write('const GEO = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('data/seoul-geo.js', os.path.getsize(OUT), 'bytes; H =', round(H, 1), '; river pts', len(river))
