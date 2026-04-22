export const MYPAGE_TAB_ITEMS = [
  {
    key: 'overview',
    label: 'Home',
    title: '홈',
    description: '한눈에 보는 상담 현황과 핵심 요약',
  },
  {
    key: 'history',
    label: '상담내역',
    title: '상담내역',
    description: '최근 상담 기록과 대화 흐름',
  },
  {
    key: 'reports',
    label: '감정리포트',
    title: '감정리포트',
    description: '주간 감정 변화와 인사이트',
  },
  {
    key: 'billing',
    label: '결제 · 포인트',
    title: '결제 · 포인트',
    description: '구독, 결제, 포인트 현황',
  },
  {
    key: 'settings',
    label: '설정',
    title: '설정',
    description: '알림, 계정, 보안 설정',
  },
  {
    key: 'support',
    label: '지원',
    title: '지원',
    description: '문의 내역과 도움말',
  },
];

export const EMOTION_COLOR_MAP = {
  안정: '#79aee8',
  피로: '#8d80db',
  불안: '#eb8db1',
  집중: '#73c8b8',
  기쁨: '#f3b183',
  침잠: '#8c86a7',
};

export const DEFAULT_EMOTION_BARS = [
  { id: 'stable', label: '안정', value: 38, color: '#79aee8' },
  { id: 'fatigue', label: '피로', value: 22, color: '#8d80db' },
  { id: 'anxiety', label: '불안', value: 18, color: '#eb8db1' },
  { id: 'focus', label: '집중', value: 12, color: '#73c8b8' },
  { id: 'joy', label: '기쁨', value: 10, color: '#f3b183' },
];

export const DEFAULT_WEEKLY_FLOW = [
  { id: 'mon', label: '월', value: 72 },
  { id: 'tue', label: '화', value: 68 },
  { id: 'wed', label: '수', value: 74 },
  { id: 'thu', label: '목', value: 79 },
  { id: 'fri', label: '금', value: 76 },
  { id: 'sat', label: '토', value: 82 },
  { id: 'sun', label: '일', value: 78 },
];

export const DEFAULT_REPORT_KEYWORDS = [
  '수면',
  '스트레스',
  '관계',
  '일상 루틴',
  '집중 회복',
];

export const DEFAULT_PROFILE = {
  id: '',
  nickname: 'Matey 사용자',
  name: 'Matey 사용자',
  displayName: 'Matey 사용자',
  email: '',
  phone: '',
  bio: '',
  status: '정상 이용 중',
  subscriptionName: 'Premium Care',
  points: 0,
  totalSessions: 0,
  lastLogin: '',
  lastLoginAt: '',
  updatedAt: '',
  settings: {
    timezone: 'Asia/Seoul',
    language: 'ko',
    marketingConsent: false,
    emailNotification: true,
    pushNotification: true,
    reportAutoSave: true,
    securityAlert: true,
  },
};

export const DEFAULT_HISTORY_ITEM = {
  id: '',
  title: '상담 기록',
  summary: '최근 상담 내용이 여기에 표시됩니다.',
  mood: '안정',
  date: '',
  createdAt: '',
  updatedAt: '',
  counselor: 'Matey AI',
  duration: '',
  tags: [],
};

export const DEFAULT_HISTORY = {
  items: [],
  history: [],
  sessions: [],
  totalCount: 0,
  total: 0,
  count: 0,
  latestItem: null,
};

export const DEFAULT_REPORTS = {
  emotionBars: DEFAULT_EMOTION_BARS,
  emotions: DEFAULT_EMOTION_BARS,
  weeklyEmotions: DEFAULT_EMOTION_BARS,
  chartData: DEFAULT_EMOTION_BARS,
  weeklyFlow: DEFAULT_WEEKLY_FLOW,
  weeklyTrend: DEFAULT_WEEKLY_FLOW,
  trendPoints: DEFAULT_WEEKLY_FLOW,
  stability: 76,
  stabilityScore: 76,
  dominantEmotion: DEFAULT_EMOTION_BARS[0],
  keywords: DEFAULT_REPORT_KEYWORDS,
  topKeywords: DEFAULT_REPORT_KEYWORDS,
  topics: DEFAULT_REPORT_KEYWORDS,
  rangeLabel: '최근 1주',
  periodLabel: '최근 1주',
  reportPeriod: '최근 1주',
  updatedAt: '',
  summary: {
    stability: 76,
    stabilityScore: 76,
    dominantEmotion: '안정',
    period: '최근 1주',
    keywords: DEFAULT_REPORT_KEYWORDS,
  },
};

export const DEFAULT_BILLING = {
  subscriptionName: 'Premium Care',
  planName: 'Premium Care',
  availablePoints: 0,
  points: 0,
  pointBalance: 0,
  monthlyAmount: 12900,
  price: 12900,
  nextBillingDate: '',
  renewalDate: '',
  paymentMethod: '등록된 결제수단',
  defaultPaymentMethod: '등록된 결제수단',
  cardName: '등록된 결제수단',
  payments: [
    {
      id: 'payment-1',
      title: 'Premium Care 월 구독',
      amount: 12900,
      date: '',
      method: '정기결제',
      status: '결제 완료',
    },
  ],
  paymentHistory: [
    {
      id: 'payment-1',
      title: 'Premium Care 월 구독',
      amount: 12900,
      date: '',
      method: '정기결제',
      status: '결제 완료',
    },
  ],
  billingHistory: [
    {
      id: 'payment-1',
      title: 'Premium Care 월 구독',
      amount: 12900,
      date: '',
      method: '정기결제',
      status: '결제 완료',
    },
  ],
  pointHistory: [
    {
      id: 'point-1',
      title: '정기 구독 적립',
      amount: 300,
      type: 'earn',
      date: '',
    },
    {
      id: 'point-2',
      title: '감정 리포트 사용',
      amount: -120,
      type: 'use',
      date: '',
    },
  ],
  pointsHistory: [
    {
      id: 'point-1',
      title: '정기 구독 적립',
      amount: 300,
      type: 'earn',
      date: '',
    },
    {
      id: 'point-2',
      title: '감정 리포트 사용',
      amount: -120,
      type: 'use',
      date: '',
    },
  ],
  pointLogs: [
    {
      id: 'point-1',
      title: '정기 구독 적립',
      amount: 300,
      type: 'earn',
      date: '',
    },
    {
      id: 'point-2',
      title: '감정 리포트 사용',
      amount: -120,
      type: 'use',
      date: '',
    },
  ],
  totalPaid: 12900,
};

export const DEFAULT_SUPPORT_ITEMS = [
  {
    id: 'support-1',
    title: '상담 이용 관련 문의',
    content: '서비스 이용 방법이나 결제, 포인트 관련 문의를 남길 수 있어요.',
    status: '접수 가능',
    date: '',
    category: '일반 문의',
  },
];

export const DEFAULT_FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: '상담 기록은 어디에서 확인할 수 있나요?',
    answer: '상담내역 탭에서 최근 상담 기록과 요약을 확인할 수 있어요.',
  },
  {
    id: 'faq-2',
    question: '감정 리포트는 자동으로 저장되나요?',
    answer: '설정 탭에서 리포트 자동 저장 옵션을 켜면 이후 리포트가 자동 보관돼요.',
  },
  {
    id: 'faq-3',
    question: '포인트는 어떻게 사용되나요?',
    answer: '일부 리포트 기능이나 부가 기능 이용 시 포인트가 차감될 수 있어요.',
  },
  {
    id: 'faq-4',
    question: '구독 결제일은 어디서 확인하나요?',
    answer: '결제 · 포인트 탭에서 다음 결제일과 결제 수단을 확인할 수 있어요.',
  },
];

export const DEFAULT_SUPPORT = {
  items: DEFAULT_SUPPORT_ITEMS,
  history: DEFAULT_SUPPORT_ITEMS,
  tickets: DEFAULT_SUPPORT_ITEMS,
  supportHistory: DEFAULT_SUPPORT_ITEMS,
  faq: DEFAULT_FAQ_ITEMS,
  faqs: DEFAULT_FAQ_ITEMS,
  faqPreview: DEFAULT_FAQ_ITEMS,
  totalCount: DEFAULT_SUPPORT_ITEMS.length,
  total: DEFAULT_SUPPORT_ITEMS.length,
  count: DEFAULT_SUPPORT_ITEMS.length,
  latestStatus: '접수 가능',
};

export const DEFAULT_SETTINGS_FORM = {
  nickname: 'Matey 사용자',
  email: '',
  phone: '',
  bio: '',
  timezone: 'Asia/Seoul',
  language: 'ko',
  marketingConsent: false,
  emailNotification: true,
  pushNotification: true,
  reportAutoSave: true,
  securityAlert: true,
};

export const HISTORY_SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'title', label: '제목순' },
];

export const SETTINGS_LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
];

export const SETTINGS_TIMEZONE_OPTIONS = [
  { value: 'Asia/Seoul', label: 'Asia/Seoul' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
  { value: 'Europe/London', label: 'Europe/London' },
];

export const SUPPORT_CATEGORY_OPTIONS = [
  { value: '일반 문의', label: '일반 문의' },
  { value: '상담 이용', label: '상담 이용' },
  { value: '결제 · 포인트', label: '결제 · 포인트' },
  { value: '계정 · 보안', label: '계정 · 보안' },
  { value: '오류 제보', label: '오류 제보' },
];

export const PAYMENT_STATUS_LABELS = {
  paid: '결제 완료',
  success: '결제 완료',
  completed: '결제 완료',
  done: '결제 완료',
  approved: '결제 완료',
  pending: '대기중',
  waiting: '대기중',
  hold: '대기중',
  review: '대기중',
  failed: '문제 발생',
  cancelled: '문제 발생',
  canceled: '문제 발생',
  error: '문제 발생',
  scheduled: '예정',
  upcoming: '예정',
};

export const SUPPORT_STATUS_LABELS = {
  open: '접수됨',
  received: '접수됨',
  submitted: '접수됨',
  new: '접수됨',
  created: '접수됨',
  pending: '검토중',
  waiting: '검토중',
  review: '검토중',
  in_review: '검토중',
  processing: '검토중',
  resolved: '해결됨',
  done: '해결됨',
  complete: '해결됨',
  completed: '해결됨',
  closed: '해결됨',
  reply: '답변 완료',
  answered: '답변 완료',
  replied: '답변 완료',
};

export const EMOTION_LABEL_MAP = {
  stable: '안정',
  calm: '안정',
  neutral: '안정',
  steady: '안정',
  good: '안정',
  happy: '기쁨',
  joy: '기쁨',
  positive: '기쁨',
  anxious: '불안',
  anxiety: '불안',
  worry: '불안',
  stress: '불안',
  stressed: '불안',
  sad: '침잠',
  down: '침잠',
  depressed: '침잠',
  tired: '피로',
  fatigue: '피로',
  exhausted: '피로',
  focused: '집중',
  focus: '집중',
  motivated: '집중',
};

export default {
  MYPAGE_TAB_ITEMS,
  EMOTION_COLOR_MAP,
  DEFAULT_EMOTION_BARS,
  DEFAULT_WEEKLY_FLOW,
  DEFAULT_REPORT_KEYWORDS,
  DEFAULT_PROFILE,
  DEFAULT_HISTORY_ITEM,
  DEFAULT_HISTORY,
  DEFAULT_REPORTS,
  DEFAULT_BILLING,
  DEFAULT_SUPPORT_ITEMS,
  DEFAULT_FAQ_ITEMS,
  DEFAULT_SUPPORT,
  DEFAULT_SETTINGS_FORM,
  HISTORY_SORT_OPTIONS,
  SETTINGS_LANGUAGE_OPTIONS,
  SETTINGS_TIMEZONE_OPTIONS,
  SUPPORT_CATEGORY_OPTIONS,
  PAYMENT_STATUS_LABELS,
  SUPPORT_STATUS_LABELS,
  EMOTION_LABEL_MAP,
};
