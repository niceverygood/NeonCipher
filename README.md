# NEON CIPHER

> 사이버펑크 **퍼즐 × 레인 디펜스 수집형** 웹 게임. 매치-3로 에너지를 모아
> 죽은 의식체 **고스트(Ghost)** 를 소환하고, 3개 레인을 타고 내려오는 적으로부터
> **데이터 코어**를 사수한다. 클라이언트 단독으로 완결되는 정적 웹앱.

![tone](https://img.shields.io/badge/tone-neon--noir-ff2a6d) ![stack](https://img.shields.io/badge/stack-Vite%20%2B%20React%20%2B%20TS-00eaff)

---

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (tsc + vite build)
npm run preview  # 빌드 결과 미리보기
npm run test     # 도메인 로직 단위 테스트 (vitest)
npm run lint     # ESLint
```

## 배포

정적 SPA이므로 어디에나 올릴 수 있다. `dist/`를 그대로 호스팅하면 된다.

- **Vercel**: 저장소 연결 → 자동 감지(`vercel.json` 포함). 또는 `vercel --prod`.
- **Netlify / GitHub Pages**: `npm run build` 후 `dist/` 업로드. 해시 라우팅을 쓰므로
  서버 리라이트 설정 없이도 새로고침이 안전하다. (`base: './'` 상대경로 빌드)

---

## 플레이 흐름

```
스플래시 → 로비 → 스테이지 선택 → 전투(승/패) → 결과·보상 → 가챠 → 도감/편성 → 다시 전투
```

진행 상황(보유 고스트·재화·천장 카운터·클리어 스테이지·편성·설정)은 `localStorage`에
저장되어 **새로고침해도 유지**된다. 데이터 초기화는 설정 화면에서 가능.

## 핵심 시스템

### 전투 (퍼즐 × 레인 디펜스)
- **해킹 그리드**: 6×6, 5속성 타일(화·차·침·과·복). 인접 2타일 스왑 매치-3.
  매치된 타일 수 × 기본 에너지가 해당 속성 에너지(0~100)에 가산. 4/5매치·연쇄 보너스.
- **디펜스 필드**: 3레인. 적 3종(일반/돌진/중장)이 코어로 전진. 고스트를 소환해 요격.
  적이 코어 도달 시 코어 HP 감소.
- **오버클럭**: 연속 매치로 콤보 누적 → 게이지 충전. 가득 차면 적 감속 + 아군 데미지 1.5배.
- **승패**: 8웨이브 생존 = 승리, 코어 HP 0 = 패배. 잔여 코어 HP로 ★1~3 산정.
- 일시정지 / 1×·2× 배속 지원. 게임 루프는 React 밖의 고정 timestep
  (`requestAnimationFrame`), 필드는 Canvas, 그리드·HUD는 DOM 렌더.

### 가챠
- 기본 확률 **SSR 2% / SR 18% / R 80%**.
- **소프트 천장**: 75연차부터 SSR 확률 선형 증가(+6%/연).
- **하드 천장**: 90연차 SSR 확정 후 카운터 리셋.
- **10연**: SR 이상 1개 보장.
- **픽업 50:50**: SSR 획득 시 50% 픽업, 졌으면 다음 SSR 픽업 확정(`guaranteed`).
- 재화: `crystal`(전투 보상) / `cube`(프리미엄, 테스트 지급 버튼) / 단챠·10연 티켓.
- 모든 카운터(천장·확정 플래그·총 모집 수)가 저장된다.

### 성장 / 메타
- 레벨업(크리스탈 소모), 동일 고스트 중복 시 **각성(별↑)**, 편성 5칸.
- 도감(보유/미보유 실루엣), 편성(속성·역할 시너지 표시), 설정(음소거·저사양·초기화).

---

## 프로젝트 구조

```
src/
├─ app/            # 화면: Splash, Lobby, StageSelect, Battle, Result, Gacha, Codex, Team, Settings
│  └─ battle/      # GridView(DOM), drawField(canvas)
├─ game/           # 순수 도메인 로직 (React 무관)
│  ├─ battle/      # grid.ts(매치-3), engine.ts(게임루프/적·유닛/오버클럭)
│  ├─ gacha/       # gacha.ts (확률·천장·보장, 순수함수)
│  └─ progression/ # stats.ts (스탯·레벨·각성·★판정)
├─ data/           # ghosts.ts(12), waves.ts(스테이지×8웨이브), balance.ts(튜닝 상수)
├─ state/          # store.ts (zustand + persist)
├─ ui/             # 공통 컴포넌트 / 디자인 토큰
└─ styles/         # 전역 CSS (네온 토큰, 스캔라인, 글리치, 글로우)
tests/             # gacha / progression / grid 단위 테스트
```

## 디자인 토큰

네온 누아르 — 어둠 위 채도 높은 네온. CSS 변수로 정의(`src/styles/index.css`):
배경 `#05060a`, 시안 `#00eaff`, 마젠타 `#ff2a6d`, 5속성(화 `#ff3b30` / 차 `#1f9bff` /
침 `#2bff88` / 과 `#ffd400` / 복 `#b14eff`). 전 화면 스캔라인, 발광 글로우,
타이틀·결과 글리치(RGB 분리). 폰트: Chakra Petch / Space Mono / Noto Sans KR.
세로 모바일 비율 기준, 데스크톱에서는 기기 프레임 안에 중앙 배치.

## 구현 범위

**구현됨**: 전체 플레이 루프, 전투 엔진(매치-3·레인 디펜스·오버클럭·승패·★),
가챠(확률·소프트/하드 천장·10연 보장·50:50 픽업·저장), 성장(레벨·각성),
도감·편성·시너지·설정·세이브, 반응형, 단위 테스트.

**범위 밖(스텁/추후)**:
- 실제 결제 SDK 연동 — `cube`는 "테스트 지급" 버튼으로 대체.
- 백엔드 서버 / DB / 실시간 — 전부 클라이언트 단독, localStorage.
- 스킬 액티브 연출은 역할 기반 자동 동작(딜러 공격 / 탱커 전열 / 힐러·서포터 회복)으로
  단순화. 고스트별 고유 스킬 컷신은 추후 확장 포인트.
- 사운드(SFX)는 미구현(음소거 토글만 노출). DoD에는 미포함 항목.

## 기술 스택

Vite · React 18 · TypeScript(strict) · Tailwind CSS · Zustand(persist) ·
Framer Motion · React Router(해시) · Canvas + RAF 게임 루프.
