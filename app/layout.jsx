import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import ColorBends from "@/components/UI/ColorBends/ColorBends";

export const metadata = {
  title: "Islamic-Brand-Bot",
  description: "Islamic Brand whats-App Bot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ColorBends
          colors={["#2bfb2b", "#fff", "#2bfb8f"]}
          rotation={30}
          speed={0.3}
          scale={1.2}
          frequency={2}
          warpStrength={1.2}
          mouseInfluence={0.8}
          parallax={0.6}
          noise={0.08}
          transparent
        />
        {children}
      </body>
    </html>
  );
}
