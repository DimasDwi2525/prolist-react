import { useEffect } from "react";
import notificationSound from "../../../public/notification/mixkit-bell-notification-933.wav";

export default function MessageNotificationModal({
  isOpen,
  onClose,
  message,
  sender,
}) {
  // Unlock audio playback on user interaction
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio(notificationSound);
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          window.removeEventListener("click", unlockAudio);
        })
        .catch((err) => console.log("Audio unlock blocked:", err));
    };

    window.addEventListener("click", unlockAudio);

    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // Play notification sound when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const audio = new Audio(notificationSound);
        audio.volume = 0.5; // Set volume to 50%
        audio.play().catch((error) => {
          console.error("Error playing notification sound:", error);
        });
      } catch (error) {
        console.error("Error playing notification sound:", error);
      }
    }
  }, [isOpen]);

  if (!isOpen || !message || !sender) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-lg">
                {sender.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                New Message
              </h3>
              <p className="text-sm text-gray-500">From {sender.name}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-900">{message}</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
