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

export default function DestinationTable() {
  const hotTableRef = useRef(null);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    destination: "",
    address: "",
    alias: "",
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/destinations");
      setDestinations(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load destinations", "error");
      setDestinations([]);
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
            onClick={() => deleteDestination(rowData.id)}
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
        data: "destination",
        title: "Destination",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "address",
        title: "Address",
        renderer: textRenderer,
        readOnly: true,
      },
      { data: "alias", title: "Alias", renderer: textRenderer, readOnly: true },
    ],
    [destinations]
  );

  // Open modal form
  const openForm = (destination = null) => {
    if (destination) {
      setFormData({
        id: destination.id,
        destination: destination.destination || "",
        address: destination.address || "",
        alias: destination.alias || "",
      });
    } else {
      setFormData({
        id: null,
        destination: "",
        address: "",
        alias: "",
      });
    }
    setIsFormOpen(true);
  };

  // Save form
  const saveForm = async () => {
    try {
      if (formData.id) {
        await api.put(`/destinations/${formData.id}`, formData);
        Swal.fire("Success", "Destination updated successfully", "success");
      } else {
        await api.post("/destinations", formData);
        Swal.fire("Success", "Destination created successfully", "success");
      }
      setIsFormOpen(false);
      fetchDestinations();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save destination", "error");
    }
  };

  // Delete destination
  const deleteDestination = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/destinations/${id}`);
          Swal.fire("Deleted!", "Destination deleted successfully.", "success");
          fetchDestinations();
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete destination", "error");
        }
      }
    });
  };

  // Filter + Pagination
  const filteredDestinations = destinations.filter((d) =>
    d.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredDestinations.slice(
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
          placeholder="Search destinations..."
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
          count={filteredDestinations.length}
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
          {formData.id ? "Edit Destination" : "Create Destination"}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Destination"
              value={formData.destination}
              onChange={(e) =>
                setFormData({ ...formData, destination: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Alias"
              value={formData.alias}
              onChange={(e) =>
                setFormData({ ...formData, alias: e.target.value })
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
