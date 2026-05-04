import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import sideStyles from '../7_MyPage/layout/SideMenu.module.css';

const FAQ_PATH = '/community/faq';

function isPostsSection(pathname) {
  return (
    pathname === '/community' ||
    pathname.startsWith('/community/posts') ||
    pathname === '/community/write'
  );
}

function CommunitySideNav() {
  const { pathname } = useLocation();

  return (
    <nav className={sideStyles.card} aria-label="커뮤니티 메뉴">
      <ul className={sideStyles.menuList}>
        <li className={sideStyles.menuItem}>
          <NavLink
            to="/community"
            className={({ isActive }) =>
              `${sideStyles.menuButton} ${
                isActive || isPostsSection(pathname) ? sideStyles.active : ''
              }`
            }
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <span className={sideStyles.textGroup}>
              <span className={sideStyles.label}>게시글 목록</span>
              <span className={sideStyles.description}>카테고리·검색으로 둘러봐요</span>
            </span>
          </NavLink>
        </li>
        <li className={sideStyles.menuItem}>
          <NavLink
            to={FAQ_PATH}
            className={({ isActive }) =>
              `${sideStyles.menuButton} ${isActive ? sideStyles.active : ''}`
            }
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <span className={sideStyles.textGroup}>
              <span className={sideStyles.label}>FAQ · 문의</span>
              <span className={sideStyles.description}>자주 묻는 질문과 일반 문의 접수</span>
            </span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default CommunitySideNav;
