function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">

      <h1 className="text-3xl font-bold text-blue-500">
        DocMind AI
      </h1>

      <div className="flex gap-8">

        <a
          href="#"
          className="text-gray-300 hover:text-blue-500 transition-all duration-300 hover:scale-110"
        >
          Home
        </a>

        <a
          href="#features"
          className="text-gray-300 hover:text-blue-500 transition-all duration-300 hover:scale-110"
        >
          Features
        </a>

        <a
          href="#chat"
          className="text-gray-300 hover:text-blue-500 transition-all duration-300 hover:scale-110"
        >
          Chat
        </a>

        <a
          href="#about"
          className="text-gray-300 hover:text-blue-500 transition-all duration-300 hover:scale-110"
        >
          About
        </a>

      </div>

      <button className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition">
        Login
      </button>

    </nav>
  );
}

export default Navbar;