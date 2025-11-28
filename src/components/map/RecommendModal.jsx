// src/components/map/RecommendModal.jsx
import React, { useEffect, useState } from "react";
import "../../css/map/RecommendModal.css";
import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext";

// 추천 받을 일정 종류
const RECOMMEND_EVENT_CATEGORIES = [
  { value: "TEAM", label: "팀플" },
  { value: "ASSIGNMENT", label: "과제" },
  { value: "MEAL", label: "식사" },
  { value: "MEETING", label: "미팅" },
  { value: "REST", label: "휴식" },
];

// 누구와 함께?
const RECOMMEND_COMPANIONS = [
  { value: "ALONE", label: "혼자" },
  { value: "FRIEND", label: "동기" },
  { value: "SENIOR", label: "선배" },
  { value: "JUNIOR", label: "후배" },
  { value: "PROFESSOR", label: "교수님" },
];

// 장소 타입 → 한글 라벨
function getPlaceTypeLabel(type) {
  if (!type) return "";
  switch (type) {
    case "CAFE":
      return "카페";
    case "RESTAURANT":
      return "식당";
    case "STUDY_CAFE":
      return "스터디카페";
    case "ETC":
      return "기타";
    default:
      return type;
  }
}

export default function RecommendModal({
  visible,
  onClose,
  onAddToSchedule,
}) {
  const { showLoading, hideLoading } = useLoading();

  const [category, setCategory] = useState(null); // 일정 카테고리 (TEAM, MEAL...)
  const [companion, setCompanion] = useState(null); // 동행 타입
  const [places, setPlaces] = useState([]); // 추천 결과
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 모달 열릴 때마다 상태 초기화
  useEffect(() => {
    if (visible) {
      setCategory(null);
      setCompanion(null);
      setPlaces([]);
      setSelectedPlaceId(null);
      setError("");
      setLoading(false);
    }
  }, [visible]);

  if (!visible) return null;

  const hasResult = places.length > 0;
  const canRequest = !!category && !!companion && !loading;
  const canAddToSchedule = hasResult && !!selectedPlaceId && !loading;

  const handleSelectPlace = (placeId) => {
    setSelectedPlaceId((prev) => (prev === placeId ? null : placeId));
  };

  const requestRecommend = async () => {
    if (!category || !companion) {
      setError("어떤 일정인지와 누구와 함께인지 선택해주세요.");
      return;
    }

    setError("");
    setLoading(true);
    showLoading();

    try {
      const res = await api.post("/places/recommend", {
        // 🔥 백엔드 스펙에 맞춰 키 이름만 필요하면 조정
        category,
        companionType: companion,
      });

      const body = res.data ?? [];
      const list = Array.isArray(body) ? body : [];

      setPlaces(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          category: getPlaceTypeLabel(p.type),
          imageUrl: p.imageUrl,
          address: p.address,
        }))
      );
      setSelectedPlaceId(null);
    } catch (e) {
      console.error(e);
      setError("장소를 추천받는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handlePrimaryClick = () => {
    if (!hasResult) {
      // 1단계 → 추천받기
      if (!canRequest) return;
      requestRecommend();
      return;
    }

    if (canAddToSchedule) {
      // 3단계 → 일정에 추가하기
      const place = places.find((p) => p.id === selectedPlaceId);
      if (!place) return;

      onAddToSchedule &&
        onAddToSchedule({
          place,
          category, // 일정 카테고리 그대로 넘겨줌
        });
      return;
    }

    // 2단계 결과만 있고 선택 안 된 상태 → 다시 추천받기
    requestRecommend();
  };

  const primaryButtonLabel = loading
    ? "불러오는 중..."
    : !hasResult
    ? "추천받기"
    : canAddToSchedule
    ? "일정에 추가하기"
    : "다시 추천받기";

  return (
    <div className="map-recommend-modal-overlay" onClick={onClose}>
      <div
        className="map-recommend-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="map-recommend-header">
          <h3 className="map-recommend-title">장소 추천받기</h3>
          <button
            type="button"
            className="map-recommend-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 메인 */}
        <div className="map-recommend-main">
          {!hasResult ? (
            <>
              <div className="map-recommend-section">
                <p className="map-recommend-section-title">
                  어떤 일정인가요?
                </p>
                <div className="map-recommend-chips">
                  {RECOMMEND_EVENT_CATEGORIES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`map-recommend-chip ${
                        category === opt.value ? "active" : ""
                      }`}
                      onClick={() => setCategory(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="map-recommend-section">
                <p className="map-recommend-section-title">
                  누구와 함께하는 일정인가요?
                </p>
                <div className="map-recommend-chips">
                  {RECOMMEND_COMPANIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`map-recommend-chip ${
                        companion === opt.value ? "active" : ""
                      }`}
                      onClick={() => setCompanion(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <ul className="map-recommend-list">
                {places.map((place) => {
                  const selected = place.id === selectedPlaceId;
                  return (
                    <li
                      key={place.id}
                      className={`map-recommend-item ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => handleSelectPlace(place.id)}
                    >
                      <div className="map-recommend-thumb-wrap">
                        <img
                          src={place.imageUrl}
                          alt={place.name}
                          className="map-recommend-thumb"
                        />
                      </div>
                      <div className="map-recommend-info">
                        <div className="map-recommend-name">
                          {place.name}
                        </div>
                        <div className="map-recommend-category-pill">
                          {place.category}
                        </div>
                      </div>
                      <div className="map-recommend-check">
                        {selected && <span>✓</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {canAddToSchedule && (
                <p className="map-recommend-helper">
                  추천받은 장소로 빠르게 일정을 등록할 수 있어요.
                </p>
              )}
            </>
          )}

          {error && <p className="map-recommend-error">{error}</p>}
        </div>

        {/* 풋터 */}
        <div className="map-recommend-footer">
          <button
            type="button"
            className={`map-recommend-primary-btn ${
              (!hasResult && !canRequest) || loading ? "disabled" : ""
            }`}
            onClick={handlePrimaryClick}
            disabled={(!hasResult && !canRequest) || loading}
          >
            {primaryButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
