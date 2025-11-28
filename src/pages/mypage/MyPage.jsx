import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/MyPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";
import MyTimetable from "../../components/mypage/MyTimetable.jsx";

import PenImg from "../../images/mypage/pen.svg"

const WEEKDAY_KR_LONG = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

export default function MyPage() {
  const [courses, setCourses] = useState([]);
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();

  // ★ 사용자 아이디 (추후 AuthContext 연동용)
  const userId = "아이디";

  const today = useMemo(() => new Date(), []);
  const todayText = useMemo(() => {
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const weekday = WEEKDAY_KR_LONG[today.getDay()];
    return `오늘은 ${month}월 ${date}일 ${weekday}입니다.`;
  }, [today]);

  // 시간표 로딩
  useEffect(() => {
    let cancelled = false;

    const fetchTimetable = async () => {
      // showLoading();
      try {
        const res = await api.get("/timetable");
        if (cancelled) return;

        const data = res.data ?? {};
        const list = Array.isArray(data.courses) ? data.courses : [];
        setCourses(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          // hideLoading();
        }
      }
    };

    fetchTimetable();
    return () => {
      cancelled = true;
    };
  }, [showLoading, hideLoading]);

  const handleEditProfile = () => {
    // 나중에 개인정보 수정 페이지 생기면 여기서 이동
    console.log("개인정보 수정 클릭");
  };

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;

    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      // 토큰 / 유저정보 정리 (키 이름은 프로젝트에 맞게 조정)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login", { replace: true });
    }
  };

  const handleUnregister = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까?")) return;

    try {
      await api.delete("/auth/unregister");
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="mypage-page">
      {/* 상단 인사 영역 */}
      <section className="mypage-header-row">
        <div className="mypage-greeting">
          <p className="mypage-greeting-line1">
            안녕하세요, {userId}님!
          </p>
          <p className="mypage-greeting-line2">{todayText}</p>
        </div>

        <button
          type="button"
          className="mypage-add-button"
          aria-label="일정 추가"
        >
          {/* 여기에 나중에 + SVG 아이콘 넣으면 됨 */}
          +
        </button>
      </section>

      {/* 시간표 카드 */}
      <section className="mypage-timetable-section">
        <MyTimetable courses={courses} />
      </section>

      {/* 개인정보 수정 카드 */}
      <section className="mypage-profile-card-wrapper">
        <button
          type="button"
          className="mypage-profile-card"
          onClick={handleEditProfile}
        >
          <div className="mypage-profile-icon">
            <img src={PenImg} alt="개인정보 수정 아이콘"/>
          </div>
          <span className="mypage-profile-text">개인정보 수정</span>
        </button>
      </section>

      {/* 로그아웃 / 탈퇴하기 */}
      <section className="mypage-bottom-links">
        <button
          type="button"
          className="mypage-link-button"
          onClick={handleLogout}
        >
          로그아웃
        </button>
        <button
          type="button"
          className="mypage-link-button mypage-link-danger"
          onClick={handleUnregister}
        >
          탈퇴하기
        </button>
      </section>
    </div>
  );
}
