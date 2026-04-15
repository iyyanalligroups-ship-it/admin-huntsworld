import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

// Fallback loader
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] text-sm text-gray-500">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
    Loading...
  </div>
);

// Helper to wrap lazy components in Suspense boundary
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Lazy loaded components
const Dashboard = lazy(() => import("./pages/dashboard/dashboard"));
const Profile = lazy(() => import("./pages/profile/Profile"));
const Users = lazy(() => import("./pages/users/Users"));
const MerchantList = lazy(() => import("./pages/merchants/MerchantList"));
const MerchantProducts = lazy(() => import("./pages/merchants/MerchantProducts"));
const ServiceProviderList = lazy(() => import("./pages/service-provider/ServiceProvider"));
const Vehicles = lazy(() => import("./pages/service-provider/ServiceProviderVehicle"));
const StudentList = lazy(() => import("./pages/student/StudentList"));
const PaidSubcriptions = lazy(() => import("./pages/payments/PaidSubscriptions/PaidSubcriptions"));
const PaidRedeem = lazy(() => import("./pages/payments/PaidRedeemCoupons"));
const PlansBanner = lazy(() => import("./pages/plans/Banners"));
const PlansEbook = lazy(() => import("./pages/plans/EBook"));
const PlanSubcriptions = lazy(() => import("./pages/plans/Subcriptions"));
const MainCategories = lazy(() => import("./pages/categories/MainCategory"));
const SubCategories = lazy(() => import("./pages/categories/SubCategory"));
const SuperSubCategories = lazy(() => import("./pages/categories/SuperSubCategory"));
const DeepSubCategories = lazy(() => import("./pages/categories/DeepSubCategory"));
const Products = lazy(() => import("./pages/categories/Products"));
const GrocerySellerList = lazy(() => import("./pages/grocery/GrocerySeller"));
const FAQ = lazy(() => import("./pages/others/FAQ"));
const Complaint = lazy(() => import("./pages/others/Complaint"));
const Testimonial = lazy(() => import("./pages/others/Testimonial"));
const SubAdminLists = lazy(() => import("./pages/subadmin/subadminLists"));
const Roles = lazy(() => import("./pages/subadmin/roles"));
const PostRequirementAdminPanel = lazy(() => import("./pages/others/PostRequirement"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Permission = lazy(() => import("./pages/settings/pages/permissions/Permission"));
const PermissionRequest = lazy(() => import("./pages/settings/pages/permissions/PermissionRequest"));
const ChatPage = lazy(() => import("./pages/chat/pages/ChatPage"));
const PaidEbooks = lazy(() => import("./pages/payments/PaidEbooks"));
const PaidBanner = lazy(() => import("./pages/payments/PaidBanner"));
const RedeemRequest = lazy(() => import("./pages/walletNotification/RedeemRequest"));
const CommonSubscriptionPlan = lazy(() => import("./pages/common-plan/CommonSubscriptionPlans"));
const TrustSealRequestsPage = lazy(() => import("./pages/plans/trust-seal/TrustSealRequestsPage"));
const UpgradePlanPage = lazy(() => import("./pages/payments/PaidSubscriptions/UpgradePlanPage"));
const CancelPlanPage = lazy(() => import("./pages/payments/PaidSubscriptions/CancelPlanPage"));
const TrendingPointsSubscription = lazy(() => import("./pages/payments/trendingPoint/TrendingPointsSubscription"));
const AdminTrustSealManagement = lazy(() => import("./pages/payments/trust-seal/AdminTrustSealManagement"));
const AccessRequests = lazy(() => import("./pages/edit-or-delete-access/SubAdminAccessRequests"));
const NewsAdmin = lazy(() => import("./pages/news/NewsAdmin"));
const BrandPages = lazy(() => import("./pages/brand/BrandsPage"));
const NotVerifiedProducts = lazy(() => import("./pages/categories/NotVerifiedProducts"));
const Contact = lazy(() => import("./pages/contact/contact"));
const AdminAccessManagement = lazy(() => import("./pages/settings/pages/subAdminAccess/AdminAccessManagement"));
const CouponNotificationsPage = lazy(() => import("./pages/globalNotifications/CouponNotificationsPage"));
const SubadminAccessRequestsPage = lazy(() => import("./pages/globalNotifications/SubadminAccessRequestsPage"));
const TrustSealRequestsNotificationpage = lazy(() => import("./pages/globalNotifications/TrustSealRequestsPage"));
const CouponNotificationDetail = lazy(() => import("./pages/globalNotifications/notificationDetailsPage/CouponNotificationDetail"));
const AccessRequestDetail = lazy(() => import("./pages/globalNotifications/notificationDetailsPage/AccessRequestDetail"));
const TrustSealRequestDetail = lazy(() => import("./pages/globalNotifications/notificationDetailsPage/TrustSealRequestDetail"));
const ComplaintNotificationsPage = lazy(() => import("./pages/globalNotifications/ComplaintNotificationsPage"));
const ComplaintNotificationDetail = lazy(() => import("./pages/globalNotifications/notificationDetailsPage/ComplaintNotificationDetail"));
const MerchantProgress = lazy(() => import("./pages/halfPercentageMerchant/MerchantProgress"));
const HelpRequestsPage = lazy(() => import("./pages/help/HelpRequest"));
const Reports = lazy(() => import("./pages/reports/ReportRequest"));
const BannerVerify = lazy(() => import("./pages/bannerVerify/BannerVerify"));
const OtherProducts = lazy(() => import("./pages/categories/OtherProducts"));
const AddCategories = lazy(() => import("./pages/categories/AddCategory"));
const TopCategoryList = lazy(() => import("./pages/categories/TopCategoryList"));
const AdminPaymentHistory = lazy(() => import("./pages/payment-history/PaymentHistory"));
const Upgrageplan = lazy(() => import("./pages/payments/PaidSubscriptions/UpgradePlan"));
const UserList = lazy(() => import("./pages/users/UserList"));
const TopListingPlan = lazy(() => import("./pages/toplisting/TopListingPlan"));
const Referral = lazy(() => import("./pages/referral/Referral"));
const MerchantSubscriptionManager = lazy(() => import("./pages/payments/PaidSubscriptions/MerchantSubscriptionManager"));
const SubscriptionExtensionHistory = lazy(() => import("./pages/payments/PaidSubscriptions/SubscriptionExtensionHistory"));
const AdminBannerPage = lazy(() => import("./pages/banner-list/AdminBannerPage"));
const BaseMemberTypeList = lazy(() => import("./pages/grocery/BaseMemberTypeList"));
const AllPaymentHistory = lazy(() => import("./pages/payment-history/AllPaymentHistory"));
const CompanyType = lazy(() => import("./pages/merchants/companyType/companyType"));
const UnmatchedLeads = lazy(() => import("./pages/others/UnmatchedLeads"));
const AdminTopListingPurchase = lazy(() => import("./pages/payments/toplisting/AdminTopListingPurchase"));

const AdminRoutes = () => {
  return (
    <Routes>
      <Route index element={withSuspense(Dashboard)} />
      <Route path="dashboard" element={withSuspense(Dashboard)} />
      <Route path="merchants/company-type" element={withSuspense(CompanyType)} />
      <Route path="profile" element={withSuspense(Profile)} />
      <Route path="common-users" element={withSuspense(Users)} />
      <Route path="all-users" element={withSuspense(UserList)} />
      <Route path="merchants" element={withSuspense(MerchantList)} />
      <Route path="merchants/products" element={withSuspense(MerchantProducts)} />
      <Route path="service-providers" element={withSuspense(ServiceProviderList)} />
      <Route path="service-providers/vehicles" element={withSuspense(Vehicles)} />
      <Route path="students" element={withSuspense(StudentList)} />
      <Route path="subadmin" element={withSuspense(SubAdminLists)} />
      <Route path="subadmin/roles" element={withSuspense(Roles)} />
      <Route path="basemember-type" element={withSuspense(BaseMemberTypeList)} />
      <Route path="payments/subscriptions" element={withSuspense(PaidSubcriptions)} />
      <Route path="payments/ebooks" element={withSuspense(PaidEbooks)} />
      <Route path="payments/banners" element={withSuspense(PaidBanner)} />
      <Route path="payments/coupons" element={withSuspense(PaidRedeem)} />
      <Route path="payments/upgrade" element={withSuspense(UpgradePlanPage)} />
      <Route path="payments/upgrade-plan" element={withSuspense(Upgrageplan)} />
      <Route path="payments/cancel" element={withSuspense(CancelPlanPage)} />
      <Route path="payments/trending-points" element={withSuspense(TrendingPointsSubscription)} />
      <Route path="payments/trust-seal" element={withSuspense(AdminTrustSealManagement)} />
      <Route path="payments/payment-history" element={withSuspense(AdminPaymentHistory)} />
      <Route path="payments/all-payment-history" element={withSuspense(AllPaymentHistory)} />
      <Route path="payments/top-listing" element={withSuspense(AdminTopListingPurchase)} />
      <Route path="plans/subscriptions" element={withSuspense(PlanSubcriptions)} />
      <Route path="plans/banners" element={withSuspense(PlansBanner)} />
      <Route path="plans/ebooks" element={withSuspense(PlansEbook)} />
      <Route path="plans/common-subscriptions" element={withSuspense(CommonSubscriptionPlan)} />
      <Route path="plans/top-listing-plan" element={withSuspense(TopListingPlan)} />
      <Route path="plans/merchant-subscription-manager" element={withSuspense(MerchantSubscriptionManager)} />
      <Route path="plans/subscription-extension-history" element={withSuspense(SubscriptionExtensionHistory)} />
      <Route path="categories/main" element={withSuspense(MainCategories)} />
      <Route path="categories/add-category" element={withSuspense(AddCategories)} />
      <Route path="categories/sub" element={withSuspense(SubCategories)} />
      <Route path="categories/super-sub" element={withSuspense(SuperSubCategories)} />
      <Route path="categories/deep-sub" element={withSuspense(DeepSubCategories)} />
      <Route path="categories/top-category" element={withSuspense(TopCategoryList)} />
      <Route path="products" element={withSuspense(Products)} />
      <Route path="not-verified-products" element={withSuspense(NotVerifiedProducts)} />
      <Route path="other-products" element={withSuspense(OtherProducts)} />
      <Route path="grocery-sellers" element={withSuspense(GrocerySellerList)} />
      <Route path="others/post-requirement" element={withSuspense(PostRequirementAdminPanel)} />
      <Route path="request/referral-requests" element={withSuspense(Referral)} />
      <Route path="others/faq" element={withSuspense(FAQ)} />
      <Route path="others/complaint" element={withSuspense(Complaint)} />
      <Route path="others/testimonial" element={withSuspense(Testimonial)} />
      <Route path="others/news" element={withSuspense(NewsAdmin)} />
      <Route path="others/brands" element={withSuspense(BrandPages)} />
      <Route path="others/contact" element={withSuspense(Contact)} />
      <Route path="others/admin-banners" element={withSuspense(AdminBannerPage)} />
      <Route path="others/unmatched-leads" element={withSuspense(UnmatchedLeads)} />
      <Route path="settings" element={withSuspense(Settings)} />
      <Route path="permissions" element={withSuspense(Permission)} />
      <Route path="permission-request" element={withSuspense(PermissionRequest)} />
      <Route path="access-requests" element={withSuspense(AccessRequests)} />
      <Route path="chat" element={withSuspense(ChatPage)} />
      <Route path="request/wallet" element={withSuspense(RedeemRequest)} />
      <Route path="request/banner-verify" element={withSuspense(BannerVerify)} />
      <Route path="help" element={withSuspense(HelpRequestsPage)} />
      <Route path="report" element={withSuspense(Reports)} />
      <Route path="request/trust-seal-requests/:requestId?" element={withSuspense(TrustSealRequestsPage)} />
      <Route path="request/sub-admin-access" element={withSuspense(AdminAccessManagement)} />
      <Route path="notifications/coupons" element={withSuspense(CouponNotificationsPage)} />
      <Route path="notifications/access-requests" element={<SubadminAccessRequestsPage isAdmin />} />
      <Route path="notifications/trust-seal" element={withSuspense(TrustSealRequestsNotificationpage)} />
      <Route path="notifications/complaints" element={withSuspense(ComplaintNotificationsPage)} />
      <Route path="notifications/complaints/:id" element={withSuspense(ComplaintNotificationDetail)} />
      <Route path="notifications/coupons/:id" element={withSuspense(CouponNotificationDetail)} />
      <Route path="notifications/access-requests/:id" element={<AccessRequestDetail isAdmin />} />
      <Route path="notifications/trust-seal/:id" element={withSuspense(TrustSealRequestDetail)} />
      <Route path="others/merchant-progress" element={withSuspense(MerchantProgress)} />
    </Routes>
  );
};

export default AdminRoutes;
