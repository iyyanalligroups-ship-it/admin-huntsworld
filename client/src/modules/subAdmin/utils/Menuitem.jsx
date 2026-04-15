const menuItems = [
  { title: "Dashboard", icon: "Gauge", link: "/sub-admin-dashboard" },
  {
    title: "Users",
    icon: "UsersThree",
    children: [
      {
        title: "Merchant",
        icon: "Storefront",
        children: [
          { title: "Merchant List", icon: "UserList", link: "/sub-admin-dashboard/merchants" },
          { title: "Merchant Product List", icon: "ShoppingCart", link: "/sub-admin-dashboard/merchants/products" },
          { title: "Company Name Type List", icon: "User", link: "/sub-admin-dashboard/merchants/company-type" },
        ],
      },
      // {
      //   title: "Service Provider",
      //   icon: "GearSix",
      //   children: [
      //     { title: "Service Provider List", icon: "UserList", link: "/sub-admin-dashboard/service-providers" },
      //     { title: "Vehicle List", icon: "Car", link: "/sub-admin-dashboard/service-providers/vehicles" },
      //   ],
      // },
      {
        title: "Base Members",
        icon: "ShoppingBag",
        children: [
          { title: "Base Members List", icon: "UserList", link: "/sub-admin-dashboard/grocery-sellers" },
          { title: "Base Member Type List", icon: "User", link: "/sub-admin-dashboard/basemember-type" },
        ],
      },
      {
        title: "Students",
        icon: "GraduationCap",
        children: [
          { title: "Students List", icon: "UserList", link: "/sub-admin-dashboard/students" },
        ],
      },
      {
        title: "Common Users",
        icon: "UsersThree",
        children: [
          { title: "Users List", icon: "UserList", link: "/sub-admin-dashboard/common-users" },
          { title: "All Users List", icon: "UserList", link: "/sub-admin-dashboard/all-users" },
        ],
      },
      {
        title: "Admin",
        icon: "User",
        children: [
          // { title: "Sub Admin", icon: "UserList", link: "/sub-admin-dashboard/subadmin" },
          { title: "Roles", icon: "Crown", link: "/sub-admin-dashboard/subadmin/roles" },
        ],
      },
    ],
  },
  {
    title: "Payments",
    icon: "CreditCard",
    children: [
      { title: "Paid Subscriptions", icon: "CurrencyDollar", link: "/sub-admin-dashboard/payments/subscriptions" },
      { title: "Paid E-Book", icon: "Book", link: "/sub-admin-dashboard/payments/ebooks" },
      { title: "Paid Banners", icon: "Image", link: "/sub-admin-dashboard/payments/banners" },
      { title: "Redeem Coupons", icon: "Ticket", link: "/sub-admin-dashboard/payments/coupons" },
      { title: "Trending Points", icon: "Coins", link: "/sub-admin-dashboard/payments/trending-points" },
      { title: "Trust Seal", icon: "ShieldCheck", link: "/sub-admin-dashboard/payments/trust-seal" },
      { title: "Search Payment History", icon: "Package", link: "/sub-admin-dashboard/payments/payment-history" },
      { title: "Payment History", icon: "Receipt", link: "/sub-admin-dashboard/payments/all-payment-history" },
    ],
  },
  {
    title: "Plans",
    icon: "Notepad",
    children: [
      { title: "Subscriptions", icon: "Calendar", link: "/sub-admin-dashboard/plans/subscriptions" },
      { title: "Merchant Subscriptions Discount", icon: "Calendar", link: "/sub-admin-dashboard/plans/merchant-subscription-manager" },
      { title: "Subscription Extension History", icon: "Calendar", link: "/sub-admin-dashboard/plans/subscription-extension-history" },
      { title: "Common Subscriptions", icon: "Crown", link: "/sub-admin-dashboard/plans/common-subscriptions" },
      { title: "Top Listing Plans", icon: "Crown", link: "/sub-admin-dashboard/plans/top-listing-plan" },
    ],
  },
  {
    title: "Products",
    icon: "ShoppingCart",
    children: [
      { title: "Verified", icon: "CheckCircle", link: "/sub-admin-dashboard/products" },
      { title: "Not verified", icon: "XCircle", link: "/sub-admin-dashboard/not-verified-products" },
      { title: "Others", icon: "Package", link: "/sub-admin-dashboard/other-products" },
    ],
  },
  {
    title: "Categories",
    icon: "SquaresFour",
    children: [
      { title: "Main Categories", icon: "Folder", link: "/sub-admin-dashboard/categories/main" },
      { title: "Sub Categories", icon: "FolderSimple", link: "/sub-admin-dashboard/categories/sub" },
      { title: "Super Sub Categories", icon: "Stack", link: "/sub-admin-dashboard/categories/super-sub" },
      { title: "Deep Sub Categories", icon: "ArchiveBox", link: "/sub-admin-dashboard/categories/deep-sub" },
      { title: "Add Categories", icon: "Package", link: "/sub-admin-dashboard/categories/add-category" },
      { title: "Top Categories", icon: "Package", link: "/sub-admin-dashboard/categories/top-category" },
    ],
  },
  {
    title: "Requests",
    icon: "Tray",
    children: [
      { title: "Redeem Wallet", icon: "Wallet", link: "/sub-admin-dashboard/request/wallet" }, // Changed from /admin/others/wallet
      { title: "Trust Seal", icon: "ShieldCheck", link: "/sub-admin-dashboard/request/trust-seal-requests" }, // Changed from /admin/plans/trust-seal-requests
      // { title: "Sub Admin Access", icon: "Stack", link: "/sub-admin-dashboard/request/sub-admin-access" }, // Changed from /admin/categories/super-sub
      { title: "Banner Verify", icon: "Stack", link: "/sub-admin-dashboard/request/banner-verify" }, // Changed from /admin/categories/super-sub
      { title: "Referral Requests", icon: "UserPlus", link: "/sub-admin-dashboard/request/referral-requests" },
    ],
  },

  {
    title: "Others",
    icon: "DotsThreeCircle",
    children: [
      { title: "Post By Requirement", icon: "NotePencil", link: "/sub-admin-dashboard/others/post-requirement" },
      { title: "Buyer & Seller FAQ", icon: "ShoppingCart", link: "/sub-admin-dashboard/others/faq" },
      { title: "Complaint", icon: "Warning", link: "/sub-admin-dashboard/others/complaint" },
      { title: "Testimonial", icon: "ChatText", link: "/sub-admin-dashboard/others/testimonial" },
      { title: "News", icon: "Newspaper", link: "/sub-admin-dashboard/others/news" },
      { title: "Brands", icon: "GoogleLogo", link: "/sub-admin-dashboard/others/brands" },
      { title: "Contact", icon: "Phone", link: "/sub-admin-dashboard/others/contact" },
      { title: "Merchant Progress", icon: "CircleNotch", link: "/sub-admin-dashboard/others/merchant-progress" }, // Changed from /admin/others/news
      { title: "Admin Banners", icon: "Image", link: "/sub-admin-dashboard/others/admin-banners" },
      { title: "Unmatched Leads", icon: "Tray", link: "/sub-admin-dashboard/others/unmatched-leads" },
    ],
  },
  { title: "Settings", icon: "Gear", link: "/sub-admin-dashboard/settings" },
];

export default menuItems;
