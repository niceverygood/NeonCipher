// ============================================================================
// Stage briefings — narrative shown before a sortie. Keyed by stage id.
// Pure data; rendered by the briefing modal in StageSelect.
// ============================================================================

export interface StageBriefing {
  from: string; // sender handle
  transmission: string; // briefing body
  objective: string; // one-line objective
}

export const STAGE_BRIEFINGS: Record<string, StageBriefing> = {
  stage_1: {
    from: '>_ FIXER // 익명',
    transmission:
      '신참이군. 슬럼 게이트의 방화벽은 낡았지만 ICE가 우글거려. 네 고스트들을 풀어 코어를 지켜. 죽은 자들의 손을 빌리는 데 익숙해지도록.',
    objective: '슬럼 게이트의 데이터 코어를 8웨이브 동안 사수하라.',
  },
  stage_2: {
    from: '>_ BROKER // 베스퍼',
    transmission:
      '데이터 시장이 털리기 직전이야. 여기 노드가 무너지면 도시 절반의 비밀이 경매에 올라가. 돌진형 데몬이 빠르니 전열을 단단히 세워.',
    objective: '암거래 노드를 방어하고 RUSH 데몬의 침투를 막아라.',
  },
  stage_3: {
    from: '>_ SYSOP // 익명',
    transmission:
      '냉각 탑이 과열됐다. 끓어오르는 ICE가 중장갑을 두르고 올라와. 화력만으론 부족해 — 관통과 약점 노출로 껍질을 벗겨내.',
    objective: '냉각 탑의 HEAVY 데몬을 처리하고 코어를 지켜라.',
  },
  stage_4: {
    from: '>_ GHOST // 레버넌트',
    transmission:
      '기업 방화벽이다. 여기서부터는 그들도 진심이야. 거대한 무언가가 회선 너머에서 깨어나고 있어. 모든 화력을 쏟아부어라.',
    objective: '기업 방화벽을 돌파하라. 보스 시그니처 감지됨.',
  },
  stage_5: {
    from: '>_ ??? // 알 수 없음',
    transmission:
      '도시의 의식이 잠든 심층 코어. 여기 있는 건 적이 아니라… 우리 같은 것들이야. 끝을 보고 싶다면, 마지막 문을 열어.',
    objective: '심층 코어에 도달해 최종 방어전에서 승리하라.',
  },
};

export const DEFAULT_BRIEFING: StageBriefing = {
  from: '>_ SYSTEM',
  transmission: '미지의 섹터다. 코어를 지키고 살아남아라.',
  objective: '데이터 코어를 사수하라.',
};
