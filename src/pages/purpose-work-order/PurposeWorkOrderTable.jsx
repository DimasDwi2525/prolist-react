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
import { textRenderer } from "../../utils/handsontableRenderers";

export default function PurposeWorkOrderTable() {
  const hotTableRef = useRef(null);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
  });

  useEffect(() => {
    fetchPurposes();
  }, []);

  const fetchPurposes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/purpose-work-orders");
      setPurposes(res.data?.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load purposes", "error");
      setPurposes([]);
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

  // Actions Renderer
  const actionsRenderer = (instance, td, row) => {
    const rowData = instance.getSourceDataAtRow(row);
    if (!rowData) return td;

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
            onClick={() => deletePurpose(rowData.id)}
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
      {
        data: "name",
        title: "Purpose Name",
        readOnly: true,
        renderer: textRenderer,
      },
    ],
    [purposes]
  );

  // Inline edit
  // Commented out afterChange handler since cells are now read-only
  /*
  const afterChange = (changes, source) => {
    if (source === "loadData" || !changes) return;

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue !== newValue) {
        const rowData = hotTableRef.current.hotInstance.getSourceDataAtRow(row);
        if (!rowData || prop === "actions") return;

        Swal.fire({
          title: "Confirm Update?",
          text: `Change ${prop} from "${oldValue}" to "${newValue}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, update",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await api.put(`/purpose-work-orders/${rowData.id}`, {
                ...rowData,
                [prop]: newValue,
              });
              fetchPurposes();
              Swal.fire("Updated!", "Purpose updated successfully.", "success");
            } catch (error) {
              console.error(error);
              Swal.fire("Error", "Failed to update purpose", "error");
              fetchPurposes();
            }
          } else {
            fetchPurposes();
          }
        });
      }
    });
  };
  */

  // Open form
  const openForm = (purpose = null) => {
    if (purpose) {
      setFormData({
        id: purpose.id,
        name: purpose.name || "",
      });
    } else {
      setFormData({ id: null, name: "" });
    }
    setIsFormOpen(true);
  };

  // Save form
  const saveForm = async () => {
    try {
      if (formData.id) {
        await api.put(`/purpose-work-orders/${formData.id}`, formData);
        Swal.fire("Success", "Purpose updated successfully", "success");
      } else {
        await api.post(`/purpose-work-orders`, formData);
        Swal.fire("Success", "Purpose created successfully", "success");
      }
      setIsFormOpen(false);
      fetchPurposes();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save purpose", "error");
    }
  };

  // Delete purpose
  const deletePurpose = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/purpose-work-orders/${id}`);
          Swal.fire("Deleted!", "Purpose deleted successfully.", "success");
          fetchPurposes();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete purpose", "error");
        }
      }
    });
  };

  // Filter + pagination
  const filteredPurposes = purposes.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredPurposes.slice(
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
          placeholder="Search purposes..."
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
          // afterChange={afterChange}
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
          count={filteredPurposes.length}
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
          {formData.id ? "Edit Purpose" : "Create Purpose"}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Purpose Name"
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
