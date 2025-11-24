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
import {
  dateRenderer,
  textRenderer,
  valueRenderer,
  statusRenderer,
} from "../../utils/handsontableRenderers";

import { formatValue } from "../../utils/formatValue";

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

  const tableHeight = Math.min(pageSize * 50 + 50, window.innerHeight - 250);

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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card
            elevation={6}
            sx={{
              borderRadius: 3,
              transition: "box-shadow 0.3s ease-in-out",
              "&:hover": {
                boxShadow:
                  "0px 12px 24px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                <AttachMoneyIcon color="primary" fontSize="large" />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: "bold", color: "text.primary" }}
                >
                  Quote Amounts
                </Typography>
              </Stack>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: "700", letterSpacing: "0.02em" }}
              >
                {typeof formatValue(filteredTotalValue || 0) === "object"
                  ? formatValue(filteredTotalValue || 0).formatted
                  : formatValue(filteredTotalValue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card
            elevation={6}
            sx={{
              borderRadius: 3,
              transition: "box-shadow 0.3s ease-in-out",
              "&:hover": {
                boxShadow:
                  "0px 12px 24px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                <DescriptionIcon color="primary" fontSize="large" />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: "bold", color: "text.primary" }}
                >
                  Total Quotations
                </Typography>
              </Stack>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: "700", letterSpacing: "0.02em" }}
              >
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
          rowHeights={50} // konsisten tinggi baris, updated from 40 to 50 to match ProjectTable.jsx
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
