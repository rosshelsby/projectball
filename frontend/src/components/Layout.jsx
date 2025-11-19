import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyToken, getNextScheduledMatch, getMyMissions } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextScout, setNextScout] = useState(null);

  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/';

  useEffect(() => {
    if (!isAuthPage) {
      loadUserData();

      // Connect socket after authentication
    const socket = connectSocket();
    
    if (socket) {
      // Listen for scout mission updates
      socket.on('scout-mission-complete', (data) => {
        console.log('Scout mission complete:', data);
        loadUserData(); // Refresh data
      });

      socket.on('scout-mission-started', (data) => {
      console.log('Scout mission started:', data);
      loadUserData();
    });
      
        // Listen for match updates
        socket.on('match-finished', (data) => {
          console.log('Match finished:', data);
          loadUserData(); // Refresh data
        });
      }
      
      return () => {
        disconnectSocket();
      };

      } else {
        setLoading(false);
      }
    }, [isAuthPage]);

      // Next Scout Countdown Timer
      useEffect(() => {
        if (!nextScout || nextScout.isReady) return;
        
        // Update countdown every second
        const timer = setInterval(() => {
          setNextScout(prev => {
            if (!prev || prev.isReady) return prev;
            
            // Recalculate from actual timestamp to avoid drift
            const completesAt = new Date(prev.completesAt);
            const now = new Date();
            const msRemaining = completesAt - now;
            const exactMinutesRemaining = Math.max(0, msRemaining / 1000 / 60);
            
            if (exactMinutesRemaining <= 0) {
              return { ...prev, isReady: true, exactMinutesRemaining: 0 };
            }
            
            return { ...prev, exactMinutesRemaining };
          });
        }, 1000);
  
  return () => clearInterval(timer);
}, [nextScout]);
  const loadUserData = async () => {
    try {
      const userData = await verifyToken();
      setUser(userData.user);
      setTeam(userData.team);

      try {
        const matchData = await getNextScheduledMatch();
        setNextMatch(matchData);
      } catch (err) {
        console.error('Failed to load next match:', err);
      }

      try {
        const missionsData = await getMyMissions();

          if (missionsData.active && missionsData.active.length > 0) {
            const nextReturning = missionsData.active.reduce((closest, mission) => {
              if (!closest || mission.minutesRemaining < closest.minutesRemaining) {
                return mission;
              }
              return closest;
            }, null);

            // Calculate exact time remaining in milliseconds
            if (nextReturning) {
              const completesAt = new Date(nextReturning.completesAt);
              const now = new Date();
              const msRemaining = completesAt - now;
              nextReturning.exactMinutesRemaining = Math.max(0, msRemaining / 1000 / 60);
            }
            
            setNextScout(nextReturning);
          } else {
            setNextScout(null);
          }
        } catch (err) {
          console.error('Failed to load missions:', err);
          setNextScout(null);
      }

    } catch (err) {
      console.error('Failed to load user data:', err);
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
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundImage: 'url(/football-field.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat' 
      }}>
          <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',  // ← Black overlay at 50% opacity
          pointerEvents: 'none',  // ← Allows clicks to pass through
          zIndex: 0
        }}></div>
      {/* Header */}
      <header style={{
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        {/* Top Info Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '70px',
          borderBottom: '2px solid #333',
          position: 'relative'
        }}>
          {/* Logo/Game Name */}
          <div style={{
            backgroundColor: '#dc3545',
            padding: '0 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '200px',
            borderRight: '2px solid #333'
          }}>
            <div style={{ 
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              PROJECT BALL
            </div>
          </div>

          {/* Centered Container for all 3 modules */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            height: '100%'
          }}>
            {/* Scout Module - LEFT */}
            <div style={{
              backgroundColor: '#242424',
              padding: '0 25px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: '250px',
              borderRight: '2px solid #333',
              borderLeft: '2px solid #333'
            }}>
              <div style={{ display: 'flex', marginBottom: '4px' }}>
                <div style={{
                  width: '90px',
                  color: '#999',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Next Scout:
                </div>
                {nextScout ? (
                  <div>
                    <div style={{
                      color: nextScout.isReady ? '#28a745' : '#ffc107',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      marginBottom: '2px'
                    }}>
                      {nextScout.isReady 
                        ? 'Ready!' 
                        : `${String(Math.floor(nextScout.exactMinutesRemaining / 60)).padStart(2, '0')}:${String(Math.floor(nextScout.exactMinutesRemaining % 60)).padStart(2, '0')}:${String(Math.floor((nextScout.exactMinutesRemaining * 60) % 60)).padStart(2, '0')}`
                      }
                    </div>
                    <div style={{ color: '#fff', fontSize: '11px' }}>
                      from <span style={{ color: '#ffc107' }}>{nextScout.nationality}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    No active scouts
                  </div>
                )}
              </div>
            </div>

            {/* Manager Info Module - CENTER */}
            <div style={{
              backgroundColor: '#242424',
              padding: '0 25px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: '250px',
              borderRight: '2px solid #333'
            }}>
              {[
                { 
                  label: 'Name:', 
                  value: (
                    <span 
                      onClick={() => navigate(`/profile/${user?.userNumber}`)}
                      style={{ 
                        cursor: 'pointer',
                        color: '#00bfff'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#2cecfaff'}
                      onMouseLeave={(e) => e.target.style.color = '#00bfff'}
                    >
                      {user?.username}
                    </span>
                  ), 
                  color: '#00bfff' 
                },
                { label: 'Money:', value: `$${team?.budget?.toLocaleString()}`, color: '#28a745' },
                { label: 'Team:', value: team?.teamName, color: '#fff' }
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: '4px' }}>
                  <div style={{
                    width: '60px',
                    color: '#999',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    color: item.color,
                    fontWeight: 'normal',
                    fontSize: '12px'
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Next Match Module - RIGHT */}
            <div style={{
              backgroundColor: '#242424',
              padding: '0 25px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: '250px',
              borderRight: '2px solid #333'
            }}>
              <div style={{ display: 'flex', marginBottom: '4px' }}>
                <div style={{
                  width: '90px',
                  color: '#999',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Next Match:
                </div>
                {nextMatch && nextMatch.hasMatches ? (
                  <div>
                    <div style={{
                      color: nextMatch.isOverdue ? '#ffc107' : '#00bfff',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      marginBottom: '2px'
                    }}>
                      {nextMatch.isOverdue
                        ? 'Simulating soon'
                        : `${String(nextMatch.hoursUntil).padStart(2, '0')}:${String(
                            nextMatch.minutesUntil % 60
                          ).padStart(2, '0')}:${String(
                            Math.floor((nextMatch.minutesUntil * 60) % 60)
                          ).padStart(2, '0')}`}
                    </div>
                    <div style={{ color: '#fff', fontSize: '11px' }}>
                      vs <span style={{ color: '#00bfff' }}>Opponent Name</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    No upcoming matches
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Logout & Help */}
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '0 25px'
          }}>
            <button
              onClick={() => alert('Help documentation coming soon!')}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ?
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0',
          padding: '0.5px 0',
          background: `
  repeating-linear-gradient(90deg, transparent, transparent 2px, #242424 2px, #242424 4px),
  linear-gradient(180deg, #0a0a0a, #1a1a1a, #0a0a0a)
`
        }}>
          {[
            { path: '/dashboard', hasIcon: true, icon: 'dashboard' },
            { path: '/squad', hasIcon: true, icon: 'squad' },
            { path: '/market', hasIcon: true, icon: 'market' },
            { path: '/fixtures', hasIcon: true, icon: 'fixtures' },
            { path: '/training', hasIcon: true, icon: 'training' },
            { path: '/scout', hasIcon: true, icon: 'scout' }
          ].map((item, index) => {
            const isActive = location.pathname === item.path;
            
            if (item.hasIcon) {
              // Image button
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    padding: '0.5px 20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                    outline: 'none',
                    boxShadow: 'none', 
                    WebkitTapHighlightColor: 'transparent' 
                  }}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    img.src = `/nav-icons/${item.icon}-glow.png`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const img = e.currentTarget.querySelector('img');
                      img.src = `/nav-icons/${item.icon}-noglow.png`;
                    }
                  }}
                >
                  <img 
                    src={`/nav-icons/${item.icon}-${isActive ? 'glow' : 'noglow'}.png`}
                    alt={item.label}
                    style={{
                      width: '40px',
                      height: '40px'
                    }}
                  />
                  <span style={{
                    fontSize: '11px',
                    color: isActive ? '#28a745' : '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            } else {
              // Text button (existing style)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    padding: '15px 25px',
                    backgroundColor: isActive ? '#28a745' : 'transparent',
                    color: isActive ? '#fff' : '#999',
                    border: 'none',
                    borderRight: index < 5 ? '1px solid #333' : 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = '#242424';
                      e.target.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#999';
                    }
                  }}
                >
                  {item.label}
                </button>
              );
            }
          })}
        </nav>

      </header>

      {/* Page Content */}
      <main style={{ 
          minHeight: 'calc(100vh - 142px)',
          position: 'relative'
        }}>
        
        {/* Content wrapper */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;