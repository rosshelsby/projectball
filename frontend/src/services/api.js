import axios from 'axios';

// Your backend URL
const API_URL = 'http://localhost:5000/api';

// Test function to check backend connection
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Error connecting to backend:', error);
    throw error;
  }
};

// Verify token and get user data
export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(`${API_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};

// Get all players for the authenticated user's team
export const getMyPlayers = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(`${API_URL}/teams/my-players`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

// Get user's fixtures
export const getMyFixtures = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(`${API_URL}/matches/my-fixtures`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    throw error;
  }
};

// Get league table
export const getLeagueTable = async (leagueId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(`${API_URL}/matches/league-table/${leagueId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching league table:', error);
    throw error;
  }
};

// Get next scheduled match info
export const getNextScheduledMatch = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(`${API_URL}/matches/next-scheduled`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching next match:', error);
    throw error;
  }
};

// Simulate matchday (admin function)
export const simulateMatchday = async (leagueId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.post(`${API_URL}/matches/simulate-matchday`, 
      { leagueId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error simulating matchday:', error);
    throw error;
  }
};

// Get team's training facilities
export const getTrainingFacilities = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(`${API_URL}/training/facilities`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw error;
  }
};

// Upgrade a facility
export const upgradeFacility = async (facilityType) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.post(`${API_URL}/training/upgrade-facility`,
      { facilityType },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error upgrading facility:', error);
    throw error;
  }
};

// Train a player
export const trainPlayer = async (playerId, statToTrain) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.post(`${API_URL}/training/train-player`,
      { playerId, statToTrain },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error training player:', error);
    throw error;
  }
};

// List a player for sale
export const listPlayer = async (playerId, askingPrice) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.post(`${API_URL}/transfers/list-player`,
      { playerId, askingPrice },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error listing player:', error);
    throw error;
  }
};

// Delist a player
export const delistPlayer = async (playerId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.post(`${API_URL}/transfers/delist-player`,
      { playerId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error delisting player:', error);
    throw error;
  }
};

// Get transfer market
export const getTransferMarket = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const params = new URLSearchParams();
    if (filters.position) params.append('position', filters.position);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.maxRating) params.append('maxRating', filters.maxRating);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await axios.get(`${API_URL}/transfers/market?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching market:', error);
    throw error;
  }
};

// Buy a player
export const buyPlayer = async (playerId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.post(`${API_URL}/transfers/buy-player`,
      { playerId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error buying player:', error);
    throw error;
  }
};

// Get my listings
export const getMyListings = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(`${API_URL}/transfers/my-listings`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
};

// ========== SCOUTING HUB ==========
export const getScoutingOptions = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/scout/scouting-options`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const startScoutingMission = async (nationality) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/scout/start-scouting`,
    { nationality },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getMyMissions = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/scout/my-missions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const collectMission = async (missionId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/scout/collect-mission`,
    { missionId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getMyProspects = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/scout/my-prospects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const promoteProspect = async (prospectId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/scout/promote-prospect`,
    { prospectId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// ALPHA: Get fixtures with opponents and match limit
export const getAlphaFixtures = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await axios.get(`${API_URL}/matches/alpha-fixtures`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data;
};

// ALPHA: Play a match
export const playMatch = async (opponentTeamId, isHome) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await axios.post(
    `${API_URL}/matches/play-match`,
    { opponentTeamId, isHome },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};

export const getRecentResults = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/matches/recent-results`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};