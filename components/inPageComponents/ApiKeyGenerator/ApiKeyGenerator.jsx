"use client";
import SpotlightCard from "@/components/UI/SpotlightCard/SpotlightCard";
import Image from "next/image";
import { FaCopy } from "react-icons/fa";
import { ImConnection } from "react-icons/im";
import { IoMdKey } from "react-icons/io";

function ApiKeyGenerator() {
  return (
    <>
      <SpotlightCard
        className="colCard py-3 px-2"
        spotlightColor="rgba(15, 255, 0,1)"
      >
        <div className="cardHeader text-start py-1 px-0">
          <h4>API key generator</h4>
          <Image src="/icons/key.webp" alt="logo" width={32} height={32} />
        </div>
        <hr />
        <div className="content glassmorphism p-2">
          <h5>current key</h5>
          <h6 className="py-1">76d84c6cp9w847nc070-9xum0cr4</h6>
        </div>

        <div className="inputContainer py-2 px-0">
          <input
            type="text"
            className="glassmorphism"
            placeholder="enter api key..."
          />
        </div>

        <div className="actions p-0">
          <button className="glassmorphism">
            test connection
            <span>
              <ImConnection />
            </span>
          </button>
          <button className="glassmorphism">
            copy
            <span>
              <FaCopy />
            </span>
          </button>
          <hr />
          <button className="glassmorphism">
            generate new key <IoMdKey />
          </button>
        </div>
      </SpotlightCard>
    </>
  );
}

export default ApiKeyGenerator;
