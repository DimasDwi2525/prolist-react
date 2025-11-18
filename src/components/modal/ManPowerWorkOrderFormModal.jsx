import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  Box,
  Autocomplete,
  Tooltip,
  Paper,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NumbersIcon from "@mui/icons-material/Numbers";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import Swal from "sweetalert2";
import api from "../../api/api";
import SectionCard from "../card/SectionCard";
import { sortOptions } from "../../helper/SortOptions";

export default function ManPowerWorkOrderFormModal({
  open,
  onClose,
  project,
  workOrder = null, // jika ada maka edit, jika null maka create
}) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [form, setForm] = useState({
    purpose_id: "",
    wo_date: "",
    wo_count: 1,
    add_work: false,
    location: "",
    vehicle_no: "",
    driver: "",
    pics: [{ user_id: "", role_id: "", _userOption: null, _roleOption: null }],
    descriptions: [{ description: "", result: "" }],
    start_work_time: "",
    stop_work_time: "",
    continue_date: "",
    continue_time: "",
    client_note: "",
    scheduled_start_working_date: "",
    scheduled_end_working_date: "",
    actual_start_working_date: "",
    actual_end_working_date: "",
    accomodation: "",
    material_required: "",
    client_approved: false,
    total_mandays_eng: 0,
    total_mandays_elect: 0,
  });

  // === Fetch users & roles ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUsers = await api.get("/users/engineer-only");
        const resRoles = await api.get("/users/roleTypeTwoOnly");
        const resPurposes = await api.get("/purpose-work-orders");
        setUsers(resUsers.data.data || []);
        setRoles(resRoles.data.data || []);
        setPurposes(resPurposes.data.data || []);

        console.log("Fetched users:", resUsers.data.data);
        console.log("Fetched roles:", resRoles.data.data);
      } catch (err) {
        console.error("Failed to fetch users/roles", err);
      }
    };
    fetchData();
  }, []);

  // === Isi form jika edit ===
  useEffect(() => {
    if (!workOrder) return;
    if (purposes.length === 0) return;
    if (users.length === 0 || roles.length === 0) return;

    const mappedPics = workOrder.pics?.map((p) => ({
      user_id: p.user_id,
      role_id: p.role_id,
      _userOption:
        users.find((u) => String(u.id) === String(p.user_id)) || p.user,
      _roleOption:
        roles.find((r) => String(r.id) === String(p.role_id)) || p.role,
    }));

    const totalEng = mappedPics.filter((p) =>
      p._roleOption?.name?.toLowerCase().includes("engineer")
    ).length;

    const totalElect = mappedPics.filter((p) =>
      p._roleOption?.name?.toLowerCase().includes("electrician")
    ).length;

    setForm((prev) => ({
      ...prev,
      purpose_id: workOrder.purpose_id || "",
      wo_date: formatDate(workOrder.wo_date),
      wo_count: workOrder.wo_count || 1,
      add_work: Boolean(Number(workOrder.add_work)),
      location: workOrder.location || "",
      vehicle_no: workOrder.vehicle_no || "",
      driver: workOrder.driver || "",
      pics: mappedPics,
      descriptions: workOrder.descriptions?.map((d) => ({
        description: d.description || "",
        result: d.result || "",
      })) || [{ description: "", result: "" }],
      start_work_time: extractTime(workOrder.start_work_time),
      stop_work_time: extractTime(workOrder.stop_work_time),
      continue_date: formatDate(workOrder.continue_date),
      continue_time: workOrder.continue_time || "",
      client_note: workOrder.client_note || "",
      scheduled_start_working_date: formatDate(
        workOrder.scheduled_start_working_date
      ),
      scheduled_end_working_date: formatDate(
        workOrder.scheduled_end_working_date
      ),
      actual_start_working_date: formatDate(
        workOrder.actual_start_working_date
      ),
      actual_end_working_date: formatDate(workOrder.actual_end_working_date),
      accomodation: workOrder.accomodation || "",
      material_required: workOrder.material_required || "",
      client_approved: Boolean(Number(workOrder.client_approved)),
      total_mandays_eng: totalEng || Number(workOrder.total_mandays_eng) || 0,
      total_mandays_elect:
        totalElect || Number(workOrder.total_mandays_elect) || 0,
    }));
  }, [workOrder, users, roles, purposes]);

  // 🔹 Hook effect untuk selalu hitung mandays berdasarkan PIC sesuai controller
  useEffect(() => {
    if (!form.pics || form.pics.length === 0) {
      setForm((prev) => ({
        ...prev,
        total_mandays_eng: 0,
        total_mandays_elect: 0,
      }));
      return;
    }

    const mandaysEngineerRoles = [
      "engineer",
      "project_manager",
      "site_manager",
      "site_supervisor",
      "site_admin",
      "foreman",
      "project_controller",
      "document_controller",
      "hse",
      "quality_control",
      "site_warehouse",
    ];

    const totalEng = form.pics.filter((p) =>
      mandaysEngineerRoles.includes(p._roleOption?.name?.toLowerCase())
    ).length;

    const totalElect = form.pics.filter(
      (p) => p._roleOption?.name?.toLowerCase() === "electrician"
    ).length;

    setForm((prev) => ({
      ...prev,
      total_mandays_eng: totalEng,
      total_mandays_elect: totalElect,
    }));
  }, [form.pics]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // === PIC Handlers ===
  const addPic = () => {
    setForm((prev) => ({
      ...prev,
      pics: [...prev.pics, { user_id: "", role_id: "" }],
    }));
  };

  const updatePic = (index, field, value, optionObj) => {
    const updated = [...form.pics];
    updated[index][field] = value;

    if (field === "user_id") updated[index]._userOption = optionObj || null;
    if (field === "role_id") updated[index]._roleOption = optionObj || null;

    setForm((prev) => ({ ...prev, pics: updated }));
  };

  const removePic = (index) => {
    setForm((prev) => ({
      ...prev,
      pics: prev.pics.filter((_, i) => i !== index),
    }));
  };

  // === Description Handlers ===
  const addDescription = () => {
    setForm((prev) => ({
      ...prev,
      descriptions: [...prev.descriptions, { description: "", result: "" }],
    }));
  };

  const updateDescription = (index, field, value) => {
    const updated = [...form.descriptions];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, descriptions: updated }));
  };

  const removeDescription = (index) => {
    setForm((prev) => ({
      ...prev,
      descriptions: prev.descriptions.filter((_, i) => i !== index),
    }));
  };

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // Format yyyy-MM-dd
  }

  function extractTime(datetime) {
    if (!datetime) return "";
    const date = new Date(datetime);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const getWoDatesPreview = () => {
    if (!form.wo_date || form.wo_count < 1) return [];
    const startDate = new Date(form.wo_date);
    const dates = [];

    for (let i = 0; i < form.wo_count; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(
        d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    }

    return dates;
  };

  // === HANDLE SUBMIT ===
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Buat payload sesuai backend
      const payload = {
        project_id: project.pn_number,
        purpose_id: form.purpose_id || null,
        wo_date: form.wo_date,
        wo_count: form.wo_count,
        add_work: form.add_work,
        location: form.location || null,
        vehicle_no: form.vehicle_no || null,
        driver: form.driver || null,
        pics: form.pics.map((p) => ({
          user_id: p.user_id,
          role_id: p.role_id,
        })),
        descriptions: form.descriptions.map((d) => ({
          description: d.description || null,
          result: d.result || null,
        })),
        ...(form.start_work_time && { start_work_time: form.start_work_time }),
        ...(form.stop_work_time && { stop_work_time: form.stop_work_time }),
        ...(form.continue_date && { continue_date: form.continue_date }),
        ...(form.continue_time && { continue_time: form.continue_time }),
        client_note: form.client_note || null,
        ...(form.scheduled_start_working_date && {
          scheduled_start_working_date: form.scheduled_start_working_date,
        }),
        ...(form.scheduled_end_working_date && {
          scheduled_end_working_date: form.scheduled_end_working_date,
        }),
        ...(form.actual_start_working_date && {
          actual_start_working_date: form.actual_start_working_date,
        }),
        ...(form.actual_end_working_date && {
          actual_end_working_date: form.actual_end_working_date,
        }),
        accomodation: form.accomodation || null,
        material_required: form.material_required || null,
        client_approved: form.client_approved,
      };

      let res;
      if (workOrder) {
        res = await api.put(`/man-power/work-orders/${workOrder.id}`, payload);
        Swal.fire("Success", "Work Order updated successfully", "success");
        onClose(res.data?.data);
      } else {
        res = await api.post(`/man-power/work-orders`, payload);
        const created = Array.isArray(res.data.data)
          ? res.data.data
          : [res.data.data];

        Swal.fire(
          "Success",
          created.length > 1
            ? `${created.length} Work Orders created successfully`
            : "Work Order created successfully",
          "success"
        );
        onClose(created);
      }
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to save WO",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPurposeOption = (id) => {
    const p = purposes.find((p) => String(p.id) === String(id));
    return p ? { label: p.name, value: p.id } : null;
  };

  return (
    <Dialog open={open} onClose={() => onClose(null)} maxWidth="lg" fullWidth>
      {/* === Title === */}
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
        {workOrder ? "Edit Work Order" : "Create New Work Order"}
        <IconButton
          onClick={() => onClose(null)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#f9f9f9", py: 3 }}>
        {/* === SECTION: General Information === */}
        <SectionCard title="General Information" icon={<InfoIcon />}>
          <Grid container spacing={3}>
            {/* Project Information */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Project Number"
                value={project?.project_number || ""}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Project Name"
                value={project?.project_name || ""}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Client Name"
                value={
                  project?.client?.name ||
                  project?.quotation?.client?.name ||
                  ""
                }
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>

            {/* Work Order Information */}
            <Grid item xs={12} md={6}>
              <TextField
                label="WO Date"
                type="date"
                name="wo_date"
                value={form.wo_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                helperText="Select work order date"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={sortOptions(
                  purposes.map((p) => ({ label: p.name, value: p.id })),
                  "label"
                )}
                value={getPurposeOption(form.purpose_id)}
                onChange={(_, newValue) => {
                  setForm((prev) => ({
                    ...prev,
                    purpose_id: newValue?.value || "",
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Purpose"
                    helperText="Choose purpose of work order"
                    fullWidth
                  />
                )}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* === SECTION: Extra Details === */}
        <SectionCard title="Additional Details" icon={<BuildIcon />}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Vehicle Number"
                name="vehicle_no"
                value={form.vehicle_no}
                onChange={handleChange}
                fullWidth
                helperText="Enter the assigned vehicle plate number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Driver"
                name="driver"
                value={form.driver}
                onChange={handleChange}
                fullWidth
                helperText="Person in charge of driving the vehicle"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                name="location"
                value={form.location}
                onChange={handleChange}
                fullWidth
                helperText="Specify the target location of the work"
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* === SECTION: Schedule === */}
        <SectionCard title="Schedule & Work Time" icon={<EventIcon />}>
          <Grid container spacing={3}>
            {/* === Schedule Fields === */}
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Planned Schedule
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      name="scheduled_start_working_date"
                      value={form.scheduled_start_working_date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      helperText="The date when the work is planned to start"
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      name="scheduled_end_working_date"
                      value={form.scheduled_end_working_date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      helperText="The date when the work is planned to be completed"
                    />
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Actual Work Period
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      name="actual_start_working_date"
                      value={form.actual_start_working_date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      helperText="The actual date when the work started"
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      name="actual_end_working_date"
                      value={form.actual_end_working_date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      helperText="The actual date when the work was completed"
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* === Daily Work Hours === */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                mt={2}
              >
                Daily Work Hours
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Start Time"
                    type="time"
                    name="start_work_time"
                    value={form.start_work_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    helperText="The daily work start time"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="End Time"
                    type="time"
                    name="stop_work_time"
                    value={form.stop_work_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    helperText="The daily work end time"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* === Continuation Work === */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                mt={2}
              >
                Continuation (if applicable)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Continuation Date"
                    type="date"
                    name="continue_date"
                    value={form.continue_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    helperText="The date when the work is continued"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Continuation Time"
                    type="time"
                    name="continue_time"
                    value={form.continue_time}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    helperText="The time when the work resumes"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </SectionCard>

        {/* === SECTION: PICs === */}
        <SectionCard title="Person In Charge (PIC)" icon={<PeopleIcon />}>
          <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
            {form.pics.map((pic, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  bgcolor: "#fefefe",
                }}
              >
                <Autocomplete
                  options={sortOptions(users, "name")}
                  getOptionLabel={(u) => `${u.name}`}
                  value={pic._userOption || null}
                  onChange={(_, val) =>
                    updatePic(index, "user_id", val ? val.id : "", val)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      fullWidth
                      required
                    />
                  )}
                  sx={{ flex: 1 }}
                />

                <Autocomplete
                  options={sortOptions(roles, "name")}
                  getOptionLabel={(r) => r.name}
                  value={pic._roleOption || null}
                  onChange={(_, val) =>
                    updatePic(index, "role_id", val ? val.id : "", val)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Select Role" fullWidth />
                  )}
                  sx={{ flex: 1 }}
                />

                <Tooltip title="Remove PIC">
                  <IconButton color="error" onClick={() => removePic(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>

          <Button
            onClick={addPic}
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
          >
            Add PIC
          </Button>
        </SectionCard>

        {/* === SECTION: Descriptions === */}
        <SectionCard title="Work Descriptions" icon={<AssignmentIcon />}>
          <Box sx={{ maxHeight: 250, overflowY: "auto" }}>
            {form.descriptions.map((desc, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  bgcolor: "#fefefe",
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", md: "row" },
                }}
              >
                <TextField
                  label="Description"
                  value={desc.description}
                  multiline
                  minRows={2}
                  onChange={(e) =>
                    updateDescription(index, "description", e.target.value)
                  }
                  fullWidth
                  required
                />

                <TextField
                  label="Result"
                  value={desc.result}
                  multiline
                  minRows={2}
                  onChange={(e) =>
                    updateDescription(index, "result", e.target.value)
                  }
                  fullWidth
                  disabled={
                    !workOrder ||
                    !["waiting_client", "approved"].includes(workOrder.status)
                  }
                />

                <Tooltip title="Remove Description">
                  <IconButton
                    color="error"
                    onClick={() => removeDescription(index)}
                    sx={{ alignSelf: "center" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>

          <Button
            onClick={addDescription}
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
          >
            Add Description
          </Button>
        </SectionCard>

        {/* === SECTION: Client Notes === */}
        <SectionCard title="Client Notes" icon={<NoteAltIcon />}>
          <Grid spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Notes from Client"
                name="client_note"
                value={form.client_note}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                placeholder="Write down any special instructions or additional information from client"
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* === SECTION: Mandays & Approval === */}
        <SectionCard title="Mandays & Approval" icon={<CheckCircleIcon />}>
          <Grid container spacing={2} mb={2}>
            <Grid xs={12} md={6}>
              <TextField
                label="Mandays Engineer"
                type="number"
                value={form.total_mandays_eng || 0}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={6}>
              <TextField
                label="Mandays Electrician"
                type="number"
                value={form.total_mandays_elect || 0}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.add_work}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        add_work: e.target.checked,
                      }))
                    }
                  />
                }
                label="Additional Work"
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* === SECTION: WO Count Preview === */}
        <SectionCard title="WO Count & Preview" icon={<NumbersIcon />}>
          <Grid container spacing={2}>
            <Grid xs={12} md={4}>
              <TextField
                label="WO Count"
                type="number"
                value={form.wo_count}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  const maxWO = 20;
                  if (isNaN(val)) val = "";
                  else if (val > maxWO) val = maxWO;
                  else if (val < 1) val = 1;
                  setForm((prev) => ({ ...prev, wo_count: val }));
                }}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                Determines how many Work Orders will be created (max 20).
              </Typography>
            </Grid>
            <Grid xs={12} md={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Work Order Dates Preview
              </Typography>
              {getWoDatesPreview().length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                  {getWoDatesPreview().map((date, i) => (
                    <li key={i}>{date}</li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Enter WO Date & WO Count to see list of dates.
                </Typography>
              )}
            </Grid>
          </Grid>
        </SectionCard>
      </DialogContent>

      {/* === Footer Actions === */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => onClose(null)} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading
            ? "Saving..."
            : workOrder
            ? "Update Work Order"
            : `Create ${form.wo_count} Work Order${
                form.wo_count > 1 ? "s" : ""
              }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
