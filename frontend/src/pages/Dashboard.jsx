import { useEffect, useState } from 'react';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);

  useEffect(() => {
    // Load user and team from localStorage
    const storedUser = localStorage.getItem('user');
    const storedTeam = localStorage.getItem('team');
    
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedTeam) setTeam(JSON.parse(storedTeam));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (!user || !team) {
    return <div>Loading...</div>;
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
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Welcome, {user.username}!</h2>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <div style={{ 
        backgroundColor: '#e7f3ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Your Team: {team.teamName}</h2>
        <p><strong>Budget:</strong> ${team.budget.toLocaleString()}</p>
        <p style={{ color: '#666', marginTop: '20px' }}>
          More features coming soon: Player roster, training facilities, match schedule...
        </p>
      </div>
    </div>
  );
}

export default Dashboard;