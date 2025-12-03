import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  Receipt,
  Building2,
  User,
  DollarSign,
  FileText,
  Calendar,
} from "lucide-react";
import api from "../../api/api";
import { formatValue } from "../../utils/formatValue";
import { formatDate } from "../../utils/FormatDate";
import { sortOptions } from "../../helper/SortOptions";

export default function FormInvoiceSelectProjectModal({
  open,
  onClose,
  projectId,
  invoiceData = null,
  onSave,
}) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    invoice_type_id: null,
    invoice_sequence: "",
    no_faktur: "",
    invoice_date: "",
    invoice_description: "",
    invoice_value: "",
    invoice_due_date: "",
    remarks: "",
    currency: "IDR",
    rate_usd: "",
    is_ppn: true,
    is_pph23: false,
    is_pph42: false,
    nilai_ppn: "",
    nilai_pph23: "",
    nilai_pph42: "",
  });

  const [nextSequence, setNextSequence] = useState("");
  const [sequenceError, setSequenceError] = useState("");
  const [validatingSequence, setValidatingSequence] = useState(false);

  const [projectInfo, setProjectInfo] = useState(null);
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null);
  const [taxPreview, setTaxPreview] = useState(null);
  const [loadingTaxPreview, setLoadingTaxPreview] = useState(false);

  const [originalInvoiceTypeId, setOriginalInvoiceTypeId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [warningModal, setWarningModal] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });

  const [fullInvoiceData, setFullInvoiceData] = useState(null);

  // Year filter states
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);

  // Project financial summary states
  const [remainingProjectValue, setRemainingProjectValue] = useState(0);
  const [totalInvoiceValue, setTotalInvoiceValue] = useState(0);
  const [projectValue, setProjectValue] = useState(0);
  const [invoicesList, setInvoicesList] = useState([]);
  const [showInvoicesList, setShowInvoicesList] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesPerPage] = useState(10); // Show 10 invoices at a time for better UX

  const isEditMode = Boolean(invoiceData);

  // Fetch projects, invoice types and project info
  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        // First fetch all projects to get available years from po_date
        const allProjectsResponse = await api.get("/projects", {
          params: { limit: 10000 }, // Fetch all projects to get years
        });
        const allProjectsData = allProjectsResponse.data?.data || [];

        // Extract unique years from po_date
        const yearsSet = new Set();
        allProjectsData.forEach((project) => {
          if (project.po_date) {
            const year = new Date(project.po_date).getFullYear();
            if (!isNaN(year)) {
              yearsSet.add(year.toString());
            }
          }
        });

        // Sort years in descending order and set available years
        const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
        setAvailableYears(sortedYears);

        // If no years available, set current year as default
        if (sortedYears.length === 0) {
          setAvailableYears([currentYear.toString()]);
          setSelectedYear(currentYear.toString());
        } else {
          // Set selected year to current year if available, otherwise first available
          const yearToSelect = sortedYears.includes(currentYear.toString())
            ? currentYear.toString()
            : sortedYears[0];
          setSelectedYear(yearToSelect);
        }

        // Now fetch projects filtered by selected year
        const response = await api.get("/projects", {
          params: { year: selectedYear, limit: 1000 }, // Filter by selected year
        });
        const projectsData = response.data?.data || [];
        setProjects(projectsData);

        // If projectId is provided, set it as selected
        if (projectId) {
          const selectedProj = projectsData.find((p) => p.id === projectId);
          setSelectedProject(selectedProj || null);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
        // Fallback to current year if error
        setAvailableYears([currentYear.toString()]);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchInvoiceTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await api.get("/finance/invoice-types");
        setInvoiceTypes(response.data || []);
      } catch (error) {
        console.error("Failed to fetch invoice types:", error);
        setInvoiceTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProjects();
    fetchInvoiceTypes();
  }, [open, projectId]);

  // Fetch projects when selected year changes
  useEffect(() => {
    if (!open || availableYears.length === 0) return;

    const fetchProjectsByYear = async () => {
      setLoadingProjects(true);
      try {
        const response = await api.get("/projects", {
          params: { year: selectedYear, limit: 1000 },
        });
        const projectsData = response.data?.data || [];
        setProjects(projectsData);

        // If projectId is provided, set it as selected
        if (projectId) {
          const selectedProj = projectsData.find((p) => p.id === projectId);
          setSelectedProject(selectedProj || null);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjectsByYear();
  }, [selectedYear, availableYears.length, open, projectId]);

  // Reset selected project when year changes
  useEffect(() => {
    setSelectedProject(null);
  }, [selectedYear]);

  // Update selectedProject when formData.project_id changes
  useEffect(() => {
    if (formData.project_id && projects.length > 0) {
      const selectedProj = projects.find(
        (p) => p.pn_number === formData.project_id
      );
      setSelectedProject(selectedProj || null);
    } else {
      setSelectedProject(null);
    }
  }, [formData.project_id, projects]);

  // Fetch project info and invoices when selected project changes
  useEffect(() => {
    console.log("useEffect triggered with selectedProject:", selectedProject);
    if (!selectedProject?.id && !selectedProject?.pn_number) {
      console.log("No selectedProject id or pn_number, resetting values");
      setProjectInfo(null);
      setInvoicesList([]);
      setTotalInvoiceValue(0);
      setProjectValue(0);
      setRemainingProjectValue(0);
      return;
    }

    const fetchData = async () => {
      setLoadingProject(true);
      setLoadingInvoices(true);
      try {
        // Fetch project info using id if available, otherwise use pn_number
        const projectId = selectedProject.id || selectedProject.pn_number;
        const projectResponse = await api.get(`/projects/${projectId}`);
        const projectData = projectResponse.data?.data || selectedProject;
        setProjectInfo(projectData);

        // Fetch invoices using pn_number as project_id
        const invoicesResponse = await api.get("/finance/invoices", {
          params: { project_id: encodeURIComponent(selectedProject.pn_number) },
        });
        const invoices = invoicesResponse.data?.invoices || [];
        setInvoicesList(invoices);

        // Calculate totals
        const totalInvValue = invoices.reduce(
          (sum, inv) => sum + (parseFloat(inv.invoice_value) || 0),
          0
        );
        setTotalInvoiceValue(totalInvValue);

        // Get project value from project data (clean formatted strings)
        const apiPoValue = projectData?.po_value;
        const fallbackPoValue = selectedProject?.po_value;
        const poValueToUse =
          apiPoValue !== null && apiPoValue !== undefined
            ? apiPoValue
            : fallbackPoValue;
        const projValue =
          parseFloat(poValueToUse?.toString().replace(/[^\d.]/g, "")) || 0;
        setProjectValue(projValue);

        // Use remaining project value from API response (more accurate)
        const remainingFromAPI =
          invoices.length > 0 ? invoices[0].remaining_project_value : 0;
        setRemainingProjectValue(remainingFromAPI || projValue - totalInvValue);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
        setProjectInfo(selectedProject);
        setInvoicesList([]);
        setTotalInvoiceValue(0);
        const projValue =
          parseFloat(
            selectedProject?.po_value?.toString().replace(/[^\d.]/g, "")
          ) || 0;
        setProjectValue(projValue);
        setRemainingProjectValue(projValue);
      } finally {
        setLoadingProject(false);
        setLoadingInvoices(false);
      }
    };

    fetchData();
  }, [selectedProject]);

  // Fetch next global sequence when invoice type is selected (for create mode)
  useEffect(() => {
    if (formData.invoice_type_id && !isEditMode && open) {
      const fetchNextSequenceForType = async () => {
        try {
          const response = await api.get("/finance/invoices/next-id", {
            params: { invoice_type_id: formData.invoice_type_id },
          });
          const nextInvoiceId = response.data?.next_invoice_id;
          if (nextInvoiceId) {
            // Extract the last 3 digits as sequence
            const nextSeq = parseInt(nextInvoiceId.slice(-3));
            const sequenceStr = nextSeq.toString().padStart(3, "0");
            setNextSequence(sequenceStr);
            setFormData((prev) => ({
              ...prev,
              invoice_sequence: sequenceStr,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch next sequence for type:", error);
          // Fallback: try to get from existing invoices or use 001
          try {
            // Try to get the latest invoice for this type to calculate next sequence
            const response = await api.get("/finance/invoices", {
              params: { project_id: projectId, limit: 1000 },
            });
            const invoices = response.data?.invoices || [];
            const typeInvoices = invoices.filter((inv) => {
              const selectedType = invoiceTypes.find(
                (type) => type.id === formData.invoice_type_id
              );
              return (
                selectedType &&
                inv.invoice_id.startsWith(selectedType.code_type)
              );
            });

            if (typeInvoices.length > 0) {
              // Find the highest sequence for this type
              const sequences = typeInvoices.map((inv) =>
                parseInt(inv.invoice_id.slice(-4))
              );
              const maxSeq = Math.max(...sequences);
              const nextSeq = maxSeq + 1;
              const sequenceStr = nextSeq.toString().padStart(4, "0");
              setNextSequence(sequenceStr);
              setFormData((prev) => ({
                ...prev,
                invoice_sequence: sequenceStr,
              }));
            } else {
              setNextSequence("0001");
              setFormData((prev) => ({ ...prev, invoice_sequence: "0001" }));
            }
          } catch (fallbackError) {
            console.error("Fallback sequence fetch failed:", fallbackError);
            setNextSequence("0001");
            setFormData((prev) => ({ ...prev, invoice_sequence: "0001" }));
          }
        }
      };

      fetchNextSequenceForType();
    } else if (!formData.invoice_type_id && !isEditMode) {
      // Reset sequence when no type is selected
      setNextSequence("");
      setFormData((prev) => ({ ...prev, invoice_sequence: "" }));
    }
  }, [formData.invoice_type_id, isEditMode, open, projectId, invoiceTypes]);

  // Fetch full invoice data for edit mode
  useEffect(() => {
    if (isEditMode && invoiceData?.invoice_id && open) {
      const fetchFullInvoiceData = async () => {
        try {
          const response = await api.get(
            `/finance/invoices/${invoiceData.invoice_id}`
          );
          console.log("Fetched full invoice data:", response.data);
          setFullInvoiceData(response.data);
        } catch (error) {
          console.error("Failed to fetch full invoice data:", error);
          setFullInvoiceData(null);
        }
      };
      fetchFullInvoiceData();
    } else {
      setFullInvoiceData(null);
    }
  }, [isEditMode, invoiceData?.invoice_id, open]);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (isEditMode && (fullInvoiceData || invoiceData)) {
        const data = fullInvoiceData || invoiceData;
        console.log("Initializing form with data:", data);
        console.log("invoice_type_id:", data.invoice_type_id);
        const invoiceTypeId = data.invoice_type_id
          ? parseInt(data.invoice_type_id)
          : null;
        // Extract sequence from invoice_id (last 4 characters)
        const sequence = data.invoice_id ? data.invoice_id.slice(-4) : "";
        setFormData({
          invoice_type_id: invoiceTypeId,
          invoice_sequence: sequence,
          no_faktur: data.no_faktur || "",
          invoice_date: data.invoice_date ? data.invoice_date.slice(0, 10) : "",
          invoice_description: data.invoice_description || "",
          invoice_value: data.invoice_value || "",
          invoice_due_date: data.invoice_due_date
            ? data.invoice_due_date.slice(0, 10)
            : "",
          remarks: data.remarks || "",
          currency: data.currency || "IDR",
          rate_usd: data.rate_usd || "",
          is_ppn: (data.nilai_ppn && parseFloat(data.nilai_ppn) > 0) || false,
          is_pph23:
            (data.nilai_pph23 && parseFloat(data.nilai_pph23) > 0) || false,
          is_pph42:
            (data.nilai_pph42 && parseFloat(data.nilai_pph42) > 0) || false,
          nilai_ppn: data.nilai_ppn || "",
          nilai_pph23: data.nilai_pph23 || "",
          nilai_pph42: data.nilai_pph42 || "",
        });
        setOriginalInvoiceTypeId(invoiceTypeId);
      } else {
        setFormData({
          invoice_type_id: null,
          invoice_sequence: "",
          no_faktur: "",
          invoice_date: "",
          invoice_description: "",
          invoice_value: "",
          invoice_due_date: "",
          remarks: "",
          currency: "IDR",
          rate_usd: "",
          is_ppn: true,
          is_pph23: false,
          is_pph42: false,
          nilai_ppn: "",
          nilai_pph23: "",
          nilai_pph42: "",
        });
        setOriginalInvoiceTypeId(null);
      }
      // Reset all states when modal opens
      setSelectedProject(null);
      setProjectInfo(null);
      setRemainingProjectValue(0);
      setTotalInvoiceValue(0);
      setProjectValue(0);
      setInvoicesList([]);
      setShowInvoicesList(false);
      setShowPreview(false);
      setPreviewData(null);
      setPreviewInvoiceId(null);
      setTaxPreview(null);
      setSequenceError("");
      setValidatingSequence(false);
      setNextSequence("");
    }
  }, [open, isEditMode, invoiceData, fullInvoiceData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Function to calculate tax preview with manual overrides
  const calculateTaxPreview = useCallback(() => {
    if (
      !formData.invoice_value ||
      (!formData.is_ppn && !formData.is_pph23 && !formData.is_pph42)
    ) {
      setTaxPreview(null);
      return;
    }

    // Validate required parameters before making API call
    const invoiceValue = parseFloat(formData.invoice_value);
    if (isNaN(invoiceValue) || invoiceValue <= 0) {
      setTaxPreview(null);
      return;
    }

    setLoadingTaxPreview(true);
    try {
      let apiInvoiceValue = invoiceValue;
      let apiCurrency = formData.currency;

      // For USD currency, convert to IDR first for tax calculation
      if (
        formData.currency === "USD" &&
        formData.rate_usd &&
        formData.rate_usd.trim() !== ""
      ) {
        const rateUsd = parseFloat(formData.rate_usd);
        if (!isNaN(rateUsd) && rateUsd > 0) {
          apiInvoiceValue = invoiceValue * rateUsd;
          apiCurrency = "IDR"; // Calculate taxes on IDR equivalent
        }
      }

      const params = {
        invoice_value: apiInvoiceValue,
        currency: apiCurrency,
        is_ppn: formData.is_ppn ? 1 : 0,
        is_pph23: formData.is_pph23 ? 1 : 0,
        is_pph42: formData.is_pph42 ? 1 : 0,
      };

      // Calculate manual tax values
      const manualPpn = formData.nilai_ppn
        ? parseFloat(formData.nilai_ppn)
        : null;
      const manualPph23 = formData.nilai_pph23
        ? parseFloat(formData.nilai_pph23)
        : null;
      const manualPph42 = formData.nilai_pph42
        ? parseFloat(formData.nilai_pph42)
        : null;

      // Use API for base calculation, then override with manual values
      api
        .get("/finance/invoices/preview-taxes", { params })
        .then((response) => {
          const basePreview = response.data;

          // Override with manual values if provided
          const finalPreview = {
            ...basePreview,
            nilai_ppn:
              manualPpn !== null && !isNaN(manualPpn)
                ? manualPpn
                : basePreview.nilai_ppn,
            nilai_pph23:
              manualPph23 !== null && !isNaN(manualPph23)
                ? manualPph23
                : basePreview.nilai_pph23,
            nilai_pph42:
              manualPph42 !== null && !isNaN(manualPph42)
                ? manualPph42
                : basePreview.nilai_pph42,
          };

          // Recalculate totals based on manual values
          const totalTax =
            (finalPreview.nilai_ppn || 0) +
            (finalPreview.nilai_pph23 || 0) +
            (finalPreview.nilai_pph42 || 0);
          finalPreview.total_invoice = apiInvoiceValue + totalTax;
          finalPreview.expected_payment =
            apiInvoiceValue +
            (finalPreview.nilai_ppn || 0) -
            (finalPreview.nilai_pph23 || 0) -
            (finalPreview.nilai_pph42 || 0);

          setTaxPreview(finalPreview);
        })
        .catch((error) => {
          // Handle different error types gracefully
          if (error.response?.status === 422) {
            // Validation error from backend - don't log as error, just clear preview
            console.warn("Tax preview validation failed:", error.response.data);
          } else if (error.response?.status >= 500) {
            // Server error - log but don't show to user
            console.error("Server error fetching tax preview:", error);
          } else {
            // Other errors - log for debugging
            console.error("Failed to fetch tax preview:", error);
          }
          setTaxPreview(null);
        })
        .finally(() => {
          setLoadingTaxPreview(false);
        });
    } catch (error) {
      console.error("Failed to calculate tax preview:", error);
      setTaxPreview(null);
      setLoadingTaxPreview(false);
    }
  }, [
    formData.invoice_value,
    formData.currency,
    formData.rate_usd,
    formData.is_ppn,
    formData.is_pph23,
    formData.is_pph42,
    formData.nilai_ppn,
    formData.nilai_pph23,
    formData.nilai_pph42,
  ]);

  // Calculate tax preview when relevant fields change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateTaxPreview();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [calculateTaxPreview]);

  const handleSequenceChange = async (value) => {
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    setFormData((prev) => ({ ...prev, invoice_sequence: numericValue }));

    // Clear previous error
    setSequenceError("");

    // Clear error if sequence is empty
    if (!numericValue) {
      return;
    }

    // Validate sequence uniqueness only if sequence has value and type is selected
    if (numericValue && formData.invoice_type_id) {
      setValidatingSequence(true);
      try {
        const response = await api.get("/finance/invoices/validate-sequence", {
          params: {
            project_id: selectedProject.pn_number,
            invoice_type_id: formData.invoice_type_id,
            invoice_sequence: parseInt(numericValue),
            ...(isEditMode &&
              invoiceData?.invoice_id && {
                exclude_invoice_id: invoiceData.invoice_id,
              }),
          },
        });

        if (response.data && !response.data.available) {
          // Sequence already exists - provide specific error message
          const selectedType = invoiceTypes.find(
            (type) => type.id === formData.invoice_type_id
          );
          const typeName = selectedType
            ? selectedType.code_type
            : "selected type";
          const paddedSequence = numericValue.padStart(4, "0");

          setSequenceError(
            `Sequence ${paddedSequence} already exists for ${typeName} invoices in this project. Please choose a different sequence number.`
          );
        } else {
          setSequenceError("");
        }
      } catch (error) {
        console.error("Failed to validate sequence:", error);

        // Provide more specific error messages based on error type
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 400) {
            setSequenceError(
              "Invalid sequence format. Please enter a valid number."
            );
          } else if (error.response.status === 422) {
            // Handle 422 as validation error, don't show error
            setSequenceError("");
          } else if (error.response.status === 500) {
            setSequenceError("Server error occurred. Please try again later.");
          }
        } else if (error.request) {
          // Network error
          setSequenceError(
            "Network error. Please check your internet connection."
          );
        } else {
          // Other error
          setSequenceError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setValidatingSequence(false);
      }
    } else {
      setSequenceError("");
    }
  };

  const generateInvoiceId = useCallback(async () => {
    if (!formData.invoice_type_id) return null;

    try {
      const params = {
        invoice_type_id: formData.invoice_type_id,
      };

      // Add invoice_sequence if provided
      if (formData.invoice_sequence) {
        params.invoice_sequence = parseInt(formData.invoice_sequence);
      }

      // For edit mode with type change
      if (
        isEditMode &&
        originalInvoiceTypeId &&
        originalInvoiceTypeId !== formData.invoice_type_id
      ) {
        params.original_invoice_type_id = originalInvoiceTypeId;
      }

      const response = await api.get("/finance/invoices/next-id", { params });
      console.log("Generated invoice ID:", response.data.next_invoice_id);
      return response.data.next_invoice_id;
    } catch (error) {
      console.error("Failed to generate invoice ID:", error);
      return null;
    }
  }, [
    formData.invoice_type_id,
    formData.invoice_sequence,
    isEditMode,
    originalInvoiceTypeId,
  ]);

  // Generate preview invoice ID when invoice type or sequence is changed
  useEffect(() => {
    if (formData.invoice_type_id) {
      (async () => {
        try {
          const id = await generateInvoiceId();
          setPreviewInvoiceId(id);
        } catch (error) {
          console.error("Failed to generate preview invoice ID:", error);
          setPreviewInvoiceId(null);
        }
      })();
    } else {
      setPreviewInvoiceId(null);
    }
  }, [
    formData.invoice_type_id,
    formData.invoice_sequence,
    originalInvoiceTypeId,
    generateInvoiceId,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if invoice type is selected
    if (!formData.invoice_type_id) {
      setSnackbar({
        open: true,
        message: "Please select an invoice type.",
        severity: "error",
      });
      return;
    }

    // Validation: Check if rate_usd is required for USD currency
    if (formData.currency === "USD" && !formData.rate_usd) {
      setSnackbar({
        open: true,
        message: "USD rate is required when currency is USD.",
        severity: "error",
      });
      return;
    }

    // Validation: Check if invoice value exceeds project value using API
    if (formData.invoice_value) {
      try {
        const response = await api.get("/finance/invoices/validate", {
          params: {
            project_id: selectedProject.pn_number,
            invoice_value: parseFloat(formData.invoice_value),
            ...(isEditMode &&
              invoiceData?.invoice_id && {
                invoice_id: invoiceData.invoice_id,
              }),
          },
        });

        if (!response.data.valid) {
          const details = response.data;
          const currency = formData.currency || "IDR";
          const detailedMessage = `${
            response.data.message
          }\n\nDetails:\n- Current total invoices: ${
            formatValue(details.current_total || 0, currency).formatted
          }\n- New total after this invoice: ${
            formatValue(details.new_total || 0, currency).formatted
          }\n- Project value: ${
            formatValue(details.project_value || 0, currency).formatted
          }\n- Exceeds by: ${
            formatValue(details.exceeds_by || 0, currency).formatted
          }`;
          setWarningModal({
            open: true,
            message: detailedMessage,
            onConfirm: () => {
              setWarningModal({ open: false, message: "", onConfirm: null });
              proceedWithSubmit();
            },
          });
          return;
        }
      } catch (error) {
        console.error("Validation failed:", error);
        setSnackbar({
          open: true,
          message: "Failed to validate invoice. Please try again.",
          severity: "error",
        });
        return;
      }
    }

    proceedWithSubmit();
  };

  const proceedWithSubmit = async () => {
    // Generate preview data
    let generatedId = null;
    if (isEditMode) {
      generatedId = await generateInvoiceId();
      console.log("Preview generated ID for edit:", generatedId);
    } else {
      // For create mode, construct the ID locally based on form data
      const selectedType = invoiceTypes.find(
        (type) => type.id === formData.invoice_type_id
      );
      if (selectedType && formData.invoice_sequence) {
        const year = new Date().getFullYear().toString().slice(-2);
        generatedId =
          selectedType.code_type +
          "/" +
          year +
          "/" +
          formData.invoice_sequence.padStart(4, "0");
        console.log("Preview constructed ID for create:", generatedId);
      }
    }

    const selectedType = invoiceTypes.find(
      (type) => type.id === formData.invoice_type_id
    );

    const preview = {
      invoice_id: isEditMode
        ? generatedId || invoiceData?.invoice_id || "N/A"
        : generatedId || previewInvoiceId || "IP/25/0001",
      project_id: selectedProject.pn_number,
      invoice_type: selectedType
        ? `${selectedType.code_type} - ${selectedType.description}`
        : "Not selected",
      no_faktur: formData.no_faktur || "Not specified",
      invoice_date: formData.invoice_date
        ? formatDate(formData.invoice_date)
        : "Not specified",
      invoice_description: formData.invoice_description || "Not specified",
      invoice_value: formData.invoice_value
        ? formatValue(formData.invoice_value).formatted
        : "Not specified",
      invoice_due_date: formData.invoice_due_date
        ? formatDate(formData.invoice_due_date)
        : "Not specified",
      currency: formData.currency,
      rate_usd: formData.rate_usd || "Not specified",
      tax_flags:
        [
          formData.is_ppn && "PPN (11%)",
          formData.is_pph23 && "PPh 23 (2.65%)",
          formData.is_pph42 && "PPh 4(2) (2%)",
        ]
          .filter(Boolean)
          .join(", ") || "None",
      tax_details: taxPreview
        ? {
            ppn_rate: taxPreview.ppn_rate,
            pph23_rate: taxPreview.pph23_rate,
            pph42_rate: taxPreview.pph42_rate,
            nilai_ppn: formData.nilai_ppn || taxPreview.nilai_ppn,
            nilai_pph23: formData.nilai_pph23 || taxPreview.nilai_pph23,
            nilai_pph42: formData.nilai_pph42 || taxPreview.nilai_pph42,
            total_invoice: taxPreview.total_invoice,
            expected_payment: taxPreview.expected_payment,
          }
        : null,
      remarks: formData.remarks || "Not specified",
    };

    setPreviewData(preview);
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        project_id: selectedProject.pn_number,
        invoice_type_id: formData.invoice_type_id,
        invoice_sequence: formData.invoice_sequence
          ? parseInt(formData.invoice_sequence)
          : null,
        no_faktur: formData.no_faktur || null,
        invoice_date: formData.invoice_date || null,
        invoice_description: formData.invoice_description || null,
        invoice_value: formData.invoice_value
          ? parseFloat(formData.invoice_value)
          : null,
        invoice_due_date: formData.invoice_due_date || null,
        currency: formData.currency,
        remarks: formData.remarks || null,
        rate_usd: formData.rate_usd ? parseFloat(formData.rate_usd) : null,
        is_ppn: formData.is_ppn,
        is_pph23: formData.is_pph23,
        is_pph42: formData.is_pph42,
        nilai_ppn: formData.nilai_ppn ? parseFloat(formData.nilai_ppn) : null,
        nilai_pph23: formData.nilai_pph23
          ? parseFloat(formData.nilai_pph23)
          : null,
        nilai_pph42: formData.nilai_pph42
          ? parseFloat(formData.nilai_pph42)
          : null,
      };

      if (isEditMode) {
        await api.put(`/finance/invoices/${invoiceData.invoice_id}`, payload);
      } else {
        await api.post("/finance/invoices", payload);
      }

      setSnackbar({
        open: true,
        message: `Invoice ${isEditMode ? "updated" : "created"} successfully!`,
        severity: "success",
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      setSnackbar({
        open: true,
        message: "Failed to save invoice. Please try again.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
      setShowPreview(false);
    }
  };

  const handleCurrencyChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, invoice_value: numericValue }));
  };

  const handleRateUsdChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, rate_usd: numericValue }));
  };

  if (showPreview && previewData) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Receipt sx={{ fontSize: 28, color: "primary.main" }} />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                Invoice Preview
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                Review your invoice details before{" "}
                {isEditMode ? "updating" : "creating"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 4, px: 4 }}>
          {/* Invoice Header Card */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
                transform: "translate(30px, -30px)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, mb: 1, fontFamily: "monospace" }}
                >
                  {previewData.invoice_id}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Invoice {isEditMode ? "Update" : "Creation"}
                </Typography>
              </Box>
              <Chip
                label={isEditMode ? "Update" : "New"}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              />
            </Box>
            <Divider sx={{ bgcolor: "rgba(255,255,255,0.3)", my: 2 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Building2 sx={{ fontSize: 20, opacity: 0.8 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block" }}
                    >
                      Project ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {previewData.project_id}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Receipt sx={{ fontSize: 20, opacity: 0.8 }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block" }}
                    >
                      Invoice Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {previewData.invoice_type}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            {/* Basic Information Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <FileText
                    sx={{ mr: 1.5, color: "primary.main", fontSize: 22 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "primary.main" }}
                  >
                    Basic Information
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      No Faktur
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {previewData.no_faktur}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Description
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 500, lineHeight: 1.4 }}
                    >
                      {previewData.invoice_description}
                    </Typography>
                  </Box>

                  {previewData.remarks !== "Not specified" && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Remarks
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500, lineHeight: 1.4 }}
                      >
                        {previewData.remarks}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Financial Details Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <DollarSign
                    sx={{ mr: 1.5, color: "warning.main", fontSize: 22 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "warning.main" }}
                  >
                    Financial Details
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Invoice Value
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "success.main",
                        fontFamily: "monospace",
                      }}
                    >
                      {previewData.invoice_value}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Currency
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 18,
                          fontWeight: 700,
                          color:
                            previewData.currency === "IDR"
                              ? "#1976d2"
                              : "#2e7d32",
                          minWidth: 24,
                          textAlign: "center",
                        }}
                      >
                        {previewData.currency === "IDR" ? "Rp" : "$"}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {previewData.currency === "IDR"
                          ? "Indonesian Rupiah"
                          : "US Dollar"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tax Summary in Preview */}
                  {previewData.tax_details && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        Tax Summary
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Total Invoice:{" "}
                          <strong>
                            {
                              formatValue(previewData.tax_details.total_invoice)
                                .formatted
                            }
                          </strong>
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Dates Card */}
            <Grid size={{ xs: 12 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <User sx={{ mr: 1.5, color: "info.main", fontSize: 22 }} />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "info.main" }}
                  >
                    Important Dates
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Invoice Date
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {previewData.invoice_date}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Due Date
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "error.main" }}
                      >
                        {previewData.invoice_due_date}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: "divider",
            gap: 2,
            bgcolor: "grey.50",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={() => setShowPreview(false)}
            color="inherit"
            variant="outlined"
            disabled={submitting}
            sx={{
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": {
                bgcolor: "grey.100",
              },
            }}
          >
            ← Back to Edit
          </Button>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={onClose}
              color="inherit"
              variant="text"
              disabled={submitting}
              sx={{
                px: 3,
                fontWeight: 500,
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: "success.main",
                px: 4,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                "&:hover": {
                  bgcolor: "success.dark",
                  boxShadow: "0 6px 16px rgba(34, 197, 94, 0.4)",
                },
              }}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "white" }} />
                  Saving...
                </Box>
              ) : (
                `✓ Confirm ${isEditMode ? "Update" : "Create"}`
              )}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "text.primary",
              borderBottom: 1,
              borderColor: "divider",
              pb: 1.5,
            }}
          >
            <Receipt style={{ marginRight: 8 }} />
            {isEditMode ? "Edit Invoice" : "Create New Invoice"}
          </DialogTitle>

          <DialogContent dividers sx={{ py: 3 }}>
            <Box sx={{ p: 2 }}>
              {/* Project Selection Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <Building2 sx={{ mr: 1.5, fontSize: 22 }} />
                  Select Project *
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: "error.main", fontWeight: 500, ml: 1 }}
                  >
                    (Required)
                  </Typography>
                </Typography>

                {/* Year Filter */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: "text.primary",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Calendar sx={{ fontSize: 16, color: "primary.main" }} />
                    Filter by Year
                  </Typography>

                  <FormControl fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Year"
                      onChange={(e) => setSelectedYear(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: "background.paper",
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main",
                          borderWidth: 2,
                        },
                      }}
                    >
                      {availableYears.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Autocomplete
                  fullWidth
                  options={sortOptions(projects, "project_number")}
                  getOptionLabel={(option) =>
                    `${option.project_number || "N/A"} - ${
                      option.project_name || "Unnamed Project"
                    } ${option.year ? `(${option.year})` : ""}`
                  }
                  value={selectedProject}
                  onChange={(e, newValue) => {
                    setSelectedProject(newValue);
                  }}
                  loading={loadingProjects}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search and select a project..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Building2
                            sx={{
                              mr: 1,
                              color: "action.active",
                              fontSize: 20,
                            }}
                          />
                        ),
                        endAdornment: (
                          <>
                            {loadingProjects ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: "background.paper",
                          "&:hover": {
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                          },
                          "&.Mui-focused": {
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                            boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
                          },
                        },
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
                          alignItems: "center",
                          gap: 2,
                          py: 1.5,
                          px: 2,
                          borderRadius: 1,
                          backgroundColor: "background.paper",
                        }}
                        {...otherProps}
                      >
                        <Building2
                          sx={{ fontSize: 18, color: "primary.main" }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontFamily: "monospace",
                              color: "text.primary",
                            }}
                          >
                            {option.project_number || "N/A"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {option.project_name || "Unnamed Project"}
                          </Typography>
                          {option.year && (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", display: "block" }}
                            >
                              Year: {option.year}
                            </Typography>
                          )}
                          {option.quotation?.client?.name && (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", display: "block" }}
                            >
                              Client: {option.quotation.client.name}
                            </Typography>
                          )}
                        </Box>
                        {option.po_value && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "success.main",
                              ml: 2,
                            }}
                          >
                            {formatValue(option.po_value).formatted}
                          </Typography>
                        )}
                      </Box>
                    );
                  }}
                  PaperComponent={({ children, ...props }) => (
                    <Paper
                      {...props}
                      sx={{
                        mt: 1,
                        borderRadius: 2,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        border: "1px solid",
                        borderColor: "divider",
                        maxHeight: 300,
                        overflow: "auto",
                      }}
                    >
                      {children}
                    </Paper>
                  )}
                />

                {!selectedProject && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mt: 2,
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    Please select a project to continue with invoice creation
                  </Typography>
                )}
              </Paper>

              {/* Project Information Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <Building2 sx={{ mr: 1.5, fontSize: 22 }} />
                  Project Information
                </Typography>

                {selectedProject ? (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FileText
                          sx={{ color: "text.secondary", fontSize: 16 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Project Number
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            {selectedProject.project_number || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <User sx={{ color: "text.secondary", fontSize: 16 }} />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Client
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedProject.quotation?.client?.name ||
                              selectedProject.client?.name ||
                              "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <DollarSign
                          sx={{ color: "text.secondary", fontSize: 16 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Project Value
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "success.main" }}
                          >
                            {selectedProject.po_value
                              ? formatValue(selectedProject.po_value).formatted
                              : "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FileText
                          sx={{ color: "text.secondary", fontSize: 16 }}
                        />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            PO Number
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {loadingProject ? (
                              <CircularProgress size={16} />
                            ) : (
                              projectInfo?.po_number || "N/A"
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    Select a project to view information
                  </Typography>
                )}
              </Paper>

              {/* Invoice Details Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <Receipt sx={{ mr: 1.5, fontSize: 22 }} />
                  Invoice Details
                </Typography>
                <Grid container spacing={3}>
                  {/* Invoice Configuration Section */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mb: 3 }}>
                      {/* Invoice Type Selection */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Receipt
                            sx={{ fontSize: 18, color: "primary.main" }}
                          />
                          Invoice Type *
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: "error.main", fontWeight: 500 }}
                          >
                            (Required)
                          </Typography>
                        </Typography>

                        <Autocomplete
                          fullWidth
                          disabled={isEditMode}
                          options={sortOptions(invoiceTypes, "code_type")}
                          getOptionLabel={(option) =>
                            `${option.code_type} - ${option.description}`
                          }
                          value={
                            invoiceTypes.find(
                              (type) => type.id === formData.invoice_type_id
                            ) || null
                          }
                          onChange={(e, newValue) => {
                            console.log("Selected invoice type:", newValue);
                            handleChange(
                              "invoice_type_id",
                              newValue ? newValue.id : null
                            );
                          }}
                          loading={loadingTypes}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select invoice type..."
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <Receipt
                                    sx={{
                                      mr: 1,
                                      color: "action.active",
                                      fontSize: 20,
                                    }}
                                  />
                                ),
                                endAdornment: (
                                  <>
                                    {loadingTypes ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={20}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: "background.paper",
                                  "&:hover": {
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: "primary.main",
                                      borderWidth: 2,
                                    },
                                  },
                                  "&.Mui-focused": {
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: "primary.main",
                                      borderWidth: 2,
                                    },
                                    boxShadow:
                                      "0 0 0 3px rgba(37, 99, 235, 0.1)",
                                  },
                                },
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
                                  alignItems: "center",
                                  gap: 2,
                                  py: 1.5,
                                  px: 2,
                                  borderRadius: 1,
                                  backgroundColor: "background.paper",
                                }}
                                {...otherProps}
                              >
                                <Receipt
                                  sx={{ fontSize: 18, color: "primary.main" }}
                                />
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      fontFamily: "monospace",
                                      color: "text.primary",
                                    }}
                                  >
                                    {option.code_type}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    {option.description}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          }}
                        />
                      </Box>

                      {/* Invoice Sequence Configuration */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <FileText
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          Invoice Sequence *
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: "error.main", fontWeight: 500 }}
                          >
                            (Required - Auto-generated)
                          </Typography>
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "grey.50",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  display: "block",
                                  mb: 1,
                                }}
                              >
                                Auto-Generated Sequence
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    color: formData.invoice_type_id
                                      ? "primary.main"
                                      : "text.disabled",
                                    fontFamily: "monospace",
                                    minWidth: 60,
                                    textAlign: "center",
                                  }}
                                >
                                  {formData.invoice_type_id
                                    ? nextSequence || "0001"
                                    : "---"}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {formData.invoice_type_id
                                    ? "Next available"
                                    : "Select type first"}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              disabled={isEditMode}
                              label="Custom Sequence (Optional)"
                              placeholder="Enter custom sequence or leave empty for auto"
                              value={formData.invoice_sequence}
                              onChange={(e) =>
                                handleSequenceChange(e.target.value)
                              }
                              error={!!sequenceError}
                              helperText={sequenceError}
                              InputProps={{
                                startAdornment: (
                                  <FileText
                                    sx={{
                                      mr: 1,
                                      color: "action.active",
                                      fontSize: 18,
                                    }}
                                  />
                                ),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: "background.paper",
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "primary.main",
                                      borderWidth: 2,
                                    },
                                },
                              }}
                              inputProps={{
                                maxLength: 4,
                                pattern: "\\d{1,4}",
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Invoice ID Preview */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <FileText
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          Invoice ID Preview
                        </Typography>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            background:
                              "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                            border: "2px solid",
                            borderColor:
                              formData.invoice_type_id &&
                              formData.invoice_sequence
                                ? "success.light"
                                : "grey.200",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2,
                            }}
                          >
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color:
                                  formData.invoice_type_id &&
                                  formData.invoice_sequence
                                    ? "success.main"
                                    : "text.secondary",
                                letterSpacing: 1,
                              }}
                            >
                              {(() => {
                                const selectedType = invoiceTypes.find(
                                  (type) => type.id === formData.invoice_type_id
                                );
                                if (selectedType && formData.invoice_sequence) {
                                  const year = new Date()
                                    .getFullYear()
                                    .toString()
                                    .slice(-2);
                                  return (
                                    selectedType.code_type +
                                    "/" +
                                    year +
                                    "/" +
                                    formData.invoice_sequence.padStart(4, "0")
                                  );
                                }
                                return "IP/25/0001";
                              })()}
                            </Typography>
                            {formData.invoice_type_id &&
                              formData.invoice_sequence && (
                                <Chip
                                  label={
                                    validatingSequence
                                      ? "Validating..."
                                      : sequenceError
                                      ? "Invalid"
                                      : "Valid"
                                  }
                                  color={
                                    validatingSequence
                                      ? "default"
                                      : sequenceError
                                      ? "error"
                                      : "success"
                                  }
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "block",
                              textAlign: "center",
                              mt: 1,
                            }}
                          >
                            {formData.invoice_type_id &&
                            formData.invoice_sequence
                              ? "This will be your invoice ID"
                              : "Select type and enter sequence to see preview"}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Edit Invoice ID */}
                      {isEditMode && (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "success.light",
                            border: "1px solid",
                            borderColor: "success.main",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "success.contrastText",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FileText sx={{ fontSize: 16 }} />
                            Current Invoice ID:
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: "success.contrastText",
                              fontFamily: "monospace",
                              fontSize: "1.1rem",
                            }}
                          >
                            {invoiceData?.invoice_id || "N/A"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Row 2: No Faktur and Invoice Date */}
                  <Grid size={{ xs: 12 }}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: "text.primary",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FileText
                              sx={{ fontSize: 16, color: "primary.main" }}
                            />
                            No Faktur
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: "text.secondary", fontWeight: 400 }}
                            >
                              (Optional)
                            </Typography>
                          </Typography>
                          <TextField
                            fullWidth
                            placeholder="Enter invoice tax number (e.g., 001.001-23.12345678)"
                            value={formData.no_faktur}
                            onChange={(e) =>
                              handleChange("no_faktur", e.target.value)
                            }
                            InputProps={{
                              startAdornment: (
                                <FileText
                                  sx={{
                                    mr: 1,
                                    color: "action.active",
                                    fontSize: 18,
                                  }}
                                />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "background.paper",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "primary.main",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                              },
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: "text.primary",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Calendar
                              sx={{ fontSize: 16, color: "primary.main" }}
                            />
                            Invoice Date *
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: "error.main", fontWeight: 500 }}
                            >
                              (Required)
                            </Typography>
                          </Typography>
                          <TextField
                            fullWidth
                            type="date"
                            placeholder="Select invoice creation date"
                            InputLabelProps={{ shrink: true }}
                            value={formData.invoice_date}
                            onChange={(e) =>
                              handleChange("invoice_date", e.target.value)
                            }
                            InputProps={{
                              startAdornment: (
                                <Calendar
                                  sx={{
                                    mr: 1,
                                    color: "action.active",
                                    fontSize: 18,
                                  }}
                                />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "background.paper",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "primary.main",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Row 3: Due Date */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Calendar
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Due Date *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>
                      <TextField
                        fullWidth
                        type="date"
                        placeholder="Select payment due date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.invoice_due_date}
                        onChange={(e) =>
                          handleChange("invoice_due_date", e.target.value)
                        }
                        InputProps={{
                          startAdornment: (
                            <Calendar
                              sx={{
                                mr: 1,
                                color: "action.active",
                                fontSize: 18,
                              }}
                            />
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "background.paper",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Financial Details Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "warning.main",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1.1rem",
                    }}
                  >
                    <DollarSign sx={{ mr: 1.5, fontSize: 22 }} />
                    Financial Details
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowInvoicesList(!showInvoicesList)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    {showInvoicesList ? "Hide" : "Show"} Invoice List
                  </Button>
                </Box>

                {/* Remaining Project Value Display */}
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}
                  >
                    Remaining Project Value
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color:
                        remainingProjectValue < 0
                          ? "error.main"
                          : "success.main",
                    }}
                  >
                    {formatValue(remainingProjectValue).formatted}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Project Value: {formatValue(projectValue).formatted} | Total
                    Current Invoice: {formatValue(totalInvoiceValue).formatted}
                  </Typography>
                </Box>

                {/* Invoice List Modal */}
                {showInvoicesList && (
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      mb: 3,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "background.paper",
                      maxHeight: 500,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: "text.primary" }}
                      >
                        Invoice List for this Project ({invoicesList.length}{" "}
                        total)
                      </Typography>
                      {invoicesList.length > invoicesPerPage && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setInvoicesPage(Math.max(1, invoicesPage - 1))
                            }
                            disabled={invoicesPage === 1}
                            sx={{ minWidth: 32, px: 1 }}
                          >
                            ‹
                          </Button>
                          <Typography
                            variant="caption"
                            sx={{ alignSelf: "center", mx: 1 }}
                          >
                            {invoicesPage} /{" "}
                            {Math.ceil(invoicesList.length / invoicesPerPage)}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setInvoicesPage(
                                Math.min(
                                  Math.ceil(
                                    invoicesList.length / invoicesPerPage
                                  ),
                                  invoicesPage + 1
                                )
                              )
                            }
                            disabled={
                              invoicesPage ===
                              Math.ceil(invoicesList.length / invoicesPerPage)
                            }
                            sx={{ minWidth: 32, px: 1 }}
                          >
                            ›
                          </Button>
                        </Box>
                      )}
                    </Box>
                    {loadingInvoices ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 2,
                        }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    ) : invoicesList.length > 0 ? (
                      <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          {invoicesList
                            .slice(
                              (invoicesPage - 1) * invoicesPerPage,
                              invoicesPage * invoicesPerPage
                            )
                            .map((invoice) => (
                              <Box
                                key={invoice.invoice_id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  bgcolor: "grey.50",
                                  border: "1px solid",
                                  borderColor: "grey.200",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  "&:hover": {
                                    bgcolor: "grey.100",
                                  },
                                }}
                              >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {invoice.invoice_id}
                                  </Typography>
                                  {/* <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "block",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {invoice.invoice_description ||
                                      "No description"}
                                  </Typography> */}
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "primary.main",
                                    ml: 2,
                                  }}
                                >
                                  {formatValue(invoice.invoice_value).formatted}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          textAlign: "center",
                          py: 2,
                        }}
                      >
                        No invoices found for this project.
                      </Typography>
                    )}
                  </Paper>
                )}

                <Grid container spacing={3}>
                  {/* Currency Selection */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DollarSign
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Currency *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>

                      <Autocomplete
                        fullWidth
                        options={["IDR", "USD"]}
                        value={formData.currency}
                        onChange={(e, newValue) =>
                          handleChange("currency", newValue || "IDR")
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select currency"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <Typography
                                  sx={{
                                    mr: 1,
                                    fontWeight: 600,
                                    color:
                                      formData.currency === "IDR"
                                        ? "#1976d2"
                                        : "#2e7d32",
                                    fontSize: 16,
                                    minWidth: 20,
                                    textAlign: "center",
                                  }}
                                >
                                  {formData.currency === "IDR" ? "Rp" : "$"}
                                </Typography>
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "background.paper",
                                "&:hover": {
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                                },
                                "&.Mui-focused": {
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                                  boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
                                },
                              },
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
                                alignItems: "center",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                                borderRadius: 1,
                              }}
                              {...otherProps}
                            >
                              <Typography
                                sx={{
                                  fontSize: 18,
                                  fontWeight: 600,
                                  color:
                                    option === "IDR" ? "#1976d2" : "#2e7d32",
                                  minWidth: 32,
                                  textAlign: "center",
                                }}
                              >
                                {option === "IDR" ? "Rp" : "$"}
                              </Typography>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {option === "IDR"
                                    ? "Indonesian Rupiah"
                                    : "US Dollar"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {option === "IDR"
                                    ? "Local Currency"
                                    : "International Currency"}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                        PaperComponent={({ children, ...props }) => (
                          <Paper
                            {...props}
                            sx={{
                              mt: 1,
                              borderRadius: 2,
                              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            {children}
                          </Paper>
                        )}
                      />
                    </Box>
                  </Grid>

                  {/* Invoice Value */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DollarSign
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Invoice Value *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>

                      <TextField
                        fullWidth
                        placeholder="Enter invoice amount"
                        value={
                          formData.invoice_value
                            ? Number(formData.invoice_value).toLocaleString(
                                formData.currency === "USD" ? "en-US" : "id-ID"
                              )
                            : ""
                        }
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <Box
                              sx={{
                                width: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    formData.currency === "IDR"
                                      ? "#1976d2"
                                      : "#2e7d32",
                                  fontSize: 16,
                                }}
                              >
                                {formData.currency === "USD" ? "$" : "Rp"}
                              </Typography>
                            </Box>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "background.paper",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Rate USD - Conditional */}
                  {formData.currency === "USD" && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1.5,
                            fontWeight: 600,
                            color: "text.primary",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <DollarSign
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          USD Rate *
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: "error.main", fontWeight: 500 }}
                          >
                            (Required for USD)
                          </Typography>
                        </Typography>

                        <TextField
                          fullWidth
                          placeholder="Enter USD to IDR exchange rate (e.g., 15000)"
                          value={
                            formData.rate_usd
                              ? Number(formData.rate_usd).toLocaleString(
                                  "id-ID"
                                )
                              : ""
                          }
                          onChange={(e) => handleRateUsdChange(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <Typography
                                sx={{
                                  mr: 1,
                                  fontWeight: 600,
                                  color: "#2e7d32",
                                  fontSize: 16,
                                }}
                              >
                                Rp
                              </Typography>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              backgroundColor: "background.paper",
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "primary.main",
                                  borderWidth: 2,
                                },
                            },
                          }}
                        />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Payment Status and Tax Flags Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "info.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <DollarSign sx={{ mr: 1.5, fontSize: 22 }} />
                  Payment & Tax Settings
                </Typography>

                <Grid container spacing={3}>
                  {/* Tax Flags */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      Tax Flags
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.is_ppn}
                            onChange={(e) =>
                              handleChange("is_ppn", e.target.checked)
                            }
                            sx={{
                              color: "primary.main",
                              "&.Mui-checked": {
                                color: "primary.main",
                              },
                            }}
                          />
                        }
                        label="PPN"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.is_pph23}
                            onChange={(e) =>
                              handleChange("is_pph23", e.target.checked)
                            }
                            sx={{
                              color: "primary.main",
                              "&.Mui-checked": {
                                color: "primary.main",
                              },
                            }}
                          />
                        }
                        label="PPh 23"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.is_pph42}
                            onChange={(e) =>
                              handleChange("is_pph42", e.target.checked)
                            }
                            sx={{
                              color: "primary.main",
                              "&.Mui-checked": {
                                color: "primary.main",
                              },
                            }}
                          />
                        }
                        label="PPh 4(2)"
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Tax Preview Section */}
                {taxPreview && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 3,
                        fontWeight: 700,
                        color: "warning.main",
                        display: "flex",
                        alignItems: "center",
                        fontSize: "1.1rem",
                      }}
                    >
                      <DollarSign sx={{ mr: 1.5, fontSize: 22 }} />
                      Tax Preview & Manual Override
                    </Typography>

                    {loadingTaxPreview ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 2,
                        }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <Grid container spacing={3}>
                        {/* PPN Section */}
                        {formData.is_ppn && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.paper",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  fontWeight: 600,
                                  color: "text.primary",
                                }}
                              >
                                PPN (11%)
                              </Typography>
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Rate: {taxPreview.ppn_rate * 100}%
                                </Typography>
                              </Box>
                              <TextField
                                fullWidth
                                label="Manual PPN Value"
                                placeholder="Auto: 0"
                                value={
                                  formData.nilai_ppn
                                    ? Number(formData.nilai_ppn).toLocaleString(
                                        "id-ID"
                                      )
                                    : ""
                                }
                                onChange={(e) =>
                                  handleChange(
                                    "nilai_ppn",
                                    e.target.value.replace(/[^0-9]/g, "")
                                  )
                                }
                                InputProps={{
                                  startAdornment: (
                                    <Typography
                                      sx={{ mr: 1, color: "text.secondary" }}
                                    >
                                      Rp
                                    </Typography>
                                  ),
                                }}
                                helperText={`Auto calculated: ${
                                  formatValue(taxPreview.nilai_ppn).formatted
                                }`}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1,
                                  },
                                }}
                              />
                            </Paper>
                          </Grid>
                        )}

                        {/* PPh 23 Section */}
                        {formData.is_pph23 && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.paper",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  fontWeight: 600,
                                  color: "text.primary",
                                }}
                              >
                                PPh 23 (2.65%)
                              </Typography>
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Rate: {taxPreview.pph23_rate * 100}%
                                </Typography>
                              </Box>
                              <TextField
                                fullWidth
                                label="Manual PPh 23 Value"
                                placeholder="Auto: 0"
                                value={
                                  formData.nilai_pph23
                                    ? Number(
                                        formData.nilai_pph23
                                      ).toLocaleString("id-ID")
                                    : ""
                                }
                                onChange={(e) =>
                                  handleChange(
                                    "nilai_pph23",
                                    e.target.value.replace(/[^0-9]/g, "")
                                  )
                                }
                                InputProps={{
                                  startAdornment: (
                                    <Typography
                                      sx={{ mr: 1, color: "text.secondary" }}
                                    >
                                      Rp
                                    </Typography>
                                  ),
                                }}
                                helperText={`Auto calculated: ${
                                  formatValue(taxPreview.nilai_pph23).formatted
                                }`}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1,
                                  },
                                }}
                              />
                            </Paper>
                          </Grid>
                        )}

                        {/* PPh 4(2) Section */}
                        {formData.is_pph42 && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.paper",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  fontWeight: 600,
                                  color: "text.primary",
                                }}
                              >
                                PPh 4(2) (2%)
                              </Typography>
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Rate: {taxPreview.pph42_rate * 100}%
                                </Typography>
                              </Box>
                              <TextField
                                fullWidth
                                label="Manual PPh 4(2) Value"
                                placeholder="Auto: 0"
                                value={
                                  formData.nilai_pph42
                                    ? Number(
                                        formData.nilai_pph42
                                      ).toLocaleString("id-ID")
                                    : ""
                                }
                                onChange={(e) =>
                                  handleChange(
                                    "nilai_pph42",
                                    e.target.value.replace(/[^0-9]/g, "")
                                  )
                                }
                                InputProps={{
                                  startAdornment: (
                                    <Typography
                                      sx={{ mr: 1, color: "text.secondary" }}
                                    >
                                      Rp
                                    </Typography>
                                  ),
                                }}
                                helperText={`Auto calculated: ${
                                  formatValue(taxPreview.nilai_pph42).formatted
                                }`}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1,
                                  },
                                }}
                              />
                            </Paper>
                          </Grid>
                        )}

                        {/* Summary */}
                        <Grid size={{ xs: 12 }}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                              border: "1px solid",
                              borderColor: "info.light",
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                mb: 2,
                                fontWeight: 700,
                                color: "info.main",
                              }}
                            >
                              Tax Calculation Summary
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <Box sx={{ textAlign: "center" }}>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    Total Invoice
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 700,
                                      color: "success.main",
                                    }}
                                  >
                                    {
                                      formatValue(taxPreview.total_invoice)
                                        .formatted
                                    }
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <Box sx={{ textAlign: "center" }}>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    Expected Payment
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 700,
                                      color: "primary.main",
                                    }}
                                  >
                                    {
                                      formatValue(taxPreview.expected_payment)
                                        .formatted
                                    }
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                )}
              </Paper>

              {/* Additional Information Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #fafbfc 0%, #f1f3f4 100%)",
                  transition: "box-shadow 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1.1rem",
                    }}
                  >
                    <FileText sx={{ mr: 1.5, fontSize: 22 }} />
                    Additional Information
                  </Typography>
                  <Chip
                    size="small"
                    label="Optional"
                    variant="outlined"
                    sx={{
                      borderColor: "primary.light",
                      color: "primary.main",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                      height: 24,
                    }}
                  />
                </Box>

                {/* Description */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Invoice Description"
                  placeholder="Describe the invoice items or services"
                  value={formData.invoice_description}
                  onChange={(e) =>
                    handleChange("invoice_description", e.target.value)
                  }
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "text.secondary",
                      "&.Mui-focused": {
                        color: "primary.main",
                      },
                    },
                  }}
                />

                {/* Remarks */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Remarks"
                  placeholder="Additional notes or remarks"
                  value={formData.remarks}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "text.secondary",
                      "&.Mui-focused": {
                        color: "primary.main",
                      },
                    },
                  }}
                />
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{ p: 3, borderTop: 1, borderColor: "divider", gap: 2 }}
          >
            <Button
              onClick={onClose}
              color="inherit"
              variant="outlined"
              sx={{
                px: 3,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#2563eb",
                px: 4,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "#1d4ed8",
                },
              }}
            >
              Preview Invoice
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Warning Modal */}
      <Dialog
        open={warningModal.open}
        onClose={() =>
          setWarningModal({ open: false, message: "", onConfirm: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "warning.main",
            borderBottom: 1,
            borderColor: "divider",
            pb: 1.5,
          }}
        >
          ⚠️ Warning
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            {warningModal.message}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: 1, borderColor: "divider", gap: 2 }}
        >
          <Button
            onClick={() =>
              setWarningModal({ open: false, message: "", onConfirm: null })
            }
            color="inherit"
            variant="outlined"
            sx={{
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (warningModal.onConfirm) {
                warningModal.onConfirm();
              }
            }}
            variant="contained"
            color="warning"
            sx={{
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
