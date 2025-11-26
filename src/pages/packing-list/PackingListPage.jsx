import React, { useEffect, useState, useRef } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Button,
  Stack,
  Box,
  TablePagination,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../../api/api";
import FormPackingListModal from "../../components/modal/FormPackingListModal";
import { formatDate } from "../../utils/FormatDate";
import { filterBySearch } from "../../utils/filter";

export default function PackingListPage() {
  const hotTableRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [openModal, setOpenModal] = useState(false); // <- state modal
  const [mode, setMode] = useState("create"); // 'create' or 'edit'
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [plTypes, setPlTypes] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const textRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    td.style.color = "black";
    return td;
  };

  const [formValues, setFormValues] = useState({
    pn_id: "",
    destination: "",
    expedition_id: "",
    pl_date: "",
    ship_date: "",
    pl_type_id: "",
    client_pic: "",
    int_pic: "",
    receive_date: "",
    pl_return_date: "",
    remark: "",
    pl_number: "",
    pl_id: "",
  });

  // Fetch packing lists
  const fetchPackingLists = async () => {
    try {
      const res = await api.get("/packing-lists");
      setRows(
        res.data.map((pl) => ({
          pl_id: pl.pl_id,
          pl_number: pl.pl_number,
          pn_id: pl.project?.project_number,
          client_pic: pl.client_pic || null,
          int_pic: pl.int_pic?.name || null,
          destination: pl.destination?.destination || "",
          expedition_name: pl.expedition?.name || "",
          pl_date: pl.pl_date ? new Date(pl.pl_date) : null,
          ship_date: pl.ship_date ? new Date(pl.ship_date) : null,
          receive_date: pl.receive_date ? new Date(pl.receive_date) : null,
          pl_return_date: pl.pl_return_date
            ? new Date(pl.pl_return_date)
            : null,
          pl_type: pl.pl_type?.name || "",
          remark: pl.remark,
          created_by: pl.creator?.name || null,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackingLists();
    fetchProjectsAndUsers();
  }, []);

  const fetchProjectsAndUsers = async () => {
    try {
      const [
        projectsRes,
        usersRes,
        expeditionsRes,
        plTypesRes,
        destinationsRes,
      ] = await Promise.all([
        api.get("/projects"),
        api.get("/users"),
        api.get("/master-expeditions"),
        api.get("/master-type-packing-lists"),
        api.get("/destinations"),
      ]);
      setProjects(
        Array.isArray(projectsRes.data)
          ? projectsRes.data
          : projectsRes.data?.data || []
      );
      setUsers(
        Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || []
      );
      setExpeditions(
        Array.isArray(expeditionsRes.data)
          ? expeditionsRes.data
          : expeditionsRes.data?.data || []
      );
      setPlTypes(
        Array.isArray(plTypesRes.data)
          ? plTypesRes.data
          : plTypesRes.data?.data || []
      );
      setDestinations(
        Array.isArray(destinationsRes.data)
          ? destinationsRes.data
          : destinationsRes.data?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to fetch projects, users, expeditions, PL types, and destinations",
        err
      );
    }
  };

  // New save function for create/edit with correct data mapping
  const savePackingList = async (formData) => {
    try {
      // Map project_number string to pn_number (primary key) integer for API
      const project = projects.find((p) => p.project_number === formData.pn_id);
      const pn_id = project ? project.pn_number : null;

      // Prepare payload according to API validation requirements
      const payload = {
        pn_id: pn_id || null, // use pn_number primary key, not project_number string
        destination_id: formData.destination_id || null,
        expedition_id: formData.expedition_id || null,
        pl_date: formData.pl_date || null,
        ship_date: formData.ship_date || null,
        pl_type_id: formData.pl_type_id || null,
        int_pic: formData.int_pic || null,
        client_pic: formData.client_pic || null,
        receive_date: formData.receive_date || null,
        pl_return_date: formData.pl_return_date || null,
        remark: formData.remark || null,
        pl_number: formData.pl_number || null,
      };

      let res;
      if (mode === "create") {
        res = await api.post("/packing-lists", payload);
      } else if (mode === "edit") {
        res = await api.put(`/packing-lists/${formData.pl_id}`, payload);
      }
      setSnackbarMessage(
        mode === "create"
          ? "Packing list created successfully."
          : "Packing list updated successfully."
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      handleCreateSuccess(res.data);
    } catch (err) {
      console.error("Failed to save packing list", err);
      setSnackbarMessage("Failed to save packing list.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this packing list?")) return;
    try {
      await api.delete(`/packing-lists/${id}`);
      fetchPackingLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateModal = async () => {
    setMode("create");
    try {
      const { data } = await api.get("/packing-lists/generate-number");
      setFormValues({
        pn_id: "",
        destination_id: "",
        expedition_id: "",
        pl_date: "",
        ship_date: "",
        pl_type_id: "",
        client_pic: "",
        int_pic: "",
        receive_date: "",
        pl_return_date: "",
        remark: "",
        pl_number: data.pl_number,
        pl_id: data.pl_id,
      });
      setOpenModal(true);
    } catch (err) {
      console.error("Failed to generate PL number", err);
    }
  };

  const handleEdit = async (pl_id) => {
    setMode("edit");
    try {
      const res = await api.get(`/packing-lists/${pl_id}`);
      const pl = res.data;
      setFormValues({
        pn_id: pl.project?.project_number || "",
        destination_id: pl.destination_id || "",
        expedition_id: pl.expedition_id || "",
        pl_date: pl.pl_date
          ? new Date(pl.pl_date).toISOString().split("T")[0]
          : "",
        ship_date: pl.ship_date
          ? new Date(pl.ship_date).toISOString().split("T")[0]
          : "",
        pl_type_id: pl.pl_type_id || "",
        client_pic: pl.client_pic || "",
        int_pic: pl.int_pic?.id || "",
        receive_date: pl.receive_date
          ? new Date(pl.receive_date).toISOString().split("T")[0]
          : "",
        pl_return_date: pl.pl_return_date
          ? new Date(pl.pl_return_date).toISOString().split("T")[0]
          : "",
        remark: pl.remark || "",
        pl_number: pl.pl_number || "",
        pl_id: pl.pl_id || "",
      });
      setOpenModal(true);
    } catch (err) {
      console.error("Failed to fetch packing list for edit", err);
    }
  };

  // Updated handleCreateSuccess to only update states without closing modal
  const handleCreateSuccess = (newItem) => {
    if (mode === "create") {
      setRows((prev) => [newItem, ...prev]);
      fetchPackingLists(); // Refresh the list to show the new item
    } else if (mode === "edit") {
      setRows((prev) =>
        prev.map((row) => (row.pl_id === newItem.pl_id ? newItem : row))
      );
      fetchPackingLists(); // Refresh to get updated data
    }
    setOpenModal(false);
  };

  // Columns for Handsontable
  const columns = [
    {
      data: "actions",
      title: "Actions",
      readOnly: true,
      width: 90,
      renderer: (instance, td, row) => {
        td.innerHTML = "";

        // wrapper flex
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "4px"; // very compact spacing

        // Edit button - ultra compact with background
        const editBtn = document.createElement("button");
        editBtn.style.cursor = "pointer";
        editBtn.style.border = "none";
        editBtn.style.background = "#e3f2fd";
        editBtn.style.padding = "8px";
        editBtn.style.borderRadius = "4px";
        editBtn.style.color = "#1976d2";
        editBtn.style.display = "flex";
        editBtn.style.alignItems = "center";
        editBtn.style.justifyContent = "center";
        editBtn.style.width = "40px";
        editBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
        editBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
        editBtn.title = "Edit";
        editBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
        editBtn.onmouseover = () => {
          editBtn.style.backgroundColor = "#1976d2";
          editBtn.style.color = "#fff";
          editBtn.style.boxShadow = "0 2px 6px rgba(25, 118, 210, 0.3)";
          editBtn.style.transform = "translateY(-1px)";
        };
        editBtn.onmouseout = () => {
          editBtn.style.backgroundColor = "#e3f2fd";
          editBtn.style.color = "#1976d2";
          editBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
          editBtn.style.transform = "translateY(0)";
        };
        editBtn.onclick = () => {
          const rowData = instance.getSourceDataAtRow(row);
          if (rowData?.pl_id) {
            handleEdit(rowData.pl_id);
          }
        };

        // Delete button - ultra compact with background
        const deleteBtn = document.createElement("button");
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.border = "none";
        deleteBtn.style.background = "#ffebee";
        deleteBtn.style.padding = "8px";
        deleteBtn.style.borderRadius = "4px";
        deleteBtn.style.color = "#d32f2f";
        deleteBtn.style.display = "flex";
        deleteBtn.style.alignItems = "center";
        deleteBtn.style.justifyContent = "center";
        deleteBtn.style.width = "40px";
        deleteBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
        deleteBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
        deleteBtn.title = "Delete";
        deleteBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
        deleteBtn.onmouseover = () => {
          deleteBtn.style.backgroundColor = "#d32f2f";
          deleteBtn.style.color = "#fff";
          deleteBtn.style.boxShadow = "0 2px 6px rgba(211, 47, 47, 0.3)";
          deleteBtn.style.transform = "translateY(-1px)";
        };
        deleteBtn.onmouseout = () => {
          deleteBtn.style.backgroundColor = "#ffebee";
          deleteBtn.style.color = "#d32f2f";
          deleteBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
          deleteBtn.style.transform = "translateY(0)";
        };
        deleteBtn.onclick = () => {
          const rowData = instance.getSourceDataAtRow(row);
          if (rowData?.pl_id) {
            handleDelete(rowData.pl_id);
          }
        };

        wrapper.appendChild(editBtn);
        wrapper.appendChild(deleteBtn);
        td.appendChild(wrapper);
        return td;
      },
    },
    {
      data: "pl_number",
      title: "PL_NO",
      readOnly: true,
      renderer: textRenderer,
    },
    { data: "pn_id", title: "PNID", readOnly: true, renderer: textRenderer },
    {
      data: "destination",
      title: "DESTINATION",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "expedition_name",
      title: "EXPEDITION",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "pl_type",
      title: "PL_TYPE",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "pl_date",
      title: "PL_DATE",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = formatDate(value);
        return td;
      },
    },
    {
      data: "ship_date",
      title: "SHIP_DATE",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = formatDate(value);
        return td;
      },
    },
    {
      data: "receive_date",
      title: "RECEIVE_DATE",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = formatDate(value);
        return td;
      },
    },
    {
      data: "pl_return_date",
      title: "PL_RETURN_DATE",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = formatDate(value);
        return td;
      },
    },
    {
      data: "int_pic",
      title: "INT_PIC",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "client_pic",
      title: "CLIENT_PIC",
      readOnly: true,
      renderer: textRenderer,
    },
    { data: "remark", title: "REMARK", readOnly: true, renderer: textRenderer },
    {
      data: "created_by",
      title: "CREATED_BY",
      readOnly: true,
      renderer: textRenderer,
    },
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // reset ke halaman pertama
  };

  // Apply search filter before pagination
  const filteredRows = filterBySearch(rows, searchTerm);

  // Reset to first page if filteredRows length is less than current page's start index
  React.useEffect(() => {
    if (page > 0 && page * pageSize >= filteredRows.length) {
      setPage(0);
    }
  }, [searchTerm, filteredRows.length, page, pageSize]);

  const paginatedData = filteredRows.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  // Snackbar handlers
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2} p={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreateModal}
          >
            Add Packing List
          </Button>
          <TextField
            size="small"
            placeholder="Search packing list..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: 320,
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
              colHeaders={columns.map((c) => c.title)}
              columns={columns}
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
            count={rows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangePageSize}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Box>

        {/* Modal */}
        <FormPackingListModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          formValues={formValues}
          setFormValues={setFormValues}
          onSuccess={savePackingList}
          mode={mode}
          projects={projects}
          users={users}
          expeditions={expeditions}
          plTypes={plTypes}
          destinations={destinations}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
}
