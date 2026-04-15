// src/pages/CouponNotificationsPage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import io from 'socket.io-client';
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
} from '@/redux/api/couponsNotificationApi';
import { useNavigate } from 'react-router-dom';
import showToast from '@/toast/showToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';

const CouponNotificationsPage = () => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;

  const basePath = window.location.pathname.startsWith("/admin-dashboard") ? "/admin-dashboard" : "/sub-admin-dashboard";

  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState(null); // ← for per-row loading

  const limit = 10;

  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(
    { userId, page, limit, status: filter },
    { refetchOnMountOrArgChange: true }
  );

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const socket = useMemo(
    () => io(`${import.meta.env.VITE_SOCKET_IO_URL}/coupons`, {
      withCredentials: true,
      transports: ['websocket'],
    }),
    []
  );

  // Global access for bell icon / other components
  useEffect(() => {
    window.globalSetCouponNotifications = setNotifications;
    return () => {
      delete window.globalSetCouponNotifications;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    socket.on('connect', () => {
      socket.emit('join', userId);
    });

    socket.on('newRedemption', (n) => {
      const notif = { ...n, isRead: n.isRead ?? false };
      setNotifications((prev) => [notif, ...prev]);
      refetch();
    });

    // ← Real-time delete listener
    socket.on('notificationDeleted', ({ notificationId }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (window.globalSetCouponNotifications) {
        window.globalSetCouponNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
      }
    });

    if (data?.notifications) {
      const formatted = data.notifications
        .filter((n) => n.redeemPointsId && (n.amount_sent === false || n.amount_sent === undefined))
        .map((n) => ({ ...n, isRead: n.isRead ?? false }));

      setNotifications((prev) => (page === 1 ? formatted : [...prev, ...formatted]));
      setHasMore(page < data.pagination.totalPages);
    }

    return () => {
      socket.off('newRedemption');
      socket.off('notificationDeleted');
      socket.off('connect');
    };
  }, [data, page, refetch, socket, userId]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else if (filter === 'unread') {
      setFilteredNotifications(notifications.filter((n) => !n.isRead));
    } else if (filter === 'read') {
      setFilteredNotifications(notifications.filter((n) => n.isRead));
    }
  }, [notifications, filter]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead({ notificationId: id, userId }).unwrap();
      showToast('Marked as read', 'success');
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (window.globalSetCouponNotifications) {
        window.globalSetCouponNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      showToast(`Failed to mark as read: ${error?.data?.message || error.message}`, 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      for (const n of unread) {
        await markNotificationAsRead({ notificationId: n._id, userId }).unwrap();
      }
      showToast('All notifications marked as read', 'success');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (window.globalSetCouponNotifications) {
        window.globalSetCouponNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      showToast(`Failed: ${error?.data?.message || error.message}`, 'error');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification permanently? This cannot be undone.')) return;

    setDeletingId(notificationId);

    try {
      await deleteNotification({ notificationId, userId }).unwrap();
      showToast('Notification deleted successfully', 'success');

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (window.globalSetCouponNotifications) {
        window.globalSetCouponNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
      }
    } catch (err) {
      const msg = err?.data?.message || err.message || 'Unknown error';
      showToast(`Delete failed: ${msg}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = async (n) => {
    if (!n.isRead) await handleMarkAsRead(n._id);
    navigate(`${basePath}/notifications/coupons/${n._id}`);
  };

  const handleLoadMore = () => setPage((p) => p + 1);

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (isError) return <div className="text-center py-8 text-red-600">Error loading notifications</div>;

  return (
    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
      <div className="container mx-auto lg:p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Bell size={24} className="text-blue-500" />
                Coupon Notifications
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px] border-2 border-slate-300">
                    <SelectValue placeholder="e.g. Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                  <CheckCheck size={16} className="mr-1" /> Mark All Read
                </Button>
                <Button
                  onClick={() => navigate(`${basePath}/request/wallet`)}
                  variant="outline"
                  size="sm"
                >
                  <CheckCheck size={16} className="mr-1" /> Review Redeem Requests
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading && !notifications.length ? (
              <div className="text-center py-6">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No notifications found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="hidden sm:table-header-group">
                      <TableRow>
                        <TableHead>Message</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredNotifications.map((n) => (
                        <TableRow
                          key={n._id}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50' : ''
                            }`}
                          onClick={() => handleRowClick(n)}
                        >
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              {!n.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                              <span className="line-clamp-2">{n.message}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {n.merchantName || '-'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {n.redeemPointsId?.redeem_point ?? '-'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {formatTime(n.created_at)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={n.isRead ? 'secondary' : 'default'}>
                              {n.isRead ? 'Read' : 'Unread'}
                            </Badge>
                          </TableCell>

                          <TableCell className="hidden sm:table-cell text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deletingId === n._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(n._id);
                              }}
                              title="Delete notification"
                            >
                              {deletingId === n._id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <Button onClick={handleLoadMore} disabled={isLoading}>
                      {isLoading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CouponNotificationsPage;
