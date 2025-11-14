import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPlayers, trainPlayer } from '../services/api';

function Squad() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [grouped, setGrouped] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [training, setTraining] = useState(null);
  const [sortBy, setSortBy] = useState('overall_rating');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    loadPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlayers = useCallback(async () => {
    try {
      const data = await getMyPlayers();
      setPlayers(data.players);
      setGrouped(data.grouped);
    } catch (err) {
      console.error('Failed to load players:', err);
      setError('Failed to load squad. Please try again.');
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const getDisplayPlayers = () => {
    let displayPlayers = selectedPosition === 'ALL' 
      ? players 
      : (grouped[selectedPosition] || []);
    
    // Sort players
    return [...displayPlayers].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDesc ? bVal - aVal : aVal - bVal;
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const handleTrain = async (playerId, playerName) => {
    setTraining(playerId);
    try {
      const result = await trainPlayer(playerId);
      alert(`${playerName} training successful!\n${result.player.statImproved.toUpperCase()}: ${result.player.oldValue} → ${result.player.newValue} (+${result.player.gain})\nNew Overall: ${result.player.newOverall}`);
      await loadPlayers();
    } catch (err) {
      alert(err.response?.data?.error || 'Training failed');
    } finally {
      setTraining(null);
    }
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
      maxWidth: '1400px', 
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
            backgroundColor: '#6c757d',
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
                backgroundColor: selectedPosition === pos ? '#007bff' : '#e9ecef',
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
        backgroundColor: '#125394ff', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Squad Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div><strong>Total:</strong> {players.length}</div>
          <div><strong>GK:</strong> {grouped?.GK?.length || 0}</div>
          <div><strong>DEF:</strong> {grouped?.DEF?.length || 0}</div>
          <div><strong>MID:</strong> {grouped?.MID?.length || 0}</div>
          <div><strong>FWD:</strong> {grouped?.FWD?.length || 0}</div>
          <div><strong>Avg Rating:</strong> {(players.reduce((sum, p) => sum + p.overall_rating, 0) / players.length).toFixed(1)}</div>
        </div>
      </div>

      {/* Players Table */}
      <div style={{ 
        overflowX: 'auto',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        backgroundColor: '#125394ff'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          minWidth: '900px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#125394ff', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('position')}>
                POS {sortBy === 'position' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('first_name')}>
                NAME
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('age')}>
                AGE {sortBy === 'age' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleSort('overall_rating')}>
                OVR {sortBy === 'overall_rating' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('pace')}>
                PAC {sortBy === 'pace' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('shooting')}>
                SHO {sortBy === 'shooting' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('passing')}>
                PAS {sortBy === 'passing' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('defending')}>
                DEF {sortBy === 'defending' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('physical')}>
                PHY {sortBy === 'physical' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('value')}>
                VALUE {sortBy === 'value' && (sortDesc ? '▼' : '▲')}
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {getDisplayPlayers().map((player, index) => (
              <tr 
                key={player.id}
                style={{ 
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: index % 2 === 0 ? '#125394ff' : '#042c55ff'
                }}
              >
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getPositionColor(player.position),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {player.position}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                  {player.first_name} {player.last_name}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {player.age}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  fontSize: '18px',
                  color: getRatingColor(player.overall_rating)
                }}>
                  {player.overall_rating}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {player.pace}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {player.shooting}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {player.passing}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {player.defending}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {player.physical}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>
                  ${player.value}M
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleTrain(player.id, `${player.first_name} ${player.last_name}`)}
                    disabled={training === player.id}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: training === player.id ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: training === player.id ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {training === player.id ? '...' : 'Train'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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