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
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { Plus } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import { textRenderer } from "../../utils/handsontableRenderers";

export default function DocumentTable() {
  const hotTableRef = useRef(null);
  const [documents, setDocuments] = useState([]);
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
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/document-phc");
      setDocuments(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load documents", "error");
      setDocuments([]);
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

  const actionsRenderer = (instance, td, row) => {
    const rowData = instance.getSourceDataAtRow(row);

    let root = td._reactRoot; // simpan root di property custom
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
            onClick={() => deleteDocument(rowData.id)}
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
        title: "Name",
        readOnly: true,
        renderer: textRenderer,
      },
    ],
    [documents]
  );

  // Inline edit
  const afterChange = (changes, source) => {
    if (source === "loadData" || !changes) return;

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue !== newValue) {
        const rowData = hotTableRef.current.hotInstance.getSourceDataAtRow(row);
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
              await api.put(`/document-phc/${rowData.id}`, {
                ...rowData,
                [prop]: newValue,
              });
              fetchDocuments();
              Swal.fire(
                "Updated!",
                "Document updated successfully.",
                "success"
              );
            } catch (error) {
              console.error(error);
              Swal.fire("Error", "Failed to update document", "error");
              fetchDocuments();
            }
          } else {
            fetchDocuments();
          }
        });
      }
    });
  };

  // Open form
  const openForm = (doc = null) => {
    if (doc) {
      setFormData({
        id: doc.id,
        name: doc.name || "",
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
        await api.put(`/document-phc/${formData.id}`, formData);
        Swal.fire("Success", "Document updated successfully", "success");
      } else {
        await api.post("/document-phc", formData);
        Swal.fire("Success", "Document created successfully", "success");
      }
      setIsFormOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save document", "error");
    }
  };

  // Delete document
  const deleteDocument = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/document-phc/${id}`);
          Swal.fire("Deleted!", "Document deleted successfully.", "success");
          fetchDocuments();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete document", "error");
        }
      }
    });
  };

  // Filter
  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredDocs.slice(
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
          placeholder="Search documents..."
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
          count={filteredDocs.length}
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
          {formData.id ? "Edit Document" : "Create Document"}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Name"
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
