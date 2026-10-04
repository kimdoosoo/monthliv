"""Demo dataset for monthliv  ->  data/demo.js

    python3 tools/make_data.py

Branch names, areas and opening months follow the company's own branch list;
prices, room counts per type, occupancy, members and bookings are samples.
The site moves the sample bookings/stays/tours/coupons/logs forward to "today"
(see demoData() in src/core.js), counting from TODAY below.
"""
import json, random, datetime as dt

TODAY = dt.date(2026, 10, 4)
L = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'vi']

def T(*vals):
    return dict(zip(L, vals))

# ---------- room type templates ----------
TPL = {
 'std':  T('스탠다드 룸', 'Standard Room', 'スタンダードルーム', '标准间', '標準房', 'Phòng tiêu chuẩn'),
 'win':  T('윈도우 룸', 'Window Room', 'ウィンドウルーム', '带窗房', '附窗房', 'Phòng có cửa sổ'),
 'prm':  T('프리미엄 룸', 'Premium Room', 'プレミアムルーム', '高级间', '高級房', 'Phòng cao cấp'),
 'sgl':  T('싱글룸', 'Single Room', 'シングルルーム', '单人间', '單人房', 'Phòng đơn'),
 'dbl':  T('더블룸', 'Double Room', 'ダブルルーム', '大床房', '雙人房', 'Phòng đôi'),
 'fam':  T('패밀리룸', 'Family Room', 'ファミリールーム', '家庭房', '家庭房', 'Phòng gia đình'),
 'stu':  T('패밀리 스튜디오', 'Family Studio', 'ファミリースタジオ', '家庭开间', '家庭套房', 'Studio gia đình'),
 'dlx':  T('디럭스 더블', 'Deluxe Double', 'デラックスダブル', '豪华大床房', '豪華雙人房', 'Phòng đôi cao cấp'),
}

def rt(id, tpl, size, window, cap, bed, count, night=None, week=None, month=None):
    return {'id': id, 'name': TPL[tpl], 'size': size, 'bath': 'private', 'window': window,
            'cap': cap, 'bed': bed, 'count': count,
            'price': {'night': night, 'week': week, 'month': month}}

STAY_AM = ['private_bath', 'aircon', 'wifi', 'desk', 'fridge', 'washer', 'kitchen', 'lounge', 'smartlock', 'cctv']
HOSTEL_AM = ['private_bath', 'aircon', 'wifi', 'towels', 'washer', 'lounge', 'luggage', 'smartlock', 'cctv', 'elevator']
RES_AM = ['private_bath', 'aircon', 'wifi', 'kitchenette', 'fridge', 'towels', 'washer', 'elevator', 'smartlock', 'cctv']
HOTEL_AM = ['private_bath', 'aircon', 'wifi', 'towels', 'fridge', 'elevator', 'luggage', 'smartlock']

B = []
def branch(**k):
    B.append(k)

branch(id='seongsu', no=None, type='stay', status='open', openDate='2024-10-15',
  name=T('성수', 'Seongsu', '聖水', '圣水', '聖水', 'Seongsu'),
  area=T('성동구 성수동', 'Seongsu-dong, Seongdong-gu', '城東区 聖水洞', '城东区 圣水洞', '城東區 聖水洞', 'Seongsu-dong, quận Seongdong'),
  gu='성동구', station=T('성수역', 'Seongsu Stn.', '聖水駅', '圣水站', '聖水站', 'Ga Seongsu'), lines=['2'], walk=4,
  lat=37.5441, lng=127.0573, feeRate=0.10, deposit=100000, floors=[2, 3], art=0,
  types=[rt('A', 'std', 8.3, 'inner', 1, 'single', 12, None, 200000, 620000),
         rt('B', 'win', 9.1, 'outer', 1, 'single', 9, None, 220000, 680000),
         rt('C', 'prm', 11.2, 'outer', 2, 'double', 3, None, 245000, 760000)],
  amenities=STAY_AM, highlights=['flagship', 'near_station', 'long_stay'],
  desc=T('monthliv의 첫 직영 지점입니다. 성수역에서 걸어서 4분, 서울숲과 성수 카페 거리가 가까워 출퇴근과 일상이 모두 편한 월 단위 개인실입니다.',
         "monthliv's first directly run branch. Four minutes' walk from Seongsu Station, close to Seoul Forest and the Seongsu café streets: private rooms by the month for easy commutes and everyday life.",
         'monthlivの最初の直営店舗です。聖水駅から徒歩4分、ソウルの森や聖水のカフェ通りにも近く、通勤にも日常生活にも便利な月単位の個室です。',
         'monthliv首家直营门店。距圣水站步行4分钟，靠近首尔林和圣水咖啡街，通勤与日常生活都很方便的月租单人间。',
         'monthliv首家直營門市。距聖水站步行4分鐘，鄰近首爾林與聖水咖啡街，通勤與日常生活都很方便的月租單人房。',
         'Chi nhánh trực tiếp vận hành đầu tiên của monthliv. Cách ga Seongsu 4 phút đi bộ, gần Rừng Seoul và phố cà phê Seongsu: phòng riêng thuê theo tháng, thuận tiện đi làm và sinh hoạt.'))

branch(id='doksan', no=None, type='stay', status='open', openDate='2025-01-20',
  name=T('가산디지털·독산', 'Gasan Digital · Doksan', '加山デジタル・禿山', '加山数码·秃山', '加山數位·禿山', 'Gasan Digital · Doksan'),
  area=T('금천구 독산동', 'Doksan-dong, Geumcheon-gu', '衿川区 禿山洞', '衿川区 秃山洞', '衿川區 禿山洞', 'Doksan-dong, quận Geumcheon'),
  gu='금천구', station=T('독산역', 'Doksan Stn.', '禿山駅', '秃山站', '禿山站', 'Ga Doksan'), lines=['1'], walk=5,
  lat=37.4668, lng=126.8902, feeRate=0.15, deposit=100000, floors=[3, 4], art=1,
  types=[rt('A', 'std', 7.9, 'inner', 1, 'single', 14, None, 170000, 520000),
         rt('B', 'win', 8.8, 'outer', 1, 'single', 12, None, 185000, 570000)],
  amenities=STAY_AM, highlights=['business', 'near_station', 'long_stay'],
  desc=T('가산디지털단지 G밸리로 출퇴근하는 직장인을 위한 지점입니다. 독산역 5분 거리이며 가산디지털단지역까지도 걸어서 이동할 수 있습니다.',
         'Built for people working in the G-Valley business district. Five minutes from Doksan Station, with Gasan Digital Complex Station within walking distance.',
         '加山デジタル団地（Gバレー）へ通勤する方のための店舗です。禿山駅から徒歩5分、加山デジタル団地駅まで歩いて移動できます。',
         '为在加山数码园区（G-Valley）上班的人士打造的门店。距秃山站5分钟，步行即可到达加山数码园区站。',
         '為在加山數位園區（G-Valley）上班的人士打造的門市。距禿山站5分鐘，步行即可抵達加山數位園區站。',
         'Dành cho người làm việc tại khu G-Valley. Cách ga Doksan 5 phút, có thể đi bộ tới ga Gasan Digital Complex.'))

branch(id='cheongnyangni', no=None, type='stay', status='open', openDate='2026-07-23',
  name=T('청량리', 'Cheongnyangni', '清凉里', '清凉里', '清涼里', 'Cheongnyangni'),
  area=T('동대문구 청량리동', 'Cheongnyangni-dong, Dongdaemun-gu', '東大門区 清凉里洞', '东大门区 清凉里洞', '東大門區 清涼里洞', 'Cheongnyangni-dong, quận Dongdaemun'),
  gu='동대문구', station=T('청량리역', 'Cheongnyangni Stn.', '清凉里駅', '清凉里站', '清涼里站', 'Ga Cheongnyangni'), lines=['1', 'GJ', 'SB'], walk=6,
  lat=37.5826, lng=127.0465, feeRate=0.15, deposit=100000, floors=[2, 3], art=2,
  types=[rt('A', 'std', 8.0, 'inner', 1, 'single', 12, None, 180000, 560000),
         rt('B', 'win', 9.0, 'outer', 1, 'single', 10, None, 195000, 610000)],
  amenities=STAY_AM, highlights=['university', 'near_station', 'new_open'],
  desc=T('1호선·경의중앙선·수인분당선이 지나는 청량리역 인근 지점입니다. 경희대와 서울시립대가 가까워 학생과 직장인 모두에게 맞습니다.',
         'Near Cheongnyangni Station, served by Line 1, the Gyeongui–Jungang Line and the Suin–Bundang Line. Close to Kyung Hee University and the University of Seoul, it suits students and workers alike.',
         '1号線・京義中央線・水仁盆唐線が通る清凉里駅の近くです。慶熙大学やソウル市立大学に近く、学生にも社会人にも向いています。',
         '位于1号线、京义中央线、水仁盆唐线经过的清凉里站附近。靠近庆熙大学和首尔市立大学，适合学生和上班族。',
         '位於1號線、京義中央線、水仁盆唐線經過的清涼里站附近。鄰近慶熙大學與首爾市立大學，適合學生與上班族。',
         'Gần ga Cheongnyangni (tuyến 1, Gyeongui–Jungang, Suin–Bundang). Gần Đại học Kyung Hee và Đại học Seoul, phù hợp cho cả sinh viên và người đi làm.'))

branch(id='samsung', no=None, type='residence', status='open', openDate='2026-06-20',
  name=T('삼성서울병원', 'Samsung Medical Center', 'サムスンソウル病院', '三星首尔医院', '三星首爾醫院', 'Bệnh viện Samsung Seoul'),
  area=T('강남구 일원동', 'Irwon-dong, Gangnam-gu', '江南区 逸院洞', '江南区 逸院洞', '江南區 逸院洞', 'Irwon-dong, quận Gangnam'),
  gu='강남구', station=T('일원역', 'Irwon Stn.', '逸院駅', '逸院站', '逸院站', 'Ga Irwon'), lines=['3'], walk=4,
  lat=37.4858, lng=127.0838, feeRate=0.10, deposit=0, floors=[3, 4], art=3,
  types=[rt('S', 'std', 8.6, 'outer', 1, 'single', 18, 59000, 350000, 950000),
         rt('F', 'stu', 12.4, 'outer', 2, 'double', 12, 79000, 460000, 1250000)],
  amenities=RES_AM, highlights=['hospital', 'short_stay', 'family'],
  desc=T('삼성서울병원까지 걸어서 이동할 수 있는 레지던스입니다. 외래 진료와 입원 보호자를 위해 1박부터 장기까지 머물 수 있고, 패밀리 스튜디오에는 간이 주방이 있습니다.',
         'A residence within walking distance of Samsung Medical Center. Stay from one night to several months for outpatient visits or while caring for a family member; family studios include a kitchenette.',
         'サムスンソウル病院まで歩いて行けるレジデンスです。外来受診や入院中のご家族の付き添いに、1泊から長期まで滞在できます。ファミリースタジオには簡易キッチン付き。',
         '步行即可到达三星首尔医院的公寓式住宿。门诊就医或陪护住院家属，可从1晚住到长期；家庭开间配有简易厨房。',
         '步行即可抵達三星首爾醫院的公寓式住宿。門診就醫或陪伴住院家屬，可從1晚住到長期；家庭套房附簡易廚房。',
         'Căn hộ lưu trú có thể đi bộ tới Bệnh viện Samsung Seoul. Ở từ 1 đêm đến dài hạn khi khám ngoại trú hoặc chăm sóc người thân nằm viện; studio gia đình có bếp nhỏ.'))

branch(id='mokdong', no=None, type='stay', status='open', openDate='2025-06-10',
  name=T('목동', 'Mokdong', '木洞', '木洞', '木洞', 'Mokdong'),
  area=T('양천구 목동', 'Mok-dong, Yangcheon-gu', '陽川区 木洞', '阳川区 木洞', '陽川區 木洞', 'Mok-dong, quận Yangcheon'),
  gu='양천구', station=T('목동역', 'Mokdong Stn.', '木洞駅', '木洞站', '木洞站', 'Ga Mokdong'), lines=['5'], walk=5,
  lat=37.5262, lng=126.8667, feeRate=0.15, deposit=100000, floors=[2, 3], art=4,
  types=[rt('A', 'std', 8.1, 'inner', 1, 'single', 12, None, 180000, 560000),
         rt('B', 'win', 9.3, 'outer', 1, 'single', 8, None, 195000, 610000)],
  amenities=STAY_AM, highlights=['quiet', 'near_station', 'long_stay'],
  desc=T('학원가와 주거 단지가 모인 목동의 조용한 월 단위 개인실입니다. 5호선 목동역에서 5분 거리입니다.',
         'Quiet private rooms by the month in Mokdong, a neighbourhood of academies and residential blocks. Five minutes from Mokdong Station on Line 5.',
         '学習塾街と住宅団地が集まる木洞の、静かな月単位の個室です。5号線木洞駅から徒歩5分。',
         '位于补习班街区与住宅区聚集的木洞，安静的月租单人间。距5号线木洞站5分钟。',
         '位於補習班街區與住宅區聚集的木洞，安靜的月租單人房。距5號線木洞站5分鐘。',
         'Phòng riêng thuê theo tháng yên tĩnh ở Mokdong, khu dân cư và trung tâm học thêm. Cách ga Mokdong (tuyến 5) 5 phút.'))

branch(id='geondae', no=None, type='hostel', status='open', openDate='2026-08-20',
  name=T('건대', 'Konkuk Univ.', '建大', '建大', '建大', 'Konkuk'),
  area=T('광진구 화양동', 'Hwayang-dong, Gwangjin-gu', '広津区 華陽洞', '广津区 华阳洞', '廣津區 華陽洞', 'Hwayang-dong, quận Gwangjin'),
  gu='광진구', station=T('건대입구역', 'Konkuk Univ. Stn.', '建大入口駅', '建大入口站', '建大入口站', 'Ga Konkuk Univ.'), lines=['2', '7'], walk=3,
  lat=37.5428, lng=127.0688, feeRate=0.15, deposit=0, floors=[2], art=5, checkin='15:00', checkout='11:00',
  types=[rt('S', 'sgl', 7.6, 'outer', 1, 'single', 14, 45000, 270000, 890000),
         rt('D', 'dbl', 10.2, 'outer', 2, 'double', 10, 65000, 390000, 1190000),
         rt('F', 'fam', 14.8, 'outer', 4, 'bunk', 2, 99000, 590000, None)],
  amenities=HOSTEL_AM, highlights=['foreigner', 'near_station', 'short_stay'],
  desc=T('2·7호선 건대입구역 3분 거리의 호스텔입니다. 성수와 잠실이 가까워 여행과 출장 모두 편하고, 1박부터 한 달까지 머물 수 있습니다.',
         'A hostel three minutes from Konkuk Univ. Station on Lines 2 and 7. Seongsu and Jamsil are close by, easy for trips and business stays, from one night to a month.',
         '2・7号線 建大入口駅から徒歩3分のホステルです。聖水や蚕室にも近く、旅行にも出張にも便利。1泊から1か月まで滞在できます。',
         '距2号线、7号线建大入口站3分钟的青年旅舍。靠近圣水和蚕室，旅行出差都方便，可住1晚至1个月。',
         '距2號線、7號線建大入口站3分鐘的青年旅館。鄰近聖水與蠶室，旅遊出差都方便，可住1晚至1個月。',
         'Hostel cách ga Konkuk Univ. (tuyến 2, 7) 3 phút. Gần Seongsu và Jamsil, tiện cho du lịch lẫn công tác, ở từ 1 đêm đến 1 tháng.'))

branch(id='guro', no=None, type='stay', status='open', openDate='2026-08-25',
  name=T('구로', 'Guro', '九老', '九老', '九老', 'Guro'),
  area=T('구로구 구로동', 'Guro-dong, Guro-gu', '九老区 九老洞', '九老区 九老洞', '九老區 九老洞', 'Guro-dong, quận Guro'),
  gu='구로구', station=T('구로디지털단지역', 'Guro Digital Complex Stn.', '九老デジタル団地駅', '九老数码园区站', '九老數位園區站', 'Ga Guro Digital Complex'), lines=['2'], walk=7,
  lat=37.4868, lng=126.8962, feeRate=0.10, deposit=100000, floors=[3], art=6,
  types=[rt('A', 'std', 8.0, 'inner', 1, 'single', 14, None, 175000, 540000),
         rt('B', 'win', 9.0, 'outer', 1, 'single', 10, None, 190000, 590000)],
  amenities=STAY_AM, highlights=['business', 'new_open', 'near_station'],
  desc=T('구로디지털단지 IT 밸리로 출퇴근하기 좋은 신규 지점입니다. 2호선으로 강남과 신림까지 환승 없이 이동할 수 있습니다.',
         'A new branch for commuters to the Guro Digital Complex tech hub. Line 2 takes you to Gangnam and Sillim without changing trains.',
         '九老デジタル団地のITバレーへの通勤に便利な新店舗です。2号線で江南・新林まで乗り換えなしで移動できます。',
         '方便前往九老数码园区IT园区通勤的新门店。乘2号线无需换乘即可到达江南和新林。',
         '方便前往九老數位園區IT園區通勤的新門市。搭2號線免轉乘即可抵達江南與新林。',
         'Chi nhánh mới thuận tiện đi làm tại khu công nghệ Guro Digital Complex. Tuyến 2 đi thẳng tới Gangnam và Sillim không cần đổi tàu.'))

branch(id='wangsimni', no=None, type='hostel', status='open', openDate='2026-08-28',
  name=T('왕십리', 'Wangsimni', '往十里', '往十里', '往十里', 'Wangsimni'),
  area=T('성동구 하왕십리동', 'Hawangsimni-dong, Seongdong-gu', '城東区 下往十里洞', '城东区 下往十里洞', '城東區 下往十里洞', 'Hawangsimni-dong, quận Seongdong'),
  gu='성동구', station=T('상왕십리역', 'Sangwangsimni Stn.', '上往十里駅', '上往十里站', '上往十里站', 'Ga Sangwangsimni'), lines=['2'], walk=4,
  lat=37.5638, lng=127.0306, feeRate=0.15, deposit=0, floors=[5], art=7, checkin='15:00', checkout='11:00',
  types=[rt('S', 'sgl', 7.4, 'outer', 1, 'single', 12, 43000, 260000, 860000),
         rt('D', 'dbl', 10.0, 'outer', 2, 'double', 10, 62000, 370000, 1150000)],
  amenities=HOSTEL_AM, highlights=['foreigner', 'near_station', 'new_open'],
  desc=T('교통 중심지 왕십리에 문을 연 호스텔입니다. 동대문·성수·을지로가 가까워 서울 동쪽 여행의 출발점으로 좋습니다.',
         "A hostel in Wangsimni, one of Seoul's busiest transport hubs. Dongdaemun, Seongsu and Euljiro are close, a good base for exploring the east of the city.",
         '交通の要所・往十里にオープンしたホステルです。東大門・聖水・乙支路に近く、ソウル東部観光の拠点に最適です。',
         '开在交通枢纽往十里的青年旅舍。靠近东大门、圣水和乙支路，是游览首尔东部的理想据点。',
         '開在交通樞紐往十里的青年旅館。鄰近東大門、聖水與乙支路，是遊覽首爾東部的理想據點。',
         'Hostel tại Wangsimni, đầu mối giao thông lớn của Seoul. Gần Dongdaemun, Seongsu và Euljiro, điểm xuất phát lý tưởng để khám phá phía đông thành phố.'))

branch(id='sinchon', no=None, type='hostel', status='open', openDate='2026-09-26',
  name=T('신촌', 'Sinchon', '新村', '新村', '新村', 'Sinchon'),
  area=T('마포구 노고산동', 'Nogosan-dong, Mapo-gu', '麻浦区 老姑山洞', '麻浦区 老姑山洞', '麻浦區 老姑山洞', 'Nogosan-dong, quận Mapo'),
  gu='마포구', station=T('신촌역', 'Sinchon Stn.', '新村駅', '新村站', '新村站', 'Ga Sinchon'), lines=['2'], walk=2,
  lat=37.5547, lng=126.9384, feeRate=0.15, deposit=0, floors=[4, 8, 9], art=8, checkin='15:00', checkout='11:00',
  types=[rt('S', 'sgl', 7.5, 'outer', 1, 'single', 16, 46000, 280000, 920000),
         rt('D', 'dbl', 10.4, 'outer', 2, 'double', 12, 66000, 395000, 1220000),
         rt('F', 'fam', 15.0, 'outer', 4, 'bunk', 4, 108000, 640000, None)],
  amenities=HOSTEL_AM, highlights=['university', 'foreigner', 'near_station'],
  desc=T('연세대·서강대·이화여대가 모인 신촌 한가운데 있는 호스텔입니다. 신촌역 2분, 홍대까지 한 정거장이라 어학연수생과 여행자에게 잘 맞습니다.',
         'A hostel in the heart of Sinchon, home to Yonsei, Sogang and Ewha universities. Two minutes from Sinchon Station and one stop from Hongdae, ideal for language students and travellers.',
         '延世大・西江大・梨花女子大が集まる新村の中心にあるホステルです。新村駅から徒歩2分、弘大まで1駅で、語学留学生や旅行者にぴったりです。',
         '位于延世大学、西江大学、梨花女子大学聚集的新村中心的青年旅舍。距新村站2分钟，到弘大仅一站，适合语言研修生和旅行者。',
         '位於延世大學、西江大學、梨花女子大學聚集的新村中心的青年旅館。距新村站2分鐘，到弘大僅一站，適合語言研修生與旅客。',
         'Hostel ngay trung tâm Sinchon, nơi tập trung các trường Yonsei, Sogang và Ewha. Cách ga Sinchon 2 phút, một ga tới Hongdae, lý tưởng cho du học sinh tiếng và khách du lịch.'))

branch(id='cheonho-stay', no=None, type='stay', status='open', openDate='2026-09-15',
  name=T('천호', 'Cheonho', '千戸', '千户', '千戶', 'Cheonho'),
  area=T('강동구 천호동', 'Cheonho-dong, Gangdong-gu', '江東区 千戸洞', '江东区 千户洞', '江東區 千戶洞', 'Cheonho-dong, quận Gangdong'),
  gu='강동구', station=T('천호역', 'Cheonho Stn.', '千戸駅', '千户站', '千戶站', 'Ga Cheonho'), lines=['5', '8'], walk=3,
  lat=37.5393, lng=127.1252, feeRate=0.10, deposit=100000, floors=[2, 3, 4], art=9,
  types=[rt('A', 'std', 8.2, 'inner', 1, 'single', 12, None, 180000, 560000),
         rt('B', 'win', 9.2, 'outer', 1, 'single', 9, None, 195000, 610000)],
  amenities=STAY_AM, highlights=['near_station', 'new_open', 'long_stay'],
  desc=T('5·8호선 천호역 3분 거리의 월 단위 개인실입니다. 잠실과 하남 미사가 가깝고 생활 상권이 바로 앞에 있습니다.',
         'Private rooms by the month, three minutes from Cheonho Station on Lines 5 and 8. Jamsil and Hanam Misa are nearby, with shops and services right outside.',
         '5・8号線 千戸駅から徒歩3分の月単位の個室です。蚕室や河南ミサに近く、目の前に生活商圏があります。',
         '距5号线、8号线千户站3分钟的月租单人间。靠近蚕室和河南渼沙，生活商圈就在门前。',
         '距5號線、8號線千戶站3分鐘的月租單人房。鄰近蠶室與河南渼沙，生活商圈就在門口。',
         'Phòng riêng thuê theo tháng, cách ga Cheonho (tuyến 5, 8) 3 phút. Gần Jamsil và Hanam Misa, cửa hàng và dịch vụ ngay trước cửa.'))

branch(id='cheonho-hostel', no=None, type='hostel', status='soon', openDate='2026-10-20',
  name=T('천호', 'Cheonho', '千戸', '千户', '千戶', 'Cheonho'),
  area=T('강동구 천호동', 'Cheonho-dong, Gangdong-gu', '江東区 千戸洞', '江东区 千户洞', '江東區 千戶洞', 'Cheonho-dong, quận Gangdong'),
  gu='강동구', station=T('천호역', 'Cheonho Stn.', '千戸駅', '千户站', '千戶站', 'Ga Cheonho'), lines=['5', '8'], walk=3,
  lat=37.5394, lng=127.1254, feeRate=0.15, deposit=0, floors=[5, 6, 7, 8, 9], art=10, checkin='15:00', checkout='11:00',
  types=[rt('S', 'sgl', 7.4, 'outer', 1, 'single', 14, 42000, 250000, 840000),
         rt('D', 'dbl', 10.0, 'outer', 2, 'double', 12, 60000, 360000, 1120000),
         rt('F', 'fam', 14.6, 'outer', 4, 'bunk', 4, 95000, 570000, None)],
  amenities=HOSTEL_AM, highlights=['new_open', 'near_station', 'foreigner'],
  desc=T('천호 스테이와 같은 건물 5~9층에 여는 호스텔입니다. 오픈 전에도 룸투어와 사전 예약을 받습니다.',
         'A hostel opening on floors 5 to 9 of the same building as Cheonho Stay. Room tours and early bookings are open before launch.',
         '千戸ステイと同じ建物の5〜9階にオープンするホステルです。オープン前からルームツアーと事前予約を受け付けています。',
         '与千户Stay同栋楼5至9层即将开业的青年旅舍。开业前即可预约看房和提前预订。',
         '與千戶Stay同棟大樓5至9樓即將開幕的青年旅館。開幕前即可預約看房與提前預訂。',
         'Hostel sắp mở tại tầng 5 đến 9 cùng tòa nhà với Cheonho Stay. Nhận đặt lịch xem phòng và đặt trước ngay từ trước khi khai trương.'))

branch(id='snu', no=None, type='stay', status='soon', openDate='2026-10-15',
  name=T('서울대벤처타운', "Seoul Nat'l Univ. Venture Town", 'ソウル大ベンチャータウン', '首尔大学创业城', '首爾大學創業城', 'Seoul National Univ. Venture Town'),
  area=T('관악구 신림동', 'Sillim-dong, Gwanak-gu', '冠岳区 新林洞', '冠岳区 新林洞', '冠岳區 新林洞', 'Sillim-dong, quận Gwanak'),
  gu='관악구', station=T('서울대벤처타운역', "Seoul Nat'l Univ. Venture Town Stn.", 'ソウル大ベンチャータウン駅', '首尔大学创业城站', '首爾大學創業城站', 'Ga Seoul National Univ. Venture Town'), lines=['SL'], walk=3,
  lat=37.4724, lng=126.9339, feeRate=0.10, deposit=100000, floors=[3, 4], art=11,
  types=[rt('A', 'std', 7.8, 'inner', 1, 'single', 16, None, 170000, 520000),
         rt('B', 'win', 8.9, 'outer', 1, 'single', 12, None, 185000, 570000)],
  amenities=STAY_AM, highlights=['university', 'new_open', 'long_stay'],
  desc=T('신림선 서울대벤처타운역 3분 거리에 여는 월 단위 개인실입니다. 서울대와 신림 생활권에 있어 학생과 수험생에게 맞습니다.',
         "Private rooms by the month opening three minutes from Seoul Nat'l Univ. Venture Town Station on the Sillim Line, close to Seoul National University, for students and exam candidates.",
         '新林線ソウル大ベンチャータウン駅から徒歩3分にオープンする月単位の個室です。ソウル大学と新林の生活圏にあり、学生や受験生に向いています。',
         '即将开业的月租单人间，距新林线首尔大学创业城站3分钟。位于首尔大学和新林生活圈，适合学生和备考人士。',
         '即將開幕的月租單人房，距新林線首爾大學創業城站3分鐘。位於首爾大學與新林生活圈，適合學生與考生。',
         'Phòng riêng thuê theo tháng sắp mở, cách ga Seoul National Univ. Venture Town (tuyến Sillim) 3 phút, gần Đại học Quốc gia Seoul, phù hợp cho sinh viên và người ôn thi.'))

branch(id='hwagok-stay', no=None, type='stay', status='soon', openDate='2026-10-25',
  name=T('화곡', 'Hwagok', '禾谷', '禾谷', '禾谷', 'Hwagok'),
  area=T('강서구 화곡동', 'Hwagok-dong, Gangseo-gu', '江西区 禾谷洞', '江西区 禾谷洞', '江西區 禾谷洞', 'Hwagok-dong, quận Gangseo'),
  gu='강서구', station=T('화곡역', 'Hwagok Stn.', '禾谷駅', '禾谷站', '禾谷站', 'Ga Hwagok'), lines=['5'], walk=6,
  lat=37.5446, lng=126.8455, feeRate=0.15, deposit=100000, floors=[3], art=12,
  types=[rt('A', 'std', 7.8, 'inner', 1, 'single', 10, None, 170000, 520000),
         rt('B', 'win', 8.7, 'outer', 1, 'single', 8, None, 182000, 560000)],
  amenities=STAY_AM, highlights=['airport', 'new_open', 'long_stay'],
  desc=T('김포공항과 마곡이 가까운 화곡역 생활권의 월 단위 개인실입니다. 같은 건물 5층에는 호스텔이 함께 엽니다.',
         'Private rooms by the month near Hwagok Station, close to Gimpo Airport and Magok. A hostel opens on the 5th floor of the same building.',
         '金浦空港や麻谷に近い禾谷駅エリアの月単位の個室です。同じ建物の5階にはホステルも同時オープンします。',
         '位于禾谷站生活圈的月租单人间，靠近金浦机场和麻谷。同栋楼5层将同时开设青年旅舍。',
         '位於禾谷站生活圈的月租單人房，鄰近金浦機場與麻谷。同棟大樓5樓將同時開設青年旅館。',
         'Phòng riêng thuê theo tháng gần ga Hwagok, gần sân bay Gimpo và Magok. Tầng 5 cùng tòa nhà sẽ mở một hostel.'))

branch(id='hwagok-hostel', no=None, type='hostel', status='soon', openDate='2026-10-25',
  name=T('화곡', 'Hwagok', '禾谷', '禾谷', '禾谷', 'Hwagok'),
  area=T('강서구 화곡동', 'Hwagok-dong, Gangseo-gu', '江西区 禾谷洞', '江西区 禾谷洞', '江西區 禾谷洞', 'Hwagok-dong, quận Gangseo'),
  gu='강서구', station=T('화곡역', 'Hwagok Stn.', '禾谷駅', '禾谷站', '禾谷站', 'Ga Hwagok'), lines=['5'], walk=6,
  lat=37.5447, lng=126.8457, feeRate=0.15, deposit=0, floors=[5], art=13, checkin='15:00', checkout='11:00',
  types=[rt('S', 'sgl', 7.2, 'outer', 1, 'single', 8, 40000, 240000, 800000),
         rt('D', 'dbl', 9.8, 'outer', 2, 'double', 6, 58000, 350000, 1080000)],
  amenities=HOSTEL_AM, highlights=['airport', 'new_open', 'short_stay'],
  desc=T('김포공항에서 지하철로 가까운 화곡의 호스텔입니다. 출국 전후 짧은 일정에도 머물기 좋습니다.',
         'A hostel in Hwagok, a short metro ride from Gimpo Airport, handy for a night or two before or after a flight.',
         '金浦空港から地下鉄ですぐの禾谷にあるホステルです。出国前後の短い滞在にも便利です。',
         '位于禾谷的青年旅舍，乘地铁很快到达金浦机场，适合出入境前后的短暂停留。',
         '位於禾谷的青年旅館，搭地鐵很快就到金浦機場，適合出入境前後的短暫停留。',
         'Hostel ở Hwagok, đi tàu điện ngầm một đoạn ngắn là tới sân bay Gimpo, tiện cho một vài đêm trước hoặc sau chuyến bay.'))

branch(id='mapo', no=31, type='stay', status='soon', openDate='2026-10-28',
  name=T('마포', 'Mapo', '麻浦', '麻浦', '麻浦', 'Mapo'),
  area=T('마포구 용강동', 'Yonggang-dong, Mapo-gu', '麻浦区 龍江洞', '麻浦区 龙江洞', '麻浦區 龍江洞', 'Yonggang-dong, quận Mapo'),
  gu='마포구', station=T('마포역', 'Mapo Stn.', '麻浦駅', '麻浦站', '麻浦站', 'Ga Mapo'), lines=['5'], walk=4,
  lat=37.5410, lng=126.9468, feeRate=0.15, deposit=100000, floors=[2, 3], art=14,
  types=[rt('A', 'std', 8.2, 'inner', 1, 'single', 12, None, 205000, 640000),
         rt('B', 'win', 9.4, 'outer', 1, 'single', 8, None, 225000, 700000)],
  amenities=STAY_AM, highlights=['business', 'near_station', 'new_open'],
  desc=T('여의도와 공덕 업무지구로 출퇴근하기 좋은 마포역 4분 거리 지점입니다. 31호점으로 10월 오픈 예정입니다.',
         'Four minutes from Mapo Station, an easy commute to the Yeouido and Gongdeok business districts. Branch No. 31, opening in October.',
         '汝矣島や孔徳のオフィス街への通勤に便利な麻浦駅徒歩4分の店舗です。31号店として10月オープン予定です。',
         '距麻浦站4分钟，通勤汝矣岛和孔德商务区十分便利。第31号店，预计10月开业。',
         '距麻浦站4分鐘，通勤汝矣島與孔德商務區十分便利。第31號店，預計10月開幕。',
         'Cách ga Mapo 4 phút, thuận tiện đi làm tại khu Yeouido và Gongdeok. Chi nhánh số 31, dự kiến khai trương tháng 10.'))

branch(id='bulgwang', no=32, type='hostel', status='soon', openDate='2026-10-30',
  name=T('불광', 'Bulgwang', '仏光', '佛光', '佛光', 'Bulgwang'),
  area=T('은평구 불광동', 'Bulgwang-dong, Eunpyeong-gu', '恩平区 仏光洞', '恩平区 佛光洞', '恩平區 佛光洞', 'Bulgwang-dong, quận Eunpyeong'),
  gu='은평구', station=T('불광역', 'Bulgwang Stn.', '仏光駅', '佛光站', '佛光站', 'Ga Bulgwang'), lines=['3', '6'], walk=3,
  lat=37.6112, lng=126.9305, feeRate=0.15, deposit=0, floors=[2, 3], art=15, checkin='15:00', checkout='11:00',
  types=[rt('S', 'sgl', 7.3, 'outer', 1, 'single', 14, 39000, 235000, 780000),
         rt('D', 'dbl', 9.9, 'outer', 2, 'double', 10, 56000, 335000, 1050000)],
  amenities=HOSTEL_AM, highlights=['nature', 'near_station', 'new_open'],
  desc=T('3·6호선 불광역 3분, 북한산 둘레길이 가까운 호스텔입니다. 32호점으로 10월 오픈 예정입니다.',
         'A hostel three minutes from Bulgwang Station on Lines 3 and 6, close to the Bukhansan trails. Branch No. 32, opening in October.',
         '3・6号線 仏光駅から徒歩3分、北漢山の散策路にも近いホステルです。32号店として10月オープン予定です。',
         '距3号线、6号线佛光站3分钟，靠近北汉山步道的青年旅舍。第32号店，预计10月开业。',
         '距3號線、6號線佛光站3分鐘，鄰近北漢山步道的青年旅館。第32號店，預計10月開幕。',
         'Hostel cách ga Bulgwang (tuyến 3, 6) 3 phút, gần đường mòn núi Bukhansan. Chi nhánh số 32, dự kiến khai trương tháng 10.'))

branch(id='sinchon-myeongmul', no=None, type='stay', status='prep', openDate='',
  name=T('신촌 명물길', 'Sinchon Myeongmul-gil', '新村名物通り', '新村名物街', '新村名物街', 'Sinchon Myeongmul-gil'),
  area=T('서대문구 창천동', 'Changcheon-dong, Seodaemun-gu', '西大門区 滄川洞', '西大门区 沧川洞', '西大門區 滄川洞', 'Changcheon-dong, quận Seodaemun'),
  gu='서대문구', station=T('신촌역', 'Sinchon Stn.', '新村駅', '新村站', '新村站', 'Ga Sinchon'), lines=['2'], walk=3,
  lat=37.5571, lng=126.9361, feeRate=0.15, deposit=100000, floors=[4], art=16,
  types=[rt('A', 'std', 7.9, 'inner', 1, 'single', 12, None, 198000, 610000),
         rt('B', 'win', 9.0, 'outer', 1, 'single', 7, None, 214000, 660000)],
  amenities=STAY_AM, highlights=['university', 'near_station'],
  desc=T('신촌 명물길 건물 4층에 준비 중인 월 단위 개인실입니다.',
         "Private rooms by the month in preparation on the 4th floor of a building on Sinchon's Myeongmul-gil.",
         '新村名物通りの建物4階に準備中の月単位の個室です。', '位于新村名物街大楼4层、正在筹备中的月租单人间。',
         '位於新村名物街大樓4樓、正在籌備中的月租單人房。', 'Phòng riêng thuê theo tháng đang chuẩn bị tại tầng 4 một tòa nhà trên phố Myeongmul, Sinchon.'))

branch(id='yeoksam-hotel', no=None, type='hotel', status='prep', openDate='',
  name=T('역삼', 'Yeoksam', '駅三', '驿三', '驛三', 'Yeoksam'),
  area=T('강남구 역삼동', 'Yeoksam-dong, Gangnam-gu', '江南区 駅三洞', '江南区 驿三洞', '江南區 驛三洞', 'Yeoksam-dong, quận Gangnam'),
  gu='강남구', station=T('선릉역', 'Seolleung Stn.', '宣陵駅', '宣陵站', '宣陵站', 'Ga Seolleung'), lines=['2', 'SB'], walk=5,
  lat=37.5036, lng=127.0462, feeRate=0.15, deposit=0, floors=[2, 3, 4, 5, 6, 7, 8], art=17, checkin='15:00', checkout='11:00',
  types=[rt('F', 'fam', 22.0, 'outer', 4, 'queen', 14, 169000, 1010000, None),
         rt('D', 'dlx', 16.5, 'outer', 2, 'queen', 7, 139000, 830000, None)],
  amenities=HOTEL_AM, highlights=['family', 'business', 'near_station'],
  desc=T('선릉역 인근 지상 2~8층 규모로 준비 중인 가족 단위 호텔스테이입니다.',
         'A family-friendly hotel stay in preparation near Seolleung Station, on floors 2 to 8.',
         '宣陵駅近くで地上2〜8階規模で準備中のファミリー向けホテルステイです。', '位于宣陵站附近、地上2至8层、正在筹备中的家庭式酒店。',
         '位於宣陵站附近、地上2至8樓、正在籌備中的家庭式飯店。', 'Khách sạn dành cho gia đình đang chuẩn bị gần ga Seolleung, quy mô từ tầng 2 đến tầng 8.'))

# ---------- owners ----------
OWNER_NAMES = {
 'seongsu': ('o-direct', '본사 직영팀'), 'doksan': ('o-doksan', '가산디지털·독산 점주'),
 'cheongnyangni': ('o-cheongnyangni', '청량리 점주'), 'samsung': ('o-samsung', '삼성서울병원 레지던스 점주'),
 'mokdong': ('o-mokdong', '목동 점주'), 'geondae': ('o-geondae', '건대 호스텔 점주'),
 'guro': ('o-guro', '구로 스테이 점주'), 'wangsimni': ('o-wangsimni', '왕십리 호스텔 점주'),
 'sinchon': ('o-sinchon', '신촌 호스텔 점주'), 'cheonho-stay': ('o-cheonho', '천호 스테이 점주'),
 'cheonho-hostel': ('o-cheonho-h', '천호 호스텔 점주'), 'snu': ('o-snu', '서울대벤처타운 점주'),
 'hwagok-stay': ('o-hwagok', '화곡 점주'), 'hwagok-hostel': ('o-hwagok', '화곡 점주'),
 'mapo': ('o-mapo', '마포 스테이 점주'), 'bulgwang': ('o-bulgwang', '불광 호스텔 점주'),
}
owners = {}
for b in B:
    if b['id'] in OWNER_NAMES:
        oid, oname = OWNER_NAMES[b['id']]
        b['ownerId'] = oid
        owners.setdefault(oid, {'id': oid, 'name': oname, 'branchIds': []})['branchIds'].append(b['id'])
    else:
        b['ownerId'] = None

# ---------- members ----------
members = {}
def member(id, name, country, lang, joined, phone):
    members[id] = {'id': id, 'name': name, 'country': country, 'lang': lang, 'joinedAt': joined + 'T10:00:00',
                   'phone': phone, 'email': id.replace('_', '.') + '@example.com', 'marketing': True}
member('minji92', '김민지', 'KR', 'ko', '2026-07-10', '010-••••-2841')
member('jihun.park', '박지훈', 'KR', 'ko', '2026-07-22', '010-••••-7710')
member('leo.martin', 'Léo Martin', 'FR', 'en', '2026-08-28', '+33 6 •• •• 41 09')
member('yuki_t', '高橋 由紀', 'JP', 'ja', '2026-09-12', '+81 90-••••-3318')
member('an.nguyen', 'Nguyễn Thị An', 'VN', 'vi', '2026-08-20', '010-••••-5521')
member('wei.chen', '陈伟', 'CN', 'zh-CN', '2026-08-25', '+86 138 •••• 6620')
member('sophie.b', 'Sophie Becker', 'DE', 'en', '2026-09-01', '+49 151 ••• 2207')

# ---------- coupons ----------
rng = random.Random(20261004)
ALPH = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
def code4():
    return ''.join(rng.choice(ALPH) for _ in range(4))

def coupon(**k):
    base = {'kind': 'code', 'code': None, 'codes': None, 'dtype': 'amount', 'value': 0, 'max': None,
            'minAmount': 0, 'minNights': 0, 'scope': 'all', 'branchIds': [], 'types': [],
            'perUser': 1, 'limit': None, 'funder': 'HQ', 'issuer': 'admin', 'issuerBranch': None,
            'status': 'active'}
    base.update(k)
    return base

coupons = {}
coupons['cp-welcome'] = coupon(id='cp-welcome', name={'ko': '첫 예약 10% 할인', 'en': '10% off your first booking'},
    kind='code', code='WELCOME10', dtype='percent', value=10, max=100000, minAmount=300000,
    **{'from': '2026-08-01', 'to': '2026-12-31'}, createdAt='2026-07-30T09:00:00')
coupons['cp-autumn'] = coupon(id='cp-autumn', name={'ko': '가을 장기 투숙 5만원', 'en': '₩50,000 off long autumn stays'},
    kind='code', code='AUTUMN50K', dtype='amount', value=50000, minNights=28, types=['stay'],
    **{'from': '2026-10-01', 'to': '2026-11-30'}, createdAt='2026-09-25T09:00:00')
coupons['cp-geondae-open'] = coupon(id='cp-geondae-open', name={'ko': '건대 호스텔 오픈 기념 15%', 'en': 'Konkuk hostel opening 15% off'},
    kind='direct', dtype='percent', value=15, max=50000, scope='branches', branchIds=['geondae'],
    funder='BRANCH', issuer='pms', issuerBranch='geondae', **{'from': '2026-08-20', 'to': '2026-11-15'}, createdAt='2026-08-19T11:00:00')
coupons['cp-care20'] = coupon(id='cp-care20', name={'ko': '보호자 1주 이상 2만원', 'en': '₩20,000 off caregiver stays of a week+'},
    kind='code', code='CARE20', dtype='amount', value=20000, minNights=7, scope='branches', branchIds=['samsung'],
    perUser=2, funder='BRANCH', **{'from': '2026-06-20', 'to': '2026-12-31'}, createdAt='2026-06-18T09:00:00')
campus_codes = {}
for _ in range(24):
    c = f'MLV-{code4()}-{code4()}'
    campus_codes[c] = {'u': None, 's': 'new'}
coupons['cp-campus'] = coupon(id='cp-campus', name={'ko': '대학 제휴 3만원', 'en': '₩30,000 campus partner coupon'},
    kind='unique', codes=campus_codes, dtype='amount', value=30000, minAmount=200000,
    **{'from': '2026-09-01', 'to': '2026-12-31'}, createdAt='2026-08-29T15:00:00')
coupons['cp-vip'] = coupon(id='cp-vip', name={'ko': '재계약 감사 10만원', 'en': '₩100,000 thank-you for renewing'},
    kind='direct', dtype='amount', value=100000, minNights=84, types=['stay', 'residence'],
    **{'from': '2026-09-01', 'to': '2026-12-31'}, createdAt='2026-09-27T10:00:00')
coupons['cp-summer'] = coupon(id='cp-summer', name={'ko': '여름 시즌 7% 할인', 'en': '7% off summer season'},
    kind='direct', dtype='percent', value=7, max=70000, status='ended',
    **{'from': '2026-07-01', 'to': '2026-08-31'}, createdAt='2026-06-28T10:00:00')

camp_list = list(campus_codes.keys())

# ---------- rooms ----------
def ymd(d):
    return d.isoformat()

rooms = {}
for b in B:
    r = random.Random(b['id'])
    total = sum(t['count'] for t in b['types'])
    b['rooms'] = total
    floors = b['floors']
    per = [total // len(floors) + (1 if i < total % len(floors) else 0) for i in range(len(floors))]
    nums = []
    for f, n in zip(floors, per):
        nums += [f'{f}{i:02d}' for i in range(1, n + 1)]
    # spread types across floors: interleave by type proportion
    seq = []
    for t in b['types']:
        seq += [t['id']] * t['count']
    # deterministic shuffle keeping a pleasant mix
    r.shuffle(seq)
    lst = []
    for no, t in zip(nums, seq):
        lst.append({'no': no, 't': t, 'flag': None, 'occ': None})
    rooms[b['id']] = {'branchId': b['id'], 'list': lst}

# ---------- bookings ----------
bookings = {}
wallet = {}
logs = {b['id']: [] for b in B}

def find_branch(bid):
    return next(x for x in B if x['id'] == bid)

def add_months(d, n):
    y, m = d.year, d.month + n
    y += (m - 1) // 12; m = (m - 1) % 12 + 1
    import calendar
    last = calendar.monthrange(y, m)[1]
    return dt.date(y, m, min(d.day, last))

def stay_end(ci, unit, qty):
    if unit == 'night':
        return ci + dt.timedelta(days=qty)
    if unit == 'week':
        return ci + dt.timedelta(days=7 * qty)
    return add_months(ci, qty)

UNIT_KO = {'night': '박', 'week': '주', 'month': '개월'}
bk_seq = [0]
def booking(uid, bid, tid, unit, qty, ci, status, paid, wallet_id=None, pay='card', guests=1, note=''):
    b = find_branch(bid)
    t = next(x for x in b['types'] if x['id'] == tid)
    ci_d = dt.date.fromisoformat(ci)
    co_d = stay_end(ci_d, unit, qty)
    unit_price = t['price'][unit]
    base = unit_price * qty
    disc = 0; cp = None
    if wallet_id:
        w = wallet[wallet_id]; c = coupons[w['couponId']]
        if c['dtype'] == 'amount':
            disc = min(c['value'], base)
        else:
            disc = (base * c['value'] // 100) // 100 * 100
            if c['max']:
                disc = min(disc, c['max'])
        cp = {'walletId': wallet_id, 'couponId': c['id'], 'name': c['name'], 'discount': disc, 'funder': c['funder'], 'code': w.get('code')}
    deposit = b['deposit'] if unit == 'month' else 0
    bk_seq[0] += 1
    pd = dt.datetime.fromisoformat(paid)
    code = 'ML' + pd.strftime('%y%m%d') + '-' + code4()
    bid_ = 'bk-' + code[2:].replace('-', '').lower()
    m = members[uid]
    bookings[bid_] = {
        'id': bid_, 'code': code, 'userId': uid, 'branchId': bid, 'typeId': tid, 'roomNo': None,
        'unit': unit, 'qty': qty, 'checkIn': ci, 'checkOut': ymd(co_d), 'nights': (co_d - ci_d).days, 'guests': guests,
        'price': {'unit': unit_price, 'base': base, 'discount': disc, 'deposit': deposit, 'total': base - disc + deposit},
        'coupon': cp, 'guest': {'name': m['name'], 'phone': m['phone'], 'email': m['email'], 'country': m['country'], 'note': note},
        'pay': {'method': pay, 'paidAt': paid}, 'status': status, 'createdAt': paid, 'lang': m['lang'], 'source': 'web', 'ext': [],
    }
    if wallet_id:
        wallet[wallet_id].update({'status': 'used', 'usedAt': paid, 'bookingId': bid_})
    return bid_

def wal(wid, cid, uid, via, issued, by, code=None, status='active'):
    wallet[wid] = {'id': wid, 'couponId': cid, 'userId': uid, 'via': via, 'code': code, 'issuedAt': issued,
                   'by': by, 'status': status, 'usedAt': None, 'bookingId': None}

wal('w-minji-welcome', 'cp-welcome', 'minji92', 'code', '2026-08-24T20:10:00', 'self', 'WELCOME10')
wal('w-minji-vip', 'cp-vip', 'minji92', 'direct', '2026-09-28T10:30:00', 'admin')
wal('w-minji-summer', 'cp-summer', 'minji92', 'direct', '2026-07-15T09:00:00', 'admin')
wal('w-leo-geondae', 'cp-geondae-open', 'leo.martin', 'direct', '2026-09-25T14:00:00', 'pms:geondae')
wal('w-yuki-geondae', 'cp-geondae-open', 'yuki_t', 'direct', '2026-09-25T14:00:00', 'pms:geondae')
wal('w-yuki-campus', 'cp-campus', 'yuki_t', 'unique', '2026-09-20T18:20:00', 'self', camp_list[0])
wal('w-an-autumn', 'cp-autumn', 'an.nguyen', 'code', '2026-10-02T21:05:00', 'self', 'AUTUMN50K')
wal('w-sophie-campus', 'cp-campus', 'sophie.b', 'unique', '2026-09-08T08:40:00', 'self', camp_list[1])
wal('w-wei-campus', 'cp-campus', 'wei.chen', 'unique', '2026-10-03T12:00:00', 'self', camp_list[2])
wal('w-minji-care', 'cp-care20', 'minji92', 'code', '2026-10-03T09:15:00', 'self', 'CARE20')
wal('w-jihun-welcome', 'cp-welcome', 'jihun.park', 'code', '2026-09-16T19:00:00', 'self', 'WELCOME10')
campus_codes[camp_list[0]] = {'u': 'yuki_t', 's': 'reg'}
campus_codes[camp_list[1]] = {'u': 'sophie.b', 's': 'used'}
campus_codes[camp_list[2]] = {'u': 'wei.chen', 's': 'used'}

S = []  # (booking id) for room assignment
S.append(booking('minji92', 'seongsu', 'B', 'month', 3, '2026-09-01', 'staying', '2026-08-24T20:12:00', 'w-minji-welcome'))
S.append(booking('yuki_t', 'geondae', 'S', 'night', 6, '2026-10-02', 'staying', '2026-09-27T22:41:00', 'w-yuki-geondae', pay='intl'))
S.append(booking('leo.martin', 'sinchon', 'D', 'week', 2, '2026-10-10', 'confirmed', '2026-09-30T08:05:00', pay='intl', guests=2))
S.append(booking('an.nguyen', 'samsung', 'S', 'week', 1, '2026-10-06', 'confirmed', '2026-10-02T13:30:00', pay='easy', note='외래 진료 동행'))
S.append(booking('wei.chen', 'wangsimni', 'S', 'month', 1, '2026-09-05', 'staying', '2026-09-01T11:20:00', pay='intl'))
S.append(booking('sophie.b', 'geondae', 'D', 'night', 4, '2026-09-12', 'done', '2026-09-08T08:41:00', 'w-sophie-campus', pay='intl', guests=2))
S.append(booking('jihun.park', 'doksan', 'A', 'month', 3, '2026-08-01', 'staying', '2026-07-29T19:02:00'))
S.append(booking('minji92', 'cheongnyangni', 'A', 'month', 1, '2026-07-25', 'done', '2026-07-20T10:00:00'))
S.append(booking('leo.martin', 'wangsimni', 'D', 'night', 3, '2026-09-02', 'done', '2026-08-30T16:44:00', pay='intl', guests=2))
S.append(booking('yuki_t', 'samsung', 'F', 'night', 2, '2026-09-18', 'done', '2026-09-15T09:12:00', pay='intl', guests=2))
S.append(booking('an.nguyen', 'guro', 'B', 'month', 2, '2026-09-01', 'staying', '2026-08-26T18:00:00', pay='transfer'))
S.append(booking('wei.chen', 'sinchon', 'S', 'week', 4, '2026-10-01', 'staying', '2026-09-28T10:30:00', pay='intl'))
S.append(booking('sophie.b', 'sinchon', 'F', 'night', 3, '2026-10-16', 'confirmed', '2026-10-03T07:55:00', pay='intl', guests=3))
S.append(booking('jihun.park', 'cheonho-stay', 'B', 'month', 1, '2026-09-20', 'staying', '2026-09-16T19:05:00'))
S.append(booking('minji92', 'mapo', 'A', 'month', 2, '2026-11-01', 'confirmed', '2026-10-01T21:40:00', pay='easy'))
S.append(booking('leo.martin', 'bulgwang', 'S', 'night', 5, '2026-11-03', 'confirmed', '2026-10-02T09:15:00', pay='intl'))
x = booking('an.nguyen', 'geondae', 'S', 'night', 2, '2026-10-09', 'cancelled', '2026-09-29T15:00:00', pay='easy')
bookings[x]['cancelledAt'] = '2026-10-01T10:22:00'
S.append(x)
S.append(booking('sophie.b', 'mokdong', 'A', 'week', 2, '2026-09-07', 'done', '2026-09-03T12:00:00', pay='intl'))
S.append(booking('wei.chen', 'cheongnyangni', 'B', 'month', 1, '2026-10-08', 'confirmed', '2026-10-03T12:02:00', 'w-wei-campus', pay='intl'))
S.append(booking('yuki_t', 'seongsu', 'A', 'week', 1, '2026-09-14', 'done', '2026-09-10T20:00:00', pay='intl'))
S.append(booking('minji92', 'samsung', 'F', 'week', 1, '2026-10-12', 'confirmed', '2026-10-03T09:16:00', 'w-minji-care', pay='card', guests=2, note='입원 보호자'))
S.append(booking('an.nguyen', 'wangsimni', 'D', 'week', 1, '2026-09-21', 'done', '2026-09-19T17:30:00', pay='easy', guests=2))
S.append(booking('jihun.park', 'mokdong', 'B', 'month', 1, '2026-10-01', 'staying', '2026-09-27T18:10:00'))

# extension example on minji's seongsu booking already 3 months; add one ext record on jihun doksan
bk_doksan = [k for k, v in bookings.items() if v['branchId'] == 'doksan'][0]
bookings[bk_doksan]['ext'] = [{'months': 1, 'at': '2026-10-02T09:00:00', 'amount': 520000, 'from': bookings[bk_doksan]['checkOut']}]
bookings[bk_doksan]['checkOut'] = '2026-12-01'
bookings[bk_doksan]['nights'] = (dt.date(2026, 12, 1) - dt.date(2026, 8, 1)).days

# assign rooms: staying + confirmed bookings get a room of their type
for bk in bookings.values():
    if bk['status'] not in ('staying', 'confirmed'):
        continue
    lst = rooms[bk['branchId']]['list']
    taken = {x['roomNo'] for x in bookings.values() if x['branchId'] == bk['branchId'] and x['roomNo']}
    for rm in lst:
        if rm['t'] == bk['typeId'] and rm['no'] not in taken:
            bk['roomNo'] = rm['no']
            break

# legacy occupants (residents who moved in before the platform)
for b in B:
    lst = rooms[b['id']]['list']
    if b['status'] != 'open':
        continue
    r = random.Random('occ-' + b['id'])
    linked = {x['roomNo'] for x in bookings.values() if x['branchId'] == b['id'] and x['roomNo'] and x['status'] in ('staying', 'confirmed')}
    rate = {'stay': 0.9, 'hostel': 0.74, 'residence': 0.8, 'hotel': 0.7}[b['type']]
    free = [rm for rm in lst if rm['no'] not in linked]
    target = round(len(lst) * rate) - len([1 for x in bookings.values() if x['branchId'] == b['id'] and x['status'] == 'staying'])
    r.shuffle(free)
    for rm in free[:max(0, target)]:
        if b['type'] == 'stay':
            days = r.randint(12, 150)
        elif b['type'] == 'residence':
            days = r.randint(2, 40)
        else:
            days = r.randint(1, 20)
        rm['occ'] = {'until': ymd(TODAY + dt.timedelta(days=days)), 'since': ymd(TODAY - dt.timedelta(days=r.randint(5, 200 if b['type'] == 'stay' else 20)))}
    rest = free[max(0, target):]
    if len(rest) >= 3:
        rest[0]['flag'] = 'cln'
    if len(rest) >= 5 and r.random() < 0.6:
        rest[1]['flag'] = 'mnt'

# ---------- tours ----------
tours = {}
def tour(id, bid, uid, name, phone, date, time, status, created):
    tours[id] = {'id': id, 'branchId': bid, 'userId': uid, 'name': name, 'phone': phone, 'date': date, 'time': time,
                 'status': status, 'createdAt': created, 'note': ''}
tour('tr-1', 'snu', 'an.nguyen', 'Nguyễn Thị An', '010-••••-5521', '2026-10-07', '14:00', 'requested', '2026-10-02T21:10:00')
tour('tr-2', 'mapo', 'jihun.park', '박지훈', '010-••••-7710', '2026-10-08', '11:00', 'confirmed', '2026-09-30T18:00:00')
tour('tr-3', 'geondae', None, '이서준', '010-••••-0934', '2026-10-05', '16:00', 'requested', '2026-10-03T19:44:00')
tour('tr-4', 'samsung', 'yuki_t', '高橋 由紀', '+81 90-••••-3318', '2026-10-04', '15:00', 'confirmed', '2026-10-01T08:20:00')
tour('tr-5', 'seongsu', 'wei.chen', '陈伟', '+86 138 •••• 6620', '2026-09-29', '13:00', 'done', '2026-09-26T10:00:00')
tour('tr-6', 'cheonho-hostel', 'leo.martin', 'Léo Martin', '+33 6 •• •• 41 09', '2026-10-12', '10:30', 'requested', '2026-10-03T09:30:00')

# ---------- alimtalk logs ----------
def md(s):
    d = dt.date.fromisoformat(s[:10]); return f'{d.month}/{d.day}'
for bk in sorted(bookings.values(), key=lambda x: x['createdAt']):
    b = find_branch(bk['branchId'])
    tname = next(t for t in b['types'] if t['id'] == bk['typeId'])['name']['ko']
    span = f"{md(bk['checkIn'])}~{md(bk['checkOut'])}"
    u = f"{bk['qty']}{UNIT_KO[bk['unit']]}"
    logs[b['id']].append({'at': bk['createdAt'], 'kind': 'booking',
        'text': f"신규 예약 {bk['code']} · {tname} {span} ({u}) · 결제 {bk['price']['total']:,}원" + (f" · 쿠폰 -{bk['coupon']['discount']:,}원" if bk['coupon'] else '')})
    if bk['status'] in ('staying', 'done'):
        logs[b['id']].append({'at': bk['checkIn'] + 'T15:00:00', 'kind': 'checkin', 'text': f"입실 완료 {bk['code']} · {bk['roomNo'] or ''}호".replace(' · 호', '')})
    if bk['status'] == 'done':
        logs[b['id']].append({'at': bk['checkOut'] + 'T11:00:00', 'kind': 'checkout', 'text': f"퇴실 완료 {bk['code']}"})
    if bk['status'] == 'cancelled':
        logs[b['id']].append({'at': bk['cancelledAt'], 'kind': 'cancel', 'text': f"예약 취소 {bk['code']} · 환불 {bk['price']['total']:,}원"})
    for e in bk['ext']:
        logs[b['id']].append({'at': e['at'], 'kind': 'ext', 'text': f"연장 결제 {bk['code']} · {e['months']}개월 · {e['amount']:,}원"})
for t in tours.values():
    logs[t['branchId']].append({'at': t['createdAt'], 'kind': 'tour', 'text': f"룸투어 신청 · {t['name']} · {md(t['date'])} {t['time']}"})
logs_docs = {}
for bid, items in logs.items():
    items.sort(key=lambda x: x['at'], reverse=True)
    if items:
        logs_docs[bid] = {'branchId': bid, 'items': items[:40]}

for b in B:
    b.pop('floors', None)
    b['updatedAt'] = '2026-10-03T18:00:00'
    b.setdefault('checkin', None); b.setdefault('checkout', None)

out = {
    'branches': {b['id']: b for b in B},
    'rooms': rooms,
    'bookings': bookings,
    'members': members,
    'owners': owners,
    'coupons': coupons,
    'wallet': wallet,
    'tours': tours,
    'logs': logs_docs,
}
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'demo.js')
body = json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('/* monthliv demo data - generated by tools/make_data.py, edit that file instead */\n')
    f.write("const DEMO_BASE = '" + TODAY.isoformat() + "';\n")
    f.write('const DEMO = ' + body + ';\n')
print('data/demo.js', os.path.getsize(OUT), 'bytes')
for k, v in out.items():
    print(f'  {k}: {len(v)}')
occ = sum(1 for b in B if b['status'] == 'open' for rm in rooms[b['id']]['list'] if rm['occ'])
tot = sum(b['rooms'] for b in B if b['status'] == 'open')
print('open rooms', tot, 'legacy occ', occ)
