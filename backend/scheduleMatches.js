const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Calculate next match date (matches happen twice per week: Wednesday and Sunday)
function getNextMatchDate(matchdayNumber) {
  const startDate = new Date('2025-01-08'); // Start season on January 8, 2025 (Wednesday)
  
  // Matches on Wednesday (matchday 1, 3, 5...) and Sunday (matchday 2, 4, 6...)
  const daysToAdd = Math.floor((matchdayNumber - 1) / 2) * 7; // Week number
  const isWednesday = matchdayNumber % 2 === 1;
  const dayOffset = isWednesday ? 0 : 4; // Sunday is 4 days after Wednesday
  
  const matchDate = new Date(startDate);
  matchDate.setDate(matchDate.getDate() + daysToAdd + dayOffset);
  matchDate.setHours(20, 0, 0, 0); // 8 PM
  
  return matchDate;
}

async function scheduleMatches() {
  console.log('Scheduling matches for all leagues...');
  
  // 1. Get all leagues
  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('id, name');
  
  if (leaguesError || !leagues || leagues.length === 0) {
    console.error('No leagues found:', leaguesError);
    return;
  }
  
  for (const league of leagues) {
    console.log(`\nScheduling ${league.name}...`);
    
    // 2. Get teams in this league
    const { data: memberships, error: membershipsError } = await supabase
      .from('league_memberships')
      .select('team_id, teams(id, team_name)')
      .eq('league_id', league.id)
      .eq('season', '2024-25');
    
    if (membershipsError || !memberships || memberships.length < 2) {
      console.log(`Skipping ${league.name} - not enough teams`);
      continue;
    }
    
    const teams = memberships.map(m => m.teams);
    console.log(`Found ${teams.length} teams`);
    
    // 3. Generate balanced round-robin schedule
    const matches = [];
    const numTeams = teams.length;
    
    if (numTeams % 2 !== 0) {
      // If odd number of teams, add a "bye" placeholder
      teams.push({ id: 'BYE', team_name: 'BYE' });
    }
    
    const totalRounds = (teams.length - 1) * 2; // Home and away
    let matchday = 1;
    
    // Round-robin algorithm (rotating teams except first)
    for (let round = 0; round < totalRounds; round++) {
      const isSecondHalf = round >= teams.length - 1;
      
      for (let i = 0; i < teams.length / 2; i++) {
        const home = teams[i];
        const away = teams[teams.length - 1 - i];
        
        // Skip if either team is BYE
        if (home.id === 'BYE' || away.id === 'BYE') continue;
        
        // In second half of season, swap home/away
        const homeTeam = isSecondHalf ? away : home;
        const awayTeam = isSecondHalf ? home : away;
        
        matches.push({
          league_id: league.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          matchday: matchday,
          scheduled_date: getNextMatchDate(matchday).toISOString(),
          season: '2024-25',
          is_played: false
        });
      }
      
      // Rotate teams (keep first team fixed, rotate others)
      teams.splice(1, 0, teams.pop());
      matchday++;
    }
    
    console.log(`Generated ${matches.length} matches across ${matchday - 1} matchdays`);
    
    // 4. Insert matches into database
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
  
  // Show summary
  const { data: allMatches } = await supabase
    .from('matches')
    .select('id, league_id, scheduled_date')
    .order('scheduled_date');
  
  if (allMatches) {
    console.log(`\nTotal matches scheduled: ${allMatches.length}`);
    console.log(`First match: ${new Date(allMatches[0].scheduled_date).toLocaleDateString()}`);
    console.log(`Last match: ${new Date(allMatches[allMatches.length - 1].scheduled_date).toLocaleDateString()}`);
  }
}

scheduleMatches();