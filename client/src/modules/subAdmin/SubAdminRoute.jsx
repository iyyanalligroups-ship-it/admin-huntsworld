import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import SubAdminLayout from "./SubAdminLayout";

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
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
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
const PostRequirement = lazy(() => import("./pages/others/PostRequirement"));
const FAQ = lazy(() => import("./pages/others/FAQ"));
const Complaint = lazy(() => import("./pages/others/Complaint"));
const Testimonial = lazy(() => import("./pages/others/Testimonial"));
const SubAdminLists = lazy(() => import("./pages/subadmin/subadminLists"));
const Roles = lazy(() => import("./pages/subadmin/roles"));
const PostRequirementAdminPanel = lazy(() => import("./pages/others/PostRequirement"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Permission = lazy(() => import("./pages/settings/pages/permissions/Permission"));
const PermissionRequest = lazy(() => import("./pages/settings/pages/permissions/PermissionRequest"));
const ChatPage = lazy(() => import("@/modules/admin/pages/chat/pages/ChatPage"));
const PaidEbooks = lazy(() => import("./pages/payments/PaidEbooks"));
const PaidBanner = lazy(() => import("./pages/payments/PaidBanner"));
const RedeemRequest = lazy(() => import("./pages/walletNotification/RedeemRequest"));
const CommonSubscriptionPlan = lazy(() => import("./pages/common-plan/CommonSubscriptionPlans"));
const TrustSealRequestsPage = lazy(() => import("./pages/plans/trust-seal/TrustSealRequestsPage"));
const NotVerifiedProducts = lazy(() => import("./pages/categories/NotVerifiedProducts"));
const AdminTrendingPointsManagement = lazy(() => import("./pages/payments/trendingPoint/TrendingPointsSubscription"));
const AdminTrustSealManagement = lazy(() => import("./pages/payments/trust-seal/AdminTrustSealManagement"));
const NewsAdmin = lazy(() => import("./pages/news/NewsAdmin"));
const AdminBrands = lazy(() => import("./pages/brand/BrandsPage"));
const Contact = lazy(() => import("./pages/contact/contact"));
const AddCategories = lazy(() => import("./pages/categories/AddCategory"));
const OthersProductsTable = lazy(() => import("./pages/categories/OtherProducts"));
const MerchantProgress = lazy(() => import("./pages/halfPercentageMerchant/MerchantProgress"));
const BannerVerify = lazy(() => import("./pages/bannerVerify/BannerVerify"));
const AdminPaymentHistory = lazy(() => import("./pages/payment-history/PaymentHistory"));
const UpgradePlanPage = lazy(() => import("./pages/payments/PaidSubscriptions/UpgradePlanPage"));
const CancelPlanPage = lazy(() => import("./pages/payments/PaidSubscriptions/CancelPlanPage"));
const Upgrageplan = lazy(() => import("./pages/payments/PaidSubscriptions/UpgradePlan"));
const UserList = lazy(() => import("./pages/users/UserList"));
const TopCategoryList = lazy(() => import("./pages/categories/TopCategoryList"));
const Referral = lazy(() => import("./pages/referral/Referral"));
const HelpRequests = lazy(() => import("./pages/help/HelpRequest"));
const Reports = lazy(() => import("./pages/reports/ReportRequest"));

const CouponNotificationsPage = lazy(() => import("../admin/pages/globalNotifications/CouponNotificationsPage"));
const SubadminAccessRequestsPage = lazy(() => import("../admin/pages/globalNotifications/SubadminAccessRequestsPage"));
const TrustSealRequestsNotificationpage = lazy(() => import("../admin/pages/globalNotifications/TrustSealRequestsPage"));
const ComplaintNotificationsPage = lazy(() => import("../admin/pages/globalNotifications/ComplaintNotificationsPage"));
const CouponNotificationDetail = lazy(() => import("../admin/pages/globalNotifications/notificationDetailsPage/CouponNotificationDetail"));
const AccessRequestDetail = lazy(() => import("../admin/pages/globalNotifications/notificationDetailsPage/AccessRequestDetail"));
const TrustSealRequestDetail = lazy(() => import("../admin/pages/globalNotifications/notificationDetailsPage/TrustSealRequestDetail"));
const ComplaintNotificationDetail = lazy(() => import("../admin/pages/globalNotifications/notificationDetailsPage/ComplaintNotificationDetail"));
const AdminBannerPage = lazy(() => import("./pages/banner-list/AdminBannerPage"));
const TopListingPlan = lazy(() => import("./pages/toplisting/TopListingPlan"));
const MerchantSubscriptionManager = lazy(() => import("./pages/payments/PaidSubscriptions/MerchantSubscriptionManager"));
const SubscriptionExtensionHistory = lazy(() => import("./pages/payments/PaidSubscriptions/SubscriptionExtensionHistory"));
const AllPaymentHistory = lazy(() => import("./pages/payment-history/AllPaymentHistory"));
const BaseMemberTypeList = lazy(() => import("./pages/grocery/BaseMemberTypeList"));
const CompanyType = lazy(() => import("./pages/merchants/companyType/companyType"));
const UnmatchedLeads = lazy(() => import("../admin/pages/others/UnmatchedLeads"));

const SubAdminRoute = () => {
  return (
    <Routes>
      <Route element={<SubAdminLayout />}>
        <Route index element={withSuspense(Dashboard)} />
        <Route path="dashboard" element={withSuspense(Dashboard)} />
        <Route path="profile" element={withSuspense(Profile)} />
        <Route path="common-users" element={withSuspense(Users)} />
        <Route path="all-users" element={withSuspense(UserList)} />
        <Route path="merchants/company-type" element={withSuspense(CompanyType)} />
        <Route path="merchants" element={withSuspense(MerchantList)} />
        <Route path="merchants/products" element={withSuspense(MerchantProducts)} />
        <Route path="service-providers" element={withSuspense(ServiceProviderList)} />
        <Route path="service-providers/vehicles" element={withSuspense(Vehicles)} />
        <Route path="students" element={withSuspense(StudentList)} />
        <Route path="subadmin" element={withSuspense(SubAdminLists)} />
        <Route path="subadmin/roles" element={withSuspense(Roles)} />
        <Route path="payments/subscriptions" element={withSuspense(PaidSubcriptions)} />
        <Route path="payments/ebooks" element={withSuspense(PaidEbooks)} />
        <Route path="payments/banners" element={withSuspense(PaidBanner)} />
        <Route path="payments/coupons" element={withSuspense(PaidRedeem)} />
        <Route path="payments/trending-points" element={withSuspense(AdminTrendingPointsManagement)} />
        <Route path="payments/trust-seal" element={withSuspense(AdminTrustSealManagement)} />
        <Route path="payments/payment-history" element={withSuspense(AdminPaymentHistory)} />
        <Route path="payments/all-payment-history" element={withSuspense(AllPaymentHistory)} />
        <Route path="payments/upgrade" element={withSuspense(UpgradePlanPage)} />
        <Route path="payments/upgrade-plan" element={withSuspense(Upgrageplan)} />
        <Route path="payments/cancel" element={withSuspense(CancelPlanPage)} />
        <Route path="plans/subscriptions" element={withSuspense(PlanSubcriptions)} />
        <Route path="plans/banners" element={withSuspense(PlansBanner)} />
        <Route path="plans/ebooks" element={withSuspense(PlansEbook)} />
        <Route path="plans/trust-seal-requests/:requestId?" element={withSuspense(TrustSealRequestsPage)} />
        <Route path="plans/common-subscriptions" element={withSuspense(CommonSubscriptionPlan)} />
        <Route path="plans/top-listing-plan" element={withSuspense(TopListingPlan)} />
        <Route path="plans/merchant-subscription-manager" element={withSuspense(MerchantSubscriptionManager)} />
        <Route path="plans/subscription-extension-history" element={withSuspense(SubscriptionExtensionHistory)} />
        <Route path="categories/main" element={withSuspense(MainCategories)} />
        <Route path="other-products" element={withSuspense(OthersProductsTable)} />
        <Route path="categories/sub" element={withSuspense(SubCategories)} />
        <Route path="categories/super-sub" element={withSuspense(SuperSubCategories)} />
        <Route path="categories/deep-sub" element={withSuspense(DeepSubCategories)} />
        <Route path="categories/add-category" element={withSuspense(AddCategories)} />
        <Route path="categories/top-category" element={withSuspense(TopCategoryList)} />
        <Route path="products" element={withSuspense(Products)} />
        <Route path="request/referral-requests" element={withSuspense(Referral)} />
        <Route path="not-verified-products" element={withSuspense(NotVerifiedProducts)} />
        <Route path="grocery-sellers" element={withSuspense(GrocerySellerList)} />
        <Route path="basemember-type" element={withSuspense(BaseMemberTypeList)} />
        <Route path="others/post-requirement" element={withSuspense(PostRequirementAdminPanel)} />
        <Route path="others/faq" element={withSuspense(FAQ)} />
        <Route path="others/complaint" element={withSuspense(Complaint)} />
        <Route path="others/testimonial" element={withSuspense(Testimonial)} />
        <Route path="request/wallet" element={withSuspense(RedeemRequest)} />
        <Route path="others/news" element={withSuspense(NewsAdmin)} />
        <Route path="others/brands" element={withSuspense(AdminBrands)} />
        <Route path="others/contact" element={withSuspense(Contact)} />
        <Route path="settings" element={withSuspense(Settings)} />
        <Route path="permissions" element={withSuspense(Permission)} />
        <Route path="permission-request" element={withSuspense(PermissionRequest)} />
        <Route path="chat" element={withSuspense(ChatPage)} />
        <Route path="others/merchant-progress" element={withSuspense(MerchantProgress)} />
        <Route path="request/trust-seal-requests/:requestId?" element={withSuspense(TrustSealRequestsPage)} />
        <Route path="request/banner-verify" element={withSuspense(BannerVerify)} />
        <Route path="help" element={withSuspense(HelpRequests)} />
        <Route path="report" element={withSuspense(Reports)} />
        <Route path="notifications/coupons" element={withSuspense(CouponNotificationsPage)} />
        {/* Pass props manually wrapped in our HOC via wrapper component pattern */}
        <Route path="notifications/access-requests" element={<Suspense fallback={<PageLoader />}> <SubadminAccessRequestsPage isAdmin={false} /> </Suspense>} />
        <Route path="notifications/trust-seal" element={withSuspense(TrustSealRequestsNotificationpage)} />
        <Route path="notifications/complaints" element={withSuspense(ComplaintNotificationsPage)} />
        <Route path="notifications/complaints/:id" element={withSuspense(ComplaintNotificationDetail)} />
        <Route path="notifications/coupons/:id" element={withSuspense(CouponNotificationDetail)} />
        <Route path="notifications/access-requests/:id" element={<Suspense fallback={<PageLoader />}> <AccessRequestDetail isAdmin={false} /> </Suspense>} />
        <Route path="notifications/trust-seal/:id" element={withSuspense(TrustSealRequestDetail)} />
        <Route path="others/admin-banners" element={withSuspense(AdminBannerPage)} />
        <Route path="others/unmatched-leads" element={withSuspense(UnmatchedLeads)} />
      </Route>
    </Routes>
  );
};

export default SubAdminRoute;
