import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import StopCircleIcon from '@heroicons/react/20/solid/StopCircleIcon';
import EyeIcon from '@heroicons/react/20/solid/EyeIcon';
import EyeSlashIcon from '@heroicons/react/20/solid/EyeSlashIcon';
import cx from '@src/cx.mjs';
import { useSettings, setIsZen, settingsMap } from '../../settings.mjs';
import { useState, useEffect, useRef } from 'react';
import { setMasterGain, getMasterGain } from '@strudel/webaudio';
import '../Repl.css';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export function Header({ context, embedded = false }) {
  const { started, pending, isDirty, activeCode, handleTogglePlay, handleEvaluate, handleShuffle, handleShare } =
    context;
  const isEmbedded = typeof window !== 'undefined' && (embedded || window.location !== window.parent.location);
  const { isZen, isButtonRowHidden, isCSSAnimationDisabled, fontFamily } = useSettings();
  const [hidden, setHidden] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 12 });
  const dragRef = useRef(null);
  const dragState = useRef(null);

  // Load saved position & center if first time
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let saved;
    try { saved = localStorage.getItem('replPanelPos'); } catch {}
    if (saved) {
      try { setPosition(JSON.parse(saved)); return; } catch {}
    }
    // center horizontally after mount (need width measurement)
    requestAnimationFrame(() => {
      const el = dragRef.current;
      if (el) {
        const w = window.innerWidth;
        const rect = el.getBoundingClientRect();
        setPosition({ x: Math.max(8, w / 2 - rect.width / 2), y: 12 });
      }
    });
  }, []);

  // Persist position
  useEffect(() => {
    try { localStorage.setItem('replPanelPos', JSON.stringify(position)); } catch {}
  }, [position]);

  // Drag handlers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onMove = (e) => {
      if (!dragState.current) return;
      e.preventDefault();
      const { startX, startY, origX, origY } = dragState.current;
      const x = origX + (e.clientX - startX);
      const y = origY + (e.clientY - startY);
      // constrain inside viewport with small margin
      const margin = 4;
      const el = dragRef.current;
      const rect = el?.getBoundingClientRect();
      const maxX = window.innerWidth - (rect?.width || 300) - margin;
      const maxY = window.innerHeight - (rect?.height || 40) - margin;
      setPosition({ x: Math.min(Math.max(margin, x), maxX), y: Math.min(Math.max(margin, y), maxY) });
    };
    const stop = () => { dragState.current = null; };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', stop);
    };
  }, []);

  const startDrag = (e) => {
    const tag = e.target.tagName;
    const interactive = ['BUTTON', 'INPUT', 'A', 'LABEL'].includes(tag);
    // If hidden we allow dragging even when clicking the button (so the mini control is draggable)
    if (!hidden && interactive) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y };
  };

  if (hidden) {
    return (
      <div
        ref={dragRef}
        onPointerDown={startDrag}
        className={cx(
          'fixed z-[100] bg-black/50 backdrop-blur-sm text-white rounded-full shadow-md',
          'px-3 py-1 text-sm flex items-center space-x-2 select-none cursor-move'
        )}
        style={{ fontFamily, left: 0, top: 0, transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      >
        <button
          onClick={() => setHidden(false)}
          title="show controls"
          className="flex items-center space-x-1 hover:opacity-70"
        >
          <EyeIcon className="w-4 h-4" /> <span>show</span>
        </button>
      </div>
    );
  }

  if (isZen) {
    // In zen mode, we only show a minimal control.
    return (
      <div
        className={cx(
          'fixed top-2 right-4 z-[100] cursor-pointer text-blue-500',
          started && !isCSSAnimationDisabled && 'animate-spin',
        )}
        onClick={() => setIsZen(false)}
      >
        <span className="block text-foreground rotate-90">꩜</span>
      </div>
    );
  }

  return (
    <header
      id="header"
      ref={dragRef}
      onPointerDown={startDrag}
      className={cx(
        'fixed',
        'z-[100] text-lg select-none',
        'bg-black/50 text-white backdrop-blur-sm',
        'rounded-full px-3 py-2',
        'flex items-center justify-center shadow-lg'
      )}
      style={{ fontFamily, left: 0, top: 0, transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      {/* hide button */}
      <button
        onClick={() => setHidden(true)}
        title="hide controls"
        className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1 hover:opacity-70"
      >
        <EyeSlashIcon className="w-4 h-4" />
      </button>
  {!isButtonRowHidden && (
        <div className="flex max-w-full overflow-auto px-1 md:px-2">
          <button
            onClick={handleTogglePlay}
            title={started ? 'stop' : 'play'}
            className={cx(
              !isEmbedded ? 'p-2' : 'px-2',
              'hover:opacity-70 transition-opacity',
              !started && !isCSSAnimationDisabled && 'animate-pulse',
            )}
          >
            {!pending ? (
              <span className={cx('flex items-center')}>
                {started ? <StopCircleIcon className="w-6 h-6" /> : <PlayCircleIcon className="w-6 h-6" />}
              </span>
            ) : (
              <>loading...</>
            )}
          </button>
          {/* compact master volume control */}
          <div className="flex items-center px-2" style={{ minWidth: 120 }}>
            <label className="text-sm mr-2 opacity-75">Vol</label>
            <input
              aria-label="master-volume"
              type="range"
              min="0"
              max="2"
              step="0.01"
              defaultValue={settingsMap.get().masterGain ?? (getMasterGain?.() ?? 0.8)}
              onChange={(e) => {
                const v = Number(e.target.value);
                settingsMap.setKey('masterGain', v);
                setMasterGain?.(v);
              }}
            />
          </div>
          <button
            onClick={handleEvaluate}
            title="update"
            className={cx(
              'flex items-center space-x-1',
              !isEmbedded ? 'p-2' : 'px-2',
              !isDirty || !activeCode ? 'opacity-50' : 'hover:opacity-50',
            )}
          >
            {!isEmbedded && <span>update</span>}
          </button>
          {!isEmbedded && (
            <a
              title="learn"
              href={`${baseNoTrailing}/workshop/getting-started`}
              className={cx('hover:opacity-70 flex items-center space-x-1 text-sm', !isEmbedded ? 'p-2' : 'px-2')}
            >
              <span>learn</span>
            </a>
          )}
        </div>
      )}
  </header>
  );
}
