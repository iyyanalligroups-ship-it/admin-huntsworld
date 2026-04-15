import { createContext, useState, useEffect } from "react";
import CryptoJS from "crypto-js";

export const AuthContext = createContext(null);

const SECRET_KEY =import.meta.env.VITE_SECRET_KEY;

const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (err) {
    console.error("Decryption failed:", err);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(sessionStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    const encryptedUser = sessionStorage.getItem("user");
    return encryptedUser ? decryptData(encryptedUser) : null;
  });

  useEffect(() => {
    if (token && user) {
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", encryptData(user));
    } else {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
  }, [token, user]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem("token", authToken);
    sessionStorage.setItem("user", encryptData(userData));
  };

  const loginWithOtp = (mobile, otp) => {
    const userData = { mobile };
    setUser(userData);
    sessionStorage.setItem("user", encryptData(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    console.log("User logged out");
  };


  const refreshUser = (updatedUserData) => {
  setUser(updatedUserData);
  sessionStorage.setItem("user", encryptData(updatedUserData));
};

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithOtp, logout,refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};