import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { IoIosNotifications } from "react-icons/io";

function Webhook() {
  return (
    <>
      <SpotlightCard
        className="colCard py-3 px-2"
        spotlightColor="rgba(15, 255, 0,1)"
      >
        <div className="cardHeader text-start py-1 px-0">
          <h4>webhook notifications</h4>
          <Image
            src="/icons/notification.webp"
            alt="logo"
            width={32}
            height={32}
          />
        </div>
        <hr />
        <div className="content glassmorphism p-2">
          <h6>
            Configure webhooks to receive notifications for WhatsApp events.
          </h6>
        </div>
        <div className="actions py-2 px-0">
          <button className="glassmorphism">
            add webhook <IoIosNotifications />
          </button>
        </div>
      </SpotlightCard>
    </>
  );
}

export default Webhook;
