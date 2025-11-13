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

    // 8. Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    // 9. Send success response
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

module.exports = router;