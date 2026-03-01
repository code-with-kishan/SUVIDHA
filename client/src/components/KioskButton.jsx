export default function KioskButton({ children, onClick, className = '', type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`touch-btn w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-lg font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      {children}
    </button>
  );
}
