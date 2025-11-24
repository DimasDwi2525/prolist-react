import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Button,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ArrowLeft, Plus, Edit3, Eye } from "lucide-react";
import { format } from "date-fns";
import api from "../../../api/api";
import ManPowerWorkOrderFormModal from "../../../components/modal/ManPowerWorkOrderFormModal";
import ViewWorkOrderModal from "../../../components/modal/ViewWorkOrderModal";

export default function ManPowerWorkOrderTable() {
  const { pn_number } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openWO, setOpenWO] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [openView, setOpenView] = useState(false);
  // Removed currentUser state and fetchCurrentUser function as they are no longer used

  // === Fetch Project ===
  const fetchProject = async () => {
    try {
      const resProject = await api.get(`/projects/${pn_number}`);
      setProject(resProject.data.data.project);
    } catch (err) {
      console.error(err);
    }
  };

  // === Fetch Work Orders ===
  const fetchWorkOrders = async () => {
    if (!pn_number) return;
    setLoading(true);
    try {
      const resWO = await api.get(`/man-power/work-orders/${pn_number}`);
      console.log(resWO);
      setWorkOrders(resWO.data.data.map((wo) => ({ id: wo.id, ...wo })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchCurrentUser(); // removed since currentUser state and function are removed
    fetchProject();
    fetchWorkOrders();
  }, [pn_number]);

  // === HANDLE EDIT FUNCTION ===
  const handleEdit = (woId) => {
    const wo = workOrders.find((w) => w.id === woId);
    setSelectedWorkOrder(wo);
    setOpenWO(true);
  };

  // === HANDLE VIEW FUNCTION ===
  const handleView = async (woId) => {
    try {
      const res = await api.get(`/work-order/detail/${woId}`);
      setSelectedWorkOrder(res.data.data); // load detail WO
      setOpenView(true); // buka modal view
    } catch (err) {
      console.error(err);
    }
  };

  // === HANDLE MODAL CLOSE ===
  const handleModalClose = (updatedWO) => {
    setOpenWO(false);
    setSelectedWorkOrder(null);

    if (!updatedWO) return;

    const newWorkOrders = [...workOrders];

    const mapWO = (wo) => {
      if (!wo.id) {
        console.error("Row tidak punya id. DataGrid akan error!", wo);
        return null; // skip jika tidak ada id
      }
      return wo;
    };

    if (Array.isArray(updatedWO)) {
      updatedWO.forEach((wo) => {
        const mapped = mapWO(wo);
        if (!mapped) return;

        const exists = newWorkOrders.find((w) => w.id === mapped.id);
        if (exists) {
          const index = newWorkOrders.findIndex((w) => w.id === mapped.id);
          newWorkOrders[index] = mapped;
        } else {
          newWorkOrders.push(mapped);
        }
      });
    } else {
      const mapped = mapWO(updatedWO);
      if (mapped) {
        const index = newWorkOrders.findIndex((w) => w.id === mapped.id);
        if (index !== -1) newWorkOrders[index] = mapped;
        else newWorkOrders.push(mapped);
      }
    }

    // Urutkan
    newWorkOrders.sort(
      (a, b) =>
        (Number(a.wo_number_in_project) || 0) -
        (Number(b.wo_number_in_project) || 0)
    );

    setWorkOrders(newWorkOrders);
  };

  const formatDate = (val) => {
    if (!val) return "-";
    const d = new Date(val);
    return format(d, "dd-MM-yyyy");
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params) => [
        <GridActionsCellItem
          key="view"
          icon={
            <Tooltip title="View">
              <Eye size={18} color="blue" />
            </Tooltip>
          }
          label="View"
          onClick={() => handleView(params.row.id)}
        />,
        [
          <GridActionsCellItem
            key="edit"
            icon={
              <Tooltip title="Edit">
                <Edit3 size={18} color="green" />
              </Tooltip>
            }
            label="Edit"
            onClick={() => handleEdit(params.row.id)}
            // disabled={params.row.status === "finished"}
          />,
        ],
      ],
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1.2,
      renderCell: (params) => {
        if (!params.value) return "-";

        const statusColorMap = {
          "waiting approval": "warning",
          approved: "success",
          finished: "default", // atau "primary" sesuai preferensi
        };

        const color = statusColorMap[params.value.toLowerCase()] || "default";

        return <Chip label={params.value} color={color} size="small" />;
      },
    },

    { field: "wo_number_in_project", headerName: "WO No.", flex: 1 },
    { field: "wo_kode_no", headerName: "WO Code", flex: 1.5 },
    {
      field: "wo_date",
      headerName: "WO Date",
      flex: 1.2,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: "total_mandays_eng",
      headerName: "Mandays ENG",
      flex: 1,
    },
    {
      field: "total_mandays_elect",
      headerName: "Mandays ELECT",
      flex: 1,
    },
    {
      field: "add_work",
      headerName: "Additional Work",
      flex: 1.2,
      renderCell: (params) =>
        params.value === 1 || params.value === true || params.value === "1" ? (
          <Chip label="Yes" color="primary" size="small" />
        ) : (
          <Chip label="No" variant="outlined" size="small" />
        ),
    },
    {
      field: "pics",
      headerName: "PICs",
      flex: 2,
      renderCell: (params) => {
        if (!params.value || !params.value.length) return "-";
        return (
          <Stack spacing={0.5}>
            {params.value.map((pic, idx) => (
              <Typography key={idx} variant="body2" noWrap>
                {pic.user?.name} {pic.role ? `(${pic.role.name})` : ""}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
    {
      field: "descriptions",
      headerName: "Descriptions",
      flex: 3,
      renderCell: (params) => {
        if (!params.value || !params.value.length) return "-";
        return (
          <Stack spacing={0.5}>
            {params.value.map((desc, idx) => (
              <Typography
                key={idx}
                variant="body2"
                noWrap
                sx={{ fontStyle: "italic" }}
              >
                {desc.title || "-"}: {desc.description || "-"}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
  ];

  return (
    <div style={{ height: 600, width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Typography variant="subtitle1" fontWeight={600} ml={1}>
            {project?.project_number
              ? `Work Orders - ${project.project_number}`
              : "Work Orders"}
          </Typography>
        </Stack>

        <IconButton
          size="small"
          sx={{
            backgroundColor: "#2563eb",
            color: "#fff",
            "&:hover": { backgroundColor: "#1e40af" },
          }}
          onClick={() => setOpenWO(true)}
        >
          <Plus size={16} />
        </IconButton>
      </Stack>

      <div className="table-wrapper">
        <div className="table-inner">
          <DataGrid
            rows={workOrders}
            columns={columns}
            getRowId={(row) => row.id || row.wo_number_in_project}
            loading={loading}
            pageSizeOptions={[10, 20]}
            sx={{
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-columnHeader": {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            }}
          />
        </div>
      </div>
      {openWO && (
        <ManPowerWorkOrderFormModal
          open={openWO}
          onClose={handleModalClose}
          project={project}
          workOrder={selectedWorkOrder}
        />
      )}

      {/* Modal View Detail */}
      {openView && selectedWorkOrder && (
        <ViewWorkOrderModal
          open={openView}
          onClose={() => setOpenView(false)}
          workOrderId={selectedWorkOrder.id}
        />
      )}
    </div>
  );
}
