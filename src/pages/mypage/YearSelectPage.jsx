import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/YearSelectPage.css";

const YEAR_KEYS = ["1", "2", "3", "4", "ETC"];
const YEAR_LABEL_MAP = {
  "1": "1학년",
  "2": "2학년",
  "3": "3학년",
  "4": "4학년",
  ETC: "기타",
};

const readYearFilter = () => {
  try {
    const raw = localStorage.getItem("course_year_filter");
    if (!raw) return { years: [], label: "전체" };
    const parsed = JSON.parse(raw);
    const years = Array.isArray(parsed.years) ? parsed.years : [];
    return { years, label: parsed.label || "전체" };
  } catch {
    return { years: [], label: "전체" };
  }
};

const buildYearLabel = (years) => {
  if (!years || years.length === 0) return "전체";

  const unique = Array.from(new Set(years));
  if (unique.length === YEAR_KEYS.length) return "전체";

  return unique
    .map((k) => YEAR_LABEL_MAP[k] || k)
    .join(", ");
};

const YearSelectPage = () => {
  const navigate = useNavigate();
  const hasSelection = selectedYears.length > 0;
  const initial = useMemo(readYearFilter, []);
  const [selectedYears, setSelectedYears] = useState(initial.years || []);

  const isSelected = (key) => selectedYears.includes(key);

  const toggleYear = (key) => {
    setSelectedYears((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedYears([...YEAR_KEYS]);
  };

  const handleClearAll = () => {
    setSelectedYears([]);
  };

  const handleApply = () => {
    const label = buildYearLabel(selectedYears);
    const payload = { years: selectedYears, label };

    try {
      localStorage.setItem(
        "course_year_filter",
        JSON.stringify(payload)
      );
    } catch (e) {
      console.warn("course_year_filter 저장 실패:", e);
    }

    // 마이페이지에서 바텀시트 자동 오픈
    localStorage.setItem("mypage_open_course_sheet", "1");
    navigate("/mypage", { replace: true });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const allSelected =
    selectedYears.length === YEAR_KEYS.length && YEAR_KEYS.length > 0;

  return (
    <div className="year-page">
      <header className="year-header">
        <button
          type="button"
          className="year-back-btn"
          onClick={handleBack}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="year-header-title">학년</h1>
        <div className="year-header-right" />
      </header>

      <main className="year-body">
        {/* 학년 버튼들 */}
        <div className="year-grid">
          {YEAR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`year-chip ${
                isSelected(key) ? "selected" : ""
              }`}
              onClick={() => toggleYear(key)}
            >
              {YEAR_LABEL_MAP[key]}
            </button>
          ))}
        </div>

        {/* 전체 선택 / 전체 취소 */}
        <div className="year-bulk-row">
          <button
            type="button"
            className={`year-bulk-btn ${
              allSelected ? "primary" : ""
            }`}
            onClick={handleSelectAll}
          >
            전체 선택
          </button>
          <button
            type="button"
            className="year-bulk-btn"
            onClick={handleClearAll}
          >
            전체 취소
          </button>
        </div>

        {/* 적용 버튼 */}
        <button
          type="button"
          className={`year-apply-btn ${hasSelection ? "enabled" : ""}`}
          onClick={handleApply}
        >
          적용
        </button>
      </main>
    </div>
  );
};

export default YearSelectPage;
