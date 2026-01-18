"use client";
import { useState } from "react";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import { MdUpdate } from "react-icons/md";
import { IoIosSend } from "react-icons/io";

function SheetBulk({ isActive }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [numbersCount, setNumbersCount] = useState(0);

  const handleUpdate = async () => {
    setUpdating(true);
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${botUrl}/api/update-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setNumbersCount(data.count);
        alert(`✅ Updated! Found ${data.count} numbers from sheet`);
      } else {
        alert("Failed to update numbers from sheet");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating sheet");
    } finally {
      setUpdating(false);
    }
  };

  const handleSend = async () => {
    if (!message) {
      return alert("Please enter a message");
    }

    if (numbersCount === 0) {
      return alert("Please click UPDATE first to fetch numbers from sheet");
    }

    const confirmed = confirm(
      `Send this message to ${numbersCount} numbers from the sheet?`,
    );
    if (!confirmed) return;

    setLoading(true);
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${botUrl}/api/send-from-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        const data = await res.json();
        const successCount = data.results.filter((r) => r.success).length;
        alert(`✅ Done!\nSent to ${successCount}/${data.total} numbers`);
        setMessage("");
      } else {
        const error = await res.json();
        alert("Failed: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SpotlightCard
      className="colCard py-3 px-2"
      spotlightColor="rgba(15, 255, 0,1)"
    >
      <div className="cardHeader text-start py-1 px-0">
        <h4>send bulk from sheet</h4>
        <Image src="/icons/sheets.webp" alt="logo" width={32} height={32} />
      </div>
      <hr />
      <div className="content glassmorphism text-start p-2">
        {numbersCount > 0 && (
          <div
            className="mb-2 p-2"
            style={{ background: "rgba(0,255,0,0.1)", borderRadius: "8px" }}
          >
            <small>📊 {numbersCount} numbers loaded from sheet</small>
          </div>
        )}

        <div className="inputContainer py-1 px-0">
          <p className="mb-1 text-sm">Message</p>
          <textarea
            className="glassmorphism"
            placeholder="enter your message..."
            value={message}
            disabled={!isActive}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>

        <div className="actions py-2 px-0">
          <button
            className={`glassmorphism ${!isActive ? "disabledBtn" : ""}`}
            onClick={handleUpdate}
            disabled={updating || !isActive}
            style={{ flex: 1 }}
          >
            {updating ? (
              <>
                updating&nbsp;
                <CircularProgress size={18} />
              </>
            ) : (
              <>
                update&nbsp;
                <MdUpdate size={18} />
              </>
            )}
          </button>

          <button
            className={`glassmorphism ${!isActive ? "disabledBtn" : ""}`}
            onClick={handleSend}
            disabled={loading || !isActive || numbersCount === 0}
            style={{ flex: 1 }}
          >
            {loading ? (
              <>
                sending&nbsp;
                <CircularProgress size={18} />
              </>
            ) : (
              <>
                send&nbsp;
                <IoIosSend />
              </>
            )}
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
}

export default SheetBulk;
