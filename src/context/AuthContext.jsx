// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api, {
  getAuth as getStoredAuth,
  setAuth as setStoredAuth,
  clearAuth as clearStoredAuth,
} from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ✅ camp_auth에서 통합 auth 객체 읽기
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [loading, setLoading] = useState(true);

  // 초기 마운트 시 한 번만 로컬스토리지 값 반영
  useEffect(() => {
    setAuth(getStoredAuth());
    setLoading(false);
  }, []);

  // ✅ 공통 login 함수 (일반 + 외부에서 auth 객체 직접 넘기는 경우 둘 다 처리)
  const login = useCallback(async (payload) => {
    let authData;

    if (payload && payload.accessToken) {
      // 예: 카카오 콜백 등에서 이미 응답 전체를 갖고 있을 때
      authData = payload;
    } else {
      // 예: { loginId, password } 형식으로 넘어오는 일반 로그인
      const res = await api.post("/auth/login", payload);
      authData = res.data;
    }

    // camp_auth에 저장
    setStoredAuth(authData);
    setAuth(getStoredAuth());
    return authData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.log("logout 에러 (무시 가능)", e);
    } finally {
      clearStoredAuth();
      setAuth(null);
    }
  }, []);

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

  return (
    <AuthContext.Provider
      value={{
        auth, // 전체 원본 데이터
        accessToken,
        user, // {id, loginId, name, email, provider}
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
