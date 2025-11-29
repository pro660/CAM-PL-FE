// src/pages/mypage/CreditSelectPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/CreditSelectPage.css";

const CREDIT_KEYS = ["1", "2", "3", "4"];
const CREDIT_LABEL_MAP = {
  "1": "1학점",
  "2": "2학점",
  "3": "3학점",
  "4": "4학점",
};

const readCreditFilter = () => {
  try {
    const raw = localStorage.getItem("course_credit_filter");
    if (!raw) return { credits: [], label: "전체" };
    const parsed = JSON.parse(raw);
    const credits = Array.isArray(parsed.credits)
      ? parsed.credits
      : [];
    return { credits, label: parsed.label || "전체" };
  } catch {
    return { credits: [], label: "전체" };
  }
};

const buildCreditLabel = (credits) => {
  if (!credits || credits.length === 0) return "전체";

  const unique = Array.from(new Set(credits));
  if (unique.length === CREDIT_KEYS.length) return "전체";

  return unique
    .map((k) => CREDIT_LABEL_MAP[k] || k)
    .join(", ");
};

const CreditSelectPage = () => {
  const navigate = useNavigate();
  const initial = useMemo(readCreditFilter, []);
  const [selectedCredits, setSelectedCredits] = useState(
    initial.credits || []
  );

  const hasSelection = selectedCredits.length > 0;

  const isSelected = (key) => selectedCredits.includes(key);

  const toggleCredit = (key) => {
    setSelectedCredits((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedCredits([...CREDIT_KEYS]);
  };

  const handleClearAll = () => {
    setSelectedCredits([]);
  };

  const handleApply = () => {
    const label = buildCreditLabel(selectedCredits);
    const payload = { credits: selectedCredits, label };

    try {
      localStorage.setItem(
        "course_credit_filter",
        JSON.stringify(payload)
      );
    } catch (e) {
      console.warn("course_credit_filter 저장 실패:", e);
    }

    // 마이페이지에서 바텀시트 자동 오픈
    localStorage.setItem("mypage_open_course_sheet", "1");
    navigate("/mypage", { replace: true });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const allSelected =
    selectedCredits.length === CREDIT_KEYS.length &&
    CREDIT_KEYS.length > 0;

  return (
    <div className="credit-page">
      <header className="credit-header">
        <button
          type="button"
          className="credit-back-btn"
          onClick={handleBack}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="credit-header-title">학점</h1>
        <div className="credit-header-right" />
      </header>

      <main className="credit-body">
        {/* 학점 버튼들 */}
        <div className="credit-grid">
          {CREDIT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`credit-chip ${
                isSelected(key) ? "selected" : ""
              }`}
              onClick={() => toggleCredit(key)}
            >
              {CREDIT_LABEL_MAP[key]}
            </button>
          ))}
        </div>

        {/* 전체 선택 / 전체 취소 */}
        <div className="credit-bulk-row">
          <button
            type="button"
            className={`credit-bulk-btn ${
              allSelected ? "primary" : ""
            }`}
            onClick={handleSelectAll}
          >
            전체 선택
          </button>
          <button
            type="button"
            className="credit-bulk-btn"
            onClick={handleClearAll}
          >
            전체 취소
          </button>
        </div>

        {/* 적용 버튼 */}
        <button
          type="button"
          className={`credit-apply-btn ${hasSelection ? "enabled" : ""}`}
          onClick={handleApply}
        >
          적용
        </button>
      </main>
    </div>
  );
};

export default CreditSelectPage;
