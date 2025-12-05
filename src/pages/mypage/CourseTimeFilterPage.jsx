import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/CourseTimeFilterPage.css";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOUR = 9;
const END_HOUR = 19; // 9~18시
const HOUR_LABELS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
);

// 분 단위 유틸
const buildSlotsFromSelectedCells = (selectedCells) => {
  const slots = [];
  for (const key of selectedCells) {
    const [dayIndexStr, hourStr] = key.split("-");
    const dayIndex = Number(dayIndexStr);
    const hour = Number(hourStr);
    const day = DAY_LABELS[dayIndex];
    if (!day || Number.isNaN(hour)) continue;

    slots.push({
      day, // "월" ~ "일"
      startMinutes: hour * 60,
      endMinutes: (hour + 1) * 60,
    });
  }
  return slots;
};

// pill에 찍어줄 라벨 만들기
const buildLabelFromSlots = (slots) => {
  if (!slots || slots.length === 0) return "전체";

  const byDay = {};
  slots.forEach((s) => {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  });

  const parts = Object.keys(byDay)
    .sort(
      (a, b) => DAY_LABELS.indexOf(a) - DAY_LABELS.indexOf(b)
    )
    .map((day) => {
      const arr = byDay[day].sort(
        (a, b) => a.startMinutes - b.startMinutes
      );
      const ranges = [];
      let curStart = arr[0].startMinutes;
      let curEnd = arr[0].endMinutes;

      for (let i = 1; i < arr.length; i++) {
        if (arr[i].startMinutes === curEnd) {
          // 연속 시간대면 묶기 (9~10, 10~11 -> 9~11)
          curEnd = arr[i].endMinutes;
        } else {
          ranges.push([curStart, curEnd]);
          curStart = arr[i].startMinutes;
          curEnd = arr[i].endMinutes;
        }
      }
      ranges.push([curStart, curEnd]);

      const rangeText = ranges
        .map(([s, e]) => `${s / 60}~${e / 60}시`)
        .join(", ");
      return `${day} ${rangeText}`;
    });

  return parts.join(" / ");
};

const CourseTimeFilterPage = () => {
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekdayNames = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];
  const weekday = weekdayNames[today.getDay()];

  // 사용자 이름: localStorage.name
  let userName = "사용자";
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("name");
    if (stored) userName = stored;
  }

  // 선택된 칸: "dayIndex-hour" 형태 문자열을 Set으로 관리
  const [selectedCells, setSelectedCells] = useState(
    () => new Set()
  );

  const toggleCell = (dayIndex, hour) => {
    const key = `${dayIndex}-${hour}`;
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const slots = buildSlotsFromSelectedCells(selectedCells);
    const label = buildLabelFromSlots(slots);

    // 시간 필터 정보 저장
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "course_time_filter",
        JSON.stringify({
          slots,
          label,
        })
      );
    }

    // 마이페이지로 이동 + 바텀시트 열도록 state 전달 (경로는 프로젝트에 맞춰 수정)
    navigate("/mypage", {
      state: {
        openCourseSearchSheet: true,
      },
    });
  };

  return (
    <div className="time-filter-page">
      <div className="time-filter-container">
        {/* 상단 인사 + 날짜 + 확인 버튼 */}
        <div className="time-filter-header">
          <div className="time-filter-header-text">
            <p className="time-filter-hello">
              안녕하세요, {userName}님!
            </p>
            <p className="time-filter-date">
              오늘은 {month}월 {date}일 {weekday}입니다.
            </p>
          </div>

          <button
            type="button"
            className="time-filter-confirm-btn"
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>

        {/* 시간표 영역 */}
        <div className="time-filter-timetable">
          {/* 요일 헤더 */}
          <div className="time-filter-days-row">
            <div className="time-filter-day-header-empty" />
            {DAY_LABELS.map((day) => (
              <div
                key={day}
                className="time-filter-day-header-cell"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 시간 + 그리드 */}
          <div className="time-filter-body">
            {/* 왼쪽 시간축 */}
            <div className="time-filter-time-col">
              {HOUR_LABELS.map((h) => (
                <div
                  key={h}
                  className="time-filter-time-label"
                >
                  {h}
                </div>
              ))}
            </div>

            {/* 우측 시간표 그리드 */}
            <div className="time-filter-grid">
              {HOUR_LABELS.map((hour) =>
                DAY_LABELS.map((day, dayIndex) => {
                  const key = `${dayIndex}-${hour}`;
                  const isSelected = selectedCells.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={
                        "time-filter-cell" +
                        (isSelected ? " selected" : "")
                      }
                      onClick={() => toggleCell(dayIndex, hour)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseTimeFilterPage;
