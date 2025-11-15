// src/api/axios.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL;

if (!baseURL) {
  console.warn("⚠️ REACT_APP_API_BASE_URL이 설정되어 있지 않습니다.");
}

const api = axios.create({
  baseURL,
  // 쿠키 안 쓰면 withCredentials 필요 없음
  // withCredentials: true,
});

// localStorage에서 access / refresh 토큰 꺼내는 헬퍼
function getTokensFromStorage() {
  const stored = localStorage.getItem("camp_auth");
  if (!stored) return { accessToken: null, refreshToken: null };

  try {
    const parsed = JSON.parse(stored);
    return {
      accessToken: parsed.accessToken || null,
      refreshToken: parsed.refreshToken || null,
    };
  } catch (e) {
    console.error("camp_auth 파싱 오류:", e);
    return { accessToken: null, refreshToken: null };
  }
}

function saveTokensToStorage(partial) {
  const stored = localStorage.getItem("camp_auth");
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    const updated = { ...parsed, ...partial };
    localStorage.setItem("camp_auth", JSON.stringify(updated));
  } catch (e) {
    console.error("camp_auth 저장 중 오류:", e);
  }
}

/**
 * 요청 인터셉터
 * - camp_auth에서 accessToken을 읽어 Authorization 헤더에 넣어줌
 */
api.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokensFromStorage();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 응답 인터셉터
 * - 401 → refresh 토큰으로 재발급 시도 (있다면)
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
        const { refreshToken } = getTokensFromStorage();

        if (!refreshToken) {
          isRefreshing = false;
          return Promise.reject(error);
        }

        try {
          // ⚠️ 실제 리프레시 엔드포인트에 맞게 수정
          const { data } = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          });

          const newAccessToken = data.accessToken;
          const newRefreshToken = data.refreshToken;

          // 전체 camp_auth 안의 토큰들 갱신
          saveTokensToStorage({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? refreshToken,
          });

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
