import React, { createContext, useContext, useState } from "react";

// AuthContext is responsible only for auth UI state (login/signup modal)
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authType, setAuthType] = useState("none"); // "none" | "login" | "signup"

  return (
    <AuthContext.Provider value={{ authType, setAuthType }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
