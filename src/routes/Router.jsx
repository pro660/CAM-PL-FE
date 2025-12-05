// src/router/AppRouter.jsx

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
import CourseCreditSelectPage from "../pages/mypage/CreditSelectPage"; // ✅ 학점 선택 페이지
import CourseReviewPage from "../pages/review/CourseReviewPage"; // ✅ 강의평 페이지
import CourseTimeFilterPage from "../pages/mypage/CourseTimeFilterPage"; // ✅ 시간 선택 페이지

import Loader from "../components/common/Loader";
import { useLoading } from "../context/LoadingContext.jsx";

function Layout({ children }) {
  const location = useLocation();
  const { isLoading } = useLoading();

  // ✅ 헤더 숨길 경로들 (기본 Header 대신 페이지 자체 헤더 쓰는 곳)
  const headerHiddenPaths = [
    "/login",
    "/signup",
    "/oauth/signed-in",
    "/course-area",
    "/course-year", // 학년 선택 페이지
    "/course-credit", // 학점 선택 페이지
    "/course-review", // ✅ 강의평 페이지 -> 기본 Header 숨김
  ];

  // ✅ 메뉴바 숨길 경로들 (강의평은 넣지 않는다!)
  const menuHiddenPaths = [
    "/login",
    "/signup",
    "/oauth/signed-in",
    "/course-area",
    "/course-year",
    "/course-credit",
    "/course-time", // 시간 선택 페이지에서도 메뉴 숨김
    // "/course-review" 는 안 넣음 → 강의평에서도 메뉴 보이게
  ];

  const hideHeader = headerHiddenPaths.some((path) =>
    location.pathname.startsWith(path)
  );
  const hideMenu = menuHiddenPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // ✅ 메뉴바가 있을 때만 아래 패딩 크게
  const mainBottomPadding = hideMenu ? "16px" : "72px";

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

      {!hideHeader && <Header />}
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
      {!hideMenu && <Menu />}
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

          {/* 학점 선택 */}
          <Route
            path="/course-credit"
            element={
              <ProtectedRoute>
                <CourseCreditSelectPage />
              </ProtectedRoute>
            }
          />

          {/* 시간 선택 */}
          <Route
            path="/course-time"
            element={
              <ProtectedRoute>
                <CourseTimeFilterPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ 강의평 페이지 */}
          <Route
            path="/course-review/:courseId"
            element={
              <ProtectedRoute>
                <CourseReviewPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default AppRouter;
