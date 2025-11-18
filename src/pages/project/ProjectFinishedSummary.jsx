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
import ProjectDetailsModal from "../../components/modal/ProjectDetailsModal";
import ProjectDetailModalForAdmins from "../../components/modal/ProjectDetailModalForAdmins";
import ViewProjectsModal from "../../components/modal/ViewProjectsModal";
import { getUser } from "../../utils/storage";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import FilterBar from "../../components/filter/FilterBar";
import DashboardCard from "../../components/card/DashboardCard";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";
import { getClientName } from "../../utils/getClientName";

export default function ProjectFinishedSummary() {
  const navigate = useNavigate();
  const hotTableRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedPnNumber, setSelectedPnNumber] = useState(null);

  const [openViewProjectsModal, setOpenViewProjectsModal] = useState(false);
  const [selectedPnNumberForViewProjects, setSelectedPnNumberForViewProjects] =
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
    "supervisor marketing",
    "sales_supervisor",
    "marketing_estimator",
  ].includes(userRole);
  const adminRoles = [
    "super_admin",
    "engineering_director",
    "marketing_director",
  ].includes(userRole);
  const engineerRoles = [
    "project controller",
    "project manager",
    "engineering_admin",
  ].includes(userRole);
  const suc = ["warehouse"].includes(userRole);

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const percentRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = `${value != null ? value : 0}%`;
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    return td;
  };

  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 60,
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
            const project = instance.getSourceDataAtRow(row);
            if (project?.pn_number) {
              if (adminRoles) {
                setSelectedPnNumber(project.pn_number);
                setOpenDetailsModal(true);
              } else if (marketingRoles) {
                setSelectedPnNumber(project.pn_number);
                setOpenDetailsModal(true);
              } else if (engineerRoles) {
                setSelectedPnNumberForViewProjects(project.pn_number);
                setOpenViewProjectsModal(true);
              } else {
                setSelectedPnNumber(project.pn_number);
                setOpenDetailsModal(true);
              }
            }
          };

          wrapper.appendChild(viewBtn);
          td.appendChild(wrapper);
          return td;
        },
      },
      { data: "pn_number", title: "PN Number" },
      { data: "project_name", title: "Project Name" },
      { data: "client_name", title: "Client" },
      {
        data: "project_finish_date",
        title: "Project Finish Date",
        renderer: dateRenderer,
      },
      {
        data: "project_progress",
        title: "Progress (%)",
        renderer: percentRenderer,
      },
      { data: "status", title: "Status", renderer: statusRenderer },
    ],
    [marketingRoles, engineerRoles, suc, navigate, projects]
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
      const response = await api.get("/projects/finished-summary", {
        params: filters,
      });
      setSummary(response.data.summary || {});
      setProjects(response.data.projects || []);
      setStats((prev) => ({
        ...prev,
        availableYears: response.data.availableYears || prev.availableYears,
      }));
    } catch (err) {
      if (err.response?.status === 404) {
        setSummary({});
        setProjects([]);
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

  // Expose refresh function to window for modal communication
  useEffect(() => {
    window.parentRefreshProjects = async () => {
      await fetchData();
    };
    return () => {
      delete window.parentRefreshProjects;
    };
  }, [filters]);

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

  const filteredData = filterBySearch(projects, searchTerm).map((p) => ({
    actions: "👁️",
    pn_number: p.pn_number,
    project_name: p.project_name,
    po_value: p.po_value,
    project_progress: p.project_progress,
    status: p.status,
    client_name: getClientName(p),
    project_finish_date: formatDate(p.project_finish_date),
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
          Project Finish Summary
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Overview of completed projects by year and month
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
            title="Total Finished Projects"
            value={summary.total_finished || 0}
            color="blue"
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
          placeholder="Search projects..."
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

      {adminRoles ? (
        <ProjectDetailModalForAdmins
          open={openDetailsModal}
          onClose={() => {
            setOpenDetailsModal(false);
            setSelectedPnNumber(null);
          }}
          pn_number={selectedPnNumber}
        />
      ) : (
        <ProjectDetailsModal
          open={openDetailsModal}
          onClose={() => {
            setOpenDetailsModal(false);
            setSelectedPnNumber(null);
          }}
          pn_number={selectedPnNumber}
        />
      )}

      <ViewProjectsModal
        open={openViewProjectsModal}
        onClose={() => {
          setOpenViewProjectsModal(false);
          setSelectedPnNumberForViewProjects(null);
        }}
        pn_number={selectedPnNumberForViewProjects}
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
