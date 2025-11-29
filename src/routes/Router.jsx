// src/router/AppRouter.jsx (혹은 실제 경로에 맞게)

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
import MapPage from "../pages/map/MapPage";
import MyPage from "../pages/mypage/MyPage";
import CourseAreaSelectPage from "../pages/mypage/CourseSelectPage";
import CourseYearSelectPage from "../pages/mypage/YearSelectPage"; // ✅ 학년 선택 페이지
import CourseCreditSelectPage from "../pages/mypage/CreditSelectPage"; // ✅ 학점 선택 페이지 추가

import Loader from "../components/common/Loader";
import { useLoading } from "../context/LoadingContext.jsx";

function Layout({ children }) {
  const location = useLocation();
  const { isLoading } = useLoading();

  // ✅ Header / Menu 숨길 경로들
  const hiddenPaths = [
    "/login",
    "/signup",
    "/oauth/signed-in",
    "/course-area",
    "/course-year",    // 학년 선택 페이지
    "/course-credit",  // ✅ 학점 선택 페이지
  ];

  const shouldHide = hiddenPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  const mainBottomPadding = shouldHide ? "16px" : "72px";

  return (
    <>
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
          padding: `16px 16px ${mainBottomPadding}`,
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
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            }
          />

          {/* 전공/영역 선택 */}
          <Route
            path="/course-area"
            element={
              <ProtectedRoute>
                <CourseAreaSelectPage />
              </ProtectedRoute>
            }
          />

          {/* 학년 선택 */}
          <Route
            path="/course-year"
            element={
              <ProtectedRoute>
                <CourseYearSelectPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ 학점 선택 */}
          <Route
            path="/course-credit"
            element={
              <ProtectedRoute>
                <CourseCreditSelectPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default AppRouter;
