import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DownloadBanner.css';

function DownloadBanner() {
  const navigate = useNavigate();

  return (
    <section className="matey-download-banner" id="download-banner">
      <div className="matey-download-banner__inner">
        <div className="matey-download-banner__copy">
          <div className="matey-download-banner__badge">
            <span className="matey-download-banner__badge-dot" />
            Desktop companion ready
          </div>

          <h2 className="matey-download-banner__title">
            메이티를 진짜로 느끼는 순간은
            <br />
            <span>바탕화면에서 시작돼요</span>
          </h2>

          <p className="matey-download-banner__subtitle">
            웹에서는 기록과 리포트를 보고,
            데스크톱에서는 메이티가 실제로 곁에 머무는 경험을 만날 수 있어요.
            지금 앱을 설치하고, 필요할 때 먼저 다가오는 메이트를 시작해보세요.
          </p>

          <div className="matey-download-banner__platforms">
            <div className="matey-download-banner__platform-chip">
              <span>🪟</span>
              <span>Windows 지원</span>
            </div>
            <div className="matey-download-banner__platform-chip">
              <span>🍎</span>
              <span>macOS 지원</span>
            </div>
            <div className="matey-download-banner__platform-chip">
              <span>🔄</span>
              <span>웹 · 데스크톱 동기화</span>
            </div>
          </div>

          <div className="matey-download-banner__actions">
            <button
              type="button"
              className="matey-download-banner__button primary"
              onClick={() => navigate('/download')}
            >
              앱 다운로드
            </button>

            <button
              type="button"
              className="matey-download-banner__button secondary"
              onClick={() => navigate('/signup')}
            >
              무료 체험 시작하기
            </button>
          </div>

          <p className="matey-download-banner__caption">
            부담 없이 시작하고 싶다면 회원가입 후 웹에서 먼저 둘러본 뒤,
            필요할 때 데스크톱 앱을 연결해도 괜찮아요.
          </p>
        </div>

        <div className="matey-download-banner__visual">
          <div className="matey-download-banner__visual-shell">
            <div className="matey-download-banner__window-bar">
              <div className="matey-download-banner__window-dots">
                <span />
                <span />
                <span />
              </div>
              <span>Matey Desktop</span>
            </div>

            <div className="matey-download-banner__window-body">
              <div className="matey-download-banner__status-cards">
                <div className="matey-download-banner__status-card blue">
                  <strong>실시간 동기화</strong>
                  <span>웹 대시보드와 기록이 자연스럽게 이어져요</span>
                </div>
                <div className="matey-download-banner__status-card pink">
                  <strong>프라이버시 제어</strong>
                  <span>화면 인식 ON/OFF를 직접 관리할 수 있어요</span>
                </div>
              </div>

              <div className="matey-download-banner__character-area">
                <div className="matey-download-banner__speech">
                  “오늘 좀 오래 버텼네. 이제는 내가 먼저 옆에 있을게.”
                </div>

                <img
                  src="/images/rabbit-duo.png"
                  alt="메이티 캐릭터"
                  className="matey-download-banner__character-image"
                />
              </div>

              <div className="matey-download-banner__footer-row">
                <div className="matey-download-banner__mini-pill">Desktop companion</div>
                <div className="matey-download-banner__mini-pill">Emotion-aware AI</div>
                <div className="matey-download-banner__mini-pill">Soft proactive care</div>
              </div>
            </div>
          </div>

          <div className="matey-download-banner__floating-card one">
            <span>💬</span>
            <div>
              <strong>먼저 다가오는 경험</strong>
              <p>필요한 순간 조용히 말을 걸어요</p>
            </div>
          </div>

          <div className="matey-download-banner__floating-card two">
            <span>📊</span>
            <div>
              <strong>감정 리포트 연결</strong>
              <p>웹에서 패턴을 정리해 확인해요</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DownloadBanner;
