// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx"; // ✅ 전역 로더 훅

/**
 * props:
 * - markers: [{ id, name, lat, lng, count }]
 */
const NaverMap = ({ markers = [] }) => {
  const mapRef = useRef(null);
  const { showLoading, hideLoading } = useLoading(); // ✅ 로더 제어

  useEffect(() => {
    showLoading(); // ✅ 지도 준비 시작 → 로더 +1

    try {
      // index.html에서 네이버 지도 스크립트를 이미 로드했다고 가정
      if (!window.naver || !window.naver.maps) {
        console.error("네이버 지도 스크립트가 로드되지 않았습니다.");
        hideLoading(); // ✅ 실패 시 로더 바로 해제
        return;
      }
      if (!mapRef.current) {
        hideLoading(); // ✅ DOM 없으면 바로 해제
        return;
      }

      const { naver } = window;

      // ✅ 기본 캠퍼스 중심(고정)
      const defaultCenter = new naver.maps.LatLng(36.69085, 126.58297);

      // 항상 기본 센터로 고정
      const map = new naver.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 16,
      });

      if (markers.length > 0) {
        // ✅ placeMarkers 기반으로 여러 개 마커 표시
        markers.forEach((m) => {
          if (typeof m.lat !== "number" || typeof m.lng !== "number") {
            return;
          }

          new naver.maps.Marker({
            position: new naver.maps.LatLng(m.lat, m.lng),
            map,
            title: m.name || undefined,
          });
        });
      } else {
        // ✅ markers 없으면 한서대학교 기본 마커만 표시 (기존 동작 유지)
        new naver.maps.Marker({
          position: defaultCenter,
          map,
          title: "한서대학교",
        });
      }

      // ✅ 여기까지 왔으면 지도/마커 초기화는 끝난 상태 → 바로 로더 끄기
      hideLoading();
    } catch (e) {
      console.error(e);
      hideLoading(); // ✅ 예외 나도 무조건 해제
    }
  }, [markers, showLoading, hideLoading]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
