const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function setupLeagues() {
  console.log('Setting up league structure...');
  
  // 1. Get all teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, team_name, user_id');
  
  if (teamsError || !teams || teams.length === 0) {
    console.error('Error fetching teams:', teamsError);
    return;
  }
  
  console.log(`Found ${teams.length} teams`);
  
  // 2. Create leagues based on number of teams
  // Each league has max 12 teams
  const teamsPerLeague = 12;
  const numLeagues = Math.ceil(teams.length / teamsPerLeague);
  
  console.log(`Creating ${numLeagues} league(s)...`);
  
  const leagues = [];
  for (let i = 0; i < numLeagues; i++) {
    const divisionLevel = i + 1;
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert([{
        name: `Division ${divisionLevel}`,
        division_level: divisionLevel,
        max_teams: teamsPerLeague
      }])
      .select()
      .single();
    
    if (leagueError) {
      console.error('Error creating league:', leagueError);
      continue;
    }
    
    leagues.push(league);
    console.log(`✅ Created ${league.name}`);
  }
  
  // 3. Assign teams to leagues (randomly for now)
  console.log('\nAssigning teams to leagues...');
  
  // Shuffle teams for random distribution
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < shuffledTeams.length; i++) {
    const team = shuffledTeams[i];
    const leagueIndex = Math.floor(i / teamsPerLeague);
    const league = leagues[leagueIndex];
    
    if (!league) {
      console.error(`No league found for team ${team.team_name}`);
      continue;
    }
    
    const { error: memberError } = await supabase
      .from('league_memberships')
      .insert([{
        team_id: team.id,
        league_id: league.id,
        season: '2024-25'
      }]);
    
    if (memberError) {
      console.error(`Error assigning ${team.team_name}:`, memberError);
      continue;
    }
    
    console.log(`Assigned ${team.team_name} to ${league.name}`);
  }
  
  console.log('\n✅ League setup complete!');
  console.log('\nLeague Distribution:');
  
  for (const league of leagues) {
    const { data: members } = await supabase
      .from('league_memberships')
      .select('team_id')
      .eq('league_id', league.id);
    
    console.log(`${league.name}: ${members?.length || 0} teams`);
  }
}

setupLeagues();