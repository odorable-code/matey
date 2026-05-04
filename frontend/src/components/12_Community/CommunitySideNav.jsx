import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import sideStyles from '../7_MyPage/layout/SideMenu.module.css';

const FAQ_PATH = '/community/faq';
const INQUIRY_PATH = '/community/inquiry';

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
              <span className={sideStyles.label}>FAQ</span>
              <span className={sideStyles.description}>운영팀이 관리하는 자주 묻는 질문</span>
            </span>
          </NavLink>
        </li>
        <li className={sideStyles.menuItem}>
          <NavLink
            to={INQUIRY_PATH}
            className={({ isActive }) =>
              `${sideStyles.menuButton} ${isActive ? sideStyles.active : ''}`
            }
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <span className={sideStyles.textGroup}>
              <span className={sideStyles.label}>문의</span>
              <span className={sideStyles.description}>일반 문의 접수·답변은 마이페이지에서</span>
            </span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default CommunitySideNav;
