import React, { createContext, useState } from 'react';

// Create the Context
const SidebarContext = createContext();

// Create a Provider Component
export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Export the context for use in other parts of the app
export { SidebarContext };
