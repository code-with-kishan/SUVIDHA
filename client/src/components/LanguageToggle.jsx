import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../redux/store';

const options = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'اردو' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'ks', label: 'کٲشُر' },
  { code: 'doi', label: 'डोगरी' }
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
    <div className="max-w-full rounded-xl bg-white p-1 shadow-sm">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap">
      {options.map((option) => (
        <button
          key={option.code}
          onClick={() => onChange(option.code)}
          className={`touch-btn shrink-0 rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
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
