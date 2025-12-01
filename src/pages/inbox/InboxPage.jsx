import { useState, useEffect } from "react";
import {
  Email as EmailIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  NotificationsNone as NotificationsNoneIcon,
} from "@mui/icons-material";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Badge,
} from "@mui/material";
import ViewPhcModal from "../../components/modal/ViewPhcModal";
import ViewWorkOrderModal from "../../components/modal/ViewWorkOrderModal";
import ViewLogModal from "../../components/modal/ViewLogModal";
import api from "../../api/api";

const ITEMS_PER_PAGE = 50;

export default function InboxPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhcId, setSelectedPhcId] = useState(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [openPhcModal, setOpenPhcModal] = useState(false);
  const [openWorkOrderModal, setOpenWorkOrderModal] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [phcApproval, setPhcApproval] = useState(null);
  const [workOrderApproval, setWorkOrderApproval] = useState(null);
  const [logApproval, setLogApproval] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications/all");
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    if (!id || id === "undefined") {
      console.error("Invalid notification ID:", id);
      return;
    }

    // Only mark as read in database for real database notifications (UUID format)
    const isDatabaseNotification = typeof id === "string" && id.includes("-");

    if (isDatabaseNotification) {
      try {
        await api.post(`/notifications/${id}/read`);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Always mark as read locally
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date() } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read_at);
    for (const notification of unreadNotifications) {
      await handleMarkAsRead(notification.id);
    }
    setMenuAnchorEl(null);
  };

  const handleNotificationClick = async (notif) => {
    console.log("🔔 Notification clicked:", notif);
    console.log("🔔 Notification data:", notif.data);

    // Always mark as read when clicked, regardless of ID type
    if (!notif.read_at) {
      await handleMarkAsRead(notif.id);
    }

    // Check notification type and open appropriate modal
    const type = (notif.data?.type || notif.type)?.toLowerCase();

    if (type === "phc") {
      const phcId = notif.data?.phc_id;
      if (phcId) {
        try {
          const approvalsRes = await api.get("/approvals");
          const approvals = Array.isArray(approvalsRes.data)
            ? approvalsRes.data
            : approvalsRes.data.data;
          const approval = approvals.find(
            (a) =>
              a.approvable?.project?.phc?.id === phcId && a.status === "pending"
          );
          setPhcApproval(approval);
        } catch (err) {
          console.error("Error fetching PHC approval:", err);
        }

        setSelectedPhcId(phcId);
        setOpenPhcModal(true);
      }
    } else if (
      type === "work order" ||
      type === "workorder" ||
      type === "work_order_created" ||
      type === "work_order_updated"
    ) {
      const workOrderId = notif.data?.work_order_id || notif.work_order_id;
      if (workOrderId) {
        try {
          const approvalsRes = await api.get("/approvals");
          const approvals = Array.isArray(approvalsRes.data)
            ? approvalsRes.data
            : approvalsRes.data.data;
          const approval = approvals.find(
            (a) => a.approvable?.id === workOrderId && a.status === "pending"
          );
          setWorkOrderApproval(approval);
        } catch (err) {
          console.error("Error fetching work order approval:", err);
        }

        setSelectedWorkOrderId(workOrderId);
        setOpenWorkOrderModal(true);
      }
    } else if (
      type === "log" ||
      type === "log_created" ||
      type === "log_update"
    ) {
      const logId = notif.data?.log_id;
      if (logId) {
        try {
          const approvalsRes = await api.get("/approvals");
          const approvals = Array.isArray(approvalsRes.data)
            ? approvalsRes.data
            : approvalsRes.data.data;
          const approval = approvals.find(
            (a) => a.approvable?.id === logId && a.status === "pending"
          );
          setLogApproval(approval);
        } catch (err) {
          console.error("Error fetching log approval:", err);
        }

        setSelectedLogId(logId);
        setOpenLogModal(true);
      }
    }
  };

  const getNotificationIcon = (type) => {
    const lowerType = (type || "").toLowerCase();
    if (lowerType.includes("phc")) return "📋";
    if (lowerType.includes("work")) return "🔧";
    if (lowerType.includes("log")) return "📝";
    if (lowerType.includes("invoice")) return "💰";
    return "🔔";
  };

  const getNotificationTypeColor = (type) => {
    const lowerType = (type || "").toLowerCase();
    if (lowerType.includes("phc")) return "bg-blue-100 text-blue-800";
    if (lowerType.includes("work")) return "bg-green-100 text-green-800";
    if (lowerType.includes("log")) return "bg-purple-100 text-purple-800";
    if (lowerType.includes("invoice")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const createdDate = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - createdDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Pagination logic
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <EmailIcon className="text-gray-600 w-6 h-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
          {unreadCount > 0 && (
            <Badge
              badgeContent={unreadCount}
              color="error"
              classes={{
                badge: "bg-red-500 text-white font-semibold",
              }}
            >
              <span></span>
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-gray-900">
                {notifications.length}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">Unread:</span>
              <span className="font-semibold text-red-600">{unreadCount}</span>
            </div>
          </div>
          <IconButton
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            className="text-gray-500 hover:text-gray-700"
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={() => setMenuAnchorEl(null)}
            PaperProps={{
              elevation: 2,
              sx: { minWidth: 200 },
            }}
          >
            <MenuItem onClick={handleMarkAllAsRead}>
              <ListItemIcon>
                <MarkEmailReadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mark all as read</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-100">
        {currentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <NotificationsNoneIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              When you have notifications, they'll appear here in a clean,
              organized list.
            </p>
          </div>
        ) : (
          currentNotifications.map((notif, index) => {
            const type = (notif.data?.type || notif.type)?.toLowerCase();
            const isUnread = !notif.read_at;

            return (
              <div
                key={`notification-${notif.id || index}`}
                className={`group hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                  isUnread ? "bg-blue-50/30" : ""
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-center p-4 space-x-4">
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0">
                    <Avatar
                      className={`w-10 h-10 ${
                        isUnread ? "ring-2 ring-blue-200" : ""
                      }`}
                    >
                      {getNotificationIcon(type)}
                    </Avatar>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Chip
                          label={
                            type === "phc"
                              ? "PHC"
                              : type?.includes("work")
                              ? "Work Order"
                              : type?.includes("log")
                              ? "Log"
                              : type?.includes("invoice")
                              ? "Invoice"
                              : "Notification"
                          }
                          size="small"
                          className={`text-xs font-medium ${getNotificationTypeColor(
                            type
                          )}`}
                        />
                        {isUnread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {notif.data?.title || notif.message || "New notification"}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {notif.data?.message ||
                        notif.message ||
                        "You have a new notification"}
                    </p>

                    {/* Project info if available */}
                    {(notif.data?.project_number ||
                      notif.data?.pn_number ||
                      notif.data?.project?.project_number) && (
                      <div className="mt-2">
                        <Chip
                          label={`Project: ${
                            notif.data?.project_number ||
                            notif.data?.pn_number ||
                            notif.data?.project?.project_number
                          }`}
                          size="small"
                          variant="outlined"
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUnread && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, notifications.length)} of {notifications.length}{" "}
            notifications
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      pageNum === currentPage
                        ? "bg-primary-600 text-white border-primary-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ViewPhcModal
        open={openPhcModal}
        handleClose={() => {
          setOpenPhcModal(false);
          setSelectedPhcId(null);
          setPhcApproval(null);
        }}
        phcId={selectedPhcId}
        isFromApprovalPage={true}
        approval={phcApproval}
      />

      <ViewWorkOrderModal
        open={openWorkOrderModal}
        onClose={() => {
          setOpenWorkOrderModal(false);
          setSelectedWorkOrderId(null);
          setWorkOrderApproval(null);
        }}
        workOrderId={selectedWorkOrderId}
        isFromApprovalPage={true}
        approval={workOrderApproval}
      />

      <ViewLogModal
        open={openLogModal}
        onClose={() => {
          setOpenLogModal(false);
          setSelectedLogId(null);
          setLogApproval(null);
        }}
        logId={selectedLogId}
        isFromApprovalPage={true}
        approval={logApproval}
      />
    </div>
  );
}
