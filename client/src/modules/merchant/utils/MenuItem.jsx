const menuItems = [
  { title: "Dashboard", icon: "Gauge", link: "/merchant/dashboard" },

  {
    title: "Products",
    icon: "ShoppingCart",
    link: "/merchant/products"
  },
  {
    title: "Branches",
    icon: "MapPin",
    link: "/merchant/branches"
  },
  // {
  //   title: "SEA Requirement",
  //   icon: "ClipboardList",
  //   link: "/merchant/sea-requirement"
  // },
  {
    title: "Others",
    icon: "DotsThreeCircle",
    children: [
      { title: "Reviews", icon: "Star", link: "/merchant/reviews" },
      { title: "Queries", icon: "MessageSquare", link: "/merchant/queries" }
    ]
  },
  {
    title: "Wallet",
    icon: "Wallet",
    link: "/merchant/wallet"
  },
  {
    title: "Settings",
    icon: "Gear",
    link: "/merchant/settings"
  },
  {
    title: "Plans",
    icon: "Notepad",
    children: [
      { title: "Plan Subscription", icon: "Calendar", link: "/merchant/plans/subscription" },
      { title: "Banner", icon: "Image", link: "/merchant/plans/banner" },
      { title: "Trending", icon: "Flame", link: "/merchant/plans/trending" },
      { title: "Trust Seal", icon: "Seal", link: "/merchant/plans/trust-seal" },
      { title: "E-Book", icon: "BookOpen", link: "/merchant/plans/e-book" }
    ]
  }
];

export default menuItems;
