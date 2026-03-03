import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getOfflineQueueSize, syncOfflineQueue } from '../services/offlineSync';
import {
  isVoiceCommandSupported,
  isVoiceOutputSupported,
  normalizeTranscript,
  speakWithVoiceAssistant,
  startVoiceCommandListener,
  stopVoiceAssistant,
  stopVoiceCommandListener
} from '../services/voiceAssistant';
import {
  logout,
  setAudioGuidance,
  setAudioVolume,
  setFontScale,
  setHeadphoneMode,
  setHighContrast
} from '../redux/store';
import LanguageToggle from './LanguageToggle';
import OfflineAssistantWidget from './OfflineAssistantWidget';

const IDLE_TIMEOUT_MS = 45 * 1000;
const AUTO_RESET_SECONDS = 10;

const conversationalReplies = {
  en: {
    greeting: 'Hello. I am your Suvidha voice assistant. You can say login page, dashboard, services, complaints, payment, or tracking.',
    howAreYou: 'I am ready to help you. Please tell me what you want to do.',
    whoAreYou: 'I am Suvidha kiosk assistant. I can navigate pages and help fill details by voice.',
    thanks: 'You are welcome. I am always ready to help.',
    unknown: 'I did not understand that. You can say login page, dashboard, services, complaints, payment, tracking, or help.'
  },
  hi: {
    greeting: 'नमस्ते। मैं आपका सुविधा वॉइस असिस्टेंट हूँ। आप लॉगिन पेज, डैशबोर्ड, सेवाएँ, शिकायत, भुगतान या ट्रैकिंग बोल सकते हैं।',
    howAreYou: 'मैं आपकी मदद के लिए तैयार हूँ। कृपया बताइए आपको क्या करना है।',
    whoAreYou: 'मैं सुविधा कियोस्क असिस्टेंट हूँ। मैं आवाज़ से पेज खोलने और जानकारी भरने में मदद करता हूँ।',
    thanks: 'धन्यवाद। मैं हमेशा आपकी मदद के लिए तैयार हूँ।',
    unknown: 'मैं समझ नहीं पाया। आप लॉगिन पेज, डैशबोर्ड, सेवाएँ, शिकायत, भुगतान, ट्रैकिंग या हेल्प बोल सकते हैं।'
  }
};

const getReplyPack = (language) => conversationalReplies[language] || conversationalReplies.en;

export default function Layout({ children, title }) {
  const headerLogoSrc = '/branding/suvidha-header-logo.png';
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { highContrast, fontScale, audioGuidance, audioVolume, headphoneMode, language } = useSelector(
    (state) => state.ui
  );
  const idleTimerRef = useRef(null);
  const autoResetRef = useRef(null);
  const lastAutoGuideKeyRef = useRef('');
  const pendingAutoGuideRef = useRef('');
  const pendingVoiceFieldRef = useRef(null);
  const pendingRouteVoiceFlowRef = useRef(null);
  const suppressAutoGuideOnceRef = useRef(false);
  const [isIdle, setIsIdle] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_RESET_SECONDS);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(isVoiceOutputSupported());
  const [voiceCommandSupported, setVoiceCommandSupported] = useState(isVoiceCommandSupported());
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState('');
  const [showAssistControls, setShowAssistControls] = useState(false);
  const [uiNotice, setUiNotice] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [isHeaderLogoMissing, setIsHeaderLogoMissing] = useState(false);

  const getVoiceGuideTextForPath = useCallback(
    (path) => {
    if (path === '/dashboard') return t('voiceGuideDashboard');
    if (path.startsWith('/services')) return t('voiceGuideServices');
    if (path.startsWith('/complaints')) return t('voiceGuideComplaints');
    if (path.startsWith('/payment')) return t('voiceGuidePayment');
    if (path.startsWith('/status-tracking')) return t('voiceGuideTracking');
    if (path === '/login') return t('voiceGuideLogin');
    if (path.startsWith('/admin')) return t('voiceGuideAdmin');
    return t('voiceGuideGeneric');
    },
    [t]
  );

  const getVoiceGuideText = useCallback(() => getVoiceGuideTextForPath(location.pathname), [getVoiceGuideTextForPath, location.pathname]);


  const showNotice = useCallback((text) => {
    setUiNotice(text);
    setTimeout(() => {
      setUiNotice('');
    }, 2600);
  }, []);

  const speakAssistant = useCallback(
    async (message, userInitiated = false) => {
      const effectiveVolume = Math.min(1, Math.max(0, headphoneMode ? audioVolume + 0.1 : audioVolume));
      const ok = await speakWithVoiceAssistant({
        text: message,
        language,
        volume: effectiveVolume,
        onStatus: setVoiceStatus,
        userInitiated
      });

      if (!ok) {
        setVoiceStatus('ready');
        if (userInitiated) {
          showNotice('Voice playback was interrupted. Please try again.');
        }
      }

      return ok;
    },
    [audioVolume, headphoneMode, language, showNotice]
  );

  const speakFromUserAction = useCallback(() => {
    if (!audioGuidance) {
      showNotice('Turn on Audio Guidance first.');
      return;
    }
    speakAssistant(`${title || t('appTitle')}. ${getVoiceGuideText()}`, true);
  }, [audioGuidance, getVoiceGuideText, showNotice, speakAssistant, t, title]);

  const emitVoiceFieldFill = useCallback((field, value, source = 'voice') => {
    const payload = {
      field,
      value,
      source,
      language,
      path: location.pathname,
      timestamp: Date.now()
    };
    window.dispatchEvent(new CustomEvent('suvidha:voice-fill', { detail: payload }));
  }, [language, location.pathname]);

  const startVoiceFieldCapture = useCallback(
    ({ field, prompt, source = 'voice', attempt = 0 }) => {
      if (!voiceCommandSupported) {
        showNotice('Voice input is not supported in this browser.');
        return;
      }

      pendingVoiceFieldRef.current = { field, prompt, source, attempt };
      const isLoginFlow = String(source || '').startsWith('login-');
      const maxAttempts = isLoginFlow ? 5 : 2;

      const isLikelyPromptEcho = (transcript, promptText) => {
        const spoken = normalizeTranscript(transcript);
        const promptNormalized = normalizeTranscript(promptText);
        if (!spoken || !promptNormalized) return false;
        if (spoken === promptNormalized) return true;
        if (spoken.includes(promptNormalized) || promptNormalized.includes(spoken)) return true;
        return /(please say|कृपया|say your|अपना)/.test(spoken);
      };

      const startListening = () => {
        stopVoiceAssistant();
        const started = startVoiceCommandListener({
          language,
          onStatus: (status) => {
            setIsVoiceListening(status === 'listening');
          },
          onTranscript: (transcript) => {
            setIsVoiceListening(false);
            const normalized = normalizeTranscript(transcript);
            if (!normalized) {
              const capture = pendingVoiceFieldRef.current;
              if (!capture) return;
              const nextAttempt = Number(capture.attempt || 0) + 1;
              if (String(capture.source || '').startsWith('login-') && nextAttempt <= maxAttempts) {
                showNotice(`No voice input detected for ${capture.field}. Retrying...`);
                startVoiceFieldCapture({
                  field: capture.field,
                  prompt: capture.prompt,
                  source: capture.source,
                  attempt: nextAttempt
                });
                return;
              }
              showNotice('No voice input detected for the field.');
              return;
            }
            const capture = pendingVoiceFieldRef.current;
            if (!capture) return;

            const isCaptureLoginFlow = String(capture.source || '').startsWith('login-');
            if (isCaptureLoginFlow && isLikelyPromptEcho(transcript, capture.prompt || '')) {
              showNotice('Heard assistant prompt. Please speak your response now.');
              setTimeout(startListening, 220);
              return;
            }

            emitVoiceFieldFill(capture.field, transcript, capture.source);
            pendingVoiceFieldRef.current = null;
            if (audioGuidance && !isCaptureLoginFlow) {
              const replyPack = getReplyPack(language);
              speakAssistant(`Received ${capture.field}. ${replyPack.thanks}`, true);
            }
            showNotice(`${field} captured from voice.`);
          },
          onError: (message) => {
            setIsVoiceListening(false);
            const capture = pendingVoiceFieldRef.current;
            const nextAttempt = Number(capture?.attempt || 0) + 1;
            if (capture && String(capture.source || '').startsWith('login-') && nextAttempt <= maxAttempts) {
              showNotice('Voice input issue detected. Re-asking current step...');
              startVoiceFieldCapture({
                field: capture.field,
                prompt: capture.prompt,
                source: capture.source,
                attempt: nextAttempt
              });
              return;
            }
            showNotice(message || 'Voice field input failed.');
          }
        });

        if (!started) {
          setIsVoiceListening(false);
          showNotice('Could not start voice field input.');
        }
      };

      const runCapture = async () => {
        if (prompt && isLoginFlow) {
          const effectiveVolume = Math.min(1, Math.max(0, headphoneMode ? audioVolume + 0.1 : audioVolume));
          const spoke = await speakWithVoiceAssistant({
            text: prompt,
            language,
            volume: effectiveVolume,
            onStatus: setVoiceStatus,
            userInitiated: true,
            skipQuickStart: true
          });

          if (!spoke && attempt < maxAttempts) {
            showNotice('Prompt audio did not play. Retrying prompt...');
            await speakWithVoiceAssistant({
              text: prompt,
              language,
              volume: effectiveVolume,
              onStatus: setVoiceStatus,
              userInitiated: true,
              skipQuickStart: true
            });
          }

          setTimeout(startListening, 420);
          return;
        }

        if (audioGuidance && prompt) {
          speakAssistant(prompt, true);
          setTimeout(startListening, 850);
          return;
        }

        setTimeout(startListening, 60);
      };

      runCapture();
    },
    [
      audioGuidance,
      audioVolume,
      emitVoiceFieldFill,
      headphoneMode,
      language,
      showNotice,
      speakAssistant,
      voiceCommandSupported
    ]
  );

  const citizenNav = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Services', to: '/services' },
    { label: 'Complaints', to: '/complaints' },
    { label: 'Documents', to: '/upload-documents' },
    { label: 'Payment', to: '/payment' },
    { label: 'Tracking', to: '/status-tracking' }
  ];

  const adminNav = [
    { label: 'Admin Dashboard', to: '/admin/dashboard' },
    { label: 'Requests', to: '/admin/requests' },
    { label: 'Complaints', to: '/admin/complaints' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Reports', to: '/admin/reports' }
  ];

  const guestNav = [
    { label: 'Home', to: '/' },
    { label: 'Language', to: '/language' },
    { label: 'Guest Dashboard', to: '/dashboard' },
    { label: 'Citizen Login', to: '/login' },
    { label: 'Admin Login', to: '/admin' }
  ];

  const navItems = user
    ? ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
      ? adminNav
      : citizenNav
    : guestNav;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const resetForNewUser = () => {
    stopVoiceAssistant();
    dispatch(logout());
    sessionStorage.clear();
    showNotice('Session reset for new user.');
    navigate('/', { replace: true });
    setTimeout(() => {
      window.location.reload();
    }, 120);
  };

  const restartIdleTimer = useCallback(() => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (autoResetRef.current) clearInterval(autoResetRef.current);
      setIsIdle(false);
      setCountdown(AUTO_RESET_SECONDS);

      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
        let remaining = AUTO_RESET_SECONDS;
        autoResetRef.current = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(autoResetRef.current);
            resetForNewUser();
          }
        }, 1000);
      }, IDLE_TIMEOUT_MS);
    }, [dispatch, navigate]);

  useEffect(() => {
    restartIdleTimer();
    const events = ['click', 'touchstart', 'mousemove', 'keydown'];
    const activityHandler = () => restartIdleTimer();

    events.forEach((eventName) => window.addEventListener(eventName, activityHandler));
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, activityHandler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (autoResetRef.current) clearInterval(autoResetRef.current);
    };
  }, [restartIdleTimer]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
    document.body.classList.toggle('high-contrast', highContrast);
  }, [fontScale, highContrast]);

  useEffect(() => {
    const outputSupported = isVoiceOutputSupported();
    const commandSupported = isVoiceCommandSupported();
    setVoiceSupported(outputSupported);
    setVoiceCommandSupported(commandSupported);
    if (!outputSupported) setVoiceStatus('unsupported');

    return () => {
      stopVoiceCommandListener();
    };
  }, []);

  useEffect(() => {
    if (!audioGuidance) return;

    if (suppressAutoGuideOnceRef.current) {
      suppressAutoGuideOnceRef.current = false;
      return;
    }

    const routeKey = `${location.pathname}|${location.key || ''}|${title || ''}|${language}`;
    if (lastAutoGuideKeyRef.current === routeKey) return;
      stopVoiceAssistant();

    const timer = setTimeout(() => {
      lastAutoGuideKeyRef.current = routeKey;
      const heading = title || t('appTitle');
      const guide = getVoiceGuideText();
      const message = `${heading}. ${guide}`;
      speakAssistant(message).then((ok) => {
        pendingAutoGuideRef.current = ok ? '' : message;
      });
    }, 140);

    return () => {
      clearTimeout(timer);
    };
  }, [audioGuidance, getVoiceGuideText, language, location.key, location.pathname, speakAssistant, t, title]);

  useEffect(() => {
    const flow = pendingRouteVoiceFlowRef.current;
    if (!flow) return;
    if (flow.type !== 'login-name-flow') return;
    if (location.pathname !== '/login') return;

    const timer = setTimeout(() => {
      startVoiceFieldCapture({
        field: 'name',
        prompt:
          language === 'hi'
            ? 'कृपया अपना पूरा नाम बोलिए।'
            : 'Please say your full name after the beep. I will fill it in login form.',
        source: 'login-name-flow'
      });
      pendingRouteVoiceFlowRef.current = null;
    }, 260);

    return () => clearTimeout(timer);
  }, [language, location.pathname, startVoiceFieldCapture]);

  useEffect(() => {
    if (!audioGuidance) return;

    const replayPendingGuide = () => {
      if (!pendingAutoGuideRef.current) return;
      const pendingMessage = pendingAutoGuideRef.current;
      pendingAutoGuideRef.current = '';
      speakAssistant(pendingMessage, true).then((ok) => {
        if (!ok) {
          pendingAutoGuideRef.current = pendingMessage;
        }
      });
    };

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach((eventName) => window.addEventListener(eventName, replayPendingGuide));
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, replayPendingGuide));
    };
  }, [audioGuidance, speakAssistant]);

  useEffect(() => {
    const onVoiceCaptureRequest = (event) => {
      const payload = event?.detail || {};
      if (!payload.field || typeof payload.field !== 'string') return;
      startVoiceFieldCapture({
        field: payload.field,
        prompt: payload.prompt,
        source: payload.source || 'voice'
      });
    };

    window.addEventListener('suvidha:voice-capture-request', onVoiceCaptureRequest);
    return () => {
      window.removeEventListener('suvidha:voice-capture-request', onVoiceCaptureRequest);
    };
  }, [startVoiceFieldCapture]);

  useEffect(() => {
    const syncQueueSize = async () => {
      const size = await getOfflineQueueSize();
      setQueueSize(size);
    };

    syncQueueSize();

    const onConnectivityChange = () => {
      setIsOnline(navigator.onLine);
      syncQueueSize();
    };

    window.addEventListener('online', onConnectivityChange);
    window.addEventListener('offline', onConnectivityChange);

    const interval = setInterval(() => {
      syncQueueSize();
    }, 5000);

    return () => {
      window.removeEventListener('online', onConnectivityChange);
      window.removeEventListener('offline', onConnectivityChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const kioskId = import.meta.env.VITE_KIOSK_ID;
    const kioskKey = import.meta.env.VITE_KIOSK_KEY;
    if (!kioskId || !kioskKey) return;

    const sendHeartbeat = async () => {
      try {
        await api.post(
          '/api/health/kiosk-heartbeat',
          {
            online: navigator.onLine,
            health: 'OK',
            appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0'
          },
          {
            headers: {
              'x-kiosk-id': kioskId,
              'x-kiosk-key': kioskKey
            }
          }
        );
      } catch (_error) {
        // no-op for local dev if device auth is not configured
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, []);

  const enterFullscreen = async () => {
    try {
      if (!document.documentElement.requestFullscreen) {
        showNotice('Fullscreen is not supported in this browser.');
        return;
      }

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        showNotice('Fullscreen enabled.');
      } else {
        await document.exitFullscreen();
        showNotice('Fullscreen exited.');
      }
    } catch (_error) {
      showNotice('Unable to change fullscreen mode.');
    }
  };

  const toggleContrast = () => {
    const next = !highContrast;
    dispatch(setHighContrast(next));
    showNotice(next ? 'High contrast enabled.' : 'High contrast disabled.');
  };

  const enableAudioGuidance = useCallback(() => {
    if (!voiceSupported) {
      showNotice('Voice guidance is not supported in this browser.');
      return;
    }

    const restoredVolume = audioVolume > 0 ? audioVolume : 0.75;
    if (audioVolume <= 0) {
      dispatch(setAudioVolume(restoredVolume));
    }

    lastAutoGuideKeyRef.current = '';
    pendingAutoGuideRef.current = '';
    dispatch(setAudioGuidance(true));
    showNotice('Voice guidance enabled.');

    const heading = title || t('appTitle');
    const guide = getVoiceGuideTextForPath(location.pathname);
    const message = `${heading}. ${guide}`;
    speakWithVoiceAssistant({
      text: message,
      language,
      volume: Math.min(1, Math.max(0.35, headphoneMode ? restoredVolume + 0.1 : restoredVolume)),
      onStatus: setVoiceStatus,
      userInitiated: true,
      skipQuickStart: true
    }).then((ok) => {
      if (!ok) {
        pendingAutoGuideRef.current = message;
      }
    });
  }, [
    audioVolume,
    dispatch,
    getVoiceGuideTextForPath,
    headphoneMode,
    language,
    location.pathname,
    showNotice,
    t,
    title,
    voiceSupported
  ]);

  const disableAudioGuidance = useCallback(() => {
    lastAutoGuideKeyRef.current = '';
    pendingAutoGuideRef.current = '';
    stopVoiceAssistant();
    dispatch(setAudioGuidance(false));
    setVoiceStatus('idle');
    showNotice('Voice guidance disabled.');
  }, [dispatch, showNotice]);

  const flushOfflineQueue = async () => {
    try {
      await syncOfflineQueue();
      const size = await getOfflineQueueSize();
      setQueueSize(size);
    } catch (_error) {
      // ignored
    }
  };

  const applyVoiceCommand = useCallback(
    async (transcriptValue) => {
      const transcript = normalizeTranscript(transcriptValue);
      setLastVoiceCommand(transcript);

      const replyPack = getReplyPack(language);

      const goTo = (path, label) => {
        navigate(path);
        showNotice(`Opening ${label}.`);
      };

      if (!transcript) {
        showNotice('No voice command detected.');
        return;
      }

      if (/(hello|hi|hey|नमस्ते|नमस्कार|ਸਤ ਸ੍ਰੀ ਅਕਾਲ|السلام)/.test(transcript)) {
        showNotice('Greeting detected.');
        if (audioGuidance) speakAssistant(replyPack.greeting, true);
        return;
      }

      if (/(how are you|कैसे हो|कैसे हैं|तू कसा आहेस|كيف حالك)/.test(transcript)) {
        showNotice('General conversation detected.');
        if (audioGuidance) speakAssistant(replyPack.howAreYou, true);
        return;
      }

      if (/(who are you|what is your name|तुम कौन हो|आप कौन हैं|तुम्हारा नाम|आपका नाम)/.test(transcript)) {
        showNotice('Assistant identity requested.');
        if (audioGuidance) speakAssistant(replyPack.whoAreYou, true);
        return;
      }

      if (/(thank you|thanks|शुक्रिया|धन्यवाद|thanks a lot)/.test(transcript)) {
        showNotice('Thanks command detected.');
        if (audioGuidance) speakAssistant(replyPack.thanks, true);
        return;
      }

      if (/(start new user|new user|reset session|नया यूजर)/.test(transcript)) return resetForNewUser();
      if (/(logout|log out|लॉगआउट)/.test(transcript)) return handleLogout();
      if (/(go dashboard|open dashboard|डैशबोर्ड)/.test(transcript)) return goTo('/dashboard', 'dashboard');
      if (/(go services|open services|service page|सेवा)/.test(transcript)) return goTo('/services', 'services');
      if (/(open complaints|go complaints|शिकायत)/.test(transcript)) return goTo('/complaints', 'complaints');
      if (/(open payment|go payment|भुगतान)/.test(transcript)) return goTo('/payment', 'payment');
      if (/(open tracking|status tracking|ट्रैकिंग)/.test(transcript)) return goTo('/status-tracking', 'tracking');
      if (/(open language|change language|भाषा)/.test(transcript)) return goTo('/language', 'language');
      if (/(open login|citizen login|login page|लॉगिन|लॉग इन पेज|लॉगिन पेज)/.test(transcript)) {
        pendingRouteVoiceFlowRef.current = { type: 'login-name-flow' };
        suppressAutoGuideOnceRef.current = true;
        goTo('/login', 'citizen login');
        return;
      }
      if (/(open admin|admin login|एडमिन)/.test(transcript)) return goTo('/admin', 'admin login');
      if (/(home page|go home|होम)/.test(transcript)) return goTo('/', 'home');

      const nameMatch = transcript.match(/(?:my name is|name is|मैं हूँ|मेरा नाम)\s*(.+)$/i);
      if (nameMatch?.[1]) {
        const spokenName = nameMatch[1].trim();
        if (spokenName) {
          emitVoiceFieldFill('name', spokenName, 'direct-name-command');
          showNotice('Name captured from voice command.');
          if (audioGuidance) {
            speakAssistant(
              language === 'hi'
                ? `ठीक है। आपका नाम ${spokenName} भर दिया गया है।`
                : `Okay. I have filled your name as ${spokenName}.`,
              true
            );
          }
          return;
        }
      }

      if (/(audio on|voice on|start voice|ऑडियो चालू)/.test(transcript)) return enableAudioGuidance();
      if (/(audio off|voice off|stop voice|ऑडियो बंद)/.test(transcript)) return disableAudioGuidance();
      if (/(repeat guide|speak again|फिर बोलो)/.test(transcript)) return speakFromUserAction();

      if (/(volume up|increase volume|louder|आवाज़ बढ़ाओ|volume high)/.test(transcript)) {
        const nextVolume = Math.min(1, Number((audioVolume + 0.1).toFixed(2)));
        dispatch(setAudioVolume(nextVolume));
        showNotice(`Volume set to ${Math.round(nextVolume * 100)}%.`);
        return;
      }
      if (/(volume down|decrease volume|lower volume|आवाज़ कम|volume low)/.test(transcript)) {
        const nextVolume = Math.max(0, Number((audioVolume - 0.1).toFixed(2)));
        dispatch(setAudioVolume(nextVolume));
        showNotice(`Volume set to ${Math.round(nextVolume * 100)}%.`);
        return;
      }
      if (/(mute|volume mute|silent|आवाज़ बंद)/.test(transcript)) {
        dispatch(setAudioVolume(0));
        showNotice('Volume muted.');
        return;
      }
      if (/(max volume|full volume|volume max|पूरी आवाज़)/.test(transcript)) {
        dispatch(setAudioVolume(1));
        showNotice('Volume set to maximum.');
        return;
      }

      if (/(high contrast on|contrast on|high contrast|कॉन्ट्रास्ट ऑन)/.test(transcript) && !highContrast)
        return toggleContrast();
      if (/(high contrast off|normal contrast|कॉन्ट्रास्ट ऑफ)/.test(transcript) && highContrast)
        return toggleContrast();

      if (/(font bigger|increase font|zoom in|बड़ा फ़ॉन्ट)/.test(transcript)) {
        dispatch(setFontScale(fontScale + 0.05));
        showNotice('Font size increased.');
        return;
      }
      if (/(font smaller|decrease font|zoom out|छोटा फ़ॉन्ट)/.test(transcript)) {
        dispatch(setFontScale(fontScale - 0.05));
        showNotice('Font size decreased.');
        return;
      }

      if (/(headphone mode|headphone on|headphone off|हेडफोन)/.test(transcript)) {
        dispatch(setHeadphoneMode(!headphoneMode));
        showNotice('Headphone mode toggled.');
        return;
      }

      if (/(sync now|sync queue|सिंक)/.test(transcript)) {
        await flushOfflineQueue();
        showNotice('Offline queue sync triggered.');
        return;
      }

      if (/(fullscreen|full screen|फुल स्क्रीन)/.test(transcript)) {
        await enterFullscreen();
        return;
      }

      if (/(voice commands|help commands|command help|वॉइस कमांड|help|मदद)/.test(transcript)) {
        speakAssistant(
          'Available commands are: go dashboard, go services, open complaints, open payment, open tracking, open language, start new user, high contrast on or off, audio on or off, volume up, volume down, mute, max volume, font bigger or smaller, sync now, and fullscreen.',
          true
        );
        return;
      }

      showNotice(`Unknown command: ${transcript}`);
      if (audioGuidance) {
        speakAssistant(replyPack.unknown, true);
      }
    },
    [
      audioGuidance,
      disableAudioGuidance,
      dispatch,
      emitVoiceFieldFill,
      enableAudioGuidance,
      enterFullscreen,
      flushOfflineQueue,
      fontScale,
      handleLogout,
      language,
      audioVolume,
      headphoneMode,
      highContrast,
      navigate,
      resetForNewUser,
      showNotice,
      speakAssistant,
      startVoiceFieldCapture,
      speakFromUserAction,
      toggleContrast
    ]
  );

  const startVoiceCommands = useCallback(() => {
    if (!voiceCommandSupported) {
      showNotice('Voice commands are not supported in this browser.');
      return;
    }

    if (isVoiceListening) {
      stopVoiceCommandListener();
      setIsVoiceListening(false);
      showNotice('Voice command listening stopped.');
      return;
    }

    const started = startVoiceCommandListener({
      language,
      onStatus: (status) => {
        setIsVoiceListening(status === 'listening');
      },
      onTranscript: (transcript) => {
        setIsVoiceListening(false);
        applyVoiceCommand(transcript);
      },
      onError: (message) => {
        setIsVoiceListening(false);
        showNotice(message || 'Voice command failed.');
      }
    });

    if (!started) {
      setIsVoiceListening(false);
      showNotice('Could not start voice command listener.');
      return;
    }

    showNotice('Listening for voice command...');
  }, [applyVoiceCommand, isVoiceListening, language, showNotice, voiceCommandSupported]);

  const toggleAudio = () => {
    const nextEnabled = !audioGuidance;
    if (nextEnabled) {
      enableAudioGuidance();
    } else {
      disableAudioGuidance();
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="bg-primary text-white">
          <div className="border-b border-white/20 bg-white/10">
            <div className="flex w-full items-center justify-start gap-6 overflow-x-auto whitespace-nowrap px-0 py-1 pr-3 text-[11px] font-semibold tracking-wide text-slate-100">
              <span className="shrink-0">Government of India • National e-Governance Interface</span>
              <span className="shrink-0">Digital Public Service Platform</span>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2 px-0 py-3 pr-2">
            <div className="flex w-full min-w-[280px] items-center gap-3">
              <div className="flex h-20 w-[220px] shrink-0 items-center justify-center overflow-hidden sm:w-[280px] md:w-[340px] lg:w-[420px]">
                {!isHeaderLogoMissing && (
                  <img
                    src={headerLogoSrc}
                    alt="SUVIDHA Header Logo"
                    className="h-full w-full object-contain p-1.5"
                    onError={() => setIsHeaderLogoMissing(true)}
                  />
                )}
                {isHeaderLogoMissing && (
                  <div className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-100">
                    Add Logo
                  </div>
                )}
              </div>

              <div className="min-w-[190px]">
                <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-100">Government Services Kiosk</p>
                <h1 className="whitespace-nowrap text-2xl font-extrabold leading-tight">{t('appTitle')}</h1>
                {title && <p className="text-sm text-slate-100 sm:whitespace-nowrap">{title}</p>}
              </div>
            </div>
            <div className="flex w-full items-center justify-start gap-2 overflow-x-auto whitespace-nowrap pl-0">
              <LanguageToggle />
              <button
                className="touch-btn whitespace-nowrap rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={toggleAudio}
                disabled={!voiceSupported}
              >
                {audioGuidance ? t('audioOff') : t('audioGuidance')}
              </button>
              <button
                className="touch-btn whitespace-nowrap rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={speakFromUserAction}
                disabled={!voiceSupported || !audioGuidance}
              >
                {t('repeatVoiceGuide')}
              </button>
              {audioGuidance && (
                <div className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/30 px-2 py-1">
                  <span className="text-xs font-semibold">Vol {Math.round(audioVolume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => dispatch(setAudioVolume(Number(e.target.value)))}
                    className="h-2 w-24 cursor-pointer"
                    aria-label="Audio level"
                  />
                </div>
              )}
              <button
                className="touch-btn whitespace-nowrap rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={startVoiceCommands}
                disabled={!voiceCommandSupported}
              >
                {isVoiceListening ? 'Stop Voice Cmd' : 'Voice Command'}
              </button>
              <button
                className="touch-btn whitespace-nowrap rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={() => setShowAssistControls((value) => !value)}
              >
                {showAssistControls ? 'Hide Controls' : 'Accessibility'}
              </button>
              <div className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold">
                Voice: {voiceStatus}
              </div>
              <div className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold">
                Cmd: {voiceCommandSupported ? (isVoiceListening ? 'listening' : 'idle') : 'unsupported'}
              </div>
              <button
                className="touch-btn whitespace-nowrap rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={enterFullscreen}
              >
                Kiosk Fullscreen
              </button>
              <button
                className="touch-btn whitespace-nowrap rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={resetForNewUser}
              >
                Start New User
              </button>
              <div className="whitespace-nowrap rounded-md bg-white/10 px-3 py-1 text-sm">
                {user ? `${user.name || 'Citizen'} (${user.role})` : 'Guest'}
              </div>
              {user && (
                <button
                  className="touch-btn whitespace-nowrap rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
        {showAssistControls && (
          <div className="border-t border-white/25 bg-primary/90 text-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
              <button
                className="touch-btn rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={toggleContrast}
              >
                {highContrast ? 'Normal Contrast' : 'High Contrast'}
              </button>
              <button
                className="touch-btn rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={() => dispatch(setFontScale(fontScale - 0.05))}
              >
                A-
              </button>
              <button
                className="touch-btn rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={() => dispatch(setFontScale(fontScale + 0.05))}
              >
                A+
              </button>
              <button
                className="touch-btn rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={() => dispatch(setHeadphoneMode(!headphoneMode))}
              >
                {headphoneMode ? t('headphoneOn') : t('headphoneMode')}
              </button>
              <button
                className="touch-btn rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                onClick={() =>
                  speakAssistant(
                    'Voice commands available: go dashboard, go services, open complaints, open payment, open tracking, open language, open login, open admin, start new user, high contrast on, high contrast off, audio on, audio off, volume up, volume down, mute, max volume, font bigger, font smaller, sync now, and fullscreen.',
                    true
                  )
                }
                disabled={!voiceSupported}
              >
                Voice Help
              </button>
              {lastVoiceCommand && (
                <div
                  className="max-w-64 truncate rounded-md bg-white/10 px-3 py-1 text-xs font-semibold"
                  title={lastVoiceCommand}
                >
                  Heard: {lastVoiceCommand}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="border-t bg-slate-100 px-4 py-2">
          <div className="mx-auto flex max-w-6xl items-center justify-between text-xs font-semibold">
            <span className={isOnline ? 'text-emerald-700' : 'text-rose-700'}>
              {isOnline ? t('onlineMode') : t('offlineMode')}
            </span>
            <span className="text-slate-700">Offline Queue: {queueSize}</span>
            {isOnline && queueSize > 0 && (
              <button className="touch-btn rounded-lg bg-secondary px-3 py-1 text-white" onClick={flushOfflineQueue}>
                Sync Now
              </button>
            )}
          </div>
        </div>
        <div className="border-t bg-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`touch-btn rounded-lg px-3 py-2 text-sm font-semibold ${
                    active ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className={`mx-auto w-full max-w-6xl flex-1 p-4 ${isIdle ? 'blur-sm' : ''}`}>{children}</main>

      {uiNotice && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {uiNotice}
        </div>
      )}

      <footer className="mt-8 border-t bg-white px-4 py-3 text-sm text-slate-600">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-semibold text-slate-700">Government of India • Digital Public Service Interface</p>
            <p>SUVIDHA Smart City Kiosk</p>
          </div>
          <div className="break-all text-left md:text-right">
            <p>
              Contact Email:{' '}
              <a className="font-semibold text-secondary" href="mailto:knishad0004@gmail.com">
                knishad0004@gmail.com
              </a>
            </p>
            <p>
              LinkedIn:{' '}
              <a
                className="font-semibold text-secondary"
                href="https://www.linkedin.com/in/kishan-nishad-161a73392"
                target="_blank"
                rel="noreferrer"
              >
                www.linkedin.com/in/kishan-nishad-161a73392
              </a>
            </p>
          </div>
        </div>
      </footer>

      {isIdle && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-5 text-center text-white"
          onClick={restartIdleTimer}
        >
          <div className="max-w-lg rounded-2xl border border-white/30 bg-black/70 p-6">
            <h2 className="text-2xl font-bold">Privacy Mode Enabled</h2>
            <p className="mt-2 text-sm text-slate-100">
              Session will auto reset in {countdown}s for the next citizen. Tap anywhere to continue.
            </p>
          </div>
        </div>
      )}

      <OfflineAssistantWidget currentPath={location.pathname} />
    </div>
  );
}
