import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MyPage.css';

const DEFAULT_HISTORY = [
  {
    id: 1,
    title: '불안한 하루 정리하기',
    date: '2026-04-02',
    time: '09:20',
    mood: '불안',
    summary:
      '오늘 해야 할 일과 마음의 부담을 함께 정리하며, 우선순위를 작게 나누는 방식으로 대화를 진행했어요.',
    tags: ['일상', '불안', '루틴'],
  },
  {
    id: 2,
    title: '대인관계 스트레스 상담',
    date: '2026-04-01',
    time: '21:10',
    mood: '복합',
    summary:
      '친구와의 관계에서 느낀 서운함을 정리하고, 바로 감정을 쏟아내기보다 상황을 구분해서 말하는 연습을 했어요.',
    tags: ['대인관계', '스트레스', '감정표현'],
  },
  {
    id: 3,
    title: '자기 전 감정 정리',
    date: '2026-03-30',
    time: '23:42',
    mood: '우울',
    summary:
      '하루 동안 쌓인 피로와 무기력감을 정리하면서, 잠들기 전 스스로를 다정하게 대하는 문장을 함께 만들었어요.',
    tags: ['수면', '우울', '회복'],
  },
  {
    id: 4,
    title: '진로 고민 상담',
    date: '2026-03-28',
    time: '14:05',
    mood: '걱정',
    summary:
      '진로 선택에 대한 압박을 이야기하고, 지금 당장 결정해야 하는 것과 천천히 탐색해도 되는 것을 구분했어요.',
    tags: ['진로', '고민', '정리'],
  },
  {
    id: 5,
    title: '주말 루틴 다시 세우기',
    date: '2026-03-25',
    time: '11:30',
    mood: '안정',
    summary:
      '흐트러진 생활 패턴을 다시 맞추기 위해 작은 습관 단위로 계획을 나누고, 스스로를 압박하지 않는 방식을 찾았어요.',
    tags: ['루틴', '생활습관', '회복'],
  },
];

const DEFAULT_SETTINGS = {
  emailNotice: true,
  marketingNotice: false,
  emotionReport: true,
  weeklySummary: true,
  privateProfile: false,
  simpleMode: false,
};

function formatJoinDate(rawDate) {
  if (!rawDate) return '2026.03.01';
  return String(rawDate).replaceAll('-', '.');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function MyPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { user, logout } = auth;

  const initialProfile = useMemo(
    () => ({
      nickname:
        user?.nickname ||
        user?.name ||
        user?.username ||
        user?.email?.split('@')?.[0] ||
        '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio:
        user?.bio ||
        '메이티와 함께 하루의 감정을 차분하게 정리하고 있어요.',
    }),
    [user]
  );

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(initialProfile);
  const [profileMessage, setProfileMessage] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyMood, setHistoryMood] = useState('ALL');
  const [historyTag, setHistoryTag] = useState('ALL');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem('matey_mypage_profile');
    const savedSettings = window.localStorage.getItem('matey_mypage_settings');

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch (error) {
        console.error(error);
      }
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  const historyItems = useMemo(() => {
    const savedHistory = window.localStorage.getItem('matey_chat_history');

    if (!savedHistory) {
      return DEFAULT_HISTORY;
    }

    try {
      const parsed = JSON.parse(savedHistory);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_HISTORY;
    } catch (error) {
      console.error(error);
      return DEFAULT_HISTORY;
    }
  }, []);

  const availableTags = useMemo(() => {
    const tagSet = new Set();

    historyItems.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (tag) tagSet.add(tag);
        });
      }
    });

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [historyItems]);

  const filteredHistory = useMemo(() => {
    const keyword = normalizeText(historySearch);

    return historyItems.filter((item) => {
      const itemDate = String(item.date || '');
      const searchableText = [
        item.title,
        item.summary,
        item.mood,
        item.date,
        item.time,
        ...(Array.isArray(item.tags) ? item.tags : []),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesMood = historyMood === 'ALL' || item.mood === historyMood;
      const matchesTag =
        historyTag === 'ALL' ||
        (Array.isArray(item.tags) && item.tags.includes(historyTag));
      const matchesStartDate = !historyStartDate || itemDate >= historyStartDate;
      const matchesEndDate = !historyEndDate || itemDate <= historyEndDate;

      return (
        matchesSearch &&
        matchesMood &&
        matchesTag &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    historyItems,
    historySearch,
    historyMood,
    historyTag,
    historyStartDate,
    historyEndDate,
  ]);

  const totalCounselCount = historyItems.length;
  const latestCounselDate = historyItems[0]?.date || '-';

  const favoriteMood =
    historyItems.reduce((acc, item) => {
      acc[item.mood] = (acc[item.mood] || 0) + 1;
      return acc;
    }, {}) || {};

  const dominantMood =
    Object.entries(favoriteMood).sort((a, b) => b[1] - a[1])[0]?.[0] || '안정';

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    setProfileMessage('');
  };

  const handleProfileSave = (event) => {
    event.preventDefault();

    const nextUser = {
      ...(user || {}),
      nickname: profile.nickname.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      bio: profile.bio.trim(),
    };

    window.localStorage.setItem(
      'matey_mypage_profile',
      JSON.stringify({
        nickname: nextUser.nickname,
        email: nextUser.email,
        phone: nextUser.phone,
        bio: nextUser.bio,
      })
    );

    window.localStorage.setItem('mateyUser', JSON.stringify(nextUser));
    window.localStorage.setItem('user', JSON.stringify(nextUser));

    if (typeof auth.setUser === 'function') {
      auth.setUser(nextUser);
    }

    setProfileMessage('프로필 정보가 저장되었어요.');
  };

  const handleSettingToggle = (key) => {
    const nextSettings = {
      ...settings,
      [key]: !settings[key],
    };

    setSettings(nextSettings);
    window.localStorage.setItem(
      'matey_mypage_settings',
      JSON.stringify(nextSettings)
    );
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordMessage('');
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMessage('현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage('새 비밀번호는 8자 이상으로 입력해 주세요.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('새 비밀번호 확인이 일치하지 않아요.');
      return;
    }

    setPasswordMessage('비밀번호가 변경되었다고 가정하고 테스트용으로 반영했어요.');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const resetHistoryFilters = () => {
    setHistorySearch('');
    setHistoryMood('ALL');
    setHistoryTag('ALL');
    setHistoryStartDate('');
    setHistoryEndDate('');
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
      } else {
        window.localStorage.removeItem('matey_access_token');
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('mateyToken');
        window.localStorage.removeItem('mateyUser');
        window.localStorage.removeItem('user');
      }
    } catch (error) {
      console.error(error);
    } finally {
      navigate('/');
    }
  };

  return (
    <main className="matey-mypage">
      <section className="matey-mypage__hero">
        <div className="matey-mypage__hero-copy">
          <span className="matey-mypage__eyebrow">MY PAGE</span>
          <h1>내 기록과 설정을 한 번에 관리해요</h1>
          <p>
            프로필 편집, 상담 이력 확인, 개인 설정 변경까지 메이티 사용에 필요한
            정보를 한 곳에서 정리할 수 있어요.
          </p>

          <div className="matey-mypage__hero-actions">
            <button
              type="button"
              className={`matey-mypage__tab-chip ${
                activeTab === 'profile' ? 'is-active' : ''
              }`}
              onClick={() => setActiveTab('profile')}
            >
              프로필 편집
            </button>
            <button
              type="button"
              className={`matey-mypage__tab-chip ${
                activeTab === 'history' ? 'is-active' : ''
              }`}
              onClick={() => setActiveTab('history')}
            >
              상담 이력
            </button>
            <button
              type="button"
              className={`matey-mypage__tab-chip ${
                activeTab === 'settings' ? 'is-active' : ''
              }`}
              onClick={() => setActiveTab('settings')}
            >
              설정
            </button>
          </div>
        </div>

        <div className="matey-mypage__hero-card">
          <div className="matey-mypage__profile-head">
            <div className="matey-mypage__avatar">
              {(profile.nickname || 'M').charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{profile.nickname || '메이티 사용자'}</strong>
              <span>{profile.email || '이메일 정보 없음'}</span>
            </div>
          </div>

          <div className="matey-mypage__summary-grid">
            <article className="matey-mypage__summary-item">
              <span>누적 상담</span>
              <strong>{totalCounselCount}회</strong>
            </article>
            <article className="matey-mypage__summary-item">
              <span>최근 상담일</span>
              <strong>{latestCounselDate}</strong>
            </article>
            <article className="matey-mypage__summary-item">
              <span>주요 감정</span>
              <strong>{dominantMood}</strong>
            </article>
            <article className="matey-mypage__summary-item">
              <span>가입일</span>
              <strong>{formatJoinDate(user?.createdAt)}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="matey-mypage__content">
        <aside className="matey-mypage__sidebar">
          <button
            type="button"
            className={`matey-mypage__sidebar-link ${
              activeTab === 'profile' ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <span>프로필 편집</span>
            <small>닉네임 · 이메일 · 소개 문구</small>
          </button>

          <button
            type="button"
            className={`matey-mypage__sidebar-link ${
              activeTab === 'history' ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab('history')}
          >
            <span>상담 이력</span>
            <small>날짜 범위 · 태그 · 검색 필터</small>
          </button>

          <button
            type="button"
            className={`matey-mypage__sidebar-link ${
              activeTab === 'settings' ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab('settings')}
          >
            <span>설정</span>
            <small>알림 · 보안 · 사용 환경</small>
          </button>

          <div className="matey-mypage__sidebar-card">
            <strong>빠른 이동</strong>
            <Link to="/download">다운로드 페이지</Link>
            <Link to="/">홈으로 이동</Link>
            <button
              type="button"
              className="matey-mypage__logout-button"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </aside>

        <div className="matey-mypage__main">
          {activeTab === 'profile' && (
            <section className="matey-mypage__panel">
              <div className="matey-mypage__panel-head">
                <div>
                  <span className="matey-mypage__section-label">PROFILE EDIT</span>
                  <h2>프로필 편집</h2>
                </div>
              </div>

              <form className="matey-mypage__form" onSubmit={handleProfileSave}>
                <div className="matey-mypage__form-grid">
                  <label className="matey-mypage__field">
                    <span>닉네임</span>
                    <input
                      type="text"
                      name="nickname"
                      value={profile.nickname}
                      onChange={handleProfileChange}
                      placeholder="닉네임을 입력해 주세요"
                    />
                  </label>

                  <label className="matey-mypage__field">
                    <span>이메일</span>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      placeholder="이메일을 입력해 주세요"
                    />
                  </label>

                  <label className="matey-mypage__field">
                    <span>연락처</span>
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="연락처를 입력해 주세요"
                    />
                  </label>

                  <div className="matey-mypage__field matey-mypage__field--readonly">
                    <span>계정 권한</span>
                    <div className="matey-mypage__readonly-box">
                      {String(user?.role || user?.roles?.[0] || 'USER').toUpperCase()}
                    </div>
                  </div>
                </div>

                <label className="matey-mypage__field">
                  <span>소개 문구</span>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleProfileChange}
                    rows={5}
                    placeholder="나를 소개하는 한 줄을 적어 보세요"
                  />
                </label>

                <div className="matey-mypage__panel-actions">
                  <button type="submit" className="matey-mypage__primary-button">
                    저장하기
                  </button>
                  {profileMessage ? (
                    <p className="matey-mypage__success-text">{profileMessage}</p>
                  ) : null}
                </div>
              </form>
            </section>
          )}

          {activeTab === 'history' && (
            <section className="matey-mypage__panel">
              <div className="matey-mypage__panel-head">
                <div>
                  <span className="matey-mypage__section-label">COUNSEL HISTORY</span>
                  <h2>상담 이력</h2>
                </div>
              </div>

              <div className="matey-mypage__history-toolbar">
                <div className="matey-mypage__history-search">
                  <label className="matey-mypage__field">
                    <span>검색</span>
                    <input
                      type="search"
                      value={historySearch}
                      onChange={(event) => setHistorySearch(event.target.value)}
                      placeholder="제목, 요약, 감정, 태그로 검색"
                    />
                  </label>
                </div>

                <div className="matey-mypage__history-filter-grid">
                  <label className="matey-mypage__field">
                    <span>감정 필터</span>
                    <select
                      value={historyMood}
                      onChange={(event) => setHistoryMood(event.target.value)}
                    >
                      <option value="ALL">전체 감정</option>
                      <option value="불안">불안</option>
                      <option value="복합">복합</option>
                      <option value="우울">우울</option>
                      <option value="걱정">걱정</option>
                      <option value="안정">안정</option>
                    </select>
                  </label>

                  <label className="matey-mypage__field">
                    <span>시작일</span>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(event) => setHistoryStartDate(event.target.value)}
                    />
                  </label>

                  <label className="matey-mypage__field">
                    <span>종료일</span>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(event) => setHistoryEndDate(event.target.value)}
                    />
                  </label>
                </div>

                <div className="matey-mypage__tag-filter-wrap">
                  <div className="matey-mypage__tag-filter-head">
                    <span>태그 필터</span>
                    <button
                      type="button"
                      className="matey-mypage__filter-reset"
                      onClick={resetHistoryFilters}
                    >
                      필터 초기화
                    </button>
                  </div>

                  <div className="matey-mypage__tag-filter-list">
                    <button
                      type="button"
                      className={`matey-mypage__tag-filter ${
                        historyTag === 'ALL' ? 'is-active' : ''
                      }`}
                      onClick={() => setHistoryTag('ALL')}
                    >
                      전체
                    </button>

                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`matey-mypage__tag-filter ${
                          historyTag === tag ? 'is-active' : ''
                        }`}
                        onClick={() => setHistoryTag(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="matey-mypage__history-result">
                  총 <strong>{filteredHistory.length}</strong>개의 상담 이력이 검색되었어요.
                </div>
              </div>

              <div className="matey-mypage__history-list">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <article key={item.id} className="matey-mypage__history-card">
                      <div className="matey-mypage__history-top">
                        <div>
                          <span className="matey-mypage__history-date">
                            {item.date} · {item.time}
                          </span>
                          <h3>{item.title}</h3>
                        </div>

                        <span className="matey-mypage__mood-badge">{item.mood}</span>
                      </div>

                      <p>{item.summary}</p>

                      <div className="matey-mypage__tag-list">
                        {item.tags?.map((tag) => (
                          <span key={`${item.id}-${tag}`} className="matey-mypage__tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="matey-mypage__empty">
                    검색 조건에 맞는 상담 이력이 없어요.
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="matey-mypage__panel">
              <div className="matey-mypage__panel-head">
                <div>
                  <span className="matey-mypage__section-label">SETTINGS</span>
                  <h2>설정</h2>
                </div>
              </div>

              <div className="matey-mypage__settings-group">
                <article className="matey-mypage__setting-card">
                  <div>
                    <strong>이메일 알림</strong>
                    <p>중요한 계정 알림과 안내 메일을 받아요.</p>
                  </div>
                  <button
                    type="button"
                    className={`matey-mypage__toggle ${
                      settings.emailNotice ? 'is-on' : ''
                    }`}
                    onClick={() => handleSettingToggle('emailNotice')}
                  >
                    <span />
                  </button>
                </article>

                <article className="matey-mypage__setting-card">
                  <div>
                    <strong>주간 요약 리포트</strong>
                    <p>한 주의 상담 요약과 감정 흐름을 정리해서 확인해요.</p>
                  </div>
                  <button
                    type="button"
                    className={`matey-mypage__toggle ${
                      settings.weeklySummary ? 'is-on' : ''
                    }`}
                    onClick={() => handleSettingToggle('weeklySummary')}
                  >
                    <span />
                  </button>
                </article>

                <article className="matey-mypage__setting-card">
                  <div>
                    <strong>감정 분석 결과 표시</strong>
                    <p>상담 이후 감정 키워드와 분석 결과를 함께 보여줘요.</p>
                  </div>
                  <button
                    type="button"
                    className={`matey-mypage__toggle ${
                      settings.emotionReport ? 'is-on' : ''
                    }`}
                    onClick={() => handleSettingToggle('emotionReport')}
                  >
                    <span />
                  </button>
                </article>

                <article className="matey-mypage__setting-card">
                  <div>
                    <strong>프로필 비공개</strong>
                    <p>프로필 정보를 최소한으로 표시해 개인 정보 노출을 줄여요.</p>
                  </div>
                  <button
                    type="button"
                    className={`matey-mypage__toggle ${
                      settings.privateProfile ? 'is-on' : ''
                    }`}
                    onClick={() => handleSettingToggle('privateProfile')}
                  >
                    <span />
                  </button>
                </article>

                <article className="matey-mypage__setting-card">
                  <div>
                    <strong>간단 모드</strong>
                    <p>시각 요소를 줄이고 더 단정한 화면으로 사용해요.</p>
                  </div>
                  <button
                    type="button"
                    className={`matey-mypage__toggle ${
                      settings.simpleMode ? 'is-on' : ''
                    }`}
                    onClick={() => handleSettingToggle('simpleMode')}
                  >
                    <span />
                  </button>
                </article>

                <article className="matey-mypage__setting-card">
                  <div>
                    <strong>마케팅 정보 수신</strong>
                    <p>업데이트, 이벤트, 새 기능 안내를 받아요.</p>
                  </div>
                  <button
                    type="button"
                    className={`matey-mypage__toggle ${
                      settings.marketingNotice ? 'is-on' : ''
                    }`}
                    onClick={() => handleSettingToggle('marketingNotice')}
                  >
                    <span />
                  </button>
                </article>
              </div>

              <div className="matey-mypage__security-box">
                <div className="matey-mypage__panel-head matey-mypage__panel-head--small">
                  <div>
                    <span className="matey-mypage__section-label">SECURITY</span>
                    <h3>비밀번호 변경</h3>
                  </div>
                </div>

                <form className="matey-mypage__form" onSubmit={handlePasswordSubmit}>
                  <div className="matey-mypage__form-grid">
                    <label className="matey-mypage__field">
                      <span>현재 비밀번호</span>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="현재 비밀번호"
                      />
                    </label>

                    <label className="matey-mypage__field">
                      <span>새 비밀번호</span>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="새 비밀번호"
                      />
                    </label>

                    <label className="matey-mypage__field matey-mypage__field--full">
                      <span>새 비밀번호 확인</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="새 비밀번호를 한 번 더 입력해 주세요"
                      />
                    </label>
                  </div>

                  <div className="matey-mypage__panel-actions">
                    <button type="submit" className="matey-mypage__primary-button">
                      비밀번호 변경
                    </button>
                    {passwordMessage ? (
                      <p className="matey-mypage__success-text">{passwordMessage}</p>
                    ) : null}
                  </div>
                </form>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default MyPage;
