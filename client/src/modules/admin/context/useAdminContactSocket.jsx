import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import showToast from '@/toast/showToast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_IO_URL || import.meta.env.VITE_API_URL;

export const useAdminContactSocket = () => {
  const [contactUnreadCount, setContactUnreadCount] = useState(0);
  const [othersUnreadCount, setOthersUnreadCount] = useState(0);
  const [socketStatus, setSocketStatus] = useState('disconnected'); // optional debug
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    console.log('[useAdminContactSocket] Mounting hook...');

    const socket = io(`${SOCKET_URL}/contacts`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Contacts Socket] Connected successfully');
      setSocketStatus('connected');
      reconnectAttempts.current = 0;

      // Join admin room
      socket.emit('join-admins');

      // Request counts immediately
      socket.emit('get-unread-count');
      // Extra safety: request others count explicitly
      socket.emit('get-others-unread-count');
    });

    socket.on('connect_error', (err) => {
      console.error('[Contacts Socket] Connection error:', err.message);
      setSocketStatus('error');
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current > 3) {
        console.warn('[Contacts Socket] Too many reconnect attempts - giving up');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Contacts Socket] Disconnected:', reason);
      setSocketStatus('disconnected');
    });

    // Individual contact count
    socket.on('contact-unread-count', ({ count }) => {
      const newCount = Number(count) || 0;
      console.log(`[Contacts Socket] Received contact-unread-count: ${newCount}`);
      setContactUnreadCount(newCount);
    });

    // Global "Others" parent count
    socket.on('others-unread-count', ({ count }) => {
      const newCount = Number(count) || 0;
      console.log(`[Contacts Socket] Received others-unread-count: ${newCount}`);
      setOthersUnreadCount(newCount);
    });

    // New contact notification
    socket.on('new-contact', (newEnquiry) => {
      console.log('[Contacts Socket] New contact received:', newEnquiry);
      showToast(`New enquiry from ${newEnquiry.name || 'someone'}`, 'info');
    });

    // Fallback: if no count received after 3 seconds, re-request
    const fallbackTimer = setTimeout(() => {
      if (socket.connected && (contactUnreadCount === 0 || othersUnreadCount === 0)) {
        console.warn('[Contacts Socket] No counts received after connect - re-requesting');
        socket.emit('get-unread-count');
        socket.emit('get-others-unread-count');
      }
    }, 3000);

    return () => {
      console.log('[useAdminContactSocket] Unmounting - disconnecting socket');
      clearTimeout(fallbackTimer);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    contactUnreadCount,
    othersUnreadCount,
    socketStatus // optional: can be used later for UI feedback
  };
};
