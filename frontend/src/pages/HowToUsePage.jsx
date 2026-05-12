import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './HowToUsePage.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useChatModal } from '../contexts/ChatModalContext';

const SECTIONS = [
  {
    eyebrow: 'START',
    title: '1) 회원가입/로그인',
    iconLabel: '계정',
    icon: '👤',
    items: [
      '처음 이용하신다면 회원가입 후 로그인해 주세요.',
      '로그인 후에는 상담(채팅)을 이용하실 수 있어요.',
    ],
    actions: [
      { key: 'signup', label: '회원가입', to: '/signup', variant: 'primary' },
      { key: 'login', label: '로그인', to: '/login', state: { from: '/features' }, variant: 'secondary' },
    ],
  },
  {
    eyebrow: 'CHAT',
    title: '2) 상담(채팅) 시작하기',
    iconLabel: '상담',
    icon: '💬',
    items: [
      '헤더의 “채팅하기”를 누르면 상담 모달이 열립니다.',
      '왼쪽에서 대화방을 선택하고, 오른쪽에서 상담을 진행해 주세요.',
      '대화 내용은 기록으로 저장됩니다.',
    ],
    actions: [{ key: 'chat', label: '채팅하기', kind: 'chat', variant: 'primary' }],
  },
  {
    eyebrow: 'NOTICES',
    title: '3) 공지·이벤트 확인',
    iconLabel: '공지',
    icon: '📣',
    items: [
      '공지 탭에서 운영 공지와 이벤트 소식을 함께 확인하실 수 있어요.',
      '필요한 경우, 커뮤니티에서 관련 글을 확인할 수 있습니다.',
    ],
    actions: [{ key: 'notices', label: '공지·이벤트 보기', to: '/community/notices', variant: 'primary' }],
  },
  {
    eyebrow: 'HELP',
    title: '4) FAQ·문의',
    iconLabel: '도움말',
    icon: '❓',
    items: [
      '자주 묻는 질문은 FAQ에서 빠르게 확인하실 수 있어요.',
      '문제가 해결되지 않으면 커뮤니티의 문의 페이지에 남겨 주세요.',
    ],
    actions: [
      { key: 'faq', label: 'FAQ 보기', to: '/community/faq', variant: 'primary' },
      { key: 'inquiry', label: '문의하기', kind: 'inquiry', variant: 'secondary' },
    ],
  },
];

export default function HowToUsePage() {
  const navigate = useNavigate();
  const { openChat } = useChatModal();
  const { isAuthenticated, user, authLoading } = useAuth();
  const loggedIn = isAuthenticated || !!user;

  const handleInquiryClick = () => {
    if (authLoading) return;
    if (!loggedIn) {
      window.alert('문의 작성은 로그인이 필요합니다. 로그인 후 이용해 주세요.');
      navigate('/login', { state: { from: '/community/inquiry' } });
      return;
    }
    navigate('/community/inquiry');
  };

  const handleChatClick = () => {
    if (authLoading) return;
    if (loggedIn) {
      openChat();
      return;
    }
    navigate('/signup');
  };

  const renderAction = (a) => {
    const cls =
      a.variant === 'primary' ? styles.cardActionPrimary : styles.cardActionSecondary;

    if (a.kind === 'chat') {
      return (
        <button key={a.key} type="button" className={cls} onClick={handleChatClick}>
          {a.label}
        </button>
      );
    }
    if (a.kind === 'inquiry') {
      return (
        <button key={a.key} type="button" className={cls} onClick={handleInquiryClick}>
          {a.label}
        </button>
      );
    }
    return (
      <Link key={a.key} to={a.to} state={a.state} className={cls}>
        {a.label}
      </Link>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>HOW TO USE</p>
            <h1 className={styles.title}>메이티 이용방법</h1>
            <p className={styles.subtitle}>
              처음 방문하신 분도 바로 시작하실 수 있도록, 메이티의 기본 이용 흐름을 정리했습니다.
            </p>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroBlob} />
            <div className={styles.heroMascots}>
              <div className={styles.heroMascotsCluster}>
                <img
                  className={`${styles.mascot} ${styles.mascotClusterA}`}
                  src="/images/mascots/cat/cat.png"
                  alt=""
                />
                <img
                  className={`${styles.mascot} ${styles.mascotClusterB}`}
                  src="/images/mascots/dog/dog.png"
                  alt=""
                />
                <img
                  className={`${styles.mascot} ${styles.mascotClusterC}`}
                  src="/images/mascots/bear/bear.png"
                  alt=""
                />
              </div>
            </div>

            <svg className={styles.heroLines} viewBox="0 0 520 260" fill="none">
              <path
                d="M30 190C120 120 150 210 240 150C330 90 360 180 490 70"
                stroke="rgba(141,121,255,0.35)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M24 210C110 145 170 230 262 170C354 110 392 208 500 96"
                stroke="rgba(121,183,255,0.28)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="490" cy="70" r="10" fill="rgba(255,147,183,0.55)" />
              <circle cx="240" cy="150" r="9" fill="rgba(121,183,255,0.55)" />
              <circle cx="30" cy="190" r="9" fill="rgba(141,121,255,0.55)" />
            </svg>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        {SECTIONS.map((s) => (
          <article key={s.title} className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardIcon} aria-label={s.iconLabel} title={s.iconLabel}>
                {s.icon}
              </div>
              <div className={styles.cardHeadText}>
                <p className={styles.cardEyebrow}>{s.eyebrow}</p>
                <h2 className={styles.cardTitle}>{s.title}</h2>
              </div>
            </div>
            <ul className={styles.list}>
              {s.items.map((t) => (
                <li key={t} className={styles.listItem}>
                  {t}
                </li>
              ))}
            </ul>
            {s.actions?.length > 0 && (
              <div className={styles.cardActions}>{s.actions.map(renderAction)}</div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
