import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Button,
  Typography,
  Stack,
  Box,
  Snackbar,
  Alert,
  IconButton,
  TextField,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Plus, ArrowLeft } from "lucide-react";
import { WarningAmber, CheckCircle } from "@mui/icons-material";
import api from "../../api/api";
import FormMrModal from "../../components/modal/FormMrModal";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";

export default function MaterialRequestTable() {
  const { pn_number } = useParams(); // ambil pn_number dari URL
  const navigate = useNavigate();
  const hotTableRef = useRef(null);
  const [project, setProject] = useState(null);
  const [mrs, setMrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModalState, setFormModalState] = useState({
    open: false,
    editData: null,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "cancel" | "handover"
  const [selectedId, setSelectedId] = useState(null);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverAction, setHandoverAction] = useState(null); // "handover" | "approve"
  const [handoverId, setHandoverId] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [users, setUsers] = useState([]);
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const loadData = async () => {
    if (!pn_number) return;
    setLoading(true);
    try {
      // Fetch project
      const resProject = await api.get(`/projects/${pn_number}`);
      //   console.log(resProject.data.data.project);
      setProject(resProject.data.data.project);

      // Fetch material requests
      const resMRs = await api.get("/material-requests");
      const filteredMRs = resMRs.data.data.filter(
        (mr) => mr.pn_id == pn_number
      );

      console.log("Filtered MRs:", filteredMRs);
      setMrs(
        filteredMRs.map((mr) => ({
          id: mr.id,
          ...mr,
          creator_name: mr.creator?.name || "-",
          handover_name: mr.mr_handover?.name || "-",
          material_status: mr.material_status,
        }))
      );
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUsers();
  }, [pn_number]);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Load users error:", err);
    }
  };

  // 🔹 Taruh di luar
  const cancelMaterialRequest = async (id) => {
    try {
      const res = await api.post(`/${id}/cancel`);
      if (res.data.status === "success") {
        setSnackbar({
          open: true,
          message: res.data.message,
          severity: "success",
        });
        await loadData();
      } else {
        setSnackbar({
          open: true,
          message: res.data.message,
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setSnackbar({
        open: true,
        message: "An error occurred while canceling the material request.",
        severity: "error",
      });
    }
  };

  const handoverMaterialRequest = async (id, userId, pinValue) => {
    console.log(
      "Calling handover API for ID:",
      id,
      "with userId:",
      userId,
      "and PIN:",
      pinValue
    );
    try {
      const res = await api.post(`/${id}/handover`, {
        material_handover: userId,
        pin: pinValue,
      });
      console.log("Handover API response:", res.data);
      if (res.data.status === "success") {
        setSnackbar({
          open: true,
          message: res.data.message,
          severity: "success",
        });
        await loadData();
        return true;
      } else {
        setSnackbar({
          open: true,
          message: res.data.message,
          severity: "error",
        });
        return false;
      }
    } catch (err) {
      console.error("Handover error:", err);
      const errorMessage =
        err.response?.data?.message ||
        "An error occurred while handing over the material request.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      return false;
    }
  };

  // 🔹 konfirmasi submit
  const handleConfirm = async () => {
    if (confirmAction === "cancel") {
      await cancelMaterialRequest(selectedId);
    } else if (confirmAction === "handover") {
      setUserSelectOpen(true);
      setHandoverId(selectedId);
      setSelectedUser("");
    } else if (confirmAction === "approve") {
      // Remove approve functionality as per updated controller
      // The handover now immediately completes the MR
    }
    setConfirmOpen(false);
    setSelectedId(null);
    setConfirmAction(null);
  };

  const handleUserSelectConfirm = async () => {
    if (!selectedUser) {
      setPinError("Please select a user to handover to");
      return;
    }
    setPinError("");
    setUserSelectOpen(false);
    setHandoverAction("handover");
    setHandoverOpen(true);
  };

  const handleHandoverConfirm = async () => {
    console.log(
      "handleHandoverConfirm called with handoverAction:",
      handoverAction
    );
    let success = false;
    if (handoverAction === "handover") {
      if (!pin.trim()) {
        setPinError("PIN is required");
        return;
      }
      if (pin.length !== 6) {
        setPinError("PIN must be 6 digits");
        return;
      }
      setPinError("");
      success = await handoverMaterialRequest(handoverId, selectedUser, pin);
    }

    console.log("Success value:", success);
    if (success) {
      setHandoverOpen(false);
      setHandoverAction(null);
      setHandoverId(null);
      setSelectedUser("");
      setPin("");
    }
  };

  // Custom renderers for Handsontable
  const actionsRenderer = (instance, td, row) => {
    const data = instance.getSourceDataAtRow(row);
    const isDisabled = ["Canceled", "Completed"].includes(data.material_status);

    td.innerHTML = "";

    // wrapper flex
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "6px"; // jarak antar tombol

    // ✏️ Edit button
    const editBtn = document.createElement("button");
    editBtn.style.cursor = "pointer";
    editBtn.style.border = "none";
    editBtn.style.background = "#e3f2fd";
    editBtn.style.padding = "8px";
    editBtn.style.borderRadius = "4px";
    editBtn.style.color = "#1976d2";
    editBtn.style.display = "flex";
    editBtn.style.alignItems = "center";
    editBtn.style.justifyContent = "center";
    editBtn.style.width = "40px";
    editBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
    editBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
    editBtn.title = "Edit";
    editBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
    editBtn.onmouseover = () => {
      editBtn.style.backgroundColor = "#1976d2";
      editBtn.style.color = "#fff";
      editBtn.style.boxShadow = "0 2px 6px rgba(25, 118, 210, 0.3)";
      editBtn.style.transform = "translateY(-1px)";
    };
    editBtn.onmouseout = () => {
      editBtn.style.backgroundColor = "#e3f2fd";
      editBtn.style.color = "#1976d2";
      editBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
      editBtn.style.transform = "translateY(0)";
    };
    editBtn.onclick = () => {
      setIsEdit(true);
      setFormModalState({ open: true, editData: data });
    };
    wrapper.appendChild(editBtn);

    // ❌ Cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
    cancelBtn.style.border = "none";
    cancelBtn.style.background = isDisabled ? "#f3f4f6" : "#fee2e2";
    cancelBtn.style.padding = "8px";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.style.color = isDisabled ? "#9ca3af" : "#dc2626";
    cancelBtn.style.display = "flex";
    cancelBtn.style.alignItems = "center";
    cancelBtn.style.justifyContent = "center";
    cancelBtn.style.width = "40px";
    cancelBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
    cancelBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
    cancelBtn.style.opacity = isDisabled ? "0.5" : "1";
    cancelBtn.title = "Cancel";
    cancelBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    if (!isDisabled) {
      cancelBtn.onmouseover = () => {
        cancelBtn.style.backgroundColor = "#dc2626";
        cancelBtn.style.color = "#fff";
        cancelBtn.style.boxShadow = "0 2px 6px rgba(220, 38, 38, 0.3)";
        cancelBtn.style.transform = "translateY(-1px)";
      };
      cancelBtn.onmouseout = () => {
        cancelBtn.style.backgroundColor = "#fee2e2";
        cancelBtn.style.color = "#dc2626";
        cancelBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
        cancelBtn.style.transform = "translateY(0)";
      };
      cancelBtn.onclick = () => {
        setSelectedId(data.id);
        setConfirmAction("cancel");
        setConfirmOpen(true);
      };
    }
    wrapper.appendChild(cancelBtn);

    // 🔄 Handover button
    const handoverBtn = document.createElement("button");
    handoverBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
    handoverBtn.style.border = "none";
    handoverBtn.style.background = isDisabled ? "#f3f4f6" : "#fef3c7";
    handoverBtn.style.padding = "8px";
    handoverBtn.style.borderRadius = "4px";
    handoverBtn.style.color = isDisabled ? "#9ca3af" : "#d97706";
    handoverBtn.style.display = "flex";
    handoverBtn.style.alignItems = "center";
    handoverBtn.style.justifyContent = "center";
    handoverBtn.style.width = "40px";
    handoverBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
    handoverBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
    handoverBtn.style.opacity = isDisabled ? "0.5" : "1";
    handoverBtn.title = "Handover";
    handoverBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
    if (!isDisabled) {
      handoverBtn.onmouseover = () => {
        handoverBtn.style.backgroundColor = "#d97706";
        handoverBtn.style.color = "#fff";
        handoverBtn.style.boxShadow = "0 2px 6px rgba(217, 119, 6, 0.3)";
        handoverBtn.style.transform = "translateY(-1px)";
      };
      handoverBtn.onmouseout = () => {
        handoverBtn.style.backgroundColor = "#fef3c7";
        handoverBtn.style.color = "#d97706";
        handoverBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
        handoverBtn.style.transform = "translateY(0)";
      };
      handoverBtn.onclick = () => {
        setSelectedId(data.id);
        setConfirmAction("handover");
        setConfirmOpen(true);
      };
    }
    wrapper.appendChild(handoverBtn);

    td.appendChild(wrapper);
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    return td;
  };

  const booleanRenderer = (instance, td, row, col, prop, value) => {
    const isYes = Number(value) === 1;
    const label = isYes ? "Yes" : "No";
    const bgColor = isYes ? "#2196f3" : "transparent";
    const color = isYes ? "white" : "black";
    const border = isYes ? "none" : "1px solid #ccc";

    td.innerHTML = `<span style="background-color: ${bgColor}; color: ${color}; border: ${border}; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${label}</span>`;
    return td;
  };

  const textRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    td.style.color = "black";
    return td;
  };

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 120,
        renderer: actionsRenderer,
      },
      {
        data: "material_number",
        title: "Material Number",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "material_description",
        title: "Description",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "created_at",
        title: "Created At",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "creator_name",
        title: "Created By",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "handover_name",
        title: "Handover To",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "target_date",
        title: "Target Date",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "cancel_date",
        title: "Cancel Date",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "complete_date",
        title: "Complete Date",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "material_status",
        title: "Status",
        readOnly: true,
        renderer: statusRenderer,
        width: 150,
      },
      {
        data: "remark",
        title: "Remark",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "additional_material",
        title: "Additional Material",
        readOnly: true,
        renderer: booleanRenderer,
      },
    ],
    []
  );

  const initialVisibility = {};
  allColumns.forEach((col) => {
    initialVisibility[col.data] = true; // semua kolom default visible
  });
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // reset ke halaman pertama
  };

  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const filteredData = filterBySearch(mrs, searchTerm).map((p) => ({
    id: p.id,
    actions: "",
    pn_number: p.pn_number, // untuk navigasi (pastikan konsisten)
    material_number: p.material_number,
    material_description: p.material_description,
    created_at: formatDate(p.created_at),
    creator_name: p.creator_name,
    handover_name: p.handover_name,
    target_date: formatDate(p.target_date),
    cancel_date: formatDate(p.cancel_date),
    complete_date: formatDate(p.complete_date),
    material_status: p.material_status?.name || "-",
    remark: p.remark,
    additional_material: p.additional_material,
  }));
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 50 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Loading Overlay */}
      <LoadingOverlay loading={loading} />

      {/* Top Controls */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search material requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            width: 240,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              paddingRight: 0,
            },
            "& .MuiInputBase-input": {
              padding: "6px 10px",
              fontSize: "0.875rem",
            },
          }}
        />

        <ColumnVisibilityModal
          columns={allColumns}
          columnVisibility={columnVisibility}
          handleToggleColumn={handleToggleColumn}
        />

        <IconButton
          onClick={() => {
            setFormModalState({ open: true, editData: null });
          }}
          sx={{
            backgroundColor: "#2563eb",
            color: "#fff",
            width: 36,
            height: 36,
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#1d4ed8",
              transform: "scale(1.05)",
            },
          }}
        >
          <Plus fontSize="small" />
        </IconButton>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Typography variant="subtitle1" fontWeight={600} ml={1}>
            {project?.project_number
              ? `Material Requests - ${project.project_number}`
              : "Material Requests"}
          </Typography>
        </Stack>
      </Stack>

      {/* Handsontable */}
      <div className="table-wrapper">
        <div className="table-inner">
          <HotTable
            ref={hotTableRef}
            data={paginatedData}
            colHeaders={allColumns.map((c) => c.title)}
            columns={allColumns}
            width="auto"
            height={tableHeight}
            manualColumnResize
            licenseKey="non-commercial-and-evaluation"
            manualColumnFreeze
            fixedColumnsLeft={3}
            stretchH="all"
            filters
            dropdownMenu
            className="ht-theme-horizon"
            manualColumnMove
            rowHeights={50}
            autoRowSize={false}
            hiddenColumns={{
              columns: allColumns
                .map((col, i) => (columnVisibility[col.data] ? null : i))
                .filter((i) => i !== null),
              indicators: true,
            }}
          />
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Pagination */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangePageSize}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>

      {formModalState.open && (
        <FormMrModal
          open={formModalState.open}
          onClose={() => {
            setFormModalState({ open: false, editData: null });
            setIsEdit(false);
          }}
          onSave={loadData}
          pn_number={pn_number}
          editData={formModalState.editData}
          isEdit={isEdit}
        />
      )}

      {/* 🔹 Modern Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
          {confirmAction === "cancel"
            ? "Confirm Cancellation"
            : "Confirm Handover"}
        </DialogTitle>

        <DialogContent>
          <Stack alignItems="center" spacing={2} sx={{ py: 1 }}>
            {confirmAction === "cancel" ? (
              <WarningAmber sx={{ fontSize: 50, color: "error.main" }} />
            ) : (
              <CheckCircle sx={{ fontSize: 50, color: "warning.main" }} />
            )}

            <DialogContentText sx={{ textAlign: "center" }}>
              Are you sure you want to{" "}
              <Typography component="span" fontWeight={600}>
                {confirmAction === "cancel" ? "cancel" : "handover"}
              </Typography>{" "}
              this material request?
            </DialogContentText>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            No
          </Button>
          <Button
            onClick={handleConfirm}
            color={confirmAction === "cancel" ? "error" : "warning"}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Yes, {confirmAction === "cancel" ? "Cancel" : "Handover"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔹 User Selection Modal for Handover */}
      <Dialog
        open={userSelectOpen}
        onClose={() => {
          setUserSelectOpen(false);
          setSelectedUser("");
          setPinError("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
          Select User to Handover
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <FormControl fullWidth error={!!pinError}>
              <InputLabel>Select User</InputLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Select User"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
              {pinError && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {pinError}
                </Typography>
              )}
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => {
              setUserSelectOpen(false);
              setSelectedUser("");
              setPinError("");
            }}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUserSelectConfirm}
            color="warning"
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔹 Handover/Approve Modal */}
      <Dialog
        open={handoverOpen}
        onClose={() => {
          setHandoverOpen(false);
          setSelectedUser("");
          setPin("");
          setPinError("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
          Confirm Handover
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography sx={{ textAlign: "center" }}>
              Handover to:{" "}
              <strong>{users.find((u) => u.id === selectedUser)?.name}</strong>
            </Typography>
            <TextField
              label="PIN"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              error={!!pinError}
              helperText={pinError}
              fullWidth
              inputProps={{ maxLength: 6 }}
              sx={{ mt: 1 }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => {
              setHandoverOpen(false);
              setHandoverAction(null);
              setSelectedUser("");
              setPin("");
              setPinError("");
            }}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleHandoverConfirm}
            color="warning"
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Confirm Handover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
