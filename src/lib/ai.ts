/**
 * OpenAI Chat 호출 헬퍼.
 * 키 우선순위: 빌드 환경변수(VITE_OPENAI_API_KEY) → 사용자가 입력해 저장한 localStorage 키.
 * 정적 페이지에 키를 박지 않도록, 공개 배포본에서는 사용자가 자신의 키를 입력해 쓰는 방식을 권장한다.
 */
const ENV_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) || '';
const LS = 'openai_api_key';
const MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini';

export const getKey = (): string => ENV_KEY || localStorage.getItem(LS) || '';
export const setKey = (k: string) => localStorage.setItem(LS, k.trim());
export const clearKey = () => localStorage.removeItem(LS);
export const hasKey = (): boolean => !!getKey();
export const keyFromEnv = (): boolean => !!ENV_KEY;

export interface Msg { role: 'system' | 'user' | 'assistant'; content: string; }

/** 채팅 완성 호출 — 키 없거나 실패 시 throw (호출부에서 폴백 처리) */
export async function chat(messages: Msg[], opts: { temperature?: number; max_tokens?: number; json?: boolean } = {}): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('NO_KEY');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.max_tokens ?? 900,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
      messages,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 120)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim();
}

/** 시스템+유저 프롬프트 간편 호출 */
export const ask = (system: string, user: string, opts?: { temperature?: number; max_tokens?: number; json?: boolean }) =>
  chat([{ role: 'system', content: system }, { role: 'user', content: user }], opts);

/**
 * DALL·E 3 이미지 생성 — 동화 장면 삽화용.
 * 반환: data URL(b64) 문자열. 키 없거나 실패 시 throw (호출부에서 SVG 폴백).
 */
export async function generateImage(prompt: string, opts: { size?: '1024x1024' | '1792x1024'; quality?: 'standard' | 'hd' } = {}): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('NO_KEY');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: opts.size ?? '1024x1024',
      quality: opts.quality ?? 'standard',
      response_format: 'b64_json',
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Image ${res.status}: ${t.slice(0, 120)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('NO_IMAGE');
  return `data:image/png;base64,${b64}`;
}
