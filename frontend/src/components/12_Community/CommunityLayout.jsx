import React from 'react';
import { Outlet } from 'react-router-dom';
import layoutStyles from '../7_MyPage/layout/MyPageLayout.module.css';
import CommunityProfileCard from './CommunityProfileCard';
import CommunitySideNav from './CommunitySideNav';

function CommunityLayout() {
  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.container}>
        <aside className={layoutStyles.sidebarColumn}>
          <CommunityProfileCard />
          <CommunitySideNav />
        </aside>

        <main className={layoutStyles.contentColumn}>
          <section className={layoutStyles.contentPanel} data-panel-enter="true">
            <div className={layoutStyles.contentInner}>
              <Outlet />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default CommunityLayout;
