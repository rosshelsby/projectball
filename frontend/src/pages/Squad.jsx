import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPlayers } from '../services/api';

function Squad() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [grouped, setGrouped] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await getMyPlayers();
      setPlayers(data.players);
      setGrouped(data.grouped);
    } catch (err) {
      console.error('Failed to load players:', err);
      setError('Failed to load squad. Please try again.');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDisplayPlayers = () => {
    if (selectedPosition === 'ALL') {
      return players;
    }
    return grouped[selectedPosition] || [];
  };

  const getPositionColor = (position) => {
    const colors = {
      GK: '#ffd700',
      DEF: '#4169e1',
      MID: '#32cd32',
      FWD: '#ff4500'
    };
    return colors[position] || '#666';
  };

  const getRatingColor = (rating) => {
    if (rating >= 80) return '#00ff00';
    if (rating >= 70) return '#90ee90';
    if (rating >= 60) return '#ffd700';
    return '#ff6347';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading squad...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: 'red' }}>{error}</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>My Squad</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#72a8d8ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Position Filter */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedPosition === pos ? '#007bff' : '#bccdddff',
                color: selectedPosition === pos ? 'white' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: selectedPosition === pos ? 'bold' : 'normal'
              }}
            >
              {pos} {pos !== 'ALL' && `(${grouped[pos]?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Squad Summary */}
      <div style={{ 
        backgroundColor: '#091929ff', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Squad Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Total Players:</strong> {players.length}
          </div>
          <div>
            <strong>Goalkeepers:</strong> {grouped?.GK?.length || 0}
          </div>
          <div>
            <strong>Defenders:</strong> {grouped?.DEF?.length || 0}
          </div>
          <div>
            <strong>Midfielders:</strong> {grouped?.MID?.length || 0}
          </div>
          <div>
            <strong>Forwards:</strong> {grouped?.FWD?.length || 0}
          </div>
          <div>
            <strong>Avg Rating:</strong> {(players.reduce((sum, p) => sum + p.overall_rating, 0) / players.length).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px' 
      }}>
        {getDisplayPlayers().map(player => (
          <div 
            key={player.id}
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#0d2b49ff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Player Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>
                  {player.first_name} {player.last_name}
                </h3>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Age: {player.age}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div 
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    backgroundColor: getPositionColor(player.position),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: 'white'
                  }}
                >
                  {player.position}
                </div>
              </div>
            </div>

            {/* Overall Rating */}
            <div style={{ 
              textAlign: 'center', 
              margin: '15px 0',
              padding: '10px',
              backgroundColor: '#0d2b49ff',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                OVERALL RATING
              </div>
              <div 
                style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold',
                  color: getRatingColor(player.overall_rating)
                }}
              >
                {player.overall_rating}
              </div>
            </div>

            {/* Stats */}
            <div style={{ fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>PAC:</span>
                <span style={{ fontWeight: 'bold' }}>{player.pace}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>SHO:</span>
                <span style={{ fontWeight: 'bold' }}>{player.shooting}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>PAS:</span>
                <span style={{ fontWeight: 'bold' }}>{player.passing}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>DEF:</span>
                <span style={{ fontWeight: 'bold' }}>{player.defending}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>PHY:</span>
                <span style={{ fontWeight: 'bold' }}>{player.physical}</span>
              </div>
            </div>

            {/* Market Value */}
            <div style={{ 
              marginTop: '15px', 
              paddingTop: '15px', 
              borderTop: '1px solid #dee2e6',
              textAlign: 'center',
              color: '#28a745',
              fontWeight: 'bold'
            }}>
              Value: ${player.value}M
            </div>
          </div>
        ))}
      </div>

      {getDisplayPlayers().length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <h3>No players in this position</h3>
        </div>
      )}
    </div>
  );
}

export default Squad;