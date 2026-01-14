"use client";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { RiRefreshFill } from "react-icons/ri";

function BotStatus() {
  return (
    <>
      <SpotlightCard
        className="colCard py-3 px-2"
        spotlightColor="rgba(15, 255, 0,1)"
      >
        <div className="cardHeader text-start py-1 px-0">
          <h4>bot status</h4>
          <Image src="/icons/robot.webp" alt="logo" width={32} height={32} />
        </div>
        <hr />
        <div className="content glassmorphism p-2">
          <h6>status</h6>
        </div>
        <div className="actions py-2 px-0">
          <button className="glassmorphism">
            refresh <RiRefreshFill />
          </button>
        </div>
      </SpotlightCard>
    </>
  );
}

export default BotStatus;
