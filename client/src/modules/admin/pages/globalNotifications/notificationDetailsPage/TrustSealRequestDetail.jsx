// src/components/notifications/TrustSealRequestDetail.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetTrustSealRequestDetailsQuery,
  useMarkTrustSealNotificationAsReadMutation,
} from '@/redux/api/TrustSealRequestApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell } from 'lucide-react';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';



const TrustSealRequestDetail = ({ userId }) => {
  const { id } = useParams();
  const requestId = id;
  const navigate = useNavigate();
  const basePath = window.location.pathname.startsWith("/admin-dashboard") ? "/admin-dashboard" : "/sub-admin-dashboard";
  const { isSidebarOpen } = useSidebar();
  const { data, isLoading, isError, error } = useGetTrustSealRequestDetailsQuery(requestId);
  const [markNotificationAsRead] = useMarkTrustSealNotificationAsReadMutation();

  useEffect(() => {
    if (data && !data?.data?.isRead) {
      markNotificationAsRead({ requestId: id, userId })
        .unwrap()
        .catch(() => showToast('Failed to mark request as read', 'error'));
    }
  }, [data, id, userId]);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) {
    showToast('Failed to load trust seal request details', 'error');
    return <div>Error loading trust seal request details</div>;
  }

  return (

    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'}`}>

      <div className="container mx-auto p-4">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate(`${basePath}/notifications/trust-seal`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trust Seal Requests
        </Button>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={24} className="text-blue-500" />
              Trust Seal Request Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Merchant</h3>
                <p>{data?.data?.merchantName}</p>
              </div>
              <div>
                <h3 className="font-semibold">Amount</h3>
                <p>₹{data?.data?.amount}</p>
              </div>
              {data?.data?.gst_percentage && (
                <div>
                  <h3 className="font-semibold">GST Percentage</h3>
                  <p>{data?.data?.gst_percentage}%</p>
                </div>
              )}
              {data?.data?.gst_amount && (
                <div>
                  <h3 className="font-semibold">GST Amount</h3>
                  <p>₹{data?.data?.gst_amount}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold">Status</h3>
                <Badge variant={data?.data?.status === 'pending' ? 'default' : 'secondary'}>
                  {data?.data?.status}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold">Images</h3>
                {data?.data?.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {data?.data?.images.map((image, index) => (
                      <a key={index} href={image.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={image.url}
                          alt={`Trust seal image ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p>No images uploaded</p>
                )}
              </div>
              {data?.data?.razorpay_order_id && (
                <div>
                  <h3 className="font-semibold">Razorpay Order ID</h3>
                  <p>{data?.data?.razorpay_order_id}</p>
                </div>
              )}
              {data?.data?.razorpay_payment_id && (
                <div>
                  <h3 className="font-semibold">Razorpay Payment ID</h3>
                  <p>{data?.data?.razorpay_payment_id}</p>
                </div>
              )}
              {data?.data?.notes && (
                <div>
                  <h3 className="font-semibold">Notes</h3>
                  <p>{data?.data?.notes}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold">Requested Date</h3>
                <p>{new Date(data?.data?.created_at).toLocaleString()}</p>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrustSealRequestDetail;
