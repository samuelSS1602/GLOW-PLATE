import { createContext, useCallback, useContext, useState } from "react";
import { Check, CircleAlert, Droplets, Flame } from "lucide-react";

const Ctx = createContext(() => {});
const ICONS = { ok: Check, error: CircleAlert, flame: Flame, water: Droplets };

// Short messages that slide up above the tab bar: toast("Meal saved"), toast("Couldn't save", "error")
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);

  const toast = useCallback((text, tone = "ok") => {
    const id = `${Date.now()}-${Math.random()}`;
    setList((l) => [...l.slice(-2), { id, text, tone, out: false }]);
    setTimeout(() => setList((l) => l.map((t) => (t.id === id ? { ...t, out: true } : t))), 3000);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3300);
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {list.map(({ id, text, tone, out }) => {
          const Icon = ICONS[tone] || Check;
          return <div key={id} className={`toast ${tone} ${out ? "out" : ""}`}><Icon size={18} />{text}</div>;
        })}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
