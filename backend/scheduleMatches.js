const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Calculate next match date (matches happen twice per week: Wednesday and Sunday)
function getNextMatchDate(matchdayNumber) {
  const startDate = new Date(); // Start season on January 8, 2025 (Wednesday)
  
  // Matches on Wednesday (matchday 1, 3, 5...) and Sunday (matchday 2, 4, 6...)
  const daysToAdd = (matchdayNumber - 1) * 2;
  
  const matchDate = new Date(startDate);
  matchDate.setDate(matchDate.getDate() + daysToAdd);
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
    
// 3. Generate matches with MAXIMUM alternation
    const matches = [];
    const numTeams = teams.length;
    let matchday = 1;
    
    // Create all pairings
    const allPairings = [];
    for (let i = 0; i < numTeams; i++) {
      for (let j = i + 1; j < numTeams; j++) {
        allPairings.push({ team1: teams[i], team2: teams[j] });
      }
    }
    
    // Shuffle pairings to randomize fixture order
    allPairings.sort(() => Math.random() - 0.5);
    
    // Track last venue for each team
    const lastVenue = {};
    teams.forEach(team => lastVenue[team.id] = null);
    
    // FIRST HALF: Strict alternation
    allPairings.forEach(pairing => {
      const { team1, team2 } = pairing;
      
      let homeTeam, awayTeam;
      
      // RULE 1: If one team played home last time, they MUST play away this time
      if (lastVenue[team1.id] === 'H' && lastVenue[team2.id] !== 'H') {
        homeTeam = team2;
        awayTeam = team1;
      } 
      else if (lastVenue[team2.id] === 'H' && lastVenue[team1.id] !== 'H') {
        homeTeam = team1;
        awayTeam = team2;
      }
      // RULE 2: If one team played away last time, they should play home this time
      else if (lastVenue[team1.id] === 'A' && lastVenue[team2.id] !== 'A') {
        homeTeam = team1;
        awayTeam = team2;
      }
      else if (lastVenue[team2.id] === 'A' && lastVenue[team1.id] !== 'A') {
        homeTeam = team2;
        awayTeam = team1;
      }
      // RULE 3: If both have same last venue, randomize
      else {
        const flip = Math.random() < 0.5;
        homeTeam = flip ? team1 : team2;
        awayTeam = flip ? team2 : team1;
      }
      
      matches.push({
        league_id: league.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        matchday: matchday,
        scheduled_date: getNextMatchDate(matchday).toISOString(),
        season: '2024-25',
        is_played: false
      });
      
      lastVenue[homeTeam.id] = 'H';
      lastVenue[awayTeam.id] = 'A';
      
      matchday++;
    });
    
    // SECOND HALF: Exact reverse
    const firstHalfMatches = [...matches];
    firstHalfMatches.forEach(match => {
      matches.push({
        league_id: league.id,
        home_team_id: match.away_team_id,
        away_team_id: match.home_team_id,
        matchday: matchday,
        scheduled_date: getNextMatchDate(matchday).toISOString(),
        season: '2024-25',
        is_played: false
      });
      
      matchday++;
    });
    
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