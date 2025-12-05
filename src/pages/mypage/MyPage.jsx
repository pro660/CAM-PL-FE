// src/pages/mypage/MyPage.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import "../../css/mypage/MyPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";
import MyTimetable from "../../components/mypage/MyTimetable.jsx";
import CourseSearchBottomSheet from "../../components/mypage/SearchSheet.jsx";
import LinkBox from "../../components/mypage/Link_Box.jsx";
import AccountConfirmModal from "../../components/mypage/AccountConfirmModal.jsx"; // 🔥 추가

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

  const [isCourseSheetOpen, setIsCourseSheetOpen] = useState(false);
  const [userName, setUserName] = useState("CAM-PL 사용자");

  // 🔥 바텀시트에서 선택된 강의(시간표 미리보기용)
  const [previewCourse, setPreviewCourse] = useState(null);

  // 🔥 로그아웃 / 탈퇴 확인 팝업 상태
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);

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

  // 🔥 시간표 로딩 함수 (재사용)
  const loadTimetable = useCallback(async () => {
    showLoading();
    try {
      const res = await api.get("/timetable");
      const data = res.data ?? {};
      const list = Array.isArray(data.courses) ? data.courses : [];
      setCourses(list);
    } catch (e) {
      console.error("시간표 불러오기 실패:", e);
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  // 마운트 시 한 번 시간표 로딩
  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  // + 버튼 / 바텀시트 닫기
  const handleToggleCourseSheet = () => {
    setIsCourseSheetOpen((prev) => {
      const next = !prev;
      // 닫힐 때는 미리보기 삭제
      if (!next) {
        setPreviewCourse(null);
      }
      return next;
    });
  };

  // 🔥 바텀시트에서 "시간표 추가" 성공 시
  const handleTimetableAdded = () => {
    loadTimetable(); // 내 시간표 다시 불러오고
    setPreviewCourse(null); // 미리보기 제거
    setIsCourseSheetOpen(false); // 바텀시트 닫기
  };

  // 이 안에서 실제 이동 링크만 채워주면 됨
  const handleGoNotice = () => {
    window.open("https://nportal.hanseo.ac.kr/");
  };

  const handleGoShuttle = () => {
    window.open("https://hsu.busro.net:456/");
  };

  // 🔥 기존 window.confirm 대신 팝업만 열어주기
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleUnregisterClick = () => {
    setShowUnregisterModal(true);
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
        <MyTimetable courses={courses} previewCourse={previewCourse} />
      </section>

      {/* 학사공지 / 셔틀 예약 링크 상자 */}
      <section className="mypage-link-box-wrapper">
        <LinkBox
          label="한서 포탈 바로가기"
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
          onClick={handleLogoutClick} // 🔥 팝업 오픈
        >
          로그아웃
        </button>
        <button
          type="button"
          className="mypage-link-button mypage-link-danger"
          onClick={handleUnregisterClick} // 🔥 팝업 오픈
        >
          탈퇴하기
        </button>
      </section>

      {isCourseSheetOpen && (
        <CourseSearchBottomSheet
          onClose={handleToggleCourseSheet}
          onCourseSelect={setPreviewCourse} // 🔥 클릭 시 미리보기
          onTimetableAdded={handleTimetableAdded} // 🔥 추가 성공 시 콜백
        />
      )}

      {/* 🔥 로그아웃 확인 팝업 */}
      <AccountConfirmModal
        mode="logout"
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />

      {/* 🔥 회원탈퇴 확인 팝업 */}
      <AccountConfirmModal
        mode="unregister"
        visible={showUnregisterModal}
        onClose={() => setShowUnregisterModal(false)}
      />
    </div>
  );
}
