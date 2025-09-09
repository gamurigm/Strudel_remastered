import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import StopCircleIcon from '@heroicons/react/20/solid/StopCircleIcon';
import EyeIcon from '@heroicons/react/20/solid/EyeIcon';
import EyeSlashIcon from '@heroicons/react/20/solid/EyeSlashIcon';
import SpeakerWaveIcon from '@heroicons/react/20/solid/SpeakerWaveIcon';
import ArrowPathIcon from '@heroicons/react/20/solid/ArrowPathIcon';
import BookOpenIcon from '@heroicons/react/20/solid/BookOpenIcon';
import cx from '@src/cx.mjs';
import { useSettings, setIsZen, settingsMap } from '../../settings.mjs';
import { useState, useEffect, useRef } from 'react';
import { setMasterGain, getMasterGain } from '@strudel/webaudio';
import '../Repl.css';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export function Header({ context, embedded = false }) {
  const { started, pending, isDirty, activeCode, handleTogglePlay, handleEvaluate } = context; // removed unused items
  const isEmbedded = typeof window !== 'undefined' && (embedded || window.location !== window.parent.location);
  const { isZen, isButtonRowHidden, isCSSAnimationDisabled, fontFamily } = useSettings();
  const [hidden, setHidden] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 12 });
  const dragRef = useRef(null);
  const dragState = useRef(null);

  // Always center horizontally at top on mount & on resize (no persistence)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const center = () => {
      const el = dragRef.current;
      if (!el) return;
      const w = window.innerWidth;
      const rect = el.getBoundingClientRect();
      setPosition({ x: Math.max(8, w / 2 - rect.width / 2), y: 12 });
    };
    requestAnimationFrame(center);
    window.addEventListener('resize', center);
    return () => window.removeEventListener('resize', center);
  }, []);

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
          'fixed z-[100] select-none cursor-move group',
          'rounded-full px-2 py-1 text-white/80 shadow-lg backdrop-blur-sm',
          'bg-black/50 border border-white/15'
        )}
        style={{ fontFamily, left: 0, top: 0, transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      >
        <button
          onClick={() => setHidden(false)}
          title="mostrar controles"
          className="flex items-center gap-1 text-xs font-medium hover:text-white transition-colors"
        >
          <EyeIcon className="w-4 h-4" />
          <span className="tracking-wide">show</span>
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
        'fixed z-[100] select-none',
        'flex items-center justify-center gap-1 md:gap-2',
        'px-3 py-2 rounded-2xl shadow-2xl',
        'backdrop-blur-sm border border-white/10',
        'bg-black/50 text-white',
        'transition-colors transition-shadow duration-300',
        started && 'ring-2 ring-lime-400/60 shadow-[0_0_0.75rem_-0.1rem_rgba(163,230,53,0.35)]'
      )}
  style={{ fontFamily, left: 0, top: 0, transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      <button
        onClick={() => setHidden(true)}
        title="ocultar"
        className={cx(
          'absolute -top-2 -right-2 p-1 rounded-full',
          'bg-white/15 hover:bg-white/25 text-white/80 hover:text-white shadow-md',
          'backdrop-blur-xl border border-white/20'
        )}
      >
        <EyeSlashIcon className="w-4 h-4" />
        <span className="sr-only">hide</span>
      </button>
      {!isButtonRowHidden && (
        <div className="flex items-center max-w-full overflow-x-auto no-scrollbar">
          {/* Play / Stop */}
          <button
            onClick={handleTogglePlay}
            title={started ? 'stop' : 'play'}
            className={cx(
              'relative p-1.5 rounded-xl transition',
              'hover:bg-white/15 active:scale-95',
              !started && !isCSSAnimationDisabled && 'animate-pulse'
            )}
          >
            {!pending ? (
              started ? <StopCircleIcon className="w-7 h-7 drop-shadow" /> : <PlayCircleIcon className="w-7 h-7 drop-shadow" />
            ) : (
              <span className="text-xs px-2">…</span>
            )}
          </button>
          {/* Volume */}
          <div className="flex items-center gap-1 px-2">
            <SpeakerWaveIcon className="w-4 h-4 opacity-70" />
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
                // live color feedback (simple inline gradient)
                const pct = ((v / 2) * 100).toFixed(1);
                e.target.style.background = `linear-gradient(to right,#a3e635 ${pct}%,rgba(255,255,255,0.15) ${pct}%)`;
              }}
              className="h-2 w-28 md:w-32 appearance-none rounded-full accent-lime-400 bg-white/20 cursor-pointer"
            />
          </div>
          {/* Update */}
            <button
              onClick={handleEvaluate}
              title="update / evaluate"
              disabled={!isDirty || !activeCode}
              className={cx(
                'p-1.5 rounded-xl transition relative',
                'hover:bg-white/15 active:scale-95',
                (!isDirty || !activeCode) && 'opacity-40 hover:bg-transparent cursor-default'
              )}
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span className="sr-only">update</span>
            </button>
          {/* Learn link */}
          {!isEmbedded && (
            <a
              title="learn"
              href={`${baseNoTrailing}/workshop/getting-started`}
              className={cx(
                'p-1.5 rounded-xl transition',
                'hover:bg-white/15 active:scale-95 flex items-center'
              )}
            >
              <BookOpenIcon className="w-5 h-5" />
              <span className="sr-only">learn</span>
            </a>
          )}
        </div>
      )}
    </header>
  );
}
