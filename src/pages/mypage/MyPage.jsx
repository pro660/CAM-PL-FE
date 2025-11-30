import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/MyPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";
import MyTimetable from "../../components/mypage/MyTimetable.jsx";
import CourseSearchBottomSheet from "../../components/mypage/SearchSheet.jsx";

import PenImg from "../../images/mypage/pen.svg";

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
  const { showLoading, hideLoading } = useLoading(); // ✅ 전역 로더 훅 사용
  const navigate = useNavigate();

  const [isCourseSheetOpen, setIsCourseSheetOpen] = useState(false);
  const [userName, setUserName] = useState("CAM-PL 사용자");

  // camp_auth에서 사용자 이름 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem("camp_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name) {
          setUserName(parsed.name);
        }
      }
    } catch (e) {
      console.error("camp_auth 파싱 실패:", e);
    }
  }, []);

  // ⬇️ 전공/영역 / 학년 선택 후 돌아왔을 때 바텀시트 자동 오픈
  useEffect(() => {
    const flag = localStorage.getItem("mypage_open_course_sheet");
    if (flag === "1") {
      setIsCourseSheetOpen(true);
      localStorage.removeItem("mypage_open_course_sheet");
    }
  }, []);

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
      showLoading(); // ✅ 로더 ON
      try {
        const res = await api.get("/timetable");
        if (cancelled) return;

        const data = res.data ?? {};
        const list = Array.isArray(data.courses) ? data.courses : [];
        setCourses(list);
      } catch (e) {
        console.error(e);
      } finally {
        hideLoading(); // ✅ 로더 OFF (언마운트 여부와 상관없이)
      }
    };

    fetchTimetable();
    return () => {
      cancelled = true;
    };
  }, [showLoading, hideLoading]);

  const handleEditProfile = () => {
    console.log("개인정보 수정 클릭");
  };

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;

    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
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

  const handleToggleCourseSheet = () => {
    setIsCourseSheetOpen((prev) => !prev);
  };

  return (
    <div className="mypage-page">
      <section className="mypage-header-row">
        <div className="mypage-greeting">
          <p className="mypage-greeting-line1">
            안녕하세요, {userName}님!
          </p>
          <p className="mypage-greeting-line2">{todayText}</p>
        </div>

        <button
          type="button"
          className={`mypage-add-button ${
            isCourseSheetOpen ? "open" : ""
          }`}
          aria-label="시간표 강의 추가"
          onClick={handleToggleCourseSheet}
        >
          +
        </button>
      </section>

      <section className="mypage-timetable-section">
        <MyTimetable courses={courses} />
      </section>

      <section className="mypage-profile-card-wrapper">
        <button
          type="button"
          className="mypage-profile-card"
          onClick={handleEditProfile}
        >
          <div className="mypage-profile-icon">
            <img src={PenImg} alt="개인정보 수정 아이콘" />
          </div>
          <span className="mypage-profile-text">개인정보 수정</span>
        </button>
      </section>

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

      {isCourseSheetOpen && (
        <CourseSearchBottomSheet onClose={handleToggleCourseSheet} />
      )}
    </div>
  );
}
