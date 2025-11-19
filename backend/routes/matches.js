const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');
const { simulateMatchday } = require('../utils/matchEngine');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Get user's league and upcoming fixtures
router.get('/my-fixtures', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('user_id', userId)
      .single();
    
    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get team's league
    const { data: membership, error: memberError } = await supabase
      .from('league_memberships')
      .select('league_id, leagues(name, division_level)')
      .eq('team_id', team.id)
      .eq('season', '2024-25')
      .single();
    
    if (memberError || !membership) {
      return res.status(404).json({ error: 'Not in a league' });
    }
    
    // Get all matches for this team
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        matchday,
        scheduled_date,
        home_score,
        away_score,
        is_played,
        home_team:teams!matches_home_team_id_fkey(id, team_name),
        away_team:teams!matches_away_team_id_fkey(id, team_name)
      `)
      .eq('league_id', membership.league_id)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .order('matchday');
    
    if (matchesError) {
      throw matchesError;
    }
    
    // Separate played and upcoming
    const played = matches.filter(m => m.is_played);
    const upcoming = matches.filter(m => !m.is_played);
    
    res.json({
      team: team,
      league: {
        id: membership.league_id,  // ADD THIS LINE
        name: membership.leagues.name,
        division_level: membership.leagues.division_level
      },
      played: played,
      upcoming: upcoming
    });
    
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

// Get full league table
router.get('/league-table/:leagueId', verifyToken, async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    // Get all teams in this league
    const { data: memberships, error: memberError } = await supabase
      .from('league_memberships')
      .select('team_id, teams(id, team_name)')
      .eq('league_id', leagueId)
      .eq('season', '2024-25');
    
    if (memberError || !memberships) {
      return res.status(404).json({ error: 'League not found' });
    }
    
    // Get all played matches in this league
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('league_id', leagueId)
      .eq('is_played', true);
    
    if (matchesError) {
      throw matchesError;
    }
    
    // Calculate standings
    const standings = {};
    
    // Initialize all teams
    memberships.forEach(m => {
      standings[m.team_id] = {
        teamId: m.team_id,
        teamName: m.teams.team_name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      };
    });
    
    // Process each match
    matches.forEach(match => {
      const homeTeam = standings[match.home_team_id];
      const awayTeam = standings[match.away_team_id];
      
      if (!homeTeam || !awayTeam) return;
      
      homeTeam.played++;
      awayTeam.played++;
      
      homeTeam.goalsFor += match.home_score;
      homeTeam.goalsAgainst += match.away_score;
      awayTeam.goalsFor += match.away_score;
      awayTeam.goalsAgainst += match.home_score;
      
      if (match.home_score > match.away_score) {
        // Home win
        homeTeam.won++;
        homeTeam.points += 3;
        awayTeam.lost++;
      } else if (match.home_score < match.away_score) {
        // Away win
        awayTeam.won++;
        awayTeam.points += 3;
        homeTeam.lost++;
      } else {
        // Draw
        homeTeam.drawn++;
        awayTeam.drawn++;
        homeTeam.points++;
        awayTeam.points++;
      }
    });
    
    // Calculate goal difference and sort
    const table = Object.values(standings).map(team => {
      team.goalDifference = team.goalsFor - team.goalsAgainst;
      return team;
    }).sort((a, b) => {
      // Sort by points, then goal difference, then goals for
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    // Add position
    table.forEach((team, index) => {
      team.position = index + 1;
    });
    
    res.json({ table });
    
  } catch (error) {
    console.error('Error generating table:', error);
    res.status(500).json({ error: 'Failed to generate league table' });
  }
});

// Simulate next matchday (admin function - later we'll automate this)
router.post('/simulate-matchday', verifyToken, async (req, res) => {
  try {
    const { leagueId } = req.body;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID required' });
    }
    
    // Find next unplayed matchday
    const { data: nextMatch } = await supabase
      .from('matches')
      .select('matchday')
      .eq('league_id', leagueId)
      .eq('is_played', false)
      .order('matchday')
      .limit(1)
      .single();
    
    if (!nextMatch) {
      return res.json({ message: 'All matches played!' });
    }
    
    const results = await simulateMatchday(leagueId, nextMatch.matchday);
    
    res.json({
      matchday: nextMatch.matchday,
      results: results
    });
    
  } catch (error) {
    console.error('Error simulating matchday:', error);
    res.status(500).json({ error: 'Failed to simulate matchday' });
  }
});

// Get next scheduled match info (for showing countdown)
router.get('/next-scheduled', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's team
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get user's league
    const { data: membership } = await supabase
      .from('league_memberships')
      .select('league_id')
      .eq('team_id', team.id)
      .eq('season', '2024-25')
      .single();
    
    if (!membership) {
      return res.status(404).json({ error: 'Not in a league' });
    }
    
    // Get next unplayed match for this league
    const { data: nextMatch } = await supabase
      .from('matches')
      .select('scheduled_date, matchday')
      .eq('league_id', membership.league_id)
      .eq('is_played', false)
      .order('scheduled_date')
      .limit(1)
      .single();
    
    if (!nextMatch) {
      return res.json({ 
        hasMatches: false,
        message: 'Season complete!'
      });
    }
    
    const now = new Date();
    const matchDate = new Date(nextMatch.scheduled_date);
    const isOverdue = matchDate < now;
    const timeUntil = matchDate - now;
    
    res.json({
      hasMatches: true,
      matchday: nextMatch.matchday,
      scheduledDate: nextMatch.scheduled_date,
      isOverdue: isOverdue,
      minutesUntil: Math.floor(timeUntil / 1000 / 60),
      hoursUntil: Math.floor(timeUntil / 1000 / 60 / 60)
    });
    
  } catch (error) {
    console.error('Error fetching next match:', error);
    res.status(500).json({ error: 'Failed to fetch next match' });
  }
});

// Simple match simulation helper function
function simulateSingleMatch(homeAvgRating, awayAvgRating) {
  // Home advantage (+5 rating)
  const homeEffective = homeAvgRating + 5;
  
  // Base goals
  let homeGoals = Math.floor(Math.random() * 3);
  let awayGoals = Math.floor(Math.random() * 3);
  
  // Adjust based on rating difference
  const diff = homeEffective - awayAvgRating;
  if (diff > 10) homeGoals += Math.floor(Math.random() * 2) + 1;
  else if (diff > 5) homeGoals += Math.floor(Math.random() * 2);
  
  if (diff < -10) awayGoals += Math.floor(Math.random() * 2) + 1;
  else if (diff < -5) awayGoals += Math.floor(Math.random() * 2);
  
  // 20% upset chance
  if (Math.random() < 0.2) {
    [homeGoals, awayGoals] = [awayGoals, homeGoals];
  }
  
  return { homeGoals, awayGoals };
}

// ALPHA: Get fixtures with opponents list and daily match limit
router.get('/alpha-fixtures', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const { data: team } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('user_id', userId)
      .single();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const { data: membership } = await supabase
      .from('league_memberships')
      .select('league_id, leagues(name, division_level)')
      .eq('team_id', team.id)
      .eq('season', '2024-25')
      .single();
    
    if (!membership) {
      return res.status(404).json({ error: 'Not in a league' });
    }
    
    // Get OTHER teams in league (opponents)
    const { data: opponents } = await supabase
      .from('league_memberships')
      .select('team_id, teams(id, team_name)')
      .eq('league_id', membership.league_id)
      .eq('season', '2024-25')
      .neq('team_id', team.id);
    
    // Get match history
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id,
        home_score,
        away_score,
        created_at,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(team_name),
        away_team:teams!matches_away_team_id_fkey(team_name)
      `)
      .eq('league_id', membership.league_id)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .eq('is_played', true)
      .order('created_at', { ascending: false });
    
    // Count today's matches
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchesToday = (matches || []).filter(m => {
      const matchDate = new Date(m.created_at);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate.getTime() === today.getTime();
    }).length;

    console.log('Matches today:', matchesToday);  // ← Add this
    console.log('Total matches:', matches?.length);  // ← Add this
    
    res.json({
      team,
      league: {
        id: membership.league_id,
        name: membership.leagues.name,
        division_level: membership.leagues.division_level
      },
      opponents: (opponents || []).map(o => ({
        id: o.teams.id,
        name: o.teams.team_name
      })),
      matchHistory: matches || [],
      matchesToday,
      matchesRemaining: Math.max(0, 5 - matchesToday)
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// ALPHA: Play a match manually
router.post('/play-match', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { opponentTeamId, isHome } = req.body;
    
    if (!opponentTeamId || typeof isHome !== 'boolean') {
      return res.status(400).json({ error: 'Opponent team ID and home/away required' });
    }
    
    // Get user's team
    const { data: userTeam } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('user_id', userId)
      .single();
    
    if (!userTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get opponent
    const { data: opponentTeam } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('id', opponentTeamId)
      .single();
    
    if (!opponentTeam) {
      return res.status(404).json({ error: 'Opponent not found' });
    }
    
    // Get league
    const { data: membership } = await supabase
      .from('league_memberships')
      .select('league_id')
      .eq('team_id', userTeam.id)
      .eq('season', '2024-25')
      .single();
    
    if (!membership) {
      return res.status(404).json({ error: 'Not in league' });
    }
    
    // Check 5 match limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: todayMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('league_id', membership.league_id)
      .or(`home_team_id.eq.${userTeam.id},away_team_id.eq.${userTeam.id}`)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

      console.log('Today matches count:', todayMatches?.length);  // ← Add this
console.log('Today date range:', today.toISOString(), 'to', tomorrow.toISOString());  // ← Add this
    
    if (todayMatches && todayMatches.length >= 5) {
      return res.status(400).json({ 
        error: 'Daily limit reached',
        message: 'You can only play 5 matches per day!'
      });
    }
    
    // Get squad ratings
    const { data: userPlayers } = await supabase
      .from('players')
      .select('overall_rating')
      .eq('team_id', userTeam.id);
    
    const { data: oppPlayers } = await supabase
      .from('players')
      .select('overall_rating')
      .eq('team_id', opponentTeam.id);
    
    const userAvg = userPlayers?.length 
      ? Math.round(userPlayers.reduce((s, p) => s + p.overall_rating, 0) / userPlayers.length)
      : 50;
    
    const oppAvg = oppPlayers?.length
      ? Math.round(oppPlayers.reduce((s, p) => s + p.overall_rating, 0) / oppPlayers.length)
      : 50;
    
    // Determine home/away
    const homeId = isHome ? userTeam.id : opponentTeam.id;
    const awayId = isHome ? opponentTeam.id : userTeam.id;
    const homeName = isHome ? userTeam.team_name : opponentTeam.team_name;
    const awayName = isHome ? opponentTeam.team_name : userTeam.team_name;
    const homeAvg = isHome ? userAvg : oppAvg;
    const awayAvg = isHome ? oppAvg : userAvg;
    
    // Simulate
    const result = simulateSingleMatch(homeAvg, awayAvg);
    
   // Save match
  const { data: match, error: matchError } = await supabase
  .from('matches')
  .insert([{
    league_id: membership.league_id,
    home_team_id: homeId,
    away_team_id: awayId,
    home_score: result.homeGoals,
    away_score: result.awayGoals,
    is_played: true,
    matchday: 1,
    scheduled_date: new Date().toISOString()  // ADD THIS LINE
  }])
  .select()
  .single();

if (matchError) {
  console.error('Error inserting match:', matchError);
  throw matchError;
}

if (!match) {
  throw new Error('Match insert returned no data');
}
    
const io = req.app.get('io');
if (io) {
  io.emit('match-result-global', {
    homeTeam: homeName,
    awayTeam: awayName,
    homeScore: result.homeGoals,
    awayScore: result.awayGoals,
    timestamp: new Date().toISOString()
  });
  console.log('Emitted match result globally:', homeName, 'vs', awayName);
}

    // Determine user result
    let userResult;
    if (isHome) {
      userResult = result.homeGoals > result.awayGoals ? 'W' : 
                   result.homeGoals < result.awayGoals ? 'L' : 'D';
    } else {
      userResult = result.awayGoals > result.homeGoals ? 'W' : 
                   result.awayGoals < result.homeGoals ? 'L' : 'D';
    }
    
    res.json({
      message: 'Match completed',
      match: {
        id: match.id,
        homeTeam: homeName,
        awayTeam: awayName,
        homeScore: result.homeGoals,
        awayScore: result.awayGoals,
        userResult,
        isHome
      },
      matchesRemaining: Math.max(0, 4 - (todayMatches?.length || 0))
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to play match' });
  }
});

// Get recent global match results
router.get('/recent-results', verifyToken, async (req, res) => {
  try {
    const { data: recentMatches, error } = await supabase
      .from('matches')
      .select(`
        home_score,
        away_score,
        created_at,
        home_team:teams!matches_home_team_id_fkey(team_name),
        away_team:teams!matches_away_team_id_fkey(team_name)
      `)
      .eq('is_played', true)
      .order('created_at', { ascending: false })
      .limit(7);
    
    if (error) throw error;
    
    const formattedResults = (recentMatches || []).map(m => ({
      homeTeam: m.home_team.team_name,
      awayTeam: m.away_team.team_name,
      homeScore: m.home_score,
      awayScore: m.away_score,
      timestamp: m.created_at
    }));
    
    res.json({ results: formattedResults });
    
  } catch (error) {
    console.error('Error fetching recent results:', error);
    res.status(500).json({ error: 'Failed to fetch recent results' });
  }
});

module.exports = router;