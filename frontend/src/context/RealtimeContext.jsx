import { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from './ToastContext';
import { playNotificationChime } from '../utils/sound';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { token, user } = useAuth();
  const { push } = useToast();
  const { socket, connected } = useSocket(token, 'user');

  useEffect(() => {
    if (!socket) return undefined;

    const onNotification = (n) => {
      const variantMap = {
        NEW_DC: 'signal',
        DISPATCHED: 'success',
        TRANSFER_REQUESTED: 'signal',
        JOB_STATUS: 'default'
      };
      push({ title: n.title, message: n.message, variant: variantMap[n.type] || 'default' });
      playNotificationChime();
    };

    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [socket, push]);

  return (
    <RealtimeContext.Provider value={{ socket, connected, user }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
