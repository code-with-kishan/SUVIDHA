import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import OnScreenKeypad from '../components/OnScreenKeypad';
import OnScreenKeyboard from '../components/OnScreenKeyboard';
import { enterGuestMode, setAudioVolume, setAuth } from '../redux/store';

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginPage() {
  useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { audioVolume } = useSelector((state) => state.ui);
  const [form, setForm] = useState({ mobile: '', otp: '', name: '', email: '', aadhaar: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [trialOtp, setTrialOtp] = useState('');
  const [message, setMessage] = useState('');
  const [activeField, setActiveField] = useState('');
  const [voiceStep, setVoiceStep] = useState('idle');
  const [isVoiceFlowRunning, setIsVoiceFlowRunning] = useState(false);
  const activeRecognitionRef = useRef(null);
  const abortFlowRef = useRef(false);

  const currentLanguage = useCallback(() => localStorage.getItem('suvidha_lang') || 'en', []);

  const getLocale = useCallback((lang) => speechLocaleByLanguage[lang] || 'en-IN', []);

  const stopActiveRecognition = useCallback(() => {
    const recognition = activeRecognitionRef.current;
    if (!recognition) return;
    try {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    } catch (_error) {
      // ignored
    }
    activeRecognitionRef.current = null;
  }, []);

  const stopActiveSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const getPromptForField = useCallback(
    (field, retry = false) => {
      const lang = currentLanguage();
      if (lang === 'hi') {
        if (field === 'name') {
          return retry ? 'माफ़ कीजिए, नाम साफ़ नहीं सुना। कृपया अपना पूरा नाम फिर से बोलिए।' : 'कृपया अपना पूरा नाम बोलिए।';
        }
        if (field === 'mobile') {
          return retry
            ? 'माफ़ कीजिए, मोबाइल नंबर साफ़ नहीं सुना। कृपया मोबाइल नंबर फिर से बोलिए।'
            : 'कृपया अपना मोबाइल नंबर बोलिए।';
        }
        if (field === 'email') {
          return retry
            ? 'माफ़ कीजिए, ईमेल साफ़ नहीं सुना। कृपया ईमेल एड्रेस फिर से बोलिए।'
            : 'कृपया अपना ईमेल एड्रेस बोलिए।';
        }
        if (field === 'aadhaar') {
          return retry
            ? 'माफ़ कीजिए, आधार नंबर साफ़ नहीं सुना। कृपया आधार नंबर फिर से बोलिए।'
            : 'कृपया अपना आधार नंबर बोलिए।';
        }
      }

      if (field === 'name') {
        return retry
          ? 'Sorry, I did not catch your name. Please say your full name again.'
          : 'Please say your full name now.';
      }
      if (field === 'mobile') {
        return retry
          ? 'Sorry, I did not catch your mobile number. Please say it again.'
          : 'Please say your mobile number now.';
      }
      if (field === 'email') {
        return retry
          ? 'Sorry, I did not catch your email. Please say your email address again.'
          : 'Please say your email address now.';
      }
      if (field === 'aadhaar') {
        return retry
          ? 'Sorry, I did not catch your Aadhaar number. Please say it again.'
          : 'Please say your Aadhaar number now.';
      }
      return 'Please say the value now.';
    },
    [currentLanguage]
  );

  const sanitizeVoiceValue = useCallback((field, rawValue) => {
    const value = String(rawValue || '').trim();
    if (!value) return '';

    const spokenNumberToDigits = (input) => {
      const tokenMap = {
        zero: '0',
        oh: '0',
        o: '0',
        one: '1',
        two: '2',
        to: '2',
        too: '2',
        three: '3',
        four: '4',
        for: '4',
        five: '5',
        six: '6',
        seven: '7',
        eight: '8',
        ate: '8',
        nine: '9',
        शून्य: '0',
        ज़ीरो: '0',
        जीरो: '0',
        एक: '1',
        दो: '2',
        तीन: '3',
        चार: '4',
        पांच: '5',
        पाँच: '5',
        छह: '6',
        छः: '6',
        सात: '7',
        आठ: '8',
        नौ: '9'
      };

      const unicodeDigitNormalized = input.replace(/[०-९]/g, (char) => String(char.charCodeAt(0) - 2406));
      const directDigits = unicodeDigitNormalized.replace(/\D+/g, '');
      if (directDigits.length) return directDigits;

      const normalized = unicodeDigitNormalized
        .toLowerCase()
        .replace(/[-,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const tokens = normalized.split(' ');
      let built = '';
      for (const token of tokens) {
        if (tokenMap[token]) built += tokenMap[token];
      }
      return built;
    };

    if (field === 'mobile') return spokenNumberToDigits(value).slice(0, 10);
    if (field === 'otp') return spokenNumberToDigits(value).slice(0, 6);
    if (field === 'aadhaar') return spokenNumberToDigits(value).slice(0, 12);
    if (field === 'email') {
      return value
        .toLowerCase()
        .replace(/\s+(at|@)\s+/g, '@')
        .replace(/\s+(dot|point)\s+/g, '.')
        .replace(/\s+/g, '');
    }
    if (field === 'name') return value.replace(/\s+/g, ' ').slice(0, 100);
    return value;
  }, []);

  const isValidVoiceFieldValue = useCallback((field, value) => {
    const text = String(value || '');
    if (field === 'mobile') return /^\d{10}$/.test(text);
    if (field === 'aadhaar') return /^\d{12}$/.test(text);
    if (field === 'email') return text.includes('@') && text.includes('.');
    if (field === 'name') return text.trim().length >= 2;
    return Boolean(text.trim());
  }, []);

  const speakPrompt = useCallback(async (text, lang, volume) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;

    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLocale(lang);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = Math.min(1, Math.max(0.35, Number(volume) || 0.75));

      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      const timeout = setTimeout(() => finish(false), 12000);
      utterance.onend = () => {
        clearTimeout(timeout);
        finish(true);
      };
      utterance.onerror = () => {
        clearTimeout(timeout);
        finish(false);
      };

      try {
        synth.speak(utterance);
      } catch (_error) {
        clearTimeout(timeout);
        finish(false);
      }
    });
  }, [getLocale]);

  const listenOnce = useCallback(
    async (lang) => {
      const RecognitionCtor =
        typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
      if (!RecognitionCtor) return '';

      return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          stopActiveRecognition();
          resolve(value || '');
        };

        const recognition = new RecognitionCtor();
        activeRecognitionRef.current = recognition;
        recognition.lang = getLocale(lang);
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 3;

        const timeout = setTimeout(() => finish(''), 10000);
        recognition.onresult = (event) => {
          clearTimeout(timeout);
          finish(event?.results?.[0]?.[0]?.transcript || '');
        };
        recognition.onerror = () => {
          clearTimeout(timeout);
          finish('');
        };
        recognition.onend = () => {
          clearTimeout(timeout);
          finish('');
        };

        try {
          recognition.start();
        } catch (_error) {
          clearTimeout(timeout);
          finish('');
        }
      });
    },
    [getLocale, stopActiveRecognition]
  );

  const startVoiceLoginFlow = useCallback(() => {
    if (isVoiceFlowRunning) return;

    const lang = currentLanguage();
    if (Number(audioVolume) <= 0) dispatch(setAudioVolume(0.75));

    const runFlow = async () => {
      const steps = ['name', 'mobile', 'email', 'aadhaar'];
      const nextStep = { name: 'mobile', mobile: 'email', email: 'aadhaar', aadhaar: 'done' };

      setIsVoiceFlowRunning(true);
      abortFlowRef.current = false;
      setVoiceStep('name');
      setMessage('Voice login flow started. Please speak clearly when prompted.');

      try {
        for (const step of steps) {
          if (abortFlowRef.current) return;

          let done = false;
          for (let attempt = 0; attempt < 6; attempt += 1) {
            if (abortFlowRef.current) return;

            setVoiceStep(step);
            const prompt = getPromptForField(step, attempt > 0);
            await speakPrompt(prompt, lang, audioVolume || 0.75);

            if (abortFlowRef.current) return;

            await wait(320);

            const transcript = await listenOnce(lang);
            const sanitized = sanitizeVoiceValue(step, transcript);

            if (!sanitized || !isValidVoiceFieldValue(step, sanitized)) {
              if (step === 'mobile') {
                setMessage('Mobile number must be exactly 10 digits. Please say your mobile number again.');
              } else if (step === 'aadhaar') {
                setMessage('Aadhaar number must be exactly 12 digits. Please say your Aadhaar number again.');
              } else {
                setMessage(`Could not capture ${step}. Please respond again.`);
              }
              continue;
            }

            setForm((prev) => ({ ...prev, [step]: sanitized }));
            setActiveField('');
            setVoiceStep(nextStep[step]);
            setMessage(
              step === 'aadhaar'
                ? 'Voice onboarding complete. Please review details and send OTP.'
                : `${step} captured. Next: ${nextStep[step]}.`
            );
            done = true;
            await wait(220);
            break;
          }

          if (!done) {
            setVoiceStep('idle');
            setMessage(`Could not capture ${step} after multiple tries. Please fill manually.`);
            return;
          }
        }
      } finally {
        setIsVoiceFlowRunning(false);
      }
    };

    runFlow();
  }, [
    audioVolume,
    currentLanguage,
    dispatch,
    getPromptForField,
    isVoiceFlowRunning,
    listenOnce,
    isValidVoiceFieldValue,
    sanitizeVoiceValue,
    speakPrompt,
    stopActiveSpeech
  ]);

  useEffect(() => {
    return () => {
      abortFlowRef.current = true;
      stopActiveRecognition();
      stopActiveSpeech();
    };
  }, [stopActiveRecognition, stopActiveSpeech]);

  const handleSendOtp = async () => {
    if (!form.mobile || !form.name || !form.email || !form.aadhaar) {
      setMessage('Mobile, Name, Email, and Aadhaar are required.');
      return;
    }
    try {
      const { data } = await api.post('/api/auth/send-otp', {
        mobile: form.mobile,
        email: form.email
      });
      setOtpSent(true);
      setTrialOtp(data.devOtp ? String(data.devOtp) : '');
      const delivery = data.channels?.email ? 'OTP sent to your email address.' : 'OTP sent successfully.';
      setMessage(delivery);
    } catch (error) {
      setTrialOtp('');
      setMessage(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!form.mobile || !form.otp || !form.name || !form.email || !form.aadhaar) {
      setMessage('Please fill all required details and OTP.');
      return;
    }
    try {
      const { data } = await api.post('/api/auth/verify-otp', form);
      dispatch(setAuth(data));
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleGuestMode = () => {
    dispatch(enterGuestMode());
    navigate('/dashboard');
  };

  return (
    <Layout title="Citizen Login & OTP Authentication">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-primary p-6 text-white shadow">
          <h2 className="text-3xl font-bold">Secure Citizen Access</h2>
          <p className="mt-3 text-sm text-slate-100">
            Access civic utilities in one place with OTP-based secure verification and email alerts.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl bg-white/10 p-3">1. Enter mobile, full name, email, and Aadhaar</div>
            <div className="rounded-xl bg-white/10 p-3">2. Receive 6-digit OTP on your email (valid for 2 minutes)</div>
            <div className="rounded-xl bg-white/10 p-3">3. Verify OTP and access your dashboard</div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h3 className="mb-4 text-2xl font-semibold text-primary">Citizen Login</h3>
          <div className="space-y-3">
            <button
              className="touch-btn w-full rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-white"
              onClick={startVoiceLoginFlow}
              disabled={isVoiceFlowRunning}
            >
              {isVoiceFlowRunning ? 'Voice Fill Running...' : 'Start Voice Fill'}
            </button>
            {voiceStep !== 'idle' && (
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                Voice Step: {voiceStep === 'done' ? 'completed' : voiceStep}
              </div>
            )}
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Mobile Number"
              type="tel"
              inputMode="numeric"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              onFocus={() => setActiveField('mobile')}
            />
            {activeField === 'mobile' && (
              <OnScreenKeypad
                value={form.mobile}
                onChange={(value) => setForm({ ...form, mobile: value })}
                onClose={() => setActiveField('')}
              />
            )}
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setActiveField('name')}
            />
            {activeField === 'name' && (
              <OnScreenKeyboard
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                maxLength={100}
                language={localStorage.getItem('suvidha_lang') || 'en'}
                mode="text"
                onClose={() => setActiveField('')}
              />
            )}
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Email Address"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setActiveField('email')}
            />
            {activeField === 'email' && (
              <OnScreenKeyboard
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                maxLength={150}
                language={localStorage.getItem('suvidha_lang') || 'en'}
                mode="email"
                onClose={() => setActiveField('')}
              />
            )}
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Aadhaar Number"
              type="text"
              inputMode="numeric"
              value={form.aadhaar}
              onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
              onFocus={() => setActiveField('aadhaar')}
            />
            {activeField === 'aadhaar' && (
              <OnScreenKeypad
                value={form.aadhaar}
                onChange={(value) => setForm({ ...form, aadhaar: value })}
                onClose={() => setActiveField('')}
              />
            )}

            {!otpSent ? (
              <KioskButton onClick={handleSendOtp}>Send OTP</KioskButton>
            ) : (
              <>
                <input
                  className="w-full rounded-lg border p-3 text-lg"
                  placeholder="Enter 6 digit OTP"
                  type="text"
                  inputMode="numeric"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  onFocus={() => setActiveField('otp')}
                />
                {activeField === 'otp' && (
                  <OnScreenKeypad
                    value={form.otp}
                    onChange={(value) => setForm({ ...form, otp: value })}
                    onClose={() => setActiveField('')}
                  />
                )}
                <KioskButton className="bg-secondary" onClick={handleVerifyOtp}>
                  Verify OTP
                </KioskButton>
                {trialOtp && (
                  <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary">
                    Trial OTP (for testing): <span className="font-bold tracking-widest">{trialOtp}</span>
                  </div>
                )}
              </>
            )}
            {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
            <button
              className="touch-btn w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              onClick={handleGuestMode}
            >
              Continue in Guest Mode
            </button>
          </div>
        </section>
      </div>
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow">
        Need language support first? Use the language selector in the top bar before login.
      </div>
    </Layout>
  );
}
