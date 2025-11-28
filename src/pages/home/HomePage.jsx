// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";

import TimetableMapSection from "./TimetableMapSection";
import TodayLectureList from "./TodayLectureList";
import TodayScheduleList from "./TodayScheduleList";
import StudyPlaceList from "./StudyPlaceList";
import "../../css/home/HomePage.css";
import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx"; // ✅ 전역 로더 훅 추가

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

  // 과제하기 좋은 장소 (프론트 상수)
  const studyPlaces = [
    {
      id: 1,
      name: "프로포즈스페셜티",
      imageUrl: "/images/home/place-1.jpg",
      rating: 4.6,
      distanceText: "도보 5분 (약 340m)",
    },
    {
      id: 2,
      name: "새아기카페",
      imageUrl: "/images/home/place-2.jpg",
      rating: 4.5,
      distanceText: "도보 8분 (약 620m)",
    },
  ];

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
              item.ddayLabel ||
              item.title ||
              item.name ||
              "주요 일정까지",
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
     2. 오늘의 일정 API 호출
        GET /calendar/summary/today
     ========================= */
  useEffect(() => {
    const fetchTodaySchedules = async () => {
      showLoading(); // ✅ 전역 로더 +1
      try {
        const res = await api.get("/calendar/summary/today");
        const body = res.data ?? {};

        // ✅ 응답 구조에 맞게 events 사용
        const rawData = Array.isArray(body) ? body : body.events || [];

        const mapped = rawData.map((item, idx) => ({
          // 해당 API에 id가 없으면 title+time 조합으로 key 대체
          id:
            item.id ??
            `${item.title || "schedule"}-${item.startAt || idx}`,
          // ✅ origin도 함께 넘겨서 "학사" 처리
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

        setTodaySchedules(mapped);
      } catch (error) {
        console.error("오늘의 일정 조회 실패:", error);
        setTodaySchedules([]);
      } finally {
        setScheduleLoading(false);
        hideLoading(); // ✅ 전역 로더 -1
      }
    };

    // 마운트 시 한 번만 호출
    fetchTodaySchedules();
  }, [showLoading, hideLoading]);

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

      {/* 오늘의 강의 리스트 */}
      <TodayLectureList lectures={todayLectures} />

      {/* 오늘의 일정 리스트 */}
      <TodayScheduleList
        schedules={todaySchedules}
        loading={scheduleLoading}
      />

      {/* 과제하기 좋은 장소 추천 리스트 */}
      <StudyPlaceList places={studyPlaces} />
    </div>
  );
};

export default HomePage;
