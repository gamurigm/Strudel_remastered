/*
Repl.jsx - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://codeberg.org/uzu/strudel/src/branch/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { code2hash, getPerformanceTimeSeconds, logger, silence } from '@strudel/core';
import { getDrawContext } from '@strudel/draw';
import { transpiler } from '@strudel/transpiler';
import {
  getAudioContextCurrentTime,
  webaudioOutput,
  resetGlobalEffects,
  resetLoadedSounds,
  initAudioOnFirstClick,
  resetDefaults,
} from '@strudel/webaudio';
import { setVersionDefaultsFrom } from './util.mjs';
import { StrudelMirror, defaultSettings } from '@strudel/codemirror';
import { clearHydra } from '@strudel/hydra';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseBoolean, settingsMap, useSettings } from '../settings.mjs';
import {
  setActivePattern,
  setLatestCode,
  createPatternID,
  userPattern,
  getViewingPatternData,
  setViewingPatternData,
} from '../user_pattern_utils.mjs';
import { superdirtOutput } from '@strudel/osc/superdirtoutput';
import { audioEngineTargets } from '../settings.mjs';
import { useStore } from '@nanostores/react';
import { prebake } from './prebake.mjs';
import { getRandomTune, initCode, loadModules, shareCode } from './util.mjs';
import { defaultTune } from './defaultTune.mjs';
import './Repl.css';
import { setInterval, clearInterval } from 'worker-timers';
import { getMetadata } from '../metadata_parser';

const { latestCode, maxPolyphony, audioDeviceName, multiChannelOrbits } = settingsMap.get();
let modulesLoading, presets, drawContext, clearCanvas, audioReady;

if (typeof window !== 'undefined') {
  audioReady = initAudioOnFirstClick({
    maxPolyphony,
    audioDeviceName,
    multiChannelOrbits: parseBoolean(multiChannelOrbits),
  });
    // apply persisted master gain once audio is ready
    audioReady.then(() => {
      try {
        const mg = settingsMap.get().masterGain;
        if (typeof mg !== 'undefined' && mg !== null) {
          // lazy import setMasterGain from webaudio package and apply persisted value
          import('@strudel/webaudio').then((mod) => mod.setMasterGain?.(mg)).catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    });
  modulesLoading = loadModules();
  presets = prebake();
  drawContext = getDrawContext();
  clearCanvas = () => drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
}

async function getModule(name) {
  if (!modulesLoading) {
    return;
  }
  const modules = await modulesLoading;
  return modules.find((m) => m.packageName === name);
}

const initialCode = `// LOADING`;

export function useReplContext(options = {}) {
  const { solo = true, sessionId } = options; // solo=true mantiene comportamiento anterior; en MultiRepl se usará false
  const { isSyncEnabled, audioEngineTarget } = useSettings();
  const shouldUseWebaudio = audioEngineTarget !== audioEngineTargets.osc;
  const defaultOutput = shouldUseWebaudio ? webaudioOutput : superdirtOutput;
  const getTime = shouldUseWebaudio ? getAudioContextCurrentTime : getPerformanceTimeSeconds;

  const init = useCallback(() => {
    const drawTime = [-2, 2];
    const drawContext = getDrawContext();
    const editor = new StrudelMirror({
      sync: isSyncEnabled,
      defaultOutput,
      getTime,
      setInterval,
      clearInterval,
      transpiler,
      autodraw: false,
      root: containerRef.current,
      initialCode,
      pattern: silence,
      drawTime,
      drawContext,
      prebake: async () => Promise.all([modulesLoading, presets]),
      solo,
      onUpdateState: (state) => {
        setReplState({ ...state });
      },
      onToggle: (playing) => {
        if (!playing) {
          clearHydra();
        }
      },
      beforeEval: () => audioReady,
      afterEval: (all) => {
        const { code } = all;
        //post to iframe parent (like Udels) if it exists...
        window.parent?.postMessage(code);

        setLatestCode(code);
        window.location.hash = '#' + code2hash(code);
        setDocumentTitle(code);
        const viewingPatternData = getViewingPatternData();
        setVersionDefaultsFrom(code);
        const data = { ...viewingPatternData, code };
        let id = data.id;
        const isExamplePattern = viewingPatternData.collection !== userPattern.collection;

        if (isExamplePattern) {
          const codeHasChanged = code !== viewingPatternData.code;
          if (codeHasChanged) {
            // fork example
            const newPattern = userPattern.duplicate(data);
            id = newPattern.id;
            setViewingPatternData(newPattern.data);
          }
        } else {
          id = userPattern.isValidID(id) ? id : createPatternID();
          setViewingPatternData(userPattern.update(id, data).data);
        }
        setActivePattern(id);
      },
      bgFill: false,
    });
    window.strudelMirror = editor;

    // Configuración básica del editor y manejo de teclas
    try {
      // Asegurarse que el editor pueda recibir foco
      if (editor.view?.dom) {
        editor.view.dom.setAttribute('tabindex', '0');
      }
      
      // Forzar que el editor tenga foco
      setTimeout(() => { 
        try { 
          editor.view?.focus(); 
          
          // Intentar forzar el comportamiento de Enter directamente en CodeMirror
          if (editor.view) {
            // Eliminar todos los posibles listeners existentes de keydown
            const oldEl = editor.view.dom;
            const newEl = oldEl.cloneNode(true);
            if (oldEl.parentNode) {
              oldEl.parentNode.replaceChild(newEl, oldEl);
              editor.view.dom = newEl;
            }
            
            // Auto-foco cada 2 segundos para mantener el editor enfocado
            setInterval(() => {
              try { editor.view?.focus(); } catch {}
            }, 2000);
          }
        } catch (err) {
          console.warn('Error en foco inicial:', err);
        }
      }, 500);
      
      // Click en cualquier parte del contenedor enfoca el editor
      containerRef.current?.addEventListener('mousedown', (e) => {
        // Prevenir comportamiento por defecto para asegurarnos de que el editor recibe foco
        e.preventDefault();
        try { 
          editor.view?.focus(); 
        } catch {}
      });
    } catch (err) {
      console.warn('Error configurando editor:', err);
    }

    // Inject minimal style to guarantee editor area is clickable & full height
    try {
      if (!document.getElementById('cm-full-height-style')) {
        const st = document.createElement('style');
        st.id = 'cm-full-height-style';
        st.textContent = `.cm-editor{height:100%;} #code{height:100%; position:relative;} .cm-editor .cm-scroller{overscroll-behavior:none;}`;
        document.head.appendChild(st);
      }
    } catch (err) {
      console.warn('Error injecting styles:', err);
    }    // init settings
    initCode().then(async (decoded) => {
      let code, msg;
      if (decoded) {
        code = decoded;
        msg = `I have loaded the code from the URL.`;
      } else if (latestCode) {
        code = latestCode;
        msg = `Your last session has been loaded!`;
        } else {
        /* const { code: randomTune, name } = await getRandomTune();
        code = randomTune; */
        code = defaultTune;
        msg = `Default code has been loaded from defaultTune.mjs`;
      }
      editor.setCode(code);
      setDocumentTitle(code);
      logger(`Welcome to Strudel! ${msg} Press play or hit ctrl+enter to run it!`, 'highlight');
      // Fallback: if after a short delay the editor is still empty, force defaultTune
      setTimeout(() => {
        try {
          if (editorRef.current) {
            const current = editorRef.current.getCode ? editorRef.current.getCode() : editorRef.current.view?.state?.doc?.toString();
            if (!current || !current.trim()) {
              editorRef.current.setCode(defaultTune);
              logger('Loaded fallback defaultTune (previous content was empty)', 'highlight');
            }
          }
        } catch (e) {
          console.warn('Fallback defaultTune load failed', e);
        }
      }, 500);
    });

    editorRef.current = editor;

    // Hot Module Replacement: if defaultTune.mjs changes, update the editor live
    if (import.meta.hot) {
      try {
        import.meta.hot.accept('./defaultTune.mjs', (newModule) => {
          try {
            const newCode = newModule?.defaultTune;
            const isActiveMulti = (!solo) && (typeof window !== 'undefined') && (window.__strudelActiveSessionId === sessionId);
            const shouldAffectThis = solo || isActiveMulti;
            if (newCode && editorRef.current && shouldAffectThis) {
              // Update editor content and, if allowed, auto-evaluate
              editorRef.current.setCode(newCode);
              try { editorRef.current.evaluate(); } catch (e) { console.warn('Auto-evaluate failed after HMR:', e); }
            }
          } catch (err) {
            console.error('Error handling defaultTune HMR update', err);
          }
        });
      } catch (err) {
        // some environments may not support module-specific accept; fallback silently
        console.debug('HMR accept for defaultTune.mjs not available', err);
      }
    }
  }, []);

  const [replState, setReplState] = useState({});
  const { started, isDirty, error, activeCode, pending } = replState;
  const editorRef = useRef();
  const containerRef = useRef();

  // this can be simplified once SettingsTab has been refactored to change codemirrorSettings directly!
  // this will be the case when the main repl is being replaced
  const _settings = useStore(settingsMap, { keys: Object.keys(defaultSettings) });
  useEffect(() => {
    let editorSettings = {};
    Object.keys(defaultSettings).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(_settings, key)) {
        editorSettings[key] = _settings[key];
      }
    });
    editorRef.current?.updateSettings(editorSettings);
  }, [_settings]);

  //
  // UI Actions
  //

  const setDocumentTitle = (code) => {
    const meta = getMetadata(code);
    document.title = (meta.title ? `${meta.title} - ` : '') + 'Strudel REPL';
  };

  const handleTogglePlay = async () => {
    editorRef.current?.toggle();
  };

  const resetEditor = async () => {
    (await getModule('@strudel/tonal'))?.resetVoicings();
    resetDefaults();
    resetGlobalEffects();
    clearCanvas();
    clearHydra();
    resetLoadedSounds();
    editorRef.current.repl.setCps(0.5);
    await prebake(); // declare default samples
  };

  const handleUpdate = async (patternData, reset = false) => {
    setViewingPatternData(patternData);
    editorRef.current.setCode(patternData.code);
    if (reset) {
      await resetEditor();
      handleEvaluate();
    }
  };

  const handleEvaluate = () => {
    editorRef.current.evaluate();
  };
  const handleShuffle = async () => {
    const patternData = await getRandomTune();
    const code = patternData.code;
    logger(`[repl] ✨ loading random tune "${patternData.id}"`);
    setActivePattern(patternData.id);
    setViewingPatternData(patternData);
    await resetEditor();
    editorRef.current.setCode(code);
    editorRef.current.repl.evaluate(code);
  };

  const handleShare = async () => shareCode(replState.code);
  const context = {
    started,
    pending,
    isDirty,
    activeCode,
  solo,
    handleTogglePlay,
    handleUpdate,
    handleShuffle,
    handleShare,
    handleEvaluate,
    init,
    error,
    editorRef,
    containerRef,
  };
  return context;
}
