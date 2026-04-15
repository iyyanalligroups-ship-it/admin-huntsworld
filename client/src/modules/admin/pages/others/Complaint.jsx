import React from 'react';
import {useSidebar} from "../../hooks/useSidebar";
import ComplaintForm from "@/staticPages/Complaint";

const Complaint = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
    <>
    
    <div
      className={`lg:p-4  transition-all duration-300 ${
        isSidebarOpen ? 'lg:ml-54' : 'lg:ml-16'
      } max-w-screen-xl `}
    >
      <ComplaintForm />
    </div>
    </>
  )
}

export default Complaint;
