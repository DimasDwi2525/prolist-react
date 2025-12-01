import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "./NotificationDropdown";
import LogoCitasys from "../../public/assets/CITASys Logo.jpg";

export default function Header({
  user,
  toggleSidebar,
  fullScreenHandle,
  notifications,
  onReadNotification,
  onLogout,
}) {
  return (
    <header className="bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar */}
        <button
          onClick={toggleSidebar}
          className="text-primary-600 hover:text-primary-700 transition focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src={LogoCitasys}
            alt="CITASys Logo"
            className="h-8 w-auto object-contain transition-transform duration-200 ease-in-out hover:scale-105"
            aria-label="CITASys Logo"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Tombol Fullscreen */}
        <button
          onClick={() =>
            fullScreenHandle.active
              ? fullScreenHandle.exit()
              : fullScreenHandle.enter()
          }
          className="p-1 rounded hover:bg-gray-100 transition"
          title={
            fullScreenHandle.active ? "Exit Fullscreen" : "Enter Fullscreen"
          }
        >
          {fullScreenHandle.active ? (
            <FullscreenExitIcon />
          ) : (
            <FullscreenIcon />
          )}
        </button>

        {/* Notifikasi */}
        <NotificationDropdown
          notifications={notifications}
          onRead={onReadNotification}
        />

        {/* Profil */}
        <ProfileDropdown user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
