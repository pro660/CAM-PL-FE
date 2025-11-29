// src/pages/home/HomePage.jsx
import React, { useState, useEffect } from "react";

import TimetableMapSection from "./TimetableMapSection";
import TodayLectureList from "./TodayLectureList";
import TodayScheduleList from "./TodayScheduleList";
import StudyPlaceList from "./StudyPlaceList";
import "../../css/home/HomePage.css";
import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx"; // ✅ 전역 로더 훅 추가
import PlaceDetailModal from "../../components/home/PlaceDetailModal.jsx";

// ✅ 사용자 기준 위치 기본값 (캠퍼스 좌표, 위치 권한 거부 시 사용)
const DEFAULT_LAT = 36.691274;
const DEFAULT_LON = 126.584492;

// 카테고리 한글 라벨링 (캘린더랑 맞추기)
function getCategoryLabel(category, origin) {
  // ✅ 학교 일정(origin = SCHOOL)은 무조건 "학사"로 표시
  if (origin === "SCHOOL") {
    return "학사";
  }

  switch (category) {
    case "LECTURE":
      return "강의";
    case "PRESENTATION":
      return "발표";
    case "TEAM":
      return "팀플";
    case "MEETING":
      return "미팅";
    case "ASSIGNMENT":
      return "과제";
    case "MEAL":
      return "식사";
    case "REST":
      return "휴식";
    case "GATHERING":
      return "모임";
    default:
      return "일정";
  }
}

// "2025-11-23T10:00:00" → "10:00 ~ 11:00"
function formatTimeRange(startIso, endIso) {
  if (!startIso || !endIso) return "";
  const s = new Date(startIso);
  const e = new Date(endIso);

  const toTime = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;

  return `${toTime(s)} ~ ${toTime(e)}`;
}

const HomePage = () => {
  const { showLoading, hideLoading } = useLoading(); // ✅ 전역 로더 제어

  // TimetableMapSection에서 내려주는 오늘의 강의 리스트
  const [todayLectures, setTodayLectures] = useState([]);

  // 오늘의 일정 리스트 + 로딩 상태
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  // D-Day 정보 + 로딩 상태
  const [ddayInfo, setDdayInfo] = useState({
    label: "주요 일정까지",
    sub: "캠플이 응원할게요!~",
    days: 0,
  });
  const [ddayLoading, setDdayLoading] = useState(true);

  // 과제하기 좋은 장소 추천 리스트 + 로딩 상태
  const [studyPlaces, setStudyPlaces] = useState([]);
  const [studyPlacesLoading, setStudyPlacesLoading] = useState(true);

  // ✅ 선택된 장소 (팝업용)
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  // ✅ 사용자 좌표 (기본값은 캠퍼스)
  const [coords, setCoords] = useState({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
  });

  // 오늘 날짜/요일 계산
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 실제 월 (1~12)
  const date = today.getDate();
  const weekdayNamesFull = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];
  const weekday = weekdayNamesFull[today.getDay()];

  /* =========================
     0. 브라우저에서 현재 위치 가져오기
        - 성공: 사용자 좌표로 업데이트
        - 실패/거부/미지원: 기본 캠퍼스 좌표 그대로 사용
     ========================= */
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("Geolocation not supported; using default coords.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({
          lat: latitude,
          lon: longitude,
        });
      },
      (error) => {
        console.warn("Geolocation error; using default coords.", error);
        // 실패해도 DEFAULT_LAT / DEFAULT_LON 그대로 사용
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000 * 60 * 10,
      }
    );
  }, []);

  /* =========================
     1. D-Day용 주요 일정 API 호출
        GET /calendar/events?ym=YYYY-MM
     ========================= */
  useEffect(() => {
    const fetchMainEvents = async () => {
      showLoading(); // ✅ 전역 로더 +1
      try {
        const startOfToday = new Date(year, today.getMonth(), date);

        // 현재 연/월을 기준으로 ym 파라미터 구성 (예: 2025-12)
        const ym = `${year}-${String(month).padStart(2, "0")}`;

        const res = await api.get("/calendar/events", {
          params: { ym },
        });

        const body = res.data ?? {};
        const events = Array.isArray(body)
          ? body
          : body.events || body.items || [];

        // 앞으로 남은 일정들 중 "가장 가까운 일정"을 찾는다.
        let nearest = null;

        events.forEach((item) => {
          // 날짜 필드 추정: startAt 기준으로 YYYY-MM-DD 부분만 사용
          const dateStr =
            item.date ||
            item.eventDate ||
            item.startDate ||
            item.day ||
            (item.startAt ? item.startAt.slice(0, 10) : null);

          if (!dateStr) return;

          const [yyyy, mm, dd] = dateStr.split("-").map(Number);
          if (!yyyy || !mm || !dd) return;

          const eventDate = new Date(yyyy, mm - 1, dd);
          const diffMs = eventDate.getTime() - startOfToday.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          // 이미 지난 일정은 제외
          if (diffDays < 0) return;

          if (!nearest || diffDays < nearest.diffDays) {
            nearest = { item, diffDays };
          }
        });

        if (nearest) {
          const { item, diffDays } = nearest;

          setDdayInfo({
            label:
              item.ddayLabel || item.title || item.name || "주요 일정까지",
            sub:
              item.description ||
              item.memo ||
              item.place ||
              item.location ||
              "캠플이 응원할게요!~",
            days: diffDays,
          });
        } else {
          setDdayInfo({
            label: "주요 일정이 없어요",
            sub: "캠플이 응원할게요!~",
            days: 0,
          });
        }
      } catch (error) {
        console.error("주요 일정(D-Day) 조회 실패:", error);
      } finally {
        setDdayLoading(false);
        hideLoading(); // ✅ 전역 로더 -1
      }
    };

    fetchMainEvents();
    // 홈 진입 시 한 번만 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ 날짜 변하게 되면 그때 로직 따로 잡는 게 좋고, 지금은 첫 진입 기준

  /* =========================
     2. 오늘의 일정 + 과제하기 좋은 장소 추천
        GET /calendar/summary/today?lat=&lon=
        - coords(lat, lon)이 바뀔 때마다 호출
        - 초기: 캠퍼스 좌표로 한 번
        - 위치 허용 시: 사용자 좌표로 한 번 더
     ========================= */
  useEffect(() => {
    const fetchTodaySummary = async () => {
      showLoading(); // ✅ 전역 로더 +1
      setScheduleLoading(true);
      setStudyPlacesLoading(true);

      try {
        const res = await api.get("/calendar/summary/today", {
          params: {
            lat: coords.lat,
            lon: coords.lon,
          },
        });

        const body = res.data ?? {};

        // ===== 오늘의 일정 목록 파싱 =====
        const rawEvents = Array.isArray(body)
          ? body
          : Array.isArray(body.events)
          ? body.events
          : Array.isArray(body.schedules)
          ? body.schedules
          : Array.isArray(body.todaySchedules)
          ? body.todaySchedules
          : [];

        const mappedSchedules = rawEvents.map((item, idx) => ({
          // id 없으면 title+time 조합으로 대체
          id:
            item.id ??
            `${item.title || "schedule"}-${
              item.startAt || item.startTime || idx
            }`,
          category: getCategoryLabel(
            item.category || item.type,
            item.origin
          ),
          title: item.title || "",
          place: item.place || item.location || "",
          timeRange:
            item.timeRange ||
            item.time ||
            (item.startAt && item.endAt
              ? formatTimeRange(item.startAt, item.endAt)
              : item.startTime && item.endTime
              ? `${item.startTime} ~ ${item.endTime}`
              : ""),
        }));

        setTodaySchedules(mappedSchedules);

        // ===== 과제하기 좋은 장소 추천 리스트 파싱 =====
        const rawPlaces = Array.isArray(body.studyPlaces)
          ? body.studyPlaces
          : Array.isArray(body.places)
          ? body.places
          : Array.isArray(body.recommendedPlaces)
          ? body.recommendedPlaces
          : [];

        setStudyPlaces(rawPlaces);
      } catch (error) {
        console.error("오늘 요약(일정/장소) 조회 실패:", error);
        setTodaySchedules([]);
        setStudyPlaces([]);
      } finally {
        setScheduleLoading(false);
        setStudyPlacesLoading(false);
        hideLoading(); // ✅ 전역 로더 -1
      }
    };

    // coords(lat/lon)가 준비될 때마다 호출
    fetchTodaySummary();
  }, [coords.lat, coords.lon, showLoading, hideLoading]);

  const handlePlaceClick = (placeId) => {
    setSelectedPlaceId(placeId);
  };

  const handleClosePlaceModal = () => {
    setSelectedPlaceId(null);
  };

  return (
    <div className="home-page">
      {/* 상단 날짜 + D-Day 카드 */}
      <section className="home-top-section">
        <p className="home-date-text">
          오늘은 {month}월 {date}일 {weekday}입니다.
        </p>

        <div className="home-dday-card">
          <div className="home-dday-texts">
            <span className="home-dday-label">{ddayInfo.label}</span>
            <span className="home-dday-sub">{ddayInfo.sub}</span>
          </div>
          <div className="home-dday-value">
            <span className="home-dday-number">
              {ddayLoading
                ? "D-..."
                : `D-${ddayInfo.days > 0 ? ddayInfo.days : 0}`}
            </span>
          </div>
        </div>
      </section>

      {/* 지도 / 시간표 */}
      <TimetableMapSection onTodayLecturesChange={setTodayLectures} />

      {/* 오늘의 강의 리스트 (시간표에서 내려주는 것 그대로 사용) */}
      <TodayLectureList lectures={todayLectures} />

      {/* 오늘의 일정 리스트 (요약 API 결과) */}
      <TodayScheduleList
        schedules={todaySchedules}
        loading={scheduleLoading}
      />

      {/* 과제하기 좋은 장소 추천 리스트 (요약 API 결과) */}
      <StudyPlaceList
        places={studyPlaces}
        loading={studyPlacesLoading}
        onPlaceClick={handlePlaceClick}
      />

      {/* 장소 상세 팝업 */}
      {selectedPlaceId && (
        <PlaceDetailModal
          placeId={selectedPlaceId}
          onClose={handleClosePlaceModal}
        />
      )}
    </div>
  );
};

export default HomePage;
