// src/components/mypage/SearchSheet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

// 필터 정의
const FILTER_CONFIG = [
  { key: "type", label: "전공/교양", defaultValue: "전체" },
  { key: "time", label: "시간", defaultValue: "전체" },
  { key: "year", label: "학년", defaultValue: "전체" },
  { key: "credit", label: "학점", defaultValue: "전체" },
  { key: "keyword", label: "검색어", defaultValue: "없음" },
];

const readSavedAreaFilterLabel = () => {
  try {
    const raw = localStorage.getItem("course_area_filter");
    if (!raw) return "전체";
    const parsed = JSON.parse(raw);
    return parsed?.categoryName || "전체";
  } catch (e) {
    return "전체";
  }
};

const CourseSearchBottomSheet = ({ onClose }) => {
  const navigate = useNavigate();

  const [allCourses, setAllCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [closing, setClosing] = useState(false);

  // 필터 UI 상태
  const [activeFilter, setActiveFilter] = useState(null); // type | time | ...
  const [filterValues, setFilterValues] = useState(() =>
    FILTER_CONFIG.reduce((acc, f) => {
      if (f.key === "type") {
        acc[f.key] = readSavedAreaFilterLabel();
      } else {
        acc[f.key] = f.defaultValue;
      }
      return acc;
    }, {})
  );
  const [filterInput, setFilterInput] = useState("");

  const activeFilterConfig = useMemo(
    () => FILTER_CONFIG.find((f) => f.key === activeFilter) || null,
    [activeFilter]
  );

  // 바텀시트 열려 있는 동안 배경 스크롤 막기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // 전체 강의 한번만 로딩
  useEffect(() => {
    let cancelled = false;

    const fetchAllCourses = async () => {
      setLoading(true);
      try {
        const res = await api.get("/courses");
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setAllCourses(list);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error("강의 목록 조회 실패:", err);
        if (!cancelled) {
          setAllCourses([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAllCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  // 필터 적용 함수
  const buildFilteredCourses = (base, filters) => {
    if (!base || base.length === 0) return [];

    return base.filter((course) => {
      // 전공/교양(카테고리) 필터
      if (filters.type && filters.type !== "전체") {
        if ((course.categoryName || "") !== filters.type) {
          return false;
        }
      }

      // 학년 필터
      if (filters.year && filters.year !== "전체") {
        if (String(course.year || "") !== String(filters.year)) {
          return false;
        }
      }

      // 학점 필터
      if (filters.credit && filters.credit !== "전체") {
        if (String(course.credit || "") !== String(filters.credit)) {
          return false;
        }
      }

      // 시간 필터: 문자열 포함 여부로만 처리
      if (filters.time && filters.time !== "전체") {
        const timesText = formatTimes(course.times || []);
        if (!timesText.includes(filters.time)) {
          return false;
        }
      }

      // 검색어 필터
      const kw =
        filters.keyword && filters.keyword !== "없음"
          ? filters.keyword.trim().toLowerCase()
          : "";
      if (kw) {
        const haystack = (
          (course.name || "") +
          " " +
          (course.professor || "") +
          " " +
          (course.courseCode || "")
        )
          .toLowerCase()
          .replace(/\s+/g, " ");
        if (!haystack.includes(kw)) {
          return false;
        }
      }

      return true;
    });
  };

  // allCourses / filterValues 변경 시마다 재필터링
  useEffect(() => {
    const next = buildFilteredCourses(allCourses, filterValues);
    setCourses(next);
  }, [allCourses, filterValues]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setClosing(true);
    }
  };

  const handleSheetAnimationEnd = () => {
    if (closing) {
      onClose?.();
    }
  };

  // 필터 pill 클릭
  const handleFilterClick = (key) => {
    if (key === "type") {
      // 전공/교양 페이지로 이동
      onClose?.();
      navigate("/course-area");
      return;
    }

    if (activeFilter === key) {
      setActiveFilter(null);
      setFilterInput("");
      return;
    }

    const config = FILTER_CONFIG.find((f) => f.key === key);
    if (!config) return;

    setActiveFilter(key);
    const currentValue = filterValues[key];
    setFilterInput(
      currentValue === config.defaultValue ? "" : currentValue || ""
    );
  };

  // 필터 적용
  const handleFilterApply = () => {
    if (!activeFilterConfig) return;

    const { key, defaultValue } = activeFilterConfig;
    const trimmed = filterInput.trim();
    const displayValue = trimmed || defaultValue;

    setFilterValues((prev) => ({
      ...prev,
      [key]: displayValue,
    }));

    setActiveFilter(null);
    setFilterInput("");
  };

  // 필터 초기화
  const handleFilterReset = () => {
    if (!activeFilterConfig) return;
    const { key, defaultValue } = activeFilterConfig;

    setFilterValues((prev) => ({
      ...prev,
      [key]: defaultValue,
    }));

    setFilterInput("");
    setActiveFilter(null);
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
        {/* 상단 핸들 + 제목 */}
        <div className="mypage-bottomsheet-header">
          <div className="mypage-bottomsheet-handle" />
          <div className="mypage-bottomsheet-title-row">
            <h2 className="mypage-bottomsheet-title">강의 추가</h2>
          </div>
        </div>

        <div className="mypage-bottomsheet-body">
          {/* 필터 pill들 */}
          <div className="mypage-bottomsheet-filter-row">
            {FILTER_CONFIG.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`mypage-bottomsheet-filter-pill ${
                  activeFilter === f.key ? "active" : ""
                }`}
                onClick={() => handleFilterClick(f.key)}
              >
                <span className="mypage-bottomsheet-filter-label">
                  {f.label}
                </span>
                <span className="mypage-bottomsheet-filter-value">
                  {filterValues[f.key]}
                </span>
              </button>
            ))}
          </div>

          {/* 전공/교양 제외 필터 입력 박스 */}
          {activeFilterConfig && activeFilterConfig.key !== "type" && (
            <div className="mypage-bottomsheet-filter-input-row">
              <div className="mypage-bottomsheet-filter-input-box">
                <span className="mypage-bottomsheet-filter-input-label">
                  {activeFilterConfig.label}
                </span>
                <input
                  type="text"
                  className="mypage-bottomsheet-filter-input"
                  placeholder={
                    activeFilterConfig.key === "keyword"
                      ? "검색어를 입력하세요"
                      : "값을 입력하세요"
                  }
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                />
              </div>
              <div className="mypage-bottomsheet-filter-input-actions">
                <button
                  type="button"
                  className="mypage-bottomsheet-filter-reset-btn"
                  onClick={handleFilterReset}
                >
                  초기화
                </button>
                <button
                  type="button"
                  className="mypage-bottomsheet-filter-apply-btn"
                  onClick={handleFilterApply}
                >
                  적용
                </button>
              </div>
            </div>
          )}

          {/* 강의 리스트 */}
          <div className="mypage-bottomsheet-course-list">
            {loading && !hasLoadedOnce ? (
              <p className="mypage-bottomsheet-info-text">
                강의를 불러오는 중이에요...
              </p>
            ) : !hasLoadedOnce ? (
              <p className="mypage-bottomsheet-info-text">
                강의 목록이 없어요.
              </p>
            ) : courses.length === 0 ? (
              <p className="mypage-bottomsheet-info-text">
                필터에 해당하는 강의가 없습니다.
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
