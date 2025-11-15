// src/routes/Router.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";

import Header from "../components/Header";
import Menu from "../components/Menu";

import LoginPage from "../pages/login/LoginPage";
import HomePage from "../pages/home/HomePage";
import LoginFormPage from "../pages/login/LoginFormPage";
import SignupPage from "../pages/login/SignupPage";
import FindAccountPage from "../pages/login/FindAccountPage";
import ResetPasswordPage from "../pages/login/ResetPasswordPage";
import ResetPasswordDonePage from "../pages/login/ResetPasswordDonePage";
import KakaoCallbackPage from "../pages/login/KakaoCallbackPage";

function Layout({ children }) {
  const location = useLocation();

  // 헤더/메뉴를 숨길 경로들
  const hiddenPaths = [
    "/login",              // /login, /login/form, /login/find, /login/reset-password 포함
    "/signup",             // 회원가입
    "/oauth/signed-in",    // 카카오 콜백 (실제 백엔드 리다이렉트 경로)
    "/oauth/kakao/callback" // 예전 콜백 경로도 혹시 모르게 같이 처리
  ];

  const shouldHide = hiddenPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {!shouldHide && <Header />}
      <main
        style={{
          minHeight: "100vh",
          padding: "16px 16px 72px",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {children}
      </main>
      {!shouldHide && <Menu />}
    </>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* 로그인 랜딩 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 카카오 콜백 (현재 사용하는 경로) */}
          <Route path="/oauth/signed-in" element={<KakaoCallbackPage />} />
          {/* 혹시 백엔드에서 /oauth/kakao/callback 을 쓸 때도 대비 */}
          <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />

          {/* 로그인 폼 */}
          <Route path="/login/form" element={<LoginFormPage />} />

          {/* 아이디/비밀번호 찾기 */}
          <Route path="/login/find" element={<FindAccountPage />} />

          {/* 비밀번호 재설정(새 비번 입력) */}
          <Route path="/login/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/login/reset-password/done"
            element={<ResetPasswordDonePage />}
          />

          {/* 회원가입 폼 */}
          <Route path="/signup" element={<SignupPage />} />

          {/* 보호된 홈 라우트 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
              // 디버깅용으로 보호 끄고 싶으면 위 3줄 대신 <HomePage /> 만 넣어도 됨
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default AppRouter;
