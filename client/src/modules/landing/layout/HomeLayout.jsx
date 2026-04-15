import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from "./Header";
import Footer from "./Footer";

const HomeLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <Header />
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomeLayout;
