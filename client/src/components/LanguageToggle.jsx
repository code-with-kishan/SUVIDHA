import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../redux/store';

const options = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' }
];

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.ui.language);

  const onChange = (code) => {
    dispatch(setLanguage(code));
    i18n.changeLanguage(code);
  };

  return (
    <div className="rounded-xl bg-white p-1 shadow-sm">
      <div className="flex items-center gap-1">
      {options.map((option) => (
        <button
          key={option.code}
          onClick={() => onChange(option.code)}
          className={`touch-btn min-w-24 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            selected === option.code
              ? 'bg-secondary text-white shadow'
              : 'bg-transparent text-slate-700 hover:bg-slate-100'
          }`}
        >
          {option.label}
        </button>
      ))}
      </div>
    </div>
  );
}
