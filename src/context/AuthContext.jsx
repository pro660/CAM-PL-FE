// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ⭐ 로컬스토리지에서 통합 auth 객체 읽기
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem("auth");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("localStorage auth 파싱 오류:", e);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // 파생 상태들
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

  // axios Authorization 헤더 세팅
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [accessToken]);

  // 최초 마운트 시: 이미 auth가 있으면 그대로 쓰고,
  // 없으면 refresh 시도
  useEffect(() => {
    const initAuth = async () => {
      // 이미 로컬에 auth 있으면 그대로 사용
      if (auth?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        // 쿠키 기반 refresh
        const res = await api.post("/auth/refresh");
        const data = res.data;

        // ⚠️ 백엔드 응답 예시:
        // {
        //   "accessToken": "...",
        //   "id": 8,
        //   "loginId": "test1234",
        //   "name": "test1234",
        //   "email": "op9563_2@naver.com",
        //   "provider": "LOCAL"
        // }

        setAuth(data);
        localStorage.setItem("auth", JSON.stringify(data));
      } catch (e) {
        console.log("초기 refresh 실패 (로그인 안 되어있을 수 있음)", e);
        setAuth(null);
        localStorage.removeItem("auth");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // auth 변경 시마다 다시 시도하면 루프라서 [] 유지

  // ✅ 공통 login 함수 (일반 + 카카오 모두 여기로)
  const login = async (payload) => {
    let authData;

    if (payload.accessToken) {
      // ⚡ 카카오 콜백에서 바로 넘기는 케이스
      // payload 안에 accessToken + 유저정보가 다 들어있다고 가정
      authData = payload;
    } else {
      // ⚡ 일반 로그인 (loginId + password)
      const res = await api.post("/auth/login", payload);
      authData = res.data;
    }

    // 백엔드에서 준 전체 데이터 그대로 로컬스토리지에 때려넣기
    setAuth(authData);
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.log("logout 에러 (무시 가능)", e);
    } finally {
      setAuth(null);
      localStorage.removeItem("auth");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        auth,                // 전체 원본 데이터
        accessToken,         // 편하게 쓰라고 따로도 제공
        user,                // {id, loginId, name, email, provider}
        isAuthenticated: !!accessToken,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
