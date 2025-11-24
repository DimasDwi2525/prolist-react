import React, { useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { Plus } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
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
  Tooltip,
} from "@mui/material";

import { textRenderer } from "../../utils/handsontableRenderers";
import Swal from "sweetalert2";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";

export default function RoleTable() {
  const hotTableRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    type_role: "",
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/roles");
      setRoles(res.data.data || res.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load roles", "error");
      setRoles([]);
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

  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 90,
        renderer: (instance, td, row) => {
          td.innerHTML = "";
          const rowData = instance.getSourceDataAtRow(row);

          // Edit button
          const editBtn = document.createElement("button");
          editBtn.style.cursor = "pointer";
          editBtn.style.border = "none";
          editBtn.style.background = "transparent";
          editBtn.title = "Edit";
          editBtn.innerHTML = "✏️";
          editBtn.onclick = () => {
            openForm(rowData);
          };

          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.style.cursor = "pointer";
          deleteBtn.style.border = "none";
          deleteBtn.style.background = "transparent";
          deleteBtn.title = "Delete";
          deleteBtn.innerHTML = "🗑️";
          deleteBtn.onclick = () => {
            deleteRole(rowData.id);
          };

          // Bungkus dalam div biar rapih
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.gap = "6px";
          wrapper.style.justifyContent = "center";
          wrapper.appendChild(editBtn);
          wrapper.appendChild(deleteBtn);

          td.appendChild(wrapper);
          return td;
        },
      },

      {
        data: "name",
        title: "Role Name",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "type_role",
        title: "Type",
        readOnly: true,
        renderer: textRenderer,
      },
    ],
    [roles]
  );

  // Inline edit
  const afterChange = (changes, source) => {
    if (source === "loadData" || !changes) return;

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue !== newValue) {
        const rowData = roles[row];
        if (prop === "actions") return;

        Swal.fire({
          title: "Confirm Update?",
          text: `Change ${prop} from "${oldValue}" to "${newValue}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, update",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await api.put(`/roles/${rowData.id}`, {
                ...rowData,
                [prop]: newValue,
              });
              fetchRoles();
              Swal.fire("Updated!", "Role updated successfully.", "success");
            } catch (error) {
              console.error(error);
              Swal.fire("Error", "Failed to update role", "error");
              fetchRoles();
            }
          } else {
            fetchRoles();
          }
        });
      }
    });
  };

  // Open form
  const openForm = (role = null) => {
    if (role) {
      setFormData({
        id: role.id,
        name: role.name || "",
        type_role: role.type_role || "",
      });
    } else {
      setFormData({
        id: null,
        name: "",
        type_role: "",
      });
    }
    setIsFormOpen(true);
  };

  // Save form
  const saveForm = async () => {
    try {
      const payload = {
        name: formData.name.trim(),
        type_role: String(formData.type_role),
      };

      if (formData.id) {
        await api.put(`/roles/${formData.id}`, payload);
        Swal.fire("Success", "Role updated successfully", "success");
      } else {
        await api.post("/roles", payload);
        Swal.fire("Success", "Role created successfully", "success");
      }
      setIsFormOpen(false);
      fetchRoles();
    } catch (error) {
      console.error(error.response?.data || error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to save role",
        "error"
      );
    }
  };

  // Delete role
  const deleteRole = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/roles/${id}`);
          Swal.fire("Deleted!", "Role deleted successfully.", "success");
          fetchRoles();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete role", "error");
        }
      }
    });
  };

  // Search filter
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredRoles.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  return (
    <Box sx={{ position: "relative" }}>
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
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 240 }}
        />
        <IconButton
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
          manualColumnMove
          className="ht-theme-horizon"
        />
      )}

      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={filteredRoles.length}
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
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "1.25rem",
            borderBottom: "1px solid #e5e7eb",
            pb: 1.5,
            mb: 1.5,
          }}
        >
          {formData.id ? "Edit Role" : "Create Role"}
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            {/* Role Name */}
            <TextField
              fullWidth
              label="Role Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            {/* Type Role */}
            <TextField
              select
              fullWidth
              label="Type Role"
              value={formData.type_role}
              onChange={(e) =>
                setFormData({ ...formData, type_role: e.target.value })
              }
              SelectProps={{ native: true }}
            >
              <option value="">-- Select Type --</option>
              <option value="1">Type 1</option>
              <option value="2">Type 2</option>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e5e7eb" }}>
          <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveForm}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
