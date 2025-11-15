// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // auth: 백엔드에서 내려준 전체 객체를 저장 (accessToken 포함)
  const [auth, setAuth] = useState(null);

  // 앱 시작할 때 localStorage에서 복원
  useEffect(() => {
    const stored = localStorage.getItem("camp_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuth(parsed);
      } catch (e) {
        console.error("camp_auth 파싱 오류:", e);
        localStorage.removeItem("camp_auth");
      }
    }
  }, []);

  // 공통 로그인 함수: 백엔드 응답 전체를 그대로 넘겨주면 됨
  // 예: { accessToken, refreshToken, id, loginId, name, email, provider }
  const login = (payload) => {
    if (!payload || !payload.accessToken) {
      console.error("login() payload가 이상합니다:", payload);
      return;
    }

    setAuth(payload);
    localStorage.setItem("camp_auth", JSON.stringify(payload));
  };

  // 로그아웃
  const logout = () => {
    setAuth(null);
    localStorage.removeItem("camp_auth");
  };

  // 편의를 위해 user / accessToken / isAuthenticated 제공
  const accessToken = auth?.accessToken || null;
  const user = auth
    ? {
        id: auth.id,
        loginId: auth.loginId,
        name: auth.name,
        email: auth.email,
        provider: auth.provider,
      }
    : null;

  const value = {
    auth,              // 전체 응답
    user,              // 필요한 필드만 추려낸 사용자 정보
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
