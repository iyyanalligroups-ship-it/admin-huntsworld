import React from 'react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import ReferralList from './ReferralList';

const Referral = () => {
  const { isSidebarOpen } = useSidebar()
  return (
    <>
      <div
        className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-1 sm:ml-64' : 'ml-1 sm:ml-16'}`}
      >
        <ReferralList />
      </div>
    </>
  )
}

export default Referral;
