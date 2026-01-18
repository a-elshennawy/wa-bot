"use client";
import { useState } from "react";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { IoIosSend } from "react-icons/io";
import { CircularProgress } from "@mui/material";
import { IoPersonAddSharp } from "react-icons/io5";
import { MdDelete } from "react-icons/md";

function SendMessage({ isActive }) {
  const [numbers, setNumbers] = useState([""]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const addNumberField = () => {
    setNumbers([...numbers, ""]);
  };

  const removeNumberField = (index) => {
    if (numbers.length > 1) {
      setNumbers(numbers.filter((_, i) => i !== index));
    }
  };

  const updateNumber = (index, value) => {
    const newNumbers = [...numbers];
    newNumbers[index] = value;
    setNumbers(newNumbers);
  };

  const handleSend = async () => {
    const validNumbers = numbers.filter((n) => n.trim() !== "");

    if (validNumbers.length === 0 || !message) {
      return alert("Please fill all fields");
    }

    setLoading(true);
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

    try {
      // If only one number, use single send endpoint
      if (validNumbers.length === 1) {
        const res = await fetch(`${botUrl}/api/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: validNumbers[0], message }),
        });

        if (res.ok) {
          alert("Message sent!");
          setMessage("");
          setNumbers([""]);
        } else {
          alert("Failed to send. Check if bot is connected.");
        }
      } else {
        // Use bulk send endpoint for multiple numbers
        const res = await fetch(`${botUrl}/api/send-bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numbers: validNumbers, message }),
        });

        if (res.ok) {
          const data = await res.json();
          const successCount = data.results.filter((r) => r.success).length;
          alert(
            `Messages sent to ${successCount}/${validNumbers.length} numbers!`,
          );
          setMessage("");
          setNumbers([""]);
        } else {
          alert("Failed to send. Check if bot is connected.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error sending message");
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

        {numbers.map((number, index) => (
          <div key={index} className="numberContainer mb-2">
            <input
              type="text"
              className="glassmorphism"
              placeholder="phone number..."
              value={number}
              disabled={!isActive}
              onChange={(e) => updateNumber(index, e.target.value)}
            />

            {index === numbers.length - 1 ? (
              <button
                className={`${!isActive ? "disabledBtn" : ""} glassmorphism addNumBtn`}
                disabled={!isActive}
                onClick={addNumberField}
                title="Add another number"
              >
                <IoPersonAddSharp />
              </button>
            ) : (
              <button
                className={`${!isActive ? "disabledBtn" : ""} glassmorphism addNumBtn`}
                disabled={!isActive}
                onClick={() => removeNumberField(index)}
                title="Remove this number"
                style={{ backgroundColor: "rgba(255, 50, 50, 0.3)" }}
              >
                <MdDelete />
              </button>
            )}
          </div>
        ))}
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
          {loading ? (
            <>
              send&nbsp;
              <CircularProgress size={18} color="inherit" />
            </>
          ) : (
            <>
              send&nbsp;
              <IoIosSend />
            </>
          )}
        </button>
      </div>
    </SpotlightCard>
  );
}

export default SendMessage;
