"use client";
import { useState } from "react";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { IoIosSend } from "react-icons/io";
import { CircularProgress } from "@mui/material";
import { IoPersonAddSharp } from "react-icons/io5";
import { MdCancel, MdDelete } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "motion/react";

function SendMessage({ isActive }) {
  const [numbers, setNumbers] = useState([""]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
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
          setSuccess("Message sent");
          setTimeout(() => {
            setSuccess("");
            setMessage("");
            setNumbers([""]);
          }, 2000);
        } else {
          setError("failed to send. check if bot is connected.");
          setTimeout(() => {
            setError("");
          }, 2000);
        }
      } else {
        // Use bulk send endpoint for multiple numbers
        const res = await fetch(`${botUrl}/api/send-bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numbers: validNumbers, message }),
        });

        if (res.ok) {
          setSuccess("Message sent");
          setTimeout(() => {
            setSuccess("");
            setMessage("");
            setNumbers([""]);
          }, 2000);
        } else {
          setError("failed to send. check if bot is connected.");
          setTimeout(() => {
            setError("");
          }, 2000);
        }
      }
    } catch (err) {
      console.error(err);
      setError("error :", err);
      setTimeout(() => {
        setError("");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="notifictaion error"
          >
            {error} <MdCancel size={18} />
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="notifictaion success"
          >
            {success} <FaCheckCircle size={18} />
          </motion.div>
        )}
      </AnimatePresence>

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
                <>
                  <button
                    className={`${!isActive ? "disabledBtn" : ""} glassmorphism numBtn`}
                    disabled={!isActive}
                    onClick={addNumberField}
                    title="Add another number"
                  >
                    <IoPersonAddSharp size={18} />
                  </button>
                </>
              ) : (
                <button
                  className={`${!isActive ? "disabledBtn" : ""} glassmorphism numBtn delNumBtn`}
                  disabled={!isActive}
                  onClick={() => removeNumberField(index)}
                  title="Remove this number"
                >
                  <MdDelete size={18} />
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
    </>
  );
}

export default SendMessage;
