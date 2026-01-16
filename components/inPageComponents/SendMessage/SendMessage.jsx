"use client";
import { useState } from "react";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { IoIosSend } from "react-icons/io";

function SendMessage({ isActive }) {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!number || !message) return alert("Please fill all fields");

    setLoading(true);
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${botUrl}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, message }),
      });

      if (res.ok) {
        alert("Message sent!");
        setMessage(""); // Clear message field
      } else {
        alert("Failed to send. Check if bot is connected.");
      }
    } catch (err) {
      console.error(err);
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
        <h4>send message</h4>
        <Image src="/icons/message.webp" alt="logo" width={32} height={32} />
      </div>
      <hr />
      <div className="inputContainer py-1 px-0">
        <p className="mb-1">kindly include international code</p>
        <input
          type="text"
          className="glassmorphism"
          placeholder="phone number..."
          value={number}
          disabled={!isActive}
          onChange={(e) => setNumber(e.target.value)}
        />
      </div>
      <div className="inputContainer py-1 px-0">
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
          onClick={handleSend}
          disabled={loading || !isActive}
        >
          {loading ? "sending..." : "send"} <IoIosSend />
        </button>
      </div>
    </SpotlightCard>
  );
}

export default SendMessage;
