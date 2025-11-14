// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 localStorage에서 로그인 정보 복원
  useEffect(() => {
    const storedUser = localStorage.getItem("camp_user");
    const storedAccessToken = localStorage.getItem("camp_access_token");

    if (storedUser && storedAccessToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
      } catch (e) {
        console.error("저장된 사용자 정보 파싱 실패:", e);
        localStorage.removeItem("camp_user");
        localStorage.removeItem("camp_access_token");
      }
    }

    setIsLoading(false);
  }, []);

  // 로그인: /auth/login 호출 → accessToken + 유저 정보 저장
  const login = async (credentials) => {
    // credentials 예: { loginId, password }
    const { data } = await api.post("/auth/login", credentials);
    // data = { accessToken, id, loginId, name, email, provider }

    const { accessToken: newAccessToken, ...userInfo } = data;

    setUser(userInfo);
    setAccessToken(newAccessToken);

    localStorage.setItem("camp_user", JSON.stringify(userInfo));
    localStorage.setItem("camp_access_token", newAccessToken);

    return userInfo;
  };

  // 로그아웃
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("camp_user");
    localStorage.removeItem("camp_access_token");
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
