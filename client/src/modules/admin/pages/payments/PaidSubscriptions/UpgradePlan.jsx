import React from 'react';
import {useSidebar} from "../../../hooks/useSidebar";

import BuyPlanPage from './BuyPlanPage';

const Upgrageplan = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar();

  return (
 <>
   <div
    className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}
    >
      <BuyPlanPage />
    </div>
 </>
  )
}

export default Upgrageplan;
