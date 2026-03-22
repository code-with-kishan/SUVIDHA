const speechLocaleByLanguage = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',
  ne: 'ne-NP',
  ks: 'ur-IN',
  doi: 'hi-IN'
};

let speechRequestId = 0;
let activeRecognition = null;
let lastUtteranceEndTime = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getSpeechLocale = (language) => speechLocaleByLanguage[language] || 'en-IN';

export const normalizeTranscript = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const splitText = (text, maxLen = 165) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const segments = normalized.split(/(?<=[.!?।])\s+/);
  const chunks = [];
  let current = '';

  for (const segment of segments) {
    const candidate = current ? `${current} ${segment}` : segment;
    if (candidate.length <= maxLen) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);
    if (segment.length <= maxLen) {
      current = segment;
    } else {
      for (let index = 0; index < segment.length; index += maxLen) {
        chunks.push(segment.slice(index, index + maxLen));
      }
      current = '';
    }
  }

  if (current) chunks.push(current);
  return chunks;
};

const waitForVoices = async (synth, timeoutMs = 2200) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const voices = synth.getVoices() || [];
    if (voices.length) return voices;
    await wait(120);
  }
  return synth.getVoices() || [];
};

const getVoiceCandidates = (voices, locale) => {
  if (!voices?.length) return [null];
  const baseLocale = locale?.split('-')[0] || 'en';

  const priority = [
    ...voices.filter((voice) => voice.lang === locale),
    ...voices.filter((voice) => voice.lang?.startsWith(baseLocale)),
    ...voices.filter((voice) => voice.default),
    ...voices.filter((voice) => voice.lang?.startsWith('en')),
    ...voices
  ];

  const seen = new Set();
  const unique = [];
  for (const voice of priority) {
    const key = `${voice.name}|${voice.lang}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(voice);
  }
  return unique.length ? unique : [null];
};

const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isVoiceOutputSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis);
};

export const isVoiceCommandSupported = () => Boolean(getSpeechRecognitionCtor());

export const stopVoiceAssistant = () => {
  // Increment requestId to signal any pending operations to stop
  // DO NOT call cancel() - it corrupts the audio context
  speechRequestId += 1;
};

export const stopVoiceCommandListener = () => {
  if (!activeRecognition) return;
  try {
    activeRecognition.onresult = null;
    activeRecognition.onerror = null;
    activeRecognition.onend = null;
    activeRecognition.onstart = null;
    activeRecognition.stop();
  } catch (_error) {
    // ignored
  }
  activeRecognition = null;
};

const speakChunk = ({ synth, chunk, voice, locale, volume, requestId, onStatus }) =>
  new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    if (locale) utterance.lang = locale;
    if (voice) {
      utterance.voice = voice;
      if (voice.lang) utterance.lang = voice.lang;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = volume;

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      // Clean up listeners to avoid memory leaks
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      resolve(result);
    };

    const watchdog = setTimeout(() => {
      finish(false);
    }, 12000);

    utterance.onstart = () => {
      if (speechRequestId !== requestId) {
        clearTimeout(watchdog);
        finish(false);
        return;
      }
      onStatus?.('speaking');
    };

    utterance.onend = () => {
      clearTimeout(watchdog);
      lastUtteranceEndTime = Date.now();
      finish(true);
    };

    utterance.onerror = (event) => {
      clearTimeout(watchdog);
      lastUtteranceEndTime = Date.now();
      // If this request is no longer active, pretend it succeeded
      if (speechRequestId !== requestId) {
        finish(true);
        return;
      }
      const errorType = String(event?.error || '').toLowerCase();
      // Treat interruptions/cancellations as success since the audio system is unstable
      // and we may have silently cancelled it to start a new utterance
      if (
        errorType === 'interrupted' ||
        errorType === 'canceled' ||
        errorType === 'cancelled' ||
        errorType === 'network'
      ) {
        finish(true);
        return;
      }
      // For real errors, fail
      finish(false);
    };

    try {
      synth.speak(utterance);
    } catch (_error) {
      clearTimeout(watchdog);
      finish(false);
    }
  });

const runSpeechPlayback = async ({ text, language, volume, onStatus, requestId }) => {
  if (!isVoiceOutputSupported()) {
    onStatus?.('unsupported');
    return false;
  }

  const synth = window.speechSynthesis;
  const locale = getSpeechLocale(language);
  const chunks = splitText(text);
  if (!chunks.length) {
    onStatus?.('ready');
    return true;
  }

  const voices = await waitForVoices(synth);
  const candidates = getVoiceCandidates(voices, locale);

  for (const voice of candidates) {
    if (speechRequestId !== requestId) return false;
    
    // Wait for any pending utterances to completely finish
    let safetyCount = 0;
    while (synth.pending && safetyCount < 100) {
      await wait(50);
      safetyCount += 1;
    }
    
    // Also wait for time since last utterance ended to ensure audio context is truly reset
    const timeSinceLastEnd = Date.now() - lastUtteranceEndTime;
    if (timeSinceLastEnd < 400) {
      await wait(400 - timeSinceLastEnd);
    }
    
    // Short pause to let audio system stabilize
    await wait(100);
    
    // Only proceed if still active
    if (speechRequestId !== requestId) return false;

    let allOk = true;
    for (const chunk of chunks) {
      if (speechRequestId !== requestId) return false;
      const ok = await speakChunk({
        synth,
        chunk,
        voice,
        locale,
        volume,
        requestId,
        onStatus
      });
      if (!ok) {
        allOk = false;
        break;
      }
      await wait(50);
    }

    if (allOk) {
      onStatus?.('ready');
      return true;
    }
    
    // If voice failed, longer pause before trying next voice
    await wait(500);
  }

  onStatus?.('error');
  return false;
};

export const speakWithVoiceAssistant = async ({
  text,
  language,
  volume = 1,
  onStatus,
  userInitiated = false,
  skipQuickStart = false
}) => {
  stopVoiceAssistant();
  const requestId = speechRequestId;
  onStatus?.('starting');

  if (userInitiated && !skipQuickStart && isVoiceOutputSupported()) {
    try {
      const synth = window.speechSynthesis;
      
      // Wait for audio system to be fully ready
      let safetyCount = 0;
      while (synth.pending && safetyCount < 50) {
        await wait(50);
        safetyCount += 1;
      }
      
      // Wait for time since last utterance ended
      const timeSinceLastEnd = Date.now() - lastUtteranceEndTime;
      if (timeSinceLastEnd < 400) {
        await wait(400 - timeSinceLastEnd);
      }
      
      await wait(150);
      
      const locale = getSpeechLocale(language);
      const firstChunk = splitText(text, 120)[0] || text;
      const voices = synth.getVoices() || [];
      const quickVoice = getVoiceCandidates(voices, locale)[0];
      const quickUtterance = new SpeechSynthesisUtterance(firstChunk);
      if (quickVoice) {
        quickUtterance.voice = quickVoice;
        quickUtterance.lang = quickVoice.lang || locale;
      } else {
        quickUtterance.lang = locale;
      }
      quickUtterance.volume = volume;
      quickUtterance.rate = 1;
      quickUtterance.pitch = 1;

      const quickStartOk = await new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          // Clean up listeners
          quickUtterance.onstart = null;
          quickUtterance.onend = null;
          quickUtterance.onerror = null;
          resolve(value);
        };

        const quickWatchdog = setTimeout(() => {
          finish(false);
        }, 1800);

        quickUtterance.onstart = () => {
          clearTimeout(quickWatchdog);
          onStatus?.('speaking');
          finish(true);
        };
        quickUtterance.onend = () => {
          clearTimeout(quickWatchdog);
          lastUtteranceEndTime = Date.now();
          onStatus?.('ready');
        };
        quickUtterance.onerror = (event) => {
          clearTimeout(quickWatchdog);
          lastUtteranceEndTime = Date.now();
          const errorType = String(event?.error || '').toLowerCase();
          // Treat common interruptions as success; we may have silently cancelled it
          if (
            errorType === 'interrupted' ||
            errorType === 'canceled' ||
            errorType === 'cancelled' ||
            errorType === 'network'
          ) {
            finish(true);
            return;
          }
          finish(false);
        };

        try {
          synth.speak(quickUtterance);
        } catch (_e) {
          finish(false);
        }
      });

      if (quickStartOk) {
        return true;
      }
    } catch (_error) {
      // continue to robust path
    }
  }

  return runSpeechPlayback({
    text,
    language,
    volume,
    onStatus,
    requestId
  });
};

export const startVoiceCommandListener = ({ language, onTranscript, onError, onStatus }) => {
  const RecognitionCtor = getSpeechRecognitionCtor();
  if (!RecognitionCtor) {
    onError?.('Voice commands not supported in this browser.');
    return false;
  }

  stopVoiceCommandListener();
  const recognition = new RecognitionCtor();
  recognition.lang = getSpeechLocale(language);
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    onStatus?.('listening');
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    onTranscript?.(normalizeTranscript(transcript));
  };

  recognition.onerror = (event) => {
    const message = event?.error ? `Voice command error: ${event.error}` : 'Voice command failed.';
    onError?.(message);
    onStatus?.('idle');
  };

  recognition.onend = () => {
    onStatus?.('idle');
    activeRecognition = null;
  };

  activeRecognition = recognition;
  try {
    onStatus?.('starting');
    recognition.start();
    return true;
  } catch (_error) {
    activeRecognition = null;
    onStatus?.('idle');
    onError?.('Unable to start voice command listener.');
    return false;
  }
};
