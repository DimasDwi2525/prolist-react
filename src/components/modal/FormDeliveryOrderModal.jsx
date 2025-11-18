import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Autocomplete,
  CircularProgress,
  IconButton,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Business, Receipt, CalendarToday, Send } from "@mui/icons-material";
import api from "../../api/api";
import { getClientName } from "../../utils/getClientName";
import { formatValue } from "../../utils/formatValue";

export default function FormDeliveryOrderModal({
  open,
  onClose,
  deliveryOrder,
  projects,
  onSave,
}) {
  const [formData, setFormData] = useState({
    do_number: "",
    do_no: "",
    do_description: "",
    pn_id: "",
    return_date: "",
    invoice_id: "",
    do_send: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    if (deliveryOrder) {
      setFormData({
        do_number: deliveryOrder.do_number || "",
        do_no: deliveryOrder.do_no || "",
        do_description: deliveryOrder.do_description || "",
        pn_id: deliveryOrder.pn_id || "",
        return_date: deliveryOrder.return_date || "",
        invoice_id: deliveryOrder.invoice_id || "",
        do_send: deliveryOrder.do_send || "",
      });
    } else {
      setFormData({
        do_number: "",
        do_no: "",
        do_description: "",
        pn_id: "",
        return_date: "",
        invoice_id: "",
        do_send: "",
      });
    }
    setErrors({});

    // Fetch invoices for autocomplete
    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const res = await api.get("/finance/invoice-list");
        setInvoices(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [deliveryOrder, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (deliveryOrder) {
        // Update
        await api.put(`/finance/delivery-orders/${deliveryOrder.id}`, formData);
      } else {
        // Create
        await api.post("/finance/delivery-orders", formData);
      }
      onSave();
      onClose();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(
    (project) => project.pn_number === formData.pn_id
  );

  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === formData.invoice_id
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Receipt />
        {deliveryOrder ? "Edit Delivery Order" : "Create Delivery Order"}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {selectedProject && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Business />
              Project Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={selectedProject?.project_name || ""}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={getClientName(selectedProject) || ""}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Project Value"
                  value={
                    selectedProject?.po_value
                      ? formatValue(selectedProject.po_value).formatted
                      : ""
                  }
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
            </Grid>
          </Box>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <Receipt />
            Delivery Order Details
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {deliveryOrder && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "#6b7280", fontWeight: 500 }}
              >
                Generated Numbers
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="DO Number"
                    value={formData.do_number}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="DO No"
                    value={formData.do_no}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                name="do_description"
                value={formData.do_description}
                onChange={handleChange}
                error={!!errors.do_description}
                helperText={errors.do_description?.[0]}
                multiline
                rows={3}
                placeholder="Enter delivery order description..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                fullWidth
                options={projects}
                getOptionLabel={(option) =>
                  `${option.project_number} - ${option.project_name}`
                }
                value={selectedProject || null}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    pn_id: newValue ? newValue.pn_number : "",
                  }));
                  if (errors.pn_id) {
                    setErrors((prev) => ({
                      ...prev,
                      pn_id: "",
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Project"
                    required
                    error={!!errors.pn_id}
                    helperText={errors.pn_id?.[0]}
                    placeholder="Search and select a project..."
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        py: 1.5,
                        px: 2,
                        borderRadius: 1,
                        backgroundColor: "background.paper",
                      }}
                      {...otherProps}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "text.primary",
                        }}
                      >
                        {option.project_number}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", mt: 0.5 }}
                      >
                        {option.project_name}
                      </Typography>
                    </Box>
                  );
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                fullWidth
                options={invoices}
                getOptionLabel={(option) => {
                  if (!option) return "";
                  const invoiceId = option.invoice_number || `INV-${option.id}`;
                  return invoiceId;
                }}
                value={selectedInvoice || null}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    invoice_id: newValue ? newValue.id : "",
                  }));
                  if (errors.invoice_id) {
                    setErrors((prev) => ({
                      ...prev,
                      invoice_id: "",
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Invoice"
                    error={!!errors.invoice_id}
                    helperText={errors.invoice_id?.[0]}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: loadingInvoices ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <Receipt sx={{ color: "action.active", mr: 1 }} />
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        py: 1.5,
                        px: 2,
                        borderRadius: 1,
                        backgroundColor: "background.paper",
                      }}
                      {...otherProps}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "text.primary",
                        }}
                      >
                        {option.invoice_number ||
                          option.invoice_id ||
                          option.id}
                      </Typography>
                      {option.amount && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", mt: 0.5 }}
                        >
                          Value: {formatValue(option.amount).formatted}
                        </Typography>
                      )}
                    </Box>
                  );
                }}
                noOptionsText={
                  loadingInvoices
                    ? "Loading invoices..."
                    : invoices.length === 0
                    ? "No invoices available"
                    : "No options"
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Return Date"
                name="return_date"
                type="date"
                value={formData.return_date}
                onChange={handleChange}
                error={!!errors.return_date}
                helperText={errors.return_date?.[0]}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <CalendarToday sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="DO Send Date"
                name="do_send"
                type="date"
                value={formData.do_send}
                onChange={handleChange}
                error={!!errors.do_send}
                helperText={errors.do_send?.[0]}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <Send sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={<Receipt />}
        >
          {loading ? "Saving..." : deliveryOrder ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
