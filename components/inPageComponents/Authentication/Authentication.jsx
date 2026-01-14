"use client";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { FaQrcode } from "react-icons/fa";

function Authentication() {
  return (
    <>
      <SpotlightCard
        className="colCard py-3 px-2"
        spotlightColor="rgba(15, 255, 0,1)"
      >
        <div className="cardHeader text-start py-1 px-0">
          <h4>authentication</h4>
          <Image src="/icons/shield.webp" alt="logo" width={32} height={32} />
        </div>
        <hr />
        <div className="content glassmorphism p-2">
          <h6>here you get the QR code to scan.</h6>
        </div>
        <div className="actions py-2 px-0">
          <button className="glassmorphism">
            get QR code <FaQrcode />
          </button>
        </div>
      </SpotlightCard>
    </>
  );
}

export default Authentication;
