import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Footer.css';

const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: '기능', type: 'section', target: 'features' },
      { label: '이용 방법', type: 'section', target: 'how-it-works' },
      { label: '대화 예시', type: 'section', target: 'chat-demo' },
      { label: '요금제', type: 'section', target: 'pricing' },
      { label: 'FAQ', type: 'section', target: 'faq' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: '다운로드', type: 'route', target: '/download' },
      { label: '로그인', type: 'route', target: '/login' },
      { label: '회원가입', type: 'route', target: '/signup' },
    ],
  },
];

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const moveToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target) return;

    const headerOffset = 92;
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  };

  const handleLinkClick = (link) => {
    if (link.type === 'route') {
      navigate(link.target);
      return;
    }

    moveToSection(link.target);
  };

  const handleBrandClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer className="matey-footer">
      <div className="matey-footer__container">
        <div className="matey-footer__main">
          <div className="matey-footer__brand-area">
            <button
              type="button"
              className="matey-footer__brand"
              onClick={handleBrandClick}
              aria-label="메이티 홈으로 이동"
            >
              <span className="matey-footer__brand-mark">M</span>

              <div className="matey-footer__brand-copy">
                <strong>Matey</strong>
                <span>AI Mate for gentle conversations</span>
              </div>
            </button>

            <p className="matey-footer__description">
              메이티는 감정과 대화 맥락을 부드럽게 이해하고,
              사용자가 편안하게 말을 시작할 수 있도록 돕는 AI 메이트 서비스입니다.
            </p>

            <div className="matey-footer__cta">
              <button
                type="button"
                className="matey-footer__button matey-footer__button--primary"
                onClick={() => navigate('/signup')}
              >
                무료로 시작하기
              </button>

              <button
                type="button"
                className="matey-footer__button matey-footer__button--secondary"
                onClick={() => navigate('/download')}
              >
                다운로드
              </button>
            </div>
          </div>

          <div className="matey-footer__nav-area">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="matey-footer__group">
                <h3>{group.title}</h3>

                <div className="matey-footer__link-list">
                  {group.links.map((link) => (
                    <button
                      key={link.label}
                      type="button"
                      className="matey-footer__link"
                      onClick={() => handleLinkClick(link)}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="matey-footer__bottom">
          <p>© {new Date().getFullYear()} Matey. All rights reserved.</p>

          <div className="matey-footer__meta">
            <span>감정 중심 UX</span>
            <span>부드러운 인터랙션</span>
            <span>Responsive</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
