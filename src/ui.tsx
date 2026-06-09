import { useState, useEffect, type ReactNode, type CSSProperties } from 'react';
import { setKey, clearKey, hasKey, keyFromEnv } from './lib/ai';

/** localStorage 동기화 state */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ } }, [key, val]);
  return [val, setVal];
}

/** 프로젝트 메타 — 기능 + 포트폴리오 정보 콘텐츠 */
export interface Meta {
  id: number; icon: string; title: string; tagline: string; members: string[]; color: string; note?: string;
  ai?: boolean;                                      // OpenAI 사용 앱이면 키 입력 바 표시
  problem: string;                                   // 문제/배경
  features: { icon: string; title: string; desc: string }[];
  howto: string[];                                   // 사용 방법
  facts: { value: string; label: string }[];         // 도메인 통계
  info: { title: string; body: string }[];           // 도메인 지식 카드
  pipeline?: string[];                                // AI/데이터 처리 흐름(단계)
  techNotes?: { title: string; body: string }[];      // 기술 설계 노트
  stack: string[];                                   // 기술 스택
  links?: { label: string; url: string }[];          // 참고 링크
}

const grad = (c: string) => `linear-gradient(135deg, ${c} 0%, ${shade(c, -22)} 100%)`;
function shade(hex: string, p: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + p));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + p));
  const b = Math.max(0, Math.min(255, (n & 255) + p));
  return `rgb(${r},${g},${b})`;
}

/** 그라데이션 히어로 */
export const Hero = ({ m }: { m: Meta }) => (
  <header className="phero" style={{ background: grad(m.color) }}>
    <div className="phero-inner">
      <span className="phero-tag">PROJECT {String(m.id).padStart(2, '0')}{m.note ? ` · ${m.note}` : ''}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <span className="phero-ic">{m.icon}</span>
        <h1 style={{ margin: 0 }}>{m.title}</h1>
      </div>
      <p style={{ marginTop: 8 }}>{m.tagline}</p>
      <div className="phero-mem">{m.members.map((x) => <span key={x}>👤 {x}</span>)}</div>
    </div>
  </header>
);

export type TabKey = 'app' | 'info' | 'team';
export const Tabs = ({ tab, set, color }: { tab: TabKey; set: (t: TabKey) => void; color: string }) => (
  <nav className="tabs">
    {([['app', '🚀 앱 실행'], ['info', '📚 프로젝트 정보'], ['team', '👥 팀']] as [TabKey, string][]).map(([k, l]) => (
      <button key={k} className={`tab ${tab === k ? 'on' : ''}`} style={tab === k ? { background: color } : undefined} onClick={() => set(k)}>{l}</button>
    ))}
  </nav>
);

/** 정보 탭 — 문제·기능·통계·도메인 지식·링크 */
export const InfoTab = ({ m }: { m: Meta }) => (
  <Stack gap={22}>
    <div className="callout" style={{ background: `${m.color}12`, border: `1px solid ${m.color}33` }}>
      <span style={{ fontSize: 22 }}>🎯</span>
      <div><div className="seclabel" style={{ color: m.color }}>우리가 푸는 문제</div><p style={{ margin: '4px 0 0', fontSize: 14.5, lineHeight: 1.75 }}>{m.problem}</p></div>
    </div>

    {m.facts.length > 0 && (
      <div className="statband">{m.facts.map((f, i) => <div key={i} className="stat"><b style={{ color: m.color }}>{f.value}</b><span>{f.label}</span></div>)}</div>
    )}

    <div>
      <div className="seclabel" style={{ color: m.color }}>주요 기능</div>
      <h3 className="sechead">이 앱이 제공하는 것</h3>
      <div className="feat-grid" style={{ marginTop: 12 }}>
        {m.features.map((f, i) => <div key={i} className="feat"><div className="ic">{f.icon}</div><strong>{f.title}</strong><p>{f.desc}</p></div>)}
      </div>
    </div>

    {m.pipeline && m.pipeline.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>동작 원리</div>
        <h3 className="sechead">AI 처리 파이프라인</h3>
        <ol className="pipeline">
          {m.pipeline.map((s, i) => (
            <li key={i}><span className="pl-no" style={{ background: m.color }}>{i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
      </div>
    )}

    {m.info.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>알아두면 좋은 정보</div>
        <h3 className="sechead">도메인 가이드</h3>
        <Stack gap={10}>{m.info.map((c, i) => <div key={i} className="infocard"><h4 style={{ color: m.color }}>{c.title}</h4><p>{c.body}</p></div>)}</Stack>
      </div>
    )}

    {m.techNotes && m.techNotes.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>엔지니어링</div>
        <h3 className="sechead">기술 설계 노트</h3>
        <div className="feat-grid" style={{ marginTop: 12 }}>
          {m.techNotes.map((c, i) => <div key={i} className="feat"><strong style={{ marginTop: 0 }}>🛠️ {c.title}</strong><p>{c.body}</p></div>)}
        </div>
      </div>
    )}

    <div>
      <div className="seclabel" style={{ color: m.color }}>사용 방법</div>
      <h3 className="sechead">3단계로 시작하기</h3>
      <Stack gap={8}>
        {m.howto.map((s, i) => (
          <div key={i} className="box" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
            <span style={{ fontSize: 14.5 }}>{s}</span>
          </div>
        ))}
      </Stack>
    </div>

    {m.links && m.links.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>참고 자료</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {m.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}>{l.label} ↗</a>)}
        </div>
      </div>
    )}
  </Stack>
);

/** 팀 탭 — 멤버·스택·저장소 */
export const TeamTab = ({ m }: { m: Meta }) => (
  <Stack gap={22}>
    <div>
      <div className="seclabel" style={{ color: m.color }}>팀 멤버</div>
      <h3 className="sechead">함께 만든 사람들</h3>
      <div className="feat-grid" style={{ marginTop: 12 }}>
        {m.members.map((x) => (
          <div key={x} className="feat" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 42, height: 42, borderRadius: '50%', background: grad(m.color), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17 }}>{x.slice(0, 1)}</span>
            <div><strong style={{ margin: 0 }}>{x}</strong><p style={{ margin: 0 }}>팀원</p></div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <div className="seclabel" style={{ color: m.color }}>기술 스택</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {m.stack.map((s) => <Pill key={s} color={m.color}>{s}</Pill>)}
      </div>
    </div>
    <div className="box">
      <strong>📦 프로젝트 저장소</strong>
      <p style={{ margin: '6px 0 0', fontSize: 14 }}>
        이 앱은 <a href={`https://github.com/aebonlee/project${String(m.id).padStart(2, '0')}`} target="_blank" rel="noopener noreferrer" style={{ color: m.color, fontWeight: 600 }}>github.com/aebonlee/project{String(m.id).padStart(2, '0')}</a> 에서 개발·자동 배포됩니다.
      </p>
    </div>
  </Stack>
);

export const Footer = ({ m }: { m: Meta }) => (
  <footer className="pfooter">AI Reboot Academy · PROJECT {String(m.id).padStart(2, '0')} — {m.title}<br />{m.members.join(' · ')} 팀 · Vite + React + TypeScript</footer>
);

export const Chip = ({ active, color = 'var(--primary)', onClick, children }: { active: boolean; color?: string; onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} style={{
    padding: '8px 14px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', borderRadius: '999px',
    border: '1px solid', borderColor: active ? color : 'var(--border)', background: active ? color : 'var(--card)', color: active ? '#fff' : 'var(--sub)',
  }}>{children}</button>
);

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label>{label}{hint && <span style={{ fontWeight: 400, color: 'var(--faint)', marginLeft: '6px', fontSize: '12.5px' }}>{hint}</span>}</label>
    {children}
  </div>
);

export const Pill = ({ color = 'var(--primary)', children }: { color?: string; children: ReactNode }) => (
  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', background: color, padding: '3px 11px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{children}</span>
);

export const Stack = ({ gap = 18, children }: { gap?: number; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>
);
export const Row = ({ gap = 16, children }: { gap?: number; children: ReactNode }) => (
  <div style={{ display: 'flex', gap, flexWrap: 'wrap' }}>{children}</div>
);
export const Box = ({ style, children }: { style?: CSSProperties; children: ReactNode }) => (
  <div className="box" style={style}>{children}</div>
);

/** OpenAI API 키 입력/상태 바 — env 키가 있으면 자동 연결, 없으면 사용자 입력 */
export const ApiKeyBar = ({ color }: { color: string }) => {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [ok, setOk] = useState(hasKey());
  const env = keyFromEnv();
  if (env || ok) {
    return (
      <div className="box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderColor: `${color}55`, background: `${color}10` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>🤖 OpenAI 연결됨 — 실제 AI로 생성합니다{env ? ' (환경변수)' : ''}</span>
        {!env && <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { clearKey(); setOk(false); }}>키 변경</button>}
      </div>
    );
  }
  return (
    <div className="box" style={{ borderColor: `${color}55` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>🔑 OpenAI API 키를 입력하면 실제 AI가 동작합니다 <span style={{ fontWeight: 400, color: 'var(--faint)' }}>(미입력 시 오프라인 샘플)</span></span>
        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setOpen((o) => !o)}>{open ? '닫기' : '키 입력'}</button>
      </div>
      {open && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="password" value={val} onChange={(e) => setVal(e.target.value)} placeholder="sk-..." style={{ flex: 1 }} />
          <button className="btn" style={{ background: color }} onClick={() => { if (val.trim()) { setKey(val.trim()); setOk(true); } }}>저장</button>
        </div>
      )}
      <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--faint)' }}>키는 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
    </div>
  );
};

/** 앱 공통 레이아웃: 히어로 + 탭 + 본문 + 푸터 */
export const AppLayout = ({ m, feature }: { m: Meta; feature: ReactNode }) => {
  const [tab, setTab] = useState<TabKey>('app');
  return (
    <div className="wrap">
      <Hero m={m} />
      <Tabs tab={tab} set={setTab} color={m.color} />
      <div className="pad" style={{ marginTop: 22 }}>
        {tab === 'app' && (
          <Stack>
            {m.ai && <ApiKeyBar color={m.color} />}
            {feature}
          </Stack>
        )}
        {tab === 'info' && <InfoTab m={m} />}
        {tab === 'team' && <TeamTab m={m} />}
      </div>
      <Footer m={m} />
    </div>
  );
};
