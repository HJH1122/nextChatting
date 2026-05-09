# Chat Service Implementation Guide (WebSocket)

이 파일은 이 프로젝트에 구현된 실시간 채팅 서비스의 아키텍처, 기능 명세 및 개발 표준을 정의합니다.

## 1. 기술 스택
- **실시간 엔진:** `Socket.io` (Pages Router API Route 기반 핸들러)
- **프레임워크:** `Next.js` (App Router + Pages Router 혼합 사용)
- **데이터베이스:** `Prisma` + `PostgreSQL`
- **상태 관리:** `SocketContext` (클라이언트 소켓 인스턴스 관리)
- **UI 라이브러리:** `Shadcn UI`, `Tailwind CSS`, `SCSS Module`

## 2. 주요 구현 기능

### 2.1 실시간 통신 (WebSocket)
- **Room 기반 통신:** `socket.join(roomId)`를 통한 방 별 메시지 격리.
- **접속자 관리:** 방별 실시간 접속자 목록(`online-users`) 제공.
- **상태 동기화:** 입력 중 표시(`typing`), 퇴장/입장 시스템 메시지 발송.

### 2.2 메시지 기능
- **이력 로드:** 커서 기반 무한 스크롤(Infinite Scroll) 지원 (`/api/messages`).
- **메시지 검색:** 특정 키워드를 통한 과거 내역 검색 지원 (`/api/messages/search`).
- **링크 프리뷰:** 메시지 내 URL 감지 시 `link-preview-js`를 이용한 메타데이터 자동 추출 및 표시.
- **파일 공유:** 이미지(PNG, JPG), PDF 파일 업로드 및 공유 기능 (`/api/upload`).

### 2.3 설문조사 (Poll)
- **동적 생성:** 메시지 입력창을 통한 설문 생성 및 발송.
- **실시간 투표:** `Socket.io`를 통한 실시간 투표 결과 업데이트 및 데이터베이스 동기화.

### 2.4 챗봇 (Bot Helper)
- **명령어 지원:** `/도움말` 등 특정 명령어에 대응하는 자동 응답 시스템.

## 3. 아키텍처 구조

### 3.1 서버 (Server-side)
- `src/pages/api/socket/io.ts`: Socket.io 서버 초기화 및 이벤트 리스너(메시지 저장, 프리뷰 추출, 투표 처리 등) 정의.
- `src/lib/socket.ts`: 싱글톤 소켓 인스턴스 관리.
- `src/app/api/`: REST API 엔드포인트 (파일 업로드, 메시지 조회/검색).

### 3.2 클라이언트 (Client-side)
- `src/components/providers/socket-provider.tsx`: 전역 소켓 컨텍스트 제공.
- `src/components/chat/`: 채팅 UI 구성 요소 (Room, List, Input, Poll 등).

## 4. 개발 규칙 및 보안
- **Type Safety:** `src/types/socket.d.ts`에 정의된 인터페이스를 엄격히 준수할 것.
- **파일 업로드 제한:** 최대 10MB, 허용된 확장자(PDF, PNG, JPG)만 처리 가능.
- **에러 핸들링:** 소켓 이벤트 및 API 요청 시 반드시 try-catch 블록을 사용하고 적절한 로그를 남길 것.
- **환경 변수:** `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` 등 중요 설정은 `.env`에서 관리.
