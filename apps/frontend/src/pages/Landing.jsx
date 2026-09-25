import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import ChatPreview from "../components/ChatPreview";
import Footer from "../components/Footer";

function Landing() {
  return (
    <div className="bg-black text-white min-h-screen font-sans selection:bg-cyan-500 selection:text-black">
      <Navbar />
      <Hero />
      <Features />
      <ChatPreview />
      <Footer />
    </div>
  );
}

export default Landing;