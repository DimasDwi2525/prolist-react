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
import {
  dateRenderer,
  textRenderer,
  valueRenderer,
  statusRenderer,
} from "../../utils/handsontableRenderers";
import { formatValue } from "../../utils/formatValue";

export default function SalesReport() {
  const hotTableRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  // const [totalProjectValue, setTotalProjectValue] = useState(null);
  // const [totalProjectsCount, setTotalProjectsCount] = useState(0);
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
        data: "project_number",
        title: "Project Number",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "project_name",
        title: "Project Name",
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
        data: "category_name",
        title: "Category",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "quotation_number",
        title: "Quotation",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "po_date",
        title: "PO Date",
        renderer: dateRenderer,
        readOnly: true,
      },
      {
        data: "po_value",
        title: "Value",
        renderer: valueRenderer,
        readOnly: true,
      },
      {
        data: "po_number",
        title: "PO Number",
        renderer: textRenderer,
        readOnly: true,
      },
      {
        data: "status",
        title: "Status",
        renderer: statusRenderer,
        readOnly: true,
      },
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
  const fetchProjects = async (filterParams = {}) => {
    try {
      const params = new URLSearchParams();
      if (filterParams.year) params.append("year", filterParams.year);
      if (filterParams.rangeType)
        params.append("range_type", filterParams.rangeType);
      if (filterParams.month) params.append("month", filterParams.month);
      if (filterParams.from) params.append("from_date", filterParams.from);
      if (filterParams.to) params.append("to_date", filterParams.to);

      const res = await api.get(`/sales-report?${params.toString()}`);
      const data = res.data.data.map((p, idx) => ({
        id: idx + 1,
        project_number: p.project_number,
        project_name: p.project_name,
        client_name: getClientName(p),
        category_name: p.category?.name || "-",
        quotation_number: p.quotation?.no_quotation || "-",
        po_date: p.po_date,
        po_value: p.po_value,
        po_number: p.po_number,
        status: p.status?.name || p.status_project?.name || "-",
      }));
      setProjects(data);
      // setTotalProjectValue(
      //   res.data.totalProjectValue || res.data.filters?.totalProjectValue || 0
      // );
      // setTotalProjectsCount(data.length);
      setAvailableYears(
        res.data.availableYears || res.data.filters?.available_years || []
      );
    } catch (err) {
      console.error(err.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to fetch sales report",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Note: Backend filtering may not be implemented, so we rely on frontend filtering
    // fetchProjects(newFilters); // Commented out since backend may not filter
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // === FILTER & PAGINATION ===
  const filteredData = useMemo(() => {
    let data = projects;

    // FilterBar filters (frontend implementation since backend may not be filtering)
    if (filters.year) {
      data = data.filter((item) => {
        const itemYear = new Date(
          item.po_date || item.created_at
        ).getFullYear();
        return itemYear === filters.year;
      });
    }
    if (filters.rangeType === "monthly" && filters.month) {
      data = data.filter((item) => {
        const itemMonth =
          new Date(item.po_date || item.created_at).getMonth() + 1;
        return itemMonth === filters.month;
      });
    }
    if (filters.rangeType === "weekly") {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      data = data.filter((item) => {
        const itemDate = new Date(item.po_date || item.created_at);
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      });
    }
    if (filters.rangeType === "custom" && filters.from && filters.to) {
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);
      data = data.filter((item) => {
        const itemDate = new Date(item.po_date || item.created_at);
        return itemDate >= fromDate && itemDate <= toDate;
      });
    }

    // Frontend filters
    data = filterBySearch(data, searchTerm);
    if (selectedStatus) {
      data = data.filter((item) => item.status === selectedStatus);
    }
    if (selectedClient) {
      data = data.filter((item) => item.client_name === selectedClient);
    }
    if (selectedCategory) {
      data = data.filter((item) => item.category_name === selectedCategory);
    }
    return data;
  }, [
    projects,
    searchTerm,
    selectedStatus,
    selectedClient,
    selectedCategory,
    filters,
  ]);

  // Calculate filtered totals
  useEffect(() => {
    if (projects.length > 0) {
      const totalValue = filteredData.reduce(
        (sum, item) => sum + (Number(item.po_value) || 0),
        0
      );
      setFilteredTotalValue(totalValue);
      setFilteredCount(filteredData.length);
    }
  }, [filteredData, projects.length]);

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const rowHeight = 50; // updated tinggi tiap row to match ProjectTable
  const headerHeight = 50; // keep header height same
  const tableHeight = Math.min(
    pageSize * rowHeight + headerHeight,
    window.innerHeight - 250
  );

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
                  Booking Sales
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
                  Total Projects
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
        <Autocomplete
          size="small"
          sx={{ minWidth: 120 }}
          options={[...new Set(projects.map((p) => p.status))].filter(Boolean)}
          value={selectedStatus}
          onChange={(event, newValue) => setSelectedStatus(newValue || "")}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Status"
              placeholder="Select status..."
            />
          )}
          clearOnEscape
        />

        {/* Client Filter */}
        <Autocomplete
          size="small"
          sx={{ minWidth: 120 }}
          options={[...new Set(projects.map((p) => p.client_name))]}
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

        {/* Category Filter */}
        <Autocomplete
          size="small"
          sx={{ minWidth: 120 }}
          options={[...new Set(projects.map((p) => p.category_name))]}
          value={selectedCategory}
          onChange={(event, newValue) => setSelectedCategory(newValue || "")}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Category"
              placeholder="Select category..."
            />
          )}
          clearOnEscape
        />

        <TextField
          size="small"
          placeholder="Search sales..."
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
            No sales data found for the selected filters
          </Typography>
        </Box>
      ) : (
        <HotTable
          ref={hotTableRef}
          data={paginatedData}
          colHeaders={allColumns.map((c) => c.title)}
          columns={allColumns}
          width="100%"
          height={tableHeight} // <=== updated tinggi dinamis consistent with ProjectTable
          rowHeights={rowHeight} // konsisten tinggi baris 50 for parity with ProjectTable
          autoRowSize={false} // added to fix height mismatch with frozen columns
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
