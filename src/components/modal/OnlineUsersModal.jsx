export default function OnlineUsersModal({ isOpen, onlineUsers, onUserClick }) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl w-64 max-h-80 overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          Online Users ({onlineUsers.length})
        </h3>
      </div>
      <div className="p-2">
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No users online
          </p>
        ) : (
          onlineUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserClick(user)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role || "No role"}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
