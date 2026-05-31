import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/ui/Screen';
import { ScreenHeader, Modal } from '@/ui/primitives';
import { useGame } from '@/state/store';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 46,
        height: 26,
        borderRadius: 14,
        border: `1px solid ${on ? 'var(--cyan)' : 'var(--line2)'}`,
        background: on ? 'rgba(0,234,255,.15)' : 'var(--panel2)',
        position: 'relative',
        cursor: 'pointer',
        transition: '0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: on ? 'var(--cyan)' : 'var(--dim)',
          boxShadow: on ? '0 0 10px var(--cyan)' : 'none',
          transition: '0.2s',
        }}
      />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div className="font-disp" style={{ fontSize: 14, fontWeight: 600, color: '#eef2ff' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const nav = useNavigate();
  const settings = useGame((s) => s.settings);
  const toggleMute = useGame((s) => s.toggleMute);
  const setReducedFx = useGame((s) => s.setReducedFx);
  const resetData = useGame((s) => s.resetData);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen>
      <ScreenHeader kicker="System // Config" title="설정" accent="var(--repair)" onBack={() => nav('/lobby')} />

      <div className="scroll" style={{ flex: 1, padding: '4px 18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row label="음소거" desc="효과음 출력 (기본 ON)">
          <Toggle on={settings.muted} onClick={toggleMute} />
        </Row>
        <Row label="저사양 모드" desc="글로우·블러 등 무거운 연출 비활성">
          <Toggle on={settings.reducedFx} onClick={() => setReducedFx(!settings.reducedFx)} />
        </Row>

        <div className="panel" style={{ padding: 16 }}>
          <div className="font-disp" style={{ fontSize: 14, fontWeight: 600, color: 'var(--mag)' }}>데이터 초기화</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
            보유 고스트·재화·진행도·천장 카운터가 모두 삭제되고 초기 상태로 되돌아갑니다.
          </div>
          <button className="btn btn-mag" onClick={() => setConfirmReset(true)} style={{ marginTop: 12, padding: '10px 16px', fontSize: 11 }}>
            전체 초기화
          </button>
        </div>

        <div className="panel" style={{ padding: 16 }}>
          <div className="font-disp" style={{ fontSize: 13, fontWeight: 600, color: '#eef2ff', marginBottom: 8 }}>정보</div>
          <InfoLine k="버전" v="v1.0.0 · BUILD 2026" />
          <InfoLine k="장르" v="퍼즐 × 레인 디펜스 수집형" />
          <InfoLine k="저장" v="로컬 (localStorage)" />
          <InfoLine k="개발" v="BOTTLE INC." />
        </div>
      </div>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)}>
          <div className="font-disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--mag)' }}>정말 초기화할까요?</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
            모든 진행 데이터가 영구히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="btn btn-mag" onClick={() => { resetData(); setConfirmReset(false); nav('/'); }} style={{ flex: 1, padding: 11, fontSize: 12 }}>
              초기화
            </button>
            <button className="btn" onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: 11, fontSize: 12 }}>
              취소
            </button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

function InfoLine({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{k}</span>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--txt)' }}>{v}</span>
    </div>
  );
}
