import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransferMarket, buyPlayer } from '../services/api';

function TransferMarket() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    position: '',
    minRating: '',
    maxRating: '',
    maxPrice: '',
    sortBy: 'listed_at'
  });

  useEffect(() => {
    loadMarket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMarket = useCallback(async () => {
    try {
      const data = await getTransferMarket(filters);
      setPlayers(data.players);
    } catch (err) {
      console.error('Failed to load market:', err);
      setError('Failed to load transfer market');
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  const handleBuy = async (playerId, playerName, price) => {
    if (!confirm(`Buy ${playerName} for $${price.toLocaleString()}?`)) {
      return;
    }
    
    setBuying(playerId);
    try {
      const result = await buyPlayer(playerId);
      alert(`Transfer complete! ${result.transfer.player} joined your squad.\nNew budget: $${result.transfer.newBudget.toLocaleString()}`);
      await loadMarket(); // Reload to remove bought player
    } catch (err) {
      alert(err.response?.data?.error || 'Transfer failed');
    } finally {
      setBuying(null);
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
        <h2>Loading transfer market...</h2>
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
      
      {/* Market Module */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '0px',
        borderRadius: '0px'
      }}>
        
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
                <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  POS
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  NAME
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  AGE
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  OVR
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  PAC
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  SHO
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  PAS
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  DEF
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  PHY
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  SELLER
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  PRICE
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999' }}>
                  ACT
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
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
                      <span>{player.name}</span>
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
                    color: getRatingColor(player.overallRating)
                  }}>
                    {player.overallRating}
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                    {player.stats.pace}
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                    {player.stats.shooting}
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                    {player.stats.passing}
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                    {player.stats.defending}
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                    {player.stats.physical}
                  </td>
                  <td style={{ padding: '4px 4px', borderRight: '1px solid #333', fontSize: '11px' }}>
                    {player.sellerTeam}
                  </td>
                  <td style={{ 
                    padding: '4px 4px', 
                    textAlign: 'center',
                    borderRight: '1px solid #333',
                    color: '#28a745',
                    fontWeight: 'bold'
                  }}>
                    ${(player.askingPrice / 1000000).toFixed(1)}M
                  </td>
                  <td style={{ padding: '4px 4px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleBuy(player.id, player.name, player.askingPrice)}
                      disabled={buying === player.id}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: buying === player.id ? '#666' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: buying === player.id ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    >
                      {buying === player.id ? 'Buying...' : 'Buy'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {players.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <h3>No players available</h3>
          </div>
        )}

      </div>
    </div>
  </div>
);
}

export default TransferMarket;