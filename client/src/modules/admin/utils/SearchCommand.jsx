import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Gauge,
  Users,
  User,
  Store,
  ShoppingCart,
  GraduationCap,
  CreditCard,
  Calendar,
  Crown,
  CheckCircle,
  XCircle,
  Package,
  Layers,
  Folder,
  FolderOpen,
  Archive,
  Wallet,
  ShieldCheck,
  Image as ImageIcon,
  Newspaper,
  Phone,
  Settings,
  Search,
  Ticket,
  Coins,
  Receipt,
  BookOpen,
  UserPlus,
  MoreHorizontal,
  Pencil,
  HelpCircle,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';

const searchableRoutes = [
  {
    category: 'Dashboard',
    items: [
      { name: 'Dashboard', path: '/admin-dashboard', icon: <Gauge size={18} /> },
      { name: 'Settings', path: '/admin-dashboard/settings', icon: <Settings size={18} /> },
    ],
  },
  {
    category: 'Users',
    items: [
      { name: 'Merchant List', path: '/admin-dashboard/merchants', icon: <Store size={18} /> },
      { name: 'Merchant Product List', path: '/admin-dashboard/merchants/products', icon: <ShoppingCart size={18} /> },
      { name: 'Company Name Type List', path: '/admin-dashboard/merchants/company-type', icon: <User size={18} /> },

      { name: 'Base Members List', path: '/admin-dashboard/grocery-sellers', icon: <Users size={18} /> },
      { name: 'Base Member Type List', path: '/admin-dashboard/basemember-type', icon: <User size={18} /> },

      { name: 'Students List', path: '/admin-dashboard/students', icon: <GraduationCap size={18} /> },

      { name: 'Common Users List', path: '/admin-dashboard/common-users', icon: <Users size={18} /> },
      { name: 'All Users List', path: '/admin-dashboard/all-users', icon: <Users size={18} /> },

      { name: 'Sub Admin', path: '/admin-dashboard/subadmin', icon: <User size={18} /> },
      { name: 'Roles', path: '/admin-dashboard/subadmin/roles', icon: <Crown size={18} /> },
    ],
  },
  {
    category: 'Payments',
    items: [
      { name: 'Paid Subscriptions', path: '/admin-dashboard/payments/subscriptions', icon: <CreditCard size={18} /> },
      { name: 'Paid E-Book', path: '/admin-dashboard/payments/ebooks', icon: <BookOpen size={18} /> },
      { name: 'Paid Banners', path: '/admin-dashboard/payments/banners', icon: <ImageIcon size={18} /> },
      { name: 'Redeem Coupons', path: '/admin-dashboard/payments/coupons', icon: <Ticket size={18} /> },
      { name: 'Trending Points', path: '/admin-dashboard/payments/trending-points', icon: <Coins size={18} /> },
      { name: 'Trust Seal Payments', path: '/admin-dashboard/payments/trust-seal', icon: <ShieldCheck size={18} /> },
      { name: 'Search Payment History', path: '/admin-dashboard/payments/payment-history', icon: <Package size={18} /> },
      { name: 'All Payment History', path: '/admin-dashboard/payments/all-payment-history', icon: <Receipt size={18} /> },
    ],
  },
  {
    category: 'Plans',
    items: [
      { name: 'Subscriptions', path: '/admin-dashboard/plans/subscriptions', icon: <Calendar size={18} /> },
      { name: 'Merchant Subscriptions Discount', path: '/admin-dashboard/plans/merchant-subscription-manager', icon: <Calendar size={18} /> },
      { name: 'Subscription Extension History', path: '/admin-dashboard/plans/subscription-extension-history', icon: <Calendar size={18} /> },
      { name: 'Common Subscriptions', path: '/admin-dashboard/plans/common-subscriptions', icon: <Crown size={18} /> },
      { name: 'Top Listing Plans', path: '/admin-dashboard/plans/top-listing-plan', icon: <Crown size={18} /> },
    ],
  },
  {
    category: 'Products',
    items: [
      { name: 'Verified Products', path: '/admin-dashboard/products', icon: <CheckCircle size={18} /> },
      { name: 'Not Verified Products', path: '/admin-dashboard/not-verified-products', icon: <XCircle size={18} /> },
      { name: 'Other Products', path: '/admin-dashboard/other-products', icon: <Package size={18} /> },
    ],
  },
  {
    category: 'Categories',
    items: [
      { name: 'Main Categories', path: '/admin-dashboard/categories/main', icon: <Folder size={18} /> },
      { name: 'Sub Categories', path: '/admin-dashboard/categories/sub', icon: <FolderOpen size={18} /> },
      { name: 'Super Sub Categories', path: '/admin-dashboard/categories/super-sub', icon: <Layers size={18} /> },
      { name: 'Deep Sub Categories', path: '/admin-dashboard/categories/deep-sub', icon: <Archive size={18} /> },
      { name: 'Add Categories', path: '/admin-dashboard/categories/add-category', icon: <Layers size={18} /> },
      { name: 'Top Categories', path: '/admin-dashboard/categories/top-category', icon: <Layers size={18} /> },
    ],
  },
  {
    category: 'Requests',
    items: [
      { name: 'Redeem Wallet Requests', path: '/admin-dashboard/request/wallet', icon: <Wallet size={18} /> },
      { name: 'Trust Seal Requests', path: '/admin-dashboard/request/trust-seal-requests', icon: <ShieldCheck size={18} /> },
      { name: 'Sub Admin Access Requests', path: '/admin-dashboard/request/sub-admin-access', icon: <UserPlus size={18} /> },
      { name: 'Banner Verify Requests', path: '/admin-dashboard/request/banner-verify', icon: <ImageIcon size={18} /> },
      { name: 'Referral Requests', path: '/admin-dashboard/request/referral-requests', icon: <UserPlus size={18} /> },
    ],
  },
  {
    category: 'Others',
    items: [
      { name: 'Post By Requirement', path: '/admin-dashboard/others/post-requirement', icon: <Pencil size={18} /> },
      { name: 'FAQ', path: '/admin-dashboard/others/faq', icon: <HelpCircle size={18} /> },
      { name: 'Complaint', path: '/admin-dashboard/others/complaint', icon: <AlertTriangle size={18} /> },
      { name: 'Testimonial', path: '/admin-dashboard/others/testimonial', icon: <MessageCircle size={18} /> },
      { name: 'News', path: '/admin-dashboard/others/news', icon: <Newspaper size={18} /> },
      { name: 'Brands', path: '/admin-dashboard/others/brands', icon: <Store size={18} /> },
      { name: 'Contact', path: '/admin-dashboard/others/contact', icon: <Phone size={18} /> },
      { name: 'Merchant Progress', path: '/admin-dashboard/others/merchant-progress', icon: <Gauge size={18} /> },
      { name: 'Admin Banners', path: '/admin-dashboard/others/admin-banners', icon: <ImageIcon size={18} /> },
    ],
  },
];

const SearchCommand = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between cursor-pointer space-x-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline-flex text-sm text-muted-foreground">Search...</span>
        </div>

        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {searchableRoutes.map((group) => (
              <React.Fragment key={group.category}>
                <CommandGroup heading={group.category}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.path}
                      onSelect={() => handleSelect(item.path)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default SearchCommand;
