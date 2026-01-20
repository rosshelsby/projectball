const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Get user's league data (replaces getAlphaFixtures)
router.get('/data', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get league membership
    const { data: membership, error: membershipError } = await supabase
      .from('league_memberships')
      .select('league_id, leagues(id, name)')
      .eq('team_id', team.id)
      .eq('season', '2024-25')
      .single();
    
    if (membershipError || !membership) {
      return res.status(404).json({ error: 'League membership not found' });
    }
    
    // Get other teams in league for friendlies
    const { data: opponents } = await supabase
      .from('league_memberships')
      .select('team_id, teams(id, team_name)')
      .eq('league_id', membership.league_id)
      .eq('season', '2024-25')
      .neq('team_id', team.id);
    
    // Get daily FRIENDLY matches remaining
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayFriendlies } = await supabase
      .from('friendly_matches')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    const matchesRemaining = Math.max(0, 5 - (todayFriendlies?.length || 0));
    
    res.json({
      team: team,
      league: membership.leagues,
      opponents: opponents.map(o => ({ id: o.teams.id, name: o.teams.team_name })),
      matchesRemaining: matchesRemaining
    });
    
  } catch (error) {
    console.error('Error fetching league data:', error);
    res.status(500).json({ error: 'Failed to fetch league data' });
  }
});

// Get league fixtures
router.get('/league/:leagueId', verifyToken, async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    // Get all fixtures for this league
    const { data: fixtures, error } = await supabase
      .from('matches')
      .select(`
        id,
        matchday,
        scheduled_date,
        is_played,
        home_score,
        away_score,
        home_team:home_team_id(id, team_name),
        away_team:away_team_id(id, team_name)
      `)
      .eq('league_id', leagueId)
      .eq('season', '2024-25')
      .order('matchday', { ascending: true })
      .order('scheduled_date', { ascending: true });
    
    if (error) throw error;
    
    // Find next unplayed matchday
    const nextMatchday = fixtures.find(f => !f.is_played)?.matchday || 1;
    
    res.json({
      fixtures: fixtures,
      nextMatchday: nextMatchday
    });
    
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

// Play a FRIENDLY match (does not affect league standings)
router.post('/play-friendly', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { opponentId, isHome } = req.body;
    
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayFriendlies } = await supabase
      .from('friendly_matches')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    if (todayFriendlies && todayFriendlies.length >= 5) {
      return res.status(400).json({ error: 'Daily friendly limit reached (5/5)' });
    }
    
    // Get user's team
    const { data: userTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!userTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get opponent team
    const { data: opponentTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('id', opponentId)
      .single();
    
    if (!opponentTeam) {
      return res.status(404).json({ error: 'Opponent not found' });
    }
    
    // Get squad ratings
    const { data: userPlayers } = await supabase
      .from('players')
      .select('overall_rating')
      .eq('team_id', userTeam.id);
    
    const { data: opponentPlayers } = await supabase
      .from('players')
      .select('overall_rating')
      .eq('team_id', opponentTeam.id);
    
    const userRating = userPlayers.reduce((sum, p) => sum + p.overall_rating, 0) / userPlayers.length;
    const opponentRating = opponentPlayers.reduce((sum, p) => sum + p.overall_rating, 0) / opponentPlayers.length;
    
    // Apply home advantage
    const homeAdvantage = isHome ? 5 : 0;
    const adjustedUserRating = userRating + homeAdvantage;
    
    // Simulate match
    const ratingDiff = adjustedUserRating - opponentRating;
    const userWinChance = 0.5 + (ratingDiff / 100);
    
    const userGoals = Math.floor(Math.random() * 5);
    const opponentGoals = Math.floor(Math.random() * 5);
    
    const homeScore = isHome ? userGoals : opponentGoals;
    const awayScore = isHome ? opponentGoals : userGoals;
    
    let result;
    if (userGoals > opponentGoals) result = 'W';
    else if (userGoals < opponentGoals) result = 'L';
    else result = 'D';
    
    // Save friendly match
    const { data: friendlyMatch, error: friendlyError } = await supabase
      .from('friendly_matches')
      .insert({
        user_id: userId,
        team_id: userTeam.id,
        opponent_team_id: opponentTeam.id,
        is_home: isHome,
        home_score: homeScore,
        away_score: awayScore,
        home_team_name: isHome ? userTeam.team_name : opponentTeam.team_name,
        away_team_name: isHome ? opponentTeam.team_name : userTeam.team_name,
        result: result
      })
      .select()
      .single();
    
    if (friendlyError) throw friendlyError;
    
    // Get updated friendly count
    const { data: updatedFriendlies } = await supabase
      .from('friendly_matches')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
    
    res.json({
      match: {
        homeTeam: isHome ? userTeam.team_name : opponentTeam.team_name,
        awayTeam: isHome ? opponentTeam.team_name : userTeam.team_name,
        homeScore: homeScore,
        awayScore: awayScore,
        userResult: result,
        isHome: isHome
      },
      matchesRemaining: 5 - updatedFriendlies.length
    });
    
  } catch (error) {
    console.error('Error playing friendly:', error);
    res.status(500).json({ error: 'Failed to play friendly match' });
  }
});

module.exports = router;