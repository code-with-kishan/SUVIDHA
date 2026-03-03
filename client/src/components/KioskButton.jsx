export default function KioskButton({ children, onClick, className = '', type = 'button' }) {
  const handleClick = (event) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (onClick) onClick(event);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      className={`touch-btn w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-lg font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] ${className}`}
    >
      {children}
    </button>
  );
}
