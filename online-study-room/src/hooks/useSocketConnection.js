import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001';

/**
 * Custom hook for managing Socket.io connections with auto-reconnection
 * @param {string} roomId - The room to join
 * @param {string} displayName - The user's display name
 * @param {string} token - JWT authentication token
 * @returns {object} { socket, isConnected, isReconnecting, error }
 */
export const useSocketConnection = (roomId, displayName, token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket connection with proper configuration
  useEffect(() => {
    if (!displayName || displayName === 'Guest') {
      setError('Invalid user. Please log in again.');
      return;
    }

    // Create socket with auto-reconnection config
    const socket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000, // Start with 1 second
      reconnectionDelayMax: 5000, // Max wait of 5 seconds
      reconnectionAttempts: 5, // Try 5 times before giving up
      transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
      auth: { token },
    });

    // Connection successful
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setError(null);

      // Join the room after connection
      if (roomId) {
        socket.emit('join-room', { roomId, displayName, token });
      }
    });

    // Reconnection attempt
    socket.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect...');
      setIsReconnecting(true);
    });

    // Reconnection successful
    socket.on('reconnect', () => {
      console.log('✅ Reconnected to server');
      setIsReconnecting(false);
      setError(null);

      // Rejoin room after reconnection
      if (roomId) {
        socket.emit('join-room', { roomId, displayName, token });
      }
    });

    // Connection error
    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setError(`Connection error: ${err.message || 'Unknown error'}`);
    });

    // Reconnection error (exhausted attempts)
    socket.on('reconnect_error', (err) => {
      console.error('❌ Reconnection failed:', err);
      setError('Failed to reconnect to server. Check your connection.');
    });

    // Max reconnection attempts reached
    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed - max attempts reached');
      setError('Connection lost. Please refresh the page.');
      setIsReconnecting(false);
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        setError('Server disconnected you. Please refresh the page.');
      } else if (reason === 'transport close') {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      if (roomId && displayName) {
        socket.emit('leave-room', { roomId, displayName });
      }
      socket.disconnect();
    };
  }, [roomId, displayName, token]);

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    error,
  };
};
