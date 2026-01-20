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
      ENG: 'EN',
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
    minHeight: 'calc(100vh - 142px)',
    backgroundColor: 'transparent',
    padding: '1px 0'
  }}>
    {/* Single Module Container - Same width as dashboard */}
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      
      {/* Scouting Module with Grid */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '0px',
        borderRadius: '0px',
        display: 'grid',
        gridTemplateColumns: '400px 800px',
        gap: '0px'
      }}>
        
        {/* Left Column - Prospects Table (400px) */}
        <div style={{ 
          border: '1px solid #424242ff',
          borderRight: 'none',
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
                  POT
                </th>
                <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999' }}>
                  ACT
                </th>
              </tr>
            </thead>
            <tbody>
              {prospects.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px 10px', textAlign: 'center', color: '#666', fontSize: '11px' }}>
                    No prospects yet.<br/>Scout to find talent!
                  </td>
                </tr>
              ) : (
                prospects.map((prospect) => (
                  <tr 
                    key={prospect.id}
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
                        backgroundColor: getPositionColor(prospect.position),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '11px'
                      }}>
                        {prospect.position}
                      </span>
                    </td>
                    <td style={{ padding: '4px 4px', borderRight: '1px solid #333', fontWeight: 'bold', fontSize: '11px' }}>
                      <div style={{ marginBottom: '2px' }}>{prospect.name}</div>
                      <div style={{ fontSize: '18px' }}>{getNationalityFlag(prospect.nationality)}</div>
                    </td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>
                      {prospect.age}
                    </td>
                    <td style={{
                      padding: '4px 4px',
                      textAlign: 'center',
                      borderRight: '1px solid #333',
                      fontWeight: 'bold',
                      color: getRatingColor(prospect.overallRating)
                    }}>
                      {prospect.overallRating}
                    </td>
                    <td style={{
                      padding: '4px 4px',
                      textAlign: 'center',
                      borderRight: '1px solid #333',
                      fontWeight: 'bold',
                      color: '#007bff'
                    }}>
                      {prospect.potential}
                    </td>
                    <td style={{ padding: '4px 4px', textAlign: 'center' }}>
                      <button
                        onClick={() => handlePromote(prospect.id, prospect.name)}
                        disabled={promoting === prospect.id}
                        style={{
                          padding: '3px 6px',
                          backgroundColor: promoting === prospect.id ? '#666' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: promoting === prospect.id ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      >
                        {promoting === prospect.id ? '...' : 'Promote'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column - Scouting Missions (800px) */}
        <div style={{ 
          border: '1px solid #424242ff',
          backgroundColor: '#1a1a1a',
          overflow: 'auto',
          padding: '20px'
        }}>
          
          {/* Active Missions */}
          {missions.active.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px' }}>
                Active Missions ({missions.active.length}/3)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {missions.active.map(mission => (
                  <div
                    key={mission.id}
                    style={{
                      border: '2px solid #007bff',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: '#333'
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                      {getNationalityFlag(mission.nationality)}
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '14px' }}>
                      {getNationalityName(mission.nationality)}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                      Duration: {mission.durationHours}h
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: mission.isReady ? '#28a745' : '#007bff',
                      marginBottom: '8px'
                    }}>
                      {formatTimeRemaining(mission.minutesRemaining)}
                    </div>
                    {mission.isReady && (
                      <button
                        onClick={() => handleCollect(mission.id)}
                        disabled={collecting === mission.id}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: collecting === mission.id ? '#666' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: collecting === mission.id ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        {collecting === mission.id ? 'Collecting...' : 'Collect'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Missions */}
          {missions.completed.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px' }}>
                ✅ Ready to Collect
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {missions.completed.map(mission => (
                  <div
                    key={mission.id}
                    style={{
                      border: '2px solid #28a745',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: '#333'
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                      {getNationalityFlag(mission.nationality)}
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '14px' }}>
                      {getNationalityName(mission.nationality)}
                    </h4>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745', marginBottom: '10px' }}>
                      Mission Complete!
                    </div>
                    <button
                      onClick={() => handleCollect(mission.id)}
                      disabled={collecting === mission.id}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: collecting === mission.id ? '#666' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: collecting === mission.id ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    >
                      {collecting === mission.id ? 'Collecting...' : 'Collect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start New Mission */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '10px' }}>
              🌍 Start New Scouting Mission
            </h3>
            <div style={{ 
              backgroundColor: '#333',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #ffc107',
              fontSize: '12px',
              color: '#ccc'
            }}>
              <strong>💡 How it works:</strong> Send scouts to find young talent. Higher-tier nations cost more but may produce better prospects. Max 3 active missions.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
              {scoutingOptions.map(option => (
                <div
                  key={option.nationality}
                  style={{
                    border: `3px solid ${getTierColor(option.tier)}`,
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#333',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: getTierColor(option.tier),
                    color: 'white',
                    padding: '3px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    Tier {option.tier}
                  </div>
                  
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                    {getNationalityFlag(option.nationality)}
                  </div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>
                    {getNationalityName(option.nationality)}
                  </h4>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>
                      ⏱️ {option.hours} hours
                    </div>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      💰 ${option.cost.toLocaleString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStartScouting(option.nationality, option.cost)}
                    disabled={starting === option.nationality || missions.active.length >= 3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: starting === option.nationality ? '#666' : 
                                      missions.active.length >= 3 ? '#666' :
                                      getTierColor(option.tier),
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (starting === option.nationality || missions.active.length >= 3) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    {starting === option.nationality ? 'Starting...' :
                     missions.active.length >= 3 ? 'Max Missions' :
                     'Start Scout'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
);
}

export default ScoutingHub;
