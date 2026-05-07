import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './HowToUsePage.module.css';
import { useAuth } from '../contexts/AuthContext';

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
  },
];

export default function HowToUsePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, authLoading } = useAuth();
  const loggedIn = isAuthenticated || !!user;

  const handleInquiryShortcut = () => {
    if (authLoading) return;
    if (!loggedIn) {
      window.alert('문의 작성은 로그인이 필요합니다. 로그인 후 이용해 주세요.');
      navigate('/login', { state: { from: '/community/inquiry' } });
      return;
    }
    navigate('/community/inquiry');
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

            <div className={styles.shortcuts} aria-label="바로가기">
              <p className={styles.shortcutsLabel}>바로가기</p>
              <div className={styles.shortcutsRow}>
                <Link to="/signup" className={`${styles.shortcutChip} ${styles.shortcutPrimary}`}>
                  무료체험 시작
                </Link>
                <Link to="/community/notices" className={`${styles.shortcutChip} ${styles.shortcutPrimary}`}>
                  공지·이벤트 보기
                </Link>
                <Link to="/login" state={{ from: '/features' }} className={styles.shortcutChip}>
                  로그인
                </Link>
                <Link to="/community/faq" className={styles.shortcutChip}>
                  FAQ
                </Link>
                <button type="button" className={styles.shortcutChip} onClick={handleInquiryShortcut}>
                  문의
                </button>
              </div>
            </div>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroBlob} />
            <div className={styles.heroMascots}>
              <img className={styles.mascot} src="/images/mascots/cat.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotLift}`} src="/images/mascots/bear.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotRight}`} src="/images/mascots/dog.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotSmall}`} src="/images/mascots/hamster.png" alt="" />
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
          </article>
        ))}
      </section>
    </main>
  );
}

