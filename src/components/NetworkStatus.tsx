import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function NetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);
  return <div className={`network-status ${online ? "is-online" : "is-offline"}`} role="status" aria-live="polite">
    {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}<span>{online ? "En ligne" : "Hors ligne"}</span>
  </div>;
}
