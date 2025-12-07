// src/components/mypage/MyTimetable.jsx
import React, { useMemo } from "react";
import "../../css/mypage/MyTimetable.css";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS = ["월", "화", "수", "목", "금"];

const START_HOUR = 9; // 9시
const END_HOUR = 18; // 18시(6시)

// 🔥 화면에 보이는 시간칸은 9~6까지 "10칸"이라서 10시간 기준으로 스케일
const TOTAL_MINUTES = (END_HOUR - START_HOUR + 1) * 60; // 10 * 60 = 600

// 왼쪽에 표시할 시간 라벨: 9 ~ 6
const TIME_LABELS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

// "10:00:00" / "10:00" → 분
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// 🔥 실제 시간표 item들로부터 요일별 블록 빌드 (item.id = itemId)
function buildDayColumnsFromItems(items = []) {
  const columns = DAY_ORDER.map(() => []);

  items.forEach((item) => {
    if (!item) return;

    const dayKey = (item.dayOfWeek || "").toUpperCase();
    const dayIndex = DAY_ORDER.indexOf(dayKey);
    if (dayIndex === -1) return;

    const startMinutes = timeToMinutes(item.startTime);
    const endMinutes = timeToMinutes(item.endTime);
    if (startMinutes == null || endMinutes == null) return;

    const minMinutes = START_HOUR * 60;
    const maxMinutes = END_HOUR * 60;

    // 9~18시 범위 안으로 클램프
    const clampedStart = Math.max(startMinutes, minMinutes);
    const clampedEnd = Math.min(endMinutes, maxMinutes);
    if (clampedEnd <= clampedStart) return;

    const topPercent =
      ((clampedStart - minMinutes) / TOTAL_MINUTES) * 100;
    const heightPercent =
      ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100;

    const startLabel = (item.startTime || "").slice(0, 5);
    const endLabel = (item.endTime || "").slice(0, 5);

    columns[dayIndex].push({
      id: item.id, // ✅ timetable itemId
      title: item.courseName || item.title || "",
      room: item.room,
      timeLabel:
        startLabel && endLabel ? `${startLabel} ~ ${endLabel}` : "",
      topPercent,
      heightPercent,
    });
  });

  return columns;
}

// 🔥 미리보기용: /courses 응답의 course 구조로부터 블록 생성
function buildDayColumnsFromCourses(courses = []) {
  const columns = DAY_ORDER.map(() => []);

  courses.forEach((course) => {
    if (!Array.isArray(course.times)) return;

    course.times.forEach((t, idx) => {
      if (!t) return;

      const dayKey = (t.dayOfWeek || "").toUpperCase();
      const dayIndex = DAY_ORDER.indexOf(dayKey);
      if (dayIndex === -1) return;

      const startMinutes = timeToMinutes(t.startTime);
      const endMinutes = timeToMinutes(t.endTime);
      if (startMinutes == null || endMinutes == null) return;

      const minMinutes = START_HOUR * 60;
      const maxMinutes = END_HOUR * 60;

      const clampedStart = Math.max(startMinutes, minMinutes);
      const clampedEnd = Math.min(endMinutes, maxMinutes);
      if (clampedEnd <= clampedStart) return;

      const topPercent =
        ((clampedStart - minMinutes) / TOTAL_MINUTES) * 100;
      const heightPercent =
        ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100;

      const startLabel = (t.startTime || "").slice(0, 5);
      const endLabel = (t.endTime || "").slice(0, 5);

      columns[dayIndex].push({
        id: `${course.id}-${idx}-${t.dayOfWeek}-${t.startTime}`,
        title: course.name,
        room: t.room,
        timeLabel:
          startLabel && endLabel ? `${startLabel} ~ ${endLabel}` : "",
        topPercent,
        heightPercent,
      });
    });
  });

  return columns;
}

export default function MyTimetable({
  items = [],
  previewCourse = null,
  onBlockClick,
}) {
  // 실제 내 시간표 item 기반 블록
  const dayColumns = useMemo(
    () => buildDayColumnsFromItems(items),
    [items]
  );

  // 🔥 선택된 강의 미리보기용 (흐릿한 블록)
  const previewColumns = useMemo(() => {
    if (!previewCourse) {
      return DAY_ORDER.map(() => []);
    }
    return buildDayColumnsFromCourses([previewCourse]);
  }, [previewCourse]);

  const hasAnyLecture = useMemo(
    () => dayColumns.some((blocks) => blocks.length > 0),
    [dayColumns]
  );

  const hasPreview = useMemo(
    () => previewColumns.some((blocks) => blocks.length > 0),
    [previewColumns]
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
              (!hasAnyLecture && !hasPreview
                ? " mypage-timetable-grid-empty"
                : "")
            }
          >
            {DAY_ORDER.map((dayKey, dayIdx) => {
              const blocks = dayColumns[dayIdx] || [];
              const previewBlocks = previewColumns[dayIdx] || [];

              return (
                <div
                  key={dayKey}
                  className="mypage-timetable-day-column"
                >
                  {/* 🔥 선택된 강의 미리보기 (흐릿한 블록) */}
                  {previewBlocks.map((block) => (
                    <div
                      key={`preview-${block.id}`}
                      className="mypage-timetable-preview-block"
                      style={{
                        top: `${block.topPercent}%`,
                        height: `${block.heightPercent}%`,
                      }}
                    />
                  ))}

                  {/* 실제 시간표 강의 블록 (itemId 클릭 가능) */}
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="mypage-timetable-class-block"
                      style={{
                        top: `${block.topPercent}%`,
                        height: `${block.heightPercent}%`,
                      }}
                      onClick={() =>
                        onBlockClick && block.id && onBlockClick(block.id)
                      }
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
              );
            })}

            {/* ✅ 강의도 없고 미리보기도 없을 때만 표시되는 안내 문구 */}
            {!hasAnyLecture && !hasPreview && (
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
