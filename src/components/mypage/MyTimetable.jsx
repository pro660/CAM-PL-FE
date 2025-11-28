// src/components/mypage/MyTimetable.jsx
import React, { useMemo } from "react";
import "../../css/mypage/MyTimetable.css";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS = ["월", "화", "수", "목", "금"];

const START_HOUR = 9;   // 9시
const END_HOUR = 18;    // 18시(6시)

// 🔥 화면에 보이는 시간칸은 9~6까지 "10칸"이라서 10시간 기준으로 스케일
const TOTAL_MINUTES = (END_HOUR - START_HOUR + 1) * 60; // 10 * 60 = 600

// 왼쪽에 표시할 시간 라벨: 9 ~ 6
const TIME_LABELS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

function buildDayColumns(courses = []) {
  const columns = DAY_ORDER.map(() => []);

  courses.forEach((course) => {
    if (!Array.isArray(course.times)) return;

    course.times.forEach((t, idx) => {
      const dayIndex = DAY_ORDER.indexOf(t.dayOfWeek);
      if (dayIndex === -1) return;

      const [sh, sm] = t.startTime.split(":").map(Number);
      const [eh, em] = t.endTime.split(":").map(Number);
      if (Number.isNaN(sh) || Number.isNaN(eh)) return;

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      const minMinutes = START_HOUR * 60;
      const maxMinutes = END_HOUR * 60;

      // 9~18시 범위 안으로 클램프
      const clampedStart = Math.max(startMinutes, minMinutes);
      const clampedEnd = Math.min(endMinutes, maxMinutes);
      if (clampedEnd <= clampedStart) return;

      // 🔥 세로 길이 비율(9~6 = 10칸 기준)
      const topPercent =
        ((clampedStart - minMinutes) / TOTAL_MINUTES) * 100;
      const heightPercent =
        ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100;

      columns[dayIndex].push({
        id: `${course.id}-${idx}-${t.dayOfWeek}-${t.startTime}`,
        title: course.name,
        room: t.room,
        timeLabel: `${t.startTime.slice(0, 5)} ~ ${t.endTime.slice(0, 5)}`,
        topPercent,
        heightPercent,
      });
    });
  });

  return columns;
}

export default function MyTimetable({ courses = [] }) {
  const dayColumns = useMemo(() => buildDayColumns(courses), [courses]);

  // ✅ 강의가 하나라도 있는지 여부
  const hasAnyLecture = useMemo(
    () => dayColumns.some((blocks) => blocks.length > 0),
    [dayColumns]
  );

  return (
    <div className="mypage-timetable-card">
      <div className="mypage-timetable">
        {/* 상단 요일 헤더 줄 */}
        <div className="mypage-timetable-header-row">
          <div className="mypage-timetable-header-cell mypage-timetable-header-cell-time" />
          {DAY_LABELS.map((label) => (
            <div key={label} className="mypage-timetable-header-cell">
              {label}
            </div>
          ))}
        </div>

        {/* 본문: 왼쪽 시간축 + 오른쪽 요일 그리드 */}
        <div className="mypage-timetable-body">
          {/* 왼쪽 시간축 */}
          <div className="mypage-timetable-time-col">
            {TIME_LABELS.map((t) => (
              <div key={t} className="mypage-timetable-time-slot">
                {t}
              </div>
            ))}
          </div>

          {/* 오른쪽 5일 그리드 */}
          <div
            className={
              "mypage-timetable-grid" +
              (hasAnyLecture ? "" : " mypage-timetable-grid-empty")
            }
          >
            {dayColumns.map((blocks, dayIdx) => (
              <div
                key={DAY_ORDER[dayIdx]}
                className="mypage-timetable-day-column"
              >
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="mypage-timetable-class-block"
                    style={{
                      top: `${block.topPercent}%`,
                      height: `${block.heightPercent}%`,
                    }}
                  >
                    <div className="mypage-timetable-class-title">
                      {block.title}
                    </div>
                    {block.room && (
                      <div className="mypage-timetable-class-location">
                        {block.room}
                      </div>
                    )}
                    <div className="mypage-timetable-class-time">
                      {block.timeLabel}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* ✅ 강의가 하나도 없을 때 표시되는 안내 문구 */}
            {!hasAnyLecture && (
              <div className="mypage-timetable-empty-text">
                강의를 추가해 나만의 시간표를 만드세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
