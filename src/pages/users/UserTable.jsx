import React, { useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import { Plus, Trash2 } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Typography,
  Stack,
  Box,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Autocomplete,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import Swal from "sweetalert2";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import { sortOptions } from "../../helper/SortOptions";

export default function UserTable() {
  const hotTableRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    role_id: "",
    department_id: "",
    pin: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles/onlyType1");
      setRoles(sortOptions(res.data.data || res.data, "name"));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(sortOptions(res.data.data || res.data, "name"));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load users", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // reset ke halaman pertama
  };

  // Renderer kolom Role & Dept
  const roleRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value?.name || value || "-";
    return td;
  };
  const deptRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value?.name || value || "-";
    return td;
  };

  const actionsRenderer = (instance, td, row) => {
    // Get row data directly from Handsontable source data for the row
    const rowDataFromHot = instance.getSourceDataAtRow(row);

    // Find full user object from complete users array by id
    const fullUser = users.find((u) => u.id === rowDataFromHot?.id);

    td.innerHTML = ""; // clear to avoid double render

    ReactDOM.createRoot(td).render(
      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
        <Tooltip title="Edit">
          <IconButton
            color="primary"
            size="small"
            onClick={() => openForm(fullUser)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            size="small"
            onClick={() => deleteUser(fullUser?.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    );

    return td;
  };

  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        renderer: actionsRenderer,
        readOnly: true,
        width: 30,
      },
      { data: "name", title: "Name" },
      { data: "email", title: "Email" },
      { data: "role", title: "Role", renderer: roleRenderer },
      { data: "department", title: "Department", renderer: deptRenderer },
    ],
    [users]
  );

  // Inline edit
  const afterChange = (changes, source) => {
    if (source === "loadData" || !changes) return;

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue !== newValue) {
        if (prop === "actions") return;

        // Get rowData from filteredUsers and page for correct data on current page
        const rowData = filteredUsers[page * pageSize + row];
        if (!rowData) return;

        Swal.fire({
          title: "Confirm Update?",
          text: `Change ${prop} from "${oldValue}" to "${newValue}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, update",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await api.put(`/users/${rowData.id}`, {
                ...rowData,
                [prop]: newValue,
              });
              fetchUsers();
              Swal.fire("Updated!", "User updated successfully.", "success");
            } catch (error) {
              console.error(error);
              Swal.fire("Error", "Failed to update user", "error");
              fetchUsers();
            }
          } else {
            fetchUsers(); // reset data kalau dibatalkan
          }
        });
      }
    });
  };

  // Open form (create/edit)
  const openForm = (user = null) => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        password: "", // kosongkan -> isi kalau mau ganti
        role_id: user.role?.id || "",
        department_id: user.department?.id || "",
        pin: "", // kosongkan -> isi kalau mau ganti
      });

      // Select the row/cell in Handsontable on edit open
      const hotInstance = hotTableRef.current?.hotInstance;
      if (hotInstance) {
        // Find row index relative to current page's paginatedData slice
        const startIndex = page * pageSize;
        const paginatedUsers = filteredUsers.slice(
          startIndex,
          startIndex + pageSize
        );
        const rowIndex = paginatedUsers.findIndex((u) => u.id === user.id);
        const colIndex = allColumns.findIndex((col) => col.data === "name");
        if (rowIndex >= 0 && colIndex >= 0) {
          hotInstance.selectCell(rowIndex, colIndex);
        }
      }
    } else {
      setFormData({
        id: null,
        name: "",
        email: "",
        password: "",
        role_id: "",
        department_id: "",
        pin: "",
      });
    }
    setIsFormOpen(true);
  };

  // Save form
  const saveForm = async () => {
    try {
      const payload = { ...formData };

      if (!payload.password) delete payload.password;
      if (!payload.pin) delete payload.pin;

      if (formData.id) {
        await api.put(`/users/${formData.id}`, payload);
        Swal.fire("Success", "User updated successfully", "success");
      } else {
        await api.post("/users", payload);
        Swal.fire("Success", "User created successfully", "success");
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save user", "error");
    }
  };

  // Delete user
  const deleteUser = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/users/${id}`);
          Swal.fire("Deleted!", "User deleted successfully.", "success");
          fetchUsers();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete user", "error");
        }
      }
    });
  };

  // Filter by search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredUsers.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  return (
    <Box sx={{ position: "relative" }}>
      {/* Loading Overlay */}
      <LoadingOverlay loading={loading} />
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 240 }}
        />

        <IconButton
          variant="contained"
          onClick={() => openForm()}
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
          <Plus fontSize={"small"} />
        </IconButton>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <HotTable
          ref={hotTableRef}
          data={paginatedData}
          colHeaders={allColumns.map((c) => c.title)}
          columns={allColumns}
          rowHeaders={false}
          licenseKey="non-commercial-and-evaluation"
          afterChange={afterChange}
          stretchH="all"
          width="100%"
          height={550}
          manualColumnResize
          manualColumnFreeze
          manualColumnMove
          className="ht-theme-horizon"
        />
      )}
      {/* Pagination */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangePageSize}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>

      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          },
        }}
      >
        {/* Title */}
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "1.25rem",
            borderBottom: "1px solid #e5e7eb",
            pb: 1.5,
            mb: 1.5,
          }}
        >
          {formData.id ? "Edit User" : "Create User"}
        </DialogTitle>

        {/* Content */}
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            {/* Name */}
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            {/* Password */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder={
                formData.id ? "Leave blank to keep current password" : ""
              }
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* PIN */}
            <TextField
              fullWidth
              label="PIN"
              type={showPin ? "text" : "password"}
              placeholder={formData.id ? "Leave blank to keep current PIN" : ""}
              value={formData.pin}
              onChange={(e) =>
                setFormData({ ...formData, pin: e.target.value })
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPin(!showPin)}>
                      {showPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Role */}
            <Autocomplete
              options={roles}
              getOptionLabel={(option) => option.name}
              value={roles.find((r) => r.id === formData.role_id) || null}
              onChange={(e, newValue) =>
                setFormData({
                  ...formData,
                  role_id: newValue ? newValue.id : "",
                })
              }
              renderInput={(params) => <TextField {...params} label="Role" />}
            />

            {/* Department */}
            <Autocomplete
              options={departments}
              getOptionLabel={(option) => option.name}
              value={
                departments.find((d) => d.id === formData.department_id) || null
              }
              onChange={(e, newValue) =>
                setFormData({
                  ...formData,
                  department_id: newValue ? newValue.id : "",
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Department" />
              )}
            />
          </Stack>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e5e7eb" }}>
          <Button
            onClick={() => setIsFormOpen(false)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveForm}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              backgroundColor: "#2563eb",
              "&:hover": {
                backgroundColor: "#1d4ed8",
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
