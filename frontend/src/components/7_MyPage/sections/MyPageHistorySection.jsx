import React, { useMemo, useState } from 'react';
import MyPagePanel from '../components/MyPagePanel';

const toArray = (value) => (Array.isArray(value) ? value : []);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(toNumber(value, 0));

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

const normalizeMoodLabel = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return '안정';
  if (['stable', 'calm', 'neutral', 'steady', 'good'].includes(raw)) return '안정';
  if (['happy', 'joy', 'positive'].includes(raw)) return '기쁨';
  if (['anxious', 'anxiety', 'worry', 'stress', 'stressed'].includes(raw)) return '불안';
  if (['sad', 'down', 'depressed'].includes(raw)) return '침잠';
  if (['tired', 'fatigue', 'exhausted'].includes(raw)) return '피로';
  if (['focused', 'focus', 'motivated'].includes(raw)) return '집중';

  return value;
};

const getMoodBadgeStyle = (mood) => {
  const label = normalizeMoodLabel(mood);

  if (label === '불안') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,245,248,0.92))',
      color: '#b55e7e',
      border: '1px solid rgba(213,106,140,0.14)',
    };
  }

  if (label === '기쁨') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,250,244,0.92))',
      color: '#b37a43',
      border: '1px solid rgba(243,177,131,0.16)',
    };
  }

  if (label === '집중') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,252,249,0.92))',
      color: '#3d8c7d',
      border: '1px solid rgba(115,200,184,0.18)',
    };
  }

  if (label === '피로' || label === '침잠') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,245,252,0.92))',
      color: '#6e6488',
      border: '1px solid rgba(141,128,219,0.14)',
    };
  }

  return {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,255,0.92))',
    color: '#5d6ea9',
    border: '1px solid rgba(121,174,232,0.18)',
  };
};

const normalizeTags = (item) => {
  const rawTags = pickFirst(item?.tags, item?.keywords, item?.topics, item?.topicTags, []);
  const arrayTags = Array.isArray(rawTags)
    ? rawTags
    : String(rawTags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

  const moodTag = normalizeMoodLabel(pickFirst(item?.mood, item?.emotion, ''));
  const topicTag = pickFirst(item?.topic, item?.subject, '');

  return [...new Set([...arrayTags, ...(topicTag ? [topicTag] : []), ...(moodTag ? [moodTag] : [])])];
};

const normalizeSessions = (history, recentSessions) => {
  const propSessions = toArray(recentSessions);
  const source =
    propSessions.length > 0
      ? propSessions
      : toArray(
          pickFirst(history?.items, history?.history, history?.sessions, history?.data, [])
        );

  return source.map((item, index) => ({
    id: pickFirst(item?.id, item?.sessionId, item?.counselId, `history-${index}`),
    title: pickFirst(item?.title, item?.topic, item?.subject, '상담 기록'),
    summary: pickFirst(
      item?.summary,
      item?.preview,
      item?.description,
      item?.lastMessage,
      '최근 상담 내용이 여기에 표시됩니다.'
    ),
    mood: normalizeMoodLabel(pickFirst(item?.mood, item?.emotion, item?.statusLabel, '안정')),
    date: pickFirst(item?.date, item?.createdAt, item?.startedAt, item?.time, ''),
    counselor: pickFirst(item?.botName, item?.assistantName, item?.counselor, 'Matey AI'),
    duration: pickFirst(item?.duration, item?.durationText, ''),
    tags: normalizeTags(item),
  }));
};

function MyPageHistorySection({
  history = {},
  recentSessions = [],
  loading = false,
  errorMessage = '',
}) {
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('전체');
  const [sortKey, setSortKey] = useState('latest');
  const [activeTag, setActiveTag] = useState('전체');

  const sessions = useMemo(
    () => normalizeSessions(history, recentSessions),
    [history, recentSessions]
  );

  const moodOptions = useMemo(() => {
    const moods = sessions.map((item) => normalizeMoodLabel(item.mood)).filter(Boolean);
    return ['전체', ...new Set(moods)];
  }, [sessions]);

  const tagOptions = useMemo(() => {
    const tags = sessions.flatMap((item) => toArray(item.tags)).filter(Boolean);
    return ['전체', ...new Set(tags)].slice(0, 12);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    const list = sessions.filter((item) => {
      const matchesQuery =
        !keyword ||
        [
          item.title,
          item.summary,
          item.counselor,
          ...toArray(item.tags),
          normalizeMoodLabel(item.mood),
        ]
          .join(' ')
          .toLowerCase()
          .includes(keyword);

      const matchesMood =
        moodFilter === '전체' || normalizeMoodLabel(item.mood) === normalizeMoodLabel(moodFilter);

      const matchesTag =
        activeTag === '전체' || toArray(item.tags).some((tag) => String(tag) === String(activeTag));

      return matchesQuery && matchesMood && matchesTag;
    });

    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'oldest') {
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      }

      if (sortKey === 'title') {
        return String(a.title).localeCompare(String(b.title), 'ko');
      }

      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    return sorted;
  }, [sessions, query, moodFilter, sortKey, activeTag]);

  const resetFilters = () => {
    setQuery('');
    setMoodFilter('전체');
    setSortKey('latest');
    setActiveTag('전체');
  };

  return (
    <MyPagePanel
      label="History"
      title="상담내역"
      description="지금까지의 상담 기록을 검색하고 감정이나 주제 기준으로 정리해서 볼 수 있어요."
    >
      <div className="matey-mypage__history-toolbar">
        <label className="matey-mypage__history-search">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="상담 제목, 내용, 감정, 태그로 검색"
          />
        </label>

        <div className="matey-mypage__history-filter-grid">
          <label className="matey-mypage__field">
            <span>감정 필터</span>
            <select
              value={moodFilter}
              onChange={(event) => setMoodFilter(event.target.value)}
            >
              {moodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="matey-mypage__field">
            <span>정렬</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title">제목순</option>
            </select>
          </label>

          <div
            className="matey-mypage__summary-item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 86,
            }}
          >
            <span>검색 결과</span>
            <strong>{formatNumber(filteredSessions.length)}건</strong>
          </div>
        </div>

        <div className="matey-mypage__tag-filter-wrap">
          <div className="matey-mypage__tag-filter-head">
            <span>태그 필터</span>
            <button
              type="button"
              className="matey-mypage__filter-reset"
              onClick={resetFilters}
            >
              필터 초기화
            </button>
          </div>

          <div className="matey-mypage__tag-filter-list">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`matey-mypage__tag-filter ${activeTag === tag ? 'is-active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="matey-mypage__history-result">
          전체 <strong>{formatNumber(sessions.length)}건</strong> 중{' '}
          <strong>{formatNumber(filteredSessions.length)}건</strong>이 표시되고 있어요.
        </div>
      </div>

      {loading ? (
        <div className="matey-mypage__empty">상담내역을 불러오는 중이에요.</div>
      ) : errorMessage ? (
        <div className="matey-mypage__empty">{errorMessage}</div>
      ) : filteredSessions.length ? (
        <div className="matey-mypage__history-list">
          {filteredSessions.map((item) => (
            <article key={item.id} className="matey-mypage__history-card">
              <div className="matey-mypage__history-top">
                <div>
                  <span className="matey-mypage__history-date">{formatDate(item.date)}</span>
                  <h3>{item.title}</h3>
                </div>

                <span
                  className="matey-mypage__mood-badge"
                  style={getMoodBadgeStyle(item.mood)}
                >
                  {normalizeMoodLabel(item.mood)}
                </span>
              </div>

              <p>{item.summary}</p>

              <div className="matey-mypage__tag-list">
                <span className="matey-mypage__tag">{item.counselor}</span>
                {item.duration ? (
                  <span className="matey-mypage__tag">{item.duration}</span>
                ) : null}
                {toArray(item.tags)
                  .slice(0, 4)
                  .map((tag) => (
                    <span key={`${item.id}-${tag}`} className="matey-mypage__tag">
                      {tag}
                    </span>
                  ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="matey-mypage__empty">
          현재 조건에 맞는 상담 기록이 없어요. 검색어나 필터를 조금 바꿔서 다시 확인해 보세요.
        </div>
      )}
    </MyPagePanel>
  );
}

export default React.memo(MyPageHistorySection);
