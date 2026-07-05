import {
  FaFilePdf,
  FaRobot,
  FaFileAlt,
  FaChartBar,
} from "react-icons/fa";

function Features() {
  const features = [
    {
      icon: <FaFilePdf className="text-red-500 text-5xl" />,
      title: "Upload PDF",
    },
    {
      icon: <FaRobot className="text-blue-500 text-5xl" />,
      title: "AI Chat",
    },
    {
      icon: <FaFileAlt className="text-green-500 text-5xl" />,
      title: "AI Summary",
    },
    {
      icon: <FaChartBar className="text-yellow-500 text-5xl" />,
      title: "Analytics",
    },
  ];

  return (
    <section id="features" className="py-24">
      <h2 className="text-5xl font-bold text-center mb-14">
        Features
      </h2>

      <div className="grid md:grid-cols-4 gap-8 px-10">
        {features.map((item) => (
          <div
            key={item.title}
            className="
              group
              bg-gray-900
              rounded-2xl
              p-10
              text-center
              cursor-pointer
              transition-all
              duration-500
              hover:-translate-y-4
              hover:scale-105
              hover:bg-gray-800
              hover:shadow-2xl
              hover:shadow-blue-500/30
            "
          >
            <div className="flex justify-center mb-6 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">
              {item.icon}
            </div>

            <h3 className="text-2xl font-semibold text-white group-hover:text-blue-400 transition-colors duration-300">
              {item.title}
            </h3>

            <p className="text-gray-400 mt-4 text-sm">
              Experience AI-powered document management with intelligent analysis.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;