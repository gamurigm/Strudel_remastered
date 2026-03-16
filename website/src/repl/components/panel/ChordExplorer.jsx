import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import cx from '@src/cx.mjs';

/* ------------------------------------------------------------------ */
/*  Music theory data                                                  */
/* ------------------------------------------------------------------ */

const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const ROOT_DISPLAY = ['C', 'C♯', 'D♭', 'D', 'D♯', 'E♭', 'E', 'F', 'F♯', 'G♭', 'G', 'G♯', 'A♭', 'A', 'A♯', 'B♭', 'B'];

const CHORD_TYPES = [
    { symbol: '^', label: 'Major', cat: 'triads' },
    { symbol: '-', label: 'Minor', cat: 'triads' },
    { symbol: 'o', label: 'Dim', cat: 'triads' },
    { symbol: '+', label: 'Aug', cat: 'triads' },
    { symbol: 'sus', label: 'Sus4', cat: 'triads' },
    { symbol: '^7', label: 'Maj7', cat: 'seventh' },
    { symbol: '-7', label: 'Min7', cat: 'seventh' },
    { symbol: '7', label: 'Dom7', cat: 'seventh' },
    { symbol: '-7b5', label: 'Half-dim', cat: 'seventh' },
    { symbol: 'o7', label: 'Dim7', cat: 'seventh' },
    { symbol: '^9', label: 'Maj9', cat: 'ext' },
    { symbol: '-9', label: 'Min9', cat: 'ext' },
    { symbol: '9', label: 'Dom9', cat: 'ext' },
    { symbol: '13', label: 'Dom13', cat: 'ext' },
    { symbol: '69', label: '6/9', cat: 'ext' },
    { symbol: '-^7', label: 'MinMaj7', cat: 'ext' },
    { symbol: '7#11', label: '7♯11', cat: 'alt' },
    { symbol: '7b9', label: '7♭9', cat: 'alt' },
    { symbol: '7#9', label: '7♯9', cat: 'alt' },
    { symbol: '7alt', label: '7alt', cat: 'alt' },
    { symbol: '7#5', label: '7♯5', cat: 'alt' },
    { symbol: '7b13', label: '7♭13', cat: 'alt' },
];

const CATEGORIES = [
    { id: 'triads', label: 'Tríadas' },
    { id: 'seventh', label: '7ths' },
    { id: 'ext', label: 'Ext' },
    { id: 'alt', label: 'Alt' },
];

const VOICING_DICTS = [
    { id: 'ireal', label: 'iReal' },
    { id: 'ireal-ext', label: 'iReal Ext' },
    { id: 'lefthand', label: 'Left Hand' },
    { id: 'triads', label: 'Triads' },
    { id: 'guidetones', label: 'Guide Tones' },
];

/* Drop voicing types */
const DROP_TYPES = [
    { id: 'close', label: 'Close' },
    { id: 'drop2', label: 'Drop 2' },
    { id: 'drop3', label: 'Drop 3' },
    { id: 'drop24', label: 'Drop 2+4' },
];

/* Interval to semitones */
const intervalToSemitones = (interval) => {
    const quality = interval.slice(-1);
    const num = parseInt(interval.slice(0, -1));
    const baseMap = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12, 9: 14, 10: 16, 11: 17, 12: 19, 13: 21, 14: 23, 15: 24, 16: 26, 17: 28, 18: 29, 19: 31, 20: 33, 21: 35 };
    const base = baseMap[num] ?? 0;
    const qualityOffset = { P: 0, M: 0, m: -1, A: 1, d: -1 };
    return base + (qualityOffset[quality] ?? 0);
};

/* Note name for a semitone offset from root */
const NOTE_NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTE_NAMES_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

const FLAT_ROOTS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Db'];

const rootToMidi = (root) => {
    const map = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
    return map[root] ?? 0;
};

const midiToNoteName = (midi, useFlats) => {
    const table = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
    const oct = Math.floor(midi / 12) - 1;
    return table[midi % 12] + oct;
};

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/* Build chord notes from interval string */
const buildVoicingNotes = (root, intervals, octave = 4) => {
    const rootMidi = rootToMidi(root) + octave * 12;
    const useFlats = FLAT_ROOTS.includes(root);
    return intervals.split(' ').map((iv) => {
        const semi = intervalToSemitones(iv);
        const midi = rootMidi + semi;
        return { midi, name: midiToNoteName(midi, useFlats), interval: iv };
    });
};

/* ------------------------------------------------------------------ */
/*  Drop voicing transforms                                            */
/*  Drop N = take the Nth note from top and move it down 1 octave      */
/* ------------------------------------------------------------------ */

const applyDrop = (notes, dropType) => {
    if (dropType === 'close' || notes.length < 3) return notes;

    // Sort by MIDI ascending first (close position)
    const sorted = [...notes].sort((a, b) => a.midi - b.midi);

    const useFlats = FLAT_ROOTS.includes(sorted[0]?.name?.[0]) || false;

    const drop = (arr, nthFromTop) => {
        // nthFromTop: 1=top, 2=second from top, etc.
        const idx = arr.length - nthFromTop;
        if (idx < 0 || idx >= arr.length) return arr;
        const result = [...arr];
        const droppedMidi = result[idx].midi - 12;
        result[idx] = {
            ...result[idx],
            midi: droppedMidi,
            name: midiToNoteName(droppedMidi, useFlats),
        };
        return result.sort((a, b) => a.midi - b.midi);
    };

    switch (dropType) {
        case 'drop2':
            return drop(sorted, 2);
        case 'drop3':
            return drop(sorted, 3);
        case 'drop24': {
            let res = drop(sorted, 2);
            res = drop(res, 4);
            return res;
        }
        default:
            return sorted;
    }
};

/* ------------------------------------------------------------------ */
/*  Web Audio — play chord                                             */
/* ------------------------------------------------------------------ */

let _audioCtx = null;
const getAudioCtx = () => {
    if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
};

const playChordAudio = (notes, { arp = false, duration = 1.6, spread = 0.06 } = {}) => {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(ctx.destination);

    notes.forEach((note, i) => {
        const freq = midiToFreq(note.midi);
        const startTime = arp ? now + i * 0.12 : now + i * spread;
        const endTime = startTime + duration;

        // Rich piano-like tone: fundamental + harmonics
        const createOsc = (f, type, gainVal, detune = 0) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(f, startTime);
            osc.detune.setValueAtTime(detune, startTime);
            g.gain.setValueAtTime(0, startTime);
            // Attack
            g.gain.linearRampToValueAtTime(gainVal, startTime + 0.015);
            // Decay
            g.gain.exponentialRampToValueAtTime(gainVal * 0.6, startTime + 0.12);
            // Release
            g.gain.exponentialRampToValueAtTime(0.001, endTime);
            g.gain.linearRampToValueAtTime(0, endTime + 0.05);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(startTime);
            osc.stop(endTime + 0.1);
        };

        // Fundamental (triangle for warmth)
        createOsc(freq, 'triangle', 0.5);
        // 2nd harmonic (sine, softer)
        createOsc(freq * 2, 'sine', 0.12);
        // Slight detuned copy for chorus
        createOsc(freq, 'triangle', 0.15, 6);
        createOsc(freq, 'triangle', 0.15, -6);
    });

    // Fade out master
    masterGain.gain.setValueAtTime(0.35, now + duration * 0.7);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.3);
};

/* ------------------------------------------------------------------ */
/*  SVG Mini Staff (5 lines, notes rendered as circles)               */
/* ------------------------------------------------------------------ */

const STAFF_CONFIG = {
    width: 320,
    height: 180,
    padTop: 28,
    padBottom: 18,
    lineSpacing: 14,
    noteRadius: 7,
};

/* Map MIDI → vertical position on staff */
const midiToStaffY = (midi) => {
    const noteInOctave = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
    const octave = Math.floor(midi / 12) - 1;
    const diatonic = noteInOctave[midi % 12];
    const staffPos = (octave - 4) * 7 + diatonic;
    const refPos = 2; // E4 = bottom line
    const { padTop, lineSpacing } = STAFF_CONFIG;
    const bottomLineY = padTop + 4 * lineSpacing;
    return bottomLineY - (staffPos - refPos) * (lineSpacing / 2);
};

const isSharp = (midi) => [1, 3, 6, 8, 10].includes(midi % 12);

function MiniStaff({ notes, accentColor = '#a3e635', isPlaying = false }) {
    const { width, height, padTop, lineSpacing, noteRadius } = STAFF_CONFIG;
    const lines = Array.from({ length: 5 }, (_, i) => padTop + i * lineSpacing);

    const noteSpacing = notes.length > 1 ? Math.min(42, (width - 80) / (notes.length - 1)) : 0;
    const startX = width / 2 - ((notes.length - 1) * noteSpacing) / 2;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 160 }}>
            <defs>
                <linearGradient id="staffBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPlaying ? "rgba(163,230,53,0.08)" : "rgba(163,230,53,0.04)"} />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
                <filter id="noteGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="noteGlowActive">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <rect x="0" y="0" width={width} height={height} fill="url(#staffBg)" rx="8" />

            {/* Staff lines */}
            {lines.map((y, i) => (
                <line key={i} x1="16" y1={y} x2={width - 16} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            ))}

            {/* Treble clef symbol */}
            <text x="22" y={padTop + 2.5 * lineSpacing + 2} fontSize="40" fill="rgba(255,255,255,0.18)" fontFamily="serif" textAnchor="middle">
                𝄞
            </text>

            {/* Notes */}
            {notes.map((note, i) => {
                const noteCx = startX + i * noteSpacing;
                const cy = midiToStaffY(note.midi);
                const ledgers = [];
                if (cy > lines[4]) {
                    for (let ly = lines[4] + lineSpacing; ly <= cy + 1; ly += lineSpacing) ledgers.push(ly);
                }
                if (cy < lines[0]) {
                    for (let ly = lines[0] - lineSpacing; ly >= cy - 1; ly -= lineSpacing) ledgers.push(ly);
                }
                const sharp = isSharp(note.midi);
                return (
                    <g key={i}>
                        {ledgers.map((ly, li) => (
                            <line key={li} x1={noteCx - 14} y1={ly} x2={noteCx + 14} y2={ly} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                        ))}
                        <circle
                            cx={noteCx} cy={cy} r={isPlaying ? noteRadius + 1.5 : noteRadius}
                            fill={accentColor}
                            filter={isPlaying ? "url(#noteGlowActive)" : "url(#noteGlow)"}
                            opacity="0.92"
                        >
                            {isPlaying && (
                                <animate attributeName="r" values={`${noteRadius};${noteRadius + 2.5};${noteRadius}`} dur="0.6s" repeatCount="2" />
                            )}
                        </circle>
                        <line x1={noteCx + noteRadius} y1={cy} x2={noteCx + noteRadius} y2={cy - 30} stroke={accentColor} strokeWidth="1.5" opacity="0.5" />
                        {sharp && (
                            <text x={noteCx - 14} y={cy + 4} fontSize="12" fill="rgba(255,255,255,0.6)" fontFamily="serif">♯</text>
                        )}
                        <text x={noteCx} y={cy + noteRadius + 14} fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle" fontFamily="monospace">
                            {note.name}
                        </text>
                        <text x={noteCx} y={cy - 36} fontSize="7.5" fill="rgba(163,230,53,0.5)" textAnchor="middle" fontFamily="monospace">
                            {note.interval}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Syntax generator                                                   */
/* ------------------------------------------------------------------ */

function buildSyntax(root, chordType, dict, mode = 'chord', dropType = 'close') {
    const chordName = root + chordType;
    const dictStr = dict && dict !== 'ireal' ? `.dict('${dict}')` : '';
    const offsetStr = dropType === 'drop2' ? '.offset(1)' : dropType === 'drop3' ? '.offset(2)' : dropType === 'drop24' ? '.offset(3)' : '';

    if (mode === 'arp') {
        return `n("0 1 2 3").chord("${chordName}").voicing()${dictStr}`;
    }
    if (mode === 'bass') {
        return `stack(\n  "${chordName}".voicing()${dictStr}${offsetStr}.s('piano'),\n  "${root}2".note().s('sawtooth')\n)`;
    }
    return `"${chordName}".voicing()${dictStr}${offsetStr}.s('piano')`;
}

/* ------------------------------------------------------------------ */
/*  Copy-to-clipboard button                                           */
/* ------------------------------------------------------------------ */
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
        });
    };
    return (
        <button
            onClick={copy}
            title="Copiar al portapapeles"
            className={cx(
                'px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase transition-all',
                copied
                    ? 'bg-lime-400/30 text-lime-300 scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white active:scale-95',
            )}
        >
            {copied ? '✓ copiado' : 'copiar'}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Play Button                                                        */
/* ------------------------------------------------------------------ */
function PlayButton({ notes, arp = false }) {
    const [playing, setPlaying] = useState(false);
    const timeoutRef = useRef(null);

    const handlePlay = useCallback(() => {
        if (playing) return;
        setPlaying(true);
        playChordAudio(notes, { arp, duration: arp ? 2.0 : 1.6 });
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setPlaying(false), arp ? 2200 : 1800);
    }, [notes, arp, playing]);

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    return (
        <button
            onClick={handlePlay}
            title={arp ? "Arpegiar acorde" : "Reproducir acorde"}
            className={cx(
                'group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border',
                playing
                    ? 'bg-lime-400/30 border-lime-400/60 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.3)] scale-[1.03]'
                    : 'bg-white/10 border-white/15 text-white/70 hover:bg-lime-400/15 hover:border-lime-400/40 hover:text-lime-200 hover:shadow-[0_0_8px_rgba(163,230,53,0.15)] active:scale-95',
            )}
        >
            {/* Animated ring when playing */}
            {playing && (
                <span className="absolute inset-0 rounded-lg border-2 border-lime-400/40 animate-ping" style={{ animationDuration: '0.8s' }} />
            )}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className={cx(playing && 'animate-pulse')}>
                {arp ? (
                    /* Arp icon: staggered notes */
                    <>
                        <circle cx="4" cy="12" r="1.8" />
                        <circle cx="8" cy="8" r="1.8" />
                        <circle cx="12" cy="4" r="1.8" />
                        <line x1="5.5" y1="11" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1" />
                        <line x1="9.5" y1="7" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1" />
                    </>
                ) : (
                    /* Play triangle */
                    <path d="M4 2l10 6-10 6V2z" />
                )}
            </svg>
            <span>{playing ? (arp ? 'arpegiando…' : 'sonando…') : (arp ? 'arpegiar' : 'play')}</span>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ChordExplorer() {
    const [root, setRoot] = useState('C');
    const [chordType, setChordType] = useState('^7');
    const [dict, setDict] = useState('ireal');
    const [voicingIdx, setVoicingIdx] = useState(0);
    const [syntaxMode, setSyntaxMode] = useState('chord'); // chord | arp | bass
    const [activeCat, setActiveCat] = useState('seventh');
    const [octave, setOctave] = useState(4);
    const [dropType, setDropType] = useState('close');
    const [isPlaying, setIsPlaying] = useState(false);

    const VOICING_DATA = useMemo(() => ({
        '^': ['1P 5P 8P 10M', '1P 5P 8P 10M 12P', '3M 5P 8P 10M 12P', '3M 8P 10M 12P 15P', '5P 8P 10M 12P 15P'],
        '-': ['1P 3m 5P 8P 10m', '1P 5P 8P 10m 12P', '3m 5P 8P 10m 12P', '5P 8P 10m 12P 15P'],
        'o': ['1P 5d 8P 10m 12d', '3m 8P 10m 12d 15P', '5d 8P 10m 12d 15P'],
        '+': ['1P 3M 6m 8P 10M', '1P 6m 8P 10M 13m', '3M 6m 8P 10M 13m'],
        'sus': ['1P 4P 5P 8P', '1P 4P 5P 8P 11P', '5P 8P 11P 12P'],
        '^7': ['1P 5P 7M 10M 12P', '1P 10M 12P 14M', '3M 8P 10M 12P 14M', '5P 8P 10M 12P 14M'],
        '-7': ['1P 3m 5P 7m 10m', '1P 5P 7m 10m 12P', '3m 7m 8P 10m 12P', '3m 7m 8P 10m 14m', '5P 7m 8P 10m 14m'],
        '7': ['1P 5P 7m 8P 10M', '1P 7m 8P 10M 12P', '3M 7m 8P 10M 12P', '3M 7m 8P 10M 14m'],
        '-7b5': ['3m 5d 7m 8P 10m', '1P 5d 7m 10m 12d', '1P 7m 10m 12d', '3m 7m 8P 10m 12d'],
        'o7': ['1P 6M 8P 10m 12d', '1P 6M 10m 12d 13M', '3m 8P 10m 12d 13M'],
        '^9': ['1P 5P 7M 9M 10M', '1P 7M 9M 10M 12P', '3M 7M 8P 9M 12P'],
        '-9': ['1P 3m 5P 7m 9M', '3m 5P 7m 8P 9M', '3m 7m 8P 9M 12P'],
        '9': ['1P 5P 7m 9M 10M', '1P 7m 9M 10M 12P', '3M 7m 8P 9M 12P'],
        '13': ['1P 6M 7m 9M 10M', '1P 7m 9M 10M 13M', '3M 7m 8P 9M 13M'],
        '69': ['1P 5P 6M 9M 10M', '1P 5P 9M 10M 13M', '3M 5P 8P 9M 13M'],
        '-^7': ['1P 3m 5P 7M 10m', '1P 5P 7M 10m 12P', '3m 7M 8P 10m 12P'],
        '7#11': ['1P 3M 7m 10M 12d', '3M 7m 8P 10M 12d', '7m 10M 12d 14m 15P'],
        '7b9': ['1P 3M 7m 9m 10M', '3M 7m 8P 9m 10M', '3M 7m 8P 9m 14m'],
        '7#9': ['1P 3M 7m 10m', '3M 7m 8P 10m 14m', '7m 10m 10M 14m 15P'],
        '7alt': ['3M 7m 8P 9m 12d', '1P 7m 10m 10M 13m', '3M 7m 8P 10m 13m'],
        '7#5': ['1P 3M 7m 10M 13m', '3M 7m 8P 10M 13m', '3M 7m 8P 13m 14m'],
        '7b13': ['1P 3M 7m 10M 13m', '3M 7m 8P 10M 13m', '3M 7m 8P 13m 14m'],
    }), []);

    const voicings = VOICING_DATA[chordType] || ['1P 3M 5P'];
    const currentVoicing = voicings[voicingIdx % voicings.length] || voicings[0];
    const rawNotes = buildVoicingNotes(root, currentVoicing, octave);
    const notes = applyDrop(rawNotes, dropType);
    const syntax = buildSyntax(root, chordType, dict, syntaxMode, dropType);

    // Reset voicing index when chord changes
    useEffect(() => {
        setVoicingIdx(0);
    }, [root, chordType]);

    const filteredChords = CHORD_TYPES.filter((c) => c.cat === activeCat);

    // Play handlers
    const handlePlay = useCallback(() => {
        setIsPlaying(true);
        playChordAudio(notes, { arp: false });
        setTimeout(() => setIsPlaying(false), 1800);
    }, [notes]);

    const handleArp = useCallback(() => {
        setIsPlaying(true);
        playChordAudio(notes, { arp: true, duration: 2.0 });
        setTimeout(() => setIsPlaying(false), 2200);
    }, [notes]);

    return (
        <div className="p-3 space-y-3 text-[11px] select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* ─── Title ─── */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg" style={{ lineHeight: 1 }}>🎹</span>
                <h3 className="text-sm font-bold tracking-tight text-white/90">Chord Explorer</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-400/15 text-lime-300/80 font-semibold uppercase tracking-widest ml-auto">
                    voicing tool
                </span>
            </div>

            {/* ─── Root selector ─── */}
            <div>
                <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mb-1 block">Raíz</label>
                <div className="flex flex-wrap gap-1">
                    {ROOTS.map((r, i) => (
                        <button
                            key={r}
                            onClick={() => setRoot(r)}
                            className={cx(
                                'min-w-[32px] h-7 rounded-md text-[10px] font-bold transition-all',
                                'border',
                                root === r
                                    ? 'bg-lime-400/25 border-lime-400/60 text-lime-200 shadow-[0_0_8px_rgba(163,230,53,0.2)] scale-105'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80 hover:border-white/20',
                            )}
                        >
                            {ROOT_DISPLAY[i]}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Chord type selector ─── */}
            <div>
                <div className="flex items-center gap-1 mb-1.5">
                    <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">Tipo</label>
                    <div className="flex gap-0.5 ml-auto">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(cat.id)}
                                className={cx(
                                    'px-2 py-0.5 rounded text-[9px] font-semibold transition-all',
                                    activeCat === cat.id
                                        ? 'bg-lime-400/20 text-lime-300'
                                        : 'text-white/35 hover:text-white/60',
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                    {filteredChords.map((ct) => (
                        <button
                            key={ct.symbol}
                            onClick={() => setChordType(ct.symbol)}
                            className={cx(
                                'px-2.5 h-7 rounded-md text-[10px] font-bold transition-all border',
                                chordType === ct.symbol
                                    ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_8px_rgba(103,232,249,0.15)]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70',
                            )}
                        >
                            {ct.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Staff display ─── */}
            <div className={cx(
                'rounded-xl border p-2 backdrop-blur-sm transition-all duration-300',
                isPlaying
                    ? 'border-lime-400/30 bg-black/40 shadow-[0_0_20px_rgba(163,230,53,0.08)]'
                    : 'border-white/10 bg-black/30',
            )}>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 font-bold text-xs">
                        {ROOT_DISPLAY[ROOTS.indexOf(root)]}{chordType}
                        {dropType !== 'close' && (
                            <span className="ml-1.5 text-[9px] text-orange-300/70 font-normal">
                                ({DROP_TYPES.find(d => d.id === dropType)?.label})
                            </span>
                        )}
                    </span>
                    <div className="flex items-center gap-1">
                        <label className="text-[8px] text-white/30">Oct</label>
                        <select
                            value={octave}
                            onChange={(e) => setOctave(Number(e.target.value))}
                            className="bg-white/10 border border-white/15 rounded px-1 py-0.5 text-[10px] text-white/70 outline-none"
                        >
                            {[2, 3, 4, 5, 6].map((o) => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <MiniStaff notes={notes} accentColor={isPlaying ? '#86efac' : '#a3e635'} isPlaying={isPlaying} />
                {/* Notes display row */}
                <div className="flex gap-1 mt-1 justify-center flex-wrap">
                    {notes.map((n, i) => (
                        <span
                            key={i}
                            className={cx(
                                'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all',
                                isPlaying
                                    ? 'bg-lime-400/20 border border-lime-400/40 text-lime-200'
                                    : 'bg-lime-400/10 border border-lime-400/20 text-lime-300/80',
                            )}
                        >
                            {n.name}
                        </span>
                    ))}
                </div>

                {/* ─── Play controls ─── */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                    <PlayButton notes={notes} arp={false} />
                    <PlayButton notes={notes} arp={true} />
                </div>
            </div>

            {/* ─── Drop voicing selector ─── */}
            <div>
                <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mb-1 block">Drop Voicing</label>
                <div className="flex gap-1 flex-wrap">
                    {DROP_TYPES.map((d) => (
                        <button
                            key={d.id}
                            onClick={() => setDropType(d.id)}
                            className={cx(
                                'px-2.5 py-1 rounded-md text-[9px] font-bold transition-all border',
                                dropType === d.id
                                    ? 'bg-orange-400/20 border-orange-400/50 text-orange-200 shadow-[0_0_8px_rgba(251,146,60,0.15)]'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60',
                            )}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
                <p className="mt-1 text-[8px] text-white/25 leading-relaxed">
                    {dropType === 'close' && 'Posición cerrada — todas las notas en el rango más compacto'}
                    {dropType === 'drop2' && 'Drop 2 — la 2ª nota desde arriba baja 1 octava. Sonido abierto, muy usado en jazz'}
                    {dropType === 'drop3' && 'Drop 3 — la 3ª nota desde arriba baja 1 octava. Sonido más espaciado'}
                    {dropType === 'drop24' && 'Drop 2+4 — la 2ª y 4ª notas desde arriba bajan 1 octava. Voicing muy abierto'}
                </p>
            </div>

            {/* ─── Voicing selector ─── */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">Voicing</label>
                    <span className="text-[9px] text-white/25">
                        {voicingIdx + 1} / {voicings.length}
                    </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                    {voicings.map((v, i) => (
                        <button
                            key={i}
                            onClick={() => setVoicingIdx(i)}
                            className={cx(
                                'px-2 py-1 rounded-md text-[9px] font-mono transition-all border',
                                voicingIdx === i
                                    ? 'bg-purple-400/20 border-purple-400/50 text-purple-200 shadow-[0_0_6px_rgba(192,132,252,0.15)]'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60',
                            )}
                            title={`Voicing ${i + 1}: ${v}`}
                        >
                            V{i + 1}
                        </button>
                    ))}
                </div>
                <div className="mt-1 text-[9px] text-white/30 font-mono truncate">
                    intervalos: {currentVoicing}
                </div>
            </div>

            {/* ─── Dictionary selector ─── */}
            <div>
                <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mb-1 block">Dict</label>
                <div className="flex gap-1 flex-wrap">
                    {VOICING_DICTS.map((d) => (
                        <button
                            key={d.id}
                            onClick={() => setDict(d.id)}
                            className={cx(
                                'px-2 py-1 rounded text-[9px] font-semibold transition-all border',
                                dict === d.id
                                    ? 'bg-amber-400/20 border-amber-400/40 text-amber-200'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60',
                            )}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Syntax output ─── */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">Sintaxis</label>
                    <div className="flex gap-0.5 ml-auto">
                        {[
                            { id: 'chord', label: 'Acorde' },
                            { id: 'arp', label: 'Arpegio' },
                            { id: 'bass', label: 'Bass+Chord' },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setSyntaxMode(m.id)}
                                className={cx(
                                    'px-2 py-0.5 rounded text-[9px] font-semibold transition-all',
                                    syntaxMode === m.id
                                        ? 'bg-lime-400/20 text-lime-300'
                                        : 'text-white/30 hover:text-white/50',
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
                <pre className="bg-black/50 rounded-lg p-2.5 text-[11px] text-lime-300/90 font-mono leading-relaxed overflow-x-auto border border-lime-400/10 whitespace-pre-wrap">
                    {syntax}
                </pre>
                <div className="flex justify-end mt-2">
                    <CopyButton text={syntax} />
                </div>
            </div>

            {/* ─── Quick tips ─── */}
            <details className="group">
                <summary className="text-[9px] text-white/30 cursor-pointer hover:text-white/50 transition-colors flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Tips rápidos de voicings en Strudel
                </summary>
                <div className="mt-2 space-y-1.5 text-[9px] text-white/40 leading-relaxed pl-3 border-l border-white/10">
                    <p><code className="text-cyan-300/70">.voicing()</code> — genera voicing automático con voice-leading suave</p>
                    <p><code className="text-cyan-300/70">.dict('lefthand')</code> — cambia diccionario de voicing</p>
                    <p><code className="text-cyan-300/70">n("0 1 2 3").chord("C^7").voicing()</code> — arpegiar notas del voicing</p>
                    <p><code className="text-cyan-300/70">.anchor("c5")</code> — anclar voicing a una nota específica</p>
                    <p><code className="text-cyan-300/70">.mode("below")</code> — voicing debajo del ancla (below|above|duck)</p>
                    <p><code className="text-cyan-300/70">.offset(1)</code> — mover al siguiente voicing arriba/abajo</p>
                    <p className="pt-1 border-t border-white/5"><strong className="text-orange-300/70">Drop voicings:</strong> toman un acorde en posición cerrada y bajan notas específicas una octava. Drop 2 es el más usado en jazz guitar/piano.</p>
                </div>
            </details>
        </div>
    );
}
