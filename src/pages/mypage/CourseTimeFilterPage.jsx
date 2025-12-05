import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/MyTimetable.css"; // 기존 시간표 스타일 재사용
import "../../css/mypage/CourseTimeFilterPage.css";

const DAY_LABELS = ["월", "화", "수", "목", "금"];
// 실제 시간 값(24시간 기준)
const HOUR_VALUES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
// 왼쪽에 보여줄 라벨 (9~6)
const TIME_LABELS_DISPLAY = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

const getUserNameFromCampAuth = () => {
  if (typeof window === "undefined") return "사용자";
  try {
    const raw = window.localStorage.getItem("camp_auth");
    if (!raw) return "사용자";
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === "string" && parsed.name.trim()) {
      return parsed.name.trim();
    }
    return "사용자";
  } catch {
    return "사용자";
  }
};

// 선택한 칸 → slot 배열
const buildSlotsFromSelectedCells = (selectedCells) => {
  const slots = [];
  for (const key of selectedCells) {
    const [dayIndexStr, hourStr] = key.split("-");
    const dayIndex = Number(dayIndexStr);
    const hour = Number(hourStr);
    const day = DAY_LABELS[dayIndex];
    if (!day || Number.isNaN(hour)) continue;

    slots.push({
      day, // "월" ~ "금"
      startMinutes: hour * 60,
      endMinutes: (hour + 1) * 60,
    });
  }
  return slots;
};

const buildLabelFromSlots = (slots) => {
  if (!slots || slots.length === 0) return "전체";

  const byDay = {};
  slots.forEach((s) => {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  });

  const parts = Object.keys(byDay)
    .sort((a, b) => DAY_LABELS.indexOf(a) - DAY_LABELS.indexOf(b))
    .map((day) => {
      const arr = byDay[day].sort(
        (a, b) => a.startMinutes - b.startMinutes
      );
      const ranges = [];
      let curStart = arr[0].startMinutes;
      let curEnd = arr[0].endMinutes;

      for (let i = 1; i < arr.length; i++) {
        if (arr[i].startMinutes === curEnd) {
          // 연속 시간대면 묶기
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

  const userName = useMemo(getUserNameFromCampAuth, []);

  // 선택된 칸: "dayIndex-hourValue" 형태 문자열
  const [selectedCells, setSelectedCells] = useState(() => new Set());

  const toggleCell = (dayIndex, hourValue) => {
    const key = `${dayIndex}-${hourValue}`;
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

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "course_time_filter",
        JSON.stringify({
          slots,
          label,
        })
      );
    }

    navigate("/mypage", {
      state: {
        openCourseSearchSheet: true,
      },
    });
  };

  return (
    <div className="time-filter-page">
      <div className="time-filter-inner">
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

        {/* 시간표 카드 (MyTimetable 레이아웃/색깔 재사용) */}
        <div className="time-filter-timetable-card">
          <div className="mypage-timetable">
            {/* 상단 요일 헤더 줄 */}
            <div className="mypage-timetable-header-row">
              <div className="mypage-timetable-header-cell mypage-timetable-header-cell-time" />
              {DAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="mypage-timetable-header-cell"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 본문: 왼쪽 시간축 + 오른쪽 선택 그리드 */}
            <div className="mypage-timetable-body">
              {/* 왼쪽 시간축 */}
              <div className="mypage-timetable-time-col">
                {TIME_LABELS_DISPLAY.map((t) => (
                  <div
                    key={t}
                    className="mypage-timetable-time-slot"
                  >
                    {t}
                  </div>
                ))}
              </div>

              {/* 오른쪽 5일 선택 그리드 */}
              <div className="time-filter-grid">
                {DAY_LABELS.map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="time-filter-day-column"
                  >
                    {HOUR_VALUES.map((hour) => {
                      const key = `${dayIdx}-${hour}`;
                      const isSelected = selectedCells.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          className={
                            "time-filter-slot" +
                            (isSelected ? " selected" : "")
                          }
                          onClick={() =>
                            toggleCell(dayIdx, hour)
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseTimeFilterPage;
