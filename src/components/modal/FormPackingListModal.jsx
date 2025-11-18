import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  MenuItem,
  Autocomplete,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../api/api";
import { sortOptions } from "../../helper/SortOptions";
import ConfirmCreateDeliveryOrderModal from "./ConfirmCreateDeliveryOrderModal";

export default function FormPackingListModal({
  open,
  onClose,
  formValues,
  setFormValues,
  onSuccess,
  mode = "create",
  projects = [],
  users = [],
  expeditions = [],
  plTypes = [],
  destinations = [],
}) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [createdPackingList, setCreatedPackingList] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    setLoadingData(false); // Data is passed as props, no need to fetch
  }, [projects, users]);

  // Reset form when modal opens for create mode
  useEffect(() => {
    if (open && mode === "create") {
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
        pl_number: formValues.pl_number || "",
        pl_id: formValues.pl_id || "",
      });
    }
  }, [open, mode, setFormValues, formValues.pl_number, formValues.pl_id]);

  // Fetch existing data for edit mode
  useEffect(() => {
    if (open && mode === "edit" && formValues.pl_id) {
      const fetchPackingList = async () => {
        try {
          const res = await api.get(`/packing-lists/${formValues.pl_id}`);
          const data = res.data.data || res.data;
          setFormValues({
            pn_id: data.pn_id || "",
            destination_id: String(data.destination_id) || "",
            expedition_id: String(data.expedition_id) || "",
            pl_date: data.pl_date
              ? new Date(data.pl_date).toISOString().split("T")[0]
              : "",
            ship_date: data.ship_date
              ? new Date(data.ship_date).toISOString().split("T")[0]
              : "",
            pl_type_id: String(data.pl_type_id) || "",
            client_pic: data.client_pic || "",
            int_pic: data.int_pic
              ? typeof data.int_pic === "object"
                ? String(data.int_pic.id)
                : String(data.int_pic)
              : "",
            receive_date: data.receive_date
              ? new Date(data.receive_date).toISOString().split("T")[0]
              : "",
            pl_return_date: data.pl_return_date
              ? new Date(data.pl_return_date).toISOString().split("T")[0]
              : "",
            remark: data.remark || "",
            pl_number: data.pl_number || "",
            pl_id: data.pl_id || "",
          });
        } catch (err) {
          console.error("Failed to fetch packing list for edit:", err);
        }
      };
      fetchPackingList();
    }
  }, [open, mode, formValues.pl_id, setFormValues]);

  const handleInputChange = (field, value) =>
    setFormValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let res;
      if (mode === "create") {
        res = await api.post("/packing-lists", formValues);
        const packingList = res.data.data || res.data;

        // Check if Finance type and ship_date is set
        const selectedPlType = plTypes.find(
          (pt) => pt.id === formValues.pl_type_id
        );

        if (
          selectedPlType &&
          selectedPlType.name === "Finance" &&
          formValues.ship_date
        ) {
          setCreatedPackingList(packingList);
          // Fetch confirmation data
          const data = await fetchConfirmData(packingList.pl_id);
          setConfirmData(data);
          setConfirmModalOpen(true);
          setLoading(false);
          return; // Don't close modal yet
        }

        onSuccess(packingList);
        onClose();
      } else if (mode === "edit") {
        res = await api.put(`/packing-lists/${formValues.pl_id}`, formValues);
        onSuccess(res.data.data || res.data);
        onClose();
      }
    } catch (err) {
      console.error(err.response?.data || err);
      alert(
        `Failed to ${mode} packing list: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCreateDeliveryOrder = async () => {
    setConfirmLoading(true);
    try {
      await api.post(
        `/packing-lists/${createdPackingList.pl_id}/create-delivery-order`
      );
      onSuccess(createdPackingList);
      setConfirmModalOpen(false);
      onClose();
    } catch (err) {
      console.error(err.response?.data || err);
      alert(
        `Failed to create delivery order: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const fetchConfirmData = async (packingListId) => {
    try {
      const response = await api.get(
        `/packing-lists/${packingListId}/confirm-delivery-order`
      );
      return response.data.data;
    } catch (err) {
      console.error("Failed to fetch confirmation data:", err);
      return null;
    }
  };

  const handleSkipDeliveryOrder = () => {
    onSuccess(createdPackingList);
    setConfirmModalOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.6 }}>
          {mode === "create" ? "Create New Packing List" : "Edit Packing List"}
        </div>
        <div style={{ fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.6)" }}>
          PL Number: {formValues.pl_number || "-"}
        </div>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 1 }}>
        Fill in the details below to create a new packing list.
      </Typography>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Project Autocomplete */}
          <Autocomplete
            size="small"
            options={sortOptions(projects || [], "project_number")}
            getOptionLabel={(option) => option.project_number || ""}
            loading={loadingData}
            value={
              projects?.find((p) => p.pn_number === formValues.pn_id) || null
            }
            onChange={(_, newValue) =>
              handleInputChange("pn_id", newValue ? newValue.pn_number : "")
            }
            isOptionEqualToValue={(option, value) =>
              option.pn_number === value?.pn_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Project"
                placeholder="Select project..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingData ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Destination */}
          <Autocomplete
            size="small"
            options={sortOptions(destinations || [], "destination")}
            getOptionLabel={(option) => option.destination || ""}
            loading={loadingData}
            value={
              destinations?.find((d) => d.id == formValues.destination_id) ||
              null
            }
            onChange={(_, newValue) =>
              handleInputChange("destination_id", newValue ? newValue.id : "")
            }
            isOptionEqualToValue={(option, value) =>
              option.id == value?.destination_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Destination"
                placeholder="Select destination..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingData ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Expedition */}
          <Autocomplete
            size="small"
            options={sortOptions(expeditions || [], "name")}
            getOptionLabel={(option) => option.name || ""}
            loading={loadingData}
            value={
              expeditions?.find((e) => e.id == formValues.expedition_id) || null
            }
            onChange={(_, newValue) =>
              handleInputChange("expedition_id", newValue ? newValue.id : "")
            }
            isOptionEqualToValue={(option, value) =>
              option.id == value?.expedition_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Expedition"
                placeholder="Select expedition..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingData ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Client pic Name */}
          <TextField
            label="Client PIC"
            size="small"
            fullWidth
            value={formValues.client_pic}
            onChange={(e) => handleInputChange("client_pic", e.target.value)}
          />

          {/* PL Date & Ship Date */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="PL Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.pl_date}
              onChange={(e) => handleInputChange("pl_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
            <TextField
              label="Ship Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.ship_date}
              onChange={(e) => handleInputChange("ship_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
          </Stack>

          {/* PL Type */}
          <Autocomplete
            size="small"
            options={sortOptions(plTypes || [], "name")}
            getOptionLabel={(option) => option.name || ""}
            loading={loadingData}
            value={plTypes?.find((p) => p.id == formValues.pl_type_id) || null}
            onChange={(_, newValue) =>
              handleInputChange("pl_type_id", newValue ? newValue.id : "")
            }
            isOptionEqualToValue={(option, value) =>
              option.id == value?.pl_type_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="PL Type"
                placeholder="Select PL type..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingData ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Internal PIC Autocomplete */}
          <Autocomplete
            size="small"
            options={sortOptions(users || [], "name")}
            getOptionLabel={(option) => option.name || ""}
            loading={loadingData}
            value={users?.find((u) => u.id == formValues.int_pic) || null}
            onChange={(_, newValue) =>
              handleInputChange("int_pic", newValue ? newValue.id : "")
            }
            isOptionEqualToValue={(option, value) =>
              option.id == value?.int_pic
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Internal PIC"
                placeholder="Select internal PIC..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingData ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Receive Date & PL Return Date */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Receive Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.receive_date}
              onChange={(e) =>
                handleInputChange("receive_date", e.target.value)
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
            <TextField
              label="PL Return Date"
              type="date"
              size="small"
              fullWidth
              value={formValues.pl_return_date}
              onChange={(e) =>
                handleInputChange("pl_return_date", e.target.value)
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  backgroundColor: "#fff",
                },
              }}
            />
          </Stack>

          {/* Remark */}
          <TextField
            label="Remark"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={formValues.remark}
            onChange={(e) => handleInputChange("remark", e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create Packing List"
            : "Update Packing List"}
        </Button>
      </DialogActions>

      {/* Confirm Create Delivery Order Modal */}
      <ConfirmCreateDeliveryOrderModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          handleSkipDeliveryOrder();
        }}
        onConfirm={handleConfirmCreateDeliveryOrder}
        loading={confirmLoading}
        packingList={createdPackingList}
        confirmData={confirmData}
      />
    </Dialog>
  );
}
