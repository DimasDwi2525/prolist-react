import { useState, useEffect, useRef } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Badge from "@mui/material/Badge";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { AnimatePresence, motion } from "framer-motion";
import ViewPhcModal from "./modal/ViewPhcModal";
import ViewWorkOrderModal from "./modal/ViewWorkOrderModal";
import ViewLogModal from "./modal/ViewLogModal";
import api from "../api/api";

const _ = motion; // suppress unused var warning

export default function NotificationDropdown({ notifications, onRead }) {
  const [open, setOpen] = useState(false);
  const [selectedPhcId, setSelectedPhcId] = useState(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [openPhcModal, setOpenPhcModal] = useState(false);
  const [openWorkOrderModal, setOpenWorkOrderModal] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [phcApproval, setPhcApproval] = useState(null);
  const [workOrderApproval, setWorkOrderApproval] = useState(null);
  const [logApproval, setLogApproval] = useState(null);
  const dropdownRef = useRef(null);

  // Close kalau klik di luar dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {}, [notifications]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Filter notifications to show only those from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentNotifications = safeNotifications.filter((notif) => {
    const createdAt = new Date(notif.created_at);
    return createdAt >= sevenDaysAgo;
  });

  // Persist read status to localStorage
  useEffect(() => {
    const readNotifications = safeNotifications
      .filter((notif) => notif.read_at)
      .map((notif) => notif.id);
    localStorage.setItem(
      "readNotifications",
      JSON.stringify(readNotifications)
    );
  }, [safeNotifications]);

  // Load read status from localStorage on component mount
  useEffect(() => {
    const storedReadNotifications = localStorage.getItem("readNotifications");
    if (storedReadNotifications) {
      // Note: We can't modify the notifications prop directly, but we can use it for display logic
      // The actual read status is managed by the parent component
    }
  }, []);

  const unreadCount = recentNotifications.filter(
    (n) => n.read_at == null
  ).length;

  const handleMarkAsRead = (id) => {
    // Only allow mark as read for notifications with valid database IDs
    // Real-time notifications use Date.now() as temporary ID and can't be marked as read
    if (id && typeof id === "number" && id > 1000000000000) {
      // This is likely a temporary ID from real-time notifications (Date.now() format)
      console.log(
        "Skipping mark as read for real-time notification with temporary ID:",
        id
      );
      return;
    }
    onRead(id);
  };

  const handleNotificationClick = async (notif) => {
    console.log("🔔 Notification clicked:", notif);
    console.log("🔔 Notification data:", notif.data);

    // Always mark as read when clicked, regardless of ID type
    if (!notif.read_at) {
      onRead(notif.id);
    }

    // Check notification type and open appropriate modal
    // Handle both database notifications (data.type) and real-time notifications (type)
    const type = (notif.data?.type || notif.type)?.toLowerCase();

    if (type === "phc") {
      const phcId = notif.data?.phc_id;
      if (phcId) {
        // Fetch approval data for this PHC
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

        setOpen(false);
        setSelectedPhcId(phcId);
        setOpenPhcModal(true);
      }
    } else if (
      type === "work order" ||
      type === "workorder" ||
      type === "work_order_created" ||
      type === "work_order_updated"
    ) {
      // Handle both database notifications (data.work_order_id) and real-time notifications (work_order_id)
      const workOrderId = notif.data?.work_order_id || notif.work_order_id;
      if (workOrderId) {
        // Fetch approval data for this work order
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

        setOpen(false);
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
        // Fetch approval data for this log
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

        setOpen(false);
        setSelectedLogId(logId);
        setOpenLogModal(true);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    safeNotifications.forEach((notif) => {
      if (!notif.read_at) {
        onRead(notif.id);
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          classes={{
            badge: "bg-red-500 text-white font-semibold",
          }}
        >
          {unreadCount > 0 ? (
            <NotificationsIcon className="text-gray-700 w-6 h-6" />
          ) : (
            <NotificationsNoneIcon className="text-gray-500 w-6 h-6" />
          )}
        </Badge>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-primary-100">
              <h3 className="font-semibold text-gray-800 text-lg">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <NotificationsNoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                recentNotifications.map((notif, index) => {
                  // Check if notification has project number
                  const hasProjectNumber =
                    notif.data?.project_number ||
                    notif.data?.project?.project_number ||
                    notif.data?.pn_number;

                  return (
                    <div
                      key={`notification-${notif.id || index}`}
                      className={`relative group ${
                        !notif.read_at
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <button
                        onClick={() => handleNotificationClick(notif)}
                        className="block w-full text-left p-4 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notif.data?.title ||
                                notif.message ||
                                "PHC Validation Requested"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notif.data?.message ||
                                notif.message ||
                                "New notification"}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notif.created_at
                                ? (() => {
                                    const createdDate = new Date(
                                      notif.created_at
                                    );
                                    const now = new Date();
                                    const diffInHours = Math.floor(
                                      (now - createdDate) / (1000 * 60 * 60)
                                    );

                                    if (diffInHours < 1) {
                                      return "Just now";
                                    } else if (diffInHours < 24) {
                                      return `${diffInHours} hour${
                                        diffInHours > 1 ? "s" : ""
                                      } ago`;
                                    } else {
                                      const diffInDays = Math.floor(
                                        diffInHours / 24
                                      );
                                      return `${diffInDays} day${
                                        diffInDays > 1 ? "s" : ""
                                      } ago`;
                                    }
                                  })()
                                : "Just now"}
                            </p>
                          </div>
                          {!notif.read_at && (
                            <div className="ml-3 flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Mark as read button on hover - only show if no project number */}
                      {!notif.read_at && !hasProjectNumber && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200"
                        >
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors text-center">
                  View All Notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modals */}
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
