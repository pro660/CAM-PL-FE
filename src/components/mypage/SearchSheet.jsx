// src/components/mypage/SearchSheet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/SearchSheet.css";
import api from "../../api/axios";

/** 요일 영문 → 한글 */
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

/** ===== 필터 정의 ===== */
const FILTER_CONFIG = [
  { key: "type", label: "전공/교양", defaultValue: "전체" },
  { key: "time", label: "시간", defaultValue: "전체" },
  { key: "year", label: "학년", defaultValue: "전체" },
  { key: "credit", label: "학점", defaultValue: "전체" },
  { key: "keyword", label: "검색어", defaultValue: "없음" },
];

/** 전공/영역 필터 (course_area_filter) */
const readSavedAreaFilter = () => {
  try {
    const raw = localStorage.getItem("course_area_filter");
    if (!raw) return { categoryId: null, categoryName: "전체" };
    const parsed = JSON.parse(raw);
    return {
      categoryId: parsed?.categoryId ?? null,
      categoryName: parsed?.categoryName ?? "전체",
    };
  } catch {
    return { categoryId: null, categoryName: "전체" };
  }
};

/** 학년 필터 (course_year_filter)
 * years: ["1","2","3","4","ETC"] 중 일부
 * label: "1학년, 2학년" 같이 표시용 텍스트
 */
const readSavedYearFilter = () => {
  try {
    const raw = localStorage.getItem("course_year_filter");
    if (!raw) return { years: [], label: "전체" };
    const parsed = JSON.parse(raw);
    const years = Array.isArray(parsed.years) ? parsed.years : [];
    return {
      years,
      label: parsed.label || "전체",
    };
  } catch {
    return { years: [], label: "전체" };
  }
};

/** 학점 필터 (course_credit_filter)
 * credits: ["1","2","3","4"] 중 일부
 * label  : "1학점, 2학점" 같은 표시용 텍스트
 */
const readSavedCreditFilter = () => {
  try {
    const raw = localStorage.getItem("course_credit_filter");
    if (!raw) return { credits: [], label: "전체" };
    const parsed = JSON.parse(raw);
    const credits = Array.isArray(parsed.credits) ? parsed.credits : [];
    return {
      credits,
      label: parsed.label || "전체",
    };
  } catch {
    return { credits: [], label: "전체" };
  }
};

/**
 * /api/courses 에 넘길 쿼리 파라미터 빌드
 *  - categoryId : 전공/교양(카테고리)
 *  - q          : 검색어
 *
 *  학년 / 학점 / 시간은 현재 클라이언트에서만 필터링.
 */
const buildApiParams = (filters, categoryId) => {
  const params = {};

  if (categoryId) {
    params.categoryId = categoryId;
  }

  if (filters.keyword && filters.keyword !== "없음") {
    const q = filters.keyword.trim();
    if (q) params.q = q;
  }

  return params;
};

/** 학년 정규화: 1~4 아니면 ETC(기타) */
const normalizeCourseYear = (year) => {
  const s = String(year || "");
  if (["1", "2", "3", "4"].includes(s)) return s;
  return "ETC";
};

const ALL_YEAR_KEYS = ["1", "2", "3", "4", "ETC"];
const ALL_CREDIT_KEYS = ["1", "2", "3", "4"];

/** 서버 결과에 학년/학점/시간 필터 적용 */
const applyClientSideFilters = (
  base,
  filters,
  selectedYears,
  selectedCredits
) => {
  if (!base || base.length === 0) return [];

  const years = Array.isArray(selectedYears) ? selectedYears : [];
  const useYearFilter =
    years.length > 0 && years.length < ALL_YEAR_KEYS.length;

  const credits = Array.isArray(selectedCredits)
    ? selectedCredits
    : [];
  const useCreditFilter =
    credits.length > 0 && credits.length < ALL_CREDIT_KEYS.length;

  return base.filter((course) => {
    // 학년 필터
    if (useYearFilter) {
      const key = normalizeCourseYear(course.year);
      if (!years.includes(key)) {
        return false;
      }
    }

    // 학점 필터
    if (useCreditFilter) {
      const cKey = String(course.credit ?? "");
      if (!credits.includes(cKey)) {
        return false;
      }
    }

    // 시간 필터: "월 09:00~10:00" 이런 문자열에 포함 여부로 체크
    if (filters.time && filters.time !== "전체") {
      const timesText = formatTimes(course.times || []);
      if (!timesText.includes(filters.time)) {
        return false;
      }
    }

    return true;
  });
};

const CourseSearchBottomSheet = ({
  onClose,
  onCourseSelect,
  onTimetableAdded,
}) => {
  const navigate = useNavigate();

  const savedArea = useMemo(readSavedAreaFilter, []);
  const savedYear = useMemo(readSavedYearFilter, []);
  const savedCredit = useMemo(readSavedCreditFilter, []);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [closing, setClosing] = useState(false);

  // 서버 쿼리용 카테고리 ID / 학년 / 학점 선택값
  const [selectedCategoryId] = useState(savedArea.categoryId);
  const [selectedYears] = useState(savedYear.years || []);
  const [selectedCredits] = useState(savedCredit.credits || []);

  // 필터 UI 상태
  const [activeFilter, setActiveFilter] = useState(null); // type | time | year | credit | ...
  const [filterValues, setFilterValues] = useState(() =>
    FILTER_CONFIG.reduce((acc, f) => {
      if (f.key === "type") {
        acc[f.key] = savedArea.categoryName; // 전공/교양 라벨
      } else if (f.key === "year") {
        acc[f.key] = savedYear.label; // 학년 라벨
      } else if (f.key === "credit") {
        acc[f.key] = savedCredit.label; // 학점 라벨
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

  // 🔥 선택된 강의 ID (보라색 하이라이트 + 시간표 미리보기용)
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  // 바텀시트 열려있는 동안 배경 스크롤 막기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // 필터 값/카테고리/학년/학점이 바뀔 때마다 서버 호출 + 클라이언트 필터
  useEffect(() => {
    let cancelled = false;

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = buildApiParams(filterValues, selectedCategoryId);
        const res = await api.get("/courses", { params });
        if (cancelled) return;

        const list = Array.isArray(res.data) ? res.data : [];
        const filtered = applyClientSideFilters(
          list,
          filterValues,
          selectedYears,
          selectedCredits
        );

        setCourses(filtered);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error("강의 목록 조회 실패:", err);
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, [filterValues, selectedCategoryId, selectedYears, selectedCredits]);

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

  /** 필터 pill 클릭 */
  const handleFilterClick = (key) => {
    if (key === "type") {
      // 전공/영역 선택 페이지
      onClose?.();
      navigate("/course-area");
      return;
    }

    if (key === "year") {
      // 학년 선택 페이지
      onClose?.();
      navigate("/course-year");
      return;
    }

    if (key === "credit") {
      // 학점 선택 페이지
      onClose?.();
      navigate("/course-credit");
      return;
    }

    // 나머지(time, keyword)는 입력창 토글
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

  /** 필터 적용(time, keyword 전용) */
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

  /** 필터 초기화 */
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

  /** 🔥 강의 카드 클릭 → 선택 + 상위에 미리보기 전달 */
  const handleCourseClick = (course) => {
    setSelectedCourseId(course.id);
    onCourseSelect?.(course);
  };

  /** 🔥 시간표 추가 플로우 (reslove API 사용 안 함)
   * 1) /timetable/items/try-add 호출
   * 2) conflict == true 이고 itemId 있으면 → 삭제 여부 확인
   * 3) 예 → DELETE /timetable/items/{itemId} → 다시 try-add
   */
  const handleAddToTimetable = async () => {
    if (!selectedCourseId) return;

    setAddLoading(true);

    // 공통으로 쓸 추가 시도 함수
    const tryAdd = async () => {
      const res = await api.post("/timetable/items/try-add", {
        courseId: selectedCourseId,
      });
      return res.data ?? {};
    };

    try {
      // 1차 추가 시도
      let data = await tryAdd();

      // 이미 존재(동일 과목)인 경우
      if (data.status === 409) {
        alert(data.error || "이미 내 시간표에 존재합니다.");
        return;
      }

      // 정상적으로 바로 추가된 경우
      if (data.createdEventCount > 0) {
        alert("시간표에 강의가 추가되었어요.");
        onTimetableAdded?.();
        return;
      }

      // 시간이 겹치는 경우
      if (data.conflict) {
        const conflictItemId = data.itemId;

        // itemId 가 없으면 삭제를 못하니까 그냥 안내
        if (!conflictItemId) {
          alert("다른 강의와 시간이 겹쳐서 추가할 수 없어요.");
          return;
        }

        const ok = window.confirm(
          "해당 시간에 이미 다른 강의가 있습니다.\n" +
            "기존 강의를 삭제하고 새 강의를 추가할까요?"
        );
        if (!ok) {
          // 사용자가 취소
          return;
        }

        // 1) 기존 강의 삭제
        try {
          await api.delete(`/timetable/items/${conflictItemId}`);
        } catch (e) {
          console.error("기존 강의 삭제 실패:", e);
          alert("기존 강의를 삭제하는 중 오류가 발생했어요.");
          return;
        }

        // 2) 다시 추가 시도
        data = await tryAdd();

        // 다시 시도했는데도 이미 동일 과목이 존재
        if (data.status === 409) {
          alert(data.error || "이미 내 시간표에 존재합니다.");
          return;
        }

        // 다시 시도했는데도 또 conflict 라면 더 이상 자동 해결 X
        if (data.conflict) {
          alert(
            "다른 강의와 시간이 계속 겹쳐서 추가할 수 없어요.\n" +
              "시간표에서 직접 정리해 주세요."
          );
          return;
        }

        if (data.createdEventCount > 0) {
          alert("시간표에 강의가 추가되었어요.");
          onTimetableAdded?.();
          return;
        }

        alert("강의가 추가되지 않았어요.");
        return;
      }

      // 그 외 애매한 응답
      alert("강의가 추가되지 않았어요.");
    } catch (error) {
      // HTTP 409 (에러 응답 형태일 때)
      if (error.response?.status === 409) {
        const msg =
          error.response.data?.error || "이미 내 시간표에 존재합니다.";
        alert(msg);
      } else {
        console.error("시간표 추가 실패:", error);
        alert("시간표 추가 중 오류가 발생했어요.");
      }
    } finally {
      setAddLoading(false);
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

          {/* 전공/교양, 학년, 학점 제외한 필터 입력 박스 */}
          {activeFilterConfig &&
            activeFilterConfig.key !== "type" &&
            activeFilterConfig.key !== "year" &&
            activeFilterConfig.key !== "credit" && (
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
                  className={
                    "mypage-bottomsheet-course-card" +
                    (selectedCourseId === course.id ? " selected" : "")
                  }
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="mypage-bottomsheet-course-header">
                    <h3 className="mypage-bottomsheet-course-name">
                      {course.name}
                    </h3>
                    <button
                      type="button"
                      className="mypage-bottomsheet-review-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: 강의평 페이지 연결 시 여기서 처리
                      }}
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

          {/* 🔥 선택된 강의가 있을 때만 나오는 시간표 추가 버튼 */}
          {selectedCourseId && (
            <div className="mypage-bottomsheet-footer">
              <button
                type="button"
                className="mypage-bottomsheet-add-btn"
                onClick={handleAddToTimetable}
                disabled={addLoading}
              >
                {addLoading ? "추가 중..." : "시간표에 추가"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSearchBottomSheet;
