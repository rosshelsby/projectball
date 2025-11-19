const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TRAINING_COOLDOWN_HOURS = 24;
const FACILITY_UPGRADE_BASE_COST = 1000000;

router.get('/facilities', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const { data: team, error } = await supabase
      .from('teams')
      .select('id, team_name, budget, training_ground_level, medical_facility_level')
      .eq('user_id', userId)
      .single();
    
    if (error || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const trainingGroundUpgradeCost = team.training_ground_level < 10 
      ? FACILITY_UPGRADE_BASE_COST * team.training_ground_level 
      : null;
    
    const medicalFacilityUpgradeCost = team.medical_facility_level < 10
      ? FACILITY_UPGRADE_BASE_COST * team.medical_facility_level
      : null;
    
    res.json({
      team: {
        id: team.id,
        name: team.team_name,
        budget: team.budget
      },
      facilities: {
        trainingGround: {
          level: team.training_ground_level,
          maxLevel: 10,
          upgradeCost: trainingGroundUpgradeCost,
          canUpgrade: team.training_ground_level < 10 && team.budget >= trainingGroundUpgradeCost
        },
        medicalFacility: {
          level: team.medical_facility_level,
          maxLevel: 10,
          upgradeCost: medicalFacilityUpgradeCost,
          canUpgrade: team.medical_facility_level < 10 && team.budget >= medicalFacilityUpgradeCost
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

router.post('/upgrade-facility', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { facilityType } = req.body;
    
    if (!['training_ground', 'medical_facility'].includes(facilityType)) {
      return res.status(400).json({ error: 'Invalid facility type' });
    }
    
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const levelColumn = `${facilityType}_level`;
    const currentLevel = team[levelColumn];
    
    if (currentLevel >= 10) {
      return res.status(400).json({ error: 'Facility already at max level' });
    }
    
    const upgradeCost = FACILITY_UPGRADE_BASE_COST * currentLevel;
    
    if (team.budget < upgradeCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    const { error: upgradeError } = await supabase
      .from('teams')
      .update({
        [levelColumn]: currentLevel + 1,
        budget: team.budget - upgradeCost
      })
      .eq('id', team.id);
    
    if (upgradeError) {
      throw upgradeError;
    }
    
    res.json({
      message: 'Facility upgraded successfully',
      newLevel: currentLevel + 1,
      costPaid: upgradeCost,
      remainingBudget: team.budget - upgradeCost
    });
    
  } catch (error) {
    console.error('Error upgrading facility:', error);
    res.status(500).json({ error: 'Failed to upgrade facility' });
  }
});

router.post('/train-player', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { playerId, statToTrain } = req.body;
    
    if (!playerId || !statToTrain) {
      return res.status(400).json({ error: 'Player ID and stat to train are required' });
    }
    
    const validStats = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
    if (!validStats.includes(statToTrain)) {
      return res.status(400).json({ error: 'Invalid stat to train' });
    }
    
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, budget, training_ground_level')
      .eq('user_id', userId)
      .single();
    
    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('team_id', team.id)
      .single();
    
    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found or not on your team' });
    }
    
    if (player.last_trained_at) {
      const lastTrained = new Date(player.last_trained_at);
      const now = new Date();
      const hoursSince = (now - lastTrained) / (1000 * 60 * 60);
      
      if (hoursSince < TRAINING_COOLDOWN_HOURS) {
        const hoursRemaining = Math.ceil(TRAINING_COOLDOWN_HOURS - hoursSince);
        return res.status(400).json({ 
          error: `Player is resting. Can train again in ${hoursRemaining} hours.`,
          hoursRemaining
        });
      }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: trainingsToday, error: countError } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', team.id)
      .gte('last_trained_at', today.toISOString());
    
    if (countError) throw countError;
    
    const alreadyTrainedToday = trainingsToday.some(p => p.id === playerId);
    const currentDailyCount = alreadyTrainedToday ? trainingsToday.length - 1 : trainingsToday.length;
    
    if (currentDailyCount >= 5) {
      return res.status(400).json({ 
        error: 'Daily training limit reached (5 players per day)',
        dailyLimit: 5,
        used: currentDailyCount
      });
    }
    
    if (player[statToTrain] >= 99) {
      return res.status(400).json({ error: `${statToTrain} is already at maximum (99)` });
    }
    
    const baseImprovement = 1;
    const facilityBonus = Math.floor(team.training_ground_level / 5);
    const totalImprovement = baseImprovement + facilityBonus;
    
    const newStatValue = Math.min(99, player[statToTrain] + totalImprovement);
    const actualGain = newStatValue - player[statToTrain];
    
    const allStats = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
    let totalRating = 0;
    allStats.forEach(stat => {
      if (stat === statToTrain) {
        totalRating += newStatValue;
      } else {
        totalRating += player[stat] || 0;
      }
    });
    const newOverall = Math.min(99, Math.round(totalRating / allStats.length));
    
    const { error: updateError } = await supabase
      .from('players')
      .update({
        [statToTrain]: newStatValue,
        overall_rating: newOverall,
        last_trained_at: new Date().toISOString(),
        times_trained: (player.times_trained || 0) + 1
      })
      .eq('id', playerId);
    
    if (updateError) throw updateError;
    
    res.json({
      message: 'Training successful',
      player: {
        name: `${player.first_name} ${player.last_name}`,
        statImproved: statToTrain,
        oldValue: player[statToTrain],
        newValue: newStatValue,
        gain: actualGain,
        oldOverall: player.overall_rating,
        newOverall: newOverall
      },
      dailyTrainingsUsed: currentDailyCount + 1,
      dailyLimit: 5
    });
    
  } catch (error) {
    console.error('Error training player:', error);
    res.status(500).json({ error: 'Failed to train player' });
  }
});

module.exports = router;