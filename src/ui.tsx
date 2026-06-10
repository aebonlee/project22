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

/** 프로젝트 메타 — 기능(앱) + 포트폴리오 콘텐츠(기획·파이프라인·개발 참고·팀) */
export interface Meta {
  // ── 식별/히어로 ──
  id: number; icon: string; title: string; tagline: string; members: string[]; color: string; note?: string;
  ai?: boolean;                                      // OpenAI 사용 앱이면 키 입력 바 표시

  // ── 📋 기획 ──
  problem: string;                                   // 문제/배경
  targets?: string[];                                // 타깃 사용자
  goals?: string[];                                  // 기획 목표/성공 기준
  scenarios?: string[];                              // 사용 시나리오
  screens?: { name: string; desc: string }[];        // 주요 화면/플로우
  features: { icon: string; title: string; desc: string }[];
  howto: string[];                                   // 사용 방법
  facts: { value: string; label: string }[];         // 도메인 통계
  info: { title: string; body: string }[];           // 도메인 지식 카드

  // ── 🔧 파이프라인 ──
  pipeline?: string[];                                // 처리 흐름(단계 요약)
  pipelineDetail?: { step: string; detail: string }[]; // 단계별 상세
  promptNotes?: string[];                             // 프롬프트/응답 설계 메모(AI 앱)

  // ── 🛠 개발 참고 ──
  stack: string[];                                   // 기술 스택
  architecture?: string;                             // 아키텍처 개요(1문단)
  structure?: { path: string; desc: string }[];      // 폴더/파일 구조
  dataModel?: { name: string; desc: string }[];      // 상태/데이터 모델
  techNotes?: { title: string; body: string }[];      // 기술 설계 노트
  deploy?: string;                                   // 빌드/배포 메모
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

export type TabKey = 'app' | 'plan' | 'pipeline' | 'dev' | 'team';
export const Tabs = ({ tab, set, color }: { tab: TabKey; set: (t: TabKey) => void; color: string }) => (
  <nav className="tabs">
    {([['app', '🚀 앱 실행'], ['plan', '📋 기획'], ['pipeline', '🔧 파이프라인'], ['dev', '🛠 개발 참고'], ['team', '👥 팀']] as [TabKey, string][]).map(([k, l]) => (
      <button key={k} className={`tab ${tab === k ? 'on' : ''}`} style={tab === k ? { background: color } : undefined} onClick={() => set(k)}>{l}</button>
    ))}
  </nav>
);

/** 번호 매긴 박스 리스트(목표·시나리오·사용법 공통) */
const NumList = ({ items, color }: { items: string[]; color: string }) => (
  <Stack gap={8}>
    {items.map((s, i) => (
      <div key={i} className="box" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
        <span style={{ fontSize: 14.5 }}>{s}</span>
      </div>
    ))}
  </Stack>
);

/** 📋 기획 탭 — 문제·타깃·목표·시나리오·화면·기능·도메인·사용법 */
export const PlanningTab = ({ m }: { m: Meta }) => (
  <Stack gap={22}>
    <div className="callout" style={{ background: `${m.color}12`, border: `1px solid ${m.color}33` }}>
      <span style={{ fontSize: 22 }}>🎯</span>
      <div><div className="seclabel" style={{ color: m.color }}>우리가 푸는 문제</div><p style={{ margin: '4px 0 0', fontSize: 14.5, lineHeight: 1.75 }}>{m.problem}</p></div>
    </div>

    {m.facts.length > 0 && (
      <div className="statband">{m.facts.map((f, i) => <div key={i} className="stat"><b style={{ color: m.color }}>{f.value}</b><span>{f.label}</span></div>)}</div>
    )}

    {m.targets && m.targets.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>타깃 사용자</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{m.targets.map((t) => <Pill key={t} color={m.color}>{t}</Pill>)}</div>
      </div>
    )}

    {m.goals && m.goals.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>기획 목표</div>
        <h3 className="sechead">무엇을 이루려는가</h3>
        <div style={{ marginTop: 12 }}><NumList items={m.goals} color={m.color} /></div>
      </div>
    )}

    {m.scenarios && m.scenarios.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>사용 시나리오</div>
        <h3 className="sechead">이렇게 쓰입니다</h3>
        <div style={{ marginTop: 12 }}><NumList items={m.scenarios} color={m.color} /></div>
      </div>
    )}

    {m.screens && m.screens.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>화면 구성</div>
        <h3 className="sechead">주요 화면 · 플로우</h3>
        <div className="feat-grid" style={{ marginTop: 12 }}>
          {m.screens.map((s, i) => <div key={i} className="infocard"><h4 style={{ color: m.color }}>{s.name}</h4><p>{s.desc}</p></div>)}
        </div>
      </div>
    )}

    <div>
      <div className="seclabel" style={{ color: m.color }}>주요 기능</div>
      <h3 className="sechead">이 앱이 제공하는 것</h3>
      <div className="feat-grid" style={{ marginTop: 12 }}>
        {m.features.map((f, i) => <div key={i} className="feat"><div className="ic">{f.icon}</div><strong>{f.title}</strong><p>{f.desc}</p></div>)}
      </div>
    </div>

    {m.info.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>알아두면 좋은 정보</div>
        <h3 className="sechead">도메인 가이드</h3>
        <Stack gap={10}>{m.info.map((c, i) => <div key={i} className="infocard"><h4 style={{ color: m.color }}>{c.title}</h4><p>{c.body}</p></div>)}</Stack>
      </div>
    )}

    <div>
      <div className="seclabel" style={{ color: m.color }}>사용 방법</div>
      <h3 className="sechead">시작하기</h3>
      <div style={{ marginTop: 12 }}><NumList items={m.howto} color={m.color} /></div>
    </div>
  </Stack>
);

/** 🔧 파이프라인 탭 — 처리 흐름 + (AI) 프롬프트 설계 */
export const PipelineTab = ({ m }: { m: Meta }) => {
  const detail = m.pipelineDetail && m.pipelineDetail.length > 0 ? m.pipelineDetail : null;
  const steps = m.pipeline && m.pipeline.length > 0 ? m.pipeline : null;
  return (
    <Stack gap={22}>
      <div>
        <div className="seclabel" style={{ color: m.color }}>동작 원리</div>
        <h3 className="sechead">처리 파이프라인</h3>
        {detail ? (
          <ol className="pipeline" style={{ marginTop: 12 }}>
            {detail.map((s, i) => (
              <li key={i}><span className="pl-no" style={{ background: m.color }}>{i + 1}</span><span><b>{s.step}</b><span style={{ display: 'block', fontSize: 13, color: 'var(--sub)', marginTop: 3 }}>{s.detail}</span></span></li>
            ))}
          </ol>
        ) : steps ? (
          <ol className="pipeline" style={{ marginTop: 12 }}>{steps.map((s, i) => <li key={i}><span className="pl-no" style={{ background: m.color }}>{i + 1}</span><span>{s}</span></li>)}</ol>
        ) : (
          <div className="box" style={{ marginTop: 12 }}><p style={{ margin: 0, fontSize: 14, color: 'var(--sub)' }}>별도 서버 없이 브라우저 클라이언트에서 모든 처리가 이뤄집니다(정적 배포).</p></div>
        )}
      </div>

      {m.promptNotes && m.promptNotes.length > 0 && (
        <div>
          <div className="seclabel" style={{ color: m.color }}>AI 설계</div>
          <h3 className="sechead">프롬프트 · 응답 설계</h3>
          <Stack gap={8}>
            {m.promptNotes.map((s, i) => (
              <div key={i} className="box" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: m.color, fontWeight: 800 }}>›</span><span style={{ fontSize: 14, lineHeight: 1.6 }}>{s}</span>
              </div>
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  );
};

/** 🛠 개발 참고 탭 — 아키텍처·파일구조·데이터모델·스택·기술노트·배포·링크 */
export const DevTab = ({ m }: { m: Meta }) => (
  <Stack gap={22}>
    {m.architecture && (
      <div className="callout" style={{ background: `${m.color}12`, border: `1px solid ${m.color}33` }}>
        <span style={{ fontSize: 22 }}>🧱</span>
        <div><div className="seclabel" style={{ color: m.color }}>아키텍처 개요</div><p style={{ margin: '4px 0 0', fontSize: 14.5, lineHeight: 1.75 }}>{m.architecture}</p></div>
      </div>
    )}

    {m.structure && m.structure.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>파일 구조</div>
        <h3 className="sechead">폴더 · 파일</h3>
        <div className="box" style={{ marginTop: 12 }}>
          <Stack gap={8}>
            {m.structure.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <code style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: m.color }}>{s.path}</code>
                <span style={{ fontSize: 13.5, color: 'var(--sub)' }}>{s.desc}</span>
              </div>
            ))}
          </Stack>
        </div>
      </div>
    )}

    {m.dataModel && m.dataModel.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>데이터 모델</div>
        <h3 className="sechead">상태 · 타입</h3>
        <div className="feat-grid" style={{ marginTop: 12 }}>
          {m.dataModel.map((d, i) => <div key={i} className="feat"><strong style={{ marginTop: 0 }}>🧩 {d.name}</strong><p>{d.desc}</p></div>)}
        </div>
      </div>
    )}

    <div>
      <div className="seclabel" style={{ color: m.color }}>기술 스택</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{m.stack.map((s) => <Pill key={s} color={m.color}>{s}</Pill>)}</div>
    </div>

    {m.techNotes && m.techNotes.length > 0 && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>엔지니어링</div>
        <h3 className="sechead">기술 설계 노트</h3>
        <div className="feat-grid" style={{ marginTop: 12 }}>
          {m.techNotes.map((c, i) => <div key={i} className="feat"><strong style={{ marginTop: 0 }}>🛠️ {c.title}</strong><p>{c.body}</p></div>)}
        </div>
      </div>
    )}

    {m.deploy && (
      <div>
        <div className="seclabel" style={{ color: m.color }}>빌드 · 배포</div>
        <div className="box" style={{ marginTop: 10 }}><p style={{ margin: 0, fontSize: 14 }}>{m.deploy}</p></div>
      </div>
    )}

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

/** 👥 팀 탭 — 멤버·스택·저장소 */
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

/** 앱 공통 레이아웃: 히어로 + 5탭(앱·기획·파이프라인·개발참고·팀) + 본문 + 푸터 */
export const AppLayout = ({ m, feature }: { m: Meta; feature: ReactNode }) => {
  const [tab, setTab] = useState<TabKey>('app');
  return (
    <div className="wrap">
      <Hero m={m} />
      <Tabs tab={tab} set={setTab} color={m.color} />
      <div className="pad" style={{ marginTop: 22 }}>
        {tab === 'app' && (<Stack>{m.ai && <ApiKeyBar color={m.color} />}{feature}</Stack>)}
        {tab === 'plan' && <PlanningTab m={m} />}
        {tab === 'pipeline' && <PipelineTab m={m} />}
        {tab === 'dev' && <DevTab m={m} />}
        {tab === 'team' && <TeamTab m={m} />}
      </div>
      <Footer m={m} />
    </div>
  );
};
