import React, { useEffect, useRef, useState, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { Plus } from "lucide-react";
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
} from "@mui/material";
import Swal from "sweetalert2";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import { textRenderer } from "../../utils/handsontableRenderers";

export default function DepartmentTable() {
  const hotTableRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/departments");
      setDepartments(res.data.data || res.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load departments", "error");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Columns for Handsontable
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

          const editBtn = document.createElement("button");
          editBtn.style.cursor = "pointer";
          editBtn.style.border = "none";
          editBtn.style.background = "transparent";
          editBtn.title = "Edit";
          editBtn.innerHTML = "✏️";
          editBtn.onclick = () => openForm(rowData);

          const deleteBtn = document.createElement("button");
          deleteBtn.style.cursor = "pointer";
          deleteBtn.style.border = "none";
          deleteBtn.style.background = "transparent";
          deleteBtn.title = "Delete";
          deleteBtn.innerHTML = "🗑️";
          deleteBtn.onclick = () => deleteDepartment(rowData.id);

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
        title: "Department Name",
        readOnly: true,
        renderer: textRenderer,
      },
    ],
    [departments]
  );

  // Inline edit
  const afterChange = (changes, source) => {
    if (source === "loadData" || !changes) return;

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue !== newValue && prop !== "actions") {
        const rowData = departments[row];

        Swal.fire({
          title: "Confirm Update?",
          text: `Change ${prop} from "${oldValue}" to "${newValue}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, update",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await api.put(`/departments/${rowData.id}`, {
                ...rowData,
                [prop]: newValue,
              });
              fetchDepartments();
              Swal.fire(
                "Updated!",
                "Department updated successfully.",
                "success"
              );
            } catch (error) {
              console.error(error);
              Swal.fire("Error", "Failed to update department", "error");
              fetchDepartments();
            }
          } else {
            fetchDepartments();
          }
        });
      }
    });
  };

  // Open modal form
  const openForm = (department = null) => {
    if (department) {
      setFormData({ id: department.id, name: department.name || "" });
    } else {
      setFormData({ id: null, name: "" });
    }
    setIsFormOpen(true);
  };

  // Save form
  const saveForm = async () => {
    try {
      const payload = { name: formData.name.trim() };

      if (formData.id) {
        await api.put(`/departments/${formData.id}`, payload);
        Swal.fire("Success", "Department updated successfully", "success");
      } else {
        await api.post("/departments", payload);
        Swal.fire("Success", "Department created successfully", "success");
      }
      setIsFormOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error(error.response?.data || error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to save department",
        "error"
      );
    }
  };

  // Delete
  const deleteDepartment = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/departments/${id}`);
          Swal.fire("Deleted!", "Department deleted successfully.", "success");
          fetchDepartments();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete department", "error");
        }
      }
    });
  };

  // Filter and paginate
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredDepartments.slice(
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
          placeholder="Search departments..."
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
          height={500}
          manualColumnResize
          manualColumnMove
          className="ht-theme-horizon"
        />
      )}

      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={filteredDepartments.length}
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
          {formData.id ? "Edit Department" : "Create Department"}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <TextField
            fullWidth
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
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
