const menuItems = [
  { title: "Dashboard", icon: "Gauge", link: "/admin-dashboard" }, // Changed from /admin/dashboard
  {
    title: "Users",
    icon: "UsersThree",
    children: [
      {
        title: "Merchant",
        icon: "Storefront",
        children: [
          { title: "Merchant List", icon: "UserList", link: "/admin-dashboard/merchants" }, // Changed from /admin/merchants
          { title: "Merchant Product List", icon: "ShoppingCart", link: "/admin-dashboard/merchants/products" }, // Changed from /admin/merchants/products
          { title: "Company Name Type List", icon: "User", link: "/admin-dashboard/merchants/company-type" }, // Changed from /admin/grocery-sellers

        ],
      },
      {
        title: "Base Members",
        icon: "ShoppingBag",
        children: [
          { title: "Base Members List", icon: "UserList", link: "/admin-dashboard/grocery-sellers" }, // Changed from /admin/grocery-sellers
          { title: "Base Member Type List", icon: "User", link: "/admin-dashboard/basemember-type" }, // Changed from /admin/grocery-sellers
        ],
      },
      {
        title: "Students",
        icon: "GraduationCap",
        children: [
          { title: "Students List", icon: "UserList", link: "/admin-dashboard/students" }, // Changed from /admin/students
        ],
      },
      {
        title: "Common Users",
        icon: "UsersThree",
        children: [
          { title: "Users List", icon: "UserList", link: "/admin-dashboard/common-users" }, // Changed from /admin/common-users
          { title: "All User List", icon: "UserList", link: "/admin-dashboard/all-users" }, // Changed from /admin/common-users
        ],
      },
      {
        title: "Admin",
        icon: "User",
        children: [
          { title: "Sub Admin", icon: "UserList", link: "/admin-dashboard/subadmin" }, // Changed from /admin/subadmin
          { title: "Roles", icon: "Crown", link: "/admin-dashboard/subadmin/roles" }, // Changed from /admin/subadmin/roles
        ],
      },
    ],
  },
  {
    title: "Payments",
    icon: "CreditCard",
    children: [
      { title: "Paid Subscriptions", icon: "CurrencyDollar", link: "/admin-dashboard/payments/subscriptions" }, // Changed from /admin/payments/subscriptions
      { title: "Paid E-Book", icon: "Book", link: "/admin-dashboard/payments/ebooks" }, // Changed from /admin/payments/ebooks
      { title: "Paid Banners", icon: "Image", link: "/admin-dashboard/payments/banners" }, // Changed from /admin/payments/banners
      { title: "Redeem Coupons", icon: "Ticket", link: "/admin-dashboard/payments/coupons" }, // Changed from /admin/payments/coupons
      { title: "Trending Points", icon: "Coins", link: "/admin-dashboard/payments/trending-points" }, // Changed from /admin/payments/trending-points
      { title: "Trust Seal", icon: "ShieldCheck", link: "/admin-dashboard/payments/trust-seal" },
      { title: "Top Listing", icon: "Crown", link: "/admin-dashboard/payments/top-listing" },
      { title: "Search Payment History", icon: "Package", link: "/admin-dashboard/payments/payment-history" }, // Changed from /admin/payments/trust-seal
      { title: "Payment History", icon: "Receipt", link: "/admin-dashboard/payments/all-payment-history" }, // Changed from /admin/payments/trust-seal

    ],
  },
  {
    title: "Plans",
    icon: "Notepad",
    children: [
      { title: "Subscriptions", icon: "Calendar", link: "/admin-dashboard/plans/subscriptions" }, // Changed from /admin/plans/subscriptions
      { title: "Merchant Subscriptions Discount", icon: "Calendar", link: "/admin-dashboard/plans/merchant-subscription-manager" }, // Changed from /admin/plans/subscriptions
      { title: "Subscription Extension History", icon: "Calendar", link: "/admin-dashboard/plans/subscription-extension-history" }, // Changed from /admin/plans/subscriptions
      { title: "Common Subscriptions", icon: "Crown", link: "/admin-dashboard/plans/common-subscriptions" }, // Changed from /admin/plans/common-subscriptions
      { title: "Top Listing Plans", icon: "Crown", link: "/admin-dashboard/plans/top-listing-plan" }, // Changed from /admin/plans/common-subscriptions
    ],
  },
  {
    title: "Products",
    icon: "ShoppingCart",
    children: [
      { title: "Verified", icon: "CheckCircle", link: "/admin-dashboard/products" }, // Changed from /admin/plans/subscriptions
      { title: "Not verified", icon: "XCircle", link: "/admin-dashboard/not-verified-products" },
      { title: "Others", icon: "Package", link: "/admin-dashboard/other-products" },
    ],
  },
  {
    title: "Categories",
    icon: "SquaresFour",
    children: [
      { title: "Main Categories", icon: "Folder", link: "/admin-dashboard/categories/main" }, // Changed from /admin/categories/main
      { title: "Sub Categories", icon: "FolderSimple", link: "/admin-dashboard/categories/sub" }, // Changed from /admin/categories/sub
      { title: "Super Sub Categories", icon: "Stack", link: "/admin-dashboard/categories/super-sub" }, // Changed from /admin/categories/super-sub
      { title: "Deep Sub Categories", icon: "ArchiveBox", link: "/admin-dashboard/categories/deep-sub" }, // Changed from /admin/categories/deep-sub
      { title: "Add Categories", icon: "Package", link: "/admin-dashboard/categories/add-category" },
      { title: "Top Categories", icon: "Package", link: "/admin-dashboard/categories/top-category" },
    ],
  },
  {
    title: "Requests",
    icon: "Tray",
    children: [
      { title: "Redeem Wallet", icon: "Wallet", link: "/admin-dashboard/request/wallet" }, // Changed from /admin/others/wallet
      { title: "Trust Seal", icon: "ShieldCheck", link: "/admin-dashboard/request/trust-seal-requests" }, // Changed from /admin/plans/trust-seal-requests
      { title: "Sub Admin Access", icon: "Stack", link: "/admin-dashboard/request/sub-admin-access" }, // Changed from /admin/categories/super-sub
      { title: "Banner Verify", icon: "Stack", link: "/admin-dashboard/request/banner-verify" }, // Changed from /admin/categories/super-sub
      { title: "Referral Requests", icon: "UserPlus", link: "/admin-dashboard/request/referral-requests" },

    ],
  },
  {
    title: "Others",
    icon: "DotsThreeCircle",
    children: [
      { title: "Post By Requirement", icon: "NotePencil", link: "/admin-dashboard/others/post-requirement" }, // Changed from /admin/others/post-requirement
      { title: "FAQ", icon: "ShoppingCart", link: "/admin-dashboard/others/faq" }, // Changed from /admin/others/faq
      { title: "Complaint", icon: "Warning", link: "/admin-dashboard/others/complaint" }, // Changed from /admin/others/complaint
      { title: "Testimonial", icon: "ChatCircleText", link: "/admin-dashboard/others/testimonial" }, // Changed from /admin/others/testimonial
      { title: "News", icon: "Newspaper", link: "/admin-dashboard/others/news" }, // Changed from /admin/others/news
      { title: "Brands", icon: "GoogleLogo", link: "/admin-dashboard/others/brands" }, // Changed from /admin/others/news
      { title: "contact", icon: "Phone", link: "/admin-dashboard/others/contact" }, // Changed from /admin/others/news
      { title: "Merchant Progress", icon: "CircleNotch", link: "/admin-dashboard/others/merchant-progress" }, // Changed from /admin/others/news
      { title: "Admin Banners", icon: "Image", link: "/admin-dashboard/others/admin-banners" }, // Changed from /admin/others/news
      { title: "Unmatched Leads", icon: "Tray", link: "/admin-dashboard/others/unmatched-leads" },
    ],
  },
  { title: "Settings", icon: "Gear", link: "/admin-dashboard/settings" }, // Changed from /admin/settings
];

export default menuItems;
