const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Calculate team strength based on player ratings
async function calculateTeamStrength(teamId) {
  const { data: players, error } = await supabase
    .from('players')
    .select('overall_rating, position')
    .eq('team_id', teamId);
  
  if (error || !players || players.length === 0) {
    return 60; // Default strength if no players found
  }
  
  // Weight positions differently (attackers matter more for scoring)
  const weights = {
    'GK': 0.8,
    'DEF': 1.0,
    'MID': 1.1,
    'FWD': 1.2
  };
  
  let totalWeightedRating = 0;
  let totalWeight = 0;
  
  players.forEach(player => {
    const weight = weights[player.position] || 1.0;
    totalWeightedRating += player.overall_rating * weight;
    totalWeight += weight;
  });
  
  const avgStrength = totalWeightedRating / totalWeight;
  return Math.round(avgStrength);
}

// Generate a scoreline based on team strengths
function generateScore(homeStrength, awayStrength) {
  // Home advantage bonus (teams perform ~3 points better at home)
  const adjustedHomeStrength = homeStrength + 3;
  
  // Strength difference affects goal probability
  const strengthDiff = adjustedHomeStrength - awayStrength;
  
  // Base expected goals (around 1.5 per team in a balanced match)
  let homeExpectedGoals = 1.5;
  let awayExpectedGoals = 1.5;
  
  // Adjust based on strength difference
  // For every 10 rating points difference, add ~0.5 goals expected
  homeExpectedGoals += (strengthDiff / 20);
  awayExpectedGoals -= (strengthDiff / 20);
  
  // Ensure minimum expected goals of 0.3
  homeExpectedGoals = Math.max(0.3, homeExpectedGoals);
  awayExpectedGoals = Math.max(0.3, awayExpectedGoals);
  
  // Generate actual goals using Poisson-like distribution
  const homeGoals = generateGoalsFromExpected(homeExpectedGoals);
  const awayGoals = generateGoalsFromExpected(awayExpectedGoals);
  
  return { homeGoals, awayGoals };
}

// Generate goals from expected value (simplified Poisson)
function generateGoalsFromExpected(expected) {
  // This is a simplified goal generation
  // Real Poisson would be more accurate but this works well enough
  
  let goals = 0;
  let threshold = Math.exp(-expected); // e^(-lambda)
  let probability = 1;
  let random = Math.random();
  
  while (probability > threshold) {
    probability *= Math.random();
    goals++;
  }
  
  return Math.max(0, goals - 1); // Subtract 1 because of how the algorithm works
}

// Simulate a single match
async function simulateMatch(matchId) {
  // 1. Get match details
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      id,
      home_team_id,
      away_team_id,
      is_played
    `)
    .eq('id', matchId)
    .single();
  
  if (matchError || !match) {
    throw new Error('Match not found');
  }
  
  if (match.is_played) {
    throw new Error('Match already played');
  }
  
  // 2. Calculate team strengths
  const homeStrength = await calculateTeamStrength(match.home_team_id);
  const awayStrength = await calculateTeamStrength(match.away_team_id);
  
  console.log(`Home strength: ${homeStrength}, Away strength: ${awayStrength}`);
  
  // 3. Generate score
  const { homeGoals, awayGoals } = generateScore(homeStrength, awayStrength);
  
  console.log(`Result: ${homeGoals}-${awayGoals}`);
  
  // 4. Update match with result
  const { error: updateError } = await supabase
    .from('matches')
    .update({
      home_score: homeGoals,
      away_score: awayGoals,
      is_played: true,
      played_at: new Date().toISOString()
    })
    .eq('id', matchId);
  
  if (updateError) {
    throw updateError;
  }
  
  return {
    homeGoals,
    awayGoals,
    homeStrength,
    awayStrength
  };
}

// Simulate all unplayed matches for a specific matchday
async function simulateMatchday(leagueId, matchday) {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      home_team_id,
      away_team_id,
      teams!matches_home_team_id_fkey(team_name),
      away_teams:teams!matches_away_team_id_fkey(team_name)
    `)
    .eq('league_id', leagueId)
    .eq('matchday', matchday)
    .eq('is_played', false);
  
  if (error || !matches || matches.length === 0) {
    return [];
  }
  
  const results = [];
  
  for (const match of matches) {
    try {
      const result = await simulateMatch(match.id);
      results.push({
        matchId: match.id,
        homeTeam: match.teams.team_name,
        awayTeam: match.away_teams.team_name,
        score: `${result.homeGoals}-${result.awayGoals}`
      });
    } catch (err) {
      console.error(`Error simulating match ${match.id}:`, err.message);
    }
  }
  
  return results;
}

module.exports = {
  calculateTeamStrength,
  simulateMatch,
  simulateMatchday
};