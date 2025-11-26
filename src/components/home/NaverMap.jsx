// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx"; // ✅ 전역 로더 훅

const NaverMap = () => {
  const mapRef = useRef(null);
  const { showLoading, hideLoading } = useLoading(); // ✅ 로더 제어

  useEffect(() => {
    let done = false; // ✅ hideLoading 중복 호출 방지용 플래그

    showLoading(); // ✅ 지도 준비 시작 → 로더 +1

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

    // ✅ 지도 타일이 한 번 다 그려지고 나서 로더 끄기
    window.naver.maps.Event.addListener(map, "idle", () => {
      if (!done) {
        hideLoading(); // ✅ 최초 idle 시점에 로더 -1
        done = true;
      }
    });

    return () => {
      // 컴포넌트 언마운트 시 아직 idle 안 왔으면 여기서라도 로더 해제
      if (!done) {
        hideLoading();
        done = true;
      }
    };
  }, [showLoading, hideLoading]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
