import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPlayers, getTrainingFacilities, upgradeFacility, trainPlayer } from '../services/api';

function Training() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [facilities, setFacilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainingPlayer, setTrainingPlayer] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [dailyTrainingsUsed, setDailyTrainingsUsed] = useState(0);

  const DAILY_TRAINING_LIMIT = 5;
  const MAX_STAT_VALUE = 99;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playersData, facilitiesData] = await Promise.all([
        getMyPlayers(),
        getTrainingFacilities()
      ]);
      
      setPlayers(playersData.players);
      setFacilities(facilitiesData);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const trainingsToday = playersData.players.filter(p => {
        if (!p.last_trained_at) return false;
        const lastTrained = new Date(p.last_trained_at);
        return lastTrained >= todayStart;
      }).length;
      
      setDailyTrainingsUsed(trainingsToday);
      
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeFacility = async () => {
    if (!facilities || !window.confirm(`Upgrade Training Ground to Level ${facilities.facilities.trainingGround.level + 1} for $${facilities.facilities.trainingGround.upgradeCost?.toLocaleString()}?`)) {
      return;
    }

    setUpgrading(true);
    try {
      await upgradeFacility('training_ground');
      await loadData();
      alert('Training Ground upgraded successfully!');
    } catch (err) {
      console.error('Upgrade failed:', err);
      alert(err.response?.data?.error || 'Failed to upgrade facility');
    } finally {
      setUpgrading(false);
    }
  };

  const handleTrainPlayer = async (playerId, playerName, stat) => {
    if (dailyTrainingsUsed >= DAILY_TRAINING_LIMIT) {
      alert(`Daily training limit reached (${DAILY_TRAINING_LIMIT}/${DAILY_TRAINING_LIMIT})`);
      return;
    }

    setTrainingPlayer(playerId);
    try {
      const result = await trainPlayer(playerId, stat);
      alert(`${playerName} training successful!\n${result.player.statImproved.toUpperCase()}: ${result.player.oldValue} → ${result.player.newValue} (+${result.player.gain})\nOverall: ${result.player.oldOverall} → ${result.player.newOverall}`);
      await loadData();
    } catch (err) {
      console.error('Training failed:', err);
      alert(err.response?.data?.error || 'Failed to train player');
    } finally {
      setTrainingPlayer(null);
    }
  };

  const canTrainPlayer = (player) => {
    if (!player.last_trained_at) return true;
    
    const lastTrained = new Date(player.last_trained_at);
    const now = new Date();
    const hoursSince = (now - lastTrained) / (1000 * 60 * 60);
    
    return hoursSince >= 24;
  };

  const getTimeUntilTraining = (player) => {
    if (!player.last_trained_at) return null;
    
    const lastTrained = new Date(player.last_trained_at);
    const nextTraining = new Date(lastTrained.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now >= nextTraining) return null;
    
    const hoursLeft = Math.floor((nextTraining - now) / (1000 * 60 * 60));
    const minutesLeft = Math.floor(((nextTraining - now) % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursLeft}h ${minutesLeft}m`;
  };

  const trainableStats = [
    { key: 'pace', label: 'Pace' },
    { key: 'shooting', label: 'Shooting' },
    { key: 'passing', label: 'Passing' },
    { key: 'dribbling', label: 'Dribbling' },
    { key: 'defending', label: 'Defending' },
    { key: 'physical', label: 'Physical' }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading training data...</h2>
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
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px' 
      }}>
        <h1>Training Center</h1>
        <div style={{
          backgroundColor: dailyTrainingsUsed >= DAILY_TRAINING_LIMIT ? '#dc3545' : '#ffc107',
          color: dailyTrainingsUsed >= DAILY_TRAINING_LIMIT ? '#fff' : '#000',
          padding: '10px 15px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          Daily Training: {dailyTrainingsUsed} / {DAILY_TRAINING_LIMIT}
        </div>
      </div>

      <div style={{
        backgroundColor: '#0f3a66ff',
        border: '2px solid #28a745',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto', 
          gap: '20px',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: '0 0 15px 0', color: '#28a745' }}>🏟️ Training Ground</h2>
            <div style={{ fontSize: '32px', marginBottom: '10px', fontWeight: 'bold', color: '#28a745' }}>
              Level {facilities?.facilities.trainingGround.level || 1}
            </div>
            <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '15px' }}>
              Max Level: {facilities?.facilities.trainingGround.maxLevel || 10}
            </div>
            <div style={{ 
              backgroundColor: '#7d33f3ff', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>Training Bonus:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Base: +1 stat point per training</li>
                {facilities?.facilities.trainingGround.level >= 5 && <li>Level 5+: +2 stat points</li>}
                {facilities?.facilities.trainingGround.level >= 10 && <li>Level 10: +3 stat points</li>}
              </ul>
            </div>
          </div>
          <div>
            {facilities?.facilities.trainingGround.level < 10 ? (
              <button
                onClick={handleUpgradeFacility}
                disabled={upgrading || !facilities?.facilities.trainingGround.canUpgrade}
                style={{
                  padding: '15px 35px',
                  backgroundColor: facilities?.facilities.trainingGround.canUpgrade ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: facilities?.facilities.trainingGround.canUpgrade ? 'pointer' : 'not-allowed',
                  minWidth: '180px'
                }}
              >
                {upgrading ? 'Upgrading...' : 
                 !facilities?.facilities.trainingGround.canUpgrade ? 'Insufficient Funds' :
                 'Upgrade'}
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  ${facilities?.facilities.trainingGround.upgradeCost?.toLocaleString()}
                </div>
              </button>
            ) : (
              <div style={{
                padding: '15px 35px',
                backgroundColor: '#28a745',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                color: 'white'
              }}>
                ✅ MAX LEVEL
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#2266aaff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#0f3a66ff',
          borderBottom: '1px solid #dee2e6'
        }}>
          <h2 style={{ margin: 0 }}>Squad Training</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>
            Train up to 5 players per day. Each player can train once every 24 hours.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#0f3a66ff' }}>
                <th style={{ padding: '12px', textAlign: 'left', minWidth: '180px' }}>Player</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Age</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>OVR</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>PAC</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>SHO</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>PAS</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>DRI</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>DEF</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>PHY</th>
                <th style={{ padding: '12px', textAlign: 'center', minWidth: '100px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', minWidth: '300px' }}>Train Stat</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const canTrain = canTrainPlayer(player);
                const timeLeft = getTimeUntilTraining(player);
                const isTraining = trainingPlayer === player.id;

                return (
                  <tr 
                    key={player.id}
                    style={{ 
                      borderTop: '1px solid #dee2e6',
                      backgroundColor: canTrain ? '#2266aaff' : '#1a5080'
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{player.first_name} {player.last_name}</div>
                      <div style={{ fontSize: '12px', color: '#ccc' }}>
                        {player.position} • {player.nationality}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{player.age}</td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: player.overall_rating >= 80 ? '#00ff00' : player.overall_rating >= 70 ? '#90ee90' : player.overall_rating >= 60 ? '#ffd700' : '#ff6347'
                    }}>
                      {player.overall_rating}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{player.pace}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{player.shooting}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{player.passing}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{player.dribbling}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{player.defending}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{player.physical}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {canTrain ? (
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Ready</span>
                      ) : (
                        <span style={{ color: '#ffc107', fontSize: '12px' }}>{timeLeft}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {canTrain && dailyTrainingsUsed < DAILY_TRAINING_LIMIT ? (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {trainableStats.map(stat => (
                            <button
                              key={stat.key}
                              onClick={() => handleTrainPlayer(player.id, `${player.first_name} ${player.last_name}`, stat.key)}
                              disabled={isTraining || player[stat.key] >= MAX_STAT_VALUE}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: player[stat.key] >= MAX_STAT_VALUE ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: player[stat.key] >= MAX_STAT_VALUE ? 'not-allowed' : 'pointer',
                                opacity: isTraining ? 0.6 : 1
                              }}
                              title={player[stat.key] >= MAX_STAT_VALUE ? 'Max stat reached' : `Train ${stat.label}`}
                            >
                              {stat.label.substring(0, 3).toUpperCase()}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          {dailyTrainingsUsed >= DAILY_TRAINING_LIMIT ? 'Daily limit reached' : 'On cooldown'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {players.length === 0 && (
          <div style={{ 
            padding: '50px', 
            textAlign: 'center',
            color: '#999'
          }}>
            <h3>No players in squad</h3>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#855a0bff',
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ marginTop: 0 }}>💡 Training Tips</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Higher level Training Ground provides better stat gains</li>
          <li>You can train up to 5 different players per day</li>
          <li>Each player can only be trained once every 24 hours</li>
          <li>Choose which stat to train - customize your players!</li>
          <li>Training is FREE - no cost per session</li>
          <li>Stats are capped at 99</li>
        </ul>
      </div>
    </div>
  );
}

export default Training;