import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import showToast from '@/toast/showToast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_IO_URL || import.meta.env.VITE_API_URL;

export const useAdminNotificationSocket = () => {
    const [unreadCounts, setUnreadCounts] = useState({
        users: 0,
        merchants: 0,
        students: 0,
        grocery: 0,
        notVerifiedProducts: 0,
        otherProducts: 0,
        redeemRequests: 0,
        trustSeal: 0,
        bannerVerify: 0,
        referralRequests: 0
    });
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const socketRef = useRef(null);

    useEffect(() => {
        console.log('[useAdminNotificationSocket] Mounting hook...');

        const socket = io(`${SOCKET_URL}/admin-notifications`, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true,
            autoConnect: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Admin Notifications Socket] Connected successfully');
            setSocketStatus('connected');
            socket.emit('get-unread-counts');
        });

        socket.on('connect_error', (err) => {
            console.error('[Admin Notifications Socket] Connection error:', err.message);
            setSocketStatus('error');
        });

        socket.on('disconnect', (reason) => {
            console.log('[Admin Notifications Socket] Disconnected:', reason);
            setSocketStatus('disconnected');
        });

        socket.on('admin-unread-counts', (counts) => {
            console.log('[Admin Notifications Socket] Received unread counts:', counts);
            setUnreadCounts({
                users: Number(counts.users) || 0,
                merchants: Number(counts.merchants) || 0,
                students: Number(counts.students) || 0,
                grocery: Number(counts.grocery) || 0,
                notVerifiedProducts: Number(counts.notVerifiedProducts) || 0,
                otherProducts: Number(counts.otherProducts) || 0,
                redeemRequests: Number(counts.redeemRequests) || 0,
                trustSeal: Number(counts.trustSeal) || 0,
                bannerVerify: Number(counts.bannerVerify) || 0,
                referralRequests: Number(counts.referralRequests) || 0
            });
        });

        socket.on('new-user', (data) => {
            showToast(`New user registered: ${data.name || 'User'}`, 'info');
        });

        socket.on('new-merchant', (data) => {
            showToast(`New merchant registered: ${data.company_name || 'Merchant'}`, 'info');
        });

        socket.on('new-student', (data) => {
            showToast(`New student registered: ${data.college_name || 'Student'}`, 'info');
        });

        socket.on('new-grocery', (data) => {
            showToast(`New grocery seller registered: ${data.shop_name || 'Grocery'}`, 'info');
        });

        socket.on('new-referral-claim', (data) => {
            showToast(`New referral payout request received!`, 'warning');
        });

        return () => {
            console.log('[useAdminNotificationSocket] Unmounting - disconnecting socket');
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    return { unreadCounts, socketStatus };
};
