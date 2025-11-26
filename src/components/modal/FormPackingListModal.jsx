import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Autocomplete,
  FormHelperText,
} from "@mui/material";
import { sortOptions } from "../../helper/SortOptions";

export default function FormPackingListModal({
  open,
  onClose,
  formValues,
  setFormValues,
  onSuccess,
  mode,
  projects = [],
  users = [],
  expeditions = [],
  plTypes = [],
  destinations = [],
}) {
  const [errors, setErrors] = useState({});
  const currentYear = new Date().getFullYear();

  // NEW STATE to track the numeric part input independently
  const [plNumberNumericInput, setPlNumberNumericInput] = useState(() => {
    // Initialize from formValues on mount
    const match = /^PL\/(\d{1,3})\/\d{4}$/.exec(formValues.pl_number || "");
    return match ? match[1] : "";
  });

  // Compose full pl_number from numeric part and current year
  const composePlNumber = (numericPart) => {
    if (!numericPart) return "";
    return `PL/${numericPart.padStart(3, "0")}/${currentYear}`;
  };

  // Synchronize plNumberNumericInput when formValues.pl_number changes (like edit mode or props change)
  useEffect(() => {
    const match = /^PL\/(\d{1,3})\/\d{4}$/.exec(formValues.pl_number || "");
    const numericPart = match ? match[1] : "";
    if (numericPart !== plNumberNumericInput) {
      setPlNumberNumericInput(numericPart);
    }
  }, [formValues.pl_number]);

  // Handle form field changes
  const handleChange = (field, value) => {
    if (field === "pl_number_numeric") {
      // Restrict to digits and max length 3 - allow partial numeric input including empty string
      let numeric = value.replace(/\D/g, "").slice(0, 3);

      // Update local state to allow partial editing without resetting
      setPlNumberNumericInput(numeric);

      // Only update formValues.pl_number if numeric is fully empty or when user finishes editing
      if (numeric === "") {
        // Clear full pl_number in formValues when fully cleared
        setFormValues((prev) => ({
          ...prev,
          pl_number: "",
        }));
      } else if (numeric.length === 3) {
        // When complete 3 digits, update formValues with formatted pl_number
        const newPlNumber = composePlNumber(numeric);
        setFormValues((prev) => {
          if (prev.pl_number !== newPlNumber) {
            return {
              ...prev,
              pl_number: newPlNumber,
            };
          }
          return prev;
        });
      }
    } else {
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
    // Clear error for field on change
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Find selected project object by project_number
  const selectedProject =
    projects.find((p) => p.project_number === formValues.pn_id) || null;

  // Find selected destination object by id
  const selectedDestination =
    destinations.find((d) => d.id === formValues.destination_id) || null;

  // Validation function
  const validate = () => {
    const newErrors = {};

    // Validate pl_number numeric part: required, 1-3 digits
    const plNumNumeric = plNumberNumericInput;
    if (!plNumNumeric) {
      newErrors.pl_number_numeric = "PL Number is required";
    } else if (!/^\d{1,3}$/.test(plNumNumeric)) {
      newErrors.pl_number_numeric = "PL Number must be 1-3 digits";
    }

    // Validate project
    if (!formValues.pn_id) newErrors.pn_id = "Project is required";

    // Validate destination
    if (!formValues.destination_id)
      newErrors.destination_id = "Destination is required";

    // Validate pl_type_id
    if (!formValues.pl_type_id) newErrors.pl_type_id = "PL Type is required";

    // Validate expedition
    if (!formValues.expedition_id)
      newErrors.expedition_id = "Expedition is required";

    // Validate int_pic
    if (!formValues.int_pic) newErrors.int_pic = "PIC (Internal) is required";

    // Additional date validations can be added here as needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Invoke onSuccess callback with current formValues
    if (onSuccess) {
      // Prepare clean formValues to send
      const numericPart = plNumberNumericInput;
      const payload = {
        ...formValues,
        pl_number: composePlNumber(numericPart),
      };
      onSuccess(payload);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {mode === "create" ? "Create Packing List" : "Edit Packing List"}
        </DialogTitle>

        <DialogContent dividers>
          {/* Section 1: Project Selection */}
          <Box
            sx={{
              backgroundColor: "#f9fafb",
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: "inset 0 0 0 1px #e5e7eb",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Project Information
            </Typography>
            <Autocomplete
              options={sortOptions(projects, "project_number")}
              getOptionLabel={(option) => option.project_number || ""}
              value={selectedProject}
              onChange={(e, val) =>
                handleChange("pn_id", val ? val.project_number : "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project *"
                  error={Boolean(errors.pn_id)}
                  helperText={errors.pn_id}
                  size="small"
                  fullWidth
                />
              )}
            />
            {selectedProject && (
              <Box
                mt={2}
                sx={{ bgcolor: "#fff", p: 2, borderRadius: 1, boxShadow: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Project Name:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedProject.project_name || "N/A"}
                </Typography>

                <Typography variant="body2" color="textSecondary">
                  Client:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedProject.client?.name ||
                    selectedProject.quotation?.client?.name ||
                    "N/A"}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Section 2: Destination Selection */}
          <Box
            sx={{
              backgroundColor: "#f9fafb",
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: "inset 0 0 0 1px #e5e7eb",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Destination Information
            </Typography>
            <Autocomplete
              options={sortOptions(destinations, "alias")}
              getOptionLabel={(option) =>
                option.alias ? `${option.alias}` : option.destination || ""
              }
              value={selectedDestination}
              onChange={(e, val) =>
                handleChange("destination_id", val ? val.id : "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Destination *"
                  error={Boolean(errors.destination_id)}
                  helperText={errors.destination_id}
                  size="small"
                  fullWidth
                />
              )}
            />
            {selectedDestination && (
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Destination:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedDestination.destination || "N/A"}
                </Typography>

                <Typography variant="body2" color="textSecondary">
                  Address:
                </Typography>
                <Typography variant="body1">
                  {selectedDestination.address || "N/A"}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Section 3: Packing List Details */}
          <Box
            sx={{
              backgroundColor: "#f9fafb",
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: "inset 0 0 0 1px #e5e7eb",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Packing List Details
            </Typography>

            {/* pl_number input: editable numeric part only */}
            <Typography variant="body2" color="textSecondary" gutterBottom>
              PL Number *
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  border: 1,
                  borderColor: "grey.400",
                  borderRight: 0,
                  borderRadius: "6px 0 0 6px",
                  bgcolor: "grey.100",
                  color: "grey.600",
                  userSelect: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 36,
                }}
              >
                PL/
              </Box>
              <TextField
                size="small"
                name="pl_number_numeric"
                value={plNumberNumericInput}
                onChange={(e) =>
                  handleChange("pl_number_numeric", e.target.value)
                }
                inputProps={{
                  maxLength: 3,
                  pattern: "\\d{1,3}",
                  inputMode: "numeric",
                  style: { textAlign: "center" },
                }}
                error={Boolean(errors.pl_number_numeric)}
                helperText={errors.pl_number_numeric}
                sx={{
                  width: 80,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    "& fieldset": { borderLeft: 0, borderRight: 0 },
                  },
                }}
              />
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  border: 1,
                  borderColor: "grey.400",
                  borderLeft: 0,
                  borderRadius: "0 6px 6px 0",
                  bgcolor: "grey.100",
                  color: "grey.600",
                  userSelect: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 36,
                }}
              >
                /{currentYear}
              </Box>
            </Box>

            {/* Other fields: expedition, pl_type, int_pic, client_pic, dates, remark */}

            <Autocomplete
              options={sortOptions(expeditions, "name")}
              getOptionLabel={(option) => option.name || ""}
              value={
                expeditions.find((e) => e.id === formValues.expedition_id) ||
                null
              }
              onChange={(e, val) =>
                handleChange("expedition_id", val ? val.id : "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Expedition *"
                  error={Boolean(errors.expedition_id)}
                  helperText={errors.expedition_id}
                  size="small"
                  fullWidth
                  margin="normal"
                />
              )}
            />

            <Autocomplete
              options={sortOptions(plTypes, "name")}
              getOptionLabel={(option) => option.name || ""}
              value={
                plTypes.find((p) => p.id === formValues.pl_type_id) || null
              }
              onChange={(e, val) =>
                handleChange("pl_type_id", val ? val.id : "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="PL Type *"
                  error={Boolean(errors.pl_type_id)}
                  helperText={errors.pl_type_id}
                  size="small"
                  fullWidth
                  margin="normal"
                />
              )}
            />

            <Autocomplete
              options={sortOptions(users, "name")}
              getOptionLabel={(option) => option.name || ""}
              value={users.find((u) => u.id === formValues.int_pic) || null}
              onChange={(e, val) => handleChange("int_pic", val ? val.id : "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Internal PIC *"
                  error={Boolean(errors.int_pic)}
                  helperText={errors.int_pic}
                  size="small"
                  fullWidth
                  margin="normal"
                />
              )}
            />

            <TextField
              label="Client PIC"
              size="small"
              fullWidth
              margin="normal"
              value={formValues.client_pic || ""}
              onChange={(e) => handleChange("client_pic", e.target.value)}
            />

            <TextField
              label="PL Date"
              type="date"
              size="small"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formValues.pl_date || ""}
              onChange={(e) => handleChange("pl_date", e.target.value)}
            />

            <TextField
              label="Ship Date"
              type="date"
              size="small"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formValues.ship_date || ""}
              onChange={(e) => handleChange("ship_date", e.target.value)}
            />

            <TextField
              label="Receive Date"
              type="date"
              size="small"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formValues.receive_date || ""}
              onChange={(e) => handleChange("receive_date", e.target.value)}
            />

            <TextField
              label="PL Return Date"
              type="date"
              size="small"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formValues.pl_return_date || ""}
              onChange={(e) => handleChange("pl_return_date", e.target.value)}
            />

            <TextField
              label="Remarks"
              multiline
              rows={3}
              fullWidth
              margin="normal"
              value={formValues.remark || ""}
              onChange={(e) => handleChange("remark", e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
