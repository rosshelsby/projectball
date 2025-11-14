const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Training costs and cooldowns
const TRAINING_COOLDOWN_HOURS = 24;
const TRAINING_COST = 50000; // 50k per session
const FACILITY_UPGRADE_BASE_COST = 1000000; // 1M for level 2, scales up

// Get team's training facilities
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
    
    // Calculate upgrade costs
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

// Upgrade a facility
router.post('/upgrade-facility', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { facilityType } = req.body; // 'training_ground' or 'medical_facility'
    
    if (!['training_ground', 'medical_facility'].includes(facilityType)) {
      return res.status(400).json({ error: 'Invalid facility type' });
    }
    
    // Get team
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
    
    // Upgrade facility and deduct cost
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

// Train a player
router.post('/train-player', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID required' });
    }
    
    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, budget, training_ground_level')
      .eq('user_id', userId)
      .single();
    
    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('team_id', team.id)
      .single();
    
    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found or not on your team' });
    }
    
    // Check if player can be trained (cooldown)
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
    
    // Check budget
    if (team.budget < TRAINING_COST) {
      return res.status(400).json({ error: 'Insufficient funds for training' });
    }
    
    // Calculate stat improvement based on facility level
    // Level 1 = +1, Level 5 = +2, Level 10 = +3
    const baseImprovement = 1;
    const facilityBonus = Math.floor(team.training_ground_level / 5);
    const totalImprovement = baseImprovement + facilityBonus;
    
    // Choose random stat to improve (weighted by position)
    const stats = ['pace', 'shooting', 'passing', 'defending', 'physical'];
    const statToImprove = stats[Math.floor(Math.random() * stats.length)];
    
    const newStatValue = Math.min(99, player[statToImprove] + totalImprovement);
    const actualGain = newStatValue - player[statToImprove];
    
    // Update overall rating (simple average of all stats)
    const newOverall = Math.round(
      (player.pace + player.shooting + player.passing + player.defending + player.physical + actualGain) / 5
    );
    
    // Update player
    const { error: updateError } = await supabase
      .from('players')
      .update({
        [statToImprove]: newStatValue,
        overall_rating: Math.min(99, newOverall),
        last_trained_at: new Date().toISOString(),
        times_trained: player.times_trained + 1
      })
      .eq('id', playerId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Deduct training cost from budget
    await supabase
      .from('teams')
      .update({ budget: team.budget - TRAINING_COST })
      .eq('id', team.id);
    
    // Record training session
    await supabase
      .from('training_sessions')
      .insert([{
        player_id: playerId,
        team_id: team.id,
        stat_improved: statToImprove,
        amount_gained: actualGain
      }]);
    
    res.json({
      message: 'Training successful',
      player: {
        name: `${player.first_name} ${player.last_name}`,
        statImproved: statToImprove,
        oldValue: player[statToImprove],
        newValue: newStatValue,
        gain: actualGain,
        newOverall: Math.min(99, newOverall)
      },
      cost: TRAINING_COST,
      remainingBudget: team.budget - TRAINING_COST
    });
    
  } catch (error) {
    console.error('Error training player:', error);
    res.status(500).json({ error: 'Failed to train player' });
  }
});

module.exports = router;