import {
  DEFAULT_PROFILE,
  DEFAULT_HISTORY,
  DEFAULT_HISTORY_ITEM,
  DEFAULT_REPORTS,
  DEFAULT_BILLING,
  DEFAULT_SUPPORT,
  DEFAULT_EMOTION_BARS,
  DEFAULT_WEEKLY_FLOW,
  DEFAULT_REPORT_KEYWORDS,
  DEFAULT_SUPPORT_ITEMS,
  DEFAULT_FAQ_ITEMS,
  EMOTION_COLOR_MAP,
} from './constants';

import {
  isObject,
  pickFirst,
  toNumber,
  normalizeEmotionLabel,
  normalizePaymentStatus,
  normalizeSupportStatus,
  normalizeTags,
  uniqueTags,
} from './formatters';

const safeObject = (value, fallback = {}) => (isObject(value) ? value : fallback);
const safeArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

const toRootObject = (payload) => {
  if (Array.isArray(payload)) {
    return { items: payload };
  }

  return safeObject(payload, {});
};

const mergeObjects = (...items) =>
  items.reduce((acc, item) => {
    if (!isObject(item)) return acc;
    return { ...acc, ...item };
  }, {});

const getNested = (target, path, fallback) => {
  if (!target || !path) return fallback;

  const result = String(path)
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), target);

  return result === undefined ? fallback : result;
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const raw = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on', 'enabled'].includes(raw)) return true;
    if (['false', '0', 'no', 'off', 'disabled'].includes(raw)) return false;
  }
  if (typeof value === 'number') return value > 0;
  return fallback;
};

export const mapProfile = (payload = {}) => {
  const root = toRootObject(payload);
  const source = mergeObjects(
    safeObject(root.data),
    safeObject(root.profile),
    safeObject(root.user),
    safeObject(root.member),
    root
  );

  const settings = mergeObjects(
    safeObject(DEFAULT_PROFILE.settings),
    safeObject(source.settings),
    safeObject(source.preferences),
    safeObject(source.profileSettings)
  );

  return {
    ...DEFAULT_PROFILE,
    id: pickFirst(source.id, source.userId, source.memberId, DEFAULT_PROFILE.id),
    nickname: pickFirst(
      source.nickname,
      source.name,
      source.displayName,
      source.userName,
      source.username,
      DEFAULT_PROFILE.nickname
    ),
    name: pickFirst(
      source.name,
      source.nickname,
      source.displayName,
      DEFAULT_PROFILE.name
    ),
    displayName: pickFirst(
      source.displayName,
      source.nickname,
      source.name,
      DEFAULT_PROFILE.displayName
    ),
    email: pickFirst(source.email, source.accountEmail, DEFAULT_PROFILE.email),
    phone: pickFirst(source.phone, source.phoneNumber, DEFAULT_PROFILE.phone),
    bio: pickFirst(source.bio, source.introduction, source.description, DEFAULT_PROFILE.bio),
    status: pickFirst(source.status, source.accountStatus, DEFAULT_PROFILE.status),
    subscriptionName: pickFirst(
      source.subscriptionName,
      source.membership,
      source.planName,
      getNested(source, 'subscription.name'),
      getNested(source, 'plan.name'),
      DEFAULT_PROFILE.subscriptionName
    ),
    points: toNumber(
      pickFirst(source.points, source.pointBalance, source.availablePoints, DEFAULT_PROFILE.points),
      DEFAULT_PROFILE.points
    ),
    totalSessions: toNumber(
      pickFirst(source.totalSessions, source.sessionCount, source.totalCount, DEFAULT_PROFILE.totalSessions),
      DEFAULT_PROFILE.totalSessions
    ),
    lastLogin: pickFirst(source.lastLogin, source.lastLoginAt, DEFAULT_PROFILE.lastLogin),
    lastLoginAt: pickFirst(source.lastLoginAt, source.lastLogin, DEFAULT_PROFILE.lastLoginAt),
    updatedAt: pickFirst(source.updatedAt, DEFAULT_PROFILE.updatedAt),
    settings: {
      ...settings,
      timezone: pickFirst(settings.timezone, source.timezone, DEFAULT_PROFILE.settings.timezone),
      language: pickFirst(settings.language, source.language, DEFAULT_PROFILE.settings.language),
      marketingConsent: normalizeBoolean(
        pickFirst(settings.marketingConsent, settings.marketing, source.marketingConsent),
        DEFAULT_PROFILE.settings.marketingConsent
      ),
      emailNotification: normalizeBoolean(
        pickFirst(settings.emailNotification, settings.emailNotifications, source.emailNotification),
        DEFAULT_PROFILE.settings.emailNotification
      ),
      pushNotification: normalizeBoolean(
        pickFirst(settings.pushNotification, settings.pushNotifications, source.pushNotification),
        DEFAULT_PROFILE.settings.pushNotification
      ),
      reportAutoSave: normalizeBoolean(
        pickFirst(settings.reportAutoSave, settings.autoSave, source.reportAutoSave),
        DEFAULT_PROFILE.settings.reportAutoSave
      ),
      securityAlert: normalizeBoolean(
        pickFirst(settings.securityAlert, settings.securityAlerts, source.securityAlert),
        DEFAULT_PROFILE.settings.securityAlert
      ),
    },
  };
};

export const mapMyProfile = mapProfile;
export const toProfileModel = mapProfile;
export const profileMapper = mapProfile;
export const normalizeProfile = mapProfile;

export const mapHistoryItem = (item = {}, index = 0) => {
  const source = safeObject(item, {});
  const mood = normalizeEmotionLabel(
    pickFirst(source.mood, source.emotion, source.statusLabel, source.feeling, DEFAULT_HISTORY_ITEM.mood)
  );

  const tags = uniqueTags([
    ...normalizeTags(pickFirst(source.tags, source.keywords, source.topics, source.topicTags, [])),
    pickFirst(source.topic, source.subject, ''),
    mood,
  ]);

  return {
    ...DEFAULT_HISTORY_ITEM,
    id: pickFirst(
      source.id,
      source.sessionId,
      source.counselId,
      source.chatId,
      `history-${index}`
    ),
    title: pickFirst(
      source.title,
      source.topic,
      source.subject,
      source.sessionTitle,
      DEFAULT_HISTORY_ITEM.title
    ),
    summary: pickFirst(
      source.summary,
      source.preview,
      source.description,
      source.lastMessage,
      source.contentPreview,
      DEFAULT_HISTORY_ITEM.summary
    ),
    mood,
    date: pickFirst(source.date, source.createdAt, source.startedAt, source.time, ''),
    createdAt: pickFirst(source.createdAt, source.date, source.startedAt, ''),
    updatedAt: pickFirst(source.updatedAt, source.date, source.createdAt, ''),
    counselor: pickFirst(
      source.botName,
      source.assistantName,
      source.counselor,
      source.bot,
      DEFAULT_HISTORY_ITEM.counselor
    ),
    duration: pickFirst(
      source.duration,
      source.durationText,
      source.durationLabel,
      DEFAULT_HISTORY_ITEM.duration
    ),
    tags,
    raw: source,
  };
};

export const mapCounselHistory = (payload = {}) => {
  const root = toRootObject(payload);
  const source = mergeObjects(
    safeObject(root.data),
    safeObject(root.history),
    safeObject(root.result),
    safeObject(root.payload),
    root
  );

  const itemsSource = safeArray(
    pickFirst(
      source.items,
      source.history,
      source.sessions,
      source.records,
      source.list,
      source.content,
      []
    ),
    []
  );

  const items = itemsSource.map((item, index) => mapHistoryItem(item, index));
  const totalCount = toNumber(
    pickFirst(source.totalCount, source.total, source.count, source.size, items.length),
    items.length
  );

  return {
    ...DEFAULT_HISTORY,
    items,
    history: items,
    sessions: items,
    totalCount,
    total: totalCount,
    count: totalCount,
    latestItem: items[0] || null,
    raw: source,
  };
};

export const mapHistory = mapCounselHistory;
export const toHistoryModel = mapCounselHistory;
export const normalizeHistory = mapCounselHistory;
export const mapCounselHistoryList = mapCounselHistory;

export const mapEmotionBarItem = (item = {}, index = 0) => {
  if (typeof item === 'string') {
    return {
      id: `emotion-${index}`,
      label: normalizeEmotionLabel(item),
      value: toNumber(DEFAULT_EMOTION_BARS[index]?.value, 0),
      color: DEFAULT_EMOTION_BARS[index]?.color || '#79aee8',
    };
  }

  const source = safeObject(item, {});

  return {
    id: pickFirst(source.id, `emotion-${index}`),
    label: normalizeEmotionLabel(
      pickFirst(source.label, source.name, source.emotion, `감정 ${index + 1}`)
    ),
    value: toNumber(
      pickFirst(source.value, source.percent, source.percentage, source.score),
      0
    ),
    color: pickFirst(
      source.color,
      EMOTION_COLOR_MAP[normalizeEmotionLabel(pickFirst(source.label, source.name, source.emotion, '안정'))],
      DEFAULT_EMOTION_BARS[index]?.color,
      '#79aee8'
    ),
  };
};

export const mapWeeklyFlowItem = (item = {}, index = 0) => {
  if (typeof item === 'number') {
    return {
      id: `day-${index}`,
      label: DEFAULT_WEEKLY_FLOW[index]?.label || `${index + 1}일`,
      value: toNumber(item, 0),
    };
  }

  if (typeof item === 'string') {
    return {
      id: `day-${index}`,
      label: item,
      value: toNumber(DEFAULT_WEEKLY_FLOW[index]?.value, 0),
    };
  }

  const source = safeObject(item, {});

  return {
    id: pickFirst(source.id, `day-${index}`),
    label: pickFirst(source.label, source.day, source.name, `${index + 1}일`),
    value: toNumber(
      pickFirst(source.value, source.score, source.stability, source.percent),
      0
    ),
  };
};

export const mapEmotionReports = (payload = {}) => {
  const root = toRootObject(payload);
  const source = mergeObjects(
    safeObject(root.data),
    safeObject(root.report),
    safeObject(root.reports),
    safeObject(root.result),
    safeObject(root.payload),
    root
  );

  const emotionBarsSource = safeArray(
    pickFirst(
      source.emotionBars,
      source.emotions,
      source.weeklyEmotions,
      source.chartData,
      source.distribution,
      []
    ),
    []
  );

  const weeklyFlowSource = safeArray(
    pickFirst(
      source.weeklyFlow,
      source.weeklyTrend,
      source.stabilityFlow,
      source.trendPoints,
      source.dailyScores,
      []
    ),
    []
  );

  const emotionBars = emotionBarsSource.length
    ? emotionBarsSource.map((item, index) => mapEmotionBarItem(item, index))
    : DEFAULT_EMOTION_BARS;

  const weeklyFlow = weeklyFlowSource.length
    ? weeklyFlowSource.map((item, index) => mapWeeklyFlowItem(item, index))
    : DEFAULT_WEEKLY_FLOW;

  const positiveBars = emotionBars.some((item) => toNumber(item.value, 0) > 0)
    ? emotionBars
    : DEFAULT_EMOTION_BARS;

  const positiveFlow = weeklyFlow.some((item) => toNumber(item.value, 0) > 0)
    ? weeklyFlow
    : DEFAULT_WEEKLY_FLOW;

  const dominantEmotion =
    positiveBars
      .slice()
      .sort((a, b) => toNumber(b.value, 0) - toNumber(a.value, 0))[0] || DEFAULT_EMOTION_BARS[0];

  const keywords = uniqueTags(
    safeArray(
      pickFirst(
        source.keywords,
        source.topKeywords,
        source.topics,
        getNested(source, 'summary.keywords'),
        DEFAULT_REPORT_KEYWORDS
      ),
      DEFAULT_REPORT_KEYWORDS
    ).map((item) => (typeof item === 'string' ? item : pickFirst(item?.label, item?.name, item?.keyword, '')))
  );

  const stability = toNumber(
    pickFirst(
      source.stability,
      source.stabilityScore,
      getNested(source, 'summary.stability'),
      getNested(source, 'summary.stabilityScore'),
      DEFAULT_REPORTS.stability
    ),
    DEFAULT_REPORTS.stability
  );

  const period = pickFirst(
    source.rangeLabel,
    source.periodLabel,
    source.reportPeriod,
    getNested(source, 'summary.period'),
    DEFAULT_REPORTS.rangeLabel
  );

  return {
    ...DEFAULT_REPORTS,
    emotionBars: positiveBars,
    emotions: positiveBars,
    weeklyEmotions: positiveBars,
    chartData: positiveBars,
    weeklyFlow: positiveFlow,
    weeklyTrend: positiveFlow,
    trendPoints: positiveFlow,
    stability,
    stabilityScore: stability,
    dominantEmotion,
    keywords: keywords.length ? keywords : DEFAULT_REPORT_KEYWORDS,
    topKeywords: keywords.length ? keywords : DEFAULT_REPORT_KEYWORDS,
    topics: keywords.length ? keywords : DEFAULT_REPORT_KEYWORDS,
    rangeLabel: period,
    periodLabel: period,
    reportPeriod: period,
    updatedAt: pickFirst(source.updatedAt, source.createdAt, source.date, DEFAULT_REPORTS.updatedAt),
    summary: {
      stability,
      stabilityScore: stability,
      dominantEmotion: dominantEmotion.label,
      period,
      keywords: keywords.length ? keywords : DEFAULT_REPORT_KEYWORDS,
    },
    raw: source,
  };
};

export const mapEmotionReport = mapEmotionReports;
export const mapReports = mapEmotionReports;
export const toEmotionReportModel = mapEmotionReports;
export const normalizeEmotionReports = mapEmotionReports;
export const normalizeReports = mapEmotionReports;

export const mapPaymentItem = (item = {}, index = 0) => {
  const source = safeObject(item, {});

  return {
    id: pickFirst(source.id, source.paymentId, source.orderId, `payment-${index}`),
    title: pickFirst(
      source.title,
      source.name,
      source.productName,
      source.planName,
      '구독 결제'
    ),
    amount: toNumber(
      pickFirst(source.amount, source.price, source.paidAmount, source.totalAmount),
      0
    ),
    date: pickFirst(source.date, source.paidAt, source.createdAt, source.approvedAt, ''),
    method: pickFirst(source.method, source.paymentMethod, source.cardName, '결제 수단'),
    status: normalizePaymentStatus(
      pickFirst(source.status, source.paymentStatus, '결제 완료')
    ),
    raw: source,
  };
};

export const mapPointHistoryItem = (item = {}, index = 0) => {
  const source = safeObject(item, {});
  const amount = toNumber(
    pickFirst(source.amount, source.point, source.points, source.value),
    0
  );

  const rawType = String(pickFirst(source.type, source.action, source.kind, '')).toLowerCase();

  const type =
    rawType === 'expire'
      ? 'expire'
      : rawType === 'use' || rawType === 'spend' || amount < 0
      ? 'use'
      : 'earn';

  return {
    id: pickFirst(source.id, source.logId, source.pointId, `point-${index}`),
    title: pickFirst(source.title, source.description, source.reason, '포인트 내역'),
    amount,
    type,
    date: pickFirst(source.date, source.createdAt, source.usedAt, ''),
    raw: source,
  };
};

export const mapBillingInfo = (payload = {}) => {
  const root = toRootObject(payload);
  const source = mergeObjects(
    safeObject(root.data),
    safeObject(root.billing),
    safeObject(root.subscription),
    safeObject(root.result),
    safeObject(root.payload),
    root
  );

  const paymentsSource = safeArray(
    pickFirst(
      source.payments,
      source.paymentHistory,
      source.billingHistory,
      source.orders,
      source.transactions,
      DEFAULT_BILLING.payments
    ),
    DEFAULT_BILLING.payments
  );

  const pointHistorySource = safeArray(
    pickFirst(
      source.pointHistory,
      source.pointsHistory,
      source.pointLogs,
      source.pointTransactions,
      DEFAULT_BILLING.pointHistory
    ),
    DEFAULT_BILLING.pointHistory
  );

  const payments = paymentsSource.map((item, index) => mapPaymentItem(item, index));
  const pointHistory = pointHistorySource.map((item, index) => mapPointHistoryItem(item, index));

  const availablePoints = toNumber(
    pickFirst(
      source.availablePoints,
      source.points,
      source.pointBalance,
      source.currentPoints,
      DEFAULT_BILLING.availablePoints
    ),
    DEFAULT_BILLING.availablePoints
  );

  const monthlyAmount = toNumber(
    pickFirst(
      source.monthlyAmount,
      source.price,
      getNested(source, 'subscription.amount'),
      getNested(source, 'plan.price'),
      payments[0]?.amount,
      DEFAULT_BILLING.monthlyAmount
    ),
    DEFAULT_BILLING.monthlyAmount
  );

  const subscriptionName = pickFirst(
    source.subscriptionName,
    source.planName,
    getNested(source, 'subscription.name'),
    getNested(source, 'plan.name'),
    DEFAULT_BILLING.subscriptionName
  );

  const paymentMethod = pickFirst(
    source.paymentMethod,
    source.defaultPaymentMethod,
    source.cardName,
    getNested(source, 'subscription.paymentMethod'),
    payments[0]?.method,
    DEFAULT_BILLING.paymentMethod
  );

  const nextBillingDate = pickFirst(
    source.nextBillingDate,
    source.renewalDate,
    getNested(source, 'subscription.nextBillingDate'),
    DEFAULT_BILLING.nextBillingDate
  );

  const totalPaid = payments.reduce((sum, item) => {
    if (normalizePaymentStatus(item.status) !== '결제 완료') return sum;
    return sum + toNumber(item.amount, 0);
  }, 0);

  return {
    ...DEFAULT_BILLING,
    subscriptionName,
    planName: subscriptionName,
    availablePoints,
    points: availablePoints,
    pointBalance: availablePoints,
    monthlyAmount,
    price: monthlyAmount,
    nextBillingDate,
    renewalDate: nextBillingDate,
    paymentMethod,
    defaultPaymentMethod: paymentMethod,
    cardName: paymentMethod,
    payments,
    paymentHistory: payments,
    billingHistory: payments,
    pointHistory,
    pointsHistory: pointHistory,
    pointLogs: pointHistory,
    totalPaid,
    raw: source,
  };
};

export const mapBilling = mapBillingInfo;
export const toBillingModel = mapBillingInfo;
export const normalizeBilling = mapBillingInfo;
export const mapPaymentSummary = mapBillingInfo;

export const mapSupportItem = (item = {}, index = 0) => {
  const source = safeObject(item, {});

  return {
    id: pickFirst(source.id, source.ticketId, source.supportId, `support-${index}`),
    title: pickFirst(source.title, source.subject, source.name, '문의 내역'),
    content: pickFirst(
      source.content,
      source.description,
      source.message,
      source.summary,
      DEFAULT_SUPPORT_ITEMS[0]?.content || '문의 내용이 여기에 표시됩니다.'
    ),
    status: normalizeSupportStatus(
      pickFirst(source.status, source.state, source.ticketStatus, '접수됨')
    ),
    date: pickFirst(source.createdAt, source.updatedAt, source.date, ''),
    createdAt: pickFirst(source.createdAt, source.date, source.updatedAt, ''),
    updatedAt: pickFirst(source.updatedAt, source.createdAt, source.date, ''),
    category: pickFirst(source.category, source.type, '일반 문의'),
    raw: source,
  };
};

export const mapFaqItem = (item = {}, index = 0) => {
  if (typeof item === 'string') {
    return {
      id: `faq-${index}`,
      question: item,
      answer: '자세한 내용은 지원 센터에서 확인할 수 있어요.',
      raw: { question: item },
    };
  }

  const source = safeObject(item, {});

  return {
    id: pickFirst(source.id, `faq-${index}`),
    question: pickFirst(source.question, source.title, source.name, ''),
    answer: pickFirst(
      source.answer,
      source.description,
      source.content,
      '자세한 내용은 지원 센터에서 확인할 수 있어요.'
    ),
    raw: source,
  };
};

export const mapSupportHistory = (payload = {}) => {
  const root = toRootObject(payload);
  const source = mergeObjects(
    safeObject(root.data),
    safeObject(root.support),
    safeObject(root.result),
    safeObject(root.payload),
    root
  );

  const itemsSource = safeArray(
    pickFirst(
      source.items,
      source.history,
      source.tickets,
      source.supportHistory,
      source.list,
      source.content,
      DEFAULT_SUPPORT.items
    ),
    DEFAULT_SUPPORT.items
  );

  const faqSource = safeArray(
    pickFirst(
      source.faq,
      source.faqs,
      source.faqPreview,
      source.helpItems,
      source.knowledgeBase,
      DEFAULT_FAQ_ITEMS
    ),
    DEFAULT_FAQ_ITEMS
  );

  const items = itemsSource.map((item, index) => mapSupportItem(item, index));
  const faq = faqSource
    .map((item, index) => mapFaqItem(item, index))
    .filter((item) => item.question);

  const totalCount = toNumber(
    pickFirst(source.totalCount, source.total, source.count, items.length),
    items.length
  );

  const latestStatus = pickFirst(items[0]?.status, source.latestStatus, DEFAULT_SUPPORT.latestStatus);

  return {
    ...DEFAULT_SUPPORT,
    items,
    history: items,
    tickets: items,
    supportHistory: items,
    faq: faq.length ? faq : DEFAULT_FAQ_ITEMS,
    faqs: faq.length ? faq : DEFAULT_FAQ_ITEMS,
    faqPreview: faq.length ? faq : DEFAULT_FAQ_ITEMS,
    totalCount,
    total: totalCount,
    count: totalCount,
    latestStatus,
    raw: source,
  };
};

export const mapSupport = mapSupportHistory;
export const mapSupportItems = mapSupportHistory;
export const toSupportModel = mapSupportHistory;
export const normalizeSupport = mapSupportHistory;
export const normalizeSupportHistory = mapSupportHistory;
export const mapFaqPreview = mapSupportHistory;

export const buildDonutStyle = (bars = []) => {
  const items = safeArray(bars, []).length
    ? safeArray(bars, []).map((item, index) => mapEmotionBarItem(item, index))
    : DEFAULT_EMOTION_BARS;

  const total = items.reduce((sum, item) => sum + toNumber(item.value, 0), 0);

  if (total <= 0) {
    return {
      background: `conic-gradient(${DEFAULT_EMOTION_BARS[0].color} 0 100%)`,
    };
  }

  let cursor = 0;
  const segments = items.map((item) => {
    const ratio = (toNumber(item.value, 0) / total) * 100;
    const start = cursor;
    const end = cursor + ratio;
    cursor = end;
    return `${item.color} ${start}% ${end}%`;
  });

  return {
    background: `conic-gradient(${segments.join(', ')})`,
  };
};

export default {
  mapProfile,
  mapMyProfile,
  toProfileModel,
  profileMapper,
  normalizeProfile,
  mapHistoryItem,
  mapCounselHistory,
  mapHistory,
  toHistoryModel,
  normalizeHistory,
  mapCounselHistoryList,
  mapEmotionBarItem,
  mapWeeklyFlowItem,
  mapEmotionReports,
  mapEmotionReport,
  mapReports,
  toEmotionReportModel,
  normalizeEmotionReports,
  normalizeReports,
  mapPaymentItem,
  mapPointHistoryItem,
  mapBillingInfo,
  mapBilling,
  toBillingModel,
  normalizeBilling,
  mapPaymentSummary,
  mapSupportItem,
  mapFaqItem,
  mapSupportHistory,
  mapSupport,
  mapSupportItems,
  toSupportModel,
  normalizeSupport,
  normalizeSupportHistory,
  mapFaqPreview,
  buildDonutStyle,
};
