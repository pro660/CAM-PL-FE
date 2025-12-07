// src/pages/mypage/MyPage.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import "../../css/mypage/MyPage.css";
import "../../css/calendar/Delete_schdule.css"; // 🔥 삭제 팝업 스타일 재사용

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";
import MyTimetable from "../../components/mypage/MyTimetable.jsx";
import CourseSearchBottomSheet from "../../components/mypage/SearchSheet.jsx";
import LinkBox from "../../components/mypage/Link_Box.jsx";
import AccountConfirmModal from "../../components/mypage/AccountConfirmModal.jsx";

import NoticeIcon from "../../images/mypage/haksa.svg";
import ShuttleIcon from "../../images/mypage/bus.svg";
import NosmileImg from "../../images/calendar/nosmile.svg";

const WEEKDAY_KR_LONG = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

// 🔔 시간표 과목 삭제 팝업 (Delete_schdule 스타일 재사용)
const TimetableDeleteModal = ({ visible, onConfirm, onCancel, loading }) => {
  if (!visible) return null;

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>
        <p className="delete-schedule-message">
          선택한 과목을 시간표에서 삭제하시겠습니까?
        </p>
        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "삭제 중..." : "삭제하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MyPage() {
  const location = useLocation();

  // /timetable 응답에서 오는 과목 정보 (courseName 조인용)
  const [courses, setCourses] = useState([]);
  // 실제 시간표에 올라간 item 들 (itemId 기반)
  const [timetableItems, setTimetableItems] = useState([]);

  const { showLoading, hideLoading } = useLoading();

  const [isCourseSheetOpen, setIsCourseSheetOpen] = useState(false);
  const [userName, setUserName] = useState("CAM-PL 사용자");

  // 바텀시트에서 선택된 강의(시간표 미리보기용)
  const [previewCourse, setPreviewCourse] = useState(null);

  // 로그아웃 / 탈퇴 확인 팝업 상태
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);

  // 시간표 삭제 모달 상태
  const [deleteTargetItemId, setDeleteTargetItemId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // 전공/영역 / 학년 선택 / 시간 필터에서 돌아왔을 때 바텀시트 자동 오픈
  useEffect(() => {
    let shouldOpen = false;

    // 1) 예전 방식: localStorage 플래그
    const flag = localStorage.getItem("mypage_open_course_sheet");
    if (flag === "1") {
      shouldOpen = true;
      localStorage.removeItem("mypage_open_course_sheet");
    }

    // 2) 시간 필터 페이지 등에서 navigate state로 넘어온 경우
    if (location.state?.openCourseSearchSheet) {
      shouldOpen = true;
    }

    if (shouldOpen) {
      setIsCourseSheetOpen(true);
    }

    // 한 번 사용한 뒤에는 history state를 정리 (뒤로가기 시 계속 열리는 것 방지)
    if (location.state?.openCourseSearchSheet && window.history?.replaceState) {
      const { openCourseSearchSheet, fromTimeFilter, ...rest } =
        location.state;
      window.history.replaceState(
        { ...window.history.state, usr: rest },
        ""
      );
    }
  }, [location.state]);

  const today = useMemo(() => new Date(), []);
  const todayText = useMemo(() => {
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const weekday = WEEKDAY_KR_LONG[today.getDay()];
    return `오늘은 ${month}월 ${date}일 ${weekday}입니다.`;
  }, [today]);

  // 시간표 로딩 함수 (재사용)
  const loadTimetable = useCallback(async () => {
    showLoading();
    try {
      const res = await api.get("/timetable");
      const data = res.data ?? {};

      const courseList = Array.isArray(data.courses) ? data.courses : [];
      setCourses(courseList);

      // 🔥 timetable items 배열 추출 (items or timetableItems 둘 다 대응)
      const rawItems = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.timetableItems)
        ? data.timetableItems
        : [];

      // console.log("TIMETABLE API RESPONSE", data, rawItems);

      // 🔥 각 item에 courseName/room 채워 넣기 (백엔드에서 안 내려줘도 안전하게)
      const enrichedItems = rawItems.map((item) => {
        const course =
          courseList.find((c) => c.id === item.courseId) || null;

        let courseName =
          item.courseName || item.name || course?.name || "";
        let room = item.room || "";

        if (!room && course && Array.isArray(course.times)) {
          const matched = course.times.find(
            (t) =>
              t.dayOfWeek === item.dayOfWeek &&
              t.startTime === item.startTime &&
              t.endTime === item.endTime
          );
          if (matched?.room) {
            room = matched.room;
          }
        }

        return {
          ...item,
          courseName,
          room,
        };
      });

      setTimetableItems(enrichedItems);
    } catch (e) {
      console.error("시간표 불러오기 실패:", e);
      setCourses([]);
      setTimetableItems([]);
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

  // 바텀시트에서 "시간표 추가" 성공 시
  const handleTimetableAdded = () => {
    loadTimetable(); // 내 시간표 다시 불러오고
    setPreviewCourse(null); // 미리보기 제거
    setIsCourseSheetOpen(false); // 바텀시트 닫기
  };

  // 시간표 블록 클릭 → 삭제 모달 오픈
  const handleTimetableBlockClick = (itemId) => {
    if (!itemId) return;
    setDeleteTargetItemId(itemId);
  };

  // 삭제 모달 - 취소
  const handleCancelDelete = () => {
    if (deleteLoading) return;
    setDeleteTargetItemId(null);
  };

  // 삭제 모달 - 확인
  const handleConfirmDelete = async () => {
    if (!deleteTargetItemId) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/timetable/items/${deleteTargetItemId}`);
      // 삭제 후 시간표 갱신
      await loadTimetable();
    } catch (e) {
      console.error("시간표 과목 삭제 실패:", e);
    } finally {
      setDeleteLoading(false);
      setDeleteTargetItemId(null);
    }
  };

  const handleGoNotice = () => {
    window.open("https://nportal.hanseo.ac.kr/");
  };

  const handleGoShuttle = () => {
    window.open("https://hsu.busro.net:456/");
  };

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
        <MyTimetable
          items={timetableItems}
          previewCourse={previewCourse}
          onBlockClick={handleTimetableBlockClick}
        />
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
          onClick={handleLogoutClick}
        >
          로그아웃
        </button>
        <button
          type="button"
          className="mypage-link-button mypage-link-danger"
          onClick={handleUnregisterClick}
        >
          탈퇴하기
        </button>
      </section>

      {isCourseSheetOpen && (
        <CourseSearchBottomSheet
          onClose={handleToggleCourseSheet}
          onCourseSelect={setPreviewCourse}
          onTimetableAdded={handleTimetableAdded}
        />
      )}

      {/* 로그아웃 확인 팝업 */}
      <AccountConfirmModal
        mode="logout"
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />

      {/* 회원탈퇴 확인 팝업 */}
      <AccountConfirmModal
        mode="unregister"
        visible={showUnregisterModal}
        onClose={() => setShowUnregisterModal(false)}
      />

      {/* 시간표 과목 삭제 팝업 */}
      <TimetableDeleteModal
        visible={deleteTargetItemId != null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
