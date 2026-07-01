import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--canvas)', color: 'var(--on-surface)' }}
    >
      {/* Subtle atmospheric background */}
      <div className="mesh-bg" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex h-full flex-1 flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 overflow-y-auto px-5 py-6 md:px-8 max-w-[1400px] w-full mx-auto animate-fade-in-up"
          style={{ paddingBottom: '2rem' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
