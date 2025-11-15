// src/pages/login/KakaoCallbackPage.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/login/KakaoCallbackPage.css";
import { useAuth } from "../../context/AuthContext";

export default function KakaoCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // 백엔드에서 어떤 이름으로 넘겨주는지 친구한테 꼭 확인하기!
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const id = params.get("id");
    const loginId = params.get("loginId");
    const name = params.get("name");
    const email = params.get("email");
    const provider = params.get("provider") || "KAKAO";

    if (!accessToken) {
      // 토큰 없으면 실패 → 로그인 화면으로
      navigate("/login", { replace: true });
      return;
    }

    // ✅ 백엔드에서 준 정보 전체를 AuthContext / localStorage에 저장
    login({
      accessToken,
      refreshToken,
      id: id ? Number(id) : null,
      loginId,
      name,
      email,
      provider,
    });

    // ✅ 신규/기존 상관 없이 그냥 홈으로
    navigate("/", { replace: true });
  }, [location, navigate, login]);

  return (
    <div className="kakao-callback-page">
      <div className="kakao-callback-inner">
        <p className="kakao-callback-text">카카오 로그인 처리 중입니다...</p>
      </div>
    </div>
  );
}
