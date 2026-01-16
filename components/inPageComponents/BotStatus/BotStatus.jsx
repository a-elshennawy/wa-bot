"use client";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { RiRefreshFill } from "react-icons/ri";

function BotStatus({ isActive, onRefresh }) {
  return (
    <>
      <SpotlightCard
        className="colCard py-3 px-2"
        spotlightColor={isActive ? "rgba(15, 255, 0,1)" : "rgba(255, 0, 0,1)"}
      >
        <div className="cardHeader text-start py-1 px-0">
          <h4>bot status</h4>
          <Image src="/icons/robot.webp" alt="logo" width={32} height={32} />
        </div>
        <hr />
        <div className="content glassmorphism p-2 text-center">
          {isActive ? (
            <>
              <Image
                src="/icons/connected.webp"
                alt="logo"
                width={100}
                height={100}
              />
            </>
          ) : (
            <>
              <Image
                src="/icons/disconnect.webp"
                alt="logo"
                width={100}
                height={100}
              />
            </>
          )}
          <h5 className="mt-3">{isActive ? "connected" : "disconnected"}</h5>
        </div>
        <div className="actions py-2 px-0">
          <button className="glassmorphism" onClick={onRefresh}>
            refresh <RiRefreshFill />
          </button>
        </div>
      </SpotlightCard>
    </>
  );
}

export default BotStatus;
