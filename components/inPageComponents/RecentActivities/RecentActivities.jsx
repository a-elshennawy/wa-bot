"use client";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import React from "react";

function RecentActivities() {
  return (
    <>
      <SpotlightCard
        className="colCard py-3 px-2"
        spotlightColor="rgba(15, 255, 0,1)"
      >
        <div className="cardHeader text-start py-1 px-0">
          <h4>recent activity</h4>
          <Image
            src="/icons/recentAct.webp"
            alt="logo"
            width={32}
            height={32}
          />
        </div>
        <hr />
        <div className="content glassmorphism p-2">
          <h5>No activity yet. Messages will appear here.</h5>
        </div>
      </SpotlightCard>
    </>
  );
}

export default RecentActivities;
