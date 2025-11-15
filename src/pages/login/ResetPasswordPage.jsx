// src/pages/login/ResetPasswordPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/login/ResetPasswordPage.css";
import LogoImg from "../../images/loginpage/logo.svg";
import EyeOpenIcon from "../../images/loginpage/icon-eye-open.svg";
import EyeClosedIcon from "../../images/loginpage/icon-eye-closed.svg";
import api from "../../api/axios";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // FindAccountPage에서 넘어온 email, code
  const { email, code } = location.state || {};

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // email / code 없이 직접 들어온 경우 가드
  if (!email || !code) {
    return (
      <div className="reset-page">
        <div className="reset-inner">
          <p style={{ marginTop: "4rem", color: "#fff", textAlign: "center" }}>
            비밀번호 재설정 정보가 없습니다. 다시 시도해주세요.
          </p>
          <button
            type="button"
            className="reset-submit-button"
            style={{ marginTop: "1.5rem" }}
            onClick={() => navigate("/login")}
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  // 비밀번호 규칙: 6~20자 / 대/소문자, 숫자, 특수문자 중 2가지 이상
  const isValidPassword = (value) => {
    if (value.length < 6 || value.length > 20) return false;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const kinds = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean)
      .length;
    return kinds >= 2;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidPassword(password)) {
      setError(
        "비밀번호는 6~20자, 영문 대소문자/숫자/특수문자 중 2가지 이상 조합이어야 합니다."
      );
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      // ✅ 실제 비밀번호 재설정 API
      await api.post("/auth/recovery/reset-password", {
        email,              // FindAccountPage에서 검증된 이메일
        code,               // FindAccountPage에서 사용한 인증 코드
        newPassword: password,
      });

      // 🔹 성공 시 완료 페이지로 이동
      navigate("/login/reset-password/done", { replace: true });
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.error || "비밀번호 재설정 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-inner">
        {/* 상단 헤더 (뒤로가기 + 로고) */}
        <header className="reset-header">
          <button
            type="button"
            className="reset-back-button"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            <span className="reset-back-icon" />
          </button>

          <div className="reset-logo-area">
            <div className="reset-logo-circle">
              <img
                src={LogoImg}
                alt="캠플 로고"
                className="reset-logo-image"
              />
            </div>
          </div>
        </header>

        {/* 타이틀 */}
        <h1 className="reset-title">비밀번호 재설정</h1>

        {/* 폼 */}
        <form className="reset-form" onSubmit={handleSubmit}>
          {/* 새 비밀번호 */}
          <div className="reset-field">
            <label className="reset-label" htmlFor="reset-password">
              새 비밀번호
            </label>
            <div className="reset-input-wrapper">
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요."
                className="reset-input reset-input-password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <img
                  src={showPassword ? EyeOpenIcon : EyeClosedIcon}
                  alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="reset-password-icon"
                />
              </button>
            </div>
          </div>

          {/* 새 비밀번호 확인 */}
          <div className="reset-field">
            <label
              className="reset-label"
              htmlFor="reset-password-confirm"
            >
              새 비밀번호 확인
            </label>
            <div className="reset-input-wrapper">
              <input
                id="reset-password-confirm"
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="새 비밀번호를 한 번 더 입력하세요."
                className="reset-input reset-input-password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
              >
                <img
                  src={showPasswordConfirm ? EyeOpenIcon : EyeClosedIcon}
                  alt={
                    showPasswordConfirm
                      ? "비밀번호 숨기기"
                      : "비밀번호 보기"
                  }
                  className="reset-password-icon"
                />
              </button>
            </div>
            <p className="reset-helper-text">
              6~20자 / 영문 대문자, 소문자, 숫자, 특수문자 중 2가지 이상 조합
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && <div className="reset-error">{error}</div>}

          {/* 재설정 버튼 */}
          <button
            type="submit"
            className="reset-submit-button"
            disabled={loading}
          >
            {loading ? "재설정 중..." : "비밀번호 재설정"}
          </button>
        </form>
      </div>
    </div>
  );
}
