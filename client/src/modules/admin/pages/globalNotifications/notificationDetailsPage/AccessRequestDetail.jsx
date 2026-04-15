// src/components/notifications/AccessRequestDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAccessRequestDetailsQuery,
  useMarkNotificationAsReadMutation,
  useApproveAccessMutation,
  useRejectAccessMutation,
} from '@/redux/api/SubAdminAccessRequestApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Bell } from 'lucide-react';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

const AccessRequestDetail = ({ userId, isAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = window.location.pathname.startsWith("/admin-dashboard") ? "/admin-dashboard" : "/sub-admin-dashboard";
  const { isSidebarOpen } = useSidebar();
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const { data, isLoading, isError } = useGetAccessRequestDetailsQuery(id);
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [approveAccess] = useApproveAccessMutation();
  const [rejectAccess] = useRejectAccessMutation();

  useEffect(() => {
    if (data && !data?.data?.is_read && isAdmin) {
      markNotificationAsRead({ request_id: id })
        .unwrap()
        .catch(() => showToast('Failed to mark request as read', 'error'));
    }
  }, [data, id, isAdmin]);

  const handleCheckboxChange = (page, action) => {
    setSelectedPermissions((prev) => {
      const pagePerm = prev.find((p) => p.page === page) || { page, actions: [] };
      const newActions = pagePerm.actions.includes(action)
        ? pagePerm.actions.filter((a) => a !== action)
        : [...pagePerm.actions, action];
      const newPerms = prev.filter((p) => p.page !== page);
      if (newActions.length > 0) {
        newPerms.push({ page, actions: newActions });
      }
      return newPerms;
    });
  };

  const handleApprove = async () => {
    if (selectedPermissions.length === 0) {
      showToast('Select at least one permission to approve', 'error');
      return;
    }
    try {
      await approveAccess({ request_id: id, approved_permissions: selectedPermissions }).unwrap();
      showToast('Access request approved', 'success');
      navigate(`${basePath}/notifications/access-requests`);
    } catch (error) {
      showToast('Failed to approve access request', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectAccess({ request_id: id }).unwrap();
      showToast('Access request rejected', 'success');
      navigate(`${basePath}/notifications/access-requests`);
    } catch (error) {
      showToast('Failed to reject access request', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) {
    showToast('Failed to load access request details', 'error');
    return <div>Error loading access request details</div>;
  }
  console.log(data?.data, 'mersds');

  return (

    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
      <div className="container mx-auto p-4">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate(`${basePath}/notifications/access-requests`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Access Requests
        </Button>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={24} className="text-blue-500" />
              Access Request Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Message</h3>
                <p>{data?.data?.message}</p>
              </div>
              <div>
                <h3 className="font-semibold">Requester</h3>
                <p>{data?.data?.requester_id.name}</p>
              </div>
              <div>
                <h3 className="font-semibold">Requested Permissions</h3>
                <ul className="list-disc pl-5">
                  {data?.data?.permissions.map((perm) => (
                    <li key={perm.page}>
                      {perm.page} ({perm.actions.join(', ')})
                    </li>
                  ))}
                </ul>
              </div>
              {data?.data?.approved_permissions?.length > 0 && (
                <div>
                  <h3 className="font-semibold">Approved Permissions</h3>
                  <ul className="list-disc pl-5">
                    {data?.data?.approved_permissions.map((perm) => (
                      <li key={perm.page}>
                        {perm.page} ({perm.actions.join(', ')})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data?.data?.status === 'pending' && isAdmin && (
                <div>
                  <h3 className="font-semibold">Select Permissions to Approve</h3>
                  {data?.data?.permissions.map((perm) => (
                    <div key={perm.page} className="mt-2">
                      <p className="font-medium">{perm.page}</p>
                      <div className="flex flex-wrap gap-2">
                        {perm.actions.map((action) => (
                          <label key={action} className="flex items-center">
                            <Checkbox
                              checked={
                                selectedPermissions.find((p) => p.page === perm.page)?.actions.includes(action) || false
                              }
                              onCheckedChange={() => handleCheckboxChange(perm.page, action)}
                            />
                            <span className="ml-2">{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
                      Approve Selected
                    </Button>
                    <Button onClick={handleReject} variant="destructive">
                      Reject
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold">Status</h3>
                <Badge variant={data?.data?.status === 'pending' ? 'default' : 'secondary'}>
                  {data?.data?.status}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold">Requested Date</h3>
                <p>{new Date(data?.data?.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>


  );
};

export default AccessRequestDetail;
