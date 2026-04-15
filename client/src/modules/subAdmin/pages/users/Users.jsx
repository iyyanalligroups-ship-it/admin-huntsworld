import React, { useState } from "react";
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import UserTable from "./UserTable";


const Users = () => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
      <UserTable />

    </div>
  );
};

export default Users;
