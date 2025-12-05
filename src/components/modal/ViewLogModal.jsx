import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Chip,
  TextField,
} from "@mui/material";
import api from "../../api/api";
import Swal from "sweetalert2";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${date.getFullYear()}`;
};

const display = (value) =>
  value !== undefined && value !== null && value !== "" ? value : "—";

export default function ViewLogModal({
  open,
  onClose,
  logId,
  isFromApprovalPage = false,
  approval,
}) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");

  // Fetch log detail and users when modal opens
  useEffect(() => {
    if (!open || !logId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [logRes, usersRes] = await Promise.all([
          api.get(`/logs/${logId}`),
          api.get("/users"),
        ]);
        console.log(logRes.data);
        setLog(logRes.data); // Assume res.data is the log object
        setUsers(usersRes.data.data || []);
      } catch (err) {
        console.error("Error fetching log:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, logId]);

  const statusColors = {
    "waiting approval": "warning",
    open: "success",
    closed: "error",
  };

  const handleApprove = () => {
    setPinModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!pin) {
      Swal.fire({
        icon: "warning",
        title: "PIN Required",
        text: "PIN is required",
      });
      return;
    }

    try {
      await api.post(`/approvals/log/${approval.id}/status`, {
        status: "approved",
        pin,
      });
      setPin("");
      setPinModalOpen(false);
      onClose(); // Close modal after success

      // Show success message and refresh approvals
      Swal.fire({
        icon: "success",
        title: "Approval Successful",
        text: "Item has been successfully approved",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        // Trigger refresh by dispatching custom event
        window.dispatchEvent(new CustomEvent("approvalSuccess"));
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Terjadi kesalahan",
      });
    }
  };

  // Reset pin when pin modal is closed
  useEffect(() => {
    if (!pinModalOpen) {
      setPin("");
    }
  }, [pinModalOpen]);

  // Reset pin when main modal closes
  useEffect(() => {
    if (!open) {
      setPin("");
      setPinModalOpen(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="font-bold text-gray-800 text-xl">
        📝 Log Detail
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <CircularProgress />
          </div>
        ) : log ? (
          <div className="space-y-6">
            {/* General Info */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                General Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Log Date", value: formatDate(log.tgl_logs) },
                  {
                    label: "Created By",
                    value:
                      log.user?.name ||
                      users.find((u) => u.id === log.user_id)?.name,
                  },
                  { label: "Category", value: log.category?.name },
                  {
                    label: "Status",
                    value: (
                      <Chip
                        label={log.status}
                        color={statusColors[log.status] || "default"}
                        size="small"
                      />
                    ),
                  },
                  {
                    label: "Response User",
                    value:
                      log.response_user?.name ||
                      users.find((u) => u.id === log.response_user_id)?.name,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {item.label}
                    </h3>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {display(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Project Information */}
            {log.project && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  📋 Project Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Project Name", value: log.project.project_name },
                    {
                      label: "Project Number",
                      value: log.project.project_number,
                    },
                    {
                      label: "Client Name",
                      value:
                        log.project.client?.name ||
                        log.project.quotation?.client?.name,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">
                        {item.label}
                      </h3>
                      <p className="text-sm font-semibold text-gray-900">
                        {display(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Log Details */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                📝 Log Details
              </h2>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {display(log.logs)}
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">No log data available.</p>
          </div>
        )}
      </DialogContent>

      <DialogActions>
        {isFromApprovalPage && approval?.status === "pending" && (
          <Button onClick={handleApprove} variant="contained" color="success">
            Approve
          </Button>
        )}
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>

      {/* PIN Modal for Approval */}
      <Dialog
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <TextField
            label="PIN"
            type="password"
            fullWidth
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPinModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmApprove} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
