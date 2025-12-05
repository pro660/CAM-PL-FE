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

// ===== 공통 유틸 =====

// "제목"으로 쓸 문자열 통합: title > courseName > name
function getEventTitle(ev) {
  if (!ev) return "";
  return ev.title || ev.courseName || ev.name || "";
}

// 위치 문자열 통합
function getEventLocation(ev) {
  if (!ev) return "";
  return ev.location || ev.place || ev.room || "";
}

// 카테고리 키 추출 (강의 객체도 LECTURE로 취급)
function getEventCategoryKey(ev) {
  if (!ev) return null;
  if (ev.category) return ev.category;
  if (ev.courseName) return "LECTURE";
  return null;
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

// 🔴 정적 기본 중심 좌표 (빨간 마커 위치)
const STATIC_CENTER = { lat: 36.690711, lng: 126.581783 };

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

  // 오늘 일정(칩/슬라이더에 쓸 전체 일정)
  const [todayEvents, setTodayEvents] = useState([]);
  // "지난 일정" (같은 날 안에서 이미 지난 것들)
  const [yesterdayEvents, setYesterdayEvents] = useState([]);
  // "다음 일정" (같은 날 안에서 앞으로 남은 것들)
  const [tomorrowEvents, setTomorrowEvents] = useState([]);

  // /calendar/map 에서 내려오는 주변 시설
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  // /calendar/map 에서 내려오는 장소별 마커
  const [mapMarkers, setMapMarkers] = useState([]);

  const [loading, setLoading] = useState(false); // 리스트 섹션 로딩
  const [error, setError] = useState("");

  // 추천 모달 열림 여부
  const [showRecommend, setShowRecommend] = useState(false);

  // 👉 오늘의 일정 칩/마커에서 선택된 장소 "키" (extractPlaceLabel 기준)
  const [selectedPlace, setSelectedPlace] = useState(null);

  // ✅ 지도 중심 상태 (초기값: 정적 빨간 마커 위치)
  const [mapCenter, setMapCenter] = useState(STATIC_CENTER);

  // 최초 진입 시: /calendar/map 만 호출
  useEffect(() => {
    (async () => {
      setLoading(true);
      showLoading();
      setError("");

      try {
        // 🔴 여기 좌표도 네가 준 걸 사용 중
        const res = await api.get("/calendar/map/36.690711/126.581783");
        const data = res.data ?? {};

        const baseEvents = Array.isArray(data.events) ? data.events : [];
        const lectures = Array.isArray(data.lectures) ? data.lectures : [];
        const pastEvents = Array.isArray(data.pastEvents)
          ? data.pastEvents
          : [];
        const upcomingEvents = Array.isArray(data.upcomingEvents)
          ? data.upcomingEvents
          : [];

        // ✅ 오늘의 일정(칩/슬라이더용) = 같은 날의 전체 일정(중복 제거)
        const mergedSource = [
          ...baseEvents,
          ...lectures,
          ...pastEvents,
          ...upcomingEvents,
        ];

        const seen = new Set();
        const mergedToday = [];

        mergedSource.forEach((raw, idx) => {
          if (!raw) return;

          const title = getEventTitle(raw);
          if (!title) return;

          const startAt = raw.startAt || raw.startTime || "";
          const dedupKey = `${title}|${startAt || idx}`;

          if (seen.has(dedupKey)) return;
          seen.add(dedupKey);

          mergedToday.push({
            ...raw,
            _displayTitle: title,
            _displayLocation: getEventLocation(raw),
          });
        });

        setTodayEvents(mergedToday);

        // ✅ 지난 일정 / 다음 일정
        setYesterdayEvents(pastEvents);
        setTomorrowEvents(upcomingEvents);

        // ✅ 주변 시설
        const nearby = Array.isArray(data.nearbyPlaces)
          ? data.nearbyPlaces
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

        // ✅ 지도용 placeMarkers
        const rawMarkers = Array.isArray(data.placeMarkers)
          ? data.placeMarkers
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

        setMapMarkers(parsedMarkers);
      } catch (e) {
        console.error(e);
        setError("일정 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        hideLoading();
      }
    })();
  }, [showLoading, hideLoading]);

  // 오늘 일정 → 장소별 카운트 (칩용)
  const todayPlaceItems = useMemo(() => {
    const map = {};
    todayEvents.forEach((ev) => {
      const title = ev._displayTitle || getEventTitle(ev);
      if (!title) return;

      const location = ev._displayLocation || getEventLocation(ev);
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
      const title = ev._displayTitle || getEventTitle(ev);
      if (!title) return;

      const location = ev._displayLocation || getEventLocation(ev);
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
    return list.map((ev, idx) => {
      const title = ev._displayTitle || getEventTitle(ev);
      const categoryKey = getEventCategoryKey(ev);

      return {
        id: ev.id ?? `${title || "event"}-${ev.startAt}-${idx}`,
        category: getCategoryLabel(categoryKey),
        title,
        timeText: formatEventTimeRange(ev.startAt, ev.endAt),
      };
    });
  }, [selectedPlace, placeEventsMap]);

  // 지난 / 다음 일정용 리스트
  const prevItems = useMemo(
    () =>
      yesterdayEvents.reduce((acc, ev, idx) => {
        const title = getEventTitle(ev);
        if (!title) return acc;

        const categoryKey = getEventCategoryKey(ev);
        acc.push({
          id: ev.id ?? `${title || "past"}-${idx}`,
          category: getCategoryLabel(categoryKey),
          title,
        });
        return acc;
      }, []),
    [yesterdayEvents]
  );

  const nextItems = useMemo(
    () =>
      tomorrowEvents.reduce((acc, ev, idx) => {
        const title = getEventTitle(ev);
        if (!title) return acc;

        const categoryKey = getEventCategoryKey(ev);
        acc.push({
          id: ev.id ?? `${title || "upcoming"}-${idx}`,
          category: getCategoryLabel(categoryKey),
          title,
        });
        return acc;
      }, []),
    [tomorrowEvents]
  );

  // ✅ 현재 선택된 장소 키와 일치하는 마커 찾기
  const selectedPlaceMarker = useMemo(() => {
    if (!selectedPlace) return null;
    return mapMarkers.find((m) => m.placeKey === selectedPlace) || null;
  }, [selectedPlace, mapMarkers]);

  // ✅ 선택된 장소가 바뀔 때마다 지도 중심도 해당 장소로 이동
  useEffect(() => {
    if (selectedPlaceMarker) {
      setMapCenter({
        lat: selectedPlaceMarker.lat,
        lng: selectedPlaceMarker.lng,
      });
    }
  }, [selectedPlaceMarker]);

  const handleClickRecommend = () => {
    setShowRecommend(true);
  };

  const handleCloseRecommend = () => {
    setShowRecommend(false);
  };

  // 모달에서 “일정에 추가하기” 눌렀을 때
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
          location: place.name,
        },
      },
    });
  };

  // 오늘의 일정 칩 클릭 핸들러
  const handleSelectPlace = (placeName) => {
    setSelectedPlace((prev) => (prev === placeName ? null : placeName));
  };

  // ✅ 마커 클릭 시 → 해당 placeKey 선택
  const handleMarkerClick = (marker) => {
    if (!marker?.placeKey) return;
    setSelectedPlace((prev) =>
      prev === marker.placeKey ? null : marker.placeKey
    );
  };

  // ✅ 오른쪽 하단 동그란 버튼 클릭 → 정적 "사용자 위치(빨간 마커)"로 지도 중심 이동
  const handleRecenterToUser = () => {
    setSelectedPlace(null); // 선택 해제
    setMapCenter(STATIC_CENTER); // 빨간 마커 위치로 중앙 이동
  };

  return (
    <div className="map-page">
      {/* 상단 네이버 지도 + 건물별 일정 슬라이더 */}
      <div className="map-page-map-wrapper">
        <NaverMap
          markers={mapMarkers}
          center={mapCenter}
          onMarkerClick={handleMarkerClick}
        />

        <PlaceEventsBar
          place={selectedPlace}
          items={selectedPlaceItems}
          onClose={() => setSelectedPlace(null)}
        />

        {/* 🔘 오른쪽 하단 현재 위치(빨간 마커)로 이동 버튼 */}
        <button
          type="button"
          className="map-page-location-fab"
          onClick={handleRecenterToUser}
          aria-label="현재 위치로 이동"
        >
          <span className="map-page-location-fab-dot" />
        </button>
      </div>

      {/* 아래 내용 영역 */}
      <div className="map-page-content">
        <TodayPlaces
          items={todayPlaceItems}
          loading={loading}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
        />

        <ScheduleList
          title="지난 일정"
          items={prevItems}
          emptyText="지난 일정이 없어요."
        />

        <ScheduleList
          title="다음 일정"
          items={nextItems}
          emptyText="다가오는 일정이 없어요."
        />

        <NearbyPlaces
          places={nearbyPlaces}
          onClickAdd={handleClickAddPlace}
        />

        {error && <div className="map-page-error">{error}</div>}

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

      <RecommendModal
        visible={showRecommend}
        onClose={handleCloseRecommend}
        onAddToSchedule={handleAddToScheduleFromModal}
      />
    </div>
  );
}
