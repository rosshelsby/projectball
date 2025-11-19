import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found, cannot connect socket');
    return null;
  }
  
  if (socket?.connected) {
    return socket;
  }
  
  socket = io('http://localhost:5000', {
    auth: {
      token: token
    },
    autoConnect: true
  });
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;