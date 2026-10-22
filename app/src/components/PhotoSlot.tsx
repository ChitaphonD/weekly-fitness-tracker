import { useEffect, useRef, useState } from 'react';
import { deletePhoto, getPhoto, putPhoto, shrink } from '../photos';

interface Props { id: string; placeholder: string; controlsSide: 'left' | 'right' }

/** Tap or drop an image to fill; the image persists per `id`. */
export function PhotoSlot({ id, placeholder, controlsSide }: Props) {
  const [url, setUrlState] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cur = useRef<string | null>(null);

  // Swap the displayed object URL, revoking the previous one.
  const setUrl = (blob: Blob | null) => {
    if (cur.current) URL.revokeObjectURL(cur.current);
    cur.current = blob ? URL.createObjectURL(blob) : null;
    setUrlState(cur.current);
  };

  useEffect(() => {
    let live = true;
    getPhoto(id).then(b => { if (live) setUrl(b ?? null); }).catch(() => {});
    return () => { live = false; setUrl(null); };
  }, [id]);

  const accept = async (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const blob = await shrink(file);
    setUrl(blob);
    putPhoto(id, blob).catch(() => {});
  };
  const clear = () => { setUrl(null); deletePhoto(id).catch(() => {}); };

  return (
    <div className={'slot' + (over ? ' over' : '')}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files[0]); }}>
      <input ref={input} type="file" accept="image/*" hidden onChange={e => { accept(e.target.files?.[0]); e.target.value = ''; }} />
      {url ? (
        <>
          <img src={url} alt={placeholder} draggable={false} />
          <div className="slot-ctl" style={controlsSide === 'left' ? { left: 10 } : { right: 10 }}>
            <button onClick={() => input.current?.click()}>เปลี่ยนรูป</button>
            <button onClick={clear}>ลบ</button>
          </div>
        </>
      ) : (
        <button className="slot-empty" onClick={() => input.current?.click()}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" />
          </svg>
          <span>{placeholder}</span>
          <span className="sub">แตะเพื่อเลือก หรือลากรูปมาวาง</span>
        </button>
      )}
    </div>
  );
}
