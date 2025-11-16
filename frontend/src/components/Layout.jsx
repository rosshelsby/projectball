import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyToken, getNextScheduledMatch } from '../services/api';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Don't show header on login/register pages
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/';

  useEffect(() => {
    if (!isAuthPage) {
      loadUserData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthPage]);

  const loadUserData = async () => {
    try {
      const userData = await verifyToken();
      setUser(userData.user);
      setTeam(userData.team);

      // Get next match info
      try {
        const matchData = await getNextScheduledMatch();
        setNextMatch(matchData);
      } catch (err) {
        console.error('Failed to load next match:', err);
      }
    } catch (err) {
      console.error('Auth failed:', err);
      localStorage.clear();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1a1a1a',
        borderBottom: '3px solid #007bff',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        {/* Top Bar - User Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: '1px solid #333'
        }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#999', fontSize: '12px' }}>MANAGER</span>
              <div style={{ color: 'white', fontWeight: 'bold' }}>{user?.username}</div>
            </div>
            <div>
              <span style={{ color: '#999', fontSize: '12px' }}>TEAM</span>
              <div style={{ color: 'white', fontWeight: 'bold' }}>{team?.teamName}</div>
            </div>
            <div>
              <span style={{ color: '#999', fontSize: '12px' }}>BUDGET</span>
              <div style={{ color: '#28a745', fontWeight: 'bold', fontSize: '18px' }}>
                ${team?.budget?.toLocaleString()}
              </div>
            </div>
            {nextMatch && nextMatch.hasMatches && (
              <div>
                <span style={{ color: '#999', fontSize: '12px' }}>
                  {nextMatch.isOverdue ? 'SIMULATING SOON' : 'NEXT MATCH'}
                </span>
                <div style={{ 
                  color: nextMatch.isOverdue ? '#ffc107' : '#00bfff', 
                  fontWeight: 'bold' 
                }}>
                  {nextMatch.isOverdue 
                    ? 'Within 5 min' 
                    : `${nextMatch.hoursUntil}h ${nextMatch.minutesUntil % 60}m`
                  }
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>

        {/* Navigation Bar */}
        <nav style={{
          display: 'flex',
          gap: '5px',
          padding: '10px 0'
        }}>
          {[
            { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
            { path: '/squad', label: 'Squad', icon: '👥' },
            { path: '/market', label: 'Transfer Market', icon: '💰' },
            { path: '/fixtures', label: 'Fixtures', icon: '📅' },
            { path: '/training', label: 'Training', icon: '⚙️' }
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: '10px 20px',
                backgroundColor: location.pathname === item.path ? '#007bff' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = '#333';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

export default Layout;