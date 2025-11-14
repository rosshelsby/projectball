require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { simulateMatch } = require('../utils/matchEngine');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Find and simulate all overdue matches
async function processOverdueMatches() {
  try {
    const now = new Date().toISOString();
    
    console.log(`[${new Date().toLocaleTimeString()}] Checking for overdue matches...`);
    
    // Get all unplayed matches that are scheduled before now
    const { data: overdueMatches, error } = await supabase
      .from('matches')
      .select(`
        id,
        matchday,
        scheduled_date,
        league_id,
        leagues(name),
        home_team:teams!matches_home_team_id_fkey(team_name),
        away_team:teams!matches_away_team_id_fkey(team_name)
      `)
      .eq('is_played', false)
      .lt('scheduled_date', now)
      .order('scheduled_date');
    
    if (error) {
      console.error('Error fetching overdue matches:', error);
      return;
    }
    
    if (!overdueMatches || overdueMatches.length === 0) {
      console.log('No overdue matches found.');
      return;
    }
    
    console.log(`Found ${overdueMatches.length} overdue match(es). Simulating...`);
    
    // Simulate each match
    for (const match of overdueMatches) {
      try {
        const result = await simulateMatch(match.id);
        
        console.log(`✅ Matchday ${match.matchday} - ${match.leagues.name}: ${match.home_team.team_name} ${result.homeGoals}-${result.awayGoals} ${match.away_team.team_name}`);
        
        // Small delay between matches to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`Failed to simulate match ${match.id}:`, err.message);
      }
    }
    
    console.log('✅ Auto-simulation complete.\n');
    
  } catch (error) {
    console.error('Error in processOverdueMatches:', error);
  }
}

// Run the scheduler at a fixed interval
function startScheduler(intervalMinutes = 5) {
  console.log(`\n🤖 Match Auto-Simulator Started`);
  console.log(`Checking for overdue matches every ${intervalMinutes} minute(s)\n`);
  
  // Run immediately on start
  processOverdueMatches();
  
  // Then run at intervals
  setInterval(() => {
    processOverdueMatches();
  }, intervalMinutes * 60 * 1000);
}

module.exports = {
  processOverdueMatches,
  startScheduler
};