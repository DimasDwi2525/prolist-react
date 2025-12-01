import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { clearAuth } from "../utils/storage";

export default function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        credentials: "include", // wajib biar laravel_session dihapus
      });
    } catch (error) {
      console.error("Logout gagal:", error);
    } finally {
      clearAuth(); // hapus semua cookie di sisi client
      if (onLogout) {
        onLogout(); // Call the callback to refresh online users
      }
      // Disconnect WebSocket to trigger leave event
      if (window.Echo) {
        window.Echo.disconnect();
      }
      // Add a small delay to allow WebSocket to disconnect and broadcast leave event
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 200);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none"
      >
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name
          )}&background=0074A8&color=fff`}
          className="w-8 h-8 rounded-full border border-primary-200 object-cover"
          alt="Avatar"
        />
        <span className="hidden sm:block text-gray-700 text-xs font-medium">
          👋 Hi,{" "}
          <span className="font-semibold text-primary-700">{user.name}</span>
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-200 text-sm"
          style={{ zIndex: 9999 }}
        >
          <div className="px-3 py-2 text-gray-700 border-b">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
          <a href="/profile" className="block px-3 py-2 hover:bg-gray-100">
            ⚙️ Setting Account
          </a>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            🔓 Logout
          </button>
        </div>
      )}
    </div>
  );
}
