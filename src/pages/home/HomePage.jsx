// src/pages/home/HomePage.jsx
import React, { useState, useEffect } from "react";

import TimetableMapSection from "./TimetableMapSection";
import TodayLectureList from "./TodayLectureList";
import TodayScheduleList from "./TodayScheduleList";
import StudyPlaceList from "./StudyPlaceList";
import "../../css/home/HomePage.css";
import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";
import PlaceDetailModal from "../../components/home/PlaceDetailModal.jsx";

// 🔴 위치 기반이 아니라, 항상 같은 캠퍼스 좌표를 사용
const STATIC_LAT = 36.690711;
const STATIC_LON = 126.581783;

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

// "D-1", "D-8" → 1, 8 같은 숫자만 뽑기 (파싱 실패 시 null)
function parseDDayValue(dDayStr) {
  if (typeof dDayStr !== "string") return null;
  const match = dDayStr.match(/-?\d+/);
  if (!match) return null;
  const num = Number(match[0]);
  if (Number.isNaN(num)) return null;
  return Math.abs(num);
}

// 숫자형 D-Day → 표시용 텍스트 ("D-3" / "D-DAY")
function formatDDayTextFromNumber(dayValue) {
  if (dayValue <= 0) return "D-DAY";
  return `D-${dayValue}`;
}

// 위치 문자열에서 "건물" 이름 비슷한 부분만 추출
// 예: "[H05] 건축토목공학관 612" → "건축토목공학관"
function extractPlaceLabel(location) {
  if (!location) return "";
  let text = location.trim();

  // 앞에 [H05] 이런 코드 있으면 제거
  text = text.replace(/^\[[^\]]*]\s*/, "");

  // "관"까지 자르기
  const idx = text.indexOf("관");
  if (idx !== -1) {
    return text.slice(0, idx + 1).trim();
  }

  // 아니면 첫 단어만
  return text.split(" ")[0];
}

const HomePage = () => {
  const { showLoading, hideLoading } = useLoading();

  // TimetableMapSection에서 내려주는 오늘의 강의 리스트
  const [todayLectures, setTodayLectures] = useState([]);

  // 오늘의 일정 리스트 + 로딩 상태
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  // 🔥 D-Day 목록 + 로딩 상태
  //   ddayList: { id, label, days }[]
  const [ddayList, setDdayList] = useState([]);
  const [ddayCurrentIndex, setDdayCurrentIndex] = useState(0);
  const [ddayLoading, setDdayLoading] = useState(true);

  // 과제하기 좋은 장소 추천 리스트 + 로딩 상태
  const [studyPlaces, setStudyPlaces] = useState([]);
  const [studyPlacesLoading, setStudyPlacesLoading] = useState(true);

  // ✅ 선택된 장소 (팝업용)
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  // ✅ 홈 상단 지도에 사용할 마커들
  const [homeMapMarkers, setHomeMapMarkers] = useState([]);
  // ✅ 장소별 일정(강의/일정) 맵 → 지도에서 마커 클릭 시 쓸 데이터
  const [homePlaceEventsMap, setHomePlaceEventsMap] = useState({});

  // 오늘 날짜/요일 계산
  const today = new Date();
  const month = today.getMonth() + 1;
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

  // 🔥 D-Day 현재 아이템
  const hasImportantDday = ddayList.length > 0;
  const currentDdayItem =
    hasImportantDday && ddayList.length > 0
      ? ddayList[ddayCurrentIndex % ddayList.length]
      : null;

  /* =========================
     1. 오늘의 일정 + 중요 D-Day + 과제하기 좋은 장소 + 홈 지도 마커
        GET /calendar/summary/today?lat=&lon=
        🔴 사용자 위치와 상관없이 STATIC_LAT / STATIC_LON 사용
     ========================= */
  useEffect(() => {
    const fetchTodaySummary = async () => {
      showLoading();
      setScheduleLoading(true);
      setStudyPlacesLoading(true);
      setDdayLoading(true);

      try {
        const res = await api.get("/calendar/summary/today", {
          params: {
            lat: STATIC_LAT,
            lon: STATIC_LON,
          },
        });

        const body = res.data ?? {};

        // ===== 오늘의 일정 목록 파싱 (리스트용) =====
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

        // ===== 중요 일정 D-DAY (ddays) 처리 =====
        const rawDd = Array.isArray(body.ddays) ? body.ddays : [];

        const withParsed = rawDd
          .map((d, index) => ({
            ...d,
            _order: index,
            _dValue: parseDDayValue(d.dDay),
          }))
          .filter((d) => d._dValue !== null);

        if (withParsed.length > 0) {
          // 1단계: 0~5일 이내 일정만 우선
          let candidate = withParsed.filter(
            (d) => d._dValue >= 0 && d._dValue <= 5
          );

          // 2단계: 5일 이내가 하나도 없으면 전체 사용
          if (candidate.length === 0) {
            candidate = withParsed;
          }

          // 3단계: 가장 가까운 일정 순으로 정렬
          candidate.sort((a, b) => {
            if (a._dValue !== b._dValue) {
              return a._dValue - b._dValue;
            }
            return a._order - b._order;
          });

          const mappedDdays = candidate.map((d, idx) => ({
            id: d.id ?? `dday-${idx}`,
            label: d.title || "중요 일정",
            days: d._dValue != null ? d._dValue : 0,
          }));

          setDdayList(mappedDdays);
          setDdayCurrentIndex(0);
        } else {
          setDdayList([]);
          setDdayCurrentIndex(0);
        }

        // ===== 과제하기 좋은 장소 추천 리스트 파싱 =====
        const rawPlaces = Array.isArray(body.studyPlaces)
          ? body.studyPlaces
          : Array.isArray(body.places)
          ? body.places
          : Array.isArray(body.recommendedPlaces)
          ? body.recommendedPlaces
          : [];

        setStudyPlaces(rawPlaces);

        // ===== 홈 상단 지도용 placeMarkers 파싱 =====
        const rawMarkers = Array.isArray(body.placeMarkers)
          ? body.placeMarkers
          : [];

        const parsedMarkers = rawMarkers
          .filter(
            (m) =>
              typeof m.latitude === "number" &&
              typeof m.longitude === "number"
          )
          .map((m, idx) => {
            const placeKey = extractPlaceLabel(m.name);
            return {
              id: m.name ? `${m.name}-${idx}` : `marker-${idx}`,
              name: m.name,
              placeKey,
              lat: m.latitude,
              lng: m.longitude,
              count: m.count,
            };
          });

        setHomeMapMarkers(parsedMarkers);

        // ===== 장소별 일정(강의 + 이벤트) 맵 생성 =====
        const lectures = Array.isArray(body.lectures) ? body.lectures : [];
        const eventsForPlaces = Array.isArray(body.events)
          ? body.events
          : [];

        const placeEventsTmp = {};

        // 강의 → placeKey 기준으로 묶기
        lectures.forEach((lec, idx) => {
          const loc = lec.location;
          if (!loc || !lec.courseName) return;
          const placeKey = extractPlaceLabel(loc);
          if (!placeKey) return;

          if (!placeEventsTmp[placeKey]) placeEventsTmp[placeKey] = [];
          placeEventsTmp[placeKey].push({
            id: `lecture-${idx}`,
            category: "강의",
            title: lec.courseName,
            timeText: formatTimeRange(lec.startAt, lec.endAt),
          });
        });

        // 일반 일정 → placeKey 기준으로 묶기
        eventsForPlaces.forEach((ev, idx) => {
          if (!ev.location || !ev.title) return;
          const placeKey = extractPlaceLabel(ev.location);
          if (!placeKey) return;

          if (!placeEventsTmp[placeKey]) placeEventsTmp[placeKey] = [];
          placeEventsTmp[placeKey].push({
            id: ev.id ?? `event-${idx}`,
            category: getCategoryLabel(ev.category, ev.origin),
            title: ev.title,
            timeText: formatTimeRange(ev.startAt, ev.endAt),
          });
        });

        setHomePlaceEventsMap(placeEventsTmp);
      } catch (error) {
        console.error("오늘 요약(일정/장소) 조회 실패:", error);
        setTodaySchedules([]);
        setStudyPlaces([]);
        setHomeMapMarkers([]);
        setHomePlaceEventsMap({});
        setDdayList([]);
        setDdayCurrentIndex(0);
      } finally {
        setScheduleLoading(false);
        setStudyPlacesLoading(false);
        setDdayLoading(false);
        hideLoading();
      }
    };

    // 🔴 더 이상 coords 의존 X, 항상 STATIC_LAT/LON 기준으로 호출
    fetchTodaySummary();
  }, [showLoading, hideLoading]);

  /* =========================
     2. D-Day 여러 개일 때 5초마다 순환
     ========================= */
  useEffect(() => {
    if (ddayLoading) return;
    if (ddayList.length <= 1) return;

    const interval = setInterval(() => {
      setDdayCurrentIndex((prev) =>
        ddayList.length === 0 ? 0 : (prev + 1) % ddayList.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [ddayLoading, ddayList.length]);

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
            {/* 제목 슬라이드 영역 */}
            <div className="home-dday-label-viewport">
              {ddayLoading ? (
                <span className="home-dday-label home-dday-label-line">
                  중요 일정 불러오는 중...
                </span>
              ) : !hasImportantDday ? (
                <span className="home-dday-label home-dday-label-line">
                  중요 일정이 없어요
                </span>
              ) : (
                <div
                  className="home-dday-label-inner"
                  style={{
                    transform: `translateY(-${ddayCurrentIndex * 100}%)`,
                    transition:
                      ddayList.length > 1 ? "transform 0.35s ease" : "none",
                  }}
                >
                  {ddayList.map((item) => (
                    <span
                      key={item.id}
                      className="home-dday-label home-dday-label-line"
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span className="home-dday-sub">캠플이 응원할게요!~</span>
          </div>

          {/* D-Day 숫자 슬라이드 영역 */}
          <div className="home-dday-value">
            {ddayLoading ? (
              <span className="home-dday-number">D-...</span>
            ) : hasImportantDday && currentDdayItem ? (
              <div className="home-dday-number-viewport">
                <div
                  className="home-dday-number-inner"
                  style={{
                    transform: `translateY(-${ddayCurrentIndex * 100}%)`,
                    transition:
                      ddayList.length > 1 ? "transform 0.35s ease" : "none",
                  }}
                >
                  {ddayList.map((item) => (
                    <span
                      key={item.id}
                      className="home-dday-number home-dday-number-line"
                    >
                      {formatDDayTextFromNumber(item.days)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 지도 / 시간표 */}
      <TimetableMapSection
        onTodayLecturesChange={setTodayLectures}
        markers={homeMapMarkers}
        placeEventsMap={homePlaceEventsMap}
      />

      {/* 오늘의 강의 리스트 */}
      <TodayLectureList lectures={todayLectures} />

      {/* 오늘의 일정 리스트 */}
      <TodayScheduleList
        schedules={todaySchedules}
        loading={scheduleLoading}
      />

      {/* 과제하기 좋은 장소 추천 리스트 */}
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
