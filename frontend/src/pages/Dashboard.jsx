import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyToken } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verify token when component loads
    const checkAuth = async () => {
      try {
        const data = await verifyToken();
        setUser(data.user);
        setTeam(data.team);
        
        // Update localStorage with fresh data from server
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('team', JSON.stringify(data.team));
        
      } catch (err) {
        console.error('Authentication failed:', err);
        setError('Session expired. Please login again.');
        
        // Clear invalid token
        localStorage.clear();
        
        // Redirect to registration after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        fontFamily: 'sans-serif'
      }}>
        <h2>Verifying authentication...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        fontFamily: 'sans-serif'
      }}>
        <h2 style={{ color: 'red' }}>{error}</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (!user || !team) {
    return <div>Error loading data...</div>;
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '50px auto', 
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <button 
          onClick={() => navigate('/training')}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ⚙️ Training Facilities
        </button>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#0c4f92ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Welcome, {user.username}!</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          ✅ Token verified with server
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#0c4f92ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Your Team: {team.teamName}</h2>
        <p><strong>Budget:</strong> ${team.budget.toLocaleString()}</p>
        <button 
          onClick={() => navigate('/squad')}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          View My Squad
        </button>
        <button 
          onClick={() => navigate('/fixtures')}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          View Fixtures & Results
        </button>
        <p style={{ color: '#666', marginTop: '20px' }}>
          More features coming soon: Player roster, training facilities, match schedule...
        </p>
      </div>
    </div>
  );
}

export default Dashboard;