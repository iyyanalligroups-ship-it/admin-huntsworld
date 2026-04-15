import React from 'react';
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import PaidSubscriptionList  from './PaidSubscriptionList';

const PaidSubcriptions = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar();

  return (
    <div
     className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}
     >
       <PaidSubscriptionList />
    </div>
  )
}

export default PaidSubcriptions;
