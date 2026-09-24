import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRealtime } from '../../context/RealtimeContext';
import Avatar from '../ui/Avatar';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { connected } = useRealtime();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="flex-gap">
        <button className="btn btn-ghost btn-icon mobile-topbar-toggle" onClick={onMenuClick} aria-label="Menu">☰</button>
        <span className={`badge ${connected ? 'badge-success' : 'badge-danger'}`}>
          <span className="badge-dot" />
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      <div className="flex-gap">
        <div className="theme-toggle">
          <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>☀️ Light</button>
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>🌙 Dark</button>
        </div>
        <Avatar name={user?.name} color={user?.avatarColor} />
        <div style={{ display: 'none' }} />
        <button
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
