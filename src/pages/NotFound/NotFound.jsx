import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-7xl font-bold text-red-500">404</h1>

      <h2 className="text-3xl font-semibold">
        Page Not Found
      </h2>

      <Link
        to="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;