import Navbar from "../../components/common/Navbar";
import Hero from "../../components/common/Hero";
import Features from "../../components/common/Features";
import ChatPreview from "../../components/common/ChatPreview";
import Footer from "../../components/common/Footer";


function Landing() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <Hero />


      <Features />
      <ChatPreview />
      <Footer />
    </div>
  );
}

export default Landing;