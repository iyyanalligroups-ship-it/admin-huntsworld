import React, { useState, useRef } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TestimonialForm from "./forms/TestimonialForm";
import TestimonialList from "./pages/TestimonialList";

const Testimonial = () => {
  const { isSidebarOpen } = useSidebar();
  const [isFeedback, setIsFeedback] = useState(false);
  const feedbackRef = useRef(null);
  const [isEditing, setIsEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddFeedback = () => {
    setIsFeedback(true);
    setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleEdit = (edit) => {
    setIsEditing(edit);
  };

  return (
    <>
      {/* Floating Button */}
  

      {/* Main Content */}
      <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
        <div ref={feedbackRef} className="space-y-6">
            {/* <h2 className="text-md border-1 w-fit border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">Add Feedback</h2> */}
          {/* Testimonial Form - Full Width */}
          {/* <div className="">
            <TestimonialForm
              isEditing={isEditing}
              onSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          </div> */}

          {/* Testimonial List - Full Width */}
          <div className="">
         
            <div className="">
              <TestimonialList
                onEdit={handleEdit}
                refreshKey={refreshKey}
                onRefresh={() => setRefreshKey((prev) => prev + 1)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Testimonial;
