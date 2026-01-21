"use client";
import { useState } from "react";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import { MdCancel, MdUpdate } from "react-icons/md";
import { IoIosSend } from "react-icons/io";
import { FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "motion/react";
import { FcContacts } from "react-icons/fc";

function SheetBulk({ isActive }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
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
        setSuccess(`found ${data.count} numbers from sheet`);
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError("failed to update numbers from sheet");
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setError("error updating sheet");
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleSend = async () => {
    if (!message) {
      setError("Please enter a message");
      setTimeout(() => {
        setError("");
      }, 3000);
      return;
    }

    if (numbersCount === 0) {
      setError("click UPDATE to get numbers from sheet");
      setTimeout(() => {
        setError("");
      }, 3000);
      return;
    }

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
        setSuccess(`Sent to ${successCount}/${data.total} numbers`);
        setTimeout(() => {
          setSuccess("");
        }, 3000);
        setMessage("");
        setNumbersCount(0);
      } else {
        const error = await res.json();
        setError("error :", error.error || "Unknown error");
        setTimeout(() => {
          setError("");
        }, 3000);
        setNumbersCount(0);
      }
    } catch (err) {
      console.error(err);
      setError("error: " + err.message);
      setTimeout(() => {
        setError("");
      }, 3000);
      setNumbersCount(0);
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
          <h4>send bulk from sheet</h4>
          <Image src="/icons/sheets.webp" alt="logo" width={32} height={32} />
        </div>
        <hr />

        <div className="content glassmorphism text-start p-2">
          <AnimatePresence>
            {numbersCount > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="glassmorphism sheetNumbersCount text-start py-2 px-1 mb-1"
                >
                  {numbersCount} number are currently selected{" "}
                  <FcContacts size={20} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

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
              disabled={loading || updating || !isActive}
              style={{ flex: 1 }}
            >
              {updating ? (
                <>
                  updating&nbsp;
                  <CircularProgress size={18} color="var(--white)" />
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
                  <CircularProgress size={18} color="var(--white)" />
                </>
              ) : (
                <>
                  send&nbsp;
                  <IoIosSend size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </SpotlightCard>
    </>
  );
}

export default SheetBulk;
