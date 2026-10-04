"""Writes src/data/listings.ts: MONTHLIV's branches as places on the site.

    python3 scripts/make-listings.py

One place per room type of every branch that is open or opening soon, plus MONTHLIV in Jeju.
Branch names, areas, stations, lines, room types and opening dates follow the company's branch
list. Prices are examples: a month at a stay branch costs about what the branch charges a month
(the 1-night price is set so that 30 nights with the month discount come to it); hostels and
the residence keep their 1-night price. Re-run after changing BRANCHES below.
"""
import json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "data", "listings.ts")
L = ["ko", "en", "ja", "zh-CN", "de"]


def T(ko, en, ja, zh, de):
    return {"ko": ko, "en": en, "ja": ja, "zh-CN": zh, "de": de}


# Room types, by the names branches use.
ROOM = {
    "std": T("스탠다드 룸", "Standard Room", "スタンダードルーム", "标准间", "Standardzimmer"),
    "win": T("윈도우 룸", "Window Room", "ウィンドウルーム", "带窗房", "Fensterzimmer"),
    "prm": T("프리미엄 룸", "Premium Room", "プレミアムルーム", "高级间", "Premiumzimmer"),
    "sgl": T("싱글룸", "Single Room", "シングルルーム", "单人间", "Einzelzimmer"),
    "dbl": T("더블룸", "Double Room", "ダブルルーム", "大床房", "Doppelzimmer"),
    "fam": T("패밀리룸", "Family Room", "ファミリールーム", "家庭房", "Familienzimmer"),
    "stu": T("패밀리 스튜디오", "Family Studio", "ファミリースタジオ", "家庭开间", "Familienstudio"),
}
SLUG = {"std": "standard", "win": "window", "prm": "premium", "sgl": "single", "dbl": "double", "fam": "family", "stu": "studio"}

# How each kind of branch is named and labelled.
KIND = {
    "stay": T("스테이", "Stay", "ステイ", "月租房", "Stay"),
    "hostel": T("호스텔", "Hostel", "ホステル", "青年旅舍", "Hostel"),
    "residence": T("레지던스", "Residence", "レジデンス", "服务式公寓", "Residence"),
}

# (id, kind, opens, fee %, walk, lat, lng, name, area, station,
#  [(type key, size m², window, guests, bed, night, month)], description)
# `opens` is the opening month (YYYY-MM) of branches that haven't opened yet (as of 2026-10-04);
# the company's branch list gives the month, not the day.
BRANCHES = [
    ("seongsu", "stay", None, 10, 4, 37.5441, 127.0573,
     T("성수", "Seongsu", "聖水", "圣水", "Seongsu"),
     T("성동구 성수동", "Seongsu-dong, Seongdong-gu", "城東区 聖水洞", "城东区 圣水洞", "Seongsu-dong, Seongdong-gu"),
     T("성수역", "Seongsu Stn", "聖水駅", "圣水站", "Station Seongsu"),
     [("std", 8.3, "inner", 1, "single", None, 620000), ("win", 9.1, "outer", 1, "single", None, 680000),
      ("prm", 11.2, "outer", 2, "double", None, 760000)],
     T("먼슬리브의 첫 직영 지점이에요. 성수역에서 걸어서 4분이고, 서울숲과 성수동 카페 거리가 가까워요. 출퇴근하며 한 달을 지내기 좋아요.",
       "MONTHLIV's first directly run branch, four minutes' walk from Seongsu Station. Seoul Forest and the Seongsu café streets are close by, so it's an easy base for a month of commuting.",
       "MONTHLIVの最初の直営店舗です。聖水駅から徒歩4分で、ソウルの森や聖水洞のカフェ通りも近く、通勤しながらの1か月にぴったりです。",
       "MONTHLIV的首家直营门店，距圣水站步行4分钟，靠近首尔林和圣水洞咖啡街，适合一边通勤一边住上一个月。",
       "Die erste Filiale, die MONTHLIV selbst betreibt – vier Minuten zu Fuß von der Station Seongsu. Seoul Forest und die Cafés von Seongsu sind nah, ein guter Ausgangspunkt für einen Monat mit Pendeln.")),
    ("doksan", "stay", None, 10, 5, 37.4668, 126.8902,
     T("가산디지털·독산", "Gasan Digital · Doksan", "加山デジタル・禿山", "加山数码·秃山", "Gasan Digital · Doksan"),
     T("금천구 독산동", "Doksan-dong, Geumcheon-gu", "衿川区 禿山洞", "衿川区 秃山洞", "Doksan-dong, Geumcheon-gu"),
     T("독산역", "Doksan Stn", "禿山駅", "秃山站", "Station Doksan"),
     [("std", 7.9, "inner", 1, "single", None, 520000), ("win", 8.8, "outer", 1, "single", None, 570000)],
     T("G밸리(가산디지털단지)로 출근하는 분들을 위한 지점이에요. 독산역에서 걸어서 5분이고, 가산디지털단지역도 걸어서 갈 수 있어요.",
       "A branch for people working in G-Valley (Gasan Digital Complex). Five minutes' walk from Doksan Station, with Gasan Digital Complex Station also within walking distance.",
       "Gバレー（加山デジタル団地）に通勤する人のための店舗です。禿山駅から徒歩5分、加山デジタル団地駅にも歩いて行けます。",
       "为在G-Valley（加山数码园区）上班的人准备的门店。距秃山站步行5分钟，也可以步行到加山数码园区站。",
       "Eine Filiale für alle, die im G-Valley (Gasan Digital Complex) arbeiten. Fünf Minuten zu Fuß von der Station Doksan, auch die Station Gasan Digital Complex ist zu Fuß erreichbar.")),
    ("cheongnyangni", "stay", None, 15, 6, 37.5826, 127.0465,
     T("청량리", "Cheongnyangni", "清凉里", "清凉里", "Cheongnyangni"),
     T("동대문구 청량리동", "Cheongnyangni-dong, Dongdaemun-gu", "東大門区 清凉里洞", "东大门区 清凉里洞", "Cheongnyangni-dong, Dongdaemun-gu"),
     T("청량리역", "Cheongnyangni Stn", "清凉里駅", "清凉里站", "Station Cheongnyangni"),
     [("std", 8.0, "inner", 1, "single", None, 560000), ("win", 9.0, "outer", 1, "single", None, 610000)],
     T("1호선, 경의중앙선, 수인분당선이 지나는 청량리역 가까이에 있어요. 경희대와 서울시립대가 가까워 학생과 직장인 모두에게 편해요.",
       "Near Cheongnyangni Station, on Line 1, the Gyeongui–Jungang Line and the Suin–Bundang Line. Kyung Hee University and the University of Seoul are close, so it suits students and workers alike.",
       "1号線、京義・中央線、水仁・盆唐線が通る清凉里駅の近くです。慶熙大学やソウル市立大学に近く、学生にも社会人にも便利です。",
       "靠近清凉里站，1号线、京义·中央线和水仁·盆唐线都经过这里。离庆熙大学和首尔市立大学很近，学生和上班族都方便。",
       "Nahe der Station Cheongnyangni mit Linie 1, Gyeongui–Jungang- und Suin–Bundang-Linie. Die Kyung-Hee-Universität und die University of Seoul sind nah – praktisch für Studierende wie Berufstätige.")),
    ("samsung", "residence", None, 10, 4, 37.4858, 127.0838,
     T("삼성서울병원", "Samsung Medical Center", "サムスンソウル病院", "三星首尔医院", "Samsung Medical Center"),
     T("강남구 일원동", "Irwon-dong, Gangnam-gu", "江南区 逸院洞", "江南区 逸院洞", "Irwon-dong, Gangnam-gu"),
     T("일원역", "Irwon Stn", "逸院駅", "逸院站", "Station Irwon"),
     [("std", 8.6, "outer", 1, "single", 59000, None), ("stu", 12.4, "outer", 2, "double", 79000, None)],
     T("삼성서울병원까지 걸어서 갈 수 있는 레지던스예요. 외래 진료나 가족 간병으로 하룻밤부터 몇 달까지 머물 수 있어요.",
       "A residence within walking distance of Samsung Medical Center. Stay from one night to several months for outpatient visits or while caring for a family member.",
       "サムスンソウル病院まで歩いて行けるレジデンスです。外来の通院や家族の付き添いで、1泊から数か月まで滞在できます。",
       "步行可到三星首尔医院的服务式公寓。无论是门诊就医还是陪护家人，都可以住一晚到几个月。",
       "Eine Residenz, von der aus du das Samsung Medical Center zu Fuß erreichst. Für ambulante Termine oder die Begleitung von Angehörigen – von einer Nacht bis zu mehreren Monaten.")),
    ("mokdong", "stay", None, 15, 5, 37.5262, 126.8667,
     T("목동", "Mokdong", "木洞", "木洞", "Mokdong"),
     T("양천구 목동", "Mok-dong, Yangcheon-gu", "陽川区 木洞", "阳川区 木洞", "Mok-dong, Yangcheon-gu"),
     T("목동역", "Mokdong Stn", "木洞駅", "木洞站", "Station Mokdong"),
     [("std", 8.1, "inner", 1, "single", None, 560000), ("win", 9.3, "outer", 1, "single", None, 610000)],
     T("학원가와 주거 단지가 모인 목동의 조용한 지점이에요. 5호선 목동역에서 걸어서 5분이에요.",
       "A quiet branch in Mokdong, a neighbourhood of academies and apartment blocks, five minutes' walk from Mokdong Station on Line 5.",
       "塾街と住宅団地が集まる木洞の静かな店舗です。5号線木洞駅から徒歩5分です。",
       "位于补习班和住宅区集中的木洞，环境安静。距5号线木洞站步行5分钟。",
       "Eine ruhige Filiale in Mokdong, einem Viertel mit Nachhilfeschulen und Wohnanlagen – fünf Minuten zu Fuß von der Station Mokdong (Linie 5).")),
    ("geondae", "hostel", None, 15, 3, 37.5428, 127.0688,
     T("건대", "Konkuk Univ.", "建大", "建大", "Konkuk Univ."),
     T("광진구 화양동", "Hwayang-dong, Gwangjin-gu", "広津区 華陽洞", "广津区 华阳洞", "Hwayang-dong, Gwangjin-gu"),
     T("건대입구역", "Konkuk Univ. Stn", "建大入口駅", "建大入口站", "Station Konkuk Univ."),
     [("sgl", 7.6, "outer", 1, "single", 45000, None), ("dbl", 10.2, "outer", 2, "double", 65000, None),
      ("fam", 14.8, "outer", 4, "bunk", 99000, None)],
     T("2호선과 7호선이 만나는 건대입구역에서 걸어서 3분인 호스텔이에요. 성수와 잠실이 가까워 여행과 출장 모두 편해요.",
       "A hostel three minutes' walk from Konkuk Univ. Station, where Lines 2 and 7 meet. Seongsu and Jamsil are close by, handy for trips and business stays.",
       "2号線と7号線が交わる建大入口駅から徒歩3分のホステルです。聖水や蚕室も近く、旅行にも出張にも便利です。",
       "距2号线和7号线交汇的建大入口站步行3分钟的青年旅舍。圣水和蚕室都很近，旅行和出差都方便。",
       "Ein Hostel drei Minuten zu Fuß von der Station Konkuk Univ., wo sich die Linien 2 und 7 kreuzen. Seongsu und Jamsil sind nah – praktisch für Reisen und Geschäftsaufenthalte.")),
    ("guro", "stay", None, 10, 7, 37.4868, 126.8962,
     T("구로", "Guro", "九老", "九老", "Guro"),
     T("구로구 구로동", "Guro-dong, Guro-gu", "九老区 九老洞", "九老区 九老洞", "Guro-dong, Guro-gu"),
     T("구로디지털단지역", "Guro Digital Complex Stn", "九老デジタル団地駅", "九老数码园区站", "Station Guro Digital Complex"),
     [("std", 8.0, "inner", 1, "single", None, 540000), ("win", 9.0, "outer", 1, "single", None, 590000)],
     T("IT 기업이 모인 구로디지털단지로 출근하는 분들을 위한 지점이에요. 2호선으로 강남과 신림까지 갈아타지 않고 갈 수 있어요.",
       "A branch for commuters to the Guro Digital Complex tech hub. Line 2 takes you to Gangnam and Sillim without changing trains.",
       "IT企業が集まる九老デジタル団地に通勤する人のための店舗です。2号線で江南や新林まで乗り換えなしで行けます。",
       "为在IT企业聚集的九老数码园区上班的人准备的门店。坐2号线不用换乘就能到江南和新林。",
       "Eine Filiale für alle, die im Technologieviertel Guro Digital Complex arbeiten. Mit Linie 2 kommst du ohne Umsteigen nach Gangnam und Sillim.")),
    ("wangsimni", "hostel", None, 15, 4, 37.5638, 127.0306,
     T("왕십리", "Wangsimni", "往十里", "往十里", "Wangsimni"),
     T("성동구 하왕십리동", "Hawangsimni-dong, Seongdong-gu", "城東区 下往十里洞", "城东区 下往十里洞", "Hawangsimni-dong, Seongdong-gu"),
     T("상왕십리역", "Sangwangsimni Stn", "上往十里駅", "上往十里站", "Station Sangwangsimni"),
     [("sgl", 7.4, "outer", 1, "single", 43000, None), ("dbl", 10.0, "outer", 2, "double", 62000, None)],
     T("서울에서 손꼽히는 환승역인 왕십리 근처의 호스텔이에요. 동대문, 성수, 을지로가 가까워 서울 동쪽을 둘러보기 좋아요.",
       "A hostel near Wangsimni, one of Seoul's busiest interchanges. Dongdaemun, Seongsu and Euljiro are close, a good base for exploring the east of the city.",
       "ソウル有数の乗り換え駅、往十里近くのホステルです。東大門、聖水、乙支路が近く、ソウルの東側を巡る拠点にぴったりです。",
       "位于首尔重要换乘站往十里附近的青年旅舍。东大门、圣水、乙支路都很近，适合作为游览首尔东部的据点。",
       "Ein Hostel nahe Wangsimni, einem der größten Umsteigeknoten Seouls. Dongdaemun, Seongsu und Euljiro sind nah – eine gute Basis für den Osten der Stadt.")),
    ("sinchon", "hostel", None, 15, 2, 37.5547, 126.9384,
     T("신촌", "Sinchon", "新村", "新村", "Sinchon"),
     T("마포구 노고산동", "Nogosan-dong, Mapo-gu", "麻浦区 老姑山洞", "麻浦区 老姑山洞", "Nogosan-dong, Mapo-gu"),
     T("신촌역", "Sinchon Stn", "新村駅", "新村站", "Station Sinchon"),
     [("sgl", 7.5, "outer", 1, "single", 46000, None), ("dbl", 10.4, "outer", 2, "double", 66000, None),
      ("fam", 15.0, "outer", 4, "bunk", 108000, None)],
     T("연세대, 서강대, 이화여대가 가까운 신촌 한가운데의 호스텔이에요. 신촌역에서 걸어서 2분이고, 홍대까지 지하철로 한 정거장이에요.",
       "A hostel in the heart of Sinchon, near Yonsei, Sogang and Ewha universities. Two minutes' walk from Sinchon Station and one stop from Hongdae.",
       "延世大、西江大、梨花女子大に近い新村の中心にあるホステルです。新村駅から徒歩2分、弘大までは地下鉄で1駅です。",
       "位于新村中心的青年旅舍，靠近延世大学、西江大学和梨花女子大学。距新村站步行2分钟，坐地铁一站就到弘大。",
       "Ein Hostel mitten in Sinchon, nahe den Universitäten Yonsei, Sogang und Ewha. Zwei Minuten zu Fuß von der Station Sinchon, bis Hongdae ist es eine U-Bahn-Station.")),
    ("cheonho", "stay", None, 10, 3, 37.5393, 127.1252,
     T("천호", "Cheonho", "千戸", "千户", "Cheonho"),
     T("강동구 천호동", "Cheonho-dong, Gangdong-gu", "江東区 千戸洞", "江东区 千户洞", "Cheonho-dong, Gangdong-gu"),
     T("천호역", "Cheonho Stn", "千戸駅", "千户站", "Station Cheonho"),
     [("std", 8.2, "inner", 1, "single", None, 560000), ("win", 9.2, "outer", 1, "single", None, 610000)],
     T("5호선과 8호선이 지나는 천호역에서 걸어서 3분이에요. 잠실과 하남 미사가 가깝고, 바로 앞에 상가와 생활 시설이 모여 있어요.",
       "Three minutes' walk from Cheonho Station on Lines 5 and 8. Jamsil and Hanam Misa are nearby, with shops and everyday services right outside.",
       "5号線と8号線が通る千戸駅から徒歩3分です。蚕室や河南ミサも近く、すぐ前に商店や生活施設がそろっています。",
       "距5号线和8号线经过的千户站步行3分钟。离蚕室和河南美沙很近，门口就有商店和生活设施。",
       "Drei Minuten zu Fuß von der Station Cheonho an den Linien 5 und 8. Jamsil und Hanam Misa sind nah, Geschäfte und alles für den Alltag gleich vor der Tür.")),
    ("cheonho-hostel", "hostel", "2026-10", 15, 3, 37.5394, 127.1254,
     T("천호", "Cheonho", "千戸", "千户", "Cheonho"),
     T("강동구 천호동", "Cheonho-dong, Gangdong-gu", "江東区 千戸洞", "江东区 千户洞", "Cheonho-dong, Gangdong-gu"),
     T("천호역", "Cheonho Stn", "千戸駅", "千户站", "Station Cheonho"),
     [("sgl", 7.4, "outer", 1, "single", 42000, None), ("dbl", 10.0, "outer", 2, "double", 60000, None),
      ("fam", 14.6, "outer", 4, "bunk", 95000, None)],
     T("천호 스테이와 같은 건물 5~9층에 문을 여는 호스텔이에요. 천호역에서 걸어서 3분이에요.",
       "A hostel opening on floors 5 to 9 of the same building as Cheonho Stay, three minutes' walk from Cheonho Station.",
       "千戸ステイと同じ建物の5〜9階にオープンするホステルです。千戸駅から徒歩3分です。",
       "在千户月租房同一栋楼的5至9层开业的青年旅舍，距千户站步行3分钟。",
       "Ein Hostel, das in den Etagen 5 bis 9 im selben Haus wie Cheonho Stay öffnet – drei Minuten zu Fuß von der Station Cheonho.")),
    ("snu", "stay", "2026-10", 10, 3, 37.4724, 126.9339,
     T("서울대벤처타운", "SNU Venture Town", "ソウル大ベンチャータウン", "首尔大风险城", "SNU Venture Town"),
     T("관악구 신림동", "Sillim-dong, Gwanak-gu", "冠岳区 新林洞", "冠岳区 新林洞", "Sillim-dong, Gwanak-gu"),
     T("서울대벤처타운역", "SNU Venture Town Stn", "ソウル大ベンチャータウン駅", "首尔大风险城站", "Station SNU Venture Town"),
     [("std", 7.8, "inner", 1, "single", None, 520000), ("win", 8.9, "outer", 1, "single", None, 570000)],
     T("신림선 서울대벤처타운역에서 걸어서 3분 거리에 문을 여는 지점이에요. 서울대학교가 가까워 학생과 수험생에게 잘 맞아요.",
       "A branch opening three minutes' walk from SNU Venture Town Station on the Sillim Line. Seoul National University is close, a good fit for students and exam candidates.",
       "新林線ソウル大ベンチャータウン駅から徒歩3分の場所にオープンする店舗です。ソウル大学に近く、学生や受験生にぴったりです。",
       "在新林线首尔大风险城站步行3分钟处开业的门店。靠近首尔大学，适合学生和备考的人。",
       "Eine Filiale, die drei Minuten zu Fuß von der Station SNU Venture Town (Sillim-Linie) öffnet. Die Seoul National University ist nah – ideal für Studierende und alle, die auf Prüfungen lernen.")),
    ("hwagok", "stay", "2026-10", 10, 6, 37.5446, 126.8455,
     T("화곡", "Hwagok", "禾谷", "禾谷", "Hwagok"),
     T("강서구 화곡동", "Hwagok-dong, Gangseo-gu", "江西区 禾谷洞", "江西区 禾谷洞", "Hwagok-dong, Gangseo-gu"),
     T("화곡역", "Hwagok Stn", "禾谷駅", "禾谷站", "Station Hwagok"),
     [("std", 7.8, "inner", 1, "single", None, 520000), ("win", 8.7, "outer", 1, "single", None, 560000)],
     T("김포공항과 마곡이 가까운 화곡역 근처의 지점이에요. 같은 건물 5층에는 호스텔이 함께 문을 열어요.",
       "A branch near Hwagok Station, close to Gimpo Airport and Magok. A hostel opens on the 5th floor of the same building.",
       "金浦空港や麻谷に近い禾谷駅そばの店舗です。同じ建物の5階にはホステルも一緒にオープンします。",
       "位于禾谷站附近，靠近金浦机场和麻谷。同一栋楼的5层还会开一家青年旅舍。",
       "Eine Filiale nahe der Station Hwagok, nicht weit vom Flughafen Gimpo und von Magok. Im 5. Stock desselben Hauses öffnet zugleich ein Hostel.")),
    ("hwagok-hostel", "hostel", "2026-10", 15, 6, 37.5447, 126.8457,
     T("화곡", "Hwagok", "禾谷", "禾谷", "Hwagok"),
     T("강서구 화곡동", "Hwagok-dong, Gangseo-gu", "江西区 禾谷洞", "江西区 禾谷洞", "Hwagok-dong, Gangseo-gu"),
     T("화곡역", "Hwagok Stn", "禾谷駅", "禾谷站", "Station Hwagok"),
     [("sgl", 7.2, "outer", 1, "single", 40000, None), ("dbl", 9.8, "outer", 2, "double", 58000, None)],
     T("김포공항에서 지하철로 금방인 화곡의 호스텔이에요. 비행기 타기 전후로 하루이틀 머물기 좋아요.",
       "A hostel in Hwagok, a short metro ride from Gimpo Airport, handy for a night or two before or after a flight.",
       "金浦空港から地下鉄ですぐの禾谷のホステルです。飛行機の前後に1〜2泊するのに便利です。",
       "位于禾谷的青年旅舍，从金浦机场坐地铁很快就到，适合在乘机前后住一两晚。",
       "Ein Hostel in Hwagok, mit der U-Bahn nur ein kurzes Stück vom Flughafen Gimpo – praktisch für ein, zwei Nächte vor oder nach dem Flug.")),
    ("mapo", "stay", "2026-10", 15, 4, 37.5410, 126.9468,
     T("마포", "Mapo", "麻浦", "麻浦", "Mapo"),
     T("마포구 용강동", "Yonggang-dong, Mapo-gu", "麻浦区 龍江洞", "麻浦区 龙江洞", "Yonggang-dong, Mapo-gu"),
     T("마포역", "Mapo Stn", "麻浦駅", "麻浦站", "Station Mapo"),
     [("std", 8.2, "inner", 1, "single", None, 640000), ("win", 9.4, "outer", 1, "single", None, 700000)],
     T("마포역에서 걸어서 4분이라 여의도와 공덕 업무지구로 출퇴근하기 편해요. 10월에 문을 여는 31호점이에요.",
       "Four minutes' walk from Mapo Station, an easy commute to the Yeouido and Gongdeok business districts. Branch No. 31, opening in October.",
       "麻浦駅から徒歩4分で、汝矣島や孔徳のビジネス街への通勤に便利です。10月にオープンする31号店です。",
       "距麻浦站步行4分钟，去汝矣岛和孔德商务区上班都很方便。是10月开业的第31号店。",
       "Vier Minuten zu Fuß von der Station Mapo – bequem zu den Geschäftsvierteln Yeouido und Gongdeok. Filiale Nr. 31, Eröffnung im Oktober.")),
    ("bulgwang", "hostel", "2026-10", 15, 3, 37.6112, 126.9305,
     T("불광", "Bulgwang", "仏光", "佛光", "Bulgwang"),
     T("은평구 불광동", "Bulgwang-dong, Eunpyeong-gu", "恩平区 仏光洞", "恩平区 佛光洞", "Bulgwang-dong, Eunpyeong-gu"),
     T("불광역", "Bulgwang Stn", "仏光駅", "佛光站", "Station Bulgwang"),
     [("sgl", 7.3, "outer", 1, "single", 39000, None), ("dbl", 9.9, "outer", 2, "double", 56000, None)],
     T("3호선과 6호선이 지나는 불광역에서 걸어서 3분인 호스텔이에요. 북한산 둘레길이 가까워요. 10월에 문을 여는 32호점이에요.",
       "A hostel three minutes' walk from Bulgwang Station on Lines 3 and 6, close to the Bukhansan trails. Branch No. 32, opening in October.",
       "3号線と6号線が通る仏光駅から徒歩3分のホステルです。北漢山の散策路が近くにあります。10月にオープンする32号店です。",
       "距3号线和6号线经过的佛光站步行3分钟的青年旅舍，靠近北汉山步道。是10月开业的第32号店。",
       "Ein Hostel drei Minuten zu Fuß von der Station Bulgwang an den Linien 3 und 6, nah an den Wanderwegen am Bukhansan. Filiale Nr. 32, Eröffnung im Oktober.")),
]

CLEANING = {"stay": 30000, "residence": 30000, "hostel": {"single": 10000, "double": 15000, "bunk": 20000}}
HOST = T("먼슬리브 매니저", "MONTHLIV", "MONTHLIVスタッフ", "MONTHLIV管家", "MONTHLIV")
HOST_NOTE = T("먼슬리브가 직접 운영하는 숙소예요", "Run by MONTHLIV itself", "MONTHLIVが直接運営しています", "由MONTHLIV直营", "Wird von MONTHLIV selbst betrieben")
HIGHLIGHT = {
    "title": T("먼슬리브가 직접 운영해요", "Run by MONTHLIV", "MONTHLIVが直接運営", "MONTHLIV直营管理", "Von MONTHLIV betrieben"),
    "text": T("응대와 청소, 시설 관리까지 먼슬리브가 맡아요. 문제가 생기면 직접 찾아가요.",
              "MONTHLIV handles the front desk, cleaning and upkeep, and comes round in person if something goes wrong.",
              "受付、清掃、設備の管理までMONTHLIVが担当します。何かあればスタッフが直接うかがいます。",
              "接待、清洁和设施维护都由MONTHLIV负责，遇到问题会有人直接上门处理。",
              "MONTHLIV kümmert sich um Empfang, Reinigung und Instandhaltung und kommt persönlich vorbei, wenn etwas nicht stimmt."),
}
SEOUL = T("서울", "Seoul", "ソウル", "首尔", "Seoul")


def js(value):
    return json.dumps(value, ensure_ascii=False)


def text(t):
    return "{ " + ", ".join(f'{json.dumps(k) if "-" in k else k}: {js(t[k])}' for k in L) + " }"


def nightly_for_month(month):
    """The 1-night price that makes 30 nights with the 25% month discount about `month`."""
    return int(math.ceil(month / 22.5 / 100) * 100)


# Branches kept in the list but not shown on the site.
# - mapo (용강동, 31호점): the partner runs it directly under a construction-only contract, and the
#   contract says a directly run place can't use the MONTHLIV name; every page here promises
#   "먼슬리브가 직접 운영해요". Remove it from HIDDEN once MONTHLIV runs it (or the brand use is agreed).
HIDDEN = {"mapo"}
BRANCHES = [b for b in BRANCHES if b[0] not in HIDDEN]

entries, ids_by_branch, kinds = [], {}, {}
for (bid, kind, opens, fee, walk, lat, lng, name, area, station, rooms, desc) in BRANCHES:
    kinds[bid] = kind
    for i, (key, size, window, guests, bed, night, month) in enumerate(rooms):
        lid = f"{bid}-{SLUG[key]}"
        ids_by_branch.setdefault(bid, []).append(lid)
        nightly = night if night else nightly_for_month(month)
        discounts = "hostelDiscounts" if kind == "hostel" else "defaultDiscounts"
        cleaning = CLEANING[kind][bed] if kind == "hostel" else CLEANING[kind]
        title = {k: f"{name[k]}{"" if k == "ja" else " "}{KIND[kind][k]} · {ROOM[key][k]}" for k in L}
        title["zh-CN"] = f"{name['zh-CN']}{KIND[kind]['zh-CN']} · {ROOM[key]['zh-CN']}"
        amenities = ["aircon", "bedding"] + (["desk"] if kind != "hostel" else []) + (["window"] if window == "outer" else [])
        address = {k: (f"{SEOUL[k]} {area[k]}" if k in ("ko", "ja", "zh-CN") else f"{area[k]}, {SEOUL[k]}") for k in L}
        # Room types of one branch sit a few metres apart so their pins don't hide each other.
        e = f"""  {{
    id: {js(lid)}, branch: {js(bid)}, tone: {(len(ids_by_branch) - 1) % 6 + 1}, nightly: {nightly}, discounts: {discounts}, cleaning: {cleaning},
    feeBps: {fee * 100},{f' opens: {js(opens)},' if opens else ''} rating: 0, reviews: 0, freeCancellation: true,
    lat: {lat + 0.00012 * i:.5f}, lng: {lng + 0.00018 * i:.5f},
    title: {text(title)},
    room: {text(ROOM[key])},
    place: {text(name)},
    area: {text(area)}, station: {text(station)}, minutes: {walk}, type: T.{kind}, guests: {guests}, size: {size},
    description: {text(desc)},
    real: {{
      photos: [],
      spaces: [],
      host: {{ name: {text(HOST)}, initial: {{ ko: "먼", en: "M" }}, note: {text(HOST_NOTE)} }},
      highlight: {{ title: {text(HIGHLIGHT['title'])}, text: {text(HIGHLIGHT['text'])} }},
      selfCheckIn: false,
      amenities: {js(amenities)},
      address: {text(address)},
    }},
  }},"""
        entries.append(e)

jeju = open(os.path.join(ROOT, "scripts", "jeju-listing.ts.txt"), encoding="utf-8").read().rstrip()

seoul_ids = [i for b, ids in ids_by_branch.items() for i in ids]
first = {b: ids[0] for b, ids in ids_by_branch.items()}

AREAS = [
    ("seongsu", ["seongsu"], ["성수", "서울숲", "뚝섬", "seongsu", "seoul forest", "ttukseom", "聖水", "圣水"], (37.5446, 127.0557)),
    ("konkuk", ["geondae"], ["건대", "건국대", "화양", "konkuk", "建大"], (37.5428, 127.0688)),
    ("doksan", ["doksan"], ["독산", "가산", "금천", "g밸리", "doksan", "gasan", "geumcheon", "g-valley", "禿山", "秃山", "加山"], (37.4668, 126.8902)),
    ("cheongnyangni", ["cheongnyangni"], ["청량리", "경희대", "시립대", "cheongnyangni", "清凉里"], (37.5826, 127.0465)),
    ("irwon", ["samsung"], ["일원", "삼성서울병원", "삼성병원", "irwon", "samsung medical", "逸院", "サムスン", "三星"], (37.4858, 127.0838)),
    ("mokdong", ["mokdong"], ["목동", "양천", "mokdong", "木洞"], (37.5262, 126.8667)),
    ("guro", ["guro"], ["구로", "guro", "九老"], (37.4868, 126.8962)),
    ("wangsimni", ["wangsimni"], ["왕십리", "wangsimni", "往十里"], (37.5638, 127.0306)),
    ("sinchon", ["sinchon"], ["신촌", "연세", "이대", "노고산", "마포", "sinchon", "yonsei", "nogosan", "mapo", "新村", "麻浦"], (37.5547, 126.9384)),
    ("cheonho", ["cheonho", "cheonho-hostel"], ["천호", "강동", "cheonho", "gangdong", "千戸", "千户"], (37.5393, 127.1252)),
    ("snu", ["snu"], ["서울대", "신림", "관악", "snu", "seoul national", "sillim", "ソウル大", "首尔大"], (37.4724, 126.9339)),
    ("hwagok", ["hwagok", "hwagok-hostel"], ["화곡", "강서", "김포", "hwagok", "gangseo", "gimpo", "禾谷", "金浦"], (37.5446, 126.8455)),
    ("mapo", ["mapo"], ["마포", "공덕", "용강", "여의도", "mapo", "gongdeok", "yeouido", "麻浦"], (37.5410, 126.9468)),
    ("bulgwang", ["bulgwang"], ["불광", "은평", "북한산", "bulgwang", "eunpyeong", "仏光", "佛光"], (37.6112, 126.9305)),
]
AREAS = [a for a in AREAS if not set(a[1]) & HIDDEN]
names = {b[0]: b for b in BRANCHES}


def area_entry(key, branches, words, center):
    b = names[branches[0]]
    ids = [i for br in branches for i in ids_by_branch[br]]
    return f"""  {{
    key: {js(key)},
    name: A[{js(branches[0])}],
    words: {js(words)},
    ids: {js(ids)},
    center: {{ lat: {center[0]}, lng: {center[1]} }},
  }},"""


area_consts = "\n".join(f"  {json.dumps(b[0])}: {text(b[8])}," for b in BRANCHES if b[0] in {a[1][0] for a in AREAS})

monthly = ["monthliv-in-jeju"] + [first[b] for b in ("seongsu", "cheonho", "cheongnyangni", "guro", "mokdong", "doksan", "samsung")]
short = ["geondae-single", "sinchon-single", "wangsimni-single", "samsung-standard", "geondae-double", "sinchon-family"]
seongsu = ids_by_branch["seongsu"] + ["geondae-single", "geondae-double", "wangsimni-single"]

template = open(os.path.join(ROOT, "scripts", "listings.template.ts.txt"), encoding="utf-8").read()
out = (template
       .replace("/*@LISTINGS@*/", jeju + "\n\n  // MONTHLIV's Seoul branches, one place per room type (made by scripts/make-listings.py).\n" + "\n".join(entries))
       .replace("/*@AREA_NAMES@*/", area_consts)
       .replace("/*@MONTHLY@*/", ",\n    ".join(js(i) for i in monthly))
       .replace("/*@SHORT@*/", ",\n    ".join(js(i) for i in short))
       .replace("/*@SEONGSU@*/", ",\n    ".join(js(i) for i in seongsu))
       .replace("/*@AREAS@*/", "\n".join(area_entry(*a) for a in AREAS)))
open(OUT, "w", encoding="utf-8").write(out)
print("wrote", os.path.relpath(OUT, ROOT), len(entries) + 1, "places")
