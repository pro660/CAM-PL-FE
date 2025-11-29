// src/components/mypage/SearchSheet.jsx
import React, { useEffect, useState } from "react";
import "../../css/mypage/SearchSheet.css";
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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [closing, setClosing] = useState(false); // ✅ 닫힘 애니메이션 상태

  // ✅ 바텀시트 열려 있는 동안 배경 스크롤 막기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // ✅ 공통 강의 조회 함수 (q가 없으면 전체)
  const fetchCourses = async (keyword = "") => {
    const q = keyword.trim();
    setLoading(true);
    try {
      const res = await api.get("/courses", {
        params: q ? { q } : {}, // q가 있으면 검색, 없으면 전체
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setCourses(list);
    } catch (err) {
      console.error("강의 검색 실패:", err);
      setCourses([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  // ✅ 처음 열릴 때 전체 강의 불러오기
  useEffect(() => {
    fetchCourses("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // 바깥쪽 클릭 시 닫힘 애니메이션 시작
      setClosing(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    fetchCourses(query);
  };

  // ✅ 애니메이션 종료 후 실제 onClose 호출
  const handleSheetAnimationEnd = () => {
    if (closing) {
      onClose?.();
    }
  };

  return (
    <div
      className={`mypage-bottomsheet-backdrop ${
        closing ? "closing" : ""
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`mypage-bottomsheet ${closing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleSheetAnimationEnd}
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
            ) : !hasLoadedOnce ? (
              <p className="mypage-bottomsheet-info-text">
                강의를 불러오는 중이에요...
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
