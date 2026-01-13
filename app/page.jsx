"use client";
import First from "@/components/First/First";
import Second from "@/components/Second/Second";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // @ts-expect-error - no props needed here
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then(() => console.log("Bootstrap JS loaded correctly"))
      .catch(console.error);
  }, []);

  return (
    <>
      <First />
      <Second />
    </>
  );
}
