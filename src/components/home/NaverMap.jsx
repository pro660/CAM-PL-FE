// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx";
import { useLocation } from "react-router-dom";

import PlaceMarkerIcon from "../../images/map/marker-place.svg";

// 🔴 정적 기준 좌표 (빨간 마커 + 기본 중심)
const STATIC_CENTER_LAT = 36.690621;
const STATIC_CENTER_LNG = 126.581591;

/**
 * props:
 * - markers: [{ id, name, placeKey, lat, lng, count }]
 * - center: { lat, lng } | null   // 부모에서 선택된 장소가 있으면 그 좌표
 * - onMarkerClick: (marker) => void
 * - onMapDrag: () => void         // 지도 드래그 시작 시 호출 (선택 해제 등)
 */
const NaverMap = ({ markers = [], center, onMarkerClick, onMapDrag }) => {
  const location = useLocation();
  const isHomeMap = location.pathname === "/"; // 홈에서만 재센터 이벤트 사용

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const staticMarkerRef = useRef(null); // 🔴 정적 빨간 마커
  const dragListenerRef = useRef(null); // 드래그 리스너
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

      const defaultCenter = new naver.maps.LatLng(
        STATIC_CENTER_LAT,
        STATIC_CENTER_LNG
      );

      const map = new naver.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 16,
      });

      // 지도 드래그 시작 시 콜백
      if (onMapDrag) {
        dragListenerRef.current = naver.maps.Event.addListener(
          map,
          "dragstart",
          () => {
            onMapDrag();
          }
        );
      }

      mapInstanceRef.current = map;
    } catch (e) {
      console.error(e);
    } finally {
      hideLoading();
    }

    return () => {
      const { naver } = window || {};

      // 언마운트 시 장소 마커 제거
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];

      // 정적 빨간 마커 제거
      if (staticMarkerRef.current) {
        staticMarkerRef.current.setMap(null);
        staticMarkerRef.current = null;
      }

      // 드래그 리스너 제거
      if (dragListenerRef.current && naver?.maps?.Event) {
        naver.maps.Event.removeListener(dragListenerRef.current);
        dragListenerRef.current = null;
      }

      mapInstanceRef.current = null;
    };
  }, [showLoading, hideLoading, onMapDrag]);

  // ✅ 홈 페이지에서만: 전역 이벤트로 캠퍼스 위치로 재중심
  useEffect(() => {
    if (!isHomeMap) return;

    const handler = () => {
      if (!window.naver || !mapInstanceRef.current) return;
      const { naver } = window;
      const staticPos = new naver.maps.LatLng(
        STATIC_CENTER_LAT,
        STATIC_CENTER_LNG
      );
      mapInstanceRef.current.panTo(staticPos);
    };

    window.addEventListener("campl-recenter-home", handler);
    return () => {
      window.removeEventListener("campl-recenter-home", handler);
    };
  }, [isHomeMap]);

  // ✅ markers / center 변경될 때마다 지도/마커 업데이트
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.naver) return;
    const { naver } = window;

    const defaultCenter = new naver.maps.LatLng(
      STATIC_CENTER_LAT,
      STATIC_CENTER_LNG
    );

    // ------- 지도 중심 이동 -------
    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lng === "number"
    ) {
      const target = new naver.maps.LatLng(center.lat, center.lng);
      map.panTo(target); // 선택된 장소
    } else {
      map.panTo(defaultCenter); // 기본: 정적 좌표
    }

    // ------- 기존 장소 마커 제거 -------
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // ✅ 커스텀 SVG 마커 옵션 (장소용)
    const markerIcon =
      PlaceMarkerIcon && typeof PlaceMarkerIcon === "string"
        ? {
            url: PlaceMarkerIcon,
            scaledSize: new naver.maps.Size(30, 30),
            origin: new naver.maps.Point(0, 0),
            anchor: new naver.maps.Point(15, 30),
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
            onMarkerClick(m);
          });
        }

        markersRef.current.push(marker);
      });
    }

    // ------- 정적 빨간 마커 (항상 STATIC_CENTER_LAT/LNG) -------
    if (staticMarkerRef.current) {
      staticMarkerRef.current.setMap(null);
      staticMarkerRef.current = null;
    }

    const staticPos = new naver.maps.LatLng(
      STATIC_CENTER_LAT,
      STATIC_CENTER_LNG
    );

    const redMarker = new naver.maps.Marker({
      position: staticPos,
      map,
      icon: {
        content:
          '<div style="width:13px;height:13px;border-radius:50%;background:#ff3b30;border:2px solid #ffffff;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
        anchor: new naver.maps.Point(9, 9),
      },
      clickable: false,
    });

    staticMarkerRef.current = redMarker;
  }, [
    markers,
    center,
    // ⛔ onMarkerClick 제거: 부모 리렌더만으로는 다시 panTo 하지 않게
  ]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
