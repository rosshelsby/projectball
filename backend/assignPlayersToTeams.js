const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function assignPlayersToTeams() {
  console.log('Fetching all teams...');
  
  // Get all teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, team_name');
  
  if (teamsError) {
    console.error('Error fetching teams:', teamsError);
    return;
  }
  
  if (!teams || teams.length === 0) {
    console.log('No teams found. Register some users first!');
    return;
  }
  
  console.log(`Found ${teams.length} teams`);
  
  for (const team of teams) {
    console.log(`\nAssigning players to ${team.team_name}...`);
    
    // Get 25 random free agents
    const { data: freePlayers, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('is_free_agent', true)
      .limit(25);
    
    if (playersError) {
      console.error('Error fetching free agents:', playersError);
      continue;
    }
    
    if (freePlayers.length < 25) {
      console.log(`⚠️  Only ${freePlayers.length} free agents available. Need to generate more players!`);
      continue;
    }
    
    // Assign these players to the team
    const playerIds = freePlayers.map(p => p.id);
    
    const { error: updateError } = await supabase
      .from('players')
      .update({ 
        team_id: team.id,
        is_free_agent: false
      })
      .in('id', playerIds);
    
    if (updateError) {
      console.error('Error assigning players:', updateError);
      continue;
    }
    
    console.log(`✅ Assigned 25 players to ${team.team_name}`);
  }
  
  console.log('\n✅ All teams now have players!');
}

assignPlayersToTeams();