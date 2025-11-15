// src/api/axios.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL;

if (!baseURL) {
  console.warn("⚠️ REACT_APP_API_BASE_URL이 설정되어 있지 않습니다.");
}

const api = axios.create({
  baseURL,
  withCredentials: true,           // ✅ HttpOnly 쿠키(REFRESH_TOKEN) 같이 보내기
});

/**
 * 요청 인터셉터
 * - localStorage에 저장된 accessToken을 Authorization 헤더에 자동으로 붙임
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("camp_access_token");
    if (accessToken) {
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

          // accessToken, 유저 정보 갱신
          if (newAccessToken) {
            localStorage.setItem("camp_access_token", newAccessToken);

            const { accessToken, ...user } = data;
            localStorage.setItem("camp_user", JSON.stringify(user));
          }

          isRefreshing = false;
          onRefreshed(newAccessToken);
        } catch (refreshError) {
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(axios(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
