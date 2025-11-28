import React, { useEffect, useMemo, useState } from "react";
import "../css/map/MapPage.css";

import NaverMap from "../components/home/NaverMap";
import TodayPlaces from "../components/map/TodayPlaces";
import ScheduleList from "../components/map/ScheduleList";
import NearbyPlaces from "../components/map/NearbyPlaces";

import api from "../api/axios";

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

// 카테고리 라벨 (캘린더랑 맞춰서 사용)
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

// /calendar/day 응답 정규화
function normalizeDayResponse(res) {
  const body = res.data ?? [];
  return Array.isArray(body) ? body : body.events || body.items || [];
}

export default function MapPage() {
  const [todayEvents, setTodayEvents] = useState([]);
  const [yesterdayEvents, setYesterdayEvents] = useState([]);
  const [tomorrowEvents, setTomorrowEvents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showRecommend, setShowRecommend] = useState(false);

  // 오늘 날짜(시분초 0으로 맞춤)
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // 주변 시설 (임시 더미 데이터)
  const nearbyPlaces = useMemo(
    () => [
      {
        id: 1,
        name: "토프코스페셜티",
        category: "카페",
        imageUrl: "/images/map/nearby-1.jpg",
      },
      {
        id: 2,
        name: "먹거리존",
        category: "식당",
        imageUrl: "/images/map/nearby-2.jpg",
      },
      {
        id: 3,
        name: "카이용스터디라운지",
        category: "스터디카페",
        imageUrl: "/images/map/nearby-3.jpg",
      },
    ],
    []
  );

  // 어제 / 오늘 / 내일 일정 로딩
  useEffect(() => {
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);

    const fetchDay = (date) =>
      api.get("/calendar/day", { params: { date: formatDateKey(date) } });

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [resY, resT, resN] = await Promise.all([
          fetchDay(yesterday),
          fetchDay(today),
          fetchDay(tomorrow),
        ]);

        setYesterdayEvents(normalizeDayResponse(resY));
        setTodayEvents(normalizeDayResponse(resT));
        setTomorrowEvents(normalizeDayResponse(resN));
      } catch (e) {
        console.error(e);
        setError("일정 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [today]);

  // 오늘 일정 → 장소별 카운트
  const todayPlaceItems = useMemo(() => {
    const map = {};
    todayEvents.forEach((ev) => {
      if (!ev.location) return;
      const key = extractPlaceLabel(ev.location);
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .map(([place, count]) => ({ place, count }))
      .sort((a, b) => b.count - a.count);
  }, [todayEvents]);

  // 지난 / 다음 일정용 리스트
  const prevItems = useMemo(
    () =>
      yesterdayEvents.map((ev) => ({
        id: ev.id,
        category: getCategoryLabel(ev.category),
        title: ev.title || "",
      })),
    [yesterdayEvents]
  );

  const nextItems = useMemo(
    () =>
      tomorrowEvents.map((ev) => ({
        id: ev.id,
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

  const handleClickAddPlace = (place) => {
    // 나중에 "즐겨찾기 추가" 같은 기능 붙이면 여기서 처리
    console.log("주변 시설 + 버튼 클릭:", place);
  };

  return (
    <div className="map-page">
      {/* 상단 네이버 지도 */}
      <div className="map-page-map-wrapper">
        <NaverMap />
      </div>

      {/* 아래 내용 영역 */}
      <div className="map-page-content">
        {/* 오늘의 일정 - 장소 요약 */}
        <TodayPlaces items={todayPlaceItems} loading={loading} />

        {/* 지난 일정 (어제) */}
        <ScheduleList
          title="지난 일정"
          items={prevItems}
          emptyText="어제는 등록된 일정이 없어요."
        />

        {/* 다음 일정 (내일) */}
        <ScheduleList
          title="다음 일정"
          items={nextItems}
          emptyText="내일 등록된 일정이 없어요."
        />

        {/* 주변 시설 */}
        <NearbyPlaces places={nearbyPlaces} onClickAdd={handleClickAddPlace} />

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

      {/* 추천 팝업 모달 */}
      {showRecommend && (
        <div
          className="map-recommend-modal-overlay"
          onClick={handleCloseRecommend}
        >
          <div
            className="map-recommend-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="map-recommend-title">장소 추천 준비 중이에요</h3>
            <p className="map-recommend-text">
              시간표와 일정을 기반으로
              <br />
              더 똑똑하게 추천해 줄게요.
            </p>
            <button
              type="button"
              className="map-recommend-close-btn"
              onClick={handleCloseRecommend}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
