const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Scouting costs and durations by nationality
const SCOUTING_CONFIG = {
  ENG: { cost: 10000, hours: 4, tier: 1 },
  GER: { cost: 15000, hours: 5, tier: 1 },
  FRA: { cost: 20000, hours: 6, tier: 2 },
  ESP: { cost: 25000, hours: 7, tier: 2 },
  ITA: { cost: 30000, hours: 8, tier: 2 },
  ARG: { cost: 40000, hours: 9, tier: 3 },
  NED: { cost: 35000, hours: 8, tier: 3 },
  BRA: { cost: 60000, hours: 10, tier: 3 }
};

// Nationality stat tendencies (based on GDD)
const NATIONALITY_STATS = {
  BRA: { pace: 5, shooting: 3, passing: 4, defending: -2, physical: 2 }, // Flair, pace, attacking
  ITA: { pace: -2, shooting: 0, passing: 2, defending: 5, physical: 3 }, // Defensive, tactical
  GER: { pace: 1, shooting: 2, passing: 3, defending: 2, physical: 5 }, // Physical, discipline
  ESP: { pace: -1, shooting: 0, passing: 5, defending: 1, physical: -2 }, // Technical, passing
  ENG: { pace: 4, shooting: 3, passing: 0, defending: 1, physical: 4 }, // Direct, physical
  FRA: { pace: 5, shooting: 3, passing: 2, defending: 2, physical: 4 }, // Athletic, well-rounded
  ARG: { pace: 3, shooting: 5, passing: 4, defending: 0, physical: 1 }, // Technical, finishing
  NED: { pace: 2, shooting: 2, passing: 3, defending: 3, physical: 5 }  // Height, versatile
};

// Position distributions by nationality
const POSITION_WEIGHTS = {
  BRA: { GK: 5, DEF: 15, MID: 35, FWD: 45 }, // Attack-heavy
  ITA: { GK: 15, DEF: 40, MID: 30, FWD: 15 }, // Defense-heavy
  GER: { GK: 10, DEF: 30, MID: 35, FWD: 25 }, // Balanced
  ESP: { GK: 10, DEF: 20, MID: 45, FWD: 25 }, // Midfield-heavy
  ENG: { GK: 10, DEF: 25, MID: 30, FWD: 35 }, // Attack-focused
  FRA: { GK: 10, DEF: 25, MID: 30, FWD: 35 }, // Athletic, varied
  ARG: { GK: 5, DEF: 20, MID: 30, FWD: 45 }, // Attack-heavy
  NED: { GK: 10, DEF: 35, MID: 30, FWD: 25 }  // Defense-focused
};

// Helper: Generate random name
async function getRandomName(nationality) {
  const { data, error } = await supabase
    .from('nationality_names')
    .select('first_names, last_names')
    .eq('nationality', nationality)
    .single();
  
  if (error || !data) {
    // Fallback generic names
    const firstNames = ['John', 'Michael', 'David', 'James', 'Robert'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
    };
  }
  
  return {
    firstName: data.first_names[Math.floor(Math.random() * data.first_names.length)],
    lastName: data.last_names[Math.floor(Math.random() * data.last_names.length)]
  };
}

// Helper: Generate position based on nationality weights
function generatePosition(nationality) {
  const weights = POSITION_WEIGHTS[nationality] || { GK: 10, DEF: 30, MID: 30, FWD: 30 };
  const roll = Math.random() * 100;
  
  let cumulative = 0;
  for (const [position, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) return position;
  }
  
  return 'MID'; // Fallback
}

// Helper: Generate youth prospect stats
function generateProspectStats(nationality, position) {
  // Base stats for 16-year-old (40-50 range)
  const baseMin = 40;
  const baseMax = 50;
  
  let stats = {
    pace: Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin,
    shooting: Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin,
    passing: Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin,
    defending: Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin,
    physical: Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin
  };
  
  // Apply nationality tendencies
  const tendencies = NATIONALITY_STATS[nationality] || {};
  Object.keys(stats).forEach(stat => {
    if (tendencies[stat]) {
      stats[stat] = Math.max(35, Math.min(60, stats[stat] + tendencies[stat]));
    }
  });
  
  // Apply position adjustments
  if (position === 'GK') {
    stats.defending += 5;
    stats.shooting -= 10;
  } else if (position === 'DEF') {
    stats.defending += 5;
    stats.physical += 3;
    stats.shooting -= 5;
  } else if (position === 'MID') {
    stats.passing += 5;
  } else if (position === 'FWD') {
    stats.shooting += 5;
    stats.pace += 3;
    stats.defending -= 5;
  }
  
  // Clamp all stats to 35-65 range for youth
  Object.keys(stats).forEach(stat => {
    stats[stat] = Math.max(35, Math.min(65, stats[stat]));
  });
  
  const overallRating = Math.round(
    (stats.pace + stats.shooting + stats.passing + stats.defending + stats.physical) / 5
  );
  
  // Potential cap (60-85 range, rarely higher)
  const roll = Math.random();
  let potentialCap;
  if (roll < 0.60) {
    potentialCap = Math.floor(Math.random() * 11) + 65; // 65-75 (60% chance)
  } else if (roll < 0.85) {
    potentialCap = Math.floor(Math.random() * 6) + 76; // 76-81 (25% chance)
  } else if (roll < 0.95) {
    potentialCap = Math.floor(Math.random() * 4) + 82; // 82-85 (10% chance)
  } else {
    potentialCap = Math.floor(Math.random() * 7) + 86; // 86-92 (5% chance)
  }
  
  return { ...stats, overallRating, potentialCap };
}

// GET available scouting nations
router.get('/scouting-options', verifyToken, async (req, res) => {
  try {
    const options = Object.entries(SCOUTING_CONFIG).map(([nationality, config]) => ({
      nationality,
      cost: config.cost,
      hours: config.hours,
      tier: config.tier
    }));
    
    res.json({ options });
  } catch (error) {
    console.error('Error fetching scouting options:', error);
    res.status(500).json({ error: 'Failed to fetch scouting options' });
  }
});

// POST start a scouting mission
router.post('/start-scouting', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nationality } = req.body;
    
    if (!nationality || !SCOUTING_CONFIG[nationality]) {
      return res.status(400).json({ error: 'Invalid nationality' });
    }
    
    // Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, budget')
      .eq('user_id', userId)
      .single();
    
    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const config = SCOUTING_CONFIG[nationality];
    
    // Check budget
    if (team.budget < config.cost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    // Check for active missions (limit to 3 concurrent)
    const { data: activeMissions, error: activeError } = await supabase
      .from('scouting_missions')
      .select('id')
      .eq('team_id', team.id)
      .eq('is_completed', false);
    
    if (activeError) throw activeError;
    
    if (activeMissions && activeMissions.length >= 3) {
      return res.status(400).json({ error: 'Maximum 3 active scouting missions at once' });
    }
    
    const now = new Date();
    const completesAt = new Date(now.getTime() + config.hours * 60 * 60 * 1000);
    
    // Create scouting mission
    const { data: mission, error: missionError } = await supabase
      .from('scouting_missions')
      .insert([{
        team_id: team.id,
        nationality,
        cost: config.cost,
        duration_hours: config.hours,
        min_prospects: 1,
        max_prospects: 3,
        completes_at: completesAt.toISOString()
      }])
      .select()
      .single();
    
    if (missionError) throw missionError;
    
    // Deduct cost from budget
    await supabase
      .from('teams')
      .update({ budget: team.budget - config.cost })
      .eq('id', team.id);

      // Emit socket event
      if (req.app.get('io')) {
        req.app.get('io').to(`user:${userId}`).emit('scout-mission-started', {
          missionId: mission.id,
          nationality,
          completesAt: mission.completes_at
        });
      }

    
    res.json({
      message: 'Scouting mission started',
      mission: {
        id: mission.id,
        nationality,
        cost: config.cost,
        hours: config.hours,
        completesAt: mission.completes_at
      },
      remainingBudget: team.budget - config.cost
    });
    
  } catch (error) {
    console.error('Error starting scouting:', error);
    res.status(500).json({ error: 'Failed to start scouting mission' });
  }
});

// GET active and completed missions
router.get('/my-missions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's team
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get all missions for this team
    const { data: missions, error } = await supabase
      .from('scouting_missions')
      .select('*')
      .eq('team_id', team.id)
      .order('started_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    const now = new Date();
    
    const formattedMissions = missions.map(m => {
      const completesAt = new Date(m.completes_at);
      const timeRemaining = completesAt - now;
      
      return {
        id: m.id,
        nationality: m.nationality,
        cost: m.cost,
        durationHours: m.duration_hours,
        startedAt: m.started_at,
        completesAt: m.completes_at,
        isCompleted: m.is_completed,
        collected: m.collected,
        prospectsGenerated: m.prospects_generated,
        minutesRemaining: Math.max(0, Math.floor(timeRemaining / 1000 / 60)),
        isReady: timeRemaining <= 0 && !m.is_completed
      };
    });
    
    const active = formattedMissions.filter(m => !m.isCompleted);
    const completed = formattedMissions.filter(m => m.isCompleted && !m.collected);
    const history = formattedMissions.filter(m => m.collected);
    
    res.json({ active, completed, history });
    
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// POST collect completed mission results
router.post('/collect-mission', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { missionId } = req.body;
    
    if (!missionId) {
      return res.status(400).json({ error: 'Mission ID required' });
    }
    
    // Get user's team
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get mission
    const { data: mission, error: missionError } = await supabase
      .from('scouting_missions')
      .select('*')
      .eq('id', missionId)
      .eq('team_id', team.id)
      .single();
    
    if (missionError || !mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    if (mission.collected) {
      return res.status(400).json({ error: 'Mission already collected' });
    }
    
    const now = new Date();
    const completesAt = new Date(mission.completes_at);
    
    if (completesAt > now) {
      return res.status(400).json({ error: 'Mission not yet complete' });
    }
    
    // Generate prospects if not already done
    let prospects = [];
    if (!mission.is_completed) {
      // Generate 1-3 prospects
      const numProspects = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numProspects; i++) {
        const name = await getRandomName(mission.nationality);
        const position = generatePosition(mission.nationality);
        const stats = generateProspectStats(mission.nationality, position);
        
        const { data: prospect, error: prospectError } = await supabase
          .from('youth_prospects')
          .insert([{
            team_id: team.id,
            first_name: name.firstName,
            last_name: name.lastName,
            nationality: mission.nationality,
            position,
            age: 16,
            overall_rating: stats.overallRating,
            pace: stats.pace,
            shooting: stats.shooting,
            passing: stats.passing,
            defending: stats.defending,
            physical: stats.physical,
            potential_cap: stats.potentialCap,
            scouting_mission_id: mission.id
          }])
          .select()
          .single();
        
        if (prospectError) {
          console.error('Error creating prospect:', prospectError);
          continue;
        }
        
        prospects.push(prospect);
      }
      
      // Mark mission as completed
      await supabase
        .from('scouting_missions')
        .update({
          is_completed: true,
          prospects_generated: prospects.length,
          collected: true
        })
        .eq('id', missionId);
    } else {
      // Already completed, just get prospects
      const { data: existingProspects, error: prospectsError } = await supabase
        .from('youth_prospects')
        .select('*')
        .eq('scouting_mission_id', missionId);
      
      if (prospectsError) throw prospectsError;
      prospects = existingProspects;
      
      // Mark as collected
      await supabase
        .from('scouting_missions')
        .update({ collected: true })
        .eq('id', missionId);
    }

    // Scouting Socket
    const ioInstance = req.app.get('io');
    if (ioInstance) {
    ioInstance.to('user:${userId').emit('scout-mission-complete', {
      missionId: missionId,
      prospects: prospects.length,
      nationality: mission.nationality
    });
    }

    // Mark as collected
    await supabase
      .from('scouting_missions')
      .update({ collected: true })
      .eq('id', missionId);

    // Emit socket event to notify user
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('scout-mission-complete', {
        missionId: missionId,
        prospectsCount: prospects.length,
        nationality: mission.nationality
      });
    }
    
    res.json({
      message: 'Mission collected successfully',
      prospects: prospects.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        nationality: p.nationality,
        position: p.position,
        age: p.age,
        overallRating: p.overall_rating,
        potential: p.potential_cap,
        stats: {
          pace: p.pace,
          shooting: p.shooting,
          passing: p.passing,
          defending: p.defending,
          physical: p.physical
        }
      }))
    });
    
  } catch (error) {
    console.error('Error collecting mission:', error);
    res.status(500).json({ error: 'Failed to collect mission' });
  }
});

// GET youth prospects
router.get('/my-prospects', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const { data: prospects, error } = await supabase
      .from('youth_prospects')
      .select('*')
      .eq('team_id', team.id)
      .is('promoted_at', null)
      .order('potential_cap', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      total: prospects.length,
      prospects: prospects.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        nationality: p.nationality,
        position: p.position,
        age: p.age,
        overallRating: p.overall_rating,
        potential: p.potential_cap,
        generatedAt: p.generated_at,
        stats: {
          pace: p.pace,
          shooting: p.shooting,
          passing: p.passing,
          defending: p.defending,
          physical: p.physical
        }
      }))
    });
    
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

// POST promote prospect to senior team
router.post('/promote-prospect', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { prospectId } = req.body;
    
    if (!prospectId) {
      return res.status(400).json({ error: 'Prospect ID required' });
    }
    
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get prospect
    const { data: prospect, error: prospectError } = await supabase
      .from('youth_prospects')
      .select('*')
      .eq('id', prospectId)
      .eq('team_id', team.id)
      .is('promoted_at', null)
      .single();
    
    if (prospectError || !prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    // Create senior player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert([{
        team_id: team.id,
        first_name: prospect.first_name,
        last_name: prospect.last_name,
        nationality: prospect.nationality,
        position: prospect.position,
        age: prospect.age,
        overall_rating: prospect.overall_rating,
        pace: prospect.pace,
        shooting: prospect.shooting,
        passing: prospect.passing,
        defending: prospect.defending,
        physical: prospect.physical,
        potential_cap: prospect.potential_cap,
        value: Math.max(1, Math.floor(prospect.overall_rating / 10)),
        is_free_agent: false
      }])
      .select()
      .single();
    
    if (playerError) throw playerError;
    
    // Mark prospect as promoted
    await supabase
      .from('youth_prospects')
      .update({ promoted_at: new Date().toISOString() })
      .eq('id', prospectId);
    
    res.json({
      message: 'Prospect promoted to senior team',
      player: {
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        position: player.position,
        overallRating: player.overall_rating
      }
    });
    
  } catch (error) {
    console.error('Error promoting prospect:', error);
    res.status(500).json({ error: 'Failed to promote prospect' });
  }
});

module.exports = router;
