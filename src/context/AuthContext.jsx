// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // 로그인한 유저 정보
  const [isLoading, setIsLoading] = useState(true); // 초기 인증 체크 상태

  // 앱 시작 시 쿠키 기반으로 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me"); // ✅ 백엔드에서 현재 유저 반환
        setUser(data); // data 안에 email, nickname, ... 들어있다고 가정
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 이메일/비밀번호 로그인 (폼에서 호출)
  // credentials 예: { email, password }
  const login = async (credentials) => {
    // 백엔드가 이 요청에서 쿠키를 심어줌
    const { data } = await api.post("/auth/login", credentials);

    // 응답 구조에 따라 조정 (data.user가 있으면 그걸, 아니면 data 자체)
    const nextUser = data.user ?? data;
    setUser(nextUser);

    return nextUser;
  };

  // 로그아웃
  const logout = async () => {
    try {
      await api.post("/auth/logout"); // 서버에서 쿠키 제거
    } catch (error) {
      // 실패해도 일단 프론트 상태는 비우기
      console.error("로그아웃 요청 중 오류:", error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 어디서든 useAuth()로 로그인 정보/함수 꺼내 쓰기
export function useAuth() {
  return useContext(AuthContext);
}
