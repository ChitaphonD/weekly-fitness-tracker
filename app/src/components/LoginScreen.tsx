import { useState } from 'react';
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signInWithRedirect
} from 'firebase/auth';
import { auth } from '../firebase';

const ERRORS: Record<string, string> = {
  'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
  'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'auth/wrong-password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'auth/user-not-found': 'ไม่พบบัญชีนี้ · ลองสมัครสมาชิก',
  'auth/email-already-in-use': 'อีเมลนี้มีบัญชีแล้ว · ลองเข้าสู่ระบบ',
  'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  'auth/too-many-requests': 'ลองหลายครั้งเกินไป · รอสักครู่แล้วลองใหม่',
  'auth/network-request-failed': 'เชื่อมต่ออินเทอร์เน็ตไม่ได้',
  'auth/operation-not-allowed': 'ยังไม่ได้เปิดวิธีเข้าสู่ระบบนี้ใน Firebase Console',
  'auth/configuration-not-found': 'ยังไม่ได้เปิด Authentication ใน Firebase Console',
  'auth/popup-closed-by-user': ''
};
const msgOf = (e: unknown) => {
  const code = (e as { code?: string }).code ?? '';
  return code in ERRORS ? ERRORS[code] : `เกิดข้อผิดพลาด (${code || 'unknown'})`;
};

export function LoginScreen() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState(''), [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [info, setInfo] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(''); setInfo('');
    try { await fn(); } catch (e) { setErr(msgOf(e)); } finally { setBusy(false); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => mode === 'in' ? signInWithEmailAndPassword(auth, email.trim(), pw) : createUserWithEmailAndPassword(auth, email.trim(), pw));
  };
  const google = () => run(async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) {
      // In-app browsers often block popups; fall back to a full-page redirect.
      if ((e as { code?: string }).code === 'auth/popup-blocked') await signInWithRedirect(auth, provider); else throw e;
    }
  });
  const reset = () => {
    if (!email.trim()) { setErr('กรอกอีเมลก่อน แล้วกดลืมรหัสผ่านอีกครั้ง'); return; }
    run(async () => { await sendPasswordResetEmail(auth, email.trim()); setInfo('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว'); });
  };

  return (
    <form className="stack" onSubmit={submit} style={{ paddingTop: 24 }}>
      <img src="/logo.webp" alt="Weekly Fitness Tracker" width={128} height={128} style={{ alignSelf: 'center', borderRadius: 24 }} />
      <div>
        <div className="h1">{mode === 'in' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--mute)', marginTop: 6 }}>ข้อมูลการฝึกจะถูกเก็บในบัญชีของคุณ ใช้ต่อได้ทุกเครื่อง</div>
      </div>
      <button type="button" className="list-btn" disabled={busy} onClick={google} style={{ justifyContent: 'center', gap: 10, fontWeight: 600 }}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
        เข้าสู่ระบบด้วย Google
      </button>
      <div className="label" style={{ textAlign: 'center' }}>หรือใช้อีเมล</div>
      <label className="field">
        <span className="label">อีเมล</span>
        <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ font: '600 17px var(--sans)' }} />
      </label>
      <label className="field">
        <span className="label">รหัสผ่าน</span>
        <input type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={6} value={pw} onChange={e => setPw(e.target.value)} style={{ font: '600 17px var(--sans)' }} />
      </label>
      {err && <div role="alert" style={{ fontSize: 13, color: 'var(--down)' }}>{err}</div>}
      {info && <div role="status" style={{ fontSize: 13, color: 'var(--up)' }}>{info}</div>}
      <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'กำลังดำเนินการ…' : mode === 'in' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
      <div className="row-between" style={{ fontSize: 13 }}>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); }}>
          {mode === 'in' ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
        </button>
        {mode === 'in' && <button type="button" className="link-btn" onClick={reset}>ลืมรหัสผ่าน</button>}
      </div>
    </form>
  );
}
