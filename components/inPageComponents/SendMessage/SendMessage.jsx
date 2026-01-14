"use client";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { IoIosSend } from "react-icons/io";

function SendMessage() {
  return (
    <>
      <>
        <SpotlightCard
          className="colCard py-3 px-2"
          spotlightColor="rgba(15, 255, 0,1)"
        >
          <div className="cardHeader text-start py-1 px-0">
            <h4>send message</h4>
            <Image
              src="/icons/message.webp"
              alt="logo"
              width={32}
              height={32}
            />
          </div>
          <hr />
          <div className="inputContainer py-1 px-0">
            <input
              type="text"
              className="glassmorphism"
              placeholder="phone number..."
            />
          </div>
          <div className="inputContainer py-1 px-0">
            <textarea
              className="glassmorphism"
              placeholder="enter your message..."
            ></textarea>
          </div>

          <div className="actions py-2 px-0">
            <button className="glassmorphism">
              send <IoIosSend />
            </button>
          </div>
        </SpotlightCard>
      </>
    </>
  );
}

export default SendMessage;
