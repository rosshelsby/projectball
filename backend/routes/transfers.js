const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// List a player for sale
router.post('/list-player', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { playerId, askingPrice } = req.body;
    
    if (!playerId || !askingPrice || askingPrice < 1000) {
      return res.status(400).json({ error: 'Player ID and asking price (min 1k) required' });
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
    
    // Get player and verify ownership
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('team_id', team.id)
      .single();
    
    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found or not owned by you' });
    }
    
    if (player.is_listed) {
      return res.status(400).json({ error: 'Player already listed' });
    }
    
    // List the player
    const { error: updateError } = await supabase
      .from('players')
      .update({
        is_listed: true,
        asking_price: askingPrice,
        listed_at: new Date().toISOString()
      })
      .eq('id', playerId);
    
    if (updateError) {
      throw updateError;
    }
    
    res.json({
      message: 'Player listed successfully',
      player: {
        name: `${player.first_name} ${player.last_name}`,
        askingPrice
      }
    });
    
  } catch (error) {
    console.error('Error listing player:', error);
    res.status(500).json({ error: 'Failed to list player' });
  }
});

// Delist a player
router.post('/delist-player', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { playerId } = req.body;
    
    // Get user's team
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Verify ownership and delist
    const { error } = await supabase
      .from('players')
      .update({
        is_listed: false,
        asking_price: null,
        listed_at: null
      })
      .eq('id', playerId)
      .eq('team_id', team.id);
    
    if (error) {
      throw error;
    }
    
    res.json({ message: 'Player delisted successfully' });
    
  } catch (error) {
    console.error('Error delisting player:', error);
    res.status(500).json({ error: 'Failed to delist player' });
  }
});

// Get all listed players (market browse)
router.get('/market', verifyToken, async (req, res) => {
  try {
    const { position, minRating, maxRating, maxPrice, sortBy = 'listed_at' } = req.query;
    
    let query = supabase
      .from('players')
      .select(`
        id,
        first_name,
        last_name,
        position,
        age,
        overall_rating,
        pace,
        shooting,
        passing,
        defending,
        physical,
        value,
        asking_price,
        listed_at,
        team_id,
        teams!players_team_id_fkey(team_name)
      `)
      .eq('is_listed', true);
    
    // Apply filters
    if (position) {
      query = query.eq('position', position);
    }
    
    if (minRating) {
      query = query.gte('overall_rating', parseInt(minRating));
    }
    
    if (maxRating) {
      query = query.lte('overall_rating', parseInt(maxRating));
    }
    
    if (maxPrice) {
      query = query.lte('asking_price', parseInt(maxPrice));
    }
    
    // Sort
    const sortColumn = sortBy === 'price' ? 'asking_price' : 
                       sortBy === 'rating' ? 'overall_rating' : 'listed_at';
    query = query.order(sortColumn, { ascending: sortBy === 'price' });
    
    const { data: players, error } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      total: players.length,
      players: players.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        position: p.position,
        age: p.age,
        overallRating: p.overall_rating,
        stats: {
          pace: p.pace,
          shooting: p.shooting,
          passing: p.passing,
          defending: p.defending,
          physical: p.physical
        },
        marketValue: p.value,
        askingPrice: p.asking_price,
        listedAt: p.listed_at,
        sellerTeam: p.teams?.team_name || 'Unknown'
      }))
    });
    
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({ error: 'Failed to fetch market' });
  }
});

// Buy a player
router.post('/buy-player', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID required' });
    }
    
    // Get buyer's team
    const { data: buyerTeam } = await supabase
      .from('teams')
      .select('id, team_name, budget')
      .eq('user_id', userId)
      .single();
    
    if (!buyerTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get player details
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*, teams!players_team_id_fkey(id, team_name, budget, user_id)')
      .eq('id', playerId)
      .eq('is_listed', true)
      .single();
    
    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found or not listed' });
    }
    
    // Can't buy your own player
    if (player.team_id === buyerTeam.id) {
      return res.status(400).json({ error: "You can't buy your own player" });
    }
    
    // Check budget
    if (buyerTeam.budget < player.asking_price) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    const sellerTeam = player.teams;
    
    // Execute transfer
    // 1. Update player ownership
    const { error: playerUpdateError } = await supabase
      .from('players')
      .update({
        team_id: buyerTeam.id,
        is_free_agent: false,
        is_listed: false,
        asking_price: null,
        listed_at: null
      })
      .eq('id', playerId);
    
    if (playerUpdateError) {
      throw playerUpdateError;
    }
    
    // 2. Update budgets
    await supabase
      .from('teams')
      .update({ budget: buyerTeam.budget - player.asking_price })
      .eq('id', buyerTeam.id);
    
    await supabase
      .from('teams')
      .update({ budget: sellerTeam.budget + player.asking_price })
      .eq('id', sellerTeam.id);
    
    // 3. Record transfer history
    await supabase
      .from('transfer_history')
      .insert([{
        player_id: playerId,
        from_team_id: sellerTeam.id,
        to_team_id: buyerTeam.id,
        transfer_fee: player.asking_price,
        player_name: `${player.first_name} ${player.last_name}`,
        player_position: player.position,
        player_rating: player.overall_rating
      }]);
    
    res.json({
      message: 'Transfer completed successfully',
      transfer: {
        player: `${player.first_name} ${player.last_name}`,
        from: sellerTeam.team_name,
        to: buyerTeam.team_name,
        fee: player.asking_price,
        newBudget: buyerTeam.budget - player.asking_price
      }
    });
    
  } catch (error) {
    console.error('Error buying player:', error);
    res.status(500).json({ error: 'Failed to complete transfer' });
  }
});

// Get my listed players
router.get('/my-listings', verifyToken, async (req, res) => {
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
    
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', team.id)
      .eq('is_listed', true)
      .order('listed_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({ listings: players });
    
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

module.exports = router;