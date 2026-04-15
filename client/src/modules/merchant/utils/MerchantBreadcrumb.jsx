import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

const breadcrumbNameMap = {
  "dashboard": "Dashboard",
  "products": "Products",
  "branches": "Branches",
  "sea-requirement": "SEA Requirement",
  "reviews": "Reviews",
  "queries": "Queries",
  "wallet": "Wallet",
  "settings": "Settings",
  "plans": "Plans",
  "subscription": "Plan Subscription",
  "banner": "Banner",
  "trending": "Trending",
  "e-book": "E-Book"
};

const MerchantBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/merchant/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

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
                    <Link to={`/${routeTo}`}>
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

export default MerchantBreadcrumb;
