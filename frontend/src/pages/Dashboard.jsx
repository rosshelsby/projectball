import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyToken, getLeagueTable, getAlphaFixtures, getRecentResults } from '../services/api';
import { getSocket } from '../services/socket';

function Dashboard() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [leagueTable, setLeagueTable] = useState([]);
  const [liveScores, setLiveScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingScore, setTypingScore] = useState(null);
  const [typingIndex, setTypingIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeUpdate = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    
    return () => clearInterval(timeUpdate);
  }, []);

  useEffect(() => {
    loadData();
    
    // Socket listener for live match results
    const socket = getSocket();
    if (socket) {
      socket.on('match-result-global', (data) => {
        console.log('Live match result:', data);

        // Start typing animation for new score
        setTypingScore(data);
        setTypingIndex(0);
        
      });
    }

    return () => {
      if (socket) {
        socket.off('match-result-global');
      }
    };
  }, []);

  useEffect(() => {
  const cursorBlink = setInterval(() => {
    setShowCursor(prev => !prev);
  }, 500); // Blink every 500ms
  
  return () => clearInterval(cursorBlink);
}, []);

// Typing animation
useEffect(() => {
  if (!typingScore) return;
  
  const fullText = `${typingScore.homeTeam.toUpperCase()}  ${typingScore.homeScore}-${typingScore.awayScore}  ${typingScore.awayTeam.toUpperCase()}`;
  
  if (typingIndex < fullText.length) {
    const timeout = setTimeout(() => {
      setTypingIndex(prev => prev + 1);
    }, 100); // Type 1 character every 50ms
    
    return () => clearTimeout(timeout);
  } else {

    const completeTimeout = setTimeout (() => {
      setLiveScores(prev => [typingScore, ...prev].slice (0.5));
      setTypingScore(null);
      setTypingIndex(0);
      loadData();
  }, 500);

    return () => clearTimeout(completeTimeout);
  }
}, [typingScore, typingIndex]);

  const loadData = async () => {
    try {
      const userData = await verifyToken();
      setTeam(userData.team);

        // Get league ID from alpha fixtures
      const fixturesData = await getAlphaFixtures();

      // Load league table
      if (fixturesData.league?.id) {
        try {
          const tableData = await getLeagueTable(fixturesData.league.id);
          setLeagueTable(tableData.table || []);
        } catch (err) {
          console.error('Failed to load league table:', err);
        }
      }

      // Load recent match results
    try {
      const recentData = await getRecentResults();
      setLiveScores(recentData.results || []);
    } catch (err) {
      console.error('Failed to load recent results:', err);
    }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        color: '#fff'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 142px)',
      backgroundColor: 'transparent',
      padding: '1px 0'
    }}>
      {/* Grid Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 600px 300px',
        gridTemplateRows: '388px 450px',
        gap: '2px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* Top Left - Inbox */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          overflow: 'auto'
        }}>
          <h2 style={{ color: '#fff', marginTop: 0, fontSize: '18px', marginBottom: '15px' }}>
            📬 Inbox
          </h2>
          <p style={{ color: '#666', fontSize: '14px' }}>No new messages</p>
        </div>

        {/* Top Center - League Table */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '0px',
          overflow: 'auto'
        }}>
          <h2 style={{ 
            color: '#fff', 
            marginTop: 0, fontSize: '13px', 
            marginBottom: '0', 
            paddingBottom: '8px', 
            paddingLeft: '16px', 
            paddingTop: '8px', 
            borderBottom: '1px solid #8b8b8bff', 
            background: 'linear-gradient(to bottom, #313131ff, #181818ff)' 
            }}>
            League Table
          </h2>
          {leagueTable.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No league data available</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #333' }}>POS</th>
                  <th style={{ padding: '4px 4px', textAlign: 'left', color: '#999', borderRight: '1px solid #333' }}>TEAM</th>
                  <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #333' }}>P</th>
                  <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #333' }}>W</th>
                  <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #333' }}>D</th>
                  <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #333' }}>L</th>
                  <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999', borderRight: '1px solid #333' }}>GD</th>
                  <th style={{ padding: '4px 4px', textAlign: 'center', color: '#999' }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {leagueTable.map((teamData) => {
                  const isMyTeam = teamData.teamId === team?.id;
                  return (
                    <tr
                      key={teamData.teamId}
                      style={{
                        borderBottom: '1px solid #333',
                        backgroundColor: 'transparent',
                        color: '#fff'
                      }}
                    >
                      <td style={{ padding: '4px 4px', borderRight: '1px solid #333' }}>{teamData.position}</td>
                      <td style={{ padding: '4px 4px', fontWeight: isMyTeam ? 'bold' : 'normal', borderRight: '1px solid #333', color: isMyTeam ? '#df5a0dff' : '#FFF' }}>
                        {teamData.teamName}
                      </td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{teamData.played}</td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{teamData.won}</td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{teamData.drawn}</td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{teamData.lost}</td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', borderRight: '1px solid #333' }}>{teamData.goalDifference}</td>
                      <td style={{ padding: '4px 4px', textAlign: 'center', }}>
                        {teamData.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

          {/* Top Right - Live Scores (Authentic Ceefax) */}
          <div style={{
            backgroundColor: '#000',
            padding: '0',
            overflow: 'hidden',
            fontFamily: '"VT323", Courier New, monospace',
            color: '#fff',
            fontSize: '18px',
            lineHeight: '1.2',
            transformOrigin: 'top',
            fontWeight: '900',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>

           {/* BBC Ceefax Header */}
            <div style={{
              display: 'flex',
              alignItems: 'stretch'
            }}>
             {/* LIVE Blocks - Black background */}
            <div style={{
              backgroundColor: '#000',
              padding: '8px 12px',
              display: 'flex',
              gap: '3px',
              alignItems: 'center'
            }}>
              <div style={{ 
                width: '25px', 
                height: '35px', 
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '900',
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                color: '#000'
              }}>L</div>
              <div style={{ 
                width: '25px', 
                height: '35px', 
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '900',
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                color: '#000'
              }}>I</div>
              <div style={{ 
                width: '25px', 
                height: '35px', 
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '900',
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                color: '#000'
              }}>V</div>
              <div style={{ 
                width: '25px', 
                height: '35px', 
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '900',
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                color: '#000'
              }}>E</div>
            </div>

            {/* SCORES text - Blue background, spans remaining width */}
              <div style={{
                backgroundColor: '#00f',
                flex: 1,
                padding: '0px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ 
                  color: '#0f0', 
                  fontSize: '24px', 
                  fontWeight: '900',
                  letterSpacing: '3px',
                  textShadow: '2px 2px 0px #000',
                  fontFamily: '"Press Start 2P", "Courier New", monospace',
                  imageRendering: 'pixelated'
                }}>
                  SCORES
                </span>
              </div>
            </div>

            {/* Section Header */}
            <div style={{
              backgroundColor: '#000',
              color: '#0f0',
              paddingLeft: '6px',
              paddingRight: '16px',
              paddingTop: '0',
              paddingBottom: '0',
              fontSize: '18px',
              letterSpacing: '1px',
              fontWeight: 'bold'
            }}>
              GAFFER WORLD RESULTS/FIXTURES
            </div>

            {/* Scores List */}
            <div style={{
              paddingLeft: '6px',
              paddingRight: '16px',
              paddingTop: '0',
              paddingBottom: '0',
              backgroundColor: '#000',
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>

               {/* Show cursor when waiting (no typing animation active) */}
                {!typingScore && (
                  <div style={{
                    fontSize: '18px',
                    marginBottom: '12px',
                    fontWeight: '900'
                  }}>
                  <span style={{ 
                    backgroundColor: showCursor ? '#fff' : 'transparent',
                    display: 'inline-block',
                    width: '12px',
                    height: '18px',
                    verticalAlign: 'middle'
                  }}></span>
                  </div>
                )}

               {/* Typing Score Line */}
                {typingScore && (
                  <div style={{
                    fontSize: '18px',
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '12px',
                    fontWeight: '900'
                  }}>
                    {(() => {
                      const homeTeam = typingScore.homeTeam.toUpperCase();
                      const score = `${typingScore.homeScore}-${typingScore.awayScore}`;
                      const awayTeam = typingScore.awayTeam.toUpperCase();
                      const fullText = `${homeTeam}  ${score}  ${awayTeam}`;
                      const typedText = fullText.substring(0, typingIndex);
                      
                      // Calculate positions
                      const homeEnd = homeTeam.length;
                      const scoreStart = homeTeam.length + 2;
                      const scoreEnd = scoreStart + score.length;
                      const awayStart = scoreEnd + 2;
                      
                      const homeTyped = typedText.substring(0, homeEnd);
                      const scoreTyped = typedText.substring(scoreStart, scoreEnd);
                      const awayTyped = typedText.substring(awayStart);
                      
                      // Determine which column cursor is in
                      const cursorInHome = typingIndex <= homeEnd;
                      const cursorInScore = typingIndex > homeEnd + 2 && typingIndex <= scoreEnd + 2;
                      const cursorInAway = typingIndex > scoreEnd + 2;
                      
                      return (
                        <>
                          {/* Home Team */}
                          <div style={{ 
                            color: '#0ff',
                            width: '140px',
                            textAlign: 'left',
                            letterSpacing: '0.5px'
                          }}>
                            {homeTyped}
                            {cursorInHome && <span style={{ 
                              backgroundColor: '#fff',
                              display: 'inline-block',
                              width: '12px',
                              height: '18px',
                              verticalAlign: 'middle',
                              marginLeft: '2px'
                            }}></span>}
                          </div>
                          
                          {/* Score */}
                          <div style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            minWidth: '50px',
                            textAlign: 'center'
                          }}>
                            {scoreTyped}
                            {cursorInScore && <span style={{ 
                              backgroundColor: '#fff',
                              display: 'inline-block',
                              width: '12px',
                              height: '18px',
                              verticalAlign: 'middle',
                              marginLeft: '2px'
                            }}></span>}
                          </div>
                          
                          {/* Away Team */}
                          <div style={{ 
                            color: '#0ff',
                            width: '140px',
                            textAlign: 'left'
                          }}>
                            {awayTyped}
                            {cursorInAway && <span style={{ 
                              backgroundColor: '#fff',
                              display: 'inline-block',
                              width: '12px',
                              height: '18px',
                              verticalAlign: 'middle',
                              marginLeft: '2px'
                            }}></span>}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

              {liveScores.length === 0 && !typingScore ? (
                <div style={{
                  color: '#0ff',
                  fontSize: '18px',
                  padding: '20px 0'
                }}>
                  NO MATCHES PLAYED
                  {showCursor && <span style={{ 
                    backgroundColor: '#fff',
                    color: '#000',
                    marginLeft: '8px',
                    padding: '0 2px'
                  }}>█</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {liveScores.map((match, index) => {
                    
                    return (
                      <div key={index}
                        style={{
                          fontSize: '18px',
                          display: 'flex',
                          gap: '12px',
                          marginBottom: '2px',
                          fontWeight: '900'
                        }}
                      >
                        {/* Home Team - Cyan */}
                        <div style={{ 
                          color: '#0ff',
                          width: '140px',
                          textAlign: 'left',
                          letterSpacing: '0.5px'
                        }}>
                          {match.homeTeam.toUpperCase()}
                        </div>
                        
                        {/* Score - White/Yellow */}
                        <div style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          minWidth: '50px',
                          textAlign: 'center'
                        }}>
                          {match.homeScore}-{match.awayScore}
                        </div>
                        
                        {/* Away Team - Cyan */}
                        <div style={{ 
                          color: '#0ff',
                          width: '140px',
                          textAlign: 'left'
                        }}>
                          {match.awayTeam.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer/Time */}
            <div style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '8px 12px',
              fontSize: '7px',
              textAlign: 'right',
              borderTop: '1px solid #333',
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              marginTop: 'auto'
            }}>
              {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

        {/* Bottom Left - Empty Module */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '16px', textAlign: 'center' }}>EMPTY MODULE<br/>READY FOR USE</p>
        </div>

        {/* Bottom Center - Empty Module */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '16px' }}>EMPTY MODULE READY FOR USE</p>
        </div>

        {/* Bottom Right - Empty Module */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '16px', textAlign: 'center' }}>EMPTY MODULE<br/>READY FOR USE</p>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;