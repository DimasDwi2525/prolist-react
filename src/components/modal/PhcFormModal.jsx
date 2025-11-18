import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Grid,
  Autocomplete,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../api/api";
import BoqModal from "./BoqModal";
import Swal from "sweetalert2";
import { sortOptions } from "../../helper/SortOptions";

export default function PhcFormModal({
  open,
  onClose,
  project,
  onSave,
  phcData,
}) {
  const [step, setStep] = useState(1);

  // State users
  const [marketingUsers, setMarketingUsers] = useState([]);
  const [engineeringUsers, setEngineeringUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [openBoq, setOpenBoq] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phcCreated, setPhcCreated] = useState(false);

  const [documents, setDocuments] = useState([]);

  // State form
  const [formData, setFormData] = useState({
    handover_date: "",
    start_date: "",
    target_finish_date: "",
    client_pic_name: "",
    client_mobile: "",
    client_reps_office_address: "",
    client_site_address: "",
    client_site_representatives: "",
    site_phone_number: "",
    ho_marketings_id: "",
    pic_marketing_id: "",
    ho_engineering_id: "",
    pic_engineering_id: "",
    notes: "",
    costing_by_marketing: "NA",
    boq: "NA",
    retention: "NA",
    warranty: "NA",
    penalty: "NA",
    retention_percentage: "",
    retention_months: "",
    warranty_date: "",
  });

  // Determine mode based on presence of phcData
  const isEditMode = Boolean(phcData);

  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const [marketingRes, engineeringRes] = await Promise.all([
          api.get("/phc/users/marketing"),
          api.get("/phc/users/engineering"),
        ]);
        if (marketingRes.data.success)
          setMarketingUsers(marketingRes.data.data);
        if (engineeringRes.data.success)
          setEngineeringUsers(engineeringRes.data.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const fetchDocuments = async () => {
      try {
        const res = await api.get("/document-phc");
        console.log("Documents fetched:", res.data);

        setDocuments(
          res.data.map((doc) => ({
            id: doc.id,
            name: doc.name,
          }))
        );
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };
    fetchDocuments();
  }, [open]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setPhcCreated(false);
      setSubmitting(false);

      if (isEditMode && !loadingUsers) {
        // Normalize value helper
        const normalizeValue = (val) => {
          if (val === "0") return "NA";
          if (val === "1") return "A";
          return val;
        };

        // Normalize date helper
        const normalizeApiDate = (value) => {
          if (!value) return "";
          return value.toString().substring(0, 10);
        };

        const findUserById = (users, id) =>
          users.find((u) => u.id === Number(id)) || null;

        // Initialize formData with phcData for edit mode
        setFormData({
          handover_date: normalizeApiDate(phcData.handover_date),
          start_date: normalizeApiDate(phcData.start_date),
          target_finish_date: normalizeApiDate(phcData.target_finish_date),
          client_pic_name: phcData.client_pic_name || "",
          client_mobile: phcData.client_mobile || "",
          client_reps_office_address: phcData.client_reps_office_address || "",
          client_site_address: phcData.client_site_address || "",
          client_site_representatives:
            phcData.client_site_representatives || "",
          site_phone_number: phcData.site_phone_number || "",
          ho_marketings_id: findUserById(
            marketingUsers,
            phcData.ho_marketings_id
          ),
          pic_marketing_id: findUserById(
            marketingUsers,
            phcData.pic_marketing_id
          ),
          ho_engineering_id: findUserById(
            engineeringUsers,
            phcData.ho_engineering_id
          ),
          pic_engineering_id: findUserById(
            engineeringUsers,
            phcData.pic_engineering_id
          ),
          notes: phcData.notes || "",
          costing_by_marketing: normalizeValue(phcData.costing_by_marketing),
          boq: normalizeValue(phcData.boq),
          retention: normalizeValue(phcData.retention),
          warranty: normalizeValue(phcData.warranty),
          penalty: phcData.penalty || "NA",
          retention_percentage: phcData.retention_percentage || "",
          retention_months: phcData.retention_months || "",
          warranty_date: normalizeApiDate(phcData.warranty_date),
        });
      } else if (!isEditMode) {
        // Reset form for create mode
        setFormData({
          handover_date: "",
          start_date: "",
          target_finish_date: "",
          client_pic_name: "",
          client_mobile: "",
          client_reps_office_address: "",
          client_site_address: "",
          client_site_representatives: "",
          site_phone_number: "",
          ho_marketings_id: null,
          pic_marketing_id: null,
          ho_engineering_id: null,
          pic_engineering_id: null,
          notes: "",
          costing_by_marketing: "NA",
          boq: "NA",
          retention: "NA",
          warranty: "NA",
          penalty: "NA",
          retention_percentage: "",
          retention_months: "",
          warranty_date: "",
        });
      }
    }
  }, [open, isEditMode, phcData, loadingUsers]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting || phcCreated) return; // prevent double submit
    try {
      setSubmitting(true);
      console.log("📤 Data PHC dikirim:", formData);

      let res;
      if (isEditMode) {
        // Update existing PHC
        res = await api.put(`/phc/${phcData.id}`, {
          ...formData,
          project_id: project?.pn_number,
          handover_date: formData.handover_date || null,
          start_date: formData.start_date || null,
          target_finish_date: formData.target_finish_date || null,
          ho_marketings_id: String(formData.ho_marketings_id?.id || ""),
          pic_marketing_id: String(formData.pic_marketing_id?.id || ""),
          ho_engineering_id: String(formData.ho_engineering_id?.id || ""),
          pic_engineering_id: String(formData.pic_engineering_id?.id || ""),
          retention: formData.retention === "A",
          warranty: formData.warranty === "A",
          retention_percentage: formData.retention_percentage || null,
          retention_months: formData.retention_months || null,
          warranty_date: formData.warranty_date || null,
        });
      } else {
        // Create new PHC
        res = await api.post("/phc", {
          ...formData,
          project_id: project?.pn_number,
          handover_date: formData.handover_date || null,
          start_date: formData.start_date || null,
          target_finish_date: formData.target_finish_date || null,
          ho_marketings_id: String(formData.ho_marketings_id?.id || ""),
          pic_marketing_id: String(formData.pic_marketing_id?.id || ""),
          ho_engineering_id: String(formData.ho_engineering_id?.id || ""),
          pic_engineering_id: String(formData.pic_engineering_id?.id || ""),
          retention: formData.retention === "A",
          warranty: formData.warranty === "A",
          retention_percentage: formData.retention_percentage || null,
          retention_months: formData.retention_months || null,
          warranty_date: formData.warranty_date || null,
        });
      }

      console.log("API response data:", res.data);

      if (res.data.success || res.data.status === "success") {
        setPhcCreated(true);

        // close BOQ modal otomatis setelah PHC dibuat
        setOpenBoq(false);
        setSubmitting(false);

        // Call onSave to refresh parent and close modal, passing success flag
        if (onSave) onSave(true);

        // Close the modal after successful edit
        if (isEditMode) {
          onClose();
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan PHC",
          text: res.data.message || "Terjadi kesalahan saat menyimpan PHC",
        });
        setSubmitting(false);
      }
    } catch (err) {
      console.error("❌ Error submit PHC:", err);

      setSubmitting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "-"; // cek valid date

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  console.log(phcData);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {isEditMode
          ? `✏️ Edit Project Handover Checklist (PHC) - ${project?.project_number} - ${project?.project_name}`
          : `➕ Create Project Handover Checklist (PHC) - ${project?.project_number} - ${project?.project_name}`}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Step Indicator */}
        <div className="mb-6 text-center text-gray-600 font-medium text-sm md:text-base">
          {step === 1 && (
            <span>
              🔹 <strong>Step 1 of 3:</strong> General Information
            </span>
          )}
          {step === 2 && (
            <span>
              📋 <strong>Step 2 of 3:</strong> Handover Checklist
            </span>
          )}
          {step === 3 && (
            <span>
              📄 <strong>Step 3 of 3:</strong> Document Preparation
            </span>
          )}
        </div>

        {/* Step Tabs */}
        <div className="flex flex-col md:flex-row justify-center mb-6 gap-3 md:space-x-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-4 py-2 rounded-md font-medium transition w-full md:w-40 text-sm md:text-base ${
              step === 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            1️⃣ Information
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-4 py-2 rounded-md font-medium transition w-full md:w-40 text-sm md:text-base ${
              step === 2
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            2️⃣ Checklist
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`px-4 py-2 rounded-md font-medium transition w-full md:w-40 text-sm md:text-base ${
              step === 3
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            3️⃣ Documents
          </button>
        </div>

        {/* ---------------- LOADING ---------------- */}
        {loadingUsers ? (
          <div className="flex justify-center items-center h-40">
            <CircularProgress />
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {/* ---------------- STEP 1 ---------------- */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 🔹 Project info → read-only */}
                  <TextField
                    label="Project"
                    value={project?.project_name || ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="PN Number"
                    value={project?.project_number || ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Quotation Number"
                    value={project?.quotation?.no_quotation || ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Quotation Date"
                    value={formatDate(project?.quotation?.quotation_date || "")}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="PO Number"
                    value={project?.po_number || ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="PO Date"
                    value={formatDate(project?.po_date || "")}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Dates */}
                      <TextField
                        type="date"
                        label="Handover Date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.handover_date}
                        onChange={(e) =>
                          handleChange("handover_date", e.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        type="date"
                        label="Start Date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.start_date}
                        onChange={(e) =>
                          handleChange("start_date", e.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        type="date"
                        label="Target Finish Date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.target_finish_date}
                        onChange={(e) =>
                          handleChange("target_finish_date", e.target.value)
                        }
                        fullWidth
                      />
                    </div>
                  </div>

                  {/* Client Info */}
                  <TextField
                    label="Client PIC Name"
                    value={formData.client_pic_name}
                    onChange={(e) =>
                      handleChange("client_pic_name", e.target.value)
                    }
                    fullWidth
                  />
                  <TextField
                    label="Client Mobile"
                    value={formData.client_mobile}
                    onChange={(e) =>
                      handleChange("client_mobile", e.target.value)
                    }
                    fullWidth
                  />

                  <div className="md:col-span-2">
                    <TextField
                      label="Client Office Address"
                      multiline
                      rows={2}
                      value={formData.client_reps_office_address}
                      onChange={(e) =>
                        handleChange(
                          "client_reps_office_address",
                          e.target.value
                        )
                      }
                      fullWidth
                    />
                  </div>

                  {/* Client Site Info - 3 columns */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextField
                        label="Client Site Address"
                        value={formData.client_site_address}
                        onChange={(e) =>
                          handleChange("client_site_address", e.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        label="Client Representative"
                        value={formData.client_site_representatives}
                        onChange={(e) =>
                          handleChange(
                            "client_site_representatives",
                            e.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        label="Site Phone Number"
                        value={formData.site_phone_number}
                        onChange={(e) =>
                          handleChange("site_phone_number", e.target.value)
                        }
                        fullWidth
                      />
                    </div>
                  </div>

                  {/* 🔹 HO Marketing */}
                  <Autocomplete
                    options={sortOptions(marketingUsers, "name")}
                    getOptionLabel={(option) => option.name || ""}
                    value={formData.ho_marketings_id}
                    onChange={(e, newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        ho_marketings_id: newValue,
                      }))
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    } // penting
                    renderInput={(params) => (
                      <TextField {...params} label="HO Marketing" fullWidth />
                    )}
                  />

                  {/* 🔹 PIC Marketing */}
                  <Autocomplete
                    options={sortOptions(marketingUsers, "name")}
                    getOptionLabel={(option) => option.name || ""}
                    value={formData.pic_marketing_id}
                    onChange={(e, newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        pic_marketing_id: newValue,
                      }))
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="PIC Marketing" fullWidth />
                    )}
                  />

                  {/* 🔹 HO Engineering */}
                  <Autocomplete
                    options={sortOptions(engineeringUsers, "name")}
                    getOptionLabel={(option) => option.name || ""}
                    value={formData.ho_engineering_id}
                    onChange={(e, newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        ho_engineering_id: newValue,
                      }))
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="HO Engineering" fullWidth />
                    )}
                  />

                  {/* 🔹 PIC Engineering */}
                  <Autocomplete
                    options={sortOptions(engineeringUsers, "name")}
                    getOptionLabel={(option) => option.name || ""}
                    value={formData.pic_engineering_id}
                    onChange={(e, newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        pic_engineering_id: newValue,
                      }))
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="PIC Engineering"
                        fullWidth
                      />
                    )}
                  />

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <TextField
                      label="Notes"
                      multiline
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      fullWidth
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                  >
                    ⏭️ Next: Checklist
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 2 ---------------- */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                  📋 Step 2: Handover Checklist
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: "costing_by_marketing",
                      label: "Costing by Marketing",
                      type: "radio",
                    },
                    {
                      key: "boq",
                      label: "Bill of Quantity (BOQ)",
                      type: "radio",
                    },
                    { key: "retention", label: "Retention", type: "retention" },
                    { key: "warranty", label: "Warranty", type: "warranty" },
                    { key: "penalty", label: "Penalty", type: "text" },
                  ].map(({ key, label, type }) => (
                    <div
                      key={key}
                      className="p-4 border rounded-md bg-gray-50 space-y-2"
                    >
                      <label className="block text-sm font-medium text-gray-700">
                        {label}
                      </label>

                      {/* 🔹 Kalau type radio (boq & costing_by_marketing) */}
                      {type === "radio" ? (
                        <>
                          <div className="flex items-center gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="A"
                                checked={formData[key] === "A"}
                                onChange={() => handleChange(key, "A")}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">Applicable</span>
                            </label>

                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="NA"
                                checked={formData[key] === "NA"}
                                onChange={() => handleChange(key, "NA")}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                Not Applicable
                              </span>
                            </label>
                          </div>

                          {/* 🔹 BOQ: tombol create/edit hanya kalau Applicable */}
                          {key === "boq" && formData[key] === "A" && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setOpenBoq(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
                              >
                                ➕ Create / Edit BOQ
                              </button>
                            </div>
                          )}
                        </>
                      ) : type === "retention" ? (
                        <>
                          {/* 🔹 Retention pakai radio */}
                          <div className="flex items-center gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="A"
                                checked={formData[key] === "A"}
                                onChange={() => handleChange(key, "A")}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">Applicable</span>
                            </label>

                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="NA"
                                checked={formData[key] === "NA"}
                                onChange={() => handleChange(key, "NA")}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                Not Applicable
                              </span>
                            </label>
                          </div>

                          {/* Kalau Applicable, tampilkan input retention percentage dan months */}
                          {formData[key] === "A" && (
                            <div className="space-y-2 pt-2">
                              <TextField
                                type="number"
                                label="Retention Percentage (%)"
                                value={formData.retention_percentage}
                                onChange={(e) =>
                                  handleChange(
                                    "retention_percentage",
                                    e.target.value
                                  )
                                }
                                inputProps={{ min: 0, max: 100 }}
                                fullWidth
                              />
                              <TextField
                                type="number"
                                label="Retention Months"
                                value={formData.retention_months}
                                onChange={(e) =>
                                  handleChange(
                                    "retention_months",
                                    e.target.value
                                  )
                                }
                                inputProps={{ min: 0 }}
                                fullWidth
                              />
                            </div>
                          )}
                        </>
                      ) : type === "warranty" ? (
                        <>
                          {/* 🔹 Warranty pakai radio */}
                          <div className="flex items-center gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="A"
                                checked={formData[key] === "A"}
                                onChange={() => handleChange(key, "A")}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">Applicable</span>
                            </label>

                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="NA"
                                checked={formData[key] === "NA"}
                                onChange={() => handleChange(key, "NA")}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                Not Applicable
                              </span>
                            </label>
                          </div>

                          {/* Kalau Applicable, tampilkan input warranty date */}
                          {formData[key] === "A" && (
                            <div className="pt-2">
                              <TextField
                                type="date"
                                label="Warranty Date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.warranty_date}
                                onChange={(e) =>
                                  handleChange("warranty_date", e.target.value)
                                }
                                fullWidth
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* 🔹 Penalty pakai radio dulu */}
                          <div className="flex items-center gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="A"
                                checked={formData[key] !== "NA"}
                                onChange={() => handleChange(key, "")} // kosongkan supaya bisa isi text
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">Applicable</span>
                            </label>

                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={key}
                                value="NA"
                                checked={formData[key] === "NA"}
                                onChange={() => handleChange(key, "NA")}
                                className="text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                Not Applicable
                              </span>
                            </label>
                          </div>

                          {/* Kalau Applicable, tampilkan input text */}
                          {formData[key] !== "NA" && (
                            <TextField
                              placeholder={`${label} Detail`}
                              value={formData[key] || ""}
                              onChange={(e) =>
                                handleChange(
                                  key,
                                  e.target.value.trim() === ""
                                    ? "NA"
                                    : e.target.value
                                )
                              }
                              fullWidth
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2 border rounded text-sm md:text-base"
                  >
                    ⬅️ Back
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || phcCreated}
                    className={`bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded ${
                      submitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitting ? "💾 Saving..." : "💾 Save PHC"}
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 3 ---------------- */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                  📄 Step 3: Document Preparation
                </h3>

                {documents.length === 0 ? (
                  <div className="flex justify-center items-center h-40 text-gray-500">
                    Loading documents...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 border rounded-md bg-white space-y-2 shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            {doc.name}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              doc.status === "A"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {doc.status === "A"
                              ? "Applicable"
                              : "Not Applicable"}
                          </span>
                        </div>
                        {doc.date_prepared && (
                          <div className="text-sm text-gray-500">
                            Prepared Date: {doc.date_prepared}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-8">
                  <Button variant="outlined" onClick={() => setStep(2)}>
                    Back: Checklist
                  </Button>
                </div>
              </div>
            )}
          </form>
        )}
      </DialogContent>

      {/* 🔹 Modal BOQ (inline edit dengan DataGrid) */}
      <BoqModal
        open={openBoq}
        handleClose={() => setOpenBoq(false)}
        projectId={project?.pn_number}
        projectValue={project?.po_value}
        role={localStorage.getItem("role")}
        token={localStorage.getItem("token")}
      />
    </Dialog>
  );
}
