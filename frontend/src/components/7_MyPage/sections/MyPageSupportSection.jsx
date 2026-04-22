import React, { useMemo, useState } from 'react';
import MyPagePanel from '../components/MyPagePanel';

const toArray = (value) => (Array.isArray(value) ? value : []);

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatNumber = (value) =>
  new Intl.NumberFormat('ko-KR').format(toNumber(value, 0));

const formatDate = (value) => {
  if (!value) return '기록 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

const normalizeSupportStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return '접수 가능';
  if (['resolved', 'done', 'complete', 'completed', 'closed'].includes(raw)) return '해결됨';
  if (['answered', 'reply', 'replied'].includes(raw)) return '답변 완료';
  if (['review', 'reviewing', 'in_review', 'pending'].includes(raw)) return '검토중';
  if (['open', 'received', 'created', 'new'].includes(raw)) return '접수됨';

  return value || '접수 가능';
};

const getStatusStyle = (status) => {
  const label = normalizeSupportStatus(status);

  if (label === '해결됨' || label === '답변 완료') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,253,248,0.96))',
      color: '#2f8d74',
      border: '1px solid rgba(115,200,184,0.22)',
    };
  }

  if (label === '검토중') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,249,242,0.96))',
      color: '#b37a43',
      border: '1px solid rgba(243,177,131,0.22)',
    };
  }

  return {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,248,255,0.96))',
    color: '#5d6ea9',
    border: '1px solid rgba(121,174,232,0.22)',
  };
};

const normalizeSupportItems = (support) => {
  const rawItems = pickFirst(
    support?.items,
    support?.history,
    support?.supportHistory,
    support?.tickets,
    support?.supportItems,
    []
  );

  const list = toArray(rawItems).map((item, index) => {
    const raw = isObject(item) ? item : {};

    return {
      id: pickFirst(raw.id, raw.ticketId, raw.supportId, `support-${index}`),
      title: pickFirst(raw.title, raw.subject, raw.name, '문의 제목'),
      content: pickFirst(
        raw.content,
        raw.description,
        raw.message,
        raw.summary,
        '문의 내용이 여기에 표시됩니다.'
      ),
      category: pickFirst(raw.category, raw.type, '일반 문의'),
      status: normalizeSupportStatus(
        pickFirst(raw.status, raw.state, raw.progress, '접수됨')
      ),
      date: pickFirst(raw.date, raw.createdAt, raw.updatedAt, ''),
    };
  });

  return list;
};

const normalizeFaqItems = (support) => {
  const rawFaq = pickFirst(
    support?.faqItems,
    support?.faq,
    support?.faqs,
    support?.helpItems,
    []
  );

  const list = toArray(rawFaq).map((item, index) => {
    const raw = isObject(item) ? item : {};

    return {
      id: pickFirst(raw.id, `faq-${index}`),
      question: pickFirst(raw.question, raw.title, '자주 묻는 질문'),
      answer: pickFirst(
        raw.answer,
        raw.description,
        raw.content,
        '관련 안내가 여기에 표시됩니다.'
      ),
    };
  });

  if (list.length) return list;

  return [
    {
      id: 'faq-1',
      question: '구독 결제일은 어디서 확인하나요?',
      answer: '결제 · 포인트 탭에서 다음 결제일과 결제수단 정보를 확인할 수 있어요.',
    },
    {
      id: 'faq-2',
      question: '상담 기록은 어떻게 검색하나요?',
      answer: '상담내역 탭에서 검색창과 감정/태그 필터를 이용해 빠르게 찾을 수 있어요.',
    },
    {
      id: 'faq-3',
      question: '알림 설정은 어디서 바꾸나요?',
      answer: '설정 탭에서 이메일, 푸시, 마케팅 알림 여부를 변경할 수 있어요.',
    },
  ];
};

function MyPageSupportSection({
  support = {},
  profile = {},
  loading = false,
  errorMessage = '',
  onSubmitSupport,
  onRefreshSupport,
}) {
  const supportItems = useMemo(() => normalizeSupportItems(support), [support]);
  const faqItems = useMemo(() => normalizeFaqItems(support), [support]);

  const [form, setForm] = useState({
    category: '일반 문의',
    title: '',
    content: '',
    email: pickFirst(profile?.email, profile?.accountEmail, ''),
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalCount = useMemo(
    () =>
      toNumber(
        pickFirst(support?.totalCount, support?.count, supportItems.length, 0),
        supportItems.length
      ),
    [support, supportItems]
  );

  const resolvedCount = useMemo(
    () =>
      supportItems.filter((item) =>
        ['해결됨', '답변 완료'].includes(normalizeSupportStatus(item.status))
      ).length,
    [supportItems]
  );

  const latestStatus = useMemo(
    () =>
      pickFirst(
        support?.latestStatus,
        supportItems[0]?.status,
        '접수 가능'
      ),
    [support, supportItems]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: '전체 문의',
        value: `${formatNumber(totalCount)}건`,
        helper: '지금까지 남긴 지원 요청',
      },
      {
        label: '해결 완료',
        value: `${formatNumber(resolvedCount)}건`,
        helper: '응답이 끝난 문의',
      },
      {
        label: '최근 상태',
        value: normalizeSupportStatus(latestStatus),
        helper: '가장 최근 문의 기준',
      },
      {
        label: 'FAQ',
        value: `${formatNumber(faqItems.length)}개`,
        helper: '빠르게 확인 가능한 도움말',
      },
    ],
    [totalCount, resolvedCount, latestStatus, faqItems.length]
  );

  const handleChange = (key) => (event) => {
    const nextValue = event?.target?.value ?? '';
    setSubmitted(false);
    setForm((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitted(false);

    try {
      if (typeof onSubmitSupport === 'function') {
        await onSubmitSupport({
          category: form.category,
          title: form.title,
          content: form.content,
          email: form.email,
        });
      }

      setSubmitted(true);
      setForm((prev) => ({
        ...prev,
        title: '',
        content: '',
      }));

      if (typeof onRefreshSupport === 'function') {
        await onRefreshSupport();
      }
    } catch (error) {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <MyPagePanel
        label="Support"
        title="지원"
        description="문의 내역과 자주 묻는 질문, 새 문의 작성 영역을 한곳에서 확인할 수 있어요."
      >
        {loading ? (
          <div className="matey-mypage__empty">지원 정보를 불러오는 중이에요.</div>
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
                <small>{card.helper}</small>
              </article>
            ))}
          </div>
        )}
      </MyPagePanel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, 0.92fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Support History"
          title="최근 문의 내역"
          description="남긴 문의의 진행 상태를 빠르게 확인할 수 있어요."
          smallHead
        >
          {supportItems.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {supportItems.slice(0, 4).map((item) => (
                <article
                  key={item.id}
                  className="matey-mypage__history-card"
                  style={{ padding: 18 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 14,
                      marginBottom: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <span className="matey-mypage__history-date">
                        {formatDate(item.date)}
                      </span>
                      <h3
                        style={{
                          margin: 0,
                          color: 'var(--matey-mypage-title)',
                          fontSize: 20,
                        }}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <span
                      className="matey-mypage__mood-badge"
                      style={getStatusStyle(item.status)}
                    >
                      {normalizeSupportStatus(item.status)}
                    </span>
                  </div>

                  <p>{item.content}</p>

                  <div className="matey-mypage__tag-list">
                    <span className="matey-mypage__tag">{item.category}</span>
                    <span className="matey-mypage__tag">{formatDate(item.date)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="matey-mypage__empty">최근 문의 내역이 없어요.</div>
          )}
        </MyPagePanel>

        <MyPagePanel
          label="FAQ"
          title="자주 묻는 질문"
          description="빠르게 해결 가능한 질문들을 먼저 확인해 보세요."
          smallHead
        >
          {faqItems.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {faqItems.map((item) => (
                <article
                  key={item.id}
                  style={{
                    padding: '16px 16px 15px',
                    borderRadius: 18,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(251,250,255,0.82))',
                    border: '1px solid rgba(123,104,189,0.08)',
                    boxShadow: 'var(--matey-mypage-shadow-soft)',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      color: 'var(--matey-mypage-title)',
                      fontSize: 15,
                    }}
                  >
                    {item.question}
                  </strong>

                  <p
                    style={{
                      margin: '8px 0 0',
                      color: 'var(--matey-mypage-text-soft)',
                      fontSize: 14,
                    }}
                  >
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="matey-mypage__empty">표시할 FAQ가 없어요.</div>
          )}
        </MyPagePanel>
      </div>

      <MyPagePanel
        label="New Request"
        title="새 문의 작성"
        description="궁금한 점이나 문제 상황을 남기면 확인 후 순서대로 안내해 드려요."
        smallHead
      >
        <form className="matey-mypage__form" onSubmit={handleSubmit}>
          <div className="matey-mypage__form-grid">
            <label className="matey-mypage__field">
              <span>문의 유형</span>
              <select value={form.category} onChange={handleChange('category')}>
                <option value="일반 문의">일반 문의</option>
                <option value="계정 문의">계정 문의</option>
                <option value="결제 문의">결제 문의</option>
                <option value="오류 신고">오류 신고</option>
                <option value="기능 제안">기능 제안</option>
              </select>
            </label>

            <label className="matey-mypage__field">
              <span>답변 받을 이메일</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="example@matey.ai"
              />
            </label>

            <label className="matey-mypage__field matey-mypage__field--full">
              <span>문의 제목</span>
              <input
                type="text"
                value={form.title}
                onChange={handleChange('title')}
                placeholder="문의 제목을 입력하세요"
              />
            </label>

            <label className="matey-mypage__field matey-mypage__field--full">
              <span>문의 내용</span>
              <textarea
                value={form.content}
                onChange={handleChange('content')}
                placeholder="문제 상황이나 궁금한 점을 자세히 적어주세요."
              />
            </label>
          </div>

          <div className="matey-mypage__panel-actions">
            <button
              type="submit"
              className="matey-mypage__primary-button"
              disabled={submitting}
            >
              {submitting ? '등록 중...' : '문의 등록'}
            </button>

            {submitted ? (
              <p className="matey-mypage__success-text">
                문의가 정상적으로 등록되었어요.
              </p>
            ) : null}
          </div>
        </form>
      </MyPagePanel>
    </div>
  );
}

export default React.memo(MyPageSupportSection);
