import { useState, useEffect } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUser, getToken } from "../utils/storage";
import api from "../api/api";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

export default function MainLayout({ children }) {
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const fullScreenHandle = useFullScreenHandle();

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
        console.log("📥 Notifikasi lama:", res.data);
        setNotifications(res.data.notifications || []);
      })
      .catch((err) => {
        console.error("❌ Error fetch notifikasi:", err);
      });
  }, []); // hanya sekali untuk notifikasi

  // No need to fetch projects, assume user listens to all possible channels or specific ones

  useEffect(() => {
    // Listen realtime notifikasi baru
    if (!user || !getToken()) return;

    const token = getToken();

    window.Pusher = Pusher;
    window.Echo = new Echo({
      broadcaster: "pusher",
      key: import.meta.env.VITE_PUSHER_APP_KEY,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      forceTLS: true,
      authEndpoint: "http://127.0.0.1:8000/api/broadcasting/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });

    console.log("✅ Echo initialized for user:", user.id);

    const phcChannel = window.Echo.channel("phc.created")
      .listen(".phc.created", (e) => {
        console.log("🔥 PHC baru dibuat:", e);
        console.log("Current user ID:", user.id, "Type:", typeof user.id);
        console.log(
          "User IDs in event:",
          e.user_ids,
          "Types:",
          e.user_ids.map((id) => typeof id)
        );
        if (
          (e.user_ids.includes(String(user.id)) ||
            e.user_ids.includes(Number(user.id))) &&
          !shownPhcIds.has(e.id)
        ) {
          setShownPhcIds((prev) => new Set(prev).add(e.id));
          setNotifications((prev) => [{ ...e, read_at: null }, ...prev]);
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
        console.log("🔥 Request Invoice baru dibuat:", e);
        if (e.user_ids.includes(user.id) && !shownRequestInvoiceIds.has(e.id)) {
          setShownRequestInvoiceIds((prev) => new Set(prev).add(e.id));
          const notification = {
            ...e,
            created_at: new Date().toISOString(),
            id: Date.now(), // temporary ID for real-time notifications
            read_at: null,
          };
          setNotifications((prev) => [notification, ...prev]);
          toast.success(e.message, { duration: 5000 });
        }
      })
      .error((err) => console.error("❌ Echo channel error:", err));

    const notifChannel = window.Echo.channel(
      `App.Models.User.${user.id}`
    ).notification((notif) => {
      console.log("🔔 Notifikasi baru via notification:", notif);
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
        toast.success(notif.data?.message || "Notifikasi baru!", {
          duration: 5000,
        });
      }
    });

    // Listen to log events on public channel
    const logCreatedChannel = window.Echo.channel("log.created")
      .listen(".log.created", (e) => {
        console.log("🔥 Log created event received:", e);
        console.log("Current user ID:", user.id);
        console.log("User IDs in event:", e.user_ids);
        if (e.user_ids.includes(user.id) && !shownLogIds.has(e.log_id)) {
          console.log("✅ Showing notification for log:", e.log_id);
          setShownLogIds((prev) => new Set(prev).add(e.log_id));
          setNotifications((prev) => [{ ...e, read_at: null }, ...prev]);
          toast.success(e.message, { duration: 5000 });
        } else {
          console.log(
            "❌ Notification not shown: user not in list or already shown"
          );
        }
      })
      .error((err) => console.error("❌ Echo channel error:", err));

    const logApprovalChannel = window.Echo.channel(`App.Models.User.${user.id}`)
      .listen(".log.approval.updated", (e) => {
        console.log("🔥 Log approval updated:", e);
        if (!shownLogApprovalIds.has(e.id)) {
          setShownLogApprovalIds((prev) => new Set(prev).add(e.id));
          setNotifications((prev) => [{ ...e, read_at: null }, ...prev]);
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
        console.log("🔥 Work Order created event received:", e);
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
          toast.success(e.message, { duration: 5000 });
        }
      })
      .error((err) =>
        console.error("❌ Echo channel error for work order created:", err)
      );

    const workOrderUpdatedChannel = window.Echo.channel("workorder.updated")
      .listen(".workorder.updated", (e) => {
        console.log("🔥 Work Order updated event received:", e);
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

    return () => {
      phcChannel.stopListening(".phc.created");
      requestInvoiceChannel.stopListening(".request.invoice.created");
      notifChannel.stopListening("notification");
      logCreatedChannel.stopListening(".log.created");
      logApprovalChannel.stopListening(".log.approval.updated");
      workOrderCreatedChannel.stopListening(".workorder.created");
      workOrderUpdatedChannel.stopListening(".workorder.updated");
    };
  }, []); // only once

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
          <Sidebar role={user.role?.name} sidebarOpen={sidebarOpen} />

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
              />
            )}

            <main className="flex-1 overflow-y-auto p-3 md:p-4">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Toaster />
    </FullScreen>
  );
}
