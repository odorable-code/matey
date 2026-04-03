import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DownloadPage.css';

const DOWNLOAD_LINKS = {
  windows: '#',
  mac: '#',
};

const PLATFORM_ITEMS = [
  {
    id: 'windows',
    name: 'Windows',
    version: 'Windows 10 이상',
    file: 'Matey Setup.exe',
    size: '약 128MB',
    accent: 'blue',
    points: [
      '가장 먼저 지원되는 데스크톱 버전',
      '설치 후 바로 실행 가능한 간단한 흐름',
      '홈 화면에서 이어지는 부드러운 사용 경험',
    ],
  },
  {
    id: 'mac',
    name: 'macOS',
    version: 'macOS 12 이상',
    file: 'Matey.dmg',
    size: '약 136MB',
    accent: 'pink',
    points: [
      '맥 환경에 맞춘 깔끔한 설치 방식',
      '처음 실행 시 권한 확인만 거치면 바로 사용 가능',
      '업데이트 시에도 익숙한 흐름으로 유지',
    ],
  },
];

const INSTALL_STEPS = [
  {
    title: '1. 설치 파일 다운로드',
    description:
      '사용 중인 운영체제에 맞는 설치 파일을 내려받아 주세요.',
  },
  {
    title: '2. 설치 진행',
    description:
      '안내에 따라 설치를 마치면 메이티가 앱 목록 또는 바탕화면에 추가돼요.',
  },
  {
    title: '3. 로그인 후 바로 시작',
    description:
      '기존 계정으로 로그인하거나 새로 가입한 뒤 바로 메이트와 대화를 시작할 수 있어요.',
  },
];

const REQUIREMENT_GROUPS = [
  {
    title: '최소 시스템 요구사항',
    items: [
      '메모리 8GB 이상 권장',
      '여유 저장 공간 500MB 이상',
      '안정적인 인터넷 연결',
      '최신 브라우저 또는 데스크톱 환경',
    ],
  },
  {
    title: '설치 전 확인하면 좋은 점',
    items: [
      '회사/학교 PC라면 설치 권한 여부 확인',
      '보안 프로그램이 설치 파일을 차단하지 않는지 확인',
      '처음 실행 시 네트워크 권한 요청 가능',
      '로그인 계정 정보 준비',
    ],
  },
];

function DownloadPage() {
  const navigate = useNavigate();

  const handleDownload = (platform) => {
    const targetUrl = DOWNLOAD_LINKS[platform];

    if (!targetUrl || targetUrl === '#') {
      window.alert('다운로드 링크를 아직 연결하지 않았어요. DOWNLOAD_LINKS 값을 넣어주세요.');
      return;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="matey-download-page">
      <section className="matey-download-hero">
        <div className="matey-download-hero__inner">
          <div className="matey-download-hero__content">
            <span className="matey-download-hero__badge">Matey desktop app</span>

            <h1 className="matey-download-hero__title">
              메이티를
              <br />
              <span>바로 다운로드해서</span>
              <br />
              더 편하게 시작해보세요
            </h1>

            <p className="matey-download-hero__description">
              홈에서 느꼈던 부드러운 흐름 그대로, 데스크톱에서도 메이트와 자연스럽게
              이어질 수 있도록 준비했어요.
              <br />
              설치는 간단하고, 로그인하면 바로 이전 흐름을 이어서 시작할 수 있어요.
            </p>

            <div className="matey-download-hero__actions">
              <button
                type="button"
                className="matey-download-hero__button matey-download-hero__button--primary"
                onClick={() => handleDownload('windows')}
              >
                Windows 다운로드
              </button>

              <button
                type="button"
                className="matey-download-hero__button matey-download-hero__button--secondary"
                onClick={() => handleDownload('mac')}
              >
                macOS 다운로드
              </button>
            </div>

            <div className="matey-download-hero__chips">
              <span className="matey-download-hero__chip">Desktop App</span>
              <span className="matey-download-hero__chip">간편 설치</span>
              <span className="matey-download-hero__chip">로그인 후 바로 시작</span>
            </div>
          </div>

          <div className="matey-download-hero__visual" aria-hidden="true">
            <div className="matey-download-hero__visual-card">
              <div className="matey-download-hero__window">
                <div className="matey-download-hero__window-top">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="matey-download-hero__window-body">
                  <div className="matey-download-hero__character-card">
                    <img
                      src="/images/rabbit-duo.png"
                      alt="Matey characters"
                      className="matey-download-hero__image"
                    />
                  </div>

                  <div className="matey-download-hero__mini-panel">
                    <span className="matey-download-hero__mini-badge">Install & Run</span>
                    <strong>설치하고 바로 메이트를 만나보세요</strong>
                    <p>다운로드 → 설치 → 로그인까지 익숙하고 가볍게 이어지는 흐름이에요.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="matey-download-platforms">
        <div className="matey-download-section__head">
          <span className="matey-download-section__badge">Platform</span>
          <h2 className="matey-download-section__title">내 환경에 맞는 버전을 선택해 주세요</h2>
          <p className="matey-download-section__description">
            운영체제에 맞는 설치 파일만 고르면 돼요. 필요한 정보는 카드 안에서 한 번에 볼 수 있게 정리했어요.
          </p>
        </div>

        <div className="matey-download-platforms__grid">
          {PLATFORM_ITEMS.map((platform) => (
            <article
              key={platform.id}
              className={`matey-download-platforms__card is-${platform.accent}`}
            >
              <div className="matey-download-platforms__top">
                <div>
                  <span className="matey-download-platforms__eyebrow">{platform.name}</span>
                  <h3 className="matey-download-platforms__title">{platform.version}</h3>
                </div>

                <div className="matey-download-platforms__meta">
                  <span>{platform.file}</span>
                  <span>{platform.size}</span>
                </div>
              </div>

              <ul className="matey-download-platforms__list">
                {platform.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <button
                type="button"
                className="matey-download-platforms__button"
                onClick={() => handleDownload(platform.id)}
              >
                {platform.name} 다운로드
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="matey-download-guide">
        <div className="matey-download-guide__grid">
          <article className="matey-download-guide__card">
            <div className="matey-download-guide__head">
              <span className="matey-download-guide__badge">Install guide</span>
              <h2 className="matey-download-guide__title">설치는 어렵지 않아요</h2>
              <p className="matey-download-guide__description">
                처음 설치하는 경우에도 부담 없도록 필요한 흐름만 간단하게 정리했어요.
              </p>
            </div>

            <div className="matey-download-guide__steps">
              {INSTALL_STEPS.map((step) => (
                <div key={step.title} className="matey-download-guide__step">
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="matey-download-guide__card">
            <div className="matey-download-guide__head">
              <span className="matey-download-guide__badge">Requirements</span>
              <h2 className="matey-download-guide__title">설치 전에 확인해 주세요</h2>
              <p className="matey-download-guide__description">
                너무 복잡한 사양은 아니지만, 아래 항목을 확인하면 설치가 더 매끄러워져요.
              </p>
            </div>

            <div className="matey-download-guide__requirement-groups">
              {REQUIREMENT_GROUPS.map((group) => (
                <div key={group.title} className="matey-download-guide__requirement-box">
                  <strong>{group.title}</strong>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="matey-download-cta">
        <div className="matey-download-cta__card">
          <span className="matey-download-cta__badge">Ready to start</span>
          <h2 className="matey-download-cta__title">
            메이티를 설치하고,
            <br />
            오늘의 대화를 시작해보세요
          </h2>
          <p className="matey-download-cta__description">
            아직 계정이 없다면 먼저 가입하고, 이미 계정이 있다면 로그인 후 바로 이어서 사용할 수 있어요.
          </p>

          <div className="matey-download-cta__actions">
            <button
              type="button"
              className="matey-download-cta__button matey-download-cta__button--primary"
              onClick={() => handleDownload('windows')}
            >
              지금 다운로드
            </button>

            <button
              type="button"
              className="matey-download-cta__button matey-download-cta__button--secondary"
              onClick={() => navigate('/signup')}
            >
              가입하고 시작하기
            </button>
          </div>

          <div className="matey-download-cta__links">
            <Link to="/login">이미 계정이 있어요</Link>
            <Link to="/">홈으로 돌아가기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default DownloadPage;
