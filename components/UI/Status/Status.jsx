"use client";
import "./Status.css";
import { GoDotFill } from "react-icons/go";

function Status({ isActive }) {
  return (
    <>
      <span
        className={`status glassmorphism ${isActive ? "connected" : "disconnected"}`}
      >
        {isActive ? "connected" : "disconnected"}
        <GoDotFill />
      </span>
    </>
  );
}

export default Status;
