import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import {
  Typography,
  Stack,
  Box,
  Snackbar,
  Alert,
  IconButton,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import ReactDOM from "react-dom";

import api from "../../api/api";
import ViewRetentionModal from "../../components/modal/ViewRetentionModal";
import FormRetentionModal from "../../components/modal/FormRetentionModal";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";
import { dateRenderer, valueRenderer } from "../../utils/handsontableRenderers";

export default function RetentionTable() {
  const hotTableRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [retentions, setRetentions] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRetention, setSelectedRetention] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    retention: null,
  });

  // Definisi kolom
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 150,
        renderer: (instance, td, row) => {
          td.innerHTML = "";

          // wrapper flex
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.alignItems = "center";
          wrapper.style.gap = "4px"; // jarak antar tombol lebih compact

          // View button
          const viewBtn = document.createElement("button");
          viewBtn.style.cursor = "pointer";
          viewBtn.style.border = "1px solid #0ea5e9";
          viewBtn.style.background = "#e0f2fe";
          viewBtn.style.borderRadius = "6px";
          viewBtn.style.padding = "4px 8px";
          viewBtn.style.display = "flex";
          viewBtn.style.alignItems = "center";
          viewBtn.style.gap = "4px";
          viewBtn.style.fontSize = "12px";
          viewBtn.style.color = "#0c4a6e";
          viewBtn.style.transition = "all 0.2s";
          viewBtn.title = "View";

          const viewIcon = document.createElement("span");
          viewIcon.innerHTML = "👁️";
          viewBtn.appendChild(viewIcon);

          const viewLabel = document.createElement("span");
          viewLabel.innerText = "View";
          viewBtn.appendChild(viewLabel);

          viewBtn.onmouseover = () => {
            viewBtn.style.background = "#bae6fd";
            viewBtn.style.borderColor = "#0284c7";
          };
          viewBtn.onmouseout = () => {
            viewBtn.style.background = "#e0f2fe";
            viewBtn.style.borderColor = "#0ea5e9";
          };

          viewBtn.onclick = () => {
            const retention = instance.getSourceDataAtRow(row);
            setSelectedRetention(retention);
            setOpenViewModal(true);
          };

          wrapper.appendChild(viewBtn);

          // Edit button
          const editBtn = document.createElement("button");
          editBtn.style.cursor = "pointer";
          editBtn.style.border = "1px solid #f59e0b";
          editBtn.style.background = "#fef3c7";
          editBtn.style.borderRadius = "6px";
          editBtn.style.padding = "4px 8px";
          editBtn.style.display = "flex";
          editBtn.style.alignItems = "center";
          editBtn.style.gap = "4px";
          editBtn.style.fontSize = "12px";
          editBtn.style.color = "#92400e";
          editBtn.style.transition = "all 0.2s";
          editBtn.title = "Edit";

          const editIcon = document.createElement("span");
          editIcon.innerHTML = "✏️";
          editBtn.appendChild(editIcon);

          const editLabel = document.createElement("span");
          editLabel.innerText = "Edit";
          editBtn.appendChild(editLabel);

          editBtn.onmouseover = () => {
            editBtn.style.background = "#fde68a";
            editBtn.style.borderColor = "#d97706";
          };
          editBtn.onmouseout = () => {
            editBtn.style.background = "#fef3c7";
            editBtn.style.borderColor = "#f59e0b";
          };

          editBtn.onclick = () => {
            const retention = instance.getSourceDataAtRow(row);
            setSelectedRetention(retention);
            setOpenFormModal(true);
          };
          wrapper.appendChild(editBtn);

          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.style.cursor = "pointer";
          deleteBtn.style.border = "1px solid #ef4444";
          deleteBtn.style.background = "#fef2f2";
          deleteBtn.style.borderRadius = "6px";
          deleteBtn.style.padding = "4px 8px";
          deleteBtn.style.display = "flex";
          deleteBtn.style.alignItems = "center";
          deleteBtn.style.gap = "4px";
          deleteBtn.style.fontSize = "12px";
          deleteBtn.style.color = "#991b1b";
          deleteBtn.style.transition = "all 0.2s";
          deleteBtn.title = "Delete";

          const deleteIcon = document.createElement("span");
          deleteIcon.innerHTML = "🗑️";
          deleteBtn.appendChild(deleteIcon);

          const deleteLabel = document.createElement("span");
          deleteLabel.innerText = "Delete";
          deleteBtn.appendChild(deleteLabel);

          deleteBtn.onmouseover = () => {
            deleteBtn.style.background = "#fecaca";
            deleteBtn.style.borderColor = "#dc2626";
          };
          deleteBtn.onmouseout = () => {
            deleteBtn.style.background = "#fef2f2";
            deleteBtn.style.borderColor = "#ef4444";
          };

          deleteBtn.onclick = () => {
            const retention = instance.getSourceDataAtRow(row);
            setDeleteDialog({ open: true, retention });
          };
          wrapper.appendChild(deleteBtn);

          td.appendChild(wrapper);
          return td;
        },
      },
      { data: "project_number", title: "Project Number", readOnly: true },
      { data: "project_name", title: "Project Name", readOnly: true },
      { data: "client_name", title: "Client Name", readOnly: true },
      { data: "invoice_number", title: "Invoice Number", readOnly: true },
      {
        data: "retention_due_date",
        title: "Retention Due Date",
        renderer: dateRenderer,
        readOnly: true,
      },
      {
        data: "retention_value",
        title: "Retention Value",
        renderer: valueRenderer,
        readOnly: true,
      },
    ],
    []
  );

  const initialVisibility = {};
  allColumns.forEach((col) => {
    initialVisibility[col.data] = true;
  });
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const fetchRetentions = async () => {
    try {
      const res = await api.get("/finance/retentions");
      const retentionsData = res.data?.map((r) => ({
        id: r.id,
        project_id: r.project_id,
        retention_due_date: r.retention_due_date,
        retention_value: r.retention_value,
        invoice_id: r.invoice_id,
        project_number: r.project?.project_number || "-",
        project_name: r.project?.project_name || "-",
        client_name: r.client_name || "-",
        invoice_number: r.invoice?.invoice_number || "-",
      }));
      setRetentions(retentionsData);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchRetentions();

      // Fetch projects for form modal
      const resProjects = await api.get("/projects");
      setProjects(resProjects.data?.data || []);
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.retention) return;

    try {
      await api.delete(`/finance/retentions/${deleteDialog.retention.id}`);
      setSnackbar({
        open: true,
        message: "Retention deleted successfully!",
        severity: "success",
      });
      setDeleteDialog({ open: false, retention: null });
      loadData();
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete retention",
        severity: "error",
      });
    }
  };

  const filteredData = filterBySearch(retentions, searchTerm).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    retention_due_date: r.retention_due_date,
    retention_value: r.retention_value,
    invoice_id: r.invoice_id,
    project_number: r.project_number,
    project_name: r.project_name,
    client_name: r.client_name,
    invoice_number: r.invoice_number,
  }));
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

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
          placeholder="Search retentions..."
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
            setSelectedRetention(null); // create mode
            setOpenFormModal(true);
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
            fixedColumnsLeft={1}
            stretchH="all"
            filters
            dropdownMenu
            className="ht-theme-horizon"
            manualColumnMove
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

      {/* View Retention Modal */}
      <ViewRetentionModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedRetention(null);
        }}
        retention={selectedRetention}
      />

      {/* Form Retention Modal */}
      <FormRetentionModal
        open={openFormModal}
        onClose={() => {
          setOpenFormModal(false);
          setSelectedRetention(null);
        }}
        retention={selectedRetention}
        projects={projects}
        onSave={() => {
          setSnackbar({
            open: true,
            message: selectedRetention
              ? "Retention updated successfully!"
              : "Retention created successfully!",
            severity: "success",
          });
          loadData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, retention: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this retention?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, retention: null })}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
