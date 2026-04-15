// src/components/notifications/ComplaintNotificationDetail.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetComplaintNotificationDetailsQuery, useMarkComplaintAsReadMutation } from '@/redux/api/ComplaintNotificationApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, User, Phone, Info, MessageSquare } from 'lucide-react';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

const ComplaintNotificationDetail = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = window.location.pathname.startsWith("/admin-dashboard") ? "/admin-dashboard" : "/sub-admin-dashboard";
  const { isSidebarOpen } = useSidebar();
  const { data, isLoading, isError } = useGetComplaintNotificationDetailsQuery(id);
  const [markAsRead] = useMarkComplaintAsReadMutation();

  useEffect(() => {
    if (data && !data?.data?.isRead) {
      markAsRead({ notificationId: id, userId }).unwrap().catch(() => { });
    }
  }, [data, id, userId]);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) return <div>Error</div>;

  const n = data.data;

  return (
    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>
      <div className="container mx-auto p-4">
        <Button variant="outline" className="mb-4 cursor-pointer" onClick={() => navigate(`${basePath}/notifications/complaints`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={24} className="text-red-500" />
              Complaint Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Header: Status & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={n?.isRead ? 'secondary' : 'default'}
                  className="px-3 py-1 text-xs uppercase tracking-wide"
                >
                  {n?.isRead ? 'Read' : 'Unread'}
                </Badge>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {n?.complaintId?.option || "General Complaint"}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(n?.created_at).toLocaleString([], {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>

            {/* Main Message */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Message
              </h3>
              <p className="text-lg font-medium text-gray-900 leading-relaxed">
                {n?.message}
              </p>
            </div>

            {/* User Information Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">User Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-gray-200 text-gray-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {n?.complaintId?.user_id?.name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-gray-200 text-gray-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {n?.complaintId?.user_id?.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details Section */}
            {n?.complaintId?.details?.complaint_description && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Additional Details
                </h4>
                <div className="bg-slate-900 rounded-md overflow-hidden">
                  <pre className="p-4 text-xs text-slate-50 font-mono overflow-x-auto">
                    {typeof n?.complaintId?.details?.complaint_description === 'string'
                      ? n.complaintId.details.complaint_description
                      : JSON.stringify(n?.complaintId?.details?.complaint_description, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplaintNotificationDetail;
