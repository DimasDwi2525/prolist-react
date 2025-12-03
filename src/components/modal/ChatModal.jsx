import { useState, useEffect, useRef } from "react";
import api from "../../api/api";
import { getToken } from "../../utils/storage";

export default function ChatModal({
  isOpen,
  onClose,
  selectedUser,
  currentUser,
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && selectedUser) {
      // Listen for incoming messages from the selected user
      if (!window.Echo) return;

      const channel = window.Echo.channel("admin.messages").listen(
        ".admin.message.sent",
        (e) => {
          // Only add messages from the selected user to this chat
          if (
            e.sender.id === selectedUser.id &&
            e.sender.id !== currentUser.id
          ) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                message: e.message,
                sender: e.sender,
                timestamp: e.timestamp,
                isMine: false,
              },
            ]);
          }
        }
      );

      return () => {
        channel.stopListening(".admin.message.sent");
      };
    }
  }, [isOpen, selectedUser, currentUser]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser) return;

    console.log(
      "📤 Sending message:",
      message.trim(),
      "to user:",
      selectedUser.name,
      "ID:",
      selectedUser.id
    );

    setIsLoading(true);
    try {
      const token = getToken();
      const response = await api.post(
        "/admin/broadcast/users",
        {
          message: message.trim(),
          user_ids: [selectedUser.id],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("📤 API Response:", response.data);

      if (response.data.success) {
        console.log("✅ Message sent successfully");
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            message: message.trim(),
            sender: currentUser,
            timestamp: new Date().toISOString(),
            isMine: true,
          },
        ]);
        setMessage("");
      } else {
        console.log("❌ Message send failed:", response.data);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl w-80 h-96 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {selectedUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {selectedUser.name}
            </h3>
            <p className="text-xs text-gray-500">
              {selectedUser.role || "No role"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.isMine
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.isMine ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || isLoading}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
