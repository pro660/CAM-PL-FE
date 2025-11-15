// src/pages/login/ResetPasswordDonePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/ResetPasswordDonePage.css";
import LogoImg from "../../images/loginpage/logo.svg";
import SuccessImg from "../../images/loginpage/done_logo.svg";

export default function ResetPasswordDonePage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleGoLogin = () => {
    navigate("/login/form", { replace: true });
  };

  return (
    <div className="resetdone-page">
      <div className="resetdone-inner">
        {/* 상단 헤더 (뒤로가기 + 로고) */}
        <header className="resetdone-header">
          <button
            type="button"
            className="resetdone-back-button"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            <span className="resetdone-back-icon" />
          </button>

          <div className="resetdone-logo-area">
            <div className="resetdone-logo-circle">
              <img
                src={LogoImg}
                alt="캠플 로고"
                className="resetdone-logo-image"
              />
            </div>
          </div>
        </header>

        {/* 탭 (아이디 찾기 / 비밀번호 재설정) */}
        <div className="resetdone-tabs">
          <button
            type="button"
            className="resetdone-tab resetdone-tab-inactive"
            disabled
          >
            아이디 찾기
          </button>
          <button
            type="button"
            className="resetdone-tab resetdone-tab-active"
            disabled
          >
            비밀번호 재설정
          </button>
        </div>
        <div className="resetdone-tab-indicator">
          <div className="resetdone-tab-bar resetdone-tab-bar-right" />
        </div>

        {/* 완료 카드 */}
        <div className="resetdone-card">
          <p className="resetdone-message">
            성공적으로 비밀번호를 변경했습니다!
          </p>
          <div className="resetdone-image-box">
            <img
              src={SuccessImg}
              alt="비밀번호 변경 완료"
              className="resetdone-image"
            />
          </div>
        </div>

        {/* 로그인 하러가기 버튼 */}
        <button
          type="button"
          className="resetdone-login-button"
          onClick={handleGoLogin}
        >
          로그인 하러가기
        </button>
      </div>
    </div>
  );
}
