// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx"; // ✅ 전역 로더 훅

const NaverMap = () => {
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

      const hanseoCenter = new window.naver.maps.LatLng(
        36.69085,
        126.58297
      );

      const map = new window.naver.maps.Map(mapRef.current, {
        center: hanseoCenter,
        zoom: 16,
      });

      new window.naver.maps.Marker({
        position: hanseoCenter,
        map,
        title: "한서대학교",
      });

      // ✅ 여기까지 왔으면 지도/마커 초기화는 끝난 상태 → 바로 로더 끄기
      hideLoading();
    } catch (e) {
      console.error(e);
      hideLoading(); // ✅ 예외 나도 무조건 해제
    }

    // StrictMode에서 이펙트가 두 번 도는 것까지 고려하면
    // cleanup에서 별도로 hideLoading 안 하는 게 안정적 (위에서 show/hide 1:1로 끝냄)
  }, [showLoading, hideLoading]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
