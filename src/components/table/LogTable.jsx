import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Button,
  Stack,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import api from "../../api/api";
import FormLogModal from "../modal/FormLogModal";
import { getUser } from "../../utils/storage";

import {
  dateRenderer,
  textRenderer,
  statusRenderer,
} from "../../utils/handsontableRenderers";

export default function LogTable({ projectId }) {
  const hotTableRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const user = getUser();

  // Konfirmasi modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ------------------ Fetch logs ------------------ //
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/logs`);
      setLogs(
        res.data.map((log) => ({
          id: log.id,
          logs: log.logs,
          tgl_logs: log.tgl_logs,
          status: log.status,
          categorie: log.category?.name || "-",
          user: log.user?.name || "-",
          user_id: log.user?.id || null,
          responseUser: log.response_user ? log.response_user.name : "-",
          approvals: log.approvals || [],
        }))
      );
      console.log(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  // ------------------ Handlers ------------------ //
  const openConfirm = (log) => {
    setSelectedLog(log);
    setConfirmOpen(true);
  };

  const handleConfirmClose = async () => {
    if (!selectedLog) return;

    try {
      await api.patch(`/logs/${selectedLog.id}/close`); // pakai endpoint baru
      fetchLogs(); // refresh data
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmOpen(false);
      setSelectedLog(null);
    }
  };

  const handleCancelClose = () => {
    setConfirmOpen(false);
    setSelectedLog(null);
  };

  const handleLogCreated = () => {
    fetchLogs();
  };

  // ------------------ Columns ------------------ //
  const allColumns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        width: 60,
        renderer: (instance, td, row) => {
          td.innerHTML = "";

          const log = instance.getSourceDataAtRow(row);

          // Only show close button if status is not closed and user is the creator
          if (log.status !== "closed" && log.user_id === user?.id) {
            const closeBtn = document.createElement("button");
            closeBtn.style.cursor = "pointer";
            closeBtn.style.border = "none";
            closeBtn.style.background = "transparent";
            closeBtn.title = "Close";

            const icon = document.createElement("span");
            icon.innerHTML = "❌";
            closeBtn.appendChild(icon);

            closeBtn.onclick = () => {
              openConfirm(log);
            };

            td.appendChild(closeBtn);
          }

          return td;
        },
      },
      {
        data: "tgl_logs",
        title: "Date",
        readOnly: true,
        renderer: dateRenderer,
      },
      {
        data: "user",
        title: "Created By",
        readOnly: true,
        renderer: textRenderer,
      },
      {
        data: "categorie",
        title: "Category",
        readOnly: true,
        renderer: textRenderer,
      },
      { data: "logs", title: "Log", readOnly: true, renderer: textRenderer },
      {
        data: "status",
        title: "Status",
        readOnly: true,
        renderer: statusRenderer,
      },
      {
        data: "responseUser",
        title: "Response User",
        readOnly: true,
        renderer: textRenderer,
      },
    ],
    []
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filtered data
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory =
        categoryFilter === "" || log.categorie === categoryFilter;
      const matchesStatus = statusFilter === "" || log.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [logs, categoryFilter, statusFilter]);

  const paginatedData = filteredLogs.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  // ------------------ Render ------------------ //
  return (
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2} p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {/* Filters */}
          <Box display="flex" gap={2}>
            <Autocomplete
              size="small"
              sx={{ minWidth: 200 }}
              options={["", ...new Set(logs.map((log) => log.categorie))]}
              getOptionLabel={(option) => option || "All Categories"}
              value={categoryFilter}
              onChange={(event, newValue) => setCategoryFilter(newValue || "")}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Category" />
              )}
            />

            <Autocomplete
              size="small"
              sx={{ minWidth: 200 }}
              options={["", "open", "closed", "waiting approval"]}
              getOptionLabel={(option) => {
                if (option === "") return "All Statuses";
                if (option === "open") return "Open";
                if (option === "closed") return "Closed";
                if (option === "waiting approval") return "Waiting Approval";
                return option;
              }}
              value={statusFilter}
              onChange={(event, newValue) => setStatusFilter(newValue || "")}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Status" />
              )}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenModal(true)}
          >
            + Add Log
          </Button>
        </Box>

        <FormLogModal
          open={openModal}
          handleClose={() => setOpenModal(false)}
          projectId={projectId}
          onLogCreated={handleLogCreated}
        />

        {logs.length === 0 && !loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              backgroundColor: "#fafafa",
            }}
          >
            <Typography variant="h6" color="textSecondary">
              No logs available for this project.
            </Typography>
          </Box>
        ) : (
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
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Pagination */}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <TablePagination
            component="div"
            count={filteredLogs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangePageSize}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>

        {/* ------------------ Modal Konfirmasi Close ------------------ */}
        <Dialog open={confirmOpen} onClose={handleCancelClose}>
          <DialogTitle>Confirm Close Log</DialogTitle>
          <DialogContent>
            Are you sure you want to close this log?
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelClose}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmClose}
            >
              Close Log
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}
