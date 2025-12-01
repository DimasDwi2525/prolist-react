import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import api from "../../api/api";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import LockIcon from "@mui/icons-material/Lock";
import ViewPhcModal from "../../components/modal/ViewPhcModal";
import ViewWorkOrderModal from "../../components/modal/ViewWorkOrderModal";
import ViewLogModal from "../../components/modal/ViewLogModal";
import VisibilityIcon from "@mui/icons-material/Visibility";
// import Echo from "../../echo";
// import toast from "react-hot-toast";

export default function ApprovalPage() {
  const [openModal, setOpenModal] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // State to force DataGrid rerender on refresh
  const [reloadKey, setReloadKey] = React.useState(0);

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedPhcId, setSelectedPhcId] = useState(null);
  const [openWorkOrderModal, setOpenWorkOrderModal] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

  // Ref untuk tracking approval IDs yang sudah ditampilkan notifikasinya
  // const shownApprovalIdsRef = useRef(new Set());

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/approvals");
      const data = Array.isArray(res.data) ? res.data : res.data.data;
      setApprovals(data || []);

      // Hitung jumlah status
      const approved = data.filter((a) => a.status === "approved").length;
      const pending = data.filter((a) => a.status === "pending").length;
      const rejected = data.filter((a) => a.status === "rejected").length;
      setCounts({ approved, pending, rejected });

      // Increment reloadKey to force DataGrid rerender
      setReloadKey((rk) => rk + 1);
    } catch (err) {
      console.error(err);
      setAlert({
        open: true,
        message: "Gagal memuat data approvals",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();

    // Listen for approval success event (custom event dari modal)
    const handleApprovalSuccess = () => {
      fetchApprovals();
    };

    window.addEventListener("approvalSuccess", handleApprovalSuccess);

    // Setup Echo listener untuk real-time updates dari Laravel Broadcasting
    console.log("🔌 Setting up Echo listener for approval.page.updated");

    // const approvalChannel = Echo.channel("approval.page.updated")
    //   .listen("approval.page.updated", (event) => {
    //     console.log("🔥 Approval page updated event received:", event);

    //     // Cek apakah approval ini sudah pernah ditampilkan notifikasinya
    //     const approvalKey = `${event.approval_type}-${event.approval_id}`;

    //     if (!shownApprovalIdsRef.current.has(approvalKey)) {
    //       // Tambahkan ke set agar tidak muncul notifikasi duplikat
    //       shownApprovalIdsRef.current.add(approvalKey);

    //       // Refresh data approvals
    //       fetchApprovals();

    //       // Tampilkan toast notification
    //       const statusText =
    //         event.status === "approved" ? "disetujui" : "ditolak";
    //       toast.success(
    //         event.message ||
    //           `Approval untuk ${event.approval_type} telah ${statusText}`,
    //         { duration: 5000 }
    //       );

    //       console.log("✅ Approval data refreshed and notification shown");
    //     } else {
    //       console.log("ℹ️ Approval notification already shown, skipping");
    //     }
    //   })
    //   .error((err) => {
    //     console.error("❌ Echo channel error for approval.page.updated:", err);
    //   });

    // Cleanup function
    return () => {
      console.log("🔌 Cleaning up Echo listener for approval.page.updated");
      window.removeEventListener("approvalSuccess", handleApprovalSuccess);
      // approvalChannel.stopListening("approval.page.updated");
    };
  }, []);

  const handleView = (approval) => {
    const type =
      approval.type?.toLowerCase() || approval.approvable_type?.toLowerCase();

    if (type === "phc") {
      setSelectedPhcId(approval.approvable.project.phc.id);
      setOpenModal(true);
    } else if (type === "work order" || type === "workorder") {
      setSelectedWorkOrderId(approval.approvable.id);
      setOpenWorkOrderModal(true);
    } else if (type === "work order update" || type === "workorder") {
      setSelectedWorkOrderId(approval.approvable.id);
      setOpenWorkOrderModal(true);
    } else if (type === "log") {
      setSelectedLogId(approval.approvable.id);
      setOpenLogModal(true);
    }
  };

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon color="primary" />}
          label="View"
          onClick={() => handleView(params.row)}
          showInMenu={false}
        />,
      ],
    },

    {
      field: "type",
      headerName: "Type",
      width: 150,
      renderCell: (params) => {
        return params?.row?.type ?? "N/A";
      },
    },

    {
      field: "approval_for",
      headerName: "Project",
      width: 300,
      renderCell: (params) =>
        params?.row?.approvable?.project?.project_number ?? "N/A",
    },

    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const status = params?.value ?? "";
        let color = "inherit";
        if (status === "approved") color = "green";
        else if (status === "pending") color = "orange";
        else if (status === "rejected") color = "red";
        return <span style={{ color }}>{status}</span>;
      },
    },

    {
      field: "validated_at",
      headerName: "Validated At",
      width: 180,
      renderCell: (params) => {
        const date = params?.row?.validated_at;
        if (!date) return "-";

        // Format tanggal, misal jadi YYYY-MM-DD HH:mm
        const formatted = new Date(date).toLocaleString("id-ID", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return <span>{formatted}</span>;
      },
    },
  ];

  return (
    <Box p={3}>
      {/* Status Cards */}
      <Stack direction="row" spacing={2} mb={3}>
        <Card sx={{ flex: 1, bgcolor: "#e0f7fa" }}>
          <CardContent>
            <Typography variant="h6">Approved</Typography>
            <Typography variant="h4">{counts.approved}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: "#fff9c4" }}>
          <CardContent>
            <Typography variant="h6">Pending</Typography>
            <Typography variant="h4">{counts.pending}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: "#ffcdd2" }}>
          <CardContent>
            <Typography variant="h6">Rejected</Typography>
            <Typography variant="h4">{counts.rejected}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* DataGrid */}
      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            key={reloadKey}
            rows={approvals}
            columns={columns}
            loading={loading}
            getRowId={(row) => Number(row.id)}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </div>
      </div>

      {/* Snackbar Alert */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
      >
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
      <ViewPhcModal
        open={openModal}
        handleClose={() => setOpenModal(false)}
        phcId={selectedPhcId}
        isFromApprovalPage={true}
        approval={approvals.find(
          (a) =>
            a.approvable?.project?.phc?.id === selectedPhcId &&
            a.status === "pending"
        )}
      />
      <ViewWorkOrderModal
        open={openWorkOrderModal}
        onClose={() => setOpenWorkOrderModal(false)}
        workOrderId={selectedWorkOrderId}
        isFromApprovalPage={true}
        approval={approvals.find(
          (a) =>
            a.approvable?.id === selectedWorkOrderId && a.status === "pending"
        )}
      />
      <ViewLogModal
        open={openLogModal}
        onClose={() => setOpenLogModal(false)}
        logId={selectedLogId}
        isFromApprovalPage={true}
        approval={approvals.find(
          (a) => a.approvable?.id === selectedLogId && a.status === "pending"
        )}
      />
    </Box>
  );
}
