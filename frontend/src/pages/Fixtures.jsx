import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlphaFixtures, playMatch, getLeagueTable } from '../services/api';

function Fixtures() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  
  // Match selection
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [isHome, setIsHome] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fixturesData = await getAlphaFixtures();
      setData(fixturesData);
      
      // Fetch league table
      if (fixturesData.league?.id) {
        const tableData = await getLeagueTable(fixturesData.league.id);
        setTable(tableData.table || []);
      }
      
    } catch (err) {
      console.error('Failed to load:', err);
      setError('Failed to load data');
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMatch = async () => {
    if (!selectedOpponent) {
      return;
    }
    
    if (data.matchesRemaining <= 0) {
      return;
    }
    
    setPlaying(true);
    setMatchResult(null); // Clear previous result
    
    try {
      const result = await playMatch(selectedOpponent, isHome);
      
      // Set the result to display
      setMatchResult(result);
      
      // Reload data
      await loadData();
      setSelectedOpponent('');
      
    } catch (err) {
      console.error('Match failed:', err);
      setMatchResult({
        error: true,
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to play match'
      });
    } finally {
      setPlaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: 'red' }}>{error || 'Error'}</h2>
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
      
      {/* Fixtures Module with Grid */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '0px',
        borderRadius: '0px',
        display: 'grid',
        gridTemplateColumns: '400px 800px',
        gap: '0px'
      }}>
        
      {/* Left Column - League Table (300px like dashboard side modules) */}
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
              <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #8b8b8bff' }}>POS</th>
              <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #8b8b8bff' }}>TEAM</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>P</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>W</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>D</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>L</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>GF</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>GA</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #8b8b8bff' }}>GD</th>
              <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999' }}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {table.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No matches played
                </td>
              </tr>
            ) : (
              table.map((team) => {
                const isMyTeam = team.teamId === data.team.id;
                return (
                  <tr 
                    key={team.teamId}
                    style={{ 
                      borderBottom: '1px solid #333',
                      backgroundColor: 'transparent',
                      color: '#fff'
                    }}
                  >
                    <td style={{ padding: '4px 4px', borderRight: '1px solid #333' }}>{team.position}</td>
                    <td style={{ padding: '4px 4px', fontWeight: isMyTeam ? 'bold' : 'normal', borderRight: '1px solid #333', color: isMyTeam ? '#df5a0dff' : '#FFF' }}>
                      {team.teamName}
                    </td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{team.played}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{team.won}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{team.drawn}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{team.lost}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{team.goalsFor}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{team.goalsAgainst}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{team.goalDifference}</td>
                    <td style={{ padding: '4px 4px', textAlign: 'center' }}>{team.points}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

        {/* Right Column - Play Match & History (900px like dashboard center) */}
        <div style={{ 
          border: '1px solid #424242ff',
          backgroundColor: '#1a1a1a',
          overflow: 'auto',
          padding: '20px'
        }}>
          
          {/* Matches Remaining Counter */}
          <div style={{
            backgroundColor: data.matchesRemaining > 0 ? '#28a745' : '#dc3545',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {data.matchesRemaining}/5 Matches Remaining Today
          </div>

          {/* Opponent Selection */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
              Select Opponent:
            </label>
            <select
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              disabled={data.matchesRemaining <= 0}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#333',
                color: '#fff'
              }}
            >
              <option value="">-- Choose Team --</option>
              {data.opponents && data.opponents.map(opp => (
                <option key={opp.id} value={opp.id}>
                  {opp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Home/Away Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
              Venue:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsHome(true)}
                disabled={data.matchesRemaining <= 0}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: isHome ? '#007bff' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: data.matchesRemaining <= 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                🏠 Home
              </button>
              <button
                onClick={() => setIsHome(false)}
                disabled={data.matchesRemaining <= 0}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: !isHome ? '#007bff' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: data.matchesRemaining <= 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ✈️ Away
              </button>
            </div>
            {isHome && (
              <p style={{ fontSize: '12px', color: '#28a745', marginTop: '8px', marginBottom: 0 }}>
                ✓ Home advantage (+5 rating bonus)
              </p>
            )}
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlayMatch}
            disabled={playing || !selectedOpponent || data.matchesRemaining <= 0}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: (playing || !selectedOpponent || data.matchesRemaining <= 0) ? '#666' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (playing || !selectedOpponent || data.matchesRemaining <= 0) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}
          >
            {playing ? 'Simulating...' : 
             data.matchesRemaining <= 0 ? 'Daily Limit Reached' :
             !selectedOpponent ? 'Select Opponent' : 
             'Play Match'}
          </button>

          {/* Match Result Display */}
          {matchResult && !matchResult.error && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#333',
              border: `2px solid ${matchResult.match.userResult === 'W' ? '#28a745' : 
                                   matchResult.match.userResult === 'L' ? '#dc3545' : 
                                   '#ffc107'}`
            }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '10px',
                color: matchResult.match.userResult === 'W' ? '#28a745' : 
                       matchResult.match.userResult === 'L' ? '#dc3545' : 
                       '#ffc107'
              }}>
                {matchResult.match.userResult === 'W' ? '✅ WIN!' : 
                 matchResult.match.userResult === 'L' ? '❌ LOSS' : 
                 '🤝 DRAW'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
                {matchResult.match.homeTeam} {matchResult.match.homeScore} - {matchResult.match.awayScore} {matchResult.match.awayTeam}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                Venue: {matchResult.match.isHome ? '🏠 Home' : '✈️ Away'}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Matches remaining: {matchResult.matchesRemaining}
              </div>
            </div>
          )}

          {/* Error Display */}
          {matchResult && matchResult.error && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#333',
              border: '2px solid #dc3545',
              color: '#dc3545'
            }}>
              {matchResult.message}
            </div>
          )}

          {/* Match History */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px' }}>Match History</h3>
            {!data.matchHistory || data.matchHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px',
                backgroundColor: '#333',
                borderRadius: '8px',
                color: '#666'
              }}>
                <p>No matches played yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.matchHistory.slice(0, 10).map(match => {
                  const isHome = match.home_team_id === data.team.id;
                  const myScore = isHome ? match.home_score : match.away_score;
                  const theirScore = isHome ? match.away_score : match.home_score;
                  const result = myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
                  const resultColor = result === 'W' ? '#28a745' : result === 'L' ? '#dc3545' : '#ffc107';
                  const opponent = isHome ? match.away_team.team_name : match.home_team.team_name;
                  const venue = isHome ? 'H' : 'A';
                  
                  return (
                    <div 
                      key={match.id}
                      style={{
                        border: '1px solid #333',
                        borderRadius: '4px',
                        padding: '12px',
                        backgroundColor: '#333',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                          vs {opponent} ({venue})
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                          {myScore} - {theirScore}
                        </div>
                      </div>
                      <div style={{ 
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        backgroundColor: resultColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
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

      </div>
    </div>
  </div>
);

}

export default Fixtures;
