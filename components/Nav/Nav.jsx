"use client";
import Image from "next/image";
import "./Nav.css";

function Nav() {
  return (
    <>
      <div className="navContainer row text-center justify-content-center align-items-center m-0">
        <div className="navDock glassmorphism row justify-content-between align-items-center gap-2 p-2">
          <div className="col-5">
            <Image
              src="/favicon.ico"
              width={32}
              height={32}
              alt="Logo"
              className="logo"
            />
          </div>
          <div className="col-5 status">
            <span className="glassmorphism">error</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Nav;
