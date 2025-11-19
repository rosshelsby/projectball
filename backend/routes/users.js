const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Get user profile by User Number
router.get('/profile/:userNumber', verifyToken, async (req, res) => {
  try {
    const { userNumber } = req.params;
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, user_number, created_at')
      .eq('user_number', userNumber)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { data: team } = await supabase
      .from('teams')
      .select('team_name, budget')
      .eq('user_id', user.id)
      .single();
    
    res.json({
      username: user.username,
      userNumber: user.user_number,
      teamName: team?.team_name,
      budget: team?.budget,
      memberSince: user.created_at
    });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;