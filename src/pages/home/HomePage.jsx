// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";

import TimetableMapSection from "./TimetableMapSection";
import TodayLectureList from "./TodayLectureList";
import TodayScheduleList from "./TodayScheduleList";
import StudyPlaceList from "./StudyPlaceList";
import "../../css/home/HomePage.css";
import api from "../../api/axios";

const HomePage = () => {
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

  // 오늘 0시 기준 Date (D-Day 계산용)
  const startOfToday = new Date(year, today.getMonth(), date);

  /* =========================
     1. D-Day용 주요 일정 API 호출
        GET /calendar/events?ym=YYYY-MM
     ========================= */
  useEffect(() => {
    const fetchMainEvents = async () => {
      try {
        // 현재 연/월을 기준으로 ym 파라미터 구성 (예: 2025-12)
        const ym = `${year}-${String(month).padStart(2, "0")}`;

        const res = await api.get("/calendar/events", {
          params: { ym },
        });

        const body = res.data ?? {};
        // 응답이 배열이거나, 객체 안에 events/items 배열이 있을 수 있으니 방어적으로 처리
        const events = Array.isArray(body)
          ? body
          : body.events || body.items || [];

        console.log("main events api raw data:", body);

        // 앞으로 남은 일정들 중 "가장 가까운 일정"을 찾는다.
        let nearest = null;

        events.forEach((item) => {
          // 날짜 필드 추정: date / eventDate / startDate / day 중 하나 사용
          const dateStr =
            item.date || item.eventDate || item.startDate || item.day;

          if (!dateStr) return;

          // "YYYY-MM-DD" 형태라고 가정
          const [yyyy, mm, dd] = dateStr.split("-").map(Number);
          if (!yyyy || !mm || !dd) return;

          const eventDate = new Date(yyyy, mm - 1, dd);
          const diffMs = eventDate.getTime() - startOfToday.getTime();
          const diffDays = Math.ceil(
            diffMs / (1000 * 60 * 60 * 24)
          );

          // 이미 지난 일정은 제외
          if (diffDays < 0) return;

          if (!nearest || diffDays < nearest.diffDays) {
            nearest = { item, diffDays };
          }
        });

        if (nearest) {
          const { item, diffDays } = nearest;

          setDdayInfo({
            // 카드 상단 라벨: API 쪽에 별도 필드가 있으면 그거 쓰고, 없으면 title
            label:
              item.ddayLabel ||
              item.title ||
              item.name ||
              "주요 일정까지",
            // 카드 부제목: 설명/메모/장소 등에서 하나 선택
            sub:
              item.description ||
              item.memo ||
              item.place ||
              item.location ||
              "캠플이 응원할게요!~",
            days: diffDays,
          });
        } else {
          // 이번 달 안에 남은 주요 일정이 없는 경우
          setDdayInfo({
            label: "주요 일정이 없어요",
            sub: "캠플이 응원할게요!~",
            days: 0,
          });
        }
      } catch (error) {
        console.error("주요 일정(D-Day) 조회 실패:", error);
        // 실패 시 기본값 유지
      } finally {
        setDdayLoading(false);
      }
    };

    fetchMainEvents();
  }, [year, month, startOfToday]);

  /* =========================
     2. 오늘의 일정 API 호출
        GET /calendar/summary/today
     ========================= */
  useEffect(() => {
    const fetchTodaySchedules = async () => {
      try {
        const res = await api.get("/calendar/summary/today");
        const body = res.data ?? {};

        // API 응답이 배열일 수도, 객체 안에 리스트일 수도 있으니 방어적으로 처리
        const rawData = Array.isArray(body)
          ? body
          : body.schedules || body.items || [];

        console.log("today schedule api raw data:", body);

        const mapped = rawData.map((item) => ({
          id: item.id,
          // 카테고리: "발표", "팀플" 같은 값 (백엔드 필드명에 맞게 필요시 조정)
          category: item.category || item.type || "일정",
          // 제목
          title: item.title || "",
          // 장소
          place: item.place || item.location || "",
          // 시간: 단일 시간 or 범위
          timeRange:
            item.timeRange ||
            item.time ||
            (item.startTime && item.endTime
              ? `${item.startTime} ~ ${item.endTime}`
              : item.startTime || item.endTime || ""),
        }));

        setTodaySchedules(mapped);
      } catch (error) {
        console.error("오늘의 일정 조회 실패:", error);
        setTodaySchedules([]); // 실패 시 빈 배열
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchTodaySchedules();
  }, []);

  return (
    <div className="home-page">
      {/* 상단 날짜 + D-Day 카드 */}
      <section className="home-top-section">
        <p className="home-date-text">
          오늘은 {month}월 {date}일 {weekday}입니다.
        </p>

        <div className="home-dday-card">
          <div className="home-dday-texts">
            <span className="home-dday-label">
              {ddayInfo.label}
            </span>
            <span className="home-dday-sub">
              {ddayInfo.sub}
            </span>
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

      {/* 지도 / 시간표 (API 호출 + 토글 + 오늘 강의 계산까지 내부에서 처리) */}
      <TimetableMapSection onTodayLecturesChange={setTodayLectures} />

      {/* 오늘의 강의 리스트 (TimetableMapSection에서 내려준 데이터 사용) */}
      <TodayLectureList lectures={todayLectures} />

      {/* 오늘의 일정 리스트 (HomePage에서 API로 불러온 데이터 사용) */}
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
