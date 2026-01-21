"use client";
import { useState, useEffect } from "react";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { FaQrcode } from "react-icons/fa";
import QRCode from "react-qr-code";
import { CircularProgress } from "@mui/material";

function Authentication({ qrCode, isActive }) {
  const [timer, setTimer] = useState(20);

  const handleReset = async () => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";
    await fetch(`${botUrl}/api/logout`, { method: "POST" });
  };

  useEffect(() => {
    if (!qrCode || isActive) return;

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode, isActive]);

  return (
    <SpotlightCard
      className="colCard py-3 px-2"
      spotlightColor="rgba(15, 255, 0,1)"
    >
      <div className="cardHeader text-start py-1 px-0">
        <h4>authentication</h4>
        <Image src="/icons/shield.webp" alt="logo" width={32} height={32} />
      </div>
      <hr />
      <div className="content glassmorphism p-2 text-center">
        {isActive ? (
          <>
            <Image src="/icons/link.webp" alt="logo" width={100} height={100} />
            <h6 className="mt-3">authenticated</h6>
          </>
        ) : qrCode ? (
          <>
            <div
              style={{
                background: "white",
                padding: "10px",
                display: "inline-block",
              }}
            >
              <QRCode value={qrCode} size={200} />
            </div>
            <p
              className="qrTimer glassmorphism mt-2 mx-auto p-1"
              style={{ color: timer < 5 ? "var(--error)" : "var(--white)" }}
            >
              QR refreshes in: {timer}s
            </p>
          </>
        ) : (
          <CircularProgress size={90} color="var(--white)" />
        )}
      </div>
      <div className="actions py-2 px-0">
        <button
          className={`glassmorphism ${!isActive && !qrCode ? "disabledBtn" : ""}`}
          onClick={handleReset}
          disabled={!isActive && !qrCode}
        >
          {isActive ? (
            <>
              Logout / New QR&nbsp;
              <FaQrcode />
            </>
          ) : !qrCode ? (
            <>
              Loading&nbsp;
              <CircularProgress size={18} color="var(--white)" />
            </>
          ) : (
            <>
              Reset Session&nbsp;
              <FaQrcode />
            </>
          )}
        </button>
      </div>
    </SpotlightCard>
  );
}

export default Authentication;
