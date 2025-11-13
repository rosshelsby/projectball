const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// GET all players for the authenticated user's team
router.get('/my-players', verifyToken, async (req, res) => {
  try {
    // req.user comes from verifyToken middleware
    const userId = req.user.userId;
    
    // Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get all players for this team
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', team.id)
      .order('overall_rating', { ascending: false }); // Sort by rating, best first
    
    if (playersError) {
      throw playersError;
    }
    
    // Group players by position for easier display
    const grouped = {
      GK: players.filter(p => p.position === 'GK'),
      DEF: players.filter(p => p.position === 'DEF'),
      MID: players.filter(p => p.position === 'MID'),
      FWD: players.filter(p => p.position === 'FWD')
    };
    
    res.json({
      total: players.length,
      players: players,
      grouped: grouped
    });
    
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

module.exports = router;