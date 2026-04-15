import React from 'react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

import AllUsers from './AllUser';

const UserList = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar();

  return (
 <>
   <div
    className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}
    >
      <AllUsers />
    </div>
 </>
  )
}

export default UserList;
