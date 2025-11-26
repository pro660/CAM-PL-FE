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
import CalendarPage from "../pages/calendar/CalendarPage";

import Loader from "../components/common/Loader";            // ✅ 로더
import { useLoading } from "../context/LoadingContext.jsx";  // ✅ 로딩 컨텍스트

function Layout({ children }) {
  const location = useLocation();
  const { isLoading } = useLoading(); // ✅ 전역 로딩 상태 사용

  const hiddenPaths = [
    "/login",
    "/signup",
    "/oauth/signed-in", // ✅ 콜백 페이지
  ];

  const shouldHide = hiddenPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {/* ✅ 전역 로더 오버레이 */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Loader />
        </div>
      )}

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
          <Route path="/login" element={<LoginPage />} />

          {/* ✅ 카카오 콜백 */}
          <Route path="/oauth/signed-in" element={<KakaoCallbackPage />} />

          <Route path="/login/form" element={<LoginFormPage />} />
          <Route path="/login/find" element={<FindAccountPage />} />
          <Route path="/login/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/login/reset-password/done"
            element={<ResetPasswordDonePage />}
          />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/"
            element={
              // <ProtectedRoute>
              <HomePage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              // <ProtectedRoute>
              <CalendarPage />
              // </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default AppRouter;
