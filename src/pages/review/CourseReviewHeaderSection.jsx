import React, { useMemo } from "react";
import "../../css/review/CourseReviewHeaderSection.css";
import StarRatingDisplay from "../../components/review/StarRatingDisplay.jsx";

/** 요일 영문 → 한글 */
const mapDayToKor = (dayOfWeek) => {
  if (!dayOfWeek) return "";
  const d = dayOfWeek.toUpperCase();
  switch (d) {
    case "MONDAY":
    case "MON":
      return "월요일";
    case "TUESDAY":
    case "TUE":
      return "화요일";
    case "WEDNESDAY":
    case "WED":
      return "수요일";
    case "THURSDAY":
    case "THU":
      return "목요일";
    case "FRIDAY":
    case "FRI":
      return "금요일";
    case "SATURDAY":
    case "SAT":
      return "토요일";
    case "SUNDAY":
    case "SUN":
      return "일요일";
    default:
      return dayOfWeek;
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hh = String(Number(h) || 0).padStart(2, "0");
  const mm = String(Number(m) || 0).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatCourseTime = (times = []) => {
  if (!times.length) return "-";
  return times
    .map((t) => {
      const day = mapDayToKor(t.dayOfWeek);
      const start = formatTime(t.startTime);
      const end = formatTime(t.endTime);
      return `${day} ${start}~${end}`;
    })
    .join(", ");
};

export default function CourseReviewHeaderSection({ course }) {
  const {
    name,
    professor,
    year,
    courseCode,
    section,
    times,
    ratingAvg,
    ratingCount,
  } = course || {};

  const avgText = useMemo(
    () =>
      typeof ratingAvg === "number"
        ? Math.max(0, Math.min(5, ratingAvg)).toFixed(1)
        : "0.0",
    [ratingAvg]
  );

  const ratingCountText = useMemo(
    () => `(${ratingCount || 0}개)`,
    [ratingCount]
  );

  const timeText = useMemo(() => formatCourseTime(times || []), [times]);
  const roomText = useMemo(
    () => (times && times[0]?.room) || "-",
    [times]
  );

  const courseCodeText = courseCode
    ? section
      ? `${courseCode}-${section}`
      : courseCode
    : "-";

  return (
    <section className="cr-header-wrapper">
      <div className="cr-header-inner">
        {/* 과목명 + 평균 별점 */}
        <div className="cr-header-title-block">
          <h2 className="cr-header-course-name">{name}</h2>

          <div className="cr-header-rating-wrap">
            <span className="cr-header-rating-number">{avgText}</span>

            {/* 리스트와 동일한 StarRatingDisplay + 헤더 전용 클래스 */}
            <StarRatingDisplay
              value={ratingAvg || 0}
              rowClass="cr-star-row"
              starClass="cr-star"
              baseClass="cr-star-base"
              fillClass="cr-star-fill"
            />

            <span className="cr-header-rating-count">
              {ratingCountText}
            </span>
          </div>
        </div>

        {/* 과목 상세 정보 카드 */}
        <div className="cr-header-info-card">
          <dl className="cr-header-info-grid">
            <div className="cr-header-info-row">
              <dt>과목명</dt>
              <dd>{name || "-"}</dd>
            </div>
            <div className="cr-header-info-row">
              <dt>교수명</dt>
              <dd>{professor || "-"}</dd>
            </div>
            <div className="cr-header-info-row">
              <dt>학년</dt>
              <dd>{year || "-"}</dd>
            </div>
            <div className="cr-header-info-row">
              <dt>과목코드</dt>
              <dd>{courseCodeText}</dd>
            </div>
            <div className="cr-header-info-row">
              <dt>시간</dt>
              <dd>{timeText}</dd>
            </div>
            <div className="cr-header-info-row">
              <dt>장소</dt>
              <dd>{roomText}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
