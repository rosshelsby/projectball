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