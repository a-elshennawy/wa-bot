"use client";
import "./Status.css";
import { GoDotFill } from "react-icons/go";

function Status() {
  return (
    <>
      <span className="status glassmorphism connected">
        connected
        <GoDotFill />
      </span>
    </>
  );
}

export default Status;
