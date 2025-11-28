// src/components/home/PlaceDetailModal.jsx
import React, { useEffect, useState } from "react";
import "../../css/home/PlaceDetailModal.css";
import api from "../../api/axios";

const formatPrice = (price) => {
  if (price == null) return "";
  return `${price.toLocaleString()} ₩`;
};

const PlaceDetailModal = ({ placeId, onClose }) => {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 배경 스크롤 막기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (!placeId) return;

    let cancelled = false;

    const fetchPlace = async () => {
      try {
        const res = await api.get(`/places/${placeId}`);
        if (cancelled) return;
        setPlace(res.data ?? null);
      } catch (error) {
        console.error("장소 상세 조회 실패:", error);
        if (!cancelled) {
          setPlace(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlace();

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  // 바깥 클릭 시 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="place-modal-backdrop" onClick={handleBackdropClick}>
      <div className="place-modal" onClick={(e) => e.stopPropagation()}>
        {/* 상단 타이틀 + 닫기 버튼 */}
        <div className="place-modal-header">
          <h2 className="place-modal-title">
            {place?.name || (loading ? "불러오는 중..." : "장소 정보 없음")}
          </h2>
          <button
            type="button"
            className="place-modal-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 이미지 */}
        {place?.imageUrl && (
          <div className="place-modal-image-wrap">
            <img
              src={place.imageUrl}
              alt={place.name}
              className="place-modal-image"
            />
          </div>
        )}

        {/* 아래 내용 */}
        <div className="place-modal-content">
          {/* 주소 */}
          <div className="place-modal-section">
            <div className="place-modal-label">주소:</div>
            <div className="place-modal-address">
              {place?.address || (loading ? "주소를 불러오는 중..." : "-")}
            </div>
          </div>

          {/* 메뉴 */}
          <div className="place-modal-section place-modal-menu-section">
            <div className="place-modal-label">메뉴:</div>

            {loading ? (
              <div className="place-modal-menu-loading">
                메뉴를 불러오는 중이에요...
              </div>
            ) : place?.menus && place.menus.length > 0 ? (
              <div className="place-modal-menu-list">
                {place.menus.map((menu) => (
                  <div key={menu.id} className="place-modal-menu-item">
                    <span className="place-modal-menu-name">{menu.name}</span>
                    <span className="place-modal-menu-dots" />
                    <span className="place-modal-menu-price">
                      {formatPrice(menu.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="place-modal-menu-empty">
                등록된 메뉴가 없어요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailModal;
