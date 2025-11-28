ChatGPT의 말:
🏫 CAM-PL (캠플) – 캠퍼스 라이프 플래너

한서대학교를 시작으로, 전국 대학생의 시간·공간·일정을 한 번에 관리할 수 있는 웹 서비스

**CAM-PL(캠플)**은 강의 시간표, 학교 지도, 개인 일정을 한 화면에서 관리할 수 있도록 만든
React 기반 캠퍼스 라이프 올인원 플래너입니다.
기획 · 디자인 · 프론트엔드 구현 · 서버 배포까지 혼자 end-to-end로 진행한 개인 프로젝트입니다.

🔗 Live 서비스: https://campl.site

💻 Frontend Repo: 현재 README가 있는 이 저장소

🧑‍💻 Tech Stack












Frontend: React, React Router, Context API, Axios

Map: Naver Maps JavaScript API

State & UX: Custom Hooks, Global Loading Context, 모달/바텀시트 UI

Infra / Deploy

Ubuntu 서버에 React 빌드 결과물 배포

Nginx Reverse Proxy + HTTPS (SSL, Let’s Encrypt)

git pull → npm install → npm run build → nginx reload 자동화 쉘 스크립트로 원클릭 재배포 구축

✨ 핵심 기능 (Features)
1️⃣ 시간표 × 캠퍼스 지도 연동

사용자의 강의 시간표를 기반으로

강의가 열리는 건물 / 강의실 위치를 지도에서 바로 확인

시간표에서 강의를 선택하면, 해당 건물 위치로 네이버 지도 자동 이동 & 하이라이트

강의 사이 공강 시간에

주변 카페 / 식당 / 자습공간을 한 번에 찾아볼 수 있도록 확장 가능하게 설계

2️⃣ 학사 & 개인 일정 캘린더

월간 달력에서 학사 일정 + 개인 일정을 한 번에 확인

일정이 있는 날에는 작은 점(dots) 으로 표시

오늘 날짜는 보라색 원으로 강조해 시인성 강화

날짜를 선택하면 바텀시트가 올라와서:

해당 날짜의 일정 리스트 노출

일정마다 수정 버튼, 메모 버튼 제공

일정 상세 정보:

카테고리 (강의, 과제, 팀플, 미팅, 식사, 모임 등)

시간 / 장소 / 메모 등

3️⃣ 장소 상세 정보 모달

지도에서 건물/장소 클릭 시 PlaceDetailModal 오픈

장소 이름, 설명

운영 시간, 간단 안내

(추가 확장용 필드 포함 – 가격 정보 등도 표현 가능하도록 구조 설계)

비동기 API 호출 시 로딩 상태 관리:

전역 LoadingContext를 활용해 사용자에게 깔끔한 로딩 경험 제공

4️⃣ 모바일 우선(UI/UX)

실제 사용자는 대부분 스마트폰으로 접속한다고 가정하고 모바일 퍼스트로 설계

430px 기준 모바일 화면 최적화

하단 바텀시트, 플로팅 액션 버튼(FAB) 등 모바일 친화적인 패턴 적극 활용

한 손으로 조작 가능한 터치 영역, 버튼 크기, 간격 고려

이후 태블릿/데스크톱에서도 레이아웃이 깨지지 않도록 반응형 구조 적용

5️⃣ 인증 & 보호된 라우트

로그인 시 발급받은 토큰을 이용해 보호된 페이지 접근 제어

React Router 기반 Private Route 패턴 사용

API 호출 시 Axios 인스턴스에 공통 헤더 & 에러 처리 인터셉터 적용

6️⃣ 전국 대학으로의 확장 가능성을 고려한 설계

도메인, 캠퍼스 정보, 강의/건물 데이터 구조를

특정 학교(한서대)에 하드코딩하지 않고

다른 대학의 데이터셋으로도 쉽게 교체/추가 가능한 구조로 설계

“한 학교에서 잘 작동하는 서비스”를 넘어

전국 대학교를 지원하는 플랫폼으로 확장 가능한 아키텍처를 목표로 개발

🏗 프로젝트 구조 (요약)
src/
  api/
    axios.js              # Axios 인스턴스 및 공통 설정
  components/
    home/
      NaverMap.jsx        # 네이버 지도 래퍼 컴포넌트
      TimetableMapSection.jsx
      PlaceDetailModal.jsx
    common/
      Header.jsx
      BottomSheet.jsx
      FloatingButton.jsx
  context/
    LoadingContext.jsx    # 전역 로딩 상태 관리
    AuthContext.jsx       # 인증 / 사용자 정보 관리
  pages/
    Home/
    Calendar/
    Timetable/
    Login/
  css/
    home/
    calendar/
    common/
  App.jsx
  index.jsx


실제 구조와 100% 동일하지 않을 수 있으나, 전반적인 설계 방향은 위와 같습니다.

🚀 실행 방법 (Getting Started)

Node.js 18+ 권장

# 1. 레포지토리 클론
git clone https://github.com/pro660/CAM-PL-FE.git
cd CAM-PL-FE

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행 (CRA 기준)
npm start

# 4. 프로덕션 빌드
npm run build

🔐 환경 변수 설정 예시 (.env)
REACT_APP_API_BASE_URL=https://api.campl.site/api
REACT_APP_NAVER_MAP_CLIENT_ID=네이버_지도_API_키


실제 키 값은 로컬 개발 환경에서 개별적으로 설정해야 합니다.

⚙️ 배포 구조

Infra

Ubuntu 22.04 LTS

Nginx: Reverse Proxy + React 정적 파일 서빙

Let’s Encrypt SSL 적용 (https://campl.site)

배포 자동화

아래 과정을 하나의 .sh 스크립트로 작성하여 원클릭 재배포

git pull 로 최신 코드 반영

npm install 로 의존성 업데이트

npm run build 로 빌드

Nginx 재시작 / reload

프론트엔드 개발뿐 아니라, 실제 서비스 운영 환경에 올려본 경험을 강조할 수 있습니다.

🧠 설계 포인트 & 고민했던 부분

실제 사용자 시나리오 기반 설계

“강의 끝나고 이동해야 하는 강의실은 어디지?”

“이번 주 일정/과제/팀플을 한 번에 보고 싶다”

이런 구체적인 상황을 기준으로 화면과 동선을 설계

비동기 데이터 흐름 정리

시간표, 장소, 일정, 메모 등 서로 다른 도메인 데이터가 섞이지 않도록

API 모듈 분리 + Context/props 설계를 통해 데이터 흐름을 명확히 유지

에러/로딩 UX

단순히 “콘솔 오류”로 끝나는 것이 아니라

사용자에게 어떤 상황인지 명확히 보여주는 것을 목표로 디자인

확장성 고려

처음부터 “한서대학교”에만 맞춘 서비스가 아니라,

다른 대학 캠퍼스 데이터만 주면 곧바로 쓸 수 있는 플랫폼을 지향

📌 앞으로의 로드맵 (Planned)

 다크 모드 지원

 PWA 적용 → 모바일 앱처럼 홈 화면에 설치

 알림 기능 (과제 마감 / 강의 시작 10분 전 알림)

 더 많은 캠퍼스(다른 대학교) 데이터 연동

 E2E 테스트(Playwright / Cypress) 도입

🙋‍♂️ About Me

역할: 기획 · 디자인 · 프론트엔드 · 서버 배포 전부 1인 담당

목표:

“캠퍼스에서 실제로 쓰일 수 있는 서비스”를 만들어 보고 싶었습니다.

단순 토이 프로젝트가 아니라, 실제 도메인 · 실제 사용자 문제 · 실제 배포까지 경험하는 것이 목표였습니다.

CAM-PL을 통해:

React SPA 설계

비동기 API 연동

지도 서비스(Naver Map) 통합

Nginx 기반 배포/운영
까지 한 번에 경험했음을 보여주고자 합니다.