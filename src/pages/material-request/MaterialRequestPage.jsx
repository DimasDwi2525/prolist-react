import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Typography,
  Stack,
  Box,
  TextField,
  TablePagination,
} from "@mui/material";

import api from "../../api/api"; // Axios instance

import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import { filterBySearch } from "../../utils/filter";
import {
  textRenderer,
  statusRenderer,
} from "../../utils/handsontableRenderers";

export default function MaterialRequestPage() {
  const navigate = useNavigate();
  const hotTableRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const percentRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = `${value != null ? value : 0}%`;
    return td;
  };

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
          td.style.display = "flex";
          td.style.justifyContent = "center";
          td.style.alignItems = "center";

          // View button
          const viewBtn = document.createElement("button");
          viewBtn.style.cursor = "pointer";
          viewBtn.style.border = "none";
          viewBtn.style.background = "transparent";
          viewBtn.style.padding = "4px";
          viewBtn.style.borderRadius = "4px";
          viewBtn.style.transition = "background-color 0.2s";
          viewBtn.title = "View";

          const icon = document.createElement("span");
          icon.innerHTML = "👁️";
          icon.style.fontSize = "16px";
          viewBtn.appendChild(icon);

          viewBtn.onmouseover = () => {
            viewBtn.style.backgroundColor = "#f0f0f0";
          };
          viewBtn.onmouseout = () => {
            viewBtn.style.backgroundColor = "transparent";
          };

          viewBtn.onclick = () => {
            const project = instance.getSourceDataAtRow(row);
            if (project?.pn_number) {
              navigate(`/material-request/${project.pn_number}`);
            }
          };

          td.appendChild(viewBtn);
          return td;
        },
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
        data: "total_mr",
        title: "TOTAL MR",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "completed_mr",
        title: "COMPLETED MR",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "mr_progress",
        title: "MR PROGRESS (%)",
        renderer: percentRenderer,
        readOnly: true,
      },
      {
        data: "status_project",
        title: "Status",
        renderer: statusRenderer,
        readOnly: true,
      },
    ],
    [navigate]
  );

  const fetchProjects = async () => {
    try {
      const res = await api.get("/mr-summary");

      const projectsData = res.data?.data?.map((p) => {
        return {
          pn_number: p.pn_number,
          ...p,
          categories_name: p.category?.name || "-",
          status_project: p.status_project || {
            id: Number(p.status_project_id),
          },
          project_number: p.project_number,
          project_name: p.project_name,
          total_mr: p.total_mr,
          completed_mr: p.completed_mr,
          mr_progress: p.mr_progress,
        };
      });

      console.log(projectsData);

      setProjects(projectsData);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // reset ke halaman pertama
  };

  const filteredData = filterBySearch(projects, searchTerm).map((p) => ({
    actions: "",
    pn_number: p.pn_number,
    project_number: p.project_number,
    project_name: p.project_name,
    total_mr: p.total_mr,
    completed_mr: p.completed_mr,
    mr_progress: p.mr_progress,
    status_project: p.status_project,
  }));
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  // --- Fetch clients & projects sekaligus ---
  const loadData = async () => {
    setLoading(true);
    try {
      // --- Projects ---
      await fetchProjects();
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
          />
        </div>
      </div>

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
