// src/pages/map/MapPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/map/MapPage.css";

import NaverMap from "../../components/home/NaverMap";
import TodayPlaces from "../../components/map/TodayPlacesList";
import ScheduleList from "../../components/map/ScheduleList";
import NearbyPlaces from "../../components/map/NearbyPlaces";
import RecommendModal from "../../components/map/RecommendModal";
import PlaceEventsBar from "../../components/map/PlaceEventsBar";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext";

// ===== 날짜 유틸 =====
// yyyy-MM-DD
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, diff) {
  const d = new Date(date);
  d.setDate(d.getDate() + diff);
  return d;
}

// /calendar/day 응답 정규화
function normalizeDayResponse(res) {
  const body = res.data ?? [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.events)) return body.events;
  if (Array.isArray(body.items)) return body.items;
  return [];
}

// ===== 카테고리/타입 유틸 =====
function getCategoryLabel(category) {
  if (!category) return "일정";

  const korean = [
    "강의",
    "시험",
    "발표",
    "팀플",
    "미팅",
    "과제",
    "식사",
    "휴식",
    "모임",
    "일정",
  ];
  if (korean.includes(category)) return category;

  switch (category) {
    case "LECTURE":
      return "강의";
    case "EXAM":
      return "시험";
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
      return category;
  }
}

// 주변 시설 타입 → 한글 라벨
function getPlaceTypeLabel(type) {
  if (!type) return "";
  switch (type) {
    case "CAFE":
      return "카페";
    case "RESTAURANT":
      return "식당";
    case "STUDY_CAFE":
      return "스터디카페";
    case "ETC":
      return "기타";
    default:
      return type;
  }
}

// 위치 문자열에서 "건물" 이름 비슷한 부분만 추출
function extractPlaceLabel(location) {
  if (!location) return "기타";

  let text = location.trim();

  // 앞에 [H05] 이런 코드 있으면 제거
  text = text.replace(/^\[[^\]]*]\s*/, "");

  // "관"까지 자르기 (예: "건축토목공학관 509" → "건축토목공학관")
  const idx = text.indexOf("관");
  if (idx !== -1) {
    return text.slice(0, idx + 1).trim();
  }

  // 아니면 첫 단어만
  return text.split(" ")[0];
}

// 요일 + 시간 포맷 (슬라이더 카드용)
const DAY_NAMES_SHORT = ["일", "월", "화", "수", "목", "금", "토"];

function formatEventTimeRange(startIso, endIso) {
  if (!startIso) return "";
  const s = new Date(startIso);
  if (Number.isNaN(s.getTime())) return "";

  const e = endIso ? new Date(endIso) : null;

  const toTime = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;

  const weekday = DAY_NAMES_SHORT[s.getDay()];
  const startText = toTime(s);
  const endText = e && !Number.isNaN(e.getTime()) ? toTime(e) : null;

  return endText
    ? `${weekday} ${startText} ~ ${endText}`
    : `${weekday} ${startText}`;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  // 오늘 일정(events + lectures 등 /calendar/day 기준)
  const [todayEvents, setTodayEvents] = useState([]);
  // 지난 일정
  const [yesterdayEvents, setYesterdayEvents] = useState([]);
  // 다음 일정
  const [tomorrowEvents, setTomorrowEvents] = useState([]);

  // /calendar/map 에서 내려오는 주변 시설
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  const [loading, setLoading] = useState(false); // 리스트 섹션 로딩
  const [error, setError] = useState("");

  // 추천 모달 열림 여부
  const [showRecommend, setShowRecommend] = useState(false);

  // 👉 오늘의 일정 칩에서 선택된 건물명
  const [selectedPlace, setSelectedPlace] = useState(null);

  // 오늘 날짜(시분초 0으로 맞춤)
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // 최초 진입 시: 달력(day) + 맵(map) API 같이 호출
  useEffect(() => {
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);

    const fetchDay = (date) =>
      api.get("/calendar/day", { params: { date: formatDateKey(date) } });

    (async () => {
      setLoading(true);
      showLoading();
      setError("");

      try {
        const [resY, resToday, resT, resMap] = await Promise.all([
          fetchDay(yesterday), // 어제 일정
          fetchDay(today), // 오늘 일정
          fetchDay(tomorrow), // 내일 일정
          api.get("/calendar/map/36.690711/126.581783"), // 주변 시설
        ]);

        // 지난/오늘/다음 일정 (달력 API 기준)
        setYesterdayEvents(normalizeDayResponse(resY));
        setTodayEvents(normalizeDayResponse(resToday));
        setTomorrowEvents(normalizeDayResponse(resT));

        // 주변 시설 (맵 API 기준)
        const mapData = resMap.data ?? {};
        const nearby = Array.isArray(mapData.nearbyPlaces)
          ? mapData.nearbyPlaces
          : [];

        setNearbyPlaces(
          nearby.map((p) => ({
            id: p.id,
            name: p.name,
            category: getPlaceTypeLabel(p.type),
            imageUrl: p.imageUrl,
            address: p.address,
            distanceMeters: p.distanceMeters,
          }))
        );
      } catch (e) {
        console.error(e);
        setError("일정 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        hideLoading();
      }
    })();
  }, [today, showLoading, hideLoading]);

  // 오늘 일정 → 장소별 카운트 (칩용)
  const todayPlaceItems = useMemo(() => {
    const map = {};
    todayEvents.forEach((ev) => {
      const location = ev.location || ev.place || ev.room;
      if (!location) return;
      const key = extractPlaceLabel(location);
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .map(([place, count]) => ({ place, count }))
      .sort((a, b) => b.count - a.count);
  }, [todayEvents]);

  // 오늘 일정 → 장소별 이벤트 배열 (슬라이더용)
  const placeEventsMap = useMemo(() => {
    const map = {};
    todayEvents.forEach((ev) => {
      const location = ev.location || ev.place || ev.room;
      if (!location) return;
      const key = extractPlaceLabel(location);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [todayEvents]);

  // 선택된 건물의 일정 카드들
  const selectedPlaceItems = useMemo(() => {
    if (!selectedPlace) return [];
    const list = placeEventsMap[selectedPlace] || [];
    return list.map((ev, idx) => ({
      id: ev.id ?? `${ev.title || "event"}-${ev.startAt}-${idx}`,
      category: getCategoryLabel(ev.category),
      title: ev.title || "",
      timeText: formatEventTimeRange(ev.startAt, ev.endAt),
    }));
  }, [selectedPlace, placeEventsMap]);

  // 지난 / 다음 일정용 리스트
  const prevItems = useMemo(
    () =>
      yesterdayEvents.map((ev, idx) => ({
        id: ev.id ?? `${ev.title || "past"}-${idx}`,
        category: getCategoryLabel(ev.category),
        title: ev.title || "",
      })),
    [yesterdayEvents]
  );

  const nextItems = useMemo(
    () =>
      tomorrowEvents.map((ev, idx) => ({
        id: ev.id ?? `${ev.title || "upcoming"}-${idx}`,
        category: getCategoryLabel(ev.category),
        title: ev.title || "",
      })),
    [tomorrowEvents]
  );

  const handleClickRecommend = () => {
    setShowRecommend(true);
  };

  const handleCloseRecommend = () => {
    setShowRecommend(false);
  };

  // 모달에서 “일정에 추가하기” 눌렀을 때 (기존 로직)
  const handleAddToScheduleFromModal = ({ place, category }) => {
    if (!place) return;

    navigate("/calendar", {
      state: {
        fromPlaceRecommend: {
          location: place.name,
          category,
        },
      },
    });

    setShowRecommend(false);
  };

  // ✅ 주변 시설 카드의 + 버튼 클릭 시
  const handleClickAddPlace = (place) => {
    if (!place) return;

    navigate("/calendar", {
      state: {
        fromPlaceRecommend: {
          // 장소 이름만 넘김 → CalendarPage에서 initialLocation으로 들어감
          location: place.name,
          // category는 넘기지 않으면 CalendarPage에서 기본값("LECTURE") 사용
          // 필요해지면 여기서 "MEETING" 같은 카테고리로 매핑해도 됨.
        },
      },
    });
  };

  // 오늘의 일정 칩 클릭 핸들러
  const handleSelectPlace = (placeName) => {
    setSelectedPlace((prev) => (prev === placeName ? null : placeName));
  };

  return (
    <div className="map-page">
      {/* 상단 네이버 지도 + 건물별 일정 슬라이더 */}
      <div className="map-page-map-wrapper">
        <NaverMap />

        <PlaceEventsBar
          place={selectedPlace}
          items={selectedPlaceItems}
          onClose={() => setSelectedPlace(null)}
        />
      </div>

      {/* 아래 내용 영역 */}
      <div className="map-page-content">
        {/* 오늘의 일정 - 장소 요약 */}
        <TodayPlaces
          items={todayPlaceItems}
          loading={loading}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
        />

        {/* 지난 일정 */}
        <ScheduleList
          title="지난 일정"
          items={prevItems}
          emptyText="지난 일정이 없어요."
        />

        {/* 다음 일정 */}
        <ScheduleList
          title="다음 일정"
          items={nextItems}
          emptyText="다가오는 일정이 없어요."
        />

        {/* 주변 시설 */}
        <NearbyPlaces
          places={nearbyPlaces}
          onClickAdd={handleClickAddPlace}
        />

        {error && <div className="map-page-error">{error}</div>}

        {/* 장소 추천받기 버튼 */}
        <div className="map-page-recommend-wrapper">
          <button
            type="button"
            className="map-page-recommend-button"
            onClick={handleClickRecommend}
          >
            장소 추천받기
          </button>
        </div>
      </div>

      {/* 추천 모달 */}
      <RecommendModal
        visible={showRecommend}
        onClose={handleCloseRecommend}
        onAddToSchedule={handleAddToScheduleFromModal}
      />
    </div>
  );
}
