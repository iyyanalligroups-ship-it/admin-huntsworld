// src/context/MerchantContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const MerchantContext = createContext();

export const useMerchant = () => useContext(MerchantContext);

export const MerchantProvider = ({ children }) => {
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // Load from sessionStorage on first load
  useEffect(() => {
    const merchantFromStorage = sessionStorage.getItem("selectedMerchant");
    if (merchantFromStorage) {
      setSelectedMerchant(JSON.parse(merchantFromStorage));
    }
  }, []);

  // Save to sessionStorage every time it's updated
  useEffect(() => {
    if (selectedMerchant) {
      sessionStorage.setItem("selectedMerchant", JSON.stringify(selectedMerchant));
    } else {
      sessionStorage.removeItem("selectedMerchant");
    }
  }, [selectedMerchant]);

  return (
    <MerchantContext.Provider value={{ selectedMerchant, setSelectedMerchant }}>
      {children}
    </MerchantContext.Provider>
  );
};
