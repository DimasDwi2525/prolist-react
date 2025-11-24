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
} from "@mui/material";
import ReactDOM from "react-dom";

import api from "../../api/api";
import RequestInvoiceDetailModal from "../../components/modal/RequestInvoiceDetailModal";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import FilterBar from "../../components/filter/FilterBar";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import { filterBySearch } from "../../utils/filter";
import {
  statusRenderer as customStatusRenderer,
  dateRenderer,
  textRenderer,
} from "../../utils/handsontableRenderers";

export default function RequestInvoiceTable() {
  const hotTableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [requestInvoices, setRequestInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedRequestInvoiceId, setSelectedRequestInvoiceId] =
    useState(null);

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    range_type: "monthly",
    month: null,
    from_date: "",
    to_date: "",
  });

  const [stats, setStats] = useState({
    availableYears: [new Date().getFullYear()],
  });

  // Definisi kolom
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 60,
        renderer: (instance, td, row) => {
          td.innerHTML = "";

          // wrapper flex
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.alignItems = "center";
          wrapper.style.gap = "6px"; // jarak antar tombol

          // 👁️ View button
          const viewBtn = document.createElement("button");
          viewBtn.style.cursor = "pointer";
          viewBtn.style.border = "none";
          viewBtn.style.background = "#e8f5e8";
          viewBtn.style.padding = "8px";
          viewBtn.style.borderRadius = "4px";
          viewBtn.style.color = "#2e7d32";
          viewBtn.style.display = "flex";
          viewBtn.style.alignItems = "center";
          viewBtn.style.justifyContent = "center";
          viewBtn.style.width = "40px";
          viewBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
          viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
          viewBtn.title = "View";
          viewBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
          viewBtn.onmouseover = () => {
            viewBtn.style.backgroundColor = "#2e7d32";
            viewBtn.style.color = "#fff";
            viewBtn.style.boxShadow = "0 2px 6px rgba(46, 125, 50, 0.3)";
            viewBtn.style.transform = "translateY(-1px)";
          };
          viewBtn.onmouseout = () => {
            viewBtn.style.backgroundColor = "#e8f5e8";
            viewBtn.style.color = "#2e7d32";
            viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
            viewBtn.style.transform = "translateY(0)";
          };

          viewBtn.onclick = () => {
            const requestInvoice = instance.getSourceDataAtRow(row);
            if (requestInvoice?.id) {
              setSelectedRequestInvoiceId(requestInvoice.id);
              setOpenViewModal(true);
            }
          };

          wrapper.appendChild(viewBtn);
          td.appendChild(wrapper);
          return td;
        },
      },
      {
        data: "request_invoice_number",
        title: "Request Invoice Number",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "project_name",
        title: "Project Name",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "client_name",
        title: "Client",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "requested_by_name",
        title: "Requested By",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "approved_by_name",
        title: "Approved By",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "created_at",
        title: "Created At",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "status",
        title: "Status",
        readOnly: true,
        renderer: customStatusRenderer,
      },
    ],
    []
  );

  const initialVisibility = {};
  allColumns.forEach((col) => {
    initialVisibility[col.data] = true; // semua kolom default visible
  });
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/request-invoices-list", {
        params: filters,
      });
      const data = response.data || {};
      setRequestInvoices(data.data || []);
      setStats((prev) => ({
        ...prev,
        availableYears: data.availableYears || [new Date().getFullYear()],
      }));
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch request invoices data",
        severity: "error",
      });
      setRequestInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = (invoiceId, newStatus) => {
    setRequestInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      )
    );
  };

  const handleRefreshCallback = () => {
    updateInvoiceStatus(selectedRequestInvoiceId, "approved");
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleFilter = (newFilters) => {
    const payload = {
      year: newFilters.year,
      range_type: newFilters.rangeType,
    };

    if (newFilters.month) payload.month = newFilters.month;
    if (newFilters.from) payload.from_date = newFilters.from;
    if (newFilters.to) payload.to_date = newFilters.to;

    setFilters(payload);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = filterBySearch(requestInvoices, searchTerm).map(
    (item) => ({
      actions: "👁️",
      id: item.id,
      request_invoice_number: item.request_number || "",
      project_name: item.project?.project_name || "",
      client_name: item.project?.client_name || "-",
      requested_by_name: item.requested_by?.name || "",
      approved_by_name: item.approved_by?.name || "",
      created_at: item.created_at,
      status: item.status || "",
    })
  );
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      <FilterBar
        stats={stats}
        onFilter={handleFilter}
        initialFilters={{
          year: new Date().getFullYear(),
          rangeType: "monthly",
          month: null,
          from: "",
          to: "",
        }}
      />

      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mt={3}
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Search request invoices..."
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
            fixedColumnsLeft={3}
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

      <RequestInvoiceDetailModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedRequestInvoiceId(null);
        }}
        invoiceId={selectedRequestInvoiceId}
        refreshCallback={handleRefreshCallback}
      />

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
