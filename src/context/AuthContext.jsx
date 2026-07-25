import React, { createContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { toast } from "react-hot-toast";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("docmind_token") || null);
  const [isLoading, setIsLoading] = useState(true);

  // Safe session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (token) {
          if (token.startsWith("mock_")) {
            const storedUser = localStorage.getItem("docmind_user");
            if (storedUser && storedUser !== "undefined") {
              setUser(JSON.parse(storedUser));
            } else {
              setToken(null);
              setUser(null);
            }
          } else {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Session restoration error:", error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [token]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem("docmind_token", data.access_token);
      localStorage.setItem("docmind_user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      setIsLoading(false);
      return data;
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.detail || "Login failed. Please check credentials.";
      throw new Error(message);
    }
  };

  const register = async (name, email, password, phone = null) => {
    setIsLoading(true);
    try {
      const data = await authService.register(name, email, password, phone);
      localStorage.setItem("docmind_token", data.access_token);
      localStorage.setItem("docmind_user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      setIsLoading(false);
      return data;
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.detail || "Registration failed. Please try again.";
      throw new Error(message);
    }
  };

  const loginWithPhoneSimulated = (phone) => {
    const mockUser = {
      id: Date.now(),
      full_name: "Phone User",
      email: `${phone.replace(/\D/g, "")}@docmind.phone`,
      phone_number: phone,
    };
    const mockToken = "mock_phone_jwt_token_" + Date.now();
    localStorage.setItem("docmind_token", mockToken);
    localStorage.setItem("docmind_user", JSON.stringify(mockUser));
    setToken(mockToken);
    setUser(mockUser);
  };

  const loginWithSocialSimulated = (provider = "Google", name = "Google User", email = "user@google.com") => {
    const mockUser = {
      id: Date.now(),
      full_name: name,
      email: email,
      phone_number: null,
      provider: provider,
    };
    const mockToken = `mock_${provider.toLowerCase()}_token_` + Date.now();
    localStorage.setItem("docmind_token", mockToken);
    localStorage.setItem("docmind_user", JSON.stringify(mockUser));
    setToken(mockToken);
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem("docmind_token");
    localStorage.removeItem("docmind_user");
    setToken(null);
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithPhoneSimulated,
        loginWithSocialSimulated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from "./useAuth";
