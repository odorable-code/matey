import React, { useMemo } from 'react';
import MyPagePanel from '../components/MyPagePanel';

const toArray = (value) => (Array.isArray(value) ? value : []);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(toNumber(value, 0));
const formatPoints = (value) => `${formatNumber(value)}P`;
const formatCurrency = (value) => `${formatNumber(value)}원`;

const formatDate = (value) => {
  if (!value) return '정보 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

const formatCompactDate = (value) => {
  if (!value) return '정보 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getPaymentStatusText = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return '정상';
  if (['paid', 'success', 'completed', 'done'].includes(raw)) return '결제 완료';
  if (['pending', 'waiting', 'hold'].includes(raw)) return '대기중';
  if (['failed', 'cancelled', 'canceled', 'error'].includes(raw)) return '문제 발생';
  if (['scheduled', 'upcoming'].includes(raw)) return '예정';

  return value;
};

const getPaymentStatusStyle = (value) => {
  const label = getPaymentStatusText(value);

  if (label === '문제 발생') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,245,248,0.92))',
      color: '#b55e7e',
      border: '1px solid rgba(213,106,140,0.14)',
    };
  }

  if (label === '대기중' || label === '예정') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,250,244,0.92))',
      color: '#b37a43',
      border: '1px solid rgba(243,177,131,0.16)',
    };
  }

  return {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,252,249,0.92))',
    color: '#3d8c7d',
    border: '1px solid rgba(115,200,184,0.18)',
  };
};

const normalizePayments = (billing) => {
  const source = toArray(
    pickFirst(
      billing?.payments,
      billing?.paymentHistory,
      billing?.billingHistory,
      billing?.orders,
      billing?.transactions,
      []
    )
  );

  if (!source.length) {
    return [
      {
        id: 'payment-1',
        title: 'Premium Care 월 구독',
        amount: 12900,
        date: '',
        method: '정기결제',
        status: '결제 완료',
      },
    ];
  }

  return source.map((item, index) => ({
    id: pickFirst(item?.id, item?.paymentId, item?.orderId, `payment-${index}`),
    title: pickFirst(
      item?.title,
      item?.name,
      item?.productName,
      item?.planName,
      '구독 결제'
    ),
    amount: toNumber(
      pickFirst(item?.amount, item?.price, item?.paidAmount, item?.totalAmount),
      0
    ),
    date: pickFirst(item?.date, item?.paidAt, item?.createdAt, item?.approvedAt, ''),
    method: pickFirst(item?.method, item?.paymentMethod, item?.cardName, '결제 수단'),
    status: getPaymentStatusText(pickFirst(item?.status, item?.paymentStatus, '결제 완료')),
  }));
};

const normalizePointHistory = (billing) => {
  const source = toArray(
    pickFirst(
      billing?.pointHistory,
      billing?.pointsHistory,
      billing?.pointLogs,
      billing?.pointTransactions,
      []
    )
  );

  if (!source.length) {
    return [
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
    ];
  }

  return source.map((item, index) => {
    const rawAmount = toNumber(
      pickFirst(item?.amount, item?.point, item?.points, item?.value),
      0
    );
    const type = String(pickFirst(item?.type, item?.action, item?.kind, '')).toLowerCase();

    return {
      id: pickFirst(item?.id, item?.logId, `point-${index}`),
      title: pickFirst(item?.title, item?.description, item?.reason, '포인트 내역'),
      amount:
        type === 'use' || type === 'spend' || rawAmount < 0 ? -Math.abs(rawAmount) : Math.abs(rawAmount),
      type:
        type === 'use' || type === 'spend' || rawAmount < 0
          ? 'use'
          : type === 'expire'
          ? 'expire'
          : 'earn',
      date: pickFirst(item?.date, item?.createdAt, item?.usedAt, ''),
    };
  });
};

function MyPageBillingSection({
  billing = {},
  profile = {},
  loading = false,
  errorMessage = '',
}) {
  const subscriptionName = useMemo(
    () =>
      pickFirst(
        billing?.subscriptionName,
        billing?.planName,
        billing?.plan?.name,
        profile?.subscriptionName,
        'Premium Care'
      ),
    [billing, profile]
  );

  const availablePoints = useMemo(
    () =>
      toNumber(
        pickFirst(
          billing?.availablePoints,
          billing?.points,
          billing?.pointBalance,
          profile?.points,
          0
        ),
        0
      ),
    [billing, profile]
  );

  const monthlyAmount = useMemo(
    () =>
      toNumber(
        pickFirst(
          billing?.monthlyAmount,
          billing?.price,
          billing?.subscription?.amount,
          billing?.plan?.price,
          12900
        ),
        12900
      ),
    [billing]
  );

  const nextBillingDate = useMemo(
    () =>
      pickFirst(
        billing?.nextBillingDate,
        billing?.renewalDate,
        billing?.subscription?.nextBillingDate,
        ''
      ),
    [billing]
  );

  const billingMethod = useMemo(
    () =>
      pickFirst(
        billing?.paymentMethod,
        billing?.defaultPaymentMethod,
        billing?.cardName,
        billing?.subscription?.paymentMethod,
        '등록된 결제수단'
      ),
    [billing]
  );

  const payments = useMemo(() => normalizePayments(billing), [billing]);
  const pointHistory = useMemo(() => normalizePointHistory(billing), [billing]);

  const totalPaid = useMemo(
    () =>
      payments.reduce((sum, item) => {
        if (getPaymentStatusText(item.status) !== '결제 완료') return sum;
        return sum + toNumber(item.amount, 0);
      }, 0),
    [payments]
  );

  const monthlyEarnedPoints = useMemo(
    () =>
      pointHistory.reduce((sum, item) => {
        if (item.type !== 'earn') return sum;
        return sum + Math.abs(toNumber(item.amount, 0));
      }, 0),
    [pointHistory]
  );

  const monthlyUsedPoints = useMemo(
    () =>
      pointHistory.reduce((sum, item) => {
        if (item.type !== 'use' && item.type !== 'expire') return sum;
        return sum + Math.abs(toNumber(item.amount, 0));
      }, 0),
    [pointHistory]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: '현재 플랜',
        value: subscriptionName,
        helper: nextBillingDate ? `다음 결제 ${formatCompactDate(nextBillingDate)}` : '자동 갱신 관리 가능',
      },
      {
        label: '월 결제 금액',
        value: formatCurrency(monthlyAmount),
        helper: billingMethod,
      },
      {
        label: '보유 포인트',
        value: formatPoints(availablePoints),
        helper: `이번 달 적립 ${formatPoints(monthlyEarnedPoints)}`,
      },
      {
        label: '누적 결제 금액',
        value: formatCurrency(totalPaid),
        helper: `${payments.length}건 결제 내역`,
      },
    ],
    [
      subscriptionName,
      nextBillingDate,
      monthlyAmount,
      billingMethod,
      availablePoints,
      monthlyEarnedPoints,
      totalPaid,
      payments.length,
    ]
  );

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <MyPagePanel
        label="Billing"
        title="결제 · 포인트"
        description="현재 구독 상태와 결제 내역, 포인트 사용 흐름을 한 화면에서 확인할 수 있어요."
      >
        {loading ? (
          <div className="matey-mypage__empty">결제 정보를 불러오는 중이에요.</div>
        ) : errorMessage ? (
          <div className="matey-mypage__empty">{errorMessage}</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            {summaryCards.map((card) => (
              <article key={card.label} className="matey-mypage__summary-item">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small
                  style={{
                    display: 'block',
                    marginTop: 8,
                    color: 'var(--matey-mypage-text-soft)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {card.helper}
                </small>
              </article>
            ))}
          </div>
        )}
      </MyPagePanel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(320px, 0.95fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Subscription"
          title="구독 상태"
          description="현재 플랜과 자동 결제, 다음 청구 일정을 정리했어요."
          smallHead
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <article className="matey-mypage__summary-item">
              <span>플랜 이름</span>
              <strong>{subscriptionName}</strong>
            </article>

            <article className="matey-mypage__summary-item">
              <span>결제 금액</span>
              <strong>{formatCurrency(monthlyAmount)}</strong>
            </article>

            <article className="matey-mypage__summary-item">
              <span>다음 결제일</span>
              <strong>{nextBillingDate ? formatDate(nextBillingDate) : '예정 없음'}</strong>
            </article>

            <article className="matey-mypage__summary-item">
              <span>결제 수단</span>
              <strong>{billingMethod}</strong>
            </article>
          </div>

          <div
            className="matey-mypage__empty"
            style={{
              marginTop: 16,
              textAlign: 'left',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(249,247,255,0.82))',
              borderStyle: 'solid',
            }}
          >
            <strong
              style={{
                display: 'block',
                marginBottom: 8,
                color: 'var(--matey-mypage-title)',
                fontSize: 16,
              }}
            >
              구독 메모
            </strong>
            자동 결제가 설정되어 있으면 다음 결제일에 동일한 플랜으로 연장돼요.
            필요 시 설정 탭에서 알림과 계정 상태를 함께 점검해 보세요.
          </div>
        </MyPagePanel>

        <MyPagePanel
          label="Points"
          title="포인트 현황"
          description="남은 포인트와 최근 적립·사용 흐름을 요약했어요."
          smallHead
        >
          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(249,247,255,0.86))',
              border: '1px solid rgba(123, 104, 189, 0.08)',
              boxShadow: 'var(--matey-mypage-shadow-soft)',
              display: 'grid',
              gap: 16,
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  color: 'var(--matey-mypage-text-soft)',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Available Points
              </span>
              <strong
                style={{
                  display: 'block',
                  marginTop: 8,
                  color: 'var(--matey-mypage-title)',
                  fontSize: 34,
                  lineHeight: 1.1,
                  letterSpacing: '-0.04em',
                }}
              >
                {formatPoints(availablePoints)}
              </strong>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <article className="matey-mypage__summary-item">
                <span>이번 달 적립</span>
                <strong>{formatPoints(monthlyEarnedPoints)}</strong>
              </article>

              <article className="matey-mypage__summary-item">
                <span>이번 달 사용</span>
                <strong>{formatPoints(monthlyUsedPoints)}</strong>
              </article>
            </div>
          </div>
        </MyPagePanel>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Payments"
          title="결제 내역"
          description="최근 결제 기록을 시간순으로 정리했어요."
          smallHead
        >
          {payments.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {payments.map((item) => (
                <article
                  key={item.id}
                  className="matey-mypage__history-card"
                  style={{ padding: 18 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 14,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <span className="matey-mypage__history-date">{formatDate(item.date)}</span>
                      <h3
                        style={{
                          margin: 0,
                          color: 'var(--matey-mypage-title)',
                          fontSize: 20,
                          lineHeight: 1.3,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <span
                      className="matey-mypage__mood-badge"
                      style={getPaymentStatusStyle(item.status)}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 12,
                    }}
                  >
                    <div className="matey-mypage__summary-item">
                      <span>결제 금액</span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>

                    <div className="matey-mypage__summary-item">
                      <span>결제 수단</span>
                      <strong>{item.method}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="matey-mypage__empty">표시할 결제 내역이 없어요.</div>
          )}
        </MyPagePanel>

        <MyPagePanel
          label="Point History"
          title="포인트 내역"
          description="적립과 사용 흐름을 간단히 살펴볼 수 있어요."
          smallHead
        >
          {pointHistory.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {pointHistory.map((item) => {
                const isNegative = item.type === 'use' || item.type === 'expire' || item.amount < 0;

                return (
                  <article
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto',
                      gap: 14,
                      alignItems: 'center',
                      padding: '16px 16px 15px',
                      borderRadius: 18,
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(251,250,255,0.82))',
                      border: '1px solid rgba(123, 104, 189, 0.08)',
                      boxShadow: 'var(--matey-mypage-shadow-soft)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          color: 'var(--matey-mypage-title)',
                          fontSize: 15,
                          lineHeight: 1.4,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {item.title}
                      </strong>
                      <span
                        style={{
                          display: 'block',
                          marginTop: 6,
                          color: 'var(--matey-mypage-text-soft)',
                          fontSize: 13,
                        }}
                      >
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <strong
                      style={{
                        color: isNegative ? '#b55e7e' : '#3d8c7d',
                        fontSize: 16,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isNegative ? '-' : '+'}
                      {formatPoints(Math.abs(toNumber(item.amount, 0))).replace('P', '')}P
                    </strong>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="matey-mypage__empty">포인트 내역이 없어요.</div>
          )}
        </MyPagePanel>
      </div>
    </div>
  );
}

export default React.memo(MyPageBillingSection);
