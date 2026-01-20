const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Calculate match date - matches happen twice per week
function getMatchDate(matchdayNumber) {
  const seasonStart = new Date('2025-01-08T20:00:00'); // Wednesday, Jan 8, 2025 at 8 PM
  
  const isWednesday = matchdayNumber % 2 !== 0;
  const weeksPassed = Math.floor((matchdayNumber - 1) / 2);
  
  const matchDate = new Date(seasonStart);
  matchDate.setDate(matchDate.getDate() + (weeksPassed * 7) + (isWednesday ? 0 : 4));
  
  return matchDate;
}

// Proper round-robin scheduling
function generateRoundRobinFixtures(teams) {
  const n = teams.length;
  const fixtures = [];
  
  // Create array of team indices
  const teamList = teams.map((_, i) => i);
  
  for (let round = 0; round < n - 1; round++) {
    const roundFixtures = [];
    
    for (let i = 0; i < n / 2; i++) {
      let home = teamList[i];
      let away = teamList[n - 1 - i];
      
      // Alternate home/away based on round to prevent long runs
      if (round % 2 === 1) {
        [home, away] = [away, home];
      }
      
      roundFixtures.push({
        home: teams[home],
        away: teams[away]
      });
    }
    
    fixtures.push(roundFixtures);
    
    // Rotate teams (keep first team fixed)
    teamList.splice(1, 0, teamList.pop());
  }
  
  return fixtures;
}

async function scheduleMatches() {
  console.log('Scheduling league matches...');
  
  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('id, name');
  
  if (leaguesError || !leagues || leagues.length === 0) {
    console.error('No leagues found:', leaguesError);
    return;
  }
  
  for (const league of leagues) {
    console.log(`\nScheduling ${league.name}...`);
    
    const { data: memberships, error: membershipsError } = await supabase
      .from('league_memberships')
      .select('team_id, teams(id, team_name)')
      .eq('league_id', league.id)
      .eq('season', '2024-25');
    
    if (membershipsError || !memberships || memberships.length !== 12) {
      console.log(`Skipping ${league.name} - needs exactly 12 teams`);
      continue;
    }
    
    const teams = memberships.map(m => m.teams);
    console.log(`Found ${teams.length} teams`);
    
    // Generate fixtures
    const firstHalfFixtures = generateRoundRobinFixtures(teams);
    
    const matches = [];
    let matchday = 1;
    
    // First half (11 matchdays)
    firstHalfFixtures.forEach(round => {
      const matchDate = getMatchDate(matchday);
      
      // Verify each team appears exactly once per matchday
      const teamsInRound = new Set();
      round.forEach(fixture => {
        if (teamsInRound.has(fixture.home.id) || teamsInRound.has(fixture.away.id)) {
          console.error(`ERROR: Duplicate team in matchday ${matchday}`);
        }
        teamsInRound.add(fixture.home.id);
        teamsInRound.add(fixture.away.id);
        
        matches.push({
          league_id: league.id,
          home_team_id: fixture.home.id,
          away_team_id: fixture.away.id,
          matchday: matchday,
          scheduled_date: matchDate.toISOString(),
          season: '2024-25',
          is_played: false
        });
      });
      
      matchday++;
    });
    
    // Second half (matchdays 12-22) - reverse fixtures
    firstHalfFixtures.forEach(round => {
      const matchDate = getMatchDate(matchday);
      
      round.forEach(fixture => {
        matches.push({
          league_id: league.id,
          home_team_id: fixture.away.id,  // Reversed
          away_team_id: fixture.home.id,  // Reversed
          matchday: matchday,
          scheduled_date: matchDate.toISOString(),
          season: '2024-25',
          is_played: false
        });
      });
      
      matchday++;
    });
    
    console.log(`Generated ${matches.length} matches across 22 matchdays`);
    
    // Show schedule for verification
    console.log('\nFirst 5 matchdays:');
    for (let md = 1; md <= 5; md++) {
      const mdMatches = matches.filter(m => m.matchday === md);
      console.log(`Matchday ${md}:`);
      mdMatches.forEach(m => {
        const homeTeam = teams.find(t => t.id === m.home_team_id);
        const awayTeam = teams.find(t => t.id === m.away_team_id);
        console.log(`  ${homeTeam.team_name} vs ${awayTeam.team_name}`);
      });
    }
    
    // Insert matches
    const { error: matchesError } = await supabase
      .from('matches')
      .insert(matches);
    
    if (matchesError) {
      console.error('Error inserting matches:', matchesError);
      continue;
    }
    
    console.log(`✅ Scheduled all matches for ${league.name}`);
  }
  
  console.log('\n✅ Match scheduling complete!');
}

scheduleMatches();