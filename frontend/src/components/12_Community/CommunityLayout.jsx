import React from 'react';
import { Outlet } from 'react-router-dom';
import layoutStyles from '../7_MyPage/layout/MyPageLayout.module.css';
import CommunityProfileCard from './CommunityProfileCard';
import CommunitySideNav from './CommunitySideNav';
import cLayout from './CommunityLayout.module.css';

function CommunityLayout() {
  return (
    <div className={layoutStyles.page}>
      <div className={cLayout.shell}>
        <aside className={cLayout.leftRail}>
          <CommunityProfileCard />
          <CommunitySideNav />
        </aside>

        <div className={cLayout.rightStack}>
          <main>
            <section className={layoutStyles.contentPanel} data-panel-enter="true">
              <div className={layoutStyles.contentInner}>
                <Outlet />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default CommunityLayout;
