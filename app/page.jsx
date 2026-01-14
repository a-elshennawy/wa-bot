"use client";
import ApiKeyGenerator from "@/components/inPageComponents/ApiKeyGenerator/ApiKeyGenerator";
import Authentication from "@/components/inPageComponents/Authentication/Authentication";
import BotStatus from "@/components/inPageComponents/BotStatus/BotStatus";
import BtnMessage from "@/components/inPageComponents/BtnMessage/BtnMessage";
import RecentActivities from "@/components/inPageComponents/RecentActivities/RecentActivities";
import SendMessage from "@/components/inPageComponents/SendMessage/SendMessage";
import Webhook from "@/components/inPageComponents/Webhook/Webhook";
import Status from "@/components/UI/Status/Status";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // @ts-expect-error - no props needed here
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then(() => console.log("Bootstrap JS loaded correctly"))
      .catch(console.error);
  }, []);

  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  return (
    <>
      <Status />
      <div className="mainContainer py-3 z-2">
        <BotStatus />
        <ApiKeyGenerator />
        <Authentication />
        <SendMessage />
        <BtnMessage />
        <Webhook />
        <RecentActivities />
      </div>
    </>
  );
}
