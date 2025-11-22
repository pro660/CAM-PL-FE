// src/pages/login/KakaoCallbackPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/KakaoCallbackPage.css";
import api, { setAuth, clearAuth } from "../../api/axios";

export default function KakaoCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ✅ 백엔드에서 카카오 인증 + HttpOnly Refresh 쿠키를 심어준 뒤,
        // 그 쿠키만 가지고 /auth/refresh를 호출해서 accessToken + 유저정보 가져옴
        const { data } = await api.post("/auth/refresh", null);

        // data 예시:
        // {
        //   "accessToken": "...",
        //   "id": 10,
        //   "loginId": "kakao_xxxx",
        //   "name": "홍길동",
        //   "email": "xxx@kakao.com",
        //   "provider": "KAKAO"
        // }

        if (!data || !data.accessToken) {
          throw new Error("카카오 로그인 응답에 accessToken이 없습니다.");
        }

        if (cancelled) return;

        // ✅ camp_auth 한 키에 accessToken + 유저정보 저장
        setAuth(data);

        // 메인으로 이동
        navigate("/", { replace: true });
      } catch (e) {
        console.error("카카오 로그인 처리 중 오류", e);
        clearAuth();

        if (cancelled) return;

        alert(
          "카카오 로그인 처리 중 오류가 발생했습니다.\n" +
            "잠시 후 다시 시도해 주세요."
        );
        navigate("/login", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="kakao-callback-page">
      <div className="kakao-callback-inner">
        <p className="kakao-callback-text">카카오 로그인 처리 중입니다...</p>
      </div>
    </div>
  );
}
