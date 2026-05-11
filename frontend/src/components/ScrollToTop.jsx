/**
 * 라우트(pathname/search)가 바뀔 때마다 문서 스크롤을 맨 위로 옮깁니다.
 * 아래까지 스크롤한 뒤 새로고침·다른 페이지 이동 시에도 상단에서 보이도록 합니다.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}
