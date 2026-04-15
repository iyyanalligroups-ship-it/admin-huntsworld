// src/pages/TrustSealRequestsPage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import io from 'socket.io-client';
import {
  useGetTrustSealRequestsQuery,
  useMarkTrustSealNotificationAsReadMutation, useDeleteTrustSealRequestMutation
} from '@/redux/api/TrustSealRequestApi';
import { useNavigate } from 'react-router-dom';
import showToast from '@/toast/showToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const TrustSealRequestsPage = () => {
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
  const limit = 10;

  const { data, isLoading, isError, refetch } = useGetTrustSealRequestsQuery(
    { page, limit, status: filter },
    { refetchOnMountOrArgChange: true }
  );
  const [deleteTrustSealRequest, { isLoading: isDeleting }] = useDeleteTrustSealRequestMutation();
  const [markNotificationAsRead] = useMarkTrustSealNotificationAsReadMutation();

  const socket = useMemo(
    () => io(`${import.meta.env.VITE_SOCKET_IO_URL}/trust-seal-notifications`, {
      withCredentials: true,
      transports: ['websocket'],
    }),
    []
  );

  useEffect(() => {
    window.globalSetTrustNotifications = setNotifications;
    return () => delete window.globalSetTrustNotifications;
  }, [setNotifications]);


  useEffect(() => {
    socket.on('connect', () => socket.emit('join', 'trust-seal:admin'));
    socket.on('newTrustSealRequest', (n) => {
      const notif = { ...n, isRead: n.isRead ?? false };
      setNotifications(p => [notif, ...p]);
      // showToast(`New Trust Seal Request`, 'success');
      refetch();
    });
    // Optional: listen for deletion from other admins
    socket.on('trustSealRequestDeleted', ({ request_id }) => {
      setNotifications(prev => prev.filter(n => n._id !== request_id));
      showToast("A request was deleted by another admin", "info");
      refetch();
    });
    if (data?.data) {
      const formatted = data.data.map(n => ({ ...n, isRead: n.isRead ?? false }));
      setNotifications(page === 1 ? formatted : p => [...p, ...formatted]);
      setHasMore(page < data?.pagination?.totalPages);
    }

    return () => {
      socket.off('newTrustSealRequest');
      socket.off('trustSealRequestDeleted');
      socket.off('connect');
    };
  }, [data, page, refetch, socket]);

  useEffect(() => {
    if (filter === 'all') setFilteredNotifications(notifications);
    else if (filter === 'unread') setFilteredNotifications(notifications.filter(n => !n.isRead));
    else if (filter === 'read') setFilteredNotifications(notifications.filter(n => n.isRead));
  }, [notifications, filter]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead({ requestId: id, userId }).unwrap();
      showToast('Marked as read', 'success');
      setNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));

      if (window.globalSetTrustNotifications) {
        window.globalSetTrustNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      showToast(`Failed,${error}`, 'error');
    }
  };
  const handleDeleteRequest = async (requestId) => {
    try {
      await deleteTrustSealRequest(requestId).unwrap();
      showToast("Trust seal request deleted", "success");
      setNotifications(prev => prev.filter(n => n._id !== requestId));
      refetch();
    } catch (error) {
      showToast(`Delete failed: ${error?.data?.message || error.message}`, "error");
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      for (const n of notifications.filter(n => !n.isRead)) {
        await markNotificationAsRead({ requestId: n._id, userId }).unwrap();
      }
      showToast('All marked', 'success');
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));

      if (window.globalSetTrustNotifications) {
        window.globalSetTrustNotifications(p => p.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      showToast(`Failed,${error}`, 'error');
    }
  };

  const handleRowClick = async (n) => {
    if (!n.isRead) await handleMarkAsRead(n._id);
    navigate(`${basePath}/notifications/trust-seal`);
  };

  const handleLoadMore = () => setPage(p => p + 1);

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

  if (isError) return <div>Error</div>;

  return (
    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
      <div className="container mx-auto lg:p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Bell size={24} className="text-blue-500" />
                Trust Seal Requests
              </CardTitle>
              <div className="flex gap-2">
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
                  <CheckCheck size={16} /> Mark All
                </Button>
                <Button onClick={() => {
                  navigate(`${basePath}/request/trust-seal-requests`)
                }} variant="outline" size="sm" className="cursor-pointer">
                  <CheckCheck size={16} /> To review trust request
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && !notifications.length ? (
              <div className="text-center py-6">Loading...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center text-gray-500 py-6">No requests</div>
            ) : (
              <>
                <Table>
                  <TableHeader className="hidden sm:table-header-group">
                    <TableRow>
                      <TableHead>Message</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map(n => (
                      <TableRow key={n._id} className={`cursor-pointer ${!n.isRead ? 'bg-blue-50' : ''}`} onClick={() => handleRowClick(n)}>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            New Trust Seal Request
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{n.merchantName}</TableCell>
                        <TableCell className="hidden sm:table-cell">₹{n.amount}</TableCell>
                        <TableCell className="hidden sm:table-cell">{formatTime(n.created_at)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={n.isRead ? 'secondary' : 'default'}>{n.isRead ? 'Read' : 'Unread'}</Badge>
                        </TableCell>
                        {/* Delete Button with Confirmation */}
                        <TableCell className="hidden sm:table-cell">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()} // prevent row click
                              >
                                <Trash2 size={18} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trust Seal Request?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The request from{' '}
                                  <span className="font-semibold">{n.merchantName}</span> will be
                                  permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteRequest(n._id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {hasMore && (
                  <div className="mt-4 text-center">
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

export default TrustSealRequestsPage;
