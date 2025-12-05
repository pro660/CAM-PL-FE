// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx";

import PlaceMarkerIcon from "../../images/map/marker-place.svg";

/**
 * props:
 * - markers: [{ id, name, placeKey, lat, lng, count }]
 * - center: { lat, lng } | null   // 선택된 장소가 있을 때만 사용
 * - userLocation: { lat, lng } | null // 🔴 사용자 현재 위치
 * - onMarkerClick: (marker) => void
 */
const NaverMap = ({ markers = [], center, userLocation, onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null); // 🔴 사용자 위치 마커
  const { showLoading, hideLoading } = useLoading();

  // ✅ 지도는 한 번만 생성
  useEffect(() => {
    showLoading(); // 지도 준비 시작

    try {
      if (!window.naver || !window.naver.maps) {
        console.error("네이버 지도 스크립트가 로드되지 않았습니다.");
        hideLoading();
        return;
      }
      if (!mapRef.current) {
        hideLoading();
        return;
      }

      const { naver } = window;

      // 한서대학교 기본 중심 (고정)
      const defaultCenter = new naver.maps.LatLng(36.69085, 126.58297);

      const map = new naver.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 16,
      });

      mapInstanceRef.current = map;
      hideLoading();
    } catch (e) {
      console.error(e);
      hideLoading();
    }

    return () => {
      // 언마운트 시 마커 제거
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];

      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }

      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading, hideLoading]);

  // ✅ markers / center / userLocation 변경될 때마다 부드럽게 이동 + 마커 재배치
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.naver) return;
    const { naver } = window;

    const defaultCenter = new naver.maps.LatLng(36.69085, 126.58297);

    // ------- 지도 중심 부드럽게 이동 (선택된 장소 기준) -------
    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lng === "number"
    ) {
      const target = new naver.maps.LatLng(center.lat, center.lng);
      // ✅ 선택된 장소가 있으면 그 위치로 부드럽게 이동
      map.panTo(target);
    } else {
      // ✅ 선택된 장소가 없으면 다시 한서대 기본 위치로 부드럽게 복귀
      map.panTo(defaultCenter);
    }

    // ------- 기존 일정/장소 마커 제거 -------
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // ✅ 커스텀 SVG 마커 옵션 (장소용)
    const markerIcon =
      PlaceMarkerIcon && typeof PlaceMarkerIcon === "string"
        ? {
            url: PlaceMarkerIcon,
            // 원본 비율 유지 + 화면 크기만 조절
            scaledSize: new naver.maps.Size(30, 30),
            origin: new naver.maps.Point(0, 0),
            anchor: new naver.maps.Point(15, 30), // 30x30 기준 중앙 아래
          }
        : null;

    // ------- 새 장소 마커 생성 -------
    if (markers.length > 0) {
      markers.forEach((m) => {
        if (typeof m.lat !== "number" || typeof m.lng !== "number") return;

        const markerOptions = {
          position: new naver.maps.LatLng(m.lat, m.lng),
          map,
          title: m.name || undefined,
        };

        if (markerIcon) {
          markerOptions.icon = markerIcon;
        }

        const marker = new naver.maps.Marker(markerOptions);

        if (onMarkerClick) {
          naver.maps.Event.addListener(marker, "click", () => {
            onMarkerClick(m); // MapPage에서 selectedPlace 세팅 → 정보 패널 + 지도 이동
          });
        }

        markersRef.current.push(marker);
      });
    }

    // ------- 사용자 현재 위치 마커 (빨간 동그라미) -------
    // 이전 사용자 마커 제거
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (
      userLocation &&
      typeof userLocation.lat === "number" &&
      typeof userLocation.lng === "number"
    ) {
      const userPos = new naver.maps.LatLng(
        userLocation.lat,
        userLocation.lng
      );

      const userMarker = new naver.maps.Marker({
        position: userPos,
        map,
        icon: {
          content:
            '<div style="width:18px;height:18px;border-radius:50%;background:#ff3b30;border:2px solid #ffffff;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
          anchor: new naver.maps.Point(9, 9),
        },
        clickable: false,
      });

      userMarkerRef.current = userMarker;
    }
  }, [markers, center, userLocation, onMarkerClick]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
