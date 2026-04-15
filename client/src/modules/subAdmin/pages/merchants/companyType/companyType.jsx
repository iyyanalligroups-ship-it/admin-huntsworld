import React, { useState } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import CompanyTypeList from "./companyTypeList"
const CompanyType = () => {
    const { isSidebarOpen } = useSidebar();
    return (
        <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>

            <CompanyTypeList />

        </div>
    );
};

export default CompanyType;
