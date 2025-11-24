import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Typography,
  Stack,
  Box,
  Snackbar,
  Alert,
  TextField,
  TablePagination,
  Card,
  CardContent,
  Button,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReactDOM from "react-dom";

import { getTaxes, createTax, updateTax, deleteTax } from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import FormTaxModal from "../../components/modal/FormTaxModal";
import ViewTaxModal from "../../components/modal/ViewTaxModal";

import {
  dateRenderer,
  textRenderer,
  valueRenderer,
} from "../../utils/handsontableRenderers";

export default function TaxTable() {
  const hotTableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formModal, setFormModal] = useState({
    open: false,
    mode: "create", // "create" or "edit"
    tax: null,
  });

  const [viewModal, setViewModal] = useState({
    open: false,
    tax: null,
  });

  // Definisi kolom
  const allColumns = useMemo(
    () => [
      { data: "id", title: "ID", readOnly: true, renderer: textRenderer },
      { data: "name", title: "Name", readOnly: true, renderer: textRenderer },
      { data: "rate", title: "Rate", readOnly: true, renderer: valueRenderer },
      {
        data: "created_at",
        title: "Created At",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "updated_at",
        title: "Updated At",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        renderer: (instance, td, row) => {
          const tax = taxes[row];
          if (!tax) return td;

          td.innerHTML = "";
          const container = document.createElement("div");
          container.style.display = "flex";
          container.style.gap = "4px";

          // View button
          const viewBtn = document.createElement("button");
          viewBtn.innerHTML = "👁️";
          viewBtn.style.border = "none";
          viewBtn.style.background = "none";
          viewBtn.style.cursor = "pointer";
          viewBtn.onclick = () => handleView(tax);
          container.appendChild(viewBtn);

          // Edit button
          const editBtn = document.createElement("button");
          editBtn.innerHTML = "✏️";
          editBtn.style.border = "none";
          editBtn.style.background = "none";
          editBtn.style.cursor = "pointer";
          editBtn.onclick = () => handleEdit(tax);
          container.appendChild(editBtn);

          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.innerHTML = "🗑️";
          deleteBtn.style.border = "none";
          deleteBtn.style.background = "none";
          deleteBtn.style.cursor = "pointer";
          deleteBtn.onclick = () => handleDelete(tax.id);
          container.appendChild(deleteBtn);

          td.appendChild(container);
          return td;
        },
      },
    ],
    [taxes]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getTaxes();
      setTaxes(response.data || []);
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch taxes data",
        severity: "error",
      });
      setTaxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleView = (tax) => {
    setViewModal({ open: true, tax });
  };

  const handleEdit = (tax) => {
    setFormModal({ open: true, mode: "edit", tax });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tax?")) return;
    try {
      await deleteTax(id);
      setSnackbar({
        open: true,
        message: "Tax deleted successfully",
        severity: "success",
      });
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to delete tax",
        severity: "error",
      });
    }
  };

  const handleCreate = () => {
    setFormModal({ open: true, mode: "create", tax: null });
  };

  const handleFormSubmit = async (data) => {
    try {
      if (formModal.mode === "create") {
        await createTax(data);
        setSnackbar({
          open: true,
          message: "Tax created successfully",
          severity: "success",
        });
      } else {
        await updateTax(formModal.tax.id, data);
        setSnackbar({
          open: true,
          message: "Tax updated successfully",
          severity: "success",
        });
      }
      setFormModal({ open: false, mode: "create", tax: null });
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to save tax",
        severity: "error",
      });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = taxes.filter((tax) =>
    tax.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 2, mt: 2, justifyContent: "flex-start" }}
      >
        <Card sx={{ minWidth: 200, maxWidth: 250 }}>
          <CardContent sx={{ textAlign: "center", py: 1 }}>
            <Typography variant="body1" color="primary" fontWeight="medium">
              Total Taxes
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {taxes.length}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        justifyContent="space-between"
        alignItems="center"
        mt={3}
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search taxes..."
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ borderRadius: "8px" }}
        >
          Add Tax
        </Button>
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
            fixedColumnsLeft={2}
            stretchH="all"
            filters
            dropdownMenu
            className="ht-theme-horizon"
            manualColumnMove
          />
        </div>
      </div>

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

      {/* Modals */}
      <FormTaxModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, mode: "create", tax: null })}
        onSubmit={handleFormSubmit}
        tax={formModal.tax}
        mode={formModal.mode}
      />
      <ViewTaxModal
        open={viewModal.open}
        onClose={() => setViewModal({ open: false, tax: null })}
        tax={viewModal.tax}
      />
    </Box>
  );
}
