/**
 * =========================================================
 * 파일명 : src/components/2_Footer/Footer.jsx
 * 역할   : 사이트 전체 공통 Footer (브랜드 / 링크 / 저작권)
 * =========================================================
 * - 홈 전용 마무리 CTA 카드는 pages/HomeClosingCta.jsx 로 분리
 * - 계정 링크는 로그인 여부에 따라 분기
 */

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Footer.css';

const FOOTER_COPY = {
  brandTitle: 'Matey',
  brandDescription:
    '부담 없이 시작하고, 편하게 이어가고, 필요한 순간 다시 찾아볼 수 있는 AI 대화 메이트 서비스예요.',
};

const SERVICE_LINKS = [
  { label: '이용 방법', type: 'section', value: 'features' },
  { label: 'FAQ', type: 'section', value: 'faq' },
  { label: '커뮤니티', type: 'route', value: '/community' },
  { label: '봇랭킹', type: 'route', value: '/bot-ranking' },
];

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, authLoading } = useAuth();

  const accountLinks = useMemo(() => {
    if (authLoading) {
      return [
        { label: '로그인', type: 'route', value: '/login' },
        { label: '회원가입', type: 'route', value: '/signup' },
        { label: '무료체험', type: 'route', value: '/free-trial' },
      ];
    }
    if (isAuthenticated) {
      return [
        { label: '마이페이지', type: 'route', value: '/mypage' },
        { label: '무료체험', type: 'route', value: '/free-trial' },
      ];
    }
    return [
      { label: '로그인', type: 'route', value: '/login' },
      { label: '회원가입', type: 'route', value: '/signup' },
      { label: '무료체험', type: 'route', value: '/free-trial' },
    ];
  }, [isAuthenticated, authLoading]);

  const linkGroups = useMemo(
    () => [
      { title: '서비스', links: SERVICE_LINKS },
      { title: '계정', links: accountLinks },
    ],
    [accountLinks]
  );

  const moveToSection = (sectionId) => {
    if (location.pathname === '/') {
      const target = document.getElementById(sectionId);
      if (target) {
        const offset = -96;
        const top =
          target.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }
    }

    navigate(`/#${sectionId}`);
  };

  const handleMove = (type, value) => {
    if (type === 'route') {
      navigate(value);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (type === 'section') {
      moveToSection(value);
    }
  };

  const handleBrandClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="matey-footer" aria-label="사이트 푸터">
      <div className="matey-footer__background" aria-hidden="true">
        <span className="matey-footer__glow matey-footer__glow--top" />
        <span className="matey-footer__glow matey-footer__glow--bottom" />
      </div>

      <div className="matey-footer__inner">
        <div className="matey-footer__main">
          <div className="matey-footer__brand">
            <button
              type="button"
              className="matey-footer__brand-mark"
              onClick={handleBrandClick}
              aria-label="메이티 홈으로 이동"
            >
              <span className="matey-footer__brand-badge">M</span>
              <span className="matey-footer__brand-text">
                {FOOTER_COPY.brandTitle}
              </span>
            </button>

            <p className="matey-footer__brand-description">
              {FOOTER_COPY.brandDescription}
            </p>
          </div>

          <nav className="matey-footer__nav" aria-label="푸터 링크 그룹">
            {linkGroups.map((group) => (
              <div key={group.title} className="matey-footer__group">
                <h3 className="matey-footer__group-title">{group.title}</h3>

                <ul className="matey-footer__group-list">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`} className="matey-footer__group-item">
                      <button
                        type="button"
                        className="matey-footer__link"
                        onClick={() => handleMove(link.type, link.value)}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="matey-footer__bottom">
          <p className="matey-footer__caption">
            © 2026 Matey. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
