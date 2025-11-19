import React, { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem, GridToolbar } from "@mui/x-data-grid";
import { Plus, Edit3 } from "lucide-react";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Box,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Autocomplete,
  TextField,
  Tooltip,
} from "@mui/material";

import api from "../api/api";

import { sortOptions } from "../helper/SortOptions";

export default function ManPowerAllocationView({ pn_number }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const columns = [
    {
      field: "user_id",
      headerName: "User",
      flex: 2,
      renderCell: (params) => {
        const user = users.find((u) => u.id === params.value);
        return user ? user.name : "—";
      },
    },
    {
      field: "role_id",
      headerName: "Role",
      flex: 2,
      renderCell: (params) => {
        const role = roles.find((r) => String(r.id) === String(params.value));
        return role ? role.name : params.row.role_name; // fallback ke API role_name
      },
    },
    {
      field: "project_id",
      headerName: "Project PN",
      flex: 2,
      renderCell: (params) => {
        return params.row.project?.project_number || "—";
      },
    },
  ];

  useEffect(() => {
    if (!pn_number) {
      setLoading(false);
      return;
    }

    const fetchAllocations = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/man-power/${pn_number}`);
        const rows = res.data.data.map((a) => ({
          ...a,
          id: a.id,
          user_id: a.user?.id, // simpan ID
          role_id: a.role_id, // allocation sudah punya role_id
          user_name: a.user?.name, // simpan juga nama untuk ditampilkan
          role_name: a.user?.role?.name, // ambil dari relasi user.role
        }));

        console.log(rows);

        setAllocations(rows);
      } catch (err) {
        console.error("Error fetching allocations:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, [pn_number]);

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      const usersRes = await api.get("/users/manPowerUsers"); // endpoint harus menyesuaikan
      const rolesRes = await api.get("/users/manPowerRoles"); // type_role = 2
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const content = (
    <>
      <DataGrid
        rows={allocations}
        columns={columns}
        pagination
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowsPerPageOptions={[10, 20, 50]}
        disableSelectionOnClick
        getRowId={(row) =>
          row.id ?? `${row.project_id}-${row.user_id}-${row.role_id}`
        }
      />
    </>
  );

  return content;
}
