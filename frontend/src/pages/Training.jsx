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
    minHeight: 'calc(100vh - 142px)',
    backgroundColor: 'transparent',
    padding: '1px 0'
  }}>
    {/* Single Module Container - Same width as dashboard */}
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      
      {/* Training Module with Grid */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '0px',
        borderRadius: '0px',
        display: 'grid',
        gridTemplateColumns: '400px 800px',
        gap: '0px'
      }}>
        
        {/* Left Column - Training Facilities (400px) */}
        <div style={{ 
          border: '1px solid #424242ff',
          borderRight: 'none',
          backgroundColor: '#1a1a1a',
          padding: '20px'
        }}>
          {/* Daily Training Counter */}
          <div style={{
            backgroundColor: dailyTrainingsUsed >= DAILY_TRAINING_LIMIT ? '#dc3545' : '#28a745',
            color: '#fff',
            padding: '12px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Training: {dailyTrainingsUsed} / {DAILY_TRAINING_LIMIT}
          </div>

          {/* Training Ground */}
          <div style={{
            border: '2px solid #28a745',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: '#222'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#28a745', fontSize: '16px' }}>
              🏟️ Training Ground
            </h3>
            <div style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 'bold', color: '#28a745' }}>
              Level {facilities?.facilities.trainingGround.level || 1}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>
              Max Level: {facilities?.facilities.trainingGround.maxLevel || 10}
            </div>
            
            <div style={{ 
              backgroundColor: '#333', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#fff',
              marginBottom: '15px'
            }}>
              <strong>Training Bonus:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Base: +1 stat point</li>
                {facilities?.facilities.trainingGround.level >= 5 && <li>Level 5+: +2 points</li>}
                {facilities?.facilities.trainingGround.level >= 10 && <li>Level 10: +3 points</li>}
              </ul>
            </div>

            {facilities?.facilities.trainingGround.level < 10 ? (
              <button
                onClick={handleUpgradeFacility}
                disabled={upgrading || !facilities?.facilities.trainingGround.canUpgrade}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: facilities?.facilities.trainingGround.canUpgrade ? '#28a745' : '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: facilities?.facilities.trainingGround.canUpgrade ? 'pointer' : 'not-allowed'
                }}
              >
                {upgrading ? 'Upgrading...' : 
                 !facilities?.facilities.trainingGround.canUpgrade ? 'Insufficient Funds' :
                 `Upgrade - $${facilities?.facilities.trainingGround.upgradeCost?.toLocaleString()}`}
              </button>
            ) : (
              <div style={{
                padding: '12px',
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

          {/* Training Tips */}
          <div style={{
            padding: '15px',
            backgroundColor: '#333',
            borderRadius: '8px',
            border: '1px solid #444'
          }}>
            <h4 style={{ marginTop: 0, fontSize: '14px', color: '#ffc107' }}>💡 Training Tips</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6', color: '#ccc' }}>
              <li>Train 5 players/day</li>
              <li>24hr cooldown per player</li>
              <li>Choose stat to train</li>
              <li>Stats capped at 99</li>
              <li>Training is FREE</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Squad Training Table (800px) */}
        <div style={{ 
          border: '1px solid #424242ff',
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
                  PLAYER
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
                  DRI
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  DEF
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  PHY
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>
                  STATUS
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999' }}>
                  TRAIN
                </th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                    No players in squad
                  </td>
                </tr>
              ) : (
                players.map((player) => {
                  const canTrain = canTrainPlayer(player);
                  const timeLeft = getTimeUntilTraining(player);
                  const isTraining = trainingPlayer === player.id;

                  return (
                    <tr 
                      key={player.id}
                      style={{ 
                        borderBottom: '1px solid #333',
                        backgroundColor: 'transparent',
                        color: '#fff'
                      }}
                    >
                      <td style={{ padding: '4px 4px', borderRight: '1px solid #333' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                          {player.first_name} {player.last_name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#999' }}>
                          {player.position}
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
                        color: player.overall_rating >= 80 ? '#00ff00' : 
                               player.overall_rating >= 70 ? '#90ee90' : 
                               player.overall_rating >= 60 ? '#ffd700' : '#ff6347'
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
                        {player.dribbling}
                      </td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                        {player.defending}
                      </td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                        {player.physical}
                      </td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333', fontSize: '11px' }}>
                        {canTrain ? (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Ready</span>
                        ) : (
                          <span style={{ color: '#ffc107' }}>{timeLeft}</span>
                        )}
                      </td>
                      <td style={{ padding: '4px 4px', textAlign: 'center' }}>
                        {canTrain && dailyTrainingsUsed < DAILY_TRAINING_LIMIT ? (
                          <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {trainableStats.map(stat => (
                              <button
                                key={stat.key}
                                onClick={() => handleTrainPlayer(player.id, `${player.first_name} ${player.last_name}`, stat.key)}
                                disabled={isTraining || player[stat.key] >= MAX_STAT_VALUE}
                                style={{
                                  padding: '3px 6px',
                                  backgroundColor: player[stat.key] >= MAX_STAT_VALUE ? '#666' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  cursor: player[stat.key] >= MAX_STAT_VALUE ? 'not-allowed' : 'pointer',
                                  opacity: isTraining ? 0.6 : 1
                                }}
                                title={player[stat.key] >= MAX_STAT_VALUE ? 'Max' : `Train ${stat.label}`}
                              >
                                {stat.label.substring(0, 3).toUpperCase()}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '10px' }}>
                            {dailyTrainingsUsed >= DAILY_TRAINING_LIMIT ? 'Limit' : 'Wait'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
);
}

export default Training;