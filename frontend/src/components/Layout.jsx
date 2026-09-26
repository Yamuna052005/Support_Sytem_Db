import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, isAgent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner container">
          <Link to="/dashboard" className="brand">
            <span className="brand-mark" aria-hidden="true">🎫</span> SupportDesk
          </Link>

          {user && (
            <nav className="nav-links">
              <NavLink to="/dashboard" end>
                {isAgent ? 'All tickets' : 'My tickets'}
              </NavLink>
              {!isAgent && <NavLink to="/tickets/new">New ticket</NavLink>}
            </nav>
          )}

          {user && (
            <div className="nav-user">
              <span className="nav-user-name" title={user.email}>
                {user.name}
                <span className={`role-pill role-${user.role}`}>{user.role}</span>
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container main">
        <Outlet />
      </main>
    </div>
  );
}
