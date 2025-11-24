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
  Typography,
  Paper,
  Skeleton,
} from "@mui/material";
import { Plus } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import { textRenderer } from "../../utils/handsontableRenderers";

export default function InvoiceTypeTable() {
  const hotTableRef = useRef(null);
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    code_type: "",
    description: "",
  });

  useEffect(() => {
    fetchInvoiceTypes();
  }, []);

  const fetchInvoiceTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/finance/invoice-types");
      setInvoiceTypes(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load invoice types", "error");
      setInvoiceTypes([]);
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
            onClick={() => deleteInvoiceType(rowData.id)}
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
        width: 100,
      },
      {
        data: "code_type",
        title: "Code Type",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "description",
        title: "Description",
        readOnly: true,
        renderer: textRenderer,
      },
    ],
    [invoiceTypes]
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
              await api.put(`/finance/invoice-types/${rowData.id}`, {
                ...rowData,
                [prop]: newValue,
              });
              fetchInvoiceTypes();
              Swal.fire(
                "Updated!",
                "Invoice type updated successfully.",
                "success"
              );
            } catch (error) {
              console.error(error);
              Swal.fire("Error", "Failed to update invoice type", "error");
              fetchInvoiceTypes();
            }
          } else {
            fetchInvoiceTypes();
          }
        });
      }
    });
  };

  // Open form
  const openForm = (invType = null) => {
    if (invType) {
      setFormData({
        id: invType.id,
        code_type: invType.code_type || "",
        description: invType.description || "",
      });
    } else {
      setFormData({
        id: null,
        code_type: "",
        description: "",
      });
    }
    setIsFormOpen(true);
  };

  // Save form
  const saveForm = async () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    try {
      if (formData.id) {
        await api.put(`/finance/invoice-types/${formData.id}`, formData);
        Swal.fire("Success", "Invoice type updated successfully", "success");
      } else {
        await api.post("/finance/invoice-types", formData);
        Swal.fire("Success", "Invoice type created successfully", "success");
      }
      setIsFormOpen(false);
      fetchInvoiceTypes();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save invoice type", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const deleteInvoiceType = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/finance/invoice-types/${id}`);
          Swal.fire(
            "Deleted!",
            "Invoice type deleted successfully.",
            "success"
          );
          fetchInvoiceTypes();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete invoice type", "error");
        }
      }
    });
  };

  // Filter
  const filteredInvoiceTypes = invoiceTypes.filter(
    (it) =>
      it.code_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredInvoiceTypes.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  return (
    <Box sx={{ position: "relative", p: 3 }}>
      <LoadingOverlay loading={loading} />

      {/* Header */}
      <Box mb={3}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          Invoice Types
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your invoice types with advanced editing capabilities.
        </Typography>
      </Box>

      {/* Search & Add */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="Search invoice types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300 }}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => openForm()}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            Add Invoice Type
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={40} />
              <Skeleton variant="rectangular" height={40} />
              <Skeleton variant="rectangular" height={40} />
              <Skeleton variant="rectangular" height={40} />
              <Skeleton variant="rectangular" height={40} />
            </Stack>
          </Box>
        ) : paginatedData.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              px: 3,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Invoice Types Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm
                ? "Try adjusting your search criteria or add a new invoice type."
                : "Get started by adding your first invoice type."}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              onClick={() => openForm()}
              sx={{
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Add Invoice Type
            </Button>
          </Box>
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
      </Paper>

      {/* Pagination */}
      {paginatedData.length > 0 && (
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <TablePagination
            component="div"
            count={filteredInvoiceTypes.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangePageSize}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Box>
      )}

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
          {formData.id ? "Edit Invoice Type" : "Create Invoice Type"}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Code Type"
              value={formData.code_type}
              onChange={(e) =>
                setFormData({ ...formData, code_type: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e5e7eb" }}>
          <Button onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveForm}
            disabled={isSubmitting}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
              "&:disabled": {
                backgroundColor: "#9ca3af",
                color: "#6b7280",
              },
            }}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
