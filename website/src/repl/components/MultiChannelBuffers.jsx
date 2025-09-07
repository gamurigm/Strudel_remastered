import { useEffect, useState, useCallback, useRef } from 'react';
import { StrudelMirror } from '@strudel/codemirror';
import { useReplContext } from '../useReplContext.jsx';
import { defaultTune } from '../defaultTune.mjs';

// Simple ID generator
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const LS_KEY = 'strudelMultiChannelsV1';
const MAX_CHANNELS = 9;

// Individual channel component
function Channel({ channelId, channelData, isActive, onUpdateCode, onPlay, onStop, isPlaying }) {
  const channelContext = useReplContext();
  const editorRef = useRef();

  // Save code changes
  const handleCodeChange = useCallback((code) => {
    onUpdateCode(channelId, code);
  }, [channelId, onUpdateCode]);

  // Handle play/stop for this channel
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      channelContext?.onStop?.();
      onStop(channelId);
    } else {
      const code = editorRef.current?.getValue() || '';
      if (code.trim()) {
        channelContext?.onEvaluate?.(code);
        onPlay(channelId);
      }
    }
  }, [channelId, isPlaying, channelContext, onPlay, onStop]);

  if (!isActive) return null;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <StrudelMirror
        ref={editorRef}
        context={channelContext}
        tune={channelData.code || defaultTune}
        onDraw={(_, value) => handleCodeChange(value)}
        onEvaluate={(code) => {
          handleCodeChange(code);
          channelContext?.onEvaluate?.(code);
          onPlay(channelId);
        }}
        onStop={() => {
          channelContext?.onStop?.();
          onStop(channelId);
        }}
        onChange={(value) => handleCodeChange(value)}
        style={{ height: '100%' }}
      />
    </div>
  );
}

export default function MultiChannelBuffers() {
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [playingChannels, setPlayingChannels] = useState(new Set());
  const [renamingId, setRenamingId] = useState(null);

  // Load persisted channels
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels(data.channels);
          setActiveChannelId(data.activeChannelId || data.channels[0].id);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load channels:', e);
    }
    
    // Create default channel
    const defaultChannel = {
      id: genId(),
      name: '1',
      code: defaultTune
    };
    setChannels([defaultChannel]);
    setActiveChannelId(defaultChannel.id);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (channels.length > 0) {
      localStorage.setItem(LS_KEY, JSON.stringify({
        channels,
        activeChannelId
      }));
    }
  }, [channels, activeChannelId]);

  // Channel management functions
  const addChannel = useCallback(() => {
    if (channels.length >= MAX_CHANNELS) return;
    
    const newChannel = {
      id: genId(),
      name: (channels.length + 1).toString(),
      code: defaultTune
    };
    
    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
  }, [channels.length]);

  const removeChannel = useCallback((channelId) => {
    if (channels.length <= 1) return;
    
    // Stop the channel if it's playing
    setPlayingChannels(prev => {
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
    
    setChannels(prev => {
      const filtered = prev.filter(c => c.id !== channelId);
      // Switch to first available channel if removing active
      if (channelId === activeChannelId && filtered.length > 0) {
        setActiveChannelId(filtered[0].id);
      }
      return filtered;
    });
  }, [channels.length, activeChannelId]);

  const selectChannel = useCallback((channelId) => {
    setActiveChannelId(channelId);
  }, []);

  const updateChannelCode = useCallback((channelId, code) => {
    setChannels(prev => prev.map(c => 
      c.id === channelId ? { ...c, code } : c
    ));
  }, []);

  const renameChannel = useCallback((channelId, newName) => {
    if (!newName.trim()) return;
    setChannels(prev => prev.map(c => 
      c.id === channelId ? { ...c, name: newName.trim() } : c
    ));
  }, []);

  const playChannel = useCallback((channelId) => {
    setPlayingChannels(prev => new Set([...prev, channelId]));
  }, []);

  const stopChannel = useCallback((channelId) => {
    setPlayingChannels(prev => {
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return;
      
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= channels.length) {
        e.preventDefault();
        selectChannel(channels[n - 1].id);
        return;
      }
      
      if (['ArrowLeft', 'ArrowRight'].includes(e.key) && channels.length > 1) {
        e.preventDefault();
        const idx = channels.findIndex(c => c.id === activeChannelId);
        if (idx === -1) return;
        
        const nextIdx = e.key === 'ArrowRight' 
          ? (idx + 1) % channels.length 
          : (idx - 1 + channels.length) % channels.length;
        selectChannel(channels[nextIdx].id);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [channels, activeChannelId, selectChannel]);

  if (channels.length === 0) return null;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Render only the active channel */}
      {channels.map(channel => (
        <Channel
          key={channel.id}
          channelId={channel.id}
          channelData={channel}
          isActive={channel.id === activeChannelId}
          onUpdateCode={updateChannelCode}
          onPlay={playChannel}
          onStop={stopChannel}
          isPlaying={playingChannels.has(channel.id)}
        />
      ))}

      {/* Channel tabs UI */}
      <div
        className={[
          'fixed bottom-2 left-1/2 -translate-x-1/2 z-[95]',
          'flex items-center gap-1 px-2 py-1 rounded-xl',
          'backdrop-blur-sm bg-black/50 border border-white/10 shadow-lg',
          'text-[11px] font-mono text-white/80 select-none'
        ].join(' ')}
      >
        {channels.map((channel, i) => {
          const active = channel.id === activeChannelId;
          const playing = playingChannels.has(channel.id);
          
          return (
            <div key={channel.id} className="relative group">
              {renamingId === channel.id ? (
                <input
                  autoFocus
                  defaultValue={channel.name}
                  onBlur={(e) => { 
                    renameChannel(channel.id, e.target.value); 
                    setRenamingId(null); 
                  }}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') { 
                      renameChannel(channel.id, e.currentTarget.value); 
                      setRenamingId(null); 
                    } 
                  }}
                  className="w-12 px-1 py-0.5 rounded bg-white/10 border border-white/20 text-white text-[11px] outline-none"
                />
              ) : (
                <button
                  title={`Channel ${i+1} (Alt+${i+1}) - ${playing ? 'Playing' : 'Stopped'}`}
                  onClick={() => selectChannel(channel.id)}
                  onDoubleClick={() => setRenamingId(channel.id)}
                  className={[
                    'px-2 py-1 rounded-md transition-colors relative',
                    active ? 'bg-lime-500/80 text-black shadow' : 'bg-white/10 hover:bg-white/20'
                  ].join(' ')}
                >
                  {channel.name}
                  {playing && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </button>
              )}
              
              {/* Play/Stop button */}
              <button
                title={playing ? 'Stop Channel' : 'Play Channel'}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (playing) {
                    stopChannel(channel.id);
                  } else {
                    playChannel(channel.id);
                  }
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
              {channels.length > 1 && (
                <button
                  aria-label="close channel"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    removeChannel(channel.id); 
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
        
        {/* Add channel button */}
        {channels.length < MAX_CHANNELS && (
          <button
            aria-label="add channel"
            title="Añadir canal"
            onClick={addChannel}
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
    </div>
  );
}
