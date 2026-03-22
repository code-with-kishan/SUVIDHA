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
let speechQueue = Promise.resolve();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getSpeechLocale = (language) => speechLocaleByLanguage[language] || 'en-IN';

export const normalizeTranscript = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const splitText = (text, maxLen = 180) => {
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
      continue;
    }

    for (let index = 0; index < segment.length; index += maxLen) {
      chunks.push(segment.slice(index, index + maxLen));
    }
    current = '';
  }

  if (current) chunks.push(current);
  return chunks;
};

const waitForVoices = async (synth, timeoutMs = 1500) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const voices = synth.getVoices() || [];
    if (voices.length) return voices;
    await wait(100);
  }
  return synth.getVoices() || [];
};

const pickVoice = (voices, locale) => {
  if (!voices?.length) return null;
  const baseLocale = locale?.split('-')[0] || 'en';
  return (
    voices.find((voice) => voice.lang === locale) ||
    voices.find((voice) => voice.lang?.startsWith(baseLocale)) ||
    voices.find((voice) => voice.default) ||
    voices.find((voice) => voice.lang?.startsWith('en')) ||
    voices[0] ||
    null
  );
};

const getSpeechRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isVoiceOutputSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
};

export const isVoiceCommandSupported = () => Boolean(getSpeechRecognitionCtor());

const enqueueSpeech = (task) => {
  speechQueue = speechQueue.then(task, task);
  return speechQueue;
};

const waitForSynthesisIdle = async (synth, maxMs = 1400) => {
  const start = Date.now();
  while ((synth.speaking || synth.pending) && Date.now() - start < maxMs) {
    await wait(40);
  }
  return !(synth.speaking || synth.pending);
};

const speakOneChunk = ({ synth, chunk, voice, locale, volume, requestId, onStatus }) =>
  new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = voice?.lang || locale;
    utterance.voice = voice || null;
    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.volume = volume;

    let settled = false;
    let started = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      resolve(result);
    };

    const watchdog = setTimeout(() => {
      // Some browsers never emit onstart/onend after interruptions.
      finish(started);
    }, 9000);

    utterance.onstart = () => {
      started = true;
      if (speechRequestId !== requestId) {
        clearTimeout(watchdog);
        finish(true);
        return;
      }
      onStatus?.('speaking');
    };

    utterance.onend = () => {
      clearTimeout(watchdog);
      finish(true);
    };

    utterance.onerror = (event) => {
      clearTimeout(watchdog);
      if (speechRequestId !== requestId) {
        finish(true);
        return;
      }
      const errorType = String(event?.error || '').toLowerCase();
      if (errorType === 'interrupted' || errorType === 'canceled' || errorType === 'cancelled') {
        finish(true);
        return;
      }
      finish(false);
    };

    try {
      synth.speak(utterance);
    } catch (_error) {
      clearTimeout(watchdog);
      finish(false);
    }
  });

export const stopVoiceAssistant = () => {
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

const runSpeechPlayback = async ({ text, language, volume, onStatus, requestId }) => {
  if (!isVoiceOutputSupported()) {
    onStatus?.('unsupported');
    return false;
  }

  const chunks = splitText(text);
  if (!chunks.length) {
    onStatus?.('ready');
    return true;
  }

  const synth = window.speechSynthesis;
  const locale = getSpeechLocale(language);

  try {
    // Some browsers keep synthesis paused after media interruptions.
    synth.resume?.();
  } catch (_error) {
    // ignore
  }

  let isIdle = await waitForSynthesisIdle(synth);
  if (!isIdle) {
    // Hard recovery if browser keeps stale utterances forever.
    try {
      synth.cancel();
    } catch (_error) {
      // ignore
    }
    await wait(120);
    isIdle = await waitForSynthesisIdle(synth, 600);
  }

  if (!isIdle) {
    onStatus?.('error');
    return false;
  }

  if (speechRequestId !== requestId) {
    onStatus?.('ready');
    return true;
  }

  const voices = await waitForVoices(synth);
  const selectedVoice = pickVoice(voices, locale);
  const fallbackVoice = pickVoice(voices, 'en-IN');

  for (let index = 0; index < chunks.length; index += 1) {
    if (speechRequestId !== requestId) {
      onStatus?.('ready');
      return true;
    }

    const chunk = chunks[index];
    let ok = await speakOneChunk({
      synth,
      chunk,
      voice: selectedVoice,
      locale,
      volume,
      requestId,
      onStatus
    });

    if (!ok && fallbackVoice && fallbackVoice !== selectedVoice) {
      await wait(120);
      ok = await speakOneChunk({
        synth,
        chunk,
        voice: fallbackVoice,
        locale,
        volume,
        requestId,
        onStatus
      });
    }

    if (!ok) {
      // Final fallback without explicit voice assignment.
      await wait(120);
      ok = await speakOneChunk({
        synth,
        chunk,
        voice: null,
        locale,
        volume,
        requestId,
        onStatus
      });
    }

    if (!ok) {
      onStatus?.('error');
      return false;
    }

    if (index < chunks.length - 1) {
      await wait(50);
    }
  }

  onStatus?.('ready');
  return true;
};

export const speakWithVoiceAssistant = async ({
  text,
  language,
  volume = 1,
  onStatus,
  userInitiated = false,
  skipQuickStart = false
}) => {
  const _useQuickStart = userInitiated && !skipQuickStart;
  void _useQuickStart;

  const requestId = ++speechRequestId;
  onStatus?.('starting');

  return enqueueSpeech(async () => {
    if (speechRequestId !== requestId) return true;
    const safeVolume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
    return runSpeechPlayback({
      text,
      language,
      volume: safeVolume,
      onStatus,
      requestId
    });
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
