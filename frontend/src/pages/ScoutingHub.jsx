import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getScoutingOptions,
  startScoutingMission,
  getMyMissions,
  collectMission,
  getMyProspects,
  promoteProspect
} from '../services/api';

function ScoutingHub() {
  const navigate = useNavigate();
  const [scoutingOptions, setScoutingOptions] = useState([]);
  const [missions, setMissions] = useState({ active: [], completed: [], history: [] });
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('scouting'); // scouting, prospects
  const [starting, setStarting] = useState(null);
  const [collecting, setCollecting] = useState(null);
  const [promoting, setPromoting] = useState(null);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [optionsData, missionsData, prospectsData] = await Promise.all([
        getScoutingOptions(),
        getMyMissions(),
        getMyProspects()
      ]);
      
      setScoutingOptions(optionsData.options);
      setMissions(missionsData);
      setProspects(prospectsData.prospects);
    } catch (err) {
      console.error('Failed to load scouting hub:', err);
      setError('Failed to load data');
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartScouting = async (nationality, cost) => {
    const team = JSON.parse(localStorage.getItem('team'));
    if (team.budget < cost) {
      alert('Insufficient funds!');
      return;
    }
    
    if (!confirm(`Start scouting mission in ${getNationalityName(nationality)} for $${cost.toLocaleString()}?`)) {
      return;
    }
    
    setStarting(nationality);
    try {
      await startScoutingMission(nationality);
      await loadData();
      alert('Scouting mission started!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start mission');
    } finally {
      setStarting(null);
    }
  };

  const handleCollect = async (missionId) => {
    setCollecting(missionId);
    try {
      const result = await collectMission(missionId);
      
      // Show results
      const prospectsText = result.prospects.map(p => 
        `${p.name} (${p.position}, ${p.age}yo) - OVR ${p.overallRating} | POT ${p.potential}`
      ).join('\n');
      
      alert(`Mission Complete!\n\nNew Prospects:\n${prospectsText}`);
      
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to collect mission');
    } finally {
      setCollecting(null);
    }
  };

  const handlePromote = async (prospectId, prospectName) => {
    if (!confirm(`Promote ${prospectName} to the senior team?`)) {
      return;
    }
    
    setPromoting(prospectId);
    try {
      await promoteProspect(prospectId);
      alert(`${prospectName} promoted to senior team!`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to promote prospect');
    } finally {
      setPromoting(null);
    }
  };

  const getNationalityName = (code) => {
    const names = {
      BRA: 'Brazil',
      ITA: 'Italy',
      GER: 'Germany',
      ESP: 'Spain',
      ENG: 'England',
      FRA: 'France',
      ARG: 'Argentina',
      NED: 'Netherlands'
    };
    return names[code] || code;
  };

  const getNationalityFlag = (code) => {
    const flags = {
      BRA: '🇧🇷',
      ITA: '🇮🇹',
      GER: '🇩🇪',
      ESP: '🇪🇸',
      ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      FRA: '🇫🇷',
      ARG: '🇦🇷',
      NED: '🇳🇱'
    };
    return flags[code] || '🌍';
  };

  const getTierColor = (tier) => {
    if (tier === 1) return '#28a745'; // Green
    if (tier === 2) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
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

  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return 'Ready!';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading Scouting Hub...</h2>
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
      <h1>Scouting Hub</h1>

      {/* Tabs */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('scouting')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'scouting' ? '#007bff' : '#e9ecef',
            color: activeTab === 'scouting' ? 'white' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          🔍 Scouting Missions
        </button>
        <button
          onClick={() => setActiveTab('prospects')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'prospects' ? '#007bff' : '#e9ecef',
            color: activeTab === 'prospects' ? 'white' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          👤 My Prospects ({prospects.length})
        </button>
      </div>

      {/* SCOUTING TAB */}
      {activeTab === 'scouting' && (
        <>
          {/* Active Missions */}
          {missions.active.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>Active Missions ({missions.active.length}/3)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {missions.active.map(mission => (
                  <div
                    key={mission.id}
                    style={{
                      border: '2px solid #007bff',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#0f3a66ff'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                      {getNationalityFlag(mission.nationality)}
                    </div>
                    <h3 style={{ margin: '0 0 10px 0' }}>{getNationalityName(mission.nationality)}</h3>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                      Duration: {mission.durationHours} hours
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: mission.isReady ? '#28a745' : '#007bff',
                      marginBottom: '10px'
                    }}>
                      {formatTimeRemaining(mission.minutesRemaining)}
                    </div>
                    {mission.isReady && (
                      <button
                        onClick={() => handleCollect(mission.id)}
                        disabled={collecting === mission.id}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: collecting === mission.id ? '#0f3a66ff' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: collecting === mission.id ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {collecting === mission.id ? 'Collecting...' : 'Collect Results'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Missions Ready to Collect */}
          {missions.completed.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>✅ Ready to Collect</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {missions.completed.map(mission => (
                  <div
                    key={mission.id}
                    style={{
                      border: '2px solid #28a745',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#0f3a66ff'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                      {getNationalityFlag(mission.nationality)}
                    </div>
                    <h3 style={{ margin: '0 0 10px 0' }}>{getNationalityName(mission.nationality)}</h3>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745', marginBottom: '15px' }}>
                      Mission Complete!
                    </div>
                    <button
                      onClick={() => handleCollect(mission.id)}
                      disabled={collecting === mission.id}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: collecting === mission.id ? '#0f3a66ff' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: collecting === mission.id ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {collecting === mission.id ? 'Collecting...' : 'Collect Results'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start New Mission */}
          <div>
            <h2>🌍 Start New Scouting Mission</h2>
            <div style={{ 
              backgroundColor: '#0f3a66ff',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ffc107'
            }}>
              <strong>💡 How it works:</strong> Send a scout to search for young talent. Higher-tier nations cost more and take longer, but may produce better prospects. You can have up to 3 active missions at once.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {scoutingOptions.map(option => (
                <div
                  key={option.nationality}
                  style={{
                    border: `3px solid ${getTierColor(option.tier)}`,
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: '#0f3a66ff',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: getTierColor(option.tier),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Tier {option.tier}
                  </div>
                  
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    {getNationalityFlag(option.nationality)}
                  </div>
                  <h3 style={{ margin: '0 0 15px 0' }}>{getNationalityName(option.nationality)}</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      ⏱️ Duration: <strong>{option.hours} hours</strong>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      💰 Cost: <strong>${option.cost.toLocaleString()}</strong>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStartScouting(option.nationality, option.cost)}
                    disabled={starting === option.nationality || missions.active.length >= 3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: starting === option.nationality ? '#0f3a66ff' : 
                                      missions.active.length >= 3 ? '#6c757d' :
                                      getTierColor(option.tier),
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (starting === option.nationality || missions.active.length >= 3) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {starting === option.nationality ? 'Starting...' :
                     missions.active.length >= 3 ? 'Max Missions' :
                     'Start Scouting'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* PROSPECTS TAB */}
      {activeTab === 'prospects' && (
        <div>
          <h2>Youth Prospects ({prospects.length})</h2>
          
          {prospects.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '50px',
              backgroundColor: '#0f3a66ff',
              borderRadius: '8px',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
              <h3>No prospects yet</h3>
              <p>Start a scouting mission to find young talent!</p>
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
                    <th style={{ padding: '12px 8px', textAlign: 'left' }}>NAT</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left' }}>POS</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left' }}>NAME</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>AGE</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold' }}>OVR</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#007bff' }}>POT</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>PAC</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>SHO</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>PAS</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>DEF</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>PHY</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((prospect, index) => (
                    <tr
                      key={prospect.id}
                      style={{
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? '#0f3a66ff' : '#0f3a66ff'
                      }}
                    >
                      <td style={{ padding: '12px 8px', fontSize: '24px' }}>
                        {getNationalityFlag(prospect.nationality)}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getPositionColor(prospect.position),
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          {prospect.position}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                        {prospect.name}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {prospect.age}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: getRatingColor(prospect.overallRating)
                      }}>
                        {prospect.overallRating}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        color: '#007bff'
                      }}>
                        {prospect.potential}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {prospect.stats.pace}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {prospect.stats.shooting}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {prospect.stats.passing}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {prospect.stats.defending}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {prospect.stats.physical}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => handlePromote(prospect.id, prospect.name)}
                          disabled={promoting === prospect.id}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: promoting === prospect.id ? '#0f3a66ff' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: promoting === prospect.id ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {promoting === prospect.id ? '...' : 'Promote'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ScoutingHub;
