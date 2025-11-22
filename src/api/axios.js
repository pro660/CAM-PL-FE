// src/api/axios.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL;

if (!baseURL) {
  console.warn("⚠️ REACT_APP_API_BASE_URL이 설정되어 있지 않습니다.");
}

/** accessToken + 유저 정보가 함께 들어가는 단일 키 */
export const AUTH_STORAGE_KEY = "camp_auth";

/** camp_auth 읽기 */
export function getAuth() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** camp_auth 저장 (null이면 제거) */
export function setAuth(auth) {
  if (typeof window === "undefined") return;

  if (!auth) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  // 로그인 / 리프레시 응답 형태에 맞춰 필요한 필드만 저장
  const clean = {
    accessToken: auth.accessToken ?? "",
    id: auth.id ?? null,
    loginId: auth.loginId ?? "",
    name: auth.name ?? "",
    email: auth.email ?? "",
    provider: auth.provider ?? "",
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clean));
}

/** 로그아웃 등에서 auth 제거 */
export function clearAuth() {
  setAuth(null);
}

/** 액세스 토큰만 필요할 때 */
export function getAccessToken() {
  const auth = getAuth();
  return auth?.accessToken || "";
}

const api = axios.create({
  baseURL,
  withCredentials: true, // ✅ HttpOnly 쿠키(REFRESH_TOKEN) 같이 보내기
});

/**
 * 요청 인터셉터
 * - localStorage에 저장된 accessToken을 Authorization 헤더에 자동으로 붙임
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 응답 인터셉터
 * - 401이면 refresh 쿠키로 accessToken 재발급 시도
 * - 동시에 여러 요청이 401 난 경우, refresh 완료 후 한 번에 재요청
 */
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // ✅ 바디 없이, 쿠키만 가지고 refresh
          const { data } = await axios.post(
            `${baseURL}/auth/refresh`,
            null,
            { withCredentials: true }
          );

          const newAccessToken = data.accessToken;

          // accessToken + 유저 정보 통째로 camp_auth에 저장
          if (newAccessToken) {
            setAuth(data);
          } else {
            clearAuth();
          }

          isRefreshing = false;
          onRefreshed(newAccessToken);
        } catch (refreshError) {
          isRefreshing = false;
          clearAuth();
          onRefreshed(null); // 대기 중인 요청들 실패 처리
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(axios(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
