import React, { useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  Box,
  Stack,
  TextField,
  IconButton,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from "@mui/material";
import { Plus } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";

// Import renderers from handsontableRenderers
import { textRenderer } from "../../utils/handsontableRenderers";

export default function StatusProjectTable() {
  const hotTableRef = useRef(null);
  const [statuses, setStatuses] = useState([]);
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
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/status-projects");
      setStatuses(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load status projects", "error");
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Render actions (edit & delete)
  const actionsRenderer = (instance, td, row) => {
    const rowData = instance.getSourceDataAtRow(row);

    let root = td._reactRoot;
    if (!root) {
      root = ReactDOM.createRoot(td);
      td._reactRoot = root;
    }

    root.render(
      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
        <Tooltip title="Edit">
          <IconButton
            color="primary"
            size="small"
            onClick={() => openForm(rowData)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            size="small"
            onClick={() => deleteStatus(rowData.id)}
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
      { data: "name", title: "Name", renderer: textRenderer, readOnly: true },
    ],
    [statuses]
  );

  // Inline edit handler
  // Disabled afterChange handler because cells are now readOnly
  const afterChange = () => {
    return;
  };

  // Open modal form
  const openForm = (status = null) => {
    if (status) {
      setFormData({
        id: status.id,
        name: status.name || "",
      });
    } else {
      setFormData({
        id: null,
        name: "",
      });
    }
    setIsFormOpen(true);
  };

  // Save form
  const saveForm = async () => {
    try {
      if (formData.id) {
        await api.put(`/status-projects/${formData.id}`, formData);
        Swal.fire("Success", "Status updated successfully", "success");
      } else {
        await api.post("/status-projects", formData);
        Swal.fire("Success", "Status created successfully", "success");
      }
      setIsFormOpen(false);
      fetchStatuses();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save status", "error");
    }
  };

  // Delete status
  const deleteStatus = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/status-projects/${id}`);
          Swal.fire("Deleted!", "Status deleted successfully.", "success");
          fetchStatuses();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete status", "error");
        }
      }
    });
  };

  // Filter + Pagination
  const filteredStatuses = statuses.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredStatuses.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      {/* Search & Add */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search statuses..."
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
          <Plus fontSize="small" />
        </IconButton>
      </Stack>

      {/* Table */}
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
          count={filteredStatuses.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangePageSize}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>

      {/* Modal Form */}
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
          {formData.id ? "Edit Status" : "Create Status"}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Status Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e5e7eb" }}>
          <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveForm}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
