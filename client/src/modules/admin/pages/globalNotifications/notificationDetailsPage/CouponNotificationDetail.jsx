// src/components/notifications/CouponNotificationDetail.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetNotificationDetailsQuery, useMarkNotificationAsReadMutation } from '@/redux/api/couponsNotificationApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Bell, Building2, User, Mail, Phone,
  Tag, Star, MessageSquare, FileText, Calendar, CheckCircle, Clock
} from 'lucide-react';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';


const CouponNotificationDetail = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = window.location.pathname.startsWith("/admin-dashboard") ? "/admin-dashboard" : "/sub-admin-dashboard";
  const { isSidebarOpen } = useSidebar();
  const { data, isLoading, isError, error } = useGetNotificationDetailsQuery(id);

  console.log(data, 'notification detail');
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();

  useEffect(() => {
    if (data && !data?.data?.isRead) {
      markNotificationAsRead({ notificationId: id, userId })
        .unwrap()
        .catch(() => showToast('Failed to mark notification as read', 'error'));
    }
  }, [data, id, userId]);

  if (isLoading) {
    return (
      <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} flex items-center justify-center min-h-[60vh] px-4`}>
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading notification details...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    showToast('Failed to load notification details', 'error');
    return (
      <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} flex items-center justify-center min-h-[60vh] px-4`}>
        <div className="text-center text-red-500">
          <p className="font-semibold">Error loading notification details</p>
          <p className="text-sm text-gray-400 mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  const detail = data?.data;
  const isRead = detail?.isRead;

  const InfoRow = ({ icon: Icon, label, value, accent }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${accent || 'bg-blue-100'}`}>
          <Icon size={14} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
          <p className="text-xs sm:text-sm font-medium text-gray-800 break-words leading-snug">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`${isSidebarOpen ? 'ml-1 sm:ml-56' : 'ml-1 sm:ml-16'} min-h-screen`}>
      {/* Fluid padding: tight on mobile, generous on tablet/desktop */}
      <div className="w-full max-w-3xl mx-auto px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-6">

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 sm:mb-5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 gap-1.5 pl-1.5 text-xs sm:text-sm h-8 sm:h-9"
          onClick={() => navigate(`${basePath}/notifications/coupons`)}
        >
          <ArrowLeft size={15} />
          <span className="hidden xs:inline">Back to Coupon Notifications</span>
          <span className="xs:hidden">Back</span>
        </Button>

        {/* Main Card */}
        <Card className="w-full shadow-md border border-gray-200 overflow-hidden">

          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 sm:px-6 sm:py-5">
            {/* Stack vertically on tiny screens, row on sm+ */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl shrink-0">
                  <Bell size={18} className="text-white sm:w-[22px] sm:h-[22px]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                    Coupon Redemption Details
                  </h1>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1 line-clamp-2 leading-snug">
                    {detail?.message}
                  </p>
                </div>
              </div>
              {/* Badge aligned right on sm+, left-aligned below title on mobile */}
              <Badge
                className={`self-start sm:self-auto shrink-0 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border-0 ${
                  isRead
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-400 text-amber-900'
                }`}
              >
                {isRead ? (
                  <span className="flex items-center gap-1"><CheckCircle size={11} /> Read</span>
                ) : (
                  <span className="flex items-center gap-1"><Clock size={11} /> Unread</span>
                )}
              </Badge>
            </div>
          </div>

          {/* Card Body — tighter padding on mobile */}
          <CardContent className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5">

            {/* Merchant & Customer Section */}
            <div>
              <h2 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
                Merchant &amp; Customer
              </h2>
              {/* 1 col on mobile/portrait, 2 col on landscape/tablet+ */}
              <div className="grid grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2">
                <InfoRow icon={Building2} label="Merchant" value={detail?.merchantName} accent="bg-purple-100" />
                <InfoRow icon={User} label="Customer" value={detail?.redeemPointsId?.user_id?.name} accent="bg-indigo-100" />
                <InfoRow icon={Mail} label="Email" value={detail?.redeemPointsId?.user_id?.email} accent="bg-cyan-100" />
                <InfoRow icon={Phone} label="Phone" value={detail?.redeemPointsId?.user_id?.phone} accent="bg-teal-100" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Redemption Details */}
            <div>
              <h2 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
                Redemption Details
              </h2>
              <div className="grid grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2">
                <InfoRow icon={Tag} label="Coupon" value={detail?.couponName} accent="bg-green-100" />
                <InfoRow icon={Star} label="Points Redeemed" value={detail?.redeemPoints} accent="bg-yellow-100" />
                <InfoRow icon={MessageSquare} label="Reason" value={detail?.reason} accent="bg-orange-100" />
                {detail?.notes && (
                  <InfoRow icon={FileText} label="Notes" value={detail?.notes} accent="bg-rose-100" />
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Metadata */}
            <div>
              <h2 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
                Metadata
              </h2>
              <InfoRow
                icon={Calendar}
                label="Requested Date"
                value={new Date(detail?.created_at).toLocaleString()}
                accent="bg-gray-200"
              />
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CouponNotificationDetail;
