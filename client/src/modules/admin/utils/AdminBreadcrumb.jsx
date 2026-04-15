// AdminBreadcrumb.jsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

const breadcrumbNameMap = {
  dashboard: "Dashboard",
  "common-users": "Users",
  merchants: "Merchants",
  products: "Products",
  categories: "Categories",
  "service-providers": "Service Providers",
  vehicles: "Vehicles",
  students: "Students",
  payments: "Payments",
  subscriptions: "Subscriptions",
  ebooks: "Ebooks",
  banners: "Banners",
  coupons: "Coupons",
  plans: "Plans",
  main: "Main",
  sub: "Sub",
  "super-sub": "Super Sub",
  "deep-sub": "Deep Sub",
  others: "Others",
  reviews: "Reviews",
  faq: "FAQ",
  complaint: "Complaint",
  testimonial: "Testimonial",
  "grocery-sellers": "Grocery Sellers",
  permissions: "Permissions",
  "permission-request": "Permission Request",
  "post-requirement":"Post-By-Requirement"
};

// parent → default child mapping
const defaultChildRoute = {
  payments: "subscriptions",     // Payments → Subscriptions
  categories: "main",        // Categories → Products
  plans: "subscriptions",        // Plans → Subscriptions
  others: "post-requirement",             // Others → Reviews
       // Products → Categories
};

const AdminBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Always start with Admin Dashboard */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathnames.map((name, index) => {
          const isLast = index === pathnames.length - 1;

          // build progressive route
          let routeParts = pathnames.slice(0, index + 1);

          // if not last and has a default child → append it
          if (!isLast && defaultChildRoute[name]) {
            routeParts = [...routeParts, defaultChildRoute[name]];
          }

          const routeTo = `/${routeParts.join("/")}`;

          return (
            <div key={name} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <span className="text-muted-foreground capitalize">
                    {breadcrumbNameMap[name] || decodeURIComponent(name)}
                  </span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={routeTo}>
                      {breadcrumbNameMap[name] || decodeURIComponent(name)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AdminBreadcrumb;
