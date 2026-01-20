import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeagueData, playFriendly, getLeagueTable } from '../services/api';

function Fixtures() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [nextMatchday, setNextMatchday] = useState(null);
  
  // Match selection
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [isHome, setIsHome] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  try {
    const leagueData = await getLeagueData();  // ← Changed from getAlphaFixtures
    setData(leagueData);
    
    // Fetch league table
    if (leagueData.league?.id) {
      const tableData = await getLeagueTable(leagueData.league.id);
      setTable(tableData.table || []);

      // Fetch league fixtures
      const response = await fetch(`http://localhost:5000/api/fixtures/league/${leagueData.league.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const fixturesResponse = await response.json();
      
      if (fixturesResponse) {
        setFixtures(fixturesResponse.fixtures || []);
        setNextMatchday(fixturesResponse.nextMatchday || 1);
        setCurrentMatchday(fixturesResponse.nextMatchday || 1);
      }
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
  setMatchResult(null);
  
  try {
    const result = await playFriendly(selectedOpponent, isHome);  // ← Changed from playMatch
    
    setMatchResult(result);
    
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
      
      {/* Top Row - Fixtures Module with Grid */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '0px',
        borderRadius: '0px',
        display: 'grid',
        gridTemplateColumns: '400px 800px',
        gap: '2px',
        marginBottom: '2px'
      }}>
        
        {/* Top Left - League Table */}
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

{/* Top Right - Next League Fixtures */}
<div style={{ 
  border: '1px solid #424242ff',
  backgroundColor: '#1a1a1a',
  overflow: 'auto',
  padding: '20px'
}}>
  <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '15px' }}>
    Next League Fixtures
  </h3>
  
  {/* Matchday navigation */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
    <button
      onClick={() => setCurrentMatchday(Math.max(1, currentMatchday - 1))}
      disabled={currentMatchday === 1}
      style={{
        padding: '8px 16px',
        backgroundColor: currentMatchday === 1 ? '#666' : '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: currentMatchday === 1 ? 'not-allowed' : 'pointer',
        fontSize: '14px'
      }}
    >
      ← Previous
    </button>
    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
      Matchday {currentMatchday}
    </div>
    <button
      onClick={() => setCurrentMatchday(Math.min(22, currentMatchday + 1))}
      disabled={currentMatchday === 22}
      style={{
        padding: '8px 16px',
        backgroundColor: currentMatchday === 22 ? '#666' : '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: currentMatchday === 22 ? 'not-allowed' : 'pointer',
        fontSize: '14px'
      }}
    >
      Next →
    </button>
  </div>

  {/* Fixture date/time */}
  {fixtures.filter(f => f.matchday === currentMatchday)[0] && (
    <div style={{
      backgroundColor: currentMatchday === nextMatchday ? '#28a745' : '#007bff',
      color: '#fff',
      padding: '12px',
      borderRadius: '4px',
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: '15px',
      fontSize: '12px'
    }}>
      {new Date(fixtures.filter(f => f.matchday === currentMatchday)[0].scheduled_date).toLocaleString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>
  )}

  {/* Fixtures list */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {fixtures.filter(f => f.matchday === currentMatchday).length === 0 ? (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        No fixtures for this matchday
      </div>
    ) : (
      fixtures.filter(f => f.matchday === currentMatchday).map((fixture) => (
        <div 
          key={fixture.id}
          style={{
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '12px',
            backgroundColor: fixture.home_team.id === data.team.id || fixture.away_team.id === data.team.id ? '#1a4a1a' : '#333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1, textAlign: 'right', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
            {fixture.home_team.team_name}
          </div>
          <div style={{ padding: '0 15px', color: '#999', fontSize: '11px' }}>
            {fixture.is_played ? `${fixture.home_score} - ${fixture.away_score}` : 'vs'}
          </div>
          <div style={{ flex: 1, textAlign: 'left', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
            {fixture.away_team.team_name}
          </div>
        </div>
      ))
    )}
  </div>
</div>
</div>

      {/* Bottom Row */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '0px',
        borderRadius: '0px',
        display: 'grid',
        gridTemplateColumns: '400px 800px',
        gap: '2px'
      }}>

        {/* Bottom Left - Friendly Matches */}
        <div style={{ 
          border: '1px solid #424242ff',
          backgroundColor: '#1a1a1a',
          padding: '20px'
        }}>
          {/* Matches Remaining Counter */}
          <div style={{
            backgroundColor: data.matchesRemaining > 0 ? '#28a745' : '#dc3545',
            color: 'white',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '15px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {data.matchesRemaining}/5 Friendlies Today
          </div>

          {/* Opponent Selection */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#fff', fontSize: '12px' }}>
              Select Opponent:
            </label>
            <select
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              disabled={data.matchesRemaining <= 0}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
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
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#fff', fontSize: '12px' }}>
              Venue:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsHome(true)}
                disabled={data.matchesRemaining <= 0}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: isHome ? '#007bff' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: data.matchesRemaining <= 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                🏠 Home
              </button>
              <button
                onClick={() => setIsHome(false)}
                disabled={data.matchesRemaining <= 0}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: !isHome ? '#007bff' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: data.matchesRemaining <= 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                ✈️ Away
              </button>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlayMatch}
            disabled={playing || !selectedOpponent || data.matchesRemaining <= 0}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: (playing || !selectedOpponent || data.matchesRemaining <= 0) ? '#666' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (playing || !selectedOpponent || data.matchesRemaining <= 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {playing ? 'Simulating...' : 
             data.matchesRemaining <= 0 ? 'Daily Limit' :
             !selectedOpponent ? 'Select Opponent' : 
             'Play Friendly'}
          </button>

          {/* Match Result Display */}
          {matchResult && !matchResult.error && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              borderRadius: '4px',
              backgroundColor: '#333',
              border: `2px solid ${matchResult.match.userResult === 'W' ? '#28a745' : 
                                   matchResult.match.userResult === 'L' ? '#dc3545' : 
                                   '#ffc107'}`
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: matchResult.match.userResult === 'W' ? '#28a745' : 
                       matchResult.match.userResult === 'L' ? '#dc3545' : 
                       '#ffc107'
              }}>
                {matchResult.match.userResult === 'W' ? '✅ WIN!' : 
                 matchResult.match.userResult === 'L' ? '❌ LOSS' : 
                 '🤝 DRAW'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                {matchResult.match.homeTeam} {matchResult.match.homeScore} - {matchResult.match.awayScore} {matchResult.match.awayTeam}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Right - Empty for now */}
        <div style={{ 
          border: '1px solid #424242ff',
          backgroundColor: '#1a1a1a',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '14px' }}>EMPTY MODULE READY FOR USE</p>
        </div>

      </div>
    </div>
  </div>
);

}

export default Fixtures;
