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
    <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Fixtures - ALPHA Testing</h1>

      {/* League Info */}
      <div style={{ 
        backgroundColor: '#007bff', 
        color: 'white',
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>{data.league.name}</h2>
        <p style={{ margin: 0, fontSize: '18px' }}>{data.team.team_name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Column - Play Match */}
        <div>
          {/* Play Match Section */}
          <div style={{ 
            border: '2px solid #28a745',
            borderRadius: '8px',
            padding: '25px',
            backgroundColor: '#0f3a66ff',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginTop: 0, color: '#28a745' }}>⚽ Play a Match</h2>
            
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Select Opponent:
              </label>
              <select
                value={selectedOpponent}
                onChange={(e) => setSelectedOpponent(e.target.value)}
                disabled={data.matchesRemaining <= 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  backgroundColor: data.matchesRemaining <= 0 ? '#0f3a66ff' : '#4090e0ff'
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
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Venue:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsHome(true)}
                  disabled={data.matchesRemaining <= 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: isHome ? '#007bff' : '#0a427aff',
                    color: isHome ? 'white' : '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: data.matchesRemaining <= 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  🏠 Home
                </button>
                <button
                  onClick={() => setIsHome(false)}
                  disabled={data.matchesRemaining <= 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: !isHome ? '#007bff' : '#134372ff',
                    color: !isHome ? 'white' : '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: data.matchesRemaining <= 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  ✈️ Away
                </button>
              </div>
              {isHome && (
                <p style={{ fontSize: '14px', color: '#28a745', marginTop: '8px', marginBottom: 0 }}>
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
                padding: '15px',
                backgroundColor: (playing || !selectedOpponent || data.matchesRemaining <= 0) ? '#0f3a66ff' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (playing || !selectedOpponent || data.matchesRemaining <= 0) ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                fontWeight: 'bold'
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
                marginTop: '20px',
                padding: '20px',
                borderRadius: '8px',
                backgroundColor: matchResult.match.userResult === 'W' ? '#0f3a66ff' : 
                                 matchResult.match.userResult === 'L' ? '#0f3a66ff' : 
                                 '#fff3cd',
                border: `2px solid ${matchResult.match.userResult === 'W' ? '#28a745' : 
                                     matchResult.match.userResult === 'L' ? '#dc3545' : 
                                     '#ffc107'}`
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  color: matchResult.match.userResult === 'W' ? '#155724' : 
                         matchResult.match.userResult === 'L' ? '#721c24' : 
                         '#856404'
                }}>
                  {matchResult.match.userResult === 'W' ? '✅ WIN!' : 
                   matchResult.match.userResult === 'L' ? '❌ LOSS' : 
                   '🤝 DRAW'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
                  {matchResult.match.homeTeam} {matchResult.match.homeScore} - {matchResult.match.awayScore} {matchResult.match.awayTeam}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  Venue: {matchResult.match.isHome ? '🏠 Home' : '✈️ Away'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Matches remaining today: {matchResult.matchesRemaining}
                </div>
              </div>
            )}

            {/* Error Display */}
            {matchResult && matchResult.error && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: '#0f3a66ff',
                border: '2px solid #dc3545',
                color: '#721c24'
              }}>
                {matchResult.message}
              </div>
            )}
          </div>
          
          {/* Match History */}
          <div>
            <h2>Match History</h2>
            {!data.matchHistory || data.matchHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px',
                backgroundColor: '#0f3a66ff',
                borderRadius: '8px',
                color: '#666'
              }}>
                <p>No matches played yet. Play your first match above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                          vs {opponent} ({venue})
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {myScore} - {theirScore}
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
                        color: 'white',
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
              backgroundColor: '#0f3a66ff',
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
                  {table.map((team) => {
                    const isMyTeam = team.teamId === data.team.id;
                    return (
                      <tr 
                        key={team.teamId}
                        style={{ 
                          borderTop: '1px solid #dee2e6',
                          backgroundColor: isMyTeam ? '#0f3a66ff' : '#206db9ff',
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
