import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPlayers, listPlayer, delistPlayer } from '../services/api';

function Squad() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [grouped, setGrouped] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [sortBy, setSortBy] = useState('overall_rating');
  const [sortDesc, setSortDesc] = useState(true);
  const [listing, setListing] = useState(null);

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

  const handleList = async (playerId, playerName) => {
    const price = prompt(`List ${playerName} for sale. Enter asking price ($):`);
    
    if (!price || isNaN(price) || parseInt(price) < 1000) {
      alert('Invalid price. Minimum is $1,000');
      return;
    }
    
    setListing(playerId);
    try {
      await listPlayer(playerId, parseInt(price));
      alert(`${playerName} listed for $${parseInt(price).toLocaleString()}`);
      await loadPlayers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to list player');
    } finally {
      setListing(null);
    }
  };

  const handleDelist = async (playerId, playerName) => {
    if (!confirm(`Remove ${playerName} from transfer market?`)) {
      return;
    }
    
    setListing(playerId);
    try {
      await delistPlayer(playerId);
      alert(`${playerName} removed from market`);
      await loadPlayers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delist player');
    } finally {
      setListing(null);
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
    minHeight: 'calc(100vh - 142px)',
    backgroundColor: 'transparent',
    padding: '1px 0'
  }}>
    {/* Single Module Container - Same width as dashboard */}
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      
      {/* Squad Module */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '0px',
        borderRadius: '0px'
      }}>
        
        {/* Header */}


        {/* Squad Summary */}


       {/* Players Table */}
<div style={{ 
  border: '1px solid #424242ff',
  borderRadius: '0px',
  backgroundColor: '#1a1a1a',
  overflow: 'auto'
}}>
  <table style={{ 
    width: '100%', 
    borderCollapse: 'collapse',
    fontSize: '12px'
  }}>
    <thead>
      <tr style={{ borderBottom: '1px solid #8b8b8bff' }}>
        <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('position')}>
          POS {sortBy === 'position' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('first_name')}>
          NAME
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('age')}>
          AGE {sortBy === 'age' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('overall_rating')}>
          OVR {sortBy === 'overall_rating' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('pace')}>
          PAC {sortBy === 'pace' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('shooting')}>
          SHO {sortBy === 'shooting' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('passing')}>
          PAS {sortBy === 'passing' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('defending')}>
          DEF {sortBy === 'defending' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('physical')}>
          PHY {sortBy === 'physical' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff', cursor: 'pointer' }} onClick={() => handleSort('value')}>
          VAL {sortBy === 'value' && (sortDesc ? '▼' : '▲')}
        </th>
        <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999' }}>
          ACT
        </th>
      </tr>
    </thead>
    <tbody>
      {getDisplayPlayers().map((player) => (
        <tr 
          key={player.id}
          style={{ 
            borderBottom: '1px solid #333',
            backgroundColor: 'transparent',
            color: '#fff'
          }}
        >
          <td style={{ padding: '4px 4px', borderRight: '1px solid #333' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: getPositionColor(player.position),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '11px'
            }}>
              {player.position}
            </span>
          </td>
          <td style={{ padding: '4px 4px', borderRight: '1px solid #333', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px'}}>
              <img 
                src="/flags/england.png"
                alt="flag"
                style={{ width: '16px', height: '11px'}}
                />
            <span>{player.first_name} {player.last_name}</span>
            </div>
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
            {player.age}
          </td>
          <td style={{ 
            padding: '4px 4px', 
            textAlign: 'center',
            borderRight: '1px solid #333',
            fontWeight: 'bold',
            color: getRatingColor(player.overall_rating)
          }}>
            {player.overall_rating}
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
            {player.pace}
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
            {player.shooting}
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
            {player.passing}
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
            {player.defending}
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
            {player.physical}
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333', color: '#28a745' }}>
            ${player.value}M
          </td>
          <td style={{ padding: '4px 4px', textAlign: 'center' }}>
            {player.is_listed ? (
              <button
                onClick={() => handleDelist(player.id, `${player.first_name} ${player.last_name}`)}
                disabled={listing === player.id}
                style={{
                  padding: '4px 8px',
                  backgroundColor: listing === player.id ? '#666' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: listing === player.id ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                Delist
              </button>
            ) : (
              <button
                onClick={() => handleList(player.id, `${player.first_name} ${player.last_name}`)}
                disabled={listing === player.id}
                style={{
                  padding: '4px 8px',
                  backgroundColor: listing === player.id ? '#666' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: listing === player.id ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                List
              </button>
            )}
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
    </div>
  </div>
);
}

export default Squad;