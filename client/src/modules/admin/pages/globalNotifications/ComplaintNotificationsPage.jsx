// src/pages/ComplaintNotificationsPage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  CheckCheck,
  FileText,
  Clock,
  Filter,
  ChevronRight,
  User as UserIcon,
  Trash2,
} from 'lucide-react';
import io from 'socket.io-client';
import {
  useGetComplaintNotificationsQuery,
  useMarkComplaintAsReadMutation,
  useDeleteComplaintNotificationMutation,
} from '@/redux/api/ComplaintNotificationApi';
import { useNavigate } from 'react-router-dom';
import showToast from '@/toast/showToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';

const ComplaintNotificationsPage = () => {
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

  const { data, isLoading, isError } = useGetComplaintNotificationsQuery(
    { userId, page, limit, status: filter === 'all' ? undefined : filter },
    { refetchOnMountOrArgChange: true }
  );

  const [markAsRead] = useMarkComplaintAsReadMutation();
  const [deleteNotification] = useDeleteComplaintNotificationMutation();

  // State for controlling which notification to delete
  const [deleteId, setDeleteId] = useState(null);

  const socket = useMemo(
    () =>
      io(`${import.meta.env.VITE_SOCKET_IO_URL}/complaints`, {
        withCredentials: true,
        transports: ['websocket'],
      }),
    []
  );

  useEffect(() => {
    window.globalSetComplaintNotifications = setNotifications;
    return () => delete window.globalSetComplaintNotifications;
  }, []);

  // Socket connection & new complaint handling
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Complaint notifications socket connected');
      socket.emit('joinAdmin');
    });

    socket.on('newComplaint', (newNotif) => {
      const formatted = {
        ...newNotif,
        isRead: newNotif.isRead ?? false,
        created_at: newNotif.created_at || new Date().toISOString(),
      };
      setNotifications((prev) => [formatted, ...prev]);
      showToast('New complaint received', 'info');
    });

    return () => {
      socket.off('connect');
      socket.off('newComplaint');
    };
  }, [socket]);

  // Load data from API
  useEffect(() => {
    if (data?.notifications) {
      const formatted = data.notifications.map((n) => ({
        ...n,
        isRead: n.isRead ?? false,
      }));

      if (page === 1) {
        setNotifications(formatted);
      } else {
        setNotifications((prev) => [...prev, ...formatted]);
      }
      setHasMore(page < data.pagination.totalPages);
    }
  }, [data, page]);

  // Apply filter
  useEffect(() => {
    const filtered = notifications.filter((n) => {
      if (filter === 'unread') return !n.isRead;
      if (filter === 'read') return n.isRead;
      return true; // 'all'
    });
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead({ notificationId: id, userId }).unwrap();
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      showToast('Marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleDeleteClick = (e, notificationId) => {
    e.stopPropagation();
    setDeleteId(notificationId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteNotification(deleteId).unwrap();
      showToast('Notification deleted', 'success');

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n._id !== deleteId));
      setFilteredNotifications((prev) => prev.filter((n) => n._id !== deleteId));
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Failed to delete notification', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      for (const n of unread) {
        await markAsRead({ notificationId: n._id, userId }).unwrap();
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All marked as read', 'success');
    } catch (err) {
      showToast('Failed', 'error');
    }
  };

  const handleAllComplaintViewPage = () => {
    navigate(`${basePath}/others/complaint`);
  };

  const handleRowClick = (n) => {
    if (!n.isRead) handleMarkAsRead(n._id);
    console.log(n, 'id');
    navigate(`${basePath}/notifications/complaints/${n._id}`);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) setPage((prev) => prev + 1);
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  if (isError)
    return <div className="text-center py-12 text-red-600">Error loading notifications</div>;

  return (
    <div
      className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'
        } transition-all duration-300 bg-gray-50/50 min-h-screen`}
    >
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Main Card */}
        <Card className="shadow-sm border border-gray-200 overflow-hidden bg-white">
          {/* Header Section */}
          <CardHeader className="bg-white border-b px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  Complaint Inbox
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1 ml-1">
                  Manage and track incoming user complaints
                </p>
              </div>

              {/* Actions Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative">
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] pl-9 bg-gray-50 border-2 border-slate-300">
                      <SelectValue placeholder="e.g. All Complaints" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Complaints</SelectItem>
                      <SelectItem value="unread">Unread Only</SelectItem>
                      <SelectItem value="read">Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleMarkAllAsRead}
                  variant="outline"
                  className="bg-gray-50 cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
                <Button
                  onClick={handleAllComplaintViewPage}
                  variant="outline"
                  className="bg-gray-50 cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  View All Complaint
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Content Section */}
          <CardContent className="p-0">
            {isLoading && page === 1 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
                <p>Loading complaints...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <FileText className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No complaints found</h3>
                <p className="text-gray-500 max-w-sm mt-1">
                  You're all caught up! There are no notifications matching your current filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((n) => {
                  const user = n?.complaintId?.user_id || {};
                  const isUnread = !n.isRead;

                  return (
                    <div
                      key={n._id}
                      onClick={() => handleRowClick(n)}
                      className={`
                        group relative flex flex-col sm:flex-row gap-4 p-5
                        transition-all duration-200 cursor-pointer hover:bg-gray-50
                        ${isUnread ? 'bg-white' : 'bg-gray-50/30'}
                      `}
                    >
                      {/* Unread Indicator Bar */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                      )}

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div
                          className={`
                          h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold border-2
                          ${isUnread
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                            }
                        `}
                        >
                          {user.name ? getInitials(user.name) : <UserIcon className="w-5 h-5" />}
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-base ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                                }`}
                            >
                              {user.name || 'Anonymous User'}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-xs font-normal text-gray-500 bg-white border-gray-200"
                            >
                              {n?.complaintId?.option || 'General'}
                            </Badge>
                            {isUnread && (
                              <span className="inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                            )}
                          </div>

                          {/* Mobile Time */}
                          <span className="sm:hidden text-xs text-gray-400">
                            {formatTime(n.created_at)}
                          </span>
                        </div>

                        <p
                          className={`text-sm truncate pr-4 ${isUnread ? 'text-gray-800' : 'text-gray-500'
                            }`}
                        >
                          {n?.complaintId?.details?.complaint_description ||
                            'No detailed description provided...'}
                        </p>
                      </div>

                      {/* Desktop: Time + Delete + Chevron */}
                      <div className="hidden sm:flex flex-col items-end justify-center gap-3 min-w-[100px] pl-4 border-l border-transparent group-hover:border-gray-200">
                        <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(n.created_at)}
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDeleteClick(e, n._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors" />
                      </div>

                      {/* Mobile delete button */}
                      <div className="sm:hidden flex items-center gap-2 self-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDeleteClick(e, n._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  variant="ghost"
                  className="text-sm text-gray-600 hover:text-red-600 cursor-pointer hover:bg-red-50 w-full sm:w-auto px-8"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Load Older Complaints'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification?
              <br />
              <br />
              This will remove it from the inbox permanently.
              <br />
              The original complaint record will <strong>remain</strong> in the system.
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ComplaintNotificationsPage;
