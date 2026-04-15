import React, { useState } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import BaseMemberType from "./BaseMemberType";


const BaseMemberTypeList = () => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
      <BaseMemberType />

    </div>
  );
};

export default BaseMemberTypeList;
