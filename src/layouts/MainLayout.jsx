import { useState, useEffect } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import OnlineUsersModal from "../components/modal/OnlineUsersModal";
import ChatModal from "../components/modal/ChatModal";
import MessageNotificationModal from "../components/modal/MessageNotificationModal";
import { getUser, getToken } from "../utils/storage";
import api from "../api/api";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import notificationSound from "../../public/notification/mixkit-bell-notification-933.wav";

const roleMapping = {
  super_admin: "admin",
  marketing_director: "admin",
  engineering_director: "admin",
  "supervisor marketing": "marketing",
  manager_marketing: "marketing",
  sales_supervisor: "marketing",
  marketing_admin: "marketing",
  marketing_estimator: "marketing",
  engineer: "manPower",
  "project controller": "engineer",
  "project manager": "engineer",
  warehouse: "suc",
  engineering_admin: "engineer",
  engineer_supervisor: "manPower",
  drafter: "manPower",
  site_engineer: "manPower",
  electrician_supervisor: "manPower",
  electrician: "manPower",

  acc_fin_manager: "finance",
  acc_fin_supervisor: "finance",
  finance_administration: "finance",
};

export default function MainLayout({ children }) {
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const fullScreenHandle = useFullScreenHandle();

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio(notificationSound);
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch((error) => {
        console.error("Error playing notification sound:", error);
      });
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [shownLogIds, setShownLogIds] = useState(new Set());
  const [shownPhcIds, setShownPhcIds] = useState(new Set());
  const [shownRequestInvoiceIds, setShownRequestInvoiceIds] = useState(
    new Set()
  );
  const [shownNotifIds, setShownNotifIds] = useState(new Set());
  const [shownLogApprovalIds, setShownLogApprovalIds] = useState(new Set());
  const [shownWorkOrderCreatedIds, setShownWorkOrderCreatedIds] = useState(
    new Set()
  );
  const [shownWorkOrderUpdatedIds, setShownWorkOrderUpdatedIds] = useState(
    new Set()
  );

  const [shownPhcApprovalUpdateIds, setShownPhcApprovalUpdateIds] = useState(
    new Set()
  );
  const [shownWorkOrderApprovalUpdateIds, setShownWorkOrderApprovalUpdateIds] =
    useState(new Set());

  const [projects, setProjects] = useState([]);

  // Online users state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [isMessageNotificationOpen, setIsMessageNotificationOpen] =
    useState(false);

  // Sidebar counters
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingRequestInvoices, setPendingRequestInvoices] = useState(0);

  // Handler functions for chat
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsOnlineUsersOpen(false);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedUser(null);
  };

  const handleCloseMessageNotification = () => {
    setIsMessageNotificationOpen(false);
    setIncomingMessage(null);
  };

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

  // Fetch initial sidebar counters
  useEffect(() => {
    if (!user) return;

    const token = getToken();
    if (!token) return;

    // Fetch unread notifications count
    api
      .get("/notifications/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const notifications = res.data?.notifications || [];
        const unreadCount = notifications.filter((n) => !n.read_at).length;
        setUnreadNotifications(unreadCount);
      })
      .catch((err) => {
        console.error("Failed to fetch unread notifications count:", err);
        setUnreadNotifications(0);
      });

    // Fetch pending approvals count
    api
      .get("/approvals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const approvals = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        const pendingCount = approvals.filter(
          (a) => a.status === "pending"
        ).length;
        setPendingApprovals(pendingCount);
      })
      .catch((err) => {
        console.error("Failed to fetch pending approvals count:", err);
        setPendingApprovals(0);
      });

    // Fetch pending request invoices count (only for finance and engineer roles)
    const mappedRole = roleMapping[user.role?.name] || user.role?.name;
    if (mappedRole === "finance" || mappedRole === "engineer") {
      api
        .get("/request-invoices-list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          const data = res.data?.data || [];
          const pendingCount = data.filter(
            (item) => item.status === "pending"
          ).length;
          setPendingRequestInvoices(pendingCount);
        })
        .catch((err) => {
          console.error("Failed to fetch pending request invoices count:", err);
          setPendingRequestInvoices(0);
        });
    }
  }, [user]);

  // Real-time updates for sidebar counters
  useEffect(() => {
    if (!window.Echo) return;

    const sidebarCounterChannel = window.Echo.channel("sidebar.counter.updated")
      .listen(".sidebar.counter.updated", (e) => {
        setUnreadNotifications(e.notificationUnread || 0);
        setPendingApprovals(e.approvalPending || 0);
        setPendingRequestInvoices(e.requestInvoice || 0);
      })
      .error((err) => {
        console.error("❌ Echo channel error for sidebar counter:", err);
      });

    return () => {
      sidebarCounterChannel.stopListening(".sidebar.counter.updated");
    };
  }, []);

  const userId = user?.id;

  // Listen for admin messages on public channel
  useEffect(() => {
    if (!user || !getToken()) return;

    if (!window.Echo) return;

    // Listen to public channel for all messages (broadcast and private)
    const publicChannel = window.Echo.channel("admin.messages")
      .listen(".admin.message.sent", (e) => {
        // Show notification modal for incoming messages
        // For broadcast: show to all except sender
        // For private: show only if user is in targetUsers
        if (
          e.sender.id !== userId &&
          (e.type === "broadcast" ||
            (e.type === "private" &&
              e.targetUsers &&
              e.targetUsers.includes(userId)))
        ) {
          setIncomingMessage({
            message: e.message,
            sender: e.sender,
          });
          setIsMessageNotificationOpen(true);
          playNotificationSound();
          toast.success(e.message, { duration: 5000 });
        } else {
          console.log("❌ Message from self or not for this user, ignoring");
        }
      })
      .error((err) => {
        console.error("❌ Echo channel error for public admin messages:", err);
      });

    return () => {
      console.log("🔇 Cleaning up admin message listeners");
      publicChannel.stopListening(".admin.message.sent");
    };
  }, [userId]); // Use userId to prevent constant re-runs

  useEffect(() => {
    if (!user) return;

    // Ambil notifikasi lama
    const token = getToken();
    if (!token) return;

    api
      .get("/notifications/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setNotifications(res.data.notifications || []);
      })
      .catch((err) => {
        console.error("❌ Error fetch notifikasi:", err);
      });

    // Fetch user projects for log approval channels
    api
      .get("/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setProjects(res.data?.data || []);
      })
      .catch((err) => {
        console.error("❌ Error fetch projects:", err);
      });
  }, []); // hanya sekali untuk notifikasi dan projects

  // Online users presence channel - separate useEffect to run independently
  useEffect(() => {
    if (!user || !getToken()) {
      // Clear online users when user logs out
      setOnlineUsers([]);
      return;
    }

    const token = getToken();

    // Initialize Echo if not already done
    if (!window.Echo) {
      window.Pusher = Pusher;
      window.Echo = new Echo({
        broadcaster: "reverb",
        key: "ur5wyexnhstdyw0qigqc",
        wsHost: "127.0.0.1",
        wsPort: 8080,
        enabledTransports: ["ws", "wss"],
        forceTLS: false,
        authEndpoint: "http://localhost:8000/api/broadcasting/auth",
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      });

      window.Echo.connector.pusher.connection.bind("connected", () => {});

      window.Echo.connector.pusher.connection.bind("error", (err) => {
        console.error("❌ Reverb connection error:", err);
      });
    }

    // Online users presence channel
    window.Echo.join("online-users")
      .here((users) => {
        setOnlineUsers(users);
      })
      .joining((user) => {
        setOnlineUsers((prev) => {
          // Check if user already exists to prevent duplicates
          const exists = prev.some((u) => u.id === user.id);
          return exists ? prev : [...prev, user];
        });
      })
      .leaving((user) => {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
      })
      .error((err) => {
        console.error("❌ Echo channel error for online users:", err);
      });

    return () => {
      // Presence channel cleanup is handled automatically by Echo
    };
  }, [user]); // Only depend on user, not projects

  useEffect(() => {
    // Listen realtime notifikasi baru
    if (!user || !getToken() || projects.length === 0) return;

    const token = getToken();

    // Use existing Echo instance
    if (!window.Echo) {
      window.Pusher = Pusher;
      window.Echo = new Echo({
        broadcaster: "reverb",
        key: "ur5wyexnhstdyw0qigqc",
        wsHost: "127.0.0.1",
        wsPort: 8080,
        enabledTransports: ["ws", "wss"],
        forceTLS: false,
        authEndpoint: "http://localhost:8000/api/broadcasting/auth",
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      });

      window.Echo.connector.pusher.connection.bind("connected", () => {});

      window.Echo.connector.pusher.connection.bind("error", (err) => {
        console.error("❌ Reverb connection error:", err);
      });
    }

    const phcChannel = window.Echo.channel("phc_created")
      .listen(".phc_created", (e) => {
        if (
          (e.user_ids.includes(String(user.id)) ||
            e.user_ids.includes(Number(user.id))) &&
          !shownPhcIds.has(e.phc_id)
        ) {
          setShownPhcIds((prev) => new Set(prev).add(e.phc_id));
          setNotifications((prev) => [
            { ...e, id: e.phc_id, read_at: null },
            ...prev,
          ]);
          playNotificationSound();
          toast.success(e.message, { duration: 5000 });
        } else {
          console.log(
            "User not in list or already shown, no notification shown"
          );
        }
      })
      .error((err) => console.error("❌ Echo channel error:", err));

    const requestInvoiceChannel = window.Echo.channel("request.invoice.created")
      .listen(".request.invoice.created", (e) => {
        if (e.user_ids.includes(user.id) && !shownRequestInvoiceIds.has(e.id)) {
          setShownRequestInvoiceIds((prev) => new Set(prev).add(e.id));
          const notification = {
            ...e,
            created_at: new Date().toISOString(),
            id: Date.now(), // temporary ID for real-time notifications
            read_at: null,
          };
          setNotifications((prev) => [notification, ...prev]);
          playNotificationSound();
          toast.success(e.message, { duration: 5000 });
        }
      })
      .error((err) => console.error("❌ Echo channel error:", err));

    const notifChannel = window.Echo.channel(
      `App.Models.User.${user.id}`
    ).notification((notif) => {
      if (!shownNotifIds.has(notif.id)) {
        setShownNotifIds((prev) => new Set(prev).add(notif.id));
        // Use the actual notification data structure from database
        const notificationData = {
          id: notif.id,
          type: notif.type,
          data: notif.data,
          read_at: notif.read_at,
          created_at: notif.created_at,
          updated_at: notif.updated_at,
        };
        setNotifications((prev) => [notificationData, ...prev]);
        playNotificationSound();
        toast.success(notif.data?.message || "Notifikasi baru!", {
          duration: 5000,
        });
      }
    });

    // Listen to log events on public channel
    const logCreatedChannel = window.Echo.channel("log.created")
      .listen(".log.created", (e) => {
        if (e.user_ids.includes(user.id) && !shownLogIds.has(e.log_id)) {
          setShownLogIds((prev) => new Set(prev).add(e.log_id));
          setNotifications((prev) => [
            {
              ...e,
              type: "log_created",
              data: { log_id: e.log_id, message: e.message },
              id: Date.now(),
              read_at: null,
            },
            ...prev,
          ]);
          playNotificationSound();
          toast.success(e.message, { duration: 5000 });
        } else {
          console.log(
            "❌ Notification not shown: user not in list or already shown"
          );
        }
      })
      .error((err) => console.error("❌ Echo channel error:", err));

    // Listen to log approval updates on public channel
    const logApprovalChannel = window.Echo.channel("log.approval.updated")
      .listen(".log.approval.updated", (e) => {
        // Skip notifying the approver
        if (e.approver_id && e.approver_id === user.id) {
          return;
        }

        if (!shownLogApprovalIds.has(e.log_id)) {
          setShownLogApprovalIds((prev) => new Set(prev).add(e.log_id));
          setNotifications((prev) => [
            {
              ...e,
              type: "log_update",
              data: { log_id: e.log_id, message: e.message },
              id: Date.now(),
              read_at: null,
            },
            ...prev,
          ]);
          playNotificationSound();
          toast.success(e.message || "Log approval updated", {
            duration: 5000,
          });
        }
      })
      .error((err) =>
        console.error("❌ Echo channel error for log approval:", err)
      );

    const workOrderCreatedChannel = window.Echo.channel("workorder.created")
      .listen(".workorder.created", (e) => {
        if (
          e.user_ids.includes(user.id) &&
          !shownWorkOrderCreatedIds.has(e.work_order_id)
        ) {
          setShownWorkOrderCreatedIds((prev) =>
            new Set(prev).add(e.work_order_id)
          );
          const notification = {
            ...e,
            type: "work_order_created", // Add type for real-time notifications
            created_at: new Date().toISOString(),
            id: Date.now(), // temporary ID for real-time notifications
            read_at: null,
          };
          setNotifications((prev) => [notification, ...prev]);
          playNotificationSound();
          toast.success(e.message, { duration: 5000 });
        }
      })
      .error((err) =>
        console.error("❌ Echo channel error for work order created:", err)
      );

    const workOrderUpdatedChannel = window.Echo.channel("workorder.updated")
      .listen(".workorder.updated", (e) => {
        if (
          e.user_ids.includes(user.id) &&
          !shownWorkOrderUpdatedIds.has(e.work_order_id)
        ) {
          setShownWorkOrderUpdatedIds((prev) =>
            new Set(prev).add(e.work_order_id)
          );
          const notification = {
            ...e,
            type: "work_order_updated", // Add type for real-time notifications
            created_at: new Date().toISOString(),
            id: Date.now(), // temporary ID for real-time notifications
            read_at: null,
          };
          setNotifications((prev) => [notification, ...prev]);
          toast.success(e.message, { duration: 5000 });
        }
      })
      .error((err) =>
        console.error("❌ Echo channel error for work order updated:", err)
      );

    // New listener for PHC Approval Updated event
    const phcApprovalUpdatedChannel = window.Echo.channel(
      "phc.approval.updated"
    )
      .listen(".phc.approval.updated", (e) => {
        // Skip notifying the approver
        if (e.approver_id && e.approver_id === user.id) {
          return;
        }

        const phcId = e.phc_id || null;
        if (phcId && !shownPhcApprovalUpdateIds.has(phcId)) {
          setShownPhcApprovalUpdateIds((prev) => new Set(prev).add(phcId));
          const notification = {
            ...e,
            type: "phc_approval_updated",
            created_at: new Date().toISOString(),
            id: Date.now(),
            read_at: null,
          };
          setNotifications((prev) => [notification, ...prev]);
          playNotificationSound();
          toast.success(e.message || "PHC approval updated", {
            duration: 5000,
          });
        }
      })
      .error((err) =>
        console.error("❌ Echo channel error for PHC approval updated:", err)
      );

    // New listener for Work Order Approval Updated event
    const workOrderApprovalUpdatedChannel = window.Echo.channel(
      "work_order.approval.updated"
    )
      .listen(".work_order.approval.updated", (e) => {
        // Skip notifying the approver
        if (e.approver_id && e.approver_id === user.id) {
          return;
        }

        const workOrderId = e.work_order_id || null;
        if (workOrderId && !shownWorkOrderApprovalUpdateIds.has(workOrderId)) {
          setShownWorkOrderApprovalUpdateIds((prev) =>
            new Set(prev).add(workOrderId)
          );
          const notification = {
            ...e,
            type: "work_order_approval_updated",
            created_at: new Date().toISOString(),
            id: Date.now(),
            read_at: null,
          };
          setNotifications((prev) => [notification, ...prev]);
          playNotificationSound();
          toast.success(e.message || "Work Order approval updated", {
            duration: 5000,
          });
        }
      })
      .error((err) =>
        console.error(
          "❌ Echo channel error for Work Order approval updated:",
          err
        )
      );

    return () => {
      phcChannel.stopListening(".phc_created");
      requestInvoiceChannel.stopListening(".request.invoice.created");
      notifChannel.stopListening("notification");
      logCreatedChannel.stopListening(".log.created");
      logApprovalChannel.stopListening(".log.approval.updated");
      workOrderCreatedChannel.stopListening(".workorder.created");
      workOrderUpdatedChannel.stopListening(".workorder.updated");

      phcApprovalUpdatedChannel.stopListening(".phc.approval.updated");
      workOrderApprovalUpdatedChannel.stopListening(
        ".work_order.approval.updated"
      );

      // Presence channel cleanup is handled automatically
    };
  }, [user, projects]); // run when user or projects change

  const handleReadNotification = async (id) => {
    if (!id || id === "undefined") {
      console.error("Invalid notification ID:", id);
      return;
    }

    // Only mark as read in database for real database notifications (UUID format)
    // Real-time notifications use Date.now() IDs and can't be marked as read in DB
    const isDatabaseNotification = typeof id === "string" && id.includes("-");

    if (isDatabaseNotification) {
      try {
        await api.post(`/notifications/${id}/read`);
      } catch (error) {
        console.error("Error marking notification as read:", error);
        // Don't return here, still mark as read locally
      }
    }

    // Always mark as read locally
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date() } : n))
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">You are not logged in</p>
      </div>
    );
  }

  return (
    <FullScreen handle={fullScreenHandle}>
      <div className="h-full min-h-screen flex flex-col bg-gray-100 font-sans">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            role={user.role?.name}
            sidebarOpen={sidebarOpen}
            unreadNotifications={unreadNotifications}
            pendingApprovals={pendingApprovals}
            pendingRequestInvoices={pendingRequestInvoices}
          />

          {/* Overlay untuk mobile */}
          {sidebarOpen === false && window.innerWidth < 768 && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          <div
            className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
              sidebarOpen ? "md:ml-52" : "md:ml-0"
            }`}
          >
            {!fullScreenHandle.active && (
              <Header
                user={user}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                fullScreenHandle={fullScreenHandle}
                notifications={notifications}
                onReadNotification={handleReadNotification}
                onLogout={() => setOnlineUsers([])}
              />
            )}

            <main className="flex-1 overflow-y-auto p-3 md:p-4">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Online Users Component - Only for admin users */}
      {user.name === "admin" && (
        <>
          <div className="fixed bottom-4 right-4 z-50">
            <div className="relative">
              <button
                onClick={() => setIsOnlineUsersOpen(!isOnlineUsersOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-colors"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">
                  Online ({onlineUsers.length})
                </span>
              </button>

              <OnlineUsersModal
                isOpen={isOnlineUsersOpen}
                onlineUsers={onlineUsers}
                onUserClick={handleUserClick}
              />
            </div>
          </div>

          <ChatModal
            isOpen={isChatOpen}
            onClose={handleCloseChat}
            selectedUser={selectedUser}
            currentUser={user}
          />
        </>
      )}

      {/* Message Notification Modal - For all users */}
      <MessageNotificationModal
        isOpen={isMessageNotificationOpen}
        onClose={handleCloseMessageNotification}
        message={incomingMessage?.message}
        sender={incomingMessage?.sender}
      />

      <Toaster />
    </FullScreen>
  );
}
