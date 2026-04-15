import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PhoneCall,
  ChevronDown,
  LogIn,
  UserPlus,
  UserCircle,
  Search,
  Mic,
  Eye,
  LogOut,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  CircleHelp,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import * as Icons from "phosphor-react";
import * as LucideIcons from "lucide-react";
import { useGetViewPointsByUserQuery } from "@/redux/api/ViewPointApi";
import logo from "@/assets/images/logo.png";
import { Input } from "@/components/ui/input";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import studentMenuItems from "@/modules/student/utils/MenuItem";
import userMenuItems from "@/modules/commonUser/utils/MenuItem";
import { motion } from "framer-motion";
import { useGetInProgressNewsQuery } from "@/redux/api/NewsApi";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";

const Header = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("products");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { setSelectedUser } = useSelectedUser();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { data: news = [], isLoading } = useGetInProgressNewsQuery();

  const { data } = useGetViewPointsByUserQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });

  useEffect(() => {
    if (user?.user?.role?.role) {
      const role = user.user.role.role;
      const dashboardRoutes = {
        ADMIN: "/admin",
        SUB_ADMIN: "/subAdmin",
      };
      if (dashboardRoutes[role]) {
        navigate(dashboardRoutes[role]);
      }
    }
  }, [user, navigate]);

  const points = data?.data?.view_points || 0;

  const handleNavigate = (type) => {
    navigate(type === "login" ? "/login" : "/register");
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setSelectedUser(null); // Clear selected user on logout
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleHomeScreen = () => {
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user?.user?.role?.role) return null;
    const roleRoutes = {
      ADMIN: "/admin",
      MERCHANT: "/merchant",
      SERVICE_PROVIDER: "/service",
      SUB_DEALER: "/sub-dealer-dashboard",
      GROCERY_SELLER: "/grocerySeller",
      STUDENT: "/student",
      USER: "/user",
      SUB_ADMIN: "/subAdmin",
    };
    return roleRoutes[user.user.role.role] || null;
  };

  const placeholderText = {
    products: "Search for products / services...",
    suppliers: "Search for suppliers...",
    buyers: "Search for buyers...",
  };

  return (
    <header className="flex flex-col">
      <div className="text-white bg-white p-1 flex justify-around items-center sticky top-0 z-50">
        {/* Left: Welcome User / Login & Join Free */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="text-[#e03733]">
                  <AvatarImage src={user.avatar || "https://via.placeholder.com/40"} alt="User" />
                  <AvatarFallback>
                    <UserCircle className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-black">Welcome, {user?.user?.name || "User"}</span>
                <ChevronDown className="w-4 h-4" />
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4 text-[#e03733]" />
                  <span>{points} Views</span>
                </div>
              </div>
              <div className="absolute left-0 mt-2 bg-white text-black shadow-md w-60 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-200 space-y-1 max-h-96 overflow-y-auto">
                {["STUDENT", "USER"].includes(user?.user?.role?.role) ? (
                  <>
                    {(user?.user?.role?.role === "STUDENT" ? studentMenuItems : userMenuItems).map(
                      (item, index) => {
                        const IconComponent = Icons[item.icon] || LucideIcons.CircleHelp;
                        return (
                          <motion.div
                            key={index}
                            initial={{ x: 0 }}
                            whileHover={{ x: 8 }}
                            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                          >
                            <Link
                              to={item.link}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                            >
                              <IconComponent size={18} className="text-gray-600" />
                              <span>{item.title}</span>
                            </Link>
                          </motion.div>
                        );
                      }
                    )}
                  </>
                ) : (
                  <motion.div
                    whileHover={{ x: 8 }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                  >
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                    >
                      <Icons.Gauge size={18} className="text-gray-600" />
                      <span>Dashboard</span>
                    </Link>
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ x: 8 }}
                  transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                >
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 border-t border-gray-200"
                    onClick={handleLogout}
                  >
                    <Icons.SignOut size={18} className="text-gray-600" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              </div>
            </div>
          ) : (
            <>
              <Button
                className="bg-[#e03733] hover:shadow-lg hover:bg-[#e03633da] text-white py-2 rounded-md"
                onClick={() => handleNavigate("login")}
              >
                <LogIn className="w-4 h-4 mr-1" /> Login
              </Button>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1"
                onClick={() => handleNavigate("register")}
              >
                <UserPlus className="w-4 h-4 mr-1" /> Join Free
              </Button>
            </>
          )}
        </div>

        {/* Center: Phone Numbers */}
        <div className="hidden lg:flex items-center gap-2 text-center">
          <PhoneCall className="w-5 h-5 text-yellow-400" />
          <p className="text-sm text-[#1C1B1F]">+1 234 567 8900 | +1 987 654 3210</p>
        </div>

        {/* Right: Hover Dropdown Menus and Hamburger for Mobile/Tablet */}
        <div className="flex items-center">
          <Button
            variant="outline"
            className="lg:hidden p-2 text-black"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
          <div className="hidden lg:flex items-center mt-2 gap-6 text-[#1C1B1F]">
            {user?.user?.role?.role === "USER" && (
              <Dropdown
                title="For Buyer"
                options={[
                  { label: "Post buy Requirement", path: "post-requirement", icon: "ShoppingCart" },
                  { label: "Browse Suppliers", path: "all-categories", icon: "BookOpen" },
                  { label: "Manufactures Directory", path: "", icon: "ShieldCheck" },
                  { label: "Country Suppliers", path: "all-country", icon: "Headset" },
                  { label: "Buyer FAQs", path: "buyer-faq", icon: "HelpCircle" },
                ]}
              />
            )}
            {(user?.user?.role?.role === "MERCHANT" ||
              user?.user?.role?.role === "SERVICE_PROVIDER") && (
              <Dropdown
                title="For Seller"
                options={[
                  { label: "Sell your Products", path: "register", icon: "Store" },
                  { label: "Seller FAQ", path: "seller-faq", icon: "Book" },
                ]}
              />
            )}
            <Dropdown title="News">
              <div className="w-80 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 font-semibold border-b border-gray-200">
                  In Progress News
                </div>
                {isLoading ? (
                  <div className="flex justify-center py-2 text-gray-600">Loading...</div>
                ) : Array.isArray(news) && news.length > 0 ? (
                  news.map((item, index) => (
                    <div key={item._id || index} className="flex flex-col items-start px-4 py-2">
                      <span className="font-semibold text-sm">{item.title}</span>
                      <span className="text-xs text-gray-600">{item.description}</span>
                      <span className="text-xs text-gray-500">
                        Start: {new Date(item.startDate).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        End: {new Date(item.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center py-2 text-gray-600">No in progress news</div>
                )}
              </div>
            </Dropdown>
            <Dropdown
              title="Help"
              options={[
                { label: "Send Feedback", path: "feedback", icon: "MessageSquare" },
                { label: "Send Complaint", path: "complaint", icon: "AlertTriangle" },
                { label: "Advertise with us", path: "advertise-with-us", icon: "Megaphone" },
                { label: "Contact Us", path: "contact", icon: "Mail" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="lg:hidden bg-white shadow-md p-4 flex flex-col gap-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          {/* Phone Numbers */}
          <div className="flex items-center gap-2 text-[#1C1B1F]">
            <PhoneCall className="w-4 h-4 text-yellow-400" />
            <p className="text-xs">+1 234 567 8900</p>
          </div>

          {/* Dropdown Menus */}
          {user?.user?.role?.role === "USER" && (
            <Dropdown
              title="For Buyer"
              options={[
                { label: "Post buy Requirement", path: "post-requirement", icon: "ShoppingCart" },
                { label: "Browse Suppliers", path: "all-categories", icon: "BookOpen" },
                { label: "Manufactures Directory", path: "", icon: "ShieldCheck" },
                { label: "Country Suppliers", path: "all-country", icon: "Headset" },
                { label: "Buyer FAQs", path: "buyer-faq", icon: "HelpCircle" },
              ]}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          {(user?.user?.role?.role === "MERCHANT" ||
            user?.user?.role?.role === "SERVICE_PROVIDER") && (
            <Dropdown
              title="For Seller"
              options={[
                { label: "Sell your Products", path: "register", icon: "Store" },
                { label: "Seller FAQ", path: "seller-faq", icon: "Book" },
              ]}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          <Dropdown
            title="News"
            onItemClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-full max-h-96 overflow-y-auto">
              <div className="px-4 py-2 font-semibold border-b border-gray-200 text-xs">
                In Progress News
              </div>
              {isLoading ? (
                <div className="flex justify-center py-2 text-gray-600 text-xs">Loading...</div>
              ) : Array.isArray(news) && news.length > 0 ? (
                news.map((item, index) => (
                  <div key={item._id || index} className="flex flex-col items-start px-4 py-2">
                    <span className="font-semibold text-xs">{item.title}</span>
                    <span className="text-xs text-gray-600">{item.description}</span>
                    <span className="text-xs text-gray-500">
                      Start: {new Date(item.startDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      End: {new Date(item.endDate).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-center py-2 text-gray-600 text-xs">
                  No in progress news
                </div>
              )}
            </div>
          </Dropdown>
          <Dropdown
            title="Help"
            options={[
              { label: "Send Feedback", path: "feedback", icon: "MessageSquare" },
              { label: "Send Complaint", path: "complaint", icon: "AlertTriangle" },
              { label: "Advertise with us", path: "advertise-with-us", icon: "Megaphone" },
              { label: "Contact Us", path: "contact", icon: "Mail" },
            ]}
            onItemClick={() => setIsMobileMenuOpen(false)}
          />
        </motion.div>
      )}

      <motion.div
        className="flex items-center justify-between bg-[#0c1f4d] shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo Section */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={handleHomeScreen}>
          <img src={logo} alt="Logo" className="h-20" />
        </div>

        {/* Search Box */}
        <motion.div
          className="flex items-center border rounded-full overflow-hidden w-1/2 bg-white"
          whileHover={{ scale: 1.02 }}
        >
          <Select onValueChange={(value) => setSelectedCategory(value)}>
            <SelectTrigger className="px-3 py-2 bg-white border-r text-gray-700">
              <SelectValue placeholder="Products / Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">Products / Services</SelectItem>
              <SelectItem value="suppliers">Suppliers</SelectItem>
              <SelectItem value="buyers">Buyers</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="text"
            placeholder={placeholderText[selectedCategory]}
            className="flex-grow px-3 py-2 outline-none border-none focus:ring-0 focus:border-transparent border-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Mic className="text-gray-500 mx-3 cursor-pointer" />
          <Button className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
            Search
          </Button>
        </motion.div>

        {/* Post Buy Requirement Button */}
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button
            className="px-5 py-2 bg-red-600 hover:text-white hidden md:block lg:block text-white font-semibold rounded-full"
            onClick={() => navigate("/post-requirement")}
          >
            Post Buy Requirement
          </Button>
        </motion.div>
      </motion.div>
    </header>
  );
};

// Dropdown using Hover Effect
const Dropdown = ({ title, options, children, onItemClick }) => {
  return (
    <div className="relative group">
      <div
        className="hover:text-[#e03733] transition flex items-center gap-1 cursor-pointer"
        role="button"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {title === "News" && (
          <>
            <Bell className="h-5 w-5" />
            {Array.isArray(options) && options.length > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </>
        )}
        {title}
        <LucideIcons.ChevronDown className="w-4 h-4" />
      </div>
      <div className="absolute left-0 mt-2 bg-white text-black shadow-md w-56 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-200 space-y-1 py-2 z-50">
        {children ? (
          children
        ) : (
          options?.map((option, index) => (
            <DropdownItem
              key={index}
              to={`/${option.path}`}
              label={option.label}
              icon={option.icon}
              onClick={onItemClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Reusable Dropdown Item
const DropdownItem = ({ to, label, icon, onClick }) => {
  const IconComponent = LucideIcons[icon] || LucideIcons.CircleHelp;

  return (
    <motion.div
      initial={{ x: 0 }}
      whileHover={{ x: 8 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <Link
        to={to}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors"
        onClick={onClick}
      >
        <IconComponent className="w-4 h-4 text-gray-600" />
        <span>{label}</span>
      </Link>
    </motion.div>
  );
};

export default Header;