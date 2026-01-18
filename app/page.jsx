"use client";
import Authentication from "@/components/inPageComponents/Authentication/Authentication";
import BotStatus from "@/components/inPageComponents/BotStatus/BotStatus";
import RecentActivities from "@/components/inPageComponents/RecentActivities/RecentActivities";
import SendMessage from "@/components/inPageComponents/SendMessage/SendMessage";
import SheetBulk from "@/components/inPageComponents/SheetBulk/SheetBulk";
import Status from "@/components/UI/Status/Status";
import { useEffect, useState, useCallback } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [botData, setBotData] = useState({
    active: false,
    qr: "",
    stats: { received: 0, replied: 0 },
  });

  // Wrap fetchData in useCallback so it's stable and can be passed to components
  const fetchData = useCallback(async () => {
    try {
      const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

      const res = await fetch(`${botUrl}/api/status`);
      if (!res.ok) throw new Error("Bot Offline");
      const data = await res.json();
      setBotData(data);

      // Only fetch messages if bot is active to save resources
      if (data.active) {
        const resMsg = await fetch(`${botUrl}/api/messages`);
        const msgData = await resMsg.json();
        setMessages(msgData);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setBotData((prev) => ({ ...prev, active: false, qr: "" }));
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    // 1. Initial Load & Bootstrap
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then(() => console.log("Bootstrap JS loaded"))
      .catch(console.error);

    const handleContextMenu = (e) => e.preventDefault();
    window.addEventListener("contextmenu", handleContextMenu);

    // 2. Data Polling Logic
    fetchData(); // Immediate fetch on mount
    const interval = setInterval(() => {
      // Only fetch if the user is actually looking at the tab
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }, 3000);

    // Cleanup
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      clearInterval(interval);
    };
  }, [fetchData]);

  return (
    <>
      <Status isActive={botData.active} />
      <div className="mainContainer py-3 z-2">
        <BotStatus isActive={botData.active} onRefresh={fetchData} />
        <Authentication qrCode={botData.qr} isActive={botData.active} />
        <SendMessage isActive={botData.active} />
        <SheetBulk isActive={botData.active} />
        <RecentActivities messages={messages} />
      </div>
    </>
  );
}
