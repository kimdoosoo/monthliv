/**
 * Sample guest, booking, conversations and saved lists for the first build.
 * They stand in for a signed-in guest until accounts and bookings come from the database.
 */
import type { Locale } from "@/i18n/routing";
import { sampleHost, sampleTrip, type Text } from "./listings";

export const sampleGuest = {
  name: { ko: "서진", en: "Seojin", ja: "ソジン", "zh-CN": "Seojin", de: "Seojin" } satisfies Text,
  /** Full name, as on the account and the booking. */
  fullName: { ko: "윤서진", en: "Seojin Yun", ja: "ユン・ソジン", "zh-CN": "尹瑞珍", de: "Seojin Yun" } satisfies Text,
  initial: { ko: "서", en: "S" } satisfies Text,
  /** Last four digits of the saved card. */
  card: "4242",
};

export type PaymentPlan = "now" | "split";

/** The booking made on the checkout page. Codes start with ML- and skip 0/O and 1/I. */
export const sampleBooking: {
  code: string;
  listingId: string;
  from: string;
  to: string;
  guests: number;
  checkIn: string;
  checkOut: string;
  doorCodeAt: string;
  bookedOn: string;
  plan: PaymentPlan;
  secondPaymentOn: string;
} = {
  code: "ML-7Q4K2M",
  listingId: "seongsu-window",
  from: sampleTrip.from,
  to: sampleTrip.to,
  guests: sampleTrip.guests,
  checkIn: "15:00",
  checkOut: "11:00",
  /** The door code and Wi-Fi details appear in the app at this time on arrival day. */
  doorCodeAt: "09:00",
  bookedOn: "2026-10-03",
  /** Paid in two halves: today and the second half part-way through the stay. */
  plan: "split",
  secondPaymentOn: "2026-11-16",
};

/** "Today" on the screens that show the stay under way (trips, messages, help): day 12 of 28. */
export const sampleToday = "2026-11-13";

/** What the stay page shows during the sample booking. Sample values, not a real door. */
export const sampleStayInfo = {
  doorCode: "4819 #",
  wifi: { name: "MONTHLIV-Seongsu-302", password: "forest-bakery-302", mbps: 500 },
  /** House guide topics, written by the host (messages: stay.guide.*). */
  guide: ["trash", "laundry", "heating", "building", "quiet", "emergency"] as const,
};

/** A request waiting for the branch (trips page): a season near Seoul National University next year. */
export const upcomingRequest = {
  title: {
    ko: "서울대 스테이 · 윈도우 룸",
    en: "SNU Stay · Window Room",
    ja: "ソウル大ステイ · ウィンドウルーム",
    "zh-CN": "首尔大月租房 · 带窗房",
    de: "SNU Stay · Fensterzimmer",
  } satisfies Text,
  area: { ko: "관악구 신림동", en: "Sillim-dong, Gwanak-gu", ja: "冠岳区 新林洞", "zh-CN": "冠岳区 新林洞", de: "Sillim-dong, Gwanak-gu" } satisfies Text,
  from: "2027-01-04",
  to: "2027-04-05",
  discount: 35,
  tone: 6,
};

/** Stays that are over (trips page). */
export const pastStays: {
  key: string;
  listingId?: string;
  title?: Text;
  area?: Text;
  from: string;
  to: string;
  tone: number;
  action: "review" | "rebook";
  /** The host, for stays at places no longer on the site; otherwise the sample host. */
  host?: Text;
}[] = [
  { key: "wangsimni", listingId: "wangsimni-single", from: "2026-07-17", to: "2026-07-20", tone: 2, action: "review" },
  { key: "sinchon", listingId: "sinchon-single", from: "2026-03-02", to: "2026-04-06", tone: 4, action: "rebook" },
  { key: "konkuk", listingId: "geondae-single", from: "2026-02-09", to: "2026-02-15", tone: 6, action: "rebook" },
];

/** A conversation in the inbox. `icon: "brand"` shows the MONTHLIV mark instead of an initial. */
export type Thread = {
  id: string;
  who: Text;
  initial?: Text;
  icon?: "brand";
  role: "host" | "help" | "past";
  /** Not read yet: a moon dot by the time. */
  unread?: boolean;
  time: Text;
  last: Text;
  context: Text;
};

export const threads: Thread[] = [
  {
    id: "seongsu",
    who: sampleHost.name,
    initial: sampleHost.initial,
    role: "host",
    time: { ko: "12:40", en: "12:40" },
    last: {
      ko: "방문 뒤에 접어서 세워 뒀어요.",
      en: "It's folded up behind your door.",
      ja: "お部屋のドアの裏に畳んで立てかけてあります。",
      "zh-CN": "折叠好放在房门后面了。",
      de: "Er steht zusammengeklappt hinter deiner Zimmertür.",
    },
    context: {
      ko: "성수 스테이 · 윈도우 룸 · 11월 2–30일",
      en: "Seongsu Stay · Window Room · 2–30 Nov",
      ja: "聖水ステイ · ウィンドウルーム · 11月2日～30日",
      "zh-CN": "圣水月租房 · 带窗房 · 11月2日至30日",
      de: "Seongsu Stay · Fensterzimmer · 2.–30. Nov.",
    },
  },
  {
    id: "help",
    who: {
      ko: "먼슬리브 고객센터",
      en: "MONTHLIV Help",
      ja: "MONTHLIV ヘルプ",
      "zh-CN": "MONTHLIV 帮助中心",
      de: "MONTHLIV Hilfe",
    },
    icon: "brand",
    role: "help",
    unread: true,
    time: { ko: "어제", en: "Yesterday", ja: "昨日", "zh-CN": "昨天", de: "Gestern" },
    last: {
      ko: "서울대 스테이 예약 요청을 지점에 보냈어요.",
      en: "We've sent your SNU Stay request to the branch.",
      ja: "ソウル大ステイへのリクエストを店舗に送りました。",
      "zh-CN": "我们已把你对首尔大月租房的请求发给门店。",
      de: "Wir haben deine Anfrage für den SNU Stay an den Standort geschickt.",
    },
    context: {
      ko: "서울대 스테이 · 윈도우 룸 · 1–4월",
      en: "SNU Stay · Window Room · Jan–Apr",
      ja: "ソウル大ステイ · ウィンドウルーム · 1月～4月",
      "zh-CN": "首尔大月租房 · 带窗房 · 1月至4月",
      de: "SNU Stay · Fensterzimmer · Jan.–Apr.",
    },
  },
  {
    id: "wangsimni",
    who: sampleHost.name,
    initial: sampleHost.initial,
    role: "past",
    time: { ko: "7월", en: "Jul", ja: "7月", "zh-CN": "7月", de: "Juli" },
    last: {
      ko: "머물러 주셔서 감사해요. 조심히 가세요!",
      en: "Thanks for staying with us. Safe travels!",
      ja: "ご滞在ありがとうございました。お気をつけて！",
      "zh-CN": "谢谢入住，一路平安！",
      de: "Danke für deinen Aufenthalt. Gute Reise!",
    },
    context: {
      ko: "왕십리 호스텔 · 싱글룸",
      en: "Wangsimni Hostel · Single Room",
      ja: "往十里ホステル · シングルルーム",
      "zh-CN": "往十里青年旅舍 · 单人间",
      de: "Wangsimni Hostel · Einzelzimmer",
    },
  },
];

export type Message = {
  from: "guest" | "host";
  /** Time sent, HH:MM in Seoul. */
  time: string;
  read?: boolean;
  /** The language the message was written in. */
  original: Locale;
  text: Text;
};

/** The open conversation with the Seongsu branch, on day 12 of a 28-night stay. */
export const sampleConversation: Message[] = [
  {
    from: "guest",
    time: "12:21",
    read: true,
    original: "ko",
    text: {
      ko: "매니저님, 세탁기 설명서는 어디 있을까요?",
      en: "Hi, where can I find the washing machine instructions?",
      ja: "すみません、洗濯機の説明書はどこにありますか？",
      "zh-CN": "你好！洗衣机的说明书在哪里？",
      de: "Hallo, wo finde ich die Anleitung für die Waschmaschine?",
    },
  },
  {
    from: "host",
    time: "12:30",
    original: "ko",
    text: {
      ko: "세탁기 옆 선반에 있어요. 표준 코스로 돌리면 50분쯤 걸려요.",
      en: "It's on the shelf next to the machine. The standard cycle takes about 50 minutes.",
      ja: "洗濯機の横の棚にあります。標準コースで約50分かかります。",
      "zh-CN": "在洗衣机旁边的架子上。标准程序大约需要50分钟。",
      de: "Sie liegt im Regal neben der Maschine. Das Standardprogramm dauert etwa 50 Minuten.",
    },
  },
  {
    from: "guest",
    time: "12:38",
    read: true,
    original: "ko",
    text: {
      ko: "찾았어요, 감사합니다! 빨래 건조대도 있을까요?",
      en: "Found it, thank you! Is there a drying rack too?",
      ja: "見つかりました、ありがとうございます！物干しラックもありますか？",
      "zh-CN": "找到了，谢谢！有晾衣架吗？",
      de: "Gefunden, danke! Gibt es auch einen Wäscheständer?",
    },
  },
  {
    from: "host",
    time: "12:40",
    original: "ko",
    text: {
      ko: "방문 뒤에 접어서 세워 뒀어요.",
      en: "It's folded up behind your door.",
      ja: "お部屋のドアの裏に畳んで立てかけてあります。",
      "zh-CN": "折叠好放在房门后面了。",
      de: "Er steht zusammengeklappt hinter deiner Zimmertür.",
    },
  },
];

/** Saved lists. Prices are for the sample trip; `drops` are price cuts since saving, in won. */
export const savedLists: {
  id: string;
  name: Text;
  ids: string[];
  notes?: Record<string, Text>;
  drops?: Record<string, number>;
}[] = [
  {
    id: "autumn-seoul",
    name: {
      ko: "이번 가을 서울",
      en: "Seoul this autumn",
      ja: "この秋のソウル",
      "zh-CN": "今年秋天的首尔",
      de: "Seoul im Herbst",
    },
    ids: ["seongsu-window", "cheonho-window", "geondae-double", "seongsu-premium"],
    notes: {
      "seongsu-window": {
        ko: "의자 하나 더 있는지 물어보기",
        en: "Ask if there's a second chair",
        ja: "椅子がもう1脚あるか聞く",
        "zh-CN": "问问有没有多一把椅子",
        de: "Fragen, ob es einen zweiten Stuhl gibt",
      },
    },
    drops: { "seongsu-premium": 28000 },
  },
  {
    id: "near-campus",
    name: {
      ko: "학교 근처",
      en: "Near campus",
      ja: "大学の近く",
      "zh-CN": "学校附近",
      de: "Nahe der Uni",
    },
    ids: ["snu-standard", "sinchon-single"],
  },
  {
    id: "whole-season",
    name: {
      ko: "한 계절 머물 곳",
      en: "For a whole season",
      ja: "ひと季節暮らす場所",
      "zh-CN": "住上一季的地方",
      de: "Für eine ganze Saison",
    },
    ids: ["monthliv-in-jeju", "seongsu-standard", "wangsimni-single"],
  },
];

/**
 * The sample member's account. Only what the account pages show: no card, resident registration
 * or passport numbers are kept, and the phone number is stored masked for display.
 */
export const sampleMember = {
  id: "seojin.yun",
  email: "seojin.yun@example.com",
  phone: "010-••••-5821",
  /** When the phone identity check was done (the check's result only, not an ID number). */
  verifiedOn: "2025-03-14",
  since: 2025,
  stays: 3,
  languages: ["ko", "en"] as const,
  /** Ways to sign in that are linked to the account. */
  logins: { kakao: true, naver: false, apple: false, google: true, email: true },
  passwordChangedOn: "2026-05-02",
};

/** Devices signed in to the sample account. */
export const sampleDevices: { key: string; name: string; place: Text; lastSeen: string | null }[] = [
  {
    key: "phone",
    name: "iPhone · MONTHLIV app",
    place: { ko: "서울", en: "Seoul", ja: "ソウル", "zh-CN": "首尔", de: "Seoul" },
    lastSeen: null,
  },
  {
    key: "laptop",
    name: "Chrome · macOS",
    place: { ko: "서울", en: "Seoul", ja: "ソウル", "zh-CN": "首尔", de: "Seoul" },
    lastSeen: "2026-10-01",
  },
];

/** Reviews the sample guest has written, for stays in `pastStays`. Ratings are out of 5. */
export const myReviews: {
  stayKey: string;
  date: string;
  rating: number;
  text: Text;
  reply?: Text;
}[] = [
  {
    stayKey: "sinchon",
    date: "2026-04-09",
    rating: 5,
    text: {
      ko: "한 달 넘게 지내면서 불편한 게 거의 없었어요. 역이 바로 앞이라 늦게 끝나는 날에도 편했고, 물어보면 늘 금방 답해 주셨어요.",
      en: "I stayed over a month and hardly anything bothered me. The station is right outside, which helped on late days, and questions always got a quick answer.",
      ja: "1か月以上過ごして、不便なことはほとんどありませんでした。駅がすぐ前なので遅い日も楽で、質問にはいつもすぐ答えてもらえました。",
      "zh-CN": "住了一个多月，几乎没有不方便的地方。车站就在门口，晚归的日子也很方便，有问题总能很快得到回复。",
      de: "Ich war über einen Monat dort, und kaum etwas hat gestört. Die Station ist direkt vor der Tür – praktisch an langen Tagen –, und auf Fragen kam immer schnell eine Antwort.",
    },
    reply: {
      ko: "오래 머물러 주셔서 고마웠어요. 다음에도 신촌에서 기다릴게요!",
      en: "Thank you for staying so long. We'll be here in Sinchon next time too!",
      ja: "長く滞在してくださってありがとうございました。また新村でお待ちしています！",
      "zh-CN": "谢谢你住了这么久。我们在新村等你再来！",
      de: "Danke, dass du so lange geblieben bist. Wir freuen uns, dich wieder in Sinchon zu sehen!",
    },
  },
  {
    stayKey: "konkuk",
    date: "2026-02-17",
    rating: 4,
    text: {
      ko: "1인실이 생각보다 넓었고 공용 주방이 깨끗했어요. 주말 밤에는 조금 시끄러웠어요.",
      en: "The single room was bigger than I expected and the shared kitchen was clean. It got a bit noisy on weekend nights.",
      ja: "個室は思ったより広く、共用キッチンもきれいでした。週末の夜は少しにぎやかでした。",
      "zh-CN": "单人间比想象的宽敞，公用厨房很干净。周末晚上有点吵。",
      de: "Das Einzelzimmer war größer als gedacht und die Gemeinschaftsküche sauber. Am Wochenende war es nachts etwas laut.",
    },
  },
];
