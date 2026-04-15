// src/components/utils/GlobalNotificationBell.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, FileText } from 'lucide-react'; // <-- ADD FileText
import io from 'socket.io-client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

import { useGetNotificationsQuery as useGetCouponNotificationsQuery } from '@/redux/api/couponsNotificationApi';
import { useGetAccessRequestsQuery } from '@/redux/api/SubAdminAccessRequestApi';
import { useGetTrustSealRequestsQuery } from '@/redux/api/TrustSealRequestApi';
import { useGetComplaintNotificationsQuery } from '@/redux/api/ComplaintNotificationApi'; // <-- ADD

const GlobalNotificationBell = ({ userId, isAdmin = true }) => {
  const [open, setOpen] = useState(false);

  const [couponNotifications, setCouponNotifications] = useState([]);
  const [subadminNotifications, setSubadminNotifications] = useState([]);
  const [trustNotifications, setTrustNotifications] = useState([]);
  const [complaintNotifications, setComplaintNotifications] = useState([]); // <-- ADD

  const { data: couponData } = useGetCouponNotificationsQuery(
    { userId, page: 1, limit: 200, status: 'all' },
    { skip: !userId }
  );
  const { data: subadminData } = useGetAccessRequestsQuery(
    { page: 1, limit: 200, status: 'all' },
    { skip: !userId }
  );
  const { data: trustData } = useGetTrustSealRequestsQuery(
    { page: 1, limit: 200, status: 'all' },
    { skip: !userId }
  );
  const { data: complaintData } = useGetComplaintNotificationsQuery( // <-- ADD
    { userId, page: 1, limit: 200, status: 'all' },
    { skip: !userId }
  );

  const couponSocket = useMemo(() => io(`${import.meta.env.VITE_SOCKET_IO_URL}/coupons`, { withCredentials: true, transports: ['websocket'] }), []);
  const subadminSocket = useMemo(() => io(`${import.meta.env.VITE_SOCKET_IO_URL}/access-request-notifications`, { withCredentials: true, transports: ['websocket'] }), []);
  const trustSocket = useMemo(() => io(`${import.meta.env.VITE_SOCKET_IO_URL}/trust-seal-notifications`, { withCredentials: true, transports: ['websocket'] }), []);
  const complaintSocket = useMemo(() => io(`${import.meta.env.VITE_SOCKET_IO_URL}/complaints`, { withCredentials: true, transports: ['websocket'] }), []); // <-- ADD

  // Expose setters
  useEffect(() => {
    window.globalSetCouponNotifications = setCouponNotifications;
    window.globalSetSubadminNotifications = setSubadminNotifications;
    window.globalSetTrustNotifications = setTrustNotifications;
    window.globalSetComplaintNotifications = setComplaintNotifications; // <-- ADD

    return () => {
      delete window.globalSetCouponNotifications;
      delete window.globalSetSubadminNotifications;
      delete window.globalSetTrustNotifications;
      delete window.globalSetComplaintNotifications;
    };
  }, [setCouponNotifications, setSubadminNotifications, setTrustNotifications, setComplaintNotifications]);

  // Socket setup
  useEffect(() => {
    if (!userId) return;

    couponSocket.emit('join', userId);
    if (isAdmin) subadminSocket.emit('join_admins');
    trustSocket.emit('join', 'trust-seal:admin');
    complaintSocket.emit('joinAdmin'); // <-- ADD

    const onNewCoupon = (n) => {
      const notif = { ...n, isRead: n.isRead ?? false };
      setCouponNotifications(p => [notif, ...p].slice(0, 10));
    };
    couponSocket.on('newRedemption', onNewCoupon);

    const onNewAccess = (n) => {
      const notif = { ...n, is_read: n.is_read ?? false };
      setSubadminNotifications(p => [notif, ...p].slice(0, 10));
    };
    subadminSocket.on('newAccessRequest', onNewAccess);

    const onNewTrust = (n) => {
      const notif = { ...n, isRead: n.isRead ?? false };
      setTrustNotifications(p => [notif, ...p].slice(0, 10));
    };
    trustSocket.on('newTrustSealRequest', onNewTrust);

    const onTrustRead = ({ _id }) => {
      setTrustNotifications(p =>
        p.map(n => n._id === _id ? { ...n, isRead: true } : n)
      );
    };
    trustSocket.on('trustSealNotificationRead', onTrustRead);

    const onNewComplaint = (n) => { // <-- ADD
      const notif = { ...n, isRead: n.isRead ?? false };
      setComplaintNotifications(p => [notif, ...p].slice(0, 10));
    };
    complaintSocket.on('newComplaint', onNewComplaint);

    const onComplaintRead = ({ _id }) => { // <-- ADD
      setComplaintNotifications(p =>
        p.map(n => n._id === _id ? { ...n, isRead: true } : n)
      );
    };
    complaintSocket.on('complaintRead', onComplaintRead);

    return () => {
      couponSocket.off('newRedemption', onNewCoupon);
      subadminSocket.off('newAccessRequest', onNewAccess);
      trustSocket.off('newTrustSealRequest', onNewTrust);
      trustSocket.off('trustSealNotificationRead', onTrustRead);
      complaintSocket.off('newComplaint', onNewComplaint);
      complaintSocket.off('complaintRead', onComplaintRead);
    };
  }, [userId, isAdmin, couponSocket, subadminSocket, trustSocket, complaintSocket]);

  // API sync
  useEffect(() => {
    if (couponData?.notifications) {
      const filtered = couponData.notifications
        .filter(n => n.redeemPointsId && (n.amount_sent === false || n.amount_sent === undefined))
        .map(n => ({ ...n, isRead: n.isRead ?? false }));

      setCouponNotifications(prev => {
        // Build a map of the latest API data (source of truth for isRead)
        const apiMap = new Map(filtered.map(n => [n._id, n]));

        // Update existing items from API (to pick up isRead changes), keep ones not in API
        const merged = prev.map(p => apiMap.has(p._id) ? { ...p, ...apiMap.get(p._id) } : p);

        // Prepend any brand-new items from the API
        const existingIds = new Set(merged.map(p => p._id));
        const newOnes = filtered.filter(f => !existingIds.has(f._id));

        return [...newOnes, ...merged].slice(0, 50);
      });
    }
  }, [couponData]);

  useEffect(() => {
    if (subadminData?.requests) {
      setSubadminNotifications(subadminData.requests.slice(0, 10));
    }
  }, [subadminData]);

  useEffect(() => {
    if (trustData?.data) {
      setTrustNotifications(prev => {
        const currentItemsMap = new Map(prev.map(i => [i._id, i]));
        const apiItems = trustData.data.map(n => ({ ...n, isRead: n.isRead ?? false }));

        const updated = apiItems.map(item => {
          const local = currentItemsMap.get(item._id);
          // Trust local read state if it's already read locally
          return local ? { ...item, isRead: local.isRead || item.isRead } : item;
        });

        const apiIds = new Set(updated.map(u => u._id));
        const soloLocals = prev.filter(p => !apiIds.has(p._id));

        return [...soloLocals, ...updated]
          .sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
          .slice(0, 10);
      });
    }
  }, [trustData]);

  useEffect(() => {
    if (complaintData?.notifications) {
      setComplaintNotifications(prev => {
        const currentItemsMap = new Map(prev.map(i => [i._id, i]));
        const apiItems = complaintData.notifications.map(n => ({ ...n, isRead: n.isRead ?? false }));

        // Merge: trust API for existence, but don't lose items that might be in local state but not API (if they just arrived)
        const updated = apiItems.map(item => {
          const local = currentItemsMap.get(item._id);
          return local ? { ...local, ...item } : item;
        });

        // Any local items NOT in API response (e.g. just arrived via socket)
        const apiIds = new Set(updated.map(u => u._id));
        const soloLocals = prev.filter(p => !apiIds.has(p._id));

        return [...soloLocals, ...updated].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
      });
    }
  }, [complaintData]);

  // Counts
  const couponUnread = couponNotifications.filter(n => !n.isRead).length;
  const subadminUnread = subadminNotifications.filter(n => !n.is_read).length;
  const trustUnread = trustNotifications.filter(n => !n.isRead).length;
  const complaintUnread = complaintNotifications.filter(n => !n.isRead).length; // <-- ADD
  const totalUnread = couponUnread + subadminUnread + trustUnread + complaintUnread;

  const basePath = isAdmin ? '/admin-dashboard' : '/sub-admin-dashboard';

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="relative p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none">
            <Bell size={18} className={`text-gray-600 ${totalUnread > 0 ? 'animate-pulse' : ''}`} />
            {totalUnread > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </Badge>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="divide-y">
            <Link to={`${basePath}/notifications/coupons`} className="flex justify-between p-3 hover:bg-gray-50" onClick={() => setOpen(false)}>
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-500" />
                <span>Coupon Requests</span>
              </div>
              {couponUnread > 0 && <Badge variant="secondary">{couponUnread}</Badge>}
            </Link>

            <Link to={`${basePath}/notifications/access-requests`} className="flex justify-between p-3 hover:bg-gray-50" onClick={() => setOpen(false)}>
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-500" />
                <span>Access Requests</span>
              </div>
              {subadminUnread > 0 && <Badge variant="secondary">{subadminUnread}</Badge>}
            </Link>

            <Link to={`${basePath}/notifications/trust-seal`} className="flex justify-between p-3 hover:bg-gray-50" onClick={() => setOpen(false)}>
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-500" />
                <span>Trust Seal</span>
              </div>
              {trustUnread > 0 && <Badge variant="secondary">{trustUnread}</Badge>}
            </Link>

            {/* ADD COMPLAINTS */}
            <Link to={`${basePath}/notifications/complaints`} className="flex justify-between p-3 hover:bg-gray-50" onClick={() => setOpen(false)}>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-red-500" />
                <span>Complaints</span>
              </div>
              {complaintUnread > 0 && <Badge variant="secondary">{complaintUnread}</Badge>}
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GlobalNotificationBell;
