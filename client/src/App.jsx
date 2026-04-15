// src/App.jsx
import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./AppRoute";
import { AuthProvider } from "./modules/landing/context/AuthContext";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={500}
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      {/* ONLY AUTH IS GLOBAL */}
      <AuthProvider>
        <FixRadixFocus />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;


export function FixRadixFocus() {
  useEffect(() => {
    const restore = () => {
      document.body.style.pointerEvents = "auto";
    };

    document.addEventListener("click", restore);
    document.addEventListener("keydown", restore);
    document.addEventListener("focusin", restore);

    return () => {
      document.removeEventListener("click", restore);
      document.removeEventListener("keydown", restore);
      document.removeEventListener("focusin", restore);
    };
  }, []);

  return null;
}
