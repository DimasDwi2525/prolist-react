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

import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import ViewWorkOrderModal from "../../components/modal/ViewWorkOrderModal";
import WorkOrderFormModal from "../../components/modal/WorkOrderFormModal";
import { getUser } from "../../utils/storage";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import FilterBar from "../../components/filter/FilterBar";
import DashboardCard from "../../components/card/DashboardCard";
import { filterBySearch } from "../../utils/filter";
import { getClientName } from "../../utils/getClientName";

import {
  dateRenderer,
  statusRenderer,
  textRenderer,
} from "../../utils/handsontableRenderers";

export default function WorkOrderSummary() {
  const navigate = useNavigate();
  const hotTableRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [workOrders, setWorkOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWorkOrderForEdit, setSelectedWorkOrderForEdit] =
    useState(null);

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    range_type: "monthly",
    month: new Date().getMonth() + 1,
    from_date: "",
    to_date: "",
  });

  const [stats, setStats] = useState({
    availableYears: [],
  });

  const user = getUser();
  const userRole = user?.role?.name?.toLowerCase();
  const marketingRoles = [
    "marketing_admin",
    "manager_marketing",
    "sales_supervisor",
    "super_admin",
    "marketing_director",
    "supervisor marketing",
    "sales_supervisor",
    "marketing_estimator",
    "engineering_director",
  ].includes(userRole);
  const engineerRoles = [
    "project controller",
    "project manager",
    "engineering_admin",
  ].includes(userRole);
  const suc = ["warehouse"].includes(userRole);

  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 120,
        renderer: (instance, td, row) => {
          td.innerHTML = "";
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.alignItems = "center";
          wrapper.style.gap = "6px";

          const viewBtn = document.createElement("button");
          viewBtn.style.cursor = "pointer";
          viewBtn.style.border = "none";
          viewBtn.style.background = "transparent";
          viewBtn.title = "View";

          const icon = document.createElement("span");
          icon.innerHTML = "👁️";
          viewBtn.appendChild(icon);

          viewBtn.onclick = () => {
            const wo = instance.getSourceDataAtRow(row);
            if (wo?.wo_id) {
              setSelectedWoId(wo.wo_id);
              setOpenViewModal(true);
            }
          };

          const editBtn = document.createElement("button");
          editBtn.style.cursor = "pointer";
          editBtn.style.border = "none";
          editBtn.style.background = "transparent";
          editBtn.title = "Edit";
          editBtn.style.fontSize = "16px";
          editBtn.style.lineHeight = "1";
          editBtn.style.padding = "0";

          const editIcon = document.createElement("span");
          editIcon.innerHTML = "✏️"; // Pencil icon emoji
          editBtn.appendChild(editIcon);

          editBtn.onclick = () => {
            const wo = instance.getSourceDataAtRow(row);
            if (wo) {
              setSelectedWorkOrderForEdit(wo);
              setEditModalOpen(true);
            }
          };

          wrapper.appendChild(viewBtn);
          wrapper.appendChild(editBtn);
          td.appendChild(wrapper);
          return td;
        },
      },
      {
        data: "wo_code",
        title: "WO Code",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "project_number",
        title: "Project Number",
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
        data: "total_mandays",
        title: "Total Mandays",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "status",
        title: "Status",
        readOnly: true,
        renderer: statusRenderer,
      },
      {
        data: "actual_end_working_date",
        title: "Actual End Date",
        readOnly: true,
        renderer: dateRenderer,
      },
    ],
    [marketingRoles, engineerRoles, suc, navigate, workOrders]
  );

  const roleGroupColumnMap = {
    marketing: allColumns.map((c) => c.data),
    engineer: allColumns.map((c) => c.data),
    warehouse: allColumns.map((c) => c.data),
    super_admin: allColumns.map((c) => c.data),
  };

  let roleGroup = null;
  if (marketingRoles) roleGroup = "marketing";
  else if (engineerRoles) roleGroup = "engineer";
  else if (suc) roleGroup = "warehouse";
  else if (userRole === "super_admin") roleGroup = "super_admin";

  const allowedColumns = roleGroup ? roleGroupColumnMap[roleGroup] : [];
  const filteredColumns = allColumns.filter((col) =>
    allowedColumns.includes(col.data)
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/work-order/work-order-summary", {
        params: filters,
      });
      setSummary(response.data.summary || {});
      setWorkOrders(response.data.work_orders || []);
      setStats((prev) => ({
        ...prev,
        availableYears: response.data.availableYears || prev.availableYears,
      }));
    } catch (err) {
      if (err.response?.status === 404) {
        setSummary({});
        setWorkOrders([]);
      } else {
        console.error(err.response?.data || err);
        setSnackbar({
          open: true,
          message: "Failed to fetch data",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
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

  const filteredData = filterBySearch(workOrders, searchTerm).map((wo) => ({
    actions: "👁️",
    wo_id: wo.wo_id,
    wo_code: wo.wo_code,
    project_number: wo.project_number,
    project_name: wo.project_name,
    client_name: getClientName(wo),
    total_mandays: wo.total_mandays,
    status: wo.status,
    actual_end_working_date: wo.actual_end_working_date,
  }));

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      <LoadingOverlay loading={loading} />

      <Box mb={2}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(90deg, #1e3a8a, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 0.5,
          }}
        >
          Work Order Summary
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Overview of completed work orders by year and month
        </Typography>
      </Box>

      <FilterBar
        stats={stats}
        onFilter={handleFilter}
        initialFilters={{
          year: new Date().getFullYear(),
          rangeType: "monthly",
          month: new Date().getMonth() + 1,
          from: "",
          to: "",
        }}
      />

      <Box mt={3}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <DashboardCard
            title="Total Finished Work Orders"
            value={summary.total_finished || 0}
            color="blue"
          />
          <DashboardCard
            title="Total Mandays"
            value={summary.total_mandays || 0}
            color="green"
          />
          <DashboardCard
            title="Average Mandays"
            value={summary.average_mandays || 0}
            color="orange"
          />
        </Stack>
      </Box>

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
          placeholder="Search work orders..."
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
      </Stack>

      <div className="table-wrapper">
        <div className="table-inner">
          <HotTable
            ref={hotTableRef}
            data={paginatedData}
            colHeaders={filteredColumns.map((c) => c.title)}
            columns={filteredColumns}
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

      <ViewWorkOrderModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedWoId(null);
        }}
        workOrderId={selectedWoId}
      />

      <WorkOrderFormModal
        open={editModalOpen}
        onClose={(updatedWorkOrder) => {
          setEditModalOpen(false);
          setSelectedWorkOrderForEdit(null);
          if (updatedWorkOrder) {
            // Refresh list or update state
            fetchData();
          }
        }}
        workOrder={selectedWorkOrderForEdit}
        project={selectedWorkOrderForEdit?.project}
      />

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
