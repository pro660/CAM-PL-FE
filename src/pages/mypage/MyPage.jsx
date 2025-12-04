import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/MyPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";
import MyTimetable from "../../components/mypage/MyTimetable.jsx";
import CourseSearchBottomSheet from "../../components/mypage/SearchSheet.jsx";
import LinkBox from "../../components/mypage/Link_Box.jsx";

// ✅ 아이콘 SVG는 형이 실제 파일 만들어서 경로만 맞춰주면 됨
import NoticeIcon from "../../images/mypage/haksa.svg";
import ShuttleIcon from "../../images/mypage/bus.svg";

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

  // 전공/영역 / 학년 선택 후 돌아왔을 때 바텀시트 자동 오픈
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
      showLoading();
      try {
        const res = await api.get("/timetable");
        if (cancelled) return;

        const data = res.data ?? {};
        const list = Array.isArray(data.courses) ? data.courses : [];
        setCourses(list);
      } catch (e) {
        console.error(e);
      } finally {
        hideLoading();
      }
    };

    fetchTimetable();
    return () => {
      cancelled = true;
    };
  }, [showLoading, hideLoading]);

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

  // 이 안에서 실제 이동 링크만 채워주면 됨
  const handleGoNotice = () => {
    // 예시
    // navigate("/notice");
    window.open("https://www.hanseo.ac.kr/boardCnts/list.do?boardID=298&m=040101&s=hs");
    console.log("학사공지 바로가기 클릭");
  };

  const handleGoShuttle = () => {
    // 예시
    // navigate("/shuttle");
    window.open("https://hsu.busro.net:456/");
    console.log("셔틀 예약 바로가기 클릭");
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
          className={`mypage-add-button ${isCourseSheetOpen ? "open" : ""}`}
          aria-label="시간표 강의 추가"
          onClick={handleToggleCourseSheet}
        >
          +
        </button>
      </section>

      <section className="mypage-timetable-section">
        <MyTimetable courses={courses} />
      </section>

      {/* 학사공지 / 셔틀 예약 링크 상자 */}
      <section className="mypage-link-box-wrapper">
        <LinkBox
          label="학사공지 바로가기"
          iconSrc={NoticeIcon}
          iconAlt="학사공지 아이콘"
          variant="light"
          onClick={handleGoNotice}
        />
        <LinkBox
          label="셔틀 예약 바로가기"
          iconSrc={ShuttleIcon}
          iconAlt="셔틀 예약 아이콘"
          variant="gradient"
          onClick={handleGoShuttle}
        />
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
