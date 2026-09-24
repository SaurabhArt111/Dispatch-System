import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Opens a Socket.IO connection authenticated with either a user access token
 * or a paired Godown Screen token. Returns the live socket instance plus
 * a simple connected flag; automatically tears down on unmount / token change.
 */
export function useSocket(token, tokenType = 'user') {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token, tokenType },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, tokenType]);

  return { socket: socketRef.current, connected };
}
