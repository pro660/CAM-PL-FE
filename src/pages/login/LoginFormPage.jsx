// src/pages/login/LoginFormPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/LoginFormPage.css";
import LogoImg from "../../images/loginpage/logo.svg";

// ✅ AuthContext 사용 (여기서 login 호출하면 camp_auth + Context 둘 다 갱신)
import { useAuth } from "../../context/AuthContext.jsx";

// 눈 아이콘 이미지
import EyeOpenIcon from "../../images/loginpage/icon-eye-open.svg";
import EyeClosedIcon from "../../images/loginpage/icon-eye-closed.svg";

export default function LoginFormPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ 컨텍스트의 login 사용

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!id.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // ✅ AuthContext.login 사용 → /auth/login 호출 + camp_auth 저장 + Context 갱신까지 처리
      await login({
        loginId: id.trim(),
        password,
      });

      // 로그인 성공 → 홈으로 이동
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);

      const status = err.response?.status;
      const backendMsg =
        err.response?.data?.error || err.response?.data?.message || "";

      // ✅ 1) 아이디/비밀번호가 틀린 경우 (400/401)
      if (status === 400 || status === 401) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      // ✅ 2) 리프레시 토큰 관련 내부 메시지는 사용자에게 안 보여줌
      if (
        typeof backendMsg === "string" &&
        backendMsg.includes("리프레쉬 토큰")
      ) {
        setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        setLoading(false);
        return;
      }

      // ✅ 3) 그 외에는 백엔드 메시지가 있으면 쓰되, 없으면 공통 메시지
      if (backendMsg) {
        setError(backendMsg);
      } else {
        setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickFindAccount = () => {
    navigate("/login/find");
  };

  const handleClickSignup = () => {
    navigate("/signup");
  };

  const togglePasswordVisible = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-form-page">
      <div className="login-form-inner">
        {/* 상단 헤더 (뒤로가기 + 로고) */}
        <header className="login-form-header">
          <button
            type="button"
            className="login-form-back-button"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            <span className="login-form-back-icon" />
          </button>

          <div className="login-form-logo-area">
            <div className="login-form-logo-circle">
              <img
                src={LogoImg}
                alt="캠플 로고"
                className="login-form-logo-image"
              />
            </div>
          </div>
        </header>

        {/* 폼 영역 */}
        <form className="login-form-body" onSubmit={handleSubmit}>
          {/* 아이디 필드 */}
          <div className="login-form-field">
            <label className="login-form-label" htmlFor="login-id">
              아이디
            </label>
            <div className="login-form-input-wrapper">
              <input
                id="login-id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="아이디를 입력해주세요."
                className="login-form-input"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* 비밀번호 필드 */}
          <div className="login-form-field">
            <label className="login-form-label" htmlFor="login-password">
              비밀번호
            </label>
            <div className="login-form-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="login-form-input login-form-input-password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-form-password-toggle"
                onClick={togglePasswordVisible}
                aria-label={
                  showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                }
              >
                <img
                  src={showPassword ? EyeOpenIcon : EyeClosedIcon}
                  alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="login-form-password-icon"
                />
              </button>
            </div>
          </div>

          {error && <div className="login-form-error">{error}</div>}

          {/* 시작하기 버튼 */}
          <button
            type="submit"
            className="login-form-submit-button"
            disabled={loading}
          >
            {loading ? "시작하는 중..." : "시작하기"}
          </button>
        </form>

        {/* 아래 링크 영역 */}
        <div className="login-form-footer">
          <button
            type="button"
            className="login-form-link"
            onClick={handleClickFindAccount}
          >
            아이디/ 비밀번호 찾기
          </button>
          <button
            type="button"
            className="login-form-link"
            onClick={handleClickSignup}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
