import React, { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { toast } from "react-hot-toast";
import { AuthContext } from "./useAuth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("docmind_token") || null);
  const [isLoading, setIsLoading] = useState(true);

  // Safe session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error("Session restoration error:", error);
        localStorage.removeItem("docmind_token");
        localStorage.removeItem("docmind_user");
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

  const loginWithGoogle = async (email, name = "Google User") => {
    setIsLoading(true);
    try {
      const data = await authService.loginWithGoogle(email, name);
      localStorage.setItem("docmind_token", data.access_token);
      localStorage.setItem("docmind_user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      setIsLoading(false);
      return data;
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.detail || "Google login failed. Please try again.";
      throw new Error(message);
    }
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
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

