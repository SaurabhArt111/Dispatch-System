import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { section: 'Overview', links: [{ to: '/', label: 'Dashboard', icon: '🏠', end: true }] },
  {
    section: 'Operations',
    links: [
      { to: '/jobs', label: 'Godown Jobs', icon: '📦', perm: 'job:read' },
      { to: '/transfers', label: 'Transfers', icon: '🔁', perm: 'transfer:manage' },
      { to: '/scan', label: 'Scan Roll', icon: '🔎', perm: 'qr:scan' }
    ]
  },
  {
    section: 'Dispatch',
    links: [
      { to: '/dispatch', label: 'Dispatch Office', icon: '🚚', perm: 'dispatch:manage' },
      { to: '/vehicles', label: 'Vehicles', icon: '🚛', perm: 'vehicle:manage' }
    ]
  },
  {
    section: 'Admin',
    links: [
      { to: '/admin/users', label: 'Users & Roles', icon: '👤', perm: 'user:manage' },
      { to: '/admin/godowns', label: 'Godowns & Screens', icon: '🖥️', perm: 'godown:manage' },
      { to: '/sync-log', label: 'Sync Log', icon: '🔄', perm: 'sync:read' },
      { to: '/audit-log', label: 'Audit Log', icon: '🧾', perm: 'audit:read' }
    ]
  }
];

export default function Sidebar({ open, onNavigate }) {
  const { hasPermission } = useAuth();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/icons/icon-192.png" alt="" />
        <div>
          <div className="sidebar-brand-name">Dispatch</div>
          <div className="sidebar-brand-sub">Management System</div>
        </div>
      </div>

      <nav>
        {NAV.map((group) => {
          const visibleLinks = group.links.filter((l) => !l.perm || hasPermission(l.perm));
          if (visibleLinks.length === 0) return null;
          return (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {visibleLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={onNavigate}
                >
                  <span className="nav-icon">{l.icon}</span>
                  {l.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
