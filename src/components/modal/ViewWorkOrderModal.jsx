import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
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

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const display = (value) =>
  value !== undefined && value !== null && value !== "" ? value : "—";

export default function ViewWorkOrderModal({
  open,
  onClose,
  workOrderId,
  isFromApprovalPage = false,
  approval,
}) {
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");

  // 🔹 Fetch work order detail ketika modal dibuka
  useEffect(() => {
    if (!open || !workOrderId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/work-order/detail/${workOrderId}`);
        console.log(res.data.data);
        setWorkOrder(res.data.data); // pastikan sesuai struktur API kamu
      } catch (err) {
        console.error("Error fetching work order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, workOrderId]);

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/work-orders/${workOrder.id}/pdf`, {
        responseType: "blob",
      });

      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `Work-Order-${workOrder.wo_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
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
      await api.post(`/approvals/wo/${approval.id}/status`, {
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="font-bold text-gray-800 text-xl">
        📄 Work Order Detail
      </DialogTitle>

      <DialogContent dividers>
        {/* ================= General Info ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            General Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Work Order No", value: workOrder?.wo_kode_no },
              {
                label: "Project Number",
                value: workOrder?.project?.project_number,
              },
              {
                label: "Client",
                value:
                  workOrder?.project?.client?.name ||
                  workOrder?.project?.quotation?.client?.name,
              },
              {
                label: "Project Name",
                value: workOrder?.project?.project_name,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {item.label}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {display(item.value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= Purpose & Status ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Purpose & Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {workOrder?.purpose?.name || "—"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {workOrder?.status || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* ================= Mandays & Approval ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Mandays & Approval
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mandays
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                Engineer: {workOrder?.total_mandays_eng || 0}, Electrician:{" "}
                {workOrder?.total_mandays_elect || 0}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Additional Work
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {workOrder?.add_work ? "Yes" : "No"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested By
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {display(workOrder?.creator?.name)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approved By
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {display(workOrder?.approver?.name)}
              </p>
            </div>
          </div>
        </section>

        {/* ================= Schedule & Time ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Schedule & Time
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { label: "WO Date", value: formatDate(workOrder?.wo_date) },
              {
                label: "Planned Start",
                value: formatDate(workOrder?.scheduled_start_working_date),
              },
              {
                label: "Planned End",
                value: formatDate(workOrder?.scheduled_end_working_date),
              },
              {
                label: "Daily Work Time",
                value: `${formatTime(
                  workOrder?.start_work_time
                )} – ${formatTime(workOrder?.stop_work_time)}`,
              },
              {
                label: "Continuation",
                value: `${formatDate(workOrder?.continue_date)} ${
                  workOrder?.continue_time || ""
                }`,
              },
              {
                label: "Actual Start",
                value: formatDate(workOrder?.actual_start_working_date),
              },
              {
                label: "Actual End",
                value: formatDate(workOrder?.actual_end_working_date),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between"
              >
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {item.label}
                </h3>
                <p className="text-sm font-medium text-gray-900">
                  {display(item.value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= PICs ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            PICs
          </h2>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            {workOrder?.pics?.length > 0 ? (
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.pics.map((pic, idx) => (
                    <tr
                      key={pic.id}
                      className={`${
                        idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-indigo-50 transition-colors`}
                    >
                      <td className="px-4 py-2">{display(pic.user?.name)}</td>
                      <td className="px-4 py-2">{display(pic.role?.name)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>
        </section>

        {/* ================= Descriptions ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Descriptions
          </h2>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            {workOrder?.descriptions?.length > 0 ? (
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-4 py-2 text-left font-medium">
                      Description
                    </th>
                    <th className="px-4 py-2 text-left font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.descriptions.map((desc, idx) => (
                    <tr
                      key={desc.id}
                      className={`${
                        idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-indigo-50 transition-colors`}
                    >
                      <td className="px-4 py-2">{display(desc.description)}</td>
                      <td className="px-4 py-2">{display(desc.result)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>
        </section>

        {/* ================= Client Notes ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Client Notes
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {workOrder?.client_note || "—"}
            </p>
          </div>
        </section>

        {/* ================= Material & Additional Work ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Material & Additional Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                label: "Material Required",
                value: workOrder?.material_required,
              },
              {
                label: "Additional Work",
                value: workOrder?.add_work ? "Yes" : "No",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {item.label}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {display(item.value)}
                </p>
              </div>
            ))}
          </div>
        </section>
        {/* ================= Approval ================= */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Approval
          </h2>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center w-full">
              {[
                { label: "Requested By", value: workOrder?.creator?.name },
                { label: "Approved By", value: workOrder?.approver?.name },
                { label: "Accepted By", value: workOrder?.acceptor?.name },
                {
                  label: "Client Approve",
                  value: workOrder?.client_approve?.name,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center w-full"
                >
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-16">
                    {item.label}
                  </p>
                  <div className="w-full border-t border-gray-300 pt-2">
                    <p className="text-sm font-medium text-gray-900">
                      {display(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
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
        <Button onClick={handleDownloadPdf} variant="contained" color="primary">
          Print / Download PDF
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
