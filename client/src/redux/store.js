import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialAuth = {
  token: localStorage.getItem('suvidha_token') || null,
  user: JSON.parse(localStorage.getItem('suvidha_user') || 'null'),
  guestMode: localStorage.getItem('suvidha_guest_mode') === 'true'
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuth,
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.guestMode = false;
      localStorage.setItem('suvidha_token', action.payload.token);
      localStorage.setItem('suvidha_user', JSON.stringify(action.payload.user));
      localStorage.removeItem('suvidha_guest_mode');
    },
    enterGuestMode: (state) => {
      state.token = null;
      state.user = null;
      state.guestMode = true;
      localStorage.removeItem('suvidha_token');
      localStorage.removeItem('suvidha_user');
      localStorage.setItem('suvidha_guest_mode', 'true');
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.guestMode = false;
      localStorage.removeItem('suvidha_token');
      localStorage.removeItem('suvidha_user');
      localStorage.removeItem('suvidha_guest_mode');
    }
  }
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: { language: localStorage.getItem('suvidha_lang') || 'en' },
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('suvidha_lang', action.payload);
    }
  }
});

export const { setAuth, enterGuestMode, logout } = authSlice.actions;
export const { setLanguage } = uiSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer
  }
});

export default store;
