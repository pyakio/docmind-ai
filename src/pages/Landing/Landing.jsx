import React from "react";
import Navbar from "../../components/common/Navbar/Navbar";
import Hero from "../../components/common/Hero/Hero";
import Features from "../../components/common/Features/Features";
import ChatPreview from "../../components/common/ChatPreview/ChatPreview";
import Footer from "../../components/common/Footer/Footer";

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