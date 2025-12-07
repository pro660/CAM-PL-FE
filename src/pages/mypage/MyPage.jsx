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
const TimetableDeleteModal = ({
  visible,
  loading,
  onConfirm,
  onCancel,
  title,
  timeLabel,
}) => {
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
          {title && (
            <>
              <strong>{title}</strong>
              <br />
            </>
          )}
          {timeLabel && (
            <>
              <span>{timeLabel}</span>
              <br />
            </>
          )}
          해당 과목을 시간표에서 삭제하시겠습니까?
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

  const [courses, setCourses] = useState([]);
  const { showLoading, hideLoading } = useLoading();

  const [isCourseSheetOpen, setIsCourseSheetOpen] = useState(false);
  const [userName, setUserName] = useState("CAM-PL 사용자");

  // 바텀시트에서 선택된 강의(시간표 미리보기용)
  const [previewCourse, setPreviewCourse] = useState(null);

  // 로그아웃 / 탈퇴 확인 팝업 상태
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);

  // 🔥 삭제 대상(블록 클릭 시 세팅)
  // { itemId, title, timeLabel }
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    if (
      location.state?.openCourseSearchSheet &&
      window.history?.replaceState
    ) {
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
      const list = Array.isArray(data.courses) ? data.courses : [];
      setCourses(list);
    } catch (e) {
      console.error("시간표 불러오기 실패:", e);
      setCourses([]);
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

  // 🔥 시간표 블록 클릭 → 무조건 삭제 모달 오픈
  // block: { itemId, title, timeLabel }
  const handleTimetableBlockClick = (block) => {
    setDeleteTarget({
      itemId: block?.itemId,
      title: block?.title,
      timeLabel: block?.timeLabel,
    });
  };

  // 삭제 팝업 취소
  const handleCancelDelete = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
  };

  // 삭제 팝업 확인 → DELETE /timetable/items/{itemId}
  const handleConfirmDelete = async () => {
    console.log("🗑 삭제 요청 deleteTarget :", deleteTarget);

    // ❗ 네가 말한 대로, 여기서 굳이 막지 않고 일단 API를 날린다
    const itemId = deleteTarget?.itemId;

    setDeleteLoading(true);
    try {
      await api.delete(`/timetable/items/${itemId}`);
      // 성공 시 시간표 다시 불러오기
      await loadTimetable();
    } catch (e) {
      console.error("시간표 과목 삭제 실패:", e);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
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
          courses={courses}
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
        visible={!!deleteTarget}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={deleteTarget?.title}
        timeLabel={deleteTarget?.timeLabel}
      />
    </div>
  );
}
