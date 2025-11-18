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
import ViewDeliveryOrderModal from "../../components/modal/ViewDeliveryOrderModal";
import FormDeliveryOrderModal from "../../components/modal/FormDeliveryOrderModal";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";
export default function DeliveryOrderTable() {
  const hotTableRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
  const [error, setError] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    deliveryOrder: null,
  });

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  // Definisi kolom
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 200,
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

          viewBtn.onclick = async () => {
            const deliveryOrder = instance.getSourceDataAtRow(row);
            try {
              const res = await api.get(
                `/finance/delivery-orders/${deliveryOrder.id}`
              );
              setSelectedDeliveryOrder(res.data);
              setOpenViewModal(true);
            } catch (err) {
              console.error(err.response?.data || err);
            }
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
            const deliveryOrder = instance.getSourceDataAtRow(row);
            setSelectedDeliveryOrder(deliveryOrder);
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
            const deliveryOrder = instance.getSourceDataAtRow(row);
            setDeleteDialog({ open: true, deliveryOrder });
          };
          wrapper.appendChild(deleteBtn);

          td.appendChild(wrapper);
          return td;
        },
      },
      { data: "do_number", title: "DO Number" },
      { data: "do_no", title: "DO No" },
      { data: "do_description", title: "Description" },
      { data: "project_number", title: "Project Number" },
      { data: "project_name", title: "Project Name" },
      { data: "client_name", title: "Client Name" },
      { data: "invoice_no", title: "Invoice No" },
      {
        data: "return_date",
        title: "Return Date",
        renderer: dateRenderer,
      },
      {
        data: "do_send",
        title: "DO Send",
        renderer: dateRenderer,
      },
      {
        data: "created_at",
        title: "Created At",
        renderer: dateRenderer,
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

  const fetchDeliveryOrders = async () => {
    try {
      setError("");
      const res = await api.get("/finance/delivery-orders");
      const deliveryOrdersData = res.data.map((doItem) => ({
        id: doItem.id,
        do_number: doItem.do_number,
        do_no: doItem.do_no,
        do_description: doItem.do_description,
        pn_id: doItem.pn_id,
        return_date: doItem.return_date,
        invoice_no: doItem.invoice_no,
        invoice_id: doItem.invoice_id,
        do_send: doItem.do_send,
        created_at: doItem.created_at,
        project_number: doItem.project?.project_number || "-",
        project_name: doItem.project?.project_name || "-",
        client_name: doItem.project?.client?.name || "-",
      }));
      setDeliveryOrders(deliveryOrdersData);
    } catch (err) {
      console.error(err.response?.data || err);
      setError("Failed to load delivery orders. Please try again.");
      setDeliveryOrders([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchDeliveryOrders();

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

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteDialog.deliveryOrder) return;

    try {
      await api.delete(
        `/finance/delivery-orders/${deleteDialog.deliveryOrder.id}`
      );
      setSnackbar({
        open: true,
        message: "Delivery order deleted successfully!",
        severity: "success",
      });
      setDeleteDialog({ open: false, deliveryOrder: null });
      loadData();
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete delivery order",
        severity: "error",
      });
    }
  };

  const filteredData = filterBySearch(deliveryOrders, searchTerm).map(
    (doItem) => ({
      id: doItem.id,
      do_number: doItem.do_number,
      do_no: doItem.do_no,
      do_description: doItem.do_description,
      pn_id: doItem.pn_id,
      return_date: doItem.return_date,
      invoice_no: doItem.invoice_no,
      invoice_id: doItem.invoice_id,
      do_send: doItem.do_send,
      created_at: doItem.created_at,
      project_number: doItem.project_number,
      project_name: doItem.project_name,
      client_name: doItem.client_name,
    })
  );
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Loading Overlay */}
      <LoadingOverlay loading={loading} />

      {/* Error Message */}
      {error && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 1,
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      )}

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
          placeholder="Search delivery orders..."
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
            setSelectedDeliveryOrder(null); // create mode
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

      {/* No Data Message */}
      {filteredData.length === 0 && !loading && !error && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: tableHeight,
            bgcolor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" color="textSecondary">
            No delivery orders found.
          </Typography>
        </Box>
      )}

      {/* Handsontable */}
      {filteredData.length > 0 && (
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
      )}

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

      {/* View Delivery Order Modal */}
      <ViewDeliveryOrderModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedDeliveryOrder(null);
        }}
        deliveryOrder={selectedDeliveryOrder}
      />

      {/* Form Delivery Order Modal */}
      <FormDeliveryOrderModal
        open={openFormModal}
        onClose={() => {
          setOpenFormModal(false);
          setSelectedDeliveryOrder(null);
        }}
        deliveryOrder={selectedDeliveryOrder}
        projects={projects}
        onSave={() => {
          setSnackbar({
            open: true,
            message: selectedDeliveryOrder
              ? "Delivery order updated successfully!"
              : "Delivery order created successfully!",
            severity: "success",
          });
          loadData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, deliveryOrder: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this delivery order?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, deliveryOrder: null })
            }
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
