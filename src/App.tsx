import { useMemo, useState } from 'react';
import { AppLayout, Field, useLocalStorage, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

/* ──────────────────────────────────────────────────────────────────────────
 * 경제를 하나도 모르는 사람을 위한 경제 자립 단계별 AI 코칭
 * 수입·지출·저축·부채 입력 → 자립 단계 진단 → 단계별 로드맵 + AI 코칭.
 * ────────────────────────────────────────────────────────────────────────── */
const M: Meta = {
  id: 22, icon: '💰', title: '경제 자립 코칭', tagline: '경제를 잘 몰라도 괜찮아요. 현재 상황을 진단해 자립 단계를 알려주고 다음 할 일을 코칭합니다',
  members: ['박남영'], color: '#ca8a04', ai: true, note: '학생 제안',
  problem:
    '"돈 관리를 어떻게 시작해야 할지" 막막한 사람이 많습니다. 정보는 넘치지만 내 상황에 맞는 순서를 알기 어렵습니다. ' +
    '이 앱은 수입·지출·저축·부채를 입력하면 지금 내가 경제 자립의 어느 단계에 있는지 진단하고, 비상금→부채상환→저축률→투자로 ' +
    '이어지는 검증된 순서에 따라 "지금 할 일"을 코칭합니다.',
  features: [
    { icon: '🧮', title: '재무 진단', desc: '저축률·비상금 개월·부채비율을 자동 계산' },
    { icon: '🪜', title: '자립 단계', desc: '5단계(생존→비상금→부채→저축→투자) 중 현재 위치 진단' },
    { icon: '🎯', title: '다음 목표', desc: '단계별로 지금 집중할 한 가지 목표 제시' },
    { icon: '📋', title: '실행 체크', desc: '단계별 할 일을 체크리스트로 안내' },
    { icon: '🤖', title: 'AI 코칭', desc: '(선택) 내 숫자에 맞춘 맞춤 코칭 멘트 생성' },
  ],
  howto: [
    '월 수입·지출·현재 저축·부채를 입력합니다',
    '저축률·비상금 개월수로 자립 단계가 진단됩니다',
    '현재 단계의 목표와 할 일을 따라 실행하세요',
  ],
  facts: [
    { value: '5단계', label: '자립 로드맵' },
    { value: '저축률', label: '자동 계산' },
    { value: '비상금', label: '개월수 진단' },
    { value: '코칭', label: '다음 할 일' },
  ],
  info: [
    { title: '자립의 순서', body: '돈 관리는 순서가 중요합니다. 비상금 없이 투자부터 하면 위기 때 손해를 보고 빚을 집니다. 생존비 확보 → 비상금 → 고금리 부채 상환 → 저축률 높이기 → 투자가 안전한 순서입니다.' },
    { title: '저축률이 핵심', body: '수입보다 "수입 중 얼마를 남기는가(저축률)"가 자립 속도를 결정합니다. 저축률 10%→30%로 올리면 자립 시점이 크게 앞당겨집니다.' },
  ],
  targets: ['돈 관리를 시작하려는 사람', '경제를 잘 모르는 사회초년생', '자립 순서가 막막한 사람'],
  goals: [
    '수입·지출·저축·부채로 자립 단계를 진단한다',
    '비상금→부채→저축→투자 순서로 다음 할 일을 코칭한다',
    'API 키가 없어도 규칙 모델로 동작하게 한다',
  ],
  scenarios: [
    '월 수입·지출·현재 저축·부채를 입력한다',
    '저축률·비상금 개월수로 자립 단계가 진단된다',
    '현재 단계의 목표·할 일을 따라 실행하고 (선택) AI 코칭을 받는다',
  ],
  screens: [
    { name: '내 상황 입력', desc: '월 수입·지출·저축/비상금·부채·금리' },
    { name: '재무 진단', desc: '월 잉여·저축률·비상금 개월·자립 단계 지표' },
    { name: '자립 로드맵', desc: '5단계 중 현재 위치 + 목표·할 일 체크리스트' },
    { name: 'AI 코칭', desc: '(선택) 내 숫자 맞춤 코칭 멘트' },
  ],
  pipelineDetail: [
    { step: '상황 입력', detail: '월 수입·지출·저축·부채·금리를 입력해 localStorage(fc_in)에 저장한다.' },
    { step: '재무 진단', detail: '저축률·비상금 개월수·잉여를 결정적으로 계산한다.' },
    { step: '단계 판정', detail: '잉여·비상금·부채 조건으로 5단계(생존→비상금→부채→저축→투자) 중 현재 위치를 판정한다.' },
    { step: '코칭', detail: '현재 단계의 목표·할 일을 제시하고, (선택) AI가 내 숫자에 맞춘 멘트를 생성한다.' },
  ],
  promptNotes: [
    '경제를 모르는 사람도 이해하도록 (1)격려 (2)이번 달 행동 2가지 (3)주의 1가지를 쉬운 한국어로 생성하도록 system 프롬프트로 지시한다.',
    '재무 진단·단계 판정은 규칙으로 결정적으로 계산하고, AI는 코칭 멘트만 보조한다.',
  ],
  architecture:
    '백엔드 없는 React SPA. 공통 레이아웃·5탭은 src/ui.tsx, 진단·코칭 기능은 src/App.tsx가 담당한다. ' +
    '재무 진단·자립 단계는 결정적 규칙 모델로 계산하고, 코칭 멘트는 src/lib/ai.ts(선택)로 보강하며, 입력은 브라우저 localStorage에 저장한다.',
  structure: [
    { path: 'src/App.tsx', desc: '재무 진단·자립 단계·코칭 + 메타(M)' },
    { path: 'src/ui.tsx', desc: '공통 레이아웃·5탭·UI 헬퍼' },
    { path: 'src/lib/ai.ts', desc: 'OpenAI chat 헬퍼(선택 코칭 멘트)' },
    { path: 'src/index.css', desc: '테마·로드맵 스타일' },
  ],
  dataModel: [
    { name: 'Stage', desc: '자립 5단계(이름·목표·할 일)' },
    { name: '입력', desc: '수입·지출·저축·부채·금리. localStorage "fc_in"' },
  ],
  deploy:
    'Vite 빌드(base: "./") 후 GitHub Actions(deploy.yml)가 main push 시 GitHub Pages로 자동 배포 → aebonlee.github.io/project22/',
  scope: {
    include: ['수입·지출·부채 입력 → 재무 진단·자립 단계', '단계별 목표·할 일·AI 코칭(선택)', '규칙 모델 + AI 보조'],
    exclude: ['은행·자산 연동', '실제 투자·상품 추천', '세무·법률 자문'],
  },
  pitch: [
    '"순서"가 중요한 돈 관리를 비상금→부채→저축→투자로 코칭',
    '저축률이 자립 속도를 결정한다는 핵심 메시지',
    '진단·단계는 규칙으로, 코칭 멘트만 AI',
  ],
  stack: ['React 18', 'TypeScript', 'Vite', '규칙기반 모델', 'OpenAI(선택)'],
};

interface Stage { n: number; name: string; goal: string; todos: string[]; }
const STAGES: Stage[] = [
  { n: 1, name: '생존 가계', goal: '수입 안에서 지출하기(적자 탈출)', todos: ['한 달 지출 모두 기록하기', '고정비·변동비 구분하기', '적자 항목 1개 줄이기'] },
  { n: 2, name: '비상금', goal: '생활비 3개월치 비상금 모으기', todos: ['비상금 통장 따로 만들기', '월 저축액 자동이체 설정', '비상금 3개월치 목표 설정'] },
  { n: 3, name: '부채 정리', goal: '고금리 부채부터 상환', todos: ['모든 부채 금리순 정렬', '최고 금리부터 집중 상환', '신규 고금리 대출 차단'] },
  { n: 4, name: '저축률 키우기', goal: '저축률 30% 이상으로', todos: ['지출에서 10% 추가 절감', '수입 늘릴 방법 1개 시도', '저축 목표 자동화'] },
  { n: 5, name: '투자·성장', goal: '분산 투자로 자산 키우기', todos: ['투자 기초 공부', '소액 분산 투자 시작', '연 1회 리밸런싱'] },
];

const won = (n: number) => n.toLocaleString('ko-KR');

const App = () => {
  const [f, setF] = useLocalStorage('fc_in', { income: 250, expense: 200, saving: 100, debt: 0, debtRate: 0 });
  const [aiText, setAiText] = useState(''); const [aiBusy, setAiBusy] = useState(false);

  const d = useMemo(() => {
    const surplus = f.income - f.expense;
    const savingRate = f.income > 0 ? Math.round((surplus / f.income) * 100) : 0;
    const emMonths = f.expense > 0 ? Math.round((f.saving / f.expense) * 10) / 10 : 0;
    let stage = 1;
    if (surplus > 0) stage = 2;
    if (surplus > 0 && emMonths >= 3 && f.debt > 0 && f.debtRate >= 10) stage = 3;
    else if (surplus > 0 && emMonths >= 3) stage = 4;
    if (stage === 4 && savingRate >= 30 && f.debt === 0) stage = 5;
    return { surplus, savingRate, emMonths, stage };
  }, [f]);
  const stage = STAGES[d.stage - 1];

  const coach = async () => {
    setAiBusy(true); setAiText('');
    try {
      const out = await ask(
        '너는 친절한 가계 재무 코치다. 경제를 잘 모르는 사람도 이해하도록, 아래 진단을 바탕으로 (1)지금 상황 한 줄 격려 (2)이번 달 구체적 행동 2가지 (3)주의할 점 1가지를 쉬운 한국어로. 5줄 이내, 숫자 겁주지 말 것.',
        `월수입 ${f.income}만, 월지출 ${f.expense}만, 저축 ${f.saving}만, 부채 ${f.debt}만(금리 ${f.debtRate}%). 저축률 ${d.savingRate}%, 비상금 ${d.emMonths}개월, 단계 ${d.stage}(${stage.name}).`,
        { temperature: 0.6, max_tokens: 350 });
      setAiText(out);
    } catch { setAiText(`지금은 "${stage.name}" 단계예요. 저축률 ${d.savingRate}%, 비상금 ${d.emMonths}개월. 이번 달은 "${stage.goal}"에 집중하면 충분해요. 한 번에 다 바꾸려 하지 말고 위 할 일 중 1개부터 시작하세요. (AI 코칭은 키 입력 시 더 자세해집니다.)`); }
    finally { setAiBusy(false); }
  };

  const num = (k: keyof typeof f, label: string) => (
    <Field label={`${label} (만원)`}><input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: Math.max(0, Number(e.target.value)) })} /></Field>
  );

  const feature = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card">
        <div className="seclabel" style={{ color: M.color }}>🧮 내 상황 입력</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
          {num('income', '월 수입')}{num('expense', '월 지출')}{num('saving', '현재 저축/비상금')}{num('debt', '부채 잔액')}
          <Field label="부채 평균 금리 (%)"><input type="number" value={f.debtRate} onChange={(e) => setF({ ...f, debtRate: Math.max(0, Number(e.target.value)) })} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="seclabel" style={{ color: M.color }}>📊 진단</div>
        <div className="statband" style={{ marginTop: 12 }}>
          <div className="stat"><b style={{ color: d.surplus >= 0 ? '#16a34a' : '#ef4444' }}>{d.surplus >= 0 ? '+' : ''}{won(d.surplus)}만</b><span>월 잉여</span></div>
          <div className="stat"><b style={{ color: M.color }}>{d.savingRate}%</b><span>저축률</span></div>
          <div className="stat"><b style={{ color: M.color }}>{d.emMonths}개월</b><span>비상금</span></div>
          <div className="stat"><b style={{ color: M.color }}>{d.stage}단계</b><span>{stage.name}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="seclabel" style={{ color: M.color }}>🪜 자립 로드맵</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {STAGES.map((s) => {
            const state = s.n < d.stage ? 'done' : s.n === d.stage ? 'now' : 'todo';
            return (
              <div key={s.n} className="box" style={{ borderLeft: `4px solid ${state === 'now' ? M.color : state === 'done' ? '#16a34a' : 'var(--border)'}`, opacity: state === 'todo' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, color: state === 'done' ? '#16a34a' : M.color }}>{state === 'done' ? '✓' : s.n}</span>
                  <strong>{s.name}</strong>
                  {state === 'now' && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: M.color, color: '#fff' }}>지금 여기</span>}
                </div>
                {state === 'now' && (
                  <>
                    <p style={{ margin: '8px 0 6px', fontSize: 14 }}>🎯 {s.goal}</p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: 'var(--sub)' }}>{s.todos.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: M.color }}>🤖 AI 코칭</span>
          <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} disabled={aiBusy} onClick={coach}>{aiBusy ? '코칭 중…' : hasKey() ? '코칭 받기' : '코칭 받기'}</button>
        </div>
        {aiText && <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, marginTop: 12 }}>{aiText}</p>}
      </div>
    </div>
  );

  return <AppLayout m={M} feature={feature} />;
};

export default App;
