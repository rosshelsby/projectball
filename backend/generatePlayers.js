const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Sample data for generating realistic names
const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Paul', 'Joshua', 'Kenneth',
  'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
  'Lucas', 'Mason', 'Ethan', 'Alexander', 'Oliver', 'Benjamin', 'Elijah', 'Sebastian', 'Jack', 'Henry',
  'Carlos', 'Diego', 'Marco', 'Luis', 'Javier', 'Miguel', 'Fernando', 'Roberto', 'Francisco', 'Manuel'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Rivera', 'Campbell', 'Mitchell', 'Carter',
  'Silva', 'Santos', 'Oliveira', 'Costa', 'Ferreira', 'Pereira', 'Rossi', 'Romano', 'De Luca', 'Ferrari'
];

// Generate random number in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random name
function generateName() {
  const firstName = firstNames[randomInt(0, firstNames.length - 1)];
  const lastName = lastNames[randomInt(0, lastNames.length - 1)];
  return { firstName, lastName };
}

// Generate player stats based on position and overall rating
function generateStats(position, overall) {
  // Base stats around overall rating with some variance
  const variance = 10;
  
  let stats = {
    pace: randomInt(overall - variance, overall + variance),
    shooting: randomInt(overall - variance, overall + variance),
    passing: randomInt(overall - variance, overall + variance),
    defending: randomInt(overall - variance, overall + variance),
    physical: randomInt(overall - variance, overall + variance)
  };

  // Adjust stats based on position
  if (position === 'GK') {
    stats.defending = randomInt(overall - 5, overall + 10);
    stats.shooting = randomInt(30, 50);
    stats.pace = randomInt(40, 60);
  } else if (position === 'DEF') {
    stats.defending = randomInt(overall, overall + 10);
    stats.physical = randomInt(overall - 5, overall + 10);
    stats.shooting = randomInt(overall - 20, overall - 10);
  } else if (position === 'MID') {
    stats.passing = randomInt(overall, overall + 10);
    stats.pace = randomInt(overall - 5, overall + 5);
  } else if (position === 'FWD') {
    stats.shooting = randomInt(overall, overall + 10);
    stats.pace = randomInt(overall - 5, overall + 10);
    stats.defending = randomInt(overall - 25, overall - 15);
  }

  // Clamp all stats between 1 and 99
  Object.keys(stats).forEach(key => {
    stats[key] = Math.max(1, Math.min(99, stats[key]));
  });

  return stats;
}

// Calculate market value based on age and overall rating
function calculateValue(age, overall) {
  let baseValue = Math.pow(overall / 10, 2.5); // Exponential growth for high ratings
  
  // Age multiplier (peak at 25-28)
  let ageMultiplier = 1.0;
  if (age < 23) {
    ageMultiplier = 0.8 + (age - 18) * 0.04; // Young players cheaper but with potential
  } else if (age > 30) {
    ageMultiplier = 1.0 - (age - 30) * 0.08; // Older players depreciate
  }
  
  let value = Math.round(baseValue * ageMultiplier * 100000) / 100000;
  return Math.max(1, Math.round(value)); // Minimum 1 million
}

// Generate a single player
function generatePlayer() {
  const positions = ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD']; // Weighted distribution
  const position = positions[randomInt(0, positions.length - 1)];
  
  const age = randomInt(18, 35);
  const overall = randomInt(50, 85); // Most players between 50-85, few superstars
  
  const { firstName, lastName } = generateName();
  const stats = generateStats(position, overall);
  const value = calculateValue(age, overall);

  return {
    first_name: firstName,
    last_name: lastName,
    position,
    age,
    overall_rating: overall,
    pace: stats.pace,
    shooting: stats.shooting,
    passing: stats.passing,
    defending: stats.defending,
    physical: stats.physical,
    value,
    is_free_agent: true,
    team_id: null
  };
}

// Main function
async function generatePlayers() {
  console.log('Starting player generation...');
  
  const players = [];
  const totalPlayers = 500;
  
  for (let i = 0; i < totalPlayers; i++) {
    players.push(generatePlayer());
  }
  
  console.log(`Generated ${players.length} players. Inserting into database...`);
  
  // Insert in batches of 100 (Supabase limit)
  const batchSize = 100;
  for (let i = 0; i < players.length; i += batchSize) {
    const batch = players.slice(i, i + batchSize);
    const { error } = await supabase
      .from('players')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting batch:', error);
      return;
    }
    
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(players.length / batchSize)}`);
  }
  
  console.log('✅ All players generated successfully!');
  console.log('\nSample players:');
  players.slice(0, 5).forEach(p => {
    console.log(`${p.first_name} ${p.last_name} - ${p.position} - Age ${p.age} - OVR ${p.overall_rating} - Value ${p.value}M`);
  });
}

generatePlayers();