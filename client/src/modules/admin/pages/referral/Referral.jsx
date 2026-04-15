import React from 'react';
import { useSidebar } from "../../hooks/useSidebar";
import ReferralList from './ReferralList';

const Referral = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  return (
    <>
      <div
        className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? ' lg:ml-52' : ' lg:ml-16'}`}
      >
        <ReferralList />
      </div>
    </>
  )
}

export default Referral;
