// src/pages/SubadminAccessRequestsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCheck, Pencil } from 'lucide-react';
import io from 'socket.io-client';
import {
  useGetAccessRequestsQuery,           // ← ORIGINAL
  useMarkNotificationAsReadMutation,   // ← ORIGINAL
  useApproveAccessMutation,            // ← ORIGINAL
  useRejectAccessMutation,             // ← ORIGINAL
} from '@/redux/api/SubAdminAccessRequestApi';
import { useNavigate } from 'react-router-dom';
import showToast from '@/toast/showToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useSidebar } from '../../hooks/useSidebar';

const SubadminAccessRequestsPage = ({ isAdmin }) => {
  const navigate = useNavigate();
  const basePath = window.location.pathname.startsWith("/admin-dashboard") ? "/admin-dashboard" : "/sub-admin-dashboard";
  const { isSidebarOpen } = useSidebar();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const [selectedPermissions, setSelectedPermissions] = useState({});

  const { data, isLoading, isError, refetch } = useGetAccessRequestsQuery(
    { page, limit, status: filter },
    { refetchOnMountOrArgChange: true }
  );

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [approveAccess] = useApproveAccessMutation();
  const [rejectAccess] = useRejectAccessMutation();

  // --- One socket instance ---
  const socket = useMemo(
    () =>
      io(`${import.meta.env.VITE_SOCKET_IO_URL}/access-request-notifications`, {
        withCredentials: true,
        transports: ['websocket'],
      }),
    []
  );

  // --- Expose to Global Bell ---
  useEffect(() => {
    window.globalSetSubadminNotifications = setNotifications;
    return () => delete window.globalSetSubadminNotifications;
  }, [setNotifications]);

  // --- Socket + API sync ---
  useEffect(() => {
    socket.on('connect', () => {
      if (isAdmin) socket.emit('join_admins');
    });

    socket.on('newAccessRequest', (notification) => {
      const formatted = {
        ...notification,
        is_read: notification.is_read ?? false,
        requester_id: {
          name: notification.requester_id?.name || 'N/A',
          role: notification.requester_id?.role || { role: 'N/A' },
        },
      };
      setNotifications((prev) => [formatted, ...prev]);
      //   showToast(`New Access Request: ${notification.message || 'Access request'}`, 'success');
      refetch();
    });

    if (data?.requests) {
      const formatted = data.requests.map((r) => ({
        ...r,
        is_read: r.is_read,
      }));
      setNotifications((prev) => (page === 1 ? formatted : [...prev, ...formatted]));
      setHasMore(page < data?.pagination?.totalPages);
    }

    return () => {
      socket.off('newAccessRequest');
      socket.off('connect');
    };
  }, [data, isAdmin, page, refetch, socket]);

  // --- Filter ---
  useEffect(() => {
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else if (filter === 'unread') {
      setFilteredNotifications(notifications.filter((n) => !n.is_read));
    } else if (filter === 'read') {
      setFilteredNotifications(notifications.filter((n) => n.is_read));
    }
  }, [notifications, filter]);

  // --- Mark as read ---
  const handleMarkAsRead = async (requestId) => {
    try {
      await markNotificationAsRead({ request_id: requestId }).unwrap();
      showToast('Notification marked as read', 'success');

      setNotifications((prev) =>
        prev.map((n) => (n._id === requestId ? { ...n, is_read: true } : n))
      );

      if (window.globalSetSubadminNotifications) {
        window.globalSetSubadminNotifications((prev) =>
          prev.map((n) => (n._id === requestId ? { ...n, is_read: true } : n))
        );
      }
    } catch (error) {
      showToast(`Failed to mark notification as read,${error}`, 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      for (const n of notifications.filter((n) => !n.is_read)) {
        await markNotificationAsRead({ request_id: n._id }).unwrap();
      }
      showToast('All notifications marked as read', 'success');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      if (window.globalSetSubadminNotifications) {
        window.globalSetSubadminNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
      }
    } catch (error) {
      showToast(`Failed to mark all as read,${error}`, 'error');
    }
  };

  // --- Permissions ---
  const handleCheckboxChange = (requestId, pageName, action) => {
    setSelectedPermissions((prev) => {
      const perms = prev[requestId] || [];
      const pagePerm = perms.find((p) => p.page === pageName) || { page: pageName, actions: [] };
      const newActions = pagePerm.actions.includes(action)
        ? pagePerm.actions.filter((a) => a !== action)
        : [...pagePerm.actions, action];

      const filtered = perms.filter((p) => p.page !== pageName);
      if (newActions.length > 0) filtered.push({ page: pageName, actions: newActions });
      return { ...prev, [requestId]: filtered };
    });
  };

  const handleApprove = async (requestId) => {
    const approved = selectedPermissions[requestId] || [];
    if (approved.length === 0) {
      showToast('Select at least one permission', 'error');
      return;
    }
    try {
      await approveAccess({ request_id: requestId, approved_permissions: approved }).unwrap();
      showToast('Access approved', 'success');
      setSelectedPermissions((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
      refetch();
    } catch (error) {
      showToast(`Failed to approve,${error}`, 'error');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectAccess({ request_id: requestId }).unwrap();
      showToast('Access rejected', 'success');
      setSelectedPermissions((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
      refetch();
    } catch (error) {
      showToast(`Failed to reject,${error}`, 'error');
    }
  };

  const handleRowClick = async (notification) => {
    if (!notification.is_read) await handleMarkAsRead(notification._id);
    navigate(`${basePath}/notifications/access-requests/${notification._id}`);
  };

  const handleLoadMore = () => setPage((p) => p + 1);

  const formatTime = (ts) => {
    const now = Date.now();
    const diff = now - new Date(ts).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleEditAndDelete = () => {
    navigate(`${basePath}/request/sub-admin-access`);
  };

  if (isError) {
    showToast('Failed to load requests', 'error');
    return <div>Error loading access requests</div>;
  }

  return (
    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
      <div className="container mx-auto lg:p-4">
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Bell size={24} className="text-blue-500" />
                Access Request Notifications
              </CardTitle>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] border-2 border-slate-300">
                    <SelectValue placeholder="e.g. All Requests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" className="flex items-center gap-2">
                  <CheckCheck size={16} />
                  Mark All Read
                </Button>

                <Button onClick={handleEditAndDelete} variant="outline" size="sm" className="flex items-center gap-2">
                  <Pencil size={16} />
                  Edit/Delete
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading && notifications.length === 0 ? (
              <div className="text-center py-6">Loading...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                {filter === 'unread' ? 'No unread' : filter === 'read' ? 'No read' : 'No requests'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="hidden sm:table-header-group">
                      <TableRow>
                        <TableHead>Message</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotifications.map((n) => (
                        <TableRow
                          key={n._id}
                          className={`cursor-pointer ${!n.is_read ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-100`}
                          onClick={() => handleRowClick(n)}
                        >
                          {/* Mobile */}
                          <div className="sm:hidden p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                              <span className="font-medium">{n.message || 'Access request'}</span>
                            </div>
                            <div className="text-xs space-y-1">
                              <div><strong>Requester:</strong> {n.requester_id.name}</div>
                              <div><strong>Permissions:</strong> {n.permissions[0]?.page} ({n.permissions[0]?.actions.join(', ')}){n.permissions.length > 1 ? ', ...' : ''}</div>
                              <div><strong>Status:</strong> <Badge variant={n.status === 'pending' ? 'default' : 'secondary'}>{n.status}</Badge></div>
                              <div><strong>Time:</strong> {formatTime(n.createdAt)}</div>
                            </div>
                            {n.status === 'pending' && isAdmin && (
                              <div className="mt-2 space-y-2">
                                {n.permissions.map((p) => (
                                  <div key={p.page}>
                                    <p className="text-xs font-medium">{p.page}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {p.actions.map((a) => (
                                        <label key={a} className="flex items-center text-xs">
                                          <Checkbox
                                            checked={selectedPermissions[n._id]?.find((x) => x.page === p.page)?.actions.includes(a) || false}
                                            onCheckedChange={() => handleCheckboxChange(n._id, p.page, a)}
                                          />
                                          <span className="ml-1">{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApprove(n._id); }} className="bg-green-500 hover:bg-green-600">
                                    Approve
                                  </Button>
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleReject(n._id); }} variant="destructive">
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Desktop */}
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                              {n.message || 'Access request'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{n.requester_id.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {n.permissions[0]?.page} ({n.permissions[0]?.actions.join(', ')}){n.permissions.length > 1 ? ', ...' : ''}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={n.status === 'pending' ? 'default' : 'secondary'}>{n.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{formatTime(n.createdAt)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {n.status === 'pending' && isAdmin && (
                              <div className="space-y-2">
                                {n.permissions.map((p) => (
                                  <div key={p.page}>
                                    <p className="text-xs font-medium">{p.page}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {p.actions.map((a) => (
                                        <label key={a} className="flex items-center text-xs">
                                          <Checkbox
                                            checked={selectedPermissions[n._id]?.find((x) => x.page === p.page)?.actions.includes(a) || false}
                                            onCheckedChange={() => handleCheckboxChange(n._id, p.page, a)}
                                          />
                                          <span className="ml-1">{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApprove(n._id); }} className="bg-green-500 hover:bg-green-600">
                                    Approve
                                  </Button>
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleReject(n._id); }} variant="destructive">
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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

export default SubadminAccessRequestsPage;