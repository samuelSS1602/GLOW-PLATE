import { useEffect, useState } from "react";

// The current time, refreshed every minute (for time-of-day nudges and the date rolling over).
export function useNow(everyMs = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
