import React from "react";
import { useSidebar } from "../../hooks/useSidebar";

import BuyerFAQ from "@/staticPages/BuyerFAQ";
import { Separator } from "@/components/ui/separator";
import SellerFAQ from "@/staticPages/SellerFAQ";
import StudentFAQ from "@/staticPages/pages/StudentFAQ";
import BaseMemberFAQ from "@/staticPages/pages/BaseMemberFAQ";
import GeneralFAQ from "@/staticPages/pages/GeneralFAQ";

const FAQ = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className={`${isSidebarOpen ? " lg:p-6 lg:ml-56" : " lg:p-4 lg:ml-16"}`}>
      <div>
        <GeneralFAQ />
        <Separator />
        <BuyerFAQ />
        <Separator />
        <SellerFAQ />
        <Separator />
        <StudentFAQ />
        <Separator />
        <BaseMemberFAQ />
      </div>
    </div>
  );
};

export default FAQ;
