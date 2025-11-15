// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // 앱 시작 시 localStorage에서 복원
  useEffect(() => {
    const storedUser = localStorage.getItem("camp_user");
    const storedAccessToken = localStorage.getItem("camp_access_token");

    if (storedUser && storedAccessToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccessToken);
    }
  }, []);

  // ✅ 로그인 응답(JSON)을 공통으로 적용하는 함수
  const applyAuthResponse = (data) => {
    if (!data) return;

    const { accessToken: token, ...userInfo } = data;

    if (token) {
      setAccessToken(token);
      localStorage.setItem("camp_access_token", token);
    }

    setUser(userInfo);
    localStorage.setItem("camp_user", JSON.stringify(userInfo));
  };

  // ✅ 일반 로그인 (아이디/비밀번호)
  const login = async ({ loginId, password }) => {
    const { data } = await api.post("/auth/login", { loginId, password });
    applyAuthResponse(data);
  };

  // ✅ refresh(쿠키 기반, 카카오 콜백에서 사용)
  const loginWithRefresh = async () => {
    const { data } = await api.post("/auth/refresh", null);
    applyAuthResponse(data);
  };

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
    login,             // 아이디/비번 로그인
    loginWithRefresh,  // 카카오 콜백에서 사용
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
