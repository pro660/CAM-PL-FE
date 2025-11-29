// src/components/mypage/SearchSheet.jsx
import React, { useEffect, useState } from "react";
import "../../css/mypage/CourseSearchBottomSheet.css";
import api from "../../api/axios";

const mapDayToKor = (dayOfWeek) => {
  if (!dayOfWeek) return "";
  const d = dayOfWeek.toUpperCase();
  switch (d) {
    case "MONDAY":
    case "MON":
      return "월";
    case "TUESDAY":
    case "TUE":
      return "화";
    case "WEDNESDAY":
    case "WED":
      return "수";
    case "THURSDAY":
    case "THU":
      return "목";
    case "FRIDAY":
    case "FRI":
      return "금";
    case "SATURDAY":
    case "SAT":
      return "토";
    case "SUNDAY":
    case "SUN":
      return "일";
    default:
      return dayOfWeek;
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatTimes = (times = []) => {
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

const CourseSearchBottomSheet = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ✅ 바텀시트 열려 있는 동안 배경 스크롤 막기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = query.trim();
    setHasSearched(true);

    if (!q) {
      setCourses([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/courses", { params: { q } });
      const list = Array.isArray(res.data) ? res.data : [];
      setCourses(list);
    } catch (err) {
      console.error("강의 검색 실패:", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mypage-bottomsheet-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="mypage-bottomsheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 드래그 핸들 + 제목 줄 */}
        <div className="mypage-bottomsheet-header">
          <div className="mypage-bottomsheet-handle" />
          <div className="mypage-bottomsheet-title-row">
            <h2 className="mypage-bottomsheet-title">강의 추가</h2>
          </div>
        </div>

        <div className="mypage-bottomsheet-body">
          {/* 필터 영역: 전공/교양, 시간, 학년, 학점, 검색어(라벨만) */}
          <div className="mypage-bottomsheet-filter-row">
            {["전공/교양", "시간", "학년", "학점", "검색어"].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  className="mypage-bottomsheet-filter-pill"
                >
                  <span className="mypage-bottomsheet-filter-label">
                    {label}
                  </span>
                  <span className="mypage-bottomsheet-filter-value">
                    전체
                  </span>
                </button>
              )
            )}
          </div>

          {/* 검색 바 */}
          <form
            className="mypage-bottomsheet-search-row"
            onSubmit={handleSubmit}
          >
            <input
              className="mypage-bottomsheet-search-input"
              type="text"
              placeholder="검색어를 입력하세요 (예: 객체)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="mypage-bottomsheet-search-btn"
            >
              검색
            </button>
          </form>

          {/* 강의 리스트 */}
          <div className="mypage-bottomsheet-course-list">
            {loading ? (
              <p className="mypage-bottomsheet-info-text">
                강의를 불러오는 중이에요...
              </p>
            ) : !hasSearched ? (
              <p className="mypage-bottomsheet-info-text">
                검색어를 입력해 강의를 찾아보세요.
              </p>
            ) : courses.length === 0 ? (
              <p className="mypage-bottomsheet-info-text">
                검색 결과가 없습니다.
              </p>
            ) : (
              courses.map((course) => (
                <article
                  key={course.id}
                  className="mypage-bottomsheet-course-card"
                >
                  <div className="mypage-bottomsheet-course-header">
                    <h3 className="mypage-bottomsheet-course-name">
                      {course.name}
                    </h3>
                    <button
                      type="button"
                      className="mypage-bottomsheet-review-btn"
                    >
                      강의평
                    </button>
                  </div>

                  <div className="mypage-bottomsheet-course-meta">
                    <p className="mypage-bottomsheet-course-prof">
                      {course.professor || "담당 교수 미정"}
                    </p>
                    <p className="mypage-bottomsheet-course-line">
                      <span className="mypage-bottomsheet-course-label">
                        수업 시간
                      </span>
                      <span>{formatTimes(course.times)}</span>
                    </p>
                    <p className="mypage-bottomsheet-course-line">
                      <span className="mypage-bottomsheet-course-label">
                        수업 장소
                      </span>
                      <span>
                        {course.times?.[0]?.room || "장소 미정"}
                      </span>
                    </p>
                    <p className="mypage-bottomsheet-course-line">
                      <span className="mypage-bottomsheet-course-label">
                        학년
                      </span>
                      <span>{course.year || "-"}</span>
                    </p>
                    <p className="mypage-bottomsheet-course-line">
                      <span className="mypage-bottomsheet-course-label">
                        학점
                      </span>
                      <span>{course.credit ?? "-"}</span>
                    </p>
                    <p className="mypage-bottomsheet-course-line">
                      <span className="mypage-bottomsheet-course-label">
                        과목 코드
                      </span>
                      <span>
                        {course.courseCode}
                        {course.section ? `-${course.section}` : ""}
                      </span>
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSearchBottomSheet;
