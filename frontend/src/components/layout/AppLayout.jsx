import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { RealtimeProvider } from '../../context/RealtimeContext';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <RealtimeProvider>
      <div className="app-shell">
        {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}
        <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <div className="main-col">
          <Topbar onMenuClick={() => setMenuOpen((v) => !v)} />
          <div className="page-body">
            <Outlet />
          </div>
        </div>
      </div>
    </RealtimeProvider>
  );
}
