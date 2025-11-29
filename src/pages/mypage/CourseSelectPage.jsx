// src/pages/mypage/CourseSelectPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/CourseSelectPage.css";
import api from "../../api/axios";

// 교양 3영역 아래에 붙일 이러닝 5개
const LIBERAL_SPECIAL_NAMES = [
  "본교사이버강좌",
  "OCU컨소시엄사이버강좌",
  "대전충남이러닝강좌",
  "SDU(서울디지털대학)이러닝강좌",
  "차세대디스플레이(COSS)이러닝강좌",
];

// 교양 영역 정렬 우선순위
const LIBERAL_PRIMARY_ORDER = [
  "교양필수",
  "교양선택1영역(탐구)",
  "교양선택2영역(상생)",
  "교양선택3영역(진취)",
  ...LIBERAL_SPECIAL_NAMES,
];

const isLiberalName = (name = "") => {
  if (!name) return false;
  if (name.startsWith("교양")) return true;
  return LIBERAL_SPECIAL_NAMES.includes(name);
};

const CourseAreaSelectPage = () => {
  const navigate = useNavigate();

  // 화면 단계: TYPE(전공/교양 선택) / MAJOR(전공 리스트) / LIBERAL(교양 영역 리스트)
  const [step, setStep] = useState("TYPE");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // 이전에 선택했던 전공/영역이 있으면 불러오기
  const savedArea = useMemo(() => {
    try {
      const raw = localStorage.getItem("course_area_filter");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const [selectedId, setSelectedId] = useState(
    savedArea?.categoryId ?? null
  );
  const [selectedKind, setSelectedKind] = useState(
    savedArea?.kind ?? null // "MAJOR" | "LIBERAL"
  );

  // 전체 강의 한번 가져와서 categoryId / categoryName 묶기
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await api.get("/courses");
        if (cancelled) return;

        const list = Array.isArray(res.data) ? res.data : [];

        const map = new Map();
        list.forEach((course) => {
          if (!course.categoryId || !course.categoryName) return;
          if (!map.has(course.categoryId)) {
            map.set(course.categoryId, {
              id: course.categoryId,
              name: course.categoryName,
            });
          }
        });

        setCategories(Array.from(map.values()));
      } catch (err) {
        console.error("전공/영역 목록 조회 실패:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const liberalCategories = useMemo(() => {
    const libs = categories.filter((c) => isLiberalName(c.name));
    const sorted = [...libs].sort((a, b) => {
      const ai = LIBERAL_PRIMARY_ORDER.indexOf(a.name);
      const bi = LIBERAL_PRIMARY_ORDER.indexOf(b.name);

      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }

      return a.name.localeCompare(b.name, "ko-KR");
    });
    return sorted;
  }, [categories]);

  const majorCategories = useMemo(
    () => categories.filter((c) => !isLiberalName(c.name)),
    [categories]
  );

  // 현재 스텝에 맞는 리스트 + 검색 필터
  const currentList = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const base =
      step === "MAJOR"
        ? majorCategories
        : step === "LIBERAL"
        ? liberalCategories
        : [];
    if (!q) return base;
    return base.filter((c) => c.name.toLowerCase().includes(q));
  }, [step, searchText, majorCategories, liberalCategories]);

  // 헤더 왼쪽 화살표 동작
  const handleBack = () => {
    if (step === "TYPE") {
      navigate(-1);
    } else {
      setStep("TYPE");
      setSearchText("");
    }
  };

  const handleChooseMajor = () => {
    setStep("MAJOR");
    setSearchText("");
  };

  const handleChooseLiberal = () => {
    setStep("LIBERAL");
    setSearchText("");
  };

  // 전공/교양 카테고리 하나 선택했을 때
  const handleSelectCategory = (category, kind) => {
    setSelectedId(category.id);
    setSelectedKind(kind);

    const payload = {
      kind, // "MAJOR" | "LIBERAL"
      categoryId: category.id,
      categoryName: category.name,
    };

    try {
      localStorage.setItem(
        "course_area_filter",
        JSON.stringify(payload)
      );
      // ✅ 마이페이지로 돌아갔을 때 바텀시트 다시 열리도록 플래그 설정
      localStorage.setItem("mypage_open_course_sheet", "1");
    } catch (e) {
      console.warn("course_area_filter / mypage_open_course_sheet 저장 실패:", e);
    }

    // ✅ 마이페이지로 이동
    navigate("/mypage", { replace: true });
  };

  return (
    <div className="area-page">
      <header className="area-header">
        <button
          type="button"
          className="area-back-btn"
          onClick={handleBack}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="area-header-title">전공/영역</h1>
        <div className="area-header-right" />
      </header>

      {/* 1단계: 전공 / 교양 선택 */}
      {step === "TYPE" && (
        <main className="area-body area-body-type">
          <button
            type="button"
            className="area-type-card"
            onClick={handleChooseMajor}
          >
            <span className="area-type-text">전공</span>
            <span className="area-type-arrow">›</span>
          </button>
          <button
            type="button"
            className="area-type-card"
            onClick={handleChooseLiberal}
          >
            <span className="area-type-text">교양</span>
            <span className="area-type-arrow">›</span>
          </button>
        </main>
      )}

      {/* 2단계: 전공 리스트 */}
      {step === "MAJOR" && (
        <main className="area-body area-body-list">
          <div className="area-search-box">
            <input
              type="text"
              className="area-search-input"
              placeholder="검색어를 입력하세요."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <span className="area-search-icon">🔍</span>
          </div>

          <div className="area-list">
            {loading ? (
              <p className="area-list-info">
                전공 목록을 불러오는 중이에요...
              </p>
            ) : currentList.length === 0 ? (
              <p className="area-list-info">전공이 없습니다.</p>
            ) : (
              currentList.map((cat) => {
                const isSelected =
                  selectedKind === "MAJOR" && selectedId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`area-list-item area-list-item-major ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() =>
                      handleSelectCategory(cat, "MAJOR")
                    }
                  >
                    <span className="area-list-item-text">
                      {cat.name}
                    </span>
                    {isSelected && (
                      <span className="area-list-item-check">✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* 2단계: 교양 영역 리스트 */}
      {step === "LIBERAL" && (
        <main className="area-body area-body-list">
          <div className="area-search-box">
            <input
              type="text"
              className="area-search-input"
              placeholder="검색어를 입력하세요."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <span className="area-search-icon">🔍</span>
          </div>

          <div className="area-list">
            {loading ? (
              <p className="area-list-info">
                교양 영역을 불러오는 중이에요...
              </p>
            ) : currentList.length === 0 ? (
              <p className="area-list-info">교양 영역이 없습니다.</p>
            ) : (
              currentList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="area-list-item area-list-item-liberal"
                  onClick={() =>
                    handleSelectCategory(cat, "LIBERAL")
                  }
                >
                  <span className="area-list-item-text">
                    {cat.name}
                  </span>
                  <span className="area-list-item-arrow">›</span>
                </button>
              ))
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default CourseAreaSelectPage;
