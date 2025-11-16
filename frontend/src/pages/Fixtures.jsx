import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyFixtures, getLeagueTable, simulateMatchday, getNextScheduledMatch } from '../services/api';

function Fixtures() {
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState(null);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fixturesData = await getMyFixtures();
      setFixtures(fixturesData);
      
      // Fetch league table using the league ID
      if (fixturesData.league && fixturesData.league.id) {
        const tableData = await getLeagueTable(fixturesData.league.id);
        setTable(tableData.table);
      }

      // Fetch next match info
      const nextMatchData = await getNextScheduledMatch();
      setNextMatch(nextMatchData);
      
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

  const handleSimulate = async () => {
    if (!fixtures || !fixtures.league.id) return;
    
    setSimulating(true);
    try {
      await simulateMatchday(fixtures.league.id);
      // Reload data after simulation
      await loadData();
      alert('Matchday simulated successfully!');
    } catch (err) {
      console.error('Simulation failed:', err);
      alert('Failed to simulate matchday');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading fixtures...</h2>
      </div>
    );
  }

  if (error || !fixtures) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: 'red' }}>{error || 'No data available'}</h2>
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
        <h1>Fixtures & Results</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSimulate}
            disabled={simulating || fixtures.upcoming.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: simulating ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: simulating ? 'not-allowed' : 'pointer'
            }}
          >
            {simulating ? 'Simulating...' : 'Simulate Next Matchday'}
          </button>
        </div>
      </div>

      {/* League Info */}
      <div style={{ 
        backgroundColor: '#007bff', 
        color: 'white',
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>{fixtures.league.name}</h2>
        <p style={{ margin: 0, fontSize: '18px' }}>{fixtures.team.team_name}</p>
      </div>

      {/* Auto-Simulation Status */}
      {nextMatch && nextMatch.hasMatches && (
        <div style={{ 
          backgroundColor: nextMatch.isOverdue ? '#ffc107' : '#28a745',
          color: nextMatch.isOverdue ? '#000' : '#fff',
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <strong>
            {nextMatch.isOverdue 
              ? `⚠️ Matchday ${nextMatch.matchday} is overdue - will simulate within 5 minutes`
              : `⏰ Next matchday (${nextMatch.matchday}) in ${nextMatch.hoursUntil}h ${nextMatch.minutesUntil % 60}m`
            }
          </strong>
        </div>
      )}
      
      {nextMatch && !nextMatch.hasMatches && (
        <div style={{ 
          backgroundColor: '#6c757d',
          color: '#fff',
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <strong>🏆 Season Complete!</strong>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Column - Fixtures */}
        <div>
          {/* Upcoming Fixtures */}
          <div style={{ marginBottom: '40px' }}>
            <h2>Upcoming Fixtures</h2>
            {fixtures.upcoming.length === 0 ? (
              <p style={{ color: '#666' }}>No upcoming fixtures - season complete!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {fixtures.upcoming.slice(0, 10).map(match => {
                  const isHome = match.home_team.id === fixtures.team.id;
                  const venue = isHome ? 'Home' : 'Away';
                  
                  return (
                    <div 
                      key={match.id}
                      style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '15px',
                        backgroundColor: '#0f3a66ff'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>
                        Matchday {match.matchday} • {new Date(match.scheduled_date).toLocaleDateString('en-GB')}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {match.home_team.team_name} vs {match.away_team.team_name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: isHome ? '#28a745' : '#007bff',
                        marginTop: '5px',
                        fontWeight: 'bold'
                      }}>
                        ({venue})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            <h2>Recent Results</h2>
            {fixtures.played.length === 0 ? (
              <p style={{ color: '#666' }}>No matches played yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {fixtures.played.slice(-5).reverse().map(match => {
                  const isHome = match.home_team.id === fixtures.team.id;
                  const myScore = isHome ? match.home_score : match.away_score;
                  const theirScore = isHome ? match.away_score : match.home_score;
                  const result = myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
                  const resultColor = result === 'W' ? '#28a745' : result === 'L' ? '#dc3545' : '#ffc107';
                  
                  return (
                    <div 
                      key={match.id}
                      style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '15px',
                        backgroundColor: '#0f3a66ff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                          Matchday {match.matchday}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {match.home_team.team_name} {match.home_score} - {match.away_score} {match.away_team.team_name}
                        </div>
                      </div>
                      <div style={{ 
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: resultColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0f3a66ff',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        {result}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - League Table */}
        <div>
          <h2>League Table</h2>
          {table.length === 0 ? (
            <p style={{ color: '#666' }}>No matches played yet</p>
          ) : (
            <div style={{ 
              border: '1px solid #dee2e6', 
              borderRadius: '8px',
              backgroundColor: '#2266aaff',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f3a66ff' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>POS</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>TEAM</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>P</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>W</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>D</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>L</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>GF</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>GA</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>GD</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((team,) => {
                    const isMyTeam = team.teamId === fixtures.team.id;
                    return (
                      <tr 
                        key={team.teamId}
                        style={{ 
                          borderTop: '1px solid #dee2e6',
                          backgroundColor: isMyTeam ? '#18b153ff' : '#2266aaff',
                          fontWeight: isMyTeam ? 'bold' : 'normal'
                        }}
                      >
                        <td style={{ padding: '12px 8px', fontSize: '14px' }}>{team.position}</td>
                        <td style={{ padding: '12px 8px', fontSize: '14px' }}>{team.teamName}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px' }}>{team.played}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px' }}>{team.won}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px' }}>{team.drawn}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px' }}>{team.lost}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px' }}>{team.goalsFor}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px' }}>{team.goalsAgainst}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px' }}>{team.goalDifference}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>{team.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Fixtures;