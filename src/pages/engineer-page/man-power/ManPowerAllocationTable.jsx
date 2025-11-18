import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Plus, Edit3 } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Box,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Autocomplete,
  TextField,
  Tooltip,
} from "@mui/material";

import api from "../../../api/api";
import { getUser } from "../../../utils/storage";

import { sortOptions } from "../../../helper/SortOptions";

export default function ManPowerAllocationTable({
  open,
  onClose,
  pn_number,
  embedded = false,
}) {
  const user = getUser();
  const userRole = user?.role?.name;
  const restrictedRoles = [
    "manPower",
    "engineer_supervisor",
    "drafter",
    "electrician_supervisor",
    "electrician",
    "site_engineer",
  ];
  const canAddManPower = !restrictedRoles.includes(userRole);

  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [openCellConfirm, setOpenCellConfirm] = useState(false);
  const [changedCell, setChangedCell] = useState(null);

  const [openRowModal, setOpenRowModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formValues, setFormValues] = useState({});

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [rowUpdatePromise, setRowUpdatePromise] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const columns = embedded
    ? [
        {
          field: "user_id",
          headerName: "User",
          flex: 2,
          editable: false,
          renderCell: (params) => {
            const user = users.find((u) => u.id === params.value);
            return user ? user.name : "—";
          },
        },
        {
          field: "role_id",
          headerName: "Role",
          flex: 2,
          editable: false,
          renderCell: (params) => {
            const role = roles.find(
              (r) => String(r.id) === String(params.value)
            );
            return role ? role.name : params.row.role_name; // fallback ke API role_name
          },
        },
        {
          field: "project_id",
          headerName: "Project PN",
          flex: 2,
          editable: false,
          renderCell: (params) => {
            return params.row.project?.project_number || "—";
          },
        },
      ]
    : [
        {
          field: "actions",
          type: "actions",
          headerName: "Actions",
          flex: 1,
          getActions: (params) => [
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label="Edit Row"
              onClick={() => handleEditRowClick(params.row)}
            />,
            <GridActionsCellItem
              key="delete"
              icon={<Typography color="error">🗑️</Typography>}
              label="Delete"
              onClick={() => handleDelete(params.row.id)}
            />,
          ],
        },
        {
          field: "user_id",
          headerName: "User",
          flex: 2,
          editable: true,
          type: "singleSelect",
          valueOptions: users.map((u) => ({ value: u.id, label: u.name })),
          renderCell: (params) => {
            const user = users.find((u) => u.id === params.value);
            return user ? user.name : "—";
          },
        },
        {
          field: "role_id",
          headerName: "Role",
          flex: 2,
          editable: true,
          type: "singleSelect",
          valueOptions: roles.map((r) => ({
            value: String(r.id),
            label: r.name,
          })), // pastikan string
          renderCell: (params) => {
            const role = roles.find(
              (r) => String(r.id) === String(params.value)
            );
            return role ? role.name : params.row.role_name; // fallback ke API role_name
          },
        },

        {
          field: "project_id",
          headerName: "Project PN",
          flex: 2,
          editable: false,
          renderCell: (params) => {
            return params.row.project?.project_number || "—";
          },
        },
      ];

  useEffect(() => {
    if (!pn_number) {
      setLoading(false);
      return;
    }

    const fetchAllocations = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/man-power/${pn_number}`);
        const rows = res.data.data.map((a) => ({
          ...a,
          id: a.id,
          user_id: a.user?.id, // simpan ID
          role_id: a.role_id, // allocation sudah punya role_id
          user_name: a.user?.name, // simpan juga nama untuk ditampilkan
          role_name: a.user?.role?.name, // ambil dari relasi user.role
        }));

        console.log(rows);

        setAllocations(rows);
      } catch (err) {
        console.error("Error fetching allocations:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, [pn_number]);

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      const usersRes = await api.get("/users/manPowerUsers"); // endpoint harus menyesuaikan
      const rolesRes = await api.get("/users/manPowerRoles"); // type_role = 2
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  // ✅ proses update row
  const processRowUpdate = (newRow, oldRow) => {
    return new Promise((resolve, reject) => {
      // cari field yg berubah
      const changedField = Object.keys(newRow).find(
        (key) => newRow[key] !== oldRow[key]
      );

      if (changedField) {
        setChangedCell({
          field: changedField,
          oldValue: oldRow[changedField],
          newValue: newRow[changedField],
          oldRow,
          newRow,
        });
        setOpenCellConfirm(true);
        setRowUpdatePromise({ resolve, reject });
      } else {
        resolve(oldRow);
      }
    });
  };

  const confirmCellUpdate = async () => {
    const { newRow, oldRow } = changedCell;
    try {
      const res = await api.put(`/man-power/${oldRow.id}`, {
        user_id: newRow.user_id,
        role_id: newRow.role_id,
        project_id: pn_number,
      });

      const serverRow = res.data.data;

      // merge dengan row lama supaya field lain tidak hilang
      const updatedRow = {
        ...oldRow, // ambil semua yang lama
        ...serverRow, // isi dari API
        id: serverRow.id,
        user_id: serverRow.user?.id ?? newRow.user_id ?? oldRow.user_id,
        role_id: serverRow.role?.id ?? newRow.role_id ?? oldRow.role_id,
        user_name: serverRow.user?.name ?? oldRow.user_name,
        role_name:
          serverRow.role?.name ??
          serverRow.user?.role?.name ?? // fallback dari user.role
          oldRow.role_name,
        project_id: serverRow.project_id ?? oldRow.project_id,
      };

      setAllocations((prev) =>
        prev.map((row) => (row.id === oldRow.id ? updatedRow : row))
      );

      rowUpdatePromise?.resolve(updatedRow);

      setSnackbar({
        open: true,
        message: "Allocation updated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Update failed:", err);
      rowUpdatePromise?.reject(err);
      setSnackbar({
        open: true,
        message: "Failed to update allocation.",
        severity: "error",
      });
    } finally {
      setOpenCellConfirm(false);
      setChangedCell(null);
      setRowUpdatePromise(null);
    }
  };

  const handleEditRowClick = (row) => {
    setEditRow(row);
    setFormValues({
      user_id: row.user?.id,
      role_id: row.role?.id,
    });
    setOpenRowModal(true);
  };

  const handleInputChange = (field, value) =>
    setFormValues((prev) => ({ ...prev, [field]: value }));

  const handleSaveRow = async () => {
    try {
      const payload = { ...formValues, project_id: pn_number };
      const res = await api.put(`/man-power/${editRow.id}`, payload);

      setAllocations((prev) =>
        prev.map((row) =>
          row.id === editRow.id
            ? {
                ...res.data.data,
                id: res.data.data.id,
                user_id: res.data.data.user?.id,
                role_id: res.data.data.role?.id,
                user_name: res.data.data.user?.name,
                role_name: res.data.data.role?.name,
                project_id: res.data.data.project_id,
              }
            : row
        )
      );

      setSnackbar({
        open: true,
        message: "Allocation updated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to update allocation.",
        severity: "error",
      });
    } finally {
      setOpenRowModal(false);
      setEditRow(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this allocation?")) return;
    try {
      await api.delete(`/man-power/${id}`);
      setAllocations((prev) => prev.filter((row) => row.id !== id));
      setSnackbar({
        open: true,
        message: "Allocation deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete allocation.",
        severity: "error",
      });
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...formValues,
        project_id: pn_number, // <-- pakai langsung dari useParams
      };
      const res = await api.post(`/man-power`, payload);
      setAllocations((prev) => [
        {
          ...res.data.data,
          user_name: res.data.data.user?.name,
          role_name: res.data.data.role?.name,
        },
        ...prev,
      ]);
      setSnackbar({
        open: true,
        message: "Allocation created successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to create allocation.",
        severity: "error",
      });
    } finally {
      setOpenCreateModal(false);
      setFormValues({});
    }
  };

  const content = (
    <>
      {canAddManPower && !embedded && (
        <div className="flex justify-end mb-2">
          {/* Tombol Add Allocation Compact */}
          <Tooltip title="Add Allocation">
            <IconButton
              color="primary"
              onClick={() => setOpenCreateModal(true)}
              sx={{
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              <Plus size={20} />
            </IconButton>
          </Tooltip>
        </div>
      )}
      <DataGrid
        rows={allocations}
        columns={columns}
        pagination
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
        processRowUpdate={embedded ? undefined : processRowUpdate}
        onProcessRowUpdateError={(error) => {
          console.error("Update error:", error);
          setSnackbar({
            open: true,
            message: "Failed to update allocation.",
            severity: "error",
          });
        }}
        getRowId={(row) =>
          row.id ?? `${row.project_id}-${row.user_id}-${row.role_id}`
        }
      />
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
      {/* Confirm Cell Update */}
      <Dialog
        open={openCellConfirm}
        onClose={() => {
          rowUpdatePromise?.reject(changedCell?.oldRow); // rollback
          setOpenCellConfirm(false);
          setChangedCell(null);
          setRowUpdatePromise(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Confirm Change</DialogTitle>
        <DialogContent dividers>
          {changedCell && (
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                You are about to update:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {changedCell.field.replace(/_/g, " ")}
              </Typography>

              {(() => {
                let oldLabel = changedCell.oldValue ?? "—";
                let newLabel = changedCell.newValue ?? "—";

                // 🔹 khusus user_id → tampilkan nama user
                if (changedCell.field === "user_id") {
                  const oldUser = users.find(
                    (u) => Number(u.id) === Number(changedCell.oldValue)
                  );
                  const newUser = users.find(
                    (u) => Number(u.id) === Number(changedCell.newValue)
                  );
                  oldLabel = oldUser?.name || "—";
                  newLabel = newUser?.name || "—";
                }

                // 🔹 khusus role_id → tampilkan nama role
                if (changedCell.field === "role_id") {
                  const oldRole = roles.find(
                    (r) => Number(r.id) === Number(changedCell.oldValue)
                  );
                  const newRole = roles.find(
                    (r) => Number(r.id) === Number(changedCell.newValue)
                  );
                  oldLabel = oldRole?.name || "—";
                  newLabel = newRole?.name || "—";
                }

                return (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Chip label={oldLabel} color="error" />
                    <Chip label={newLabel} color="success" />
                  </Box>
                );
              })()}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              rowUpdatePromise?.reject(changedCell?.oldRow); // rollback
              setOpenCellConfirm(false);
              setChangedCell(null);
              setRowUpdatePromise(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmCellUpdate}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openRowModal || openCreateModal}
        onClose={() => {
          setOpenRowModal(false);
          setOpenCreateModal(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 2, boxShadow: 6 },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {editRow ? (
              <Edit3 size={22} color="#1976d2" />
            ) : (
              <Plus size={22} color="#2e7d32" />
            )}
            <Typography variant="h6" fontWeight="600">
              {editRow ? "Edit Allocation" : "Add Allocation"}
            </Typography>
          </Stack>
          <IconButton
            onClick={() => {
              setOpenRowModal(false);
              setOpenCreateModal(false);
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Subheader */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 3, pb: 1 }}
        >
          {editRow
            ? "Update user allocation details below."
            : "Fill in the form to create a new allocation."}
        </Typography>

        {/* Content */}
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={3}>
            <Autocomplete
              size="small"
              options={sortOptions(users, "name")}
              getOptionLabel={(option) => option.name || ""}
              value={users.find((u) => u.id === formValues.user_id) || null}
              onChange={(_, newValue) =>
                handleInputChange("user_id", newValue ? newValue.id : "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="User"
                  placeholder="Search user..."
                  variant="outlined"
                />
              )}
            />

            <Autocomplete
              size="small"
              options={sortOptions(roles, "name")}
              getOptionLabel={(option) => option.name || ""}
              value={roles.find((r) => r.id === formValues.role_id) || null}
              onChange={(_, newValue) =>
                handleInputChange("role_id", newValue ? newValue.id : "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Role"
                  placeholder="Search role..."
                  variant="outlined"
                />
              )}
            />
          </Stack>
        </DialogContent>

        {/* Footer Actions */}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setOpenRowModal(false);
              setOpenCreateModal(false);
            }}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={editRow ? "primary" : "success"}
            onClick={editRow ? handleSaveRow : handleCreate}
          >
            {editRow ? "Save Changes" : "Add Allocation"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (embedded) {
    return content;
  } else {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>Man Power Allocation</DialogTitle>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    );
  }
}
