import { useEffect, useState, useCallback } from 'react';
import { getViewingPatternData, setViewingPatternData } from '../../user_pattern_utils.mjs';
import { defaultTune } from '../defaultTune.mjs';

// Simple ID generator
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const LS_KEY = 'strudelMultiBuffersV2';
const MAX_BUFFERS = 9;

/*
 MultiBufferTabs - Multi-channel buffer system
 --------------------------------------------
 Uses single editor but maintains separate audio contexts for each buffer.
 Allows simultaneous playback like Sonic Pi while keeping UI simple.
*/
export default function MultiBufferTabs({ context }) {
  const { editorRef, onEvaluate, onStop } = context || {};
  const [buffers, setBuffers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [playingSessions, setPlayingSessions] = useState(new Map()); // bufferId -> audioContext
  
  // Load persisted buffers
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.buffers) && parsed.buffers.length) {
          setBuffers(parsed.buffers);
          setActiveId(parsed.activeId || parsed.buffers[0].id);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load buffers:', e);
    }
    
    // Create default buffer with defaultTune
    const defaultBuffer = {
      id: genId(),
      name: '1',
      code: defaultTune
    };
    setBuffers([defaultBuffer]);
    setActiveId(defaultBuffer.id);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (buffers.length > 0) {
      localStorage.setItem(LS_KEY, JSON.stringify({
        buffers,
        activeId
      }));
    }
  }, [buffers, activeId]);

  // Update editor when active buffer changes
  useEffect(() => {
    if (editorRef?.current && activeId) {
      const activeBuffer = buffers.find(b => b.id === activeId);
      if (activeBuffer) {
        const currentCode = editorRef.current.getValue();
        if (currentCode !== activeBuffer.code) {
          editorRef.current.setValue(activeBuffer.code);
        }
      }
    }
  }, [activeId, buffers, editorRef]);

  // Save current buffer code before switching
  const saveCurrentBuffer = useCallback(() => {
    if (!editorRef?.current || !activeId) return;
    
    const currentCode = editorRef.current.getValue();
    setBuffers(prev => prev.map(b => 
      b.id === activeId ? { ...b, code: currentCode } : b
    ));
  }, [activeId, editorRef]);

  // Buffer management
  const selectBuffer = useCallback((bufferId) => {
    if (bufferId === activeId) return;
    saveCurrentBuffer();
    setActiveId(bufferId);
  }, [activeId, saveCurrentBuffer]);

  const addBuffer = useCallback(() => {
    if (buffers.length >= MAX_BUFFERS) return;
    
    saveCurrentBuffer();
    const newBuffer = {
      id: genId(),
      name: (buffers.length + 1).toString(),
      code: defaultTune
    };
    setBuffers(prev => [...prev, newBuffer]);
    setActiveId(newBuffer.id);
  }, [buffers.length, saveCurrentBuffer]);

  const removeBuffer = useCallback((bufferId) => {
    if (buffers.length <= 1) return;
    
    // Stop buffer if playing
    stopBuffer(bufferId);
    
    setBuffers(prev => {
      const filtered = prev.filter(b => b.id !== bufferId);
      if (bufferId === activeId && filtered.length > 0) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });
  }, [buffers.length, activeId]);

  const renameBuffer = useCallback((bufferId, newName) => {
    if (!newName.trim()) return;
    setBuffers(prev => prev.map(b => 
      b.id === bufferId ? { ...b, name: newName.trim() } : b
    ));
  }, []);

  // Audio session management
  const playBuffer = useCallback((bufferId) => {
    const buffer = buffers.find(b => b.id === bufferId);
    if (!buffer) return;

    // If it's the active buffer, use the current editor code
    const code = bufferId === activeId && editorRef?.current 
      ? editorRef.current.getValue() 
      : buffer.code;

    if (!code.trim()) return;

    try {
      // Create new audio session for this buffer
      onEvaluate?.(code);
      setPlayingSessions(prev => new Map(prev).set(bufferId, { playing: true, code }));
      
      // Update buffer code
      setBuffers(prev => prev.map(b => 
        b.id === bufferId ? { ...b, code } : b
      ));
    } catch (error) {
      console.error('Failed to play buffer:', error);
    }
  }, [buffers, activeId, editorRef, onEvaluate]);

  const stopBuffer = useCallback((bufferId) => {
    if (playingSessions.has(bufferId)) {
      // Stop the audio for this buffer
      onStop?.();
      setPlayingSessions(prev => {
        const next = new Map(prev);
        next.delete(bufferId);
        return next;
      });
    }
  }, [playingSessions, onStop]);

  const toggleBuffer = useCallback((bufferId) => {
    if (playingSessions.has(bufferId)) {
      stopBuffer(bufferId);
    } else {
      playBuffer(bufferId);
    }
  }, [playingSessions, playBuffer, stopBuffer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return;
      
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= buffers.length) {
        e.preventDefault();
        selectBuffer(buffers[n - 1].id);
        return;
      }
      
      if (['ArrowLeft', 'ArrowRight'].includes(e.key) && buffers.length > 1) {
        e.preventDefault();
        const idx = buffers.findIndex(b => b.id === activeId);
        if (idx === -1) return;
        
        const nextIdx = e.key === 'ArrowRight' 
          ? (idx + 1) % buffers.length 
          : (idx - 1 + buffers.length) % buffers.length;
        selectBuffer(buffers[nextIdx].id);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [buffers, activeId, selectBuffer]);

  if (!buffers.length) return null;

  return (
    <div
      className={[
        'fixed bottom-2 left-1/2 -translate-x-1/2 z-[95]',
        'flex items-center gap-1 px-2 py-1 rounded-xl',
        'backdrop-blur-sm bg-black/50 border border-white/10 shadow-lg',
        'text-[11px] font-mono text-white/80 select-none'
      ].join(' ')}
    >
      {buffers.map((buffer, i) => {
        const active = buffer.id === activeId;
        const playing = playingSessions.has(buffer.id);
        
        return (
          <div key={buffer.id} className="relative group">
            {renamingId === buffer.id ? (
              <input
                autoFocus
                defaultValue={buffer.name}
                onBlur={(e) => { 
                  renameBuffer(buffer.id, e.target.value); 
                  setRenamingId(null); 
                }}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    renameBuffer(buffer.id, e.currentTarget.value); 
                    setRenamingId(null); 
                  } 
                }}
                className="w-12 px-1 py-0.5 rounded bg-white/10 border border-white/20 text-white text-[11px] outline-none"
              />
            ) : (
              <button
                title={`Buffer ${i+1} (Alt+${i+1}) - ${playing ? 'Playing' : 'Stopped'}`}
                onClick={() => selectBuffer(buffer.id)}
                onDoubleClick={() => setRenamingId(buffer.id)}
                className={[
                  'px-2 py-1 rounded-md transition-colors relative',
                  active ? 'bg-lime-500/80 text-black shadow' : 'bg-white/10 hover:bg-white/20'
                ].join(' ')}
              >
                {buffer.name}
                {playing && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </button>
            )}
            
            {/* Play/Stop button */}
            <button
              title={playing ? 'Stop' : 'Play'}
              onClick={(e) => { 
                e.stopPropagation(); 
                toggleBuffer(buffer.id);
              }}
              className={[
                'absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 flex items-center justify-center text-[8px]',
                'bg-black/80 text-white/70 hover:text-white border border-white/20 rounded-sm',
                playing ? 'bg-red-600/80' : 'bg-green-600/80'
              ].join(' ')}
            >
              {playing ? '⏹' : '▶'}
            </button>

            {/* Close button */}
            {buffers.length > 1 && (
              <button
                aria-label="close buffer"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  removeBuffer(buffer.id); 
                }}
                className={[
                  'absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[10px]',
                  'bg-black/70 text-white/70 hover:text-white hover:bg-black/90 border border-white/20',
                  'opacity-0 group-hover:opacity-70'
                ].join(' ')}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      
      {/* Add buffer button */}
      {buffers.length < MAX_BUFFERS && (
        <button
          aria-label="add buffer"
          title="Añadir buffer"
          onClick={addBuffer}
          className="ml-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
        >
          +
        </button>
      )}
      
      <div className="ml-2 flex gap-2 text-[10px] opacity-60">
        <span>Alt+1..9</span>
        <span>Alt+←/→</span>
      </div>
    </div>
  );
}
