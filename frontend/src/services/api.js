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