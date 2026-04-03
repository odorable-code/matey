import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../1_Header/Header';
import Footer from '../2_Footer/Footer';
import './Layout.css';

function MainLayout() {
  return (
    <div className="matey-layout">
      <Header />

      <main className="matey-layout__main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
