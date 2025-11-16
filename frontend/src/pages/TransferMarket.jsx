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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setLoading(true);
    loadMarket();
  };

  const clearFilters = () => {
    setFilters({
      position: '',
      minRating: '',
      maxRating: '',
      maxPrice: '',
      sortBy: 'listed_at'
    });
    setLoading(true);
    loadMarket();
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
      maxWidth: '1400px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1>Transfer Market</h1>

      {/* Filters */}
      <div style={{
        backgroundColor: '#0f3a66ff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Position</label>
            <select
              value={filters.position}
              onChange={(e) => handleFilterChange('position', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">All Positions</option>
              <option value="GK">Goalkeeper</option>
              <option value="DEF">Defender</option>
              <option value="MID">Midfielder</option>
              <option value="FWD">Forward</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Min Rating</label>
            <input
              type="number"
              value={filters.minRating}
              onChange={(e) => handleFilterChange('minRating', e.target.value)}
              placeholder="e.g. 70"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Max Rating</label>
            <input
              type="number"
              value={filters.maxRating}
              onChange={(e) => handleFilterChange('maxRating', e.target.value)}
              placeholder="e.g. 85"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Max Price ($)</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="e.g. 500000"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="listed_at">Recently Listed</option>
              <option value="price">Price (Low to High)</option>
              <option value="rating">Rating (High to Low)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button
            onClick={applyFilters}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Market Stats */}
      <div style={{
        backgroundColor: '#0f3a66ff',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <strong>{players.length} players available</strong>
      </div>

      {/* Players Table */}
      {players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <h3>No players available</h3>
          <p>Check back later or adjust your filters</p>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#0f3a66ff'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '1000px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#0f3a66ff', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>POS</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>NAME</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>AGE</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold' }}>OVR</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>PAC</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>SHO</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>PAS</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>DEF</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>PHY</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>SELLER</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>PRICE</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr 
                  key={player.id}
                  style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: index % 2 === 0 ? '#367dc4ff' : '#f8f9fa'
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
                    {player.name}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {player.age}
                  </td>
                  <td style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '18px',
                    color: getRatingColor(player.overallRating)
                  }}>
                    {player.overallRating}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {player.stats.pace}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {player.stats.shooting}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {player.stats.passing}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {player.stats.defending}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {player.stats.physical}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', color: '#666' }}>
                    {player.sellerTeam}
                  </td>
                  <td style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#28a745'
                  }}>
                    ${player.askingPrice.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleBuy(player.id, player.name, player.askingPrice)}
                      disabled={buying === player.id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: buying === player.id ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: buying === player.id ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
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
      )}
    </div>
  );
}

export default TransferMarket;