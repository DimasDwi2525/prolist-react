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
  Chip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DescriptionIcon from "@mui/icons-material/Description";
import api from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import FilterBar from "../../components/filter/FilterBar";
import { filterBySearch } from "../../utils/filter";
import { getClientName } from "../../utils/getClientName";
import { sortOptions } from "../../helper/SortOptions";

export default function MarketingReport() {
  const hotTableRef = useRef(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  // const [totalQuotationValue, setTotalQuotationValue] = useState(null);
  // const [totalQuotationsCount, setTotalQuotationsCount] = useState(0);
  const [filteredTotalValue, setFilteredTotalValue] = useState(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    rangeType: "monthly",
    month: null,
    from: "",
    to: "",
  });
  const [availableYears, setAvailableYears] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // === FORMATTER ===
  const formatDate = (val) => {
    if (!val) return "-";
    try {
      const date = new Date(val);
      if (isNaN(date)) return "-";
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      return `${d}-${m}-${date.getFullYear()}`;
    } catch {
      return "-";
    }
  };

  const formatValue = (val) => {
    if (val == null || val === "" || isNaN(val)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    td.style.color = "#000";
    return td;
  };

  const textRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    td.style.color = "#000";
    return td;
  };

  const valueRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatValue(value);
    td.style.fontWeight = "600";
    td.style.color = "green";
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    const statusMap = {
      A: { label: "[A] ✓ Completed", color: "success", variant: "filled" },
      D: { label: "[D] ⏳ No PO Yet", color: "warning", variant: "outlined" },
      E: { label: "[E] ❌ Cancelled", color: "error", variant: "outlined" },
      F: { label: "[F] ⚠️ Lost Bid", color: "warning", variant: "outlined" },
      O: { label: "[O] 🕒 On Going", color: "info", variant: "outlined" },
    };

    const status = statusMap[value] || {
      label: value,
      color: "default",
      variant: "outlined",
    };

    // Render Chip as HTML
    td.innerHTML = `<span style="
      background-color: ${
        status.variant === "filled"
          ? status.color === "success"
            ? "#4caf50"
            : status.color === "error"
            ? "#f44336"
            : "#2196f3"
          : "transparent"
      };
      color: ${
        status.variant === "filled"
          ? "white"
          : status.color === "success"
          ? "#4caf50"
          : status.color === "error"
          ? "#f44336"
          : "#2196f3"
      };
      border: ${
        status.variant === "outlined"
          ? `1px solid ${
              status.color === "success"
                ? "#4caf50"
                : status.color === "error"
                ? "#f44336"
                : "#2196f3"
            }`
          : "none"
      };
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      display: inline-block;
      min-width: 120px;
      text-align: center;
    ">${status.label}</span>`;
    return td;
  };

  // === COLUMNS ===
  const allColumns = useMemo(
    () => [
      {
        data: "no_quotation",
        title: "No. Quotation",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "title_quotation",
        title: "Title",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "client_name",
        title: "Client",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "client_pic",
        title: "PIC",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "quotation_date",
        title: "Date",
        renderer: dateRenderer,
        readOnly: true,
      },
      {
        data: "quotation_value",
        title: "Value",
        renderer: valueRenderer,
        readOnly: true,
      },
      {
        data: "quotation_weeks",
        title: "Week",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "revision_quotation_date",
        title: "Revision Date",
        renderer: dateRenderer,
        readOnly: true,
      },
      {
        data: "revisi",
        title: "Revision",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "status",
        title: "Status",
        renderer: statusRenderer,
        readOnly: true,
      },
      { data: "notes", title: "Notes", renderer: textRenderer, readOnly: true },
    ],
    []
  );

  // === VISIBILITY STATE ===
  const initialVisibility = {};
  allColumns.forEach((col) => {
    initialVisibility[col.data] = true;
  });
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const handleToggleColumn = (field) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // === FETCH DATA ===
  const fetchQuotations = async (filterParams = {}) => {
    try {
      const params = new URLSearchParams();
      if (filterParams.year) params.append("year", filterParams.year);
      if (filterParams.rangeType)
        params.append("range_type", filterParams.rangeType);
      if (filterParams.month) params.append("month", filterParams.month);
      if (filterParams.from) params.append("from_date", filterParams.from);
      if (filterParams.to) params.append("to_date", filterParams.to);

      const res = await api.get(`/marketing-report?${params.toString()}`);
      const data = res.data.data.map((q, idx) => ({
        id: idx + 1,
        no_quotation: q.no_quotation,
        title_quotation: q.title_quotation,
        client_name: getClientName(q),
        client_pic: q.client_pic || "-",
        quotation_date: q.quotation_date,
        quotation_value: q.quotation_value,
        quotation_weeks: q.quotation_weeks || "-",
        revision_quotation_date: q.revision_quotation_date,
        revisi: q.revisi || "-",
        status: q.status,
        notes: q.notes || "-",
      }));
      setQuotations(data);
      // setTotalQuotationValue(
      //   res.data.totalQuotationValue ||
      //     res.data.filters?.totalQuotationValue ||
      //     0
      // );
      // setTotalQuotationsCount(data.length);
      setAvailableYears(
        res.data.availableYears || res.data.filters?.available_years || []
      );
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch marketing report",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchQuotations(newFilters);
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // === FILTER & PAGINATION ===
  const filteredData = useMemo(() => {
    let data = filterBySearch(quotations, searchTerm);
    if (selectedStatus) {
      data = data.filter((item) => item.status === selectedStatus);
    }
    if (selectedClient) {
      data = data.filter((item) => item.client_name === selectedClient);
    }
    return data;
  }, [quotations, searchTerm, selectedStatus, selectedClient]);

  // Calculate filtered totals
  useEffect(() => {
    if (quotations.length > 0) {
      const totalValue = filteredData.reduce(
        (sum, item) => sum + (Number(item.quotation_value) || 0),
        0
      );
      setFilteredTotalValue(totalValue);
      setFilteredCount(filteredData.length);
    }
  }, [filteredData, quotations.length]);

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 70 + 50, window.innerHeight - 250);

  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangePageSize = (e) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      {/* Loading */}
      <LoadingOverlay loading={loading} />

      {/* FilterBar */}
      <FilterBar
        stats={{
          availableYears:
            availableYears.length > 0
              ? availableYears
              : [new Date().getFullYear()],
        }}
        onFilter={handleFilterChange}
        initialFilters={filters}
      />

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AttachMoneyIcon color="primary" />
                <Typography variant="h6" component="div">
                  Quote Ammounts
                </Typography>
              </Stack>
              <Typography variant="h4" color="primary">
                {formatValue(filteredTotalValue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DescriptionIcon color="primary" />
                <Typography variant="h6" component="div">
                  Total Quotations
                </Typography>
              </Stack>
              <Typography variant="h4" color="primary">
                {filteredCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Controls */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        alignItems="center"
        mb={2}
      >
        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            label="Status"
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            <MenuItem value="A">[A] Completed</MenuItem>
            <MenuItem value="D">[D] No PO Yet</MenuItem>
            <MenuItem value="E">[E] Cancelled</MenuItem>
            <MenuItem value="F">[F] Lost Bid</MenuItem>
            <MenuItem value="O">[O] On Going</MenuItem>
          </Select>
        </FormControl>

        {/* Client Filter */}
        <Autocomplete
          size="small"
          sx={{ minWidth: 120 }}
          options={sortOptions([
            ...new Set(quotations.map((q) => q.client_name)),
          ])}
          value={selectedClient}
          onChange={(event, newValue) => setSelectedClient(newValue || "")}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Client"
              placeholder="Select client..."
            />
          )}
          clearOnEscape
        />

        <TextField
          size="small"
          placeholder="Search Quotation..."
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
      {paginatedData.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: tableHeight,
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <Typography variant="h6" color="textSecondary">
            No marketing data found for the selected filters
          </Typography>
        </Box>
      ) : (
        <HotTable
          ref={hotTableRef}
          data={paginatedData}
          colHeaders={allColumns.map((c) => c.title)}
          columns={allColumns}
          width="100%"
          height={tableHeight} // <=== tinggi dinamis
          rowHeights={40} // konsisten tinggi baris
          manualColumnResize
          licenseKey="non-commercial-and-evaluation"
          manualColumnFreeze
          fixedColumnsLeft={2}
          stretchH="all"
          filters
          dropdownMenu
          manualColumnMove
          hiddenColumns={{
            columns: allColumns
              .map((col, i) => (columnVisibility[col.data] ? null : i))
              .filter((i) => i !== null),
            indicators: true,
          }}
          className="ht-theme-horizon"
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
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
    </Box>
  );
}
