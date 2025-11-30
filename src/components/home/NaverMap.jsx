// src/components/home/NaverMap.jsx
import React, { useEffect, useRef } from "react";
import "../../css/home/HomePage.css";
import { useLoading } from "../../context/LoadingContext.jsx";

import PlaceMarkerIcon from "../../images/map/marker-place.svg";

/**
 * props:
 * - markers: [{ id, name, lat, lng, count }]
 * - center: { lat, lng } | null       // 선택된 장소가 있을 때 그 장소 중심
 * - userLocation: { lat, lng } | null // 사용자 현재 위치
 * - routeTarget: { lat, lng } | null  // 경로를 그릴 목적지 (선택된 장소)
 * - onMarkerClick: (marker) => void
 */
const NaverMap = ({ markers = [], center, userLocation, routeTarget, onMarkerClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userCircleRef = useRef(null);
  const routePolylineRef = useRef(null);
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

      // 한서대학교 기본 중심 (fallback용)
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
      // 언마운트 시 마커/원/경로 제거
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];

      if (userCircleRef.current) {
        userCircleRef.current.setMap(null);
        userCircleRef.current = null;
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }

      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading, hideLoading]);

  // ✅ markers / center / userLocation / routeTarget 변경될 때마다
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.naver) return;
    const { naver } = window;

    const defaultCenter = new naver.maps.LatLng(36.69085, 126.58297);

    // ===== 1. 지도 중심 부드럽게 이동 =====
    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lng === "number"
    ) {
      // 선택된 장소가 있으면 → 그 장소 중심
      const target = new naver.maps.LatLng(center.lat, center.lng);
      map.panTo(target);
    } else if (
      userLocation &&
      typeof userLocation.lat === "number" &&
      typeof userLocation.lng === "number"
    ) {
      // 선택된 장소는 없고, 사용자 위치가 있으면 → 사용자 위치 중심
      const target = new naver.maps.LatLng(userLocation.lat, userLocation.lng);
      map.panTo(target);
    } else {
      // 둘 다 없으면 → 한서대 기본 위치
      map.panTo(defaultCenter);
    }

    // ===== 2. 기존 장소 마커 제거 =====
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // ✅ 커스텀 SVG 마커 옵션 (장소 마커용)
    const markerIcon =
      PlaceMarkerIcon && typeof PlaceMarkerIcon === "string"
        ? {
            url: PlaceMarkerIcon,
            size: new naver.maps.Size(25, 25), // SVG 원본 기준 사이즈
            scaledSize: new naver.maps.Size(40, 40),
            origin: new naver.maps.Point(0, 0),
            anchor: new naver.maps.Point(20, 40), // 꼬리 끝이 좌표를 가리키도록
          }
        : null;

    // ===== 3. 장소 마커 다시 생성 =====
    if (markers.length > 0) {
      markers.forEach((m) => {
        if (typeof m.lat !== "number" || typeof m.lng !== "number") return;

        const markerOptions = {
          position: new naver.maps.LatLng(m.lat, m.lng),
          map,
          title: m.name || undefined,
        };

        // 아이콘 파일이 있으면 icon 적용
        if (markerIcon) {
          markerOptions.icon = markerIcon;
        }

        const marker = new naver.maps.Marker(markerOptions);

        if (onMarkerClick) {
          naver.maps.Event.addListener(marker, "click", () => {
            onMarkerClick(m); // MapPage에서 selectedPlace 세팅 → 정보 패널 + 지도 이동 + 경로 표시
          });
        }

        markersRef.current.push(marker);
      });
    } else {
      // 마커가 아예 없으면 기본 캠퍼스 마커 하나만
      const markerOptions = {
        position: defaultCenter,
        map,
        title: "한서대학교",
      };

      if (markerIcon) {
        markerOptions.icon = markerIcon;
      }

      const defaultMarker = new naver.maps.Marker(markerOptions);
      markersRef.current.push(defaultMarker);
    }

    // ===== 4. 사용자 위치 파란 원 표시 =====
    if (
      userLocation &&
      typeof userLocation.lat === "number" &&
      typeof userLocation.lng === "number"
    ) {
      const userLatLng = new naver.maps.LatLng(
        userLocation.lat,
        userLocation.lng
      );

      if (!userCircleRef.current) {
        // 처음 생성
        userCircleRef.current = new naver.maps.Circle({
          map,
          center: userLatLng,
          radius: 10, // m 단위, 필요하면 조절
          fillColor: "#1E90FF",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          clickable: false,
        });
      } else {
        // 위치만 업데이트
        userCircleRef.current.setCenter(userLatLng);
      }
    } else {
      // 위치 정보 없으면 원 제거
      if (userCircleRef.current) {
        userCircleRef.current.setMap(null);
        userCircleRef.current = null;
      }
    }

    // ===== 5. 사용자 위치 ↔ 선택 장소 직선 경로 표시 =====
    if (
      routeTarget &&
      userLocation &&
      typeof userLocation.lat === "number" &&
      typeof userLocation.lng === "number" &&
      typeof routeTarget.lat === "number" &&
      typeof routeTarget.lng === "number"
    ) {
      const userLatLng = new naver.maps.LatLng(
        userLocation.lat,
        userLocation.lng
      );
      const targetLatLng = new naver.maps.LatLng(
        routeTarget.lat,
        routeTarget.lng
      );

      const path = [userLatLng, targetLatLng];

      if (!routePolylineRef.current) {
        routePolylineRef.current = new naver.maps.Polyline({
          map,
          path,
          strokeColor: "#3366FF",
          strokeOpacity: 0.85,
          strokeWeight: 4,
          strokeStyle: "solid",
          clickable: false,
        });
      } else {
        routePolylineRef.current.setPath(path);
        routePolylineRef.current.setMap(map);
      }
    } else {
      // 경로 대상 없으면 라인 제거
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
    }
  }, [markers, center, userLocation, routeTarget, onMarkerClick]);

  return <div ref={mapRef} className="home-naver-map" />;
};

export default NaverMap;
