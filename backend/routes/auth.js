const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// REGISTRATION ENDPOINT
router.post('/register', async (req, res) => {
  try {
    // 1. Get data from request body
    const { email, password, username, teamName } = req.body;

    // 2. Validate input
    if (!email || !password || !username || !teamName) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // 3. Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }

    // 4. Check if username already exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return res.status(400).json({ 
        error: 'Username already taken' 
      });
    }

    // 5. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 6. Insert user into database
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          username
        }
      ])
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    // 7. Create team for the user
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert([
        {
          user_id: newUser.id,
          team_name: teamName
        }
      ])
      .select()
      .single();

    if (teamError) {
      throw teamError;
    }

    // 8. Assign 25 random free agents to the new team
    const { data: freePlayers } = await supabase
      .from('players')
      .select('id')
      .eq('is_free_agent', true)
      .limit(25);
    
    if (freePlayers && freePlayers.length === 25) {
      const playerIds = freePlayers.map(p => p.id);
      
      await supabase
        .from('players')
        .update({ 
          team_id: newTeam.id,
          is_free_agent: false
        })
        .in('id', playerIds);
      
      console.log(`Assigned 25 players to team ${newTeam.team_name}`);
    } else {
      console.warn('Not enough free agents available!');
    }

    // 9. Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    // 10. Send success response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      },
      team: {
        id: newTeam.id,
        teamName: newTeam.team_name,
        budget: newTeam.budget
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Server error during registration' 
    });
  }
});

// LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  try {
    // 1. Get credentials from request
    const { email, password } = req.body;

    // 2. Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // 3. Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, password_hash')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // 4. Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // 5. Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, team_name, budget')
      .eq('user_id', user.id)
      .single();

    if (teamError || !team) {
      return res.status(500).json({ 
        error: 'Team not found' 
      });
    }

    // 6. Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Send success response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      team: {
        id: team.id,
        teamName: team.team_name,
        budget: team.budget
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login' 
    });
  }
});

// VERIFY TOKEN ENDPOINT
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, team_name, budget')
      .eq('user_id', user.id)
      .single();

    if (teamError || !team) {
      return res.status(401).json({ error: 'Team not found' });
    }

    // Send back verified user and team data
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      team: {
        id: team.id,
        teamName: team.team_name,
        budget: team.budget
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;