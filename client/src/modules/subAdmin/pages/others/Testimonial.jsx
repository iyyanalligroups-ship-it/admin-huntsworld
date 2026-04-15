import React, { useState, useRef, useContext } from "react";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TestimonialForm from "./forms/TestimonialForm";
import TestimonialList from "./pages/TestimonialList";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const Testimonial = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const [isEditing, setIsEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // trigger refetch
  const feedbackRef = useRef(null);

 

  const handleEdit = (edit) => setIsEditing(edit);

  return (
  
      <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'}`}>
        <div ref={feedbackRef} className="mt-5 mb-5 px-4 ">
          <div className="flex flex-col  gap-6 w-full">

            {/* Left Side - Testimonial List */}
            {/* <div className="w-full   lg:p-4 rounded-lg ">
            <h2 className="text-md border-1 w-fit mb-3 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">Add Feedback</h2>
                <TestimonialForm
                isEditing={isEditing}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
              />
            </div> */}

       

            {/* Right Side - Testimonial Form */}
            <div className="">
               <TestimonialList
                onEdit={handleEdit}
                refreshKey={refreshKey}
                user={user}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          </div>
        </div>
      </div>

  );
};

export default Testimonial;
