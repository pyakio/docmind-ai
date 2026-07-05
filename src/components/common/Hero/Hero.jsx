function Hero() {
  return (
    <section className="min-h-[85vh] flex flex-col justify-center items-center text-center px-8">
      <h1 className="text-6xl font-bold mb-6">
        AI Powered Document Analysis
      </h1>

      <p className="text-xl text-gray-400 max-w-3xl">
        Upload PDFs, Chat with Documents, Generate AI Summaries,
        Extract Insights and boost your productivity with DocMind AI.
      </p>

      <div className="mt-10 flex gap-5">
        <button className="bg-blue-600 px-8 py-4 rounded-xl transition-all duration-300 hover:bg-blue-700 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 cursor-pointer">
          Get Started
        </button>

        <button className="border border-gray-600 px-8 py-4 rounded-xl transition-all duration-300 hover:border-blue-500 hover:text-blue-500 hover:scale-110 cursor-pointer">
          Learn More
        </button>
      </div>
    </section>
  );
}

export default Hero;