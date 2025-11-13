require('dotenv').config();
const { simulateMatchday } = require('./utils/matchEngine');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testSimulation() {
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name')
    .single();
  
  if (!league) {
    console.error('No league found');
    return;
  }
  
  console.log(`Simulating Matchday 2 for ${league.name}...\n`);
  
  const results = await simulateMatchday(league.id, 2);
  
  if (results.length === 0) {
    console.log('No matches to simulate (already played or don\'t exist)');
    return;
  }
  
  console.log('\n=== MATCHDAY 2 RESULTS ===\n');
  results.forEach(result => {
    console.log(`${result.homeTeam} ${result.score} ${result.awayTeam}`);
  });
}

testSimulation();