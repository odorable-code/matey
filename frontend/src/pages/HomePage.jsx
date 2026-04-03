import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Header from '../components/1_Header/Header';
import Hero from '../components/4_Home/Hero';
import Features from '../components/4_Home/Features';
import ChatDemo from '../components/4_Home/ChatDemo';
import Pricing from '../components/4_Home/Pricing';
import FAQ from '../components/4_Home/FAQ';

function HomePage({ isLoggedIn, user, onLogout }) {
  const location = useLocation();

  useEffect(() => {
    const scrollToHash = () => {
      if (!location.hash) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      const id = location.hash.replace('#', '');
      const target = document.getElementById(id);

      if (!target) return;

      const headerOffset = 84;
      const top =
        target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    };

    const timer = setTimeout(scrollToHash, 120);
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <div className="matey-home-page">
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={onLogout} />

      <main className="matey-home-page__main">
        <Hero />
        <Features />
        <ChatDemo />
        <Pricing />
        <FAQ />
      </main>
    </div>
  );
}

export default HomePage;
