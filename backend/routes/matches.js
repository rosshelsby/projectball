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

module.exports = router;