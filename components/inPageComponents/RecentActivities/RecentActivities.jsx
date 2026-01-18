"use client";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import React from "react";

function RecentActivities({ messages = [] }) {
  return (
    <SpotlightCard
      className="colCard py-3 px-2"
      spotlightColor="rgba(15, 255, 0,1)"
    >
      <div className="cardHeader text-start py-1 px-0">
        <h4>recent activity</h4>
        <Image src="/icons/recentAct.webp" alt="logo" width={32} height={32} />
      </div>
      <hr />
      <div
        className="content glassmorphism text-center p-2"
        style={{ maxHeight: "300px", overflowY: "auto" }}
      >
        {messages.length === 0 ? (
          <>
            <Image src="/icons/talk.webp" alt="logo" width={100} height={100} />
            <h5 className="mt-3">No activity yet.</h5>
          </>
        ) : (
          <ul>
            {messages.map((m, i) => (
              // special id
              <li key={`${m.from}-${m.time || i}`}>
                <div className="message py-1">
                  <strong>{m.from.split("@")[0]}</strong>&nbsp;:&nbsp;{m.text}
                </div>
                <div className="reply py-1">
                  <strong>Bot</strong>&nbsp;:&nbsp;
                  {m.reply}
                </div>
                <hr className="my-2" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </SpotlightCard>
  );
}

export default RecentActivities;
