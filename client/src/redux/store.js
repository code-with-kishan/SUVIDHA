import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialAuth = {
  token: sessionStorage.getItem('suvidha_token') || null,
  user: JSON.parse(sessionStorage.getItem('suvidha_user') || 'null'),
  guestMode: sessionStorage.getItem('suvidha_guest_mode') === 'true'
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuth,
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.guestMode = false;
      sessionStorage.setItem('suvidha_token', action.payload.token);
      sessionStorage.setItem('suvidha_user', JSON.stringify(action.payload.user));
      sessionStorage.removeItem('suvidha_guest_mode');
    },
    enterGuestMode: (state) => {
      state.token = null;
      state.user = null;
      state.guestMode = true;
      sessionStorage.removeItem('suvidha_token');
      sessionStorage.removeItem('suvidha_user');
      sessionStorage.setItem('suvidha_guest_mode', 'true');
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.guestMode = false;
      sessionStorage.removeItem('suvidha_token');
      sessionStorage.removeItem('suvidha_user');
      sessionStorage.removeItem('suvidha_guest_mode');
    }
  }
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    language: localStorage.getItem('suvidha_lang') || 'en',
    highContrast: localStorage.getItem('suvidha_high_contrast') === 'true',
    fontScale: Number(localStorage.getItem('suvidha_font_scale') || '1'),
    audioGuidance: false,
    audioVolume: Number(localStorage.getItem('suvidha_audio_volume') || '0.75'),
    headphoneMode: localStorage.getItem('suvidha_headphone_mode') === 'true'
  },
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('suvidha_lang', action.payload);
    },
    setHighContrast: (state, action) => {
      state.highContrast = Boolean(action.payload);
      localStorage.setItem('suvidha_high_contrast', String(Boolean(action.payload)));
    },
    setFontScale: (state, action) => {
      const nextScale = Math.min(1.25, Math.max(0.9, Number(action.payload || 1)));
      state.fontScale = nextScale;
      localStorage.setItem('suvidha_font_scale', String(nextScale));
    },
    setAudioGuidance: (state, action) => {
      state.audioGuidance = Boolean(action.payload);
    },
    setAudioVolume: (state, action) => {
      const raw = Number(action.payload);
      const safeValue = Number.isFinite(raw) ? raw : 0.75;
      const nextVolume = Math.min(1, Math.max(0, safeValue));
      state.audioVolume = nextVolume;
      localStorage.setItem('suvidha_audio_volume', String(nextVolume));
    },
    setHeadphoneMode: (state, action) => {
      state.headphoneMode = Boolean(action.payload);
      localStorage.setItem('suvidha_headphone_mode', String(Boolean(action.payload)));
    }
  }
});

export const { setAuth, enterGuestMode, logout } = authSlice.actions;
export const { setLanguage, setHighContrast, setFontScale, setAudioGuidance, setAudioVolume, setHeadphoneMode } =
  uiSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer
  }
});

export default store;
