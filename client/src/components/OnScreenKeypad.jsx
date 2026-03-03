export default function OnScreenKeypad({ value, onChange, allowDecimal = false, onClose }) {
  const keys = allowDecimal ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  const append = (key) => {
    if (key === '.' && value.includes('.')) return;
    onChange(`${value}${key}`);
  };

  const backspace = () => {
    onChange(value.slice(0, -1));
  };

  const clearAll = () => {
    onChange('');
  };

  return (
    <div className="mt-3 max-w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">On-Screen Keypad</p>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => append(key)}
            className="touch-btn rounded-lg bg-white px-3 py-2 text-lg font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          className="touch-btn rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200"
        >
          Backspace
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="touch-btn col-span-2 rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-200"
        >
          Clear
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="touch-btn col-span-3 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
