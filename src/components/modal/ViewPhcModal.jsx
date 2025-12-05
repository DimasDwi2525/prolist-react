import { useState, useEffect } from "react";
import { CircularProgress, Chip, Paper, Typography, Box } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import api from "../../api/api";
import BoqModal from "./BoqModal";
import SowModal from "./SowModal";
import { getToken, getUser } from "../../utils/storage";
import Swal from "sweetalert2";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export default function ViewPhcModal({
  phcId,
  open,
  handleClose,
  isFromApprovalPage = false,
  approval,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [phc, setPhc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [openBoqModal, setOpenBoqModal] = useState(false);
  const [openSowModal, setOpenSowModal] = useState(false);
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const token = getToken();
  const user = getUser();
  const role = user?.role || "";

  const normalizeValue = (val) => {
    if (val === "0") return "NA";
    if (val === "1") return "A";
    return val;
  };

  useEffect(() => {
    if (!phcId || !open) return;

    const fetchPhc = async () => {
      try {
        const res = await api.get(`/phcs/show/${phcId}`);
        if (res.data) {
          const { phc, project } = res.data;
          setProject(project);
          setPhc({
            ...phc,
            costing_by_marketing: normalizeValue(phc.costing_by_marketing),
            boq: normalizeValue(phc.boq),
            retention: normalizeValue(phc.retention),
            warranty: normalizeValue(phc.warranty),
          });
        }

        // Fetch document preparations untuk step 3
        const resDocs = await api.get(`/phcs/${phcId}/document-preparations`);
        if (resDocs.data) {
          setDocuments(
            (resDocs.data.documents ?? []).map((doc) => {
              const prep = doc.preparations?.[0];
              let datePrepared = "";
              if (prep?.date_prepared) {
                datePrepared = prep.date_prepared.split(" ")[0];
              }
              return {
                id: doc.id,
                preparation_id: prep?.id,
                attachment_path: prep?.attachment_path,
                name: doc.name,
                status: prep ? (prep.is_applicable ? "A" : "NA") : "NA",
                date_prepared: datePrepared,
              };
            })
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhc();
  }, [phcId, open]);

  useEffect(() => {
    if (selectedDoc) {
      const fetchPdf = async () => {
        setPdfLoading(true);
        setPdfError(false);
        try {
          const res = await api.get(
            `/document-preparations/${selectedDoc.preparation_id}/attachment`,
            {
              responseType: "blob",
            }
          );
          const url = URL.createObjectURL(res.data);
          setPdfUrl(url);
        } catch (err) {
          console.error("Error fetching PDF:", err);
          setPdfError(true);
        } finally {
          setPdfLoading(false);
        }
      };
      fetchPdf();
    }
  }, [selectedDoc]);

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "-"; // cek valid date

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleApprove = () => {
    setPinModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!pin) {
      Swal.fire({
        icon: "warning",
        title: "PIN Required",
        text: "PIN is required",
      });
      return;
    }

    try {
      await api.post(`/approvals/${approval.id}/status`, {
        status: "approved",
        pin,
      });
      setPin("");
      setPinModalOpen(false);
      handleClose(); // Close modal after success

      // Show success message and refresh approvals
      Swal.fire({
        icon: "success",
        title: "Approval Successful",
        text: "Item has been successfully approved",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        // Trigger refresh by dispatching custom event
        window.dispatchEvent(new CustomEvent("approvalSuccess"));
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Terjadi kesalahan",
      });
    }
  };

  // Reset pin when pin modal is closed
  useEffect(() => {
    if (!pinModalOpen) {
      setPin("");
    }
  }, [pinModalOpen]);

  // Reset pin when main modal closes
  useEffect(() => {
    if (!open) {
      setPin("");
      setPinModalOpen(false);
    }
  }, [open]);

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xl">
        <DialogTitle>📄 View Project Handover Checklist</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xl">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        📄 View Project Handover Checklist - {project?.project_number} -{" "}
        {project?.project_name}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 3 }}>
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
                    label="Handover Date"
                    value={formatDate(phc?.handover_date)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Start Date"
                    value={formatDate(phc?.start_date)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Target Finish Date"
                    value={formatDate(phc?.target_finish_date)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </div>
              </div>

              {/* Client Info */}
              <TextField
                label="Client PIC Name"
                value={phc?.client_pic_name || ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Client Mobile"
                value={phc?.client_mobile || ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              <div className="md:col-span-2">
                <TextField
                  label="Client Office Address"
                  multiline
                  rows={2}
                  value={phc?.client_reps_office_address || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </div>

              {/* Client Site Info - 3 columns */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField
                    label="Client Site Address"
                    value={phc?.client_site_address || ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Client Representative"
                    value={phc?.client_site_representatives || ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Site Phone Number"
                    value={phc?.site_phone_number || ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </div>
              </div>

              {/* 🔹 HO Marketing */}
              <TextField
                label="HO Marketing"
                value={phc?.ho_marketing?.name || ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              {/* 🔹 PIC Marketing */}
              <TextField
                label="PIC Marketing"
                value={phc?.pic_marketing?.name || ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              {/* 🔹 HO Engineering */}
              <TextField
                label="HO Engineering"
                value={phc?.ho_engineering?.name || ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              {/* 🔹 PIC Engineering */}
              <TextField
                label="PIC Engineering"
                value={phc?.pic_engineering?.name || ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              {/* Notes */}
              <div className="md:col-span-2">
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={phc?.notes || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------- STEP 2 ---------------- */}
        {step === 2 && (
          <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Handover Checklist
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
              }}
            >
              {[
                { key: "costing_by_marketing", label: "Costing by Marketing" },
                { key: "boq", label: "Bill of Quantity (BOQ)" },
                { key: "retention", label: "Retention" },
                { key: "warranty", label: "Warranty" },
                { key: "penalty", label: "Penalty" },
              ].map(({ key, label }) => {
                const isApplicable = phc?.[key] === "A";
                return (
                  <div
                    key={key}
                    className="p-4 border rounded-md bg-gray-50 space-y-2"
                  >
                    <div className="flex items-center mb-2">
                      {isApplicable ? (
                        <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      ) : (
                        <CancelIcon color="error" sx={{ mr: 1 }} />
                      )}
                      <Typography variant="body2" fontWeight="medium">
                        {label}
                      </Typography>
                    </div>
                    <Chip
                      label={isApplicable ? "Applicable" : "Not Applicable"}
                      color={isApplicable ? "success" : "error"}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    {phc?.[`${key}_detail`] && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Detail: {phc[`${key}_detail`]}
                      </Typography>
                    )}
                    {key === "retention" && isApplicable && (
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Percentage: {phc?.retention_percentage ?? "-"}%
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Months: {phc?.retention_months ?? "-"}
                        </Typography>
                      </>
                    )}
                    {key === "warranty" && isApplicable && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Date: {formatDate(phc?.warranty_date)}
                      </Typography>
                    )}
                    {key === "boq" && isApplicable && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setOpenBoqModal(true)}
                      >
                        View BOQ
                      </Button>
                    )}
                  </div>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* ---------------- STEP 3 ---------------- */}
        {step === 3 && (
          <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Document Preparation
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
              }}
            >
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
                      {doc.status === "A" ? "Applicable" : "Not Applicable"}
                    </span>
                  </div>
                  {doc.status === "A" && (
                    <>
                      <div className="text-sm text-gray-500">
                        Prepared Date: {formatDate(doc.date_prepared)}
                      </div>
                      <div className="flex gap-2">
                        {doc.name
                          .toLowerCase()
                          .includes("scope_of_work_approval") && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setOpenSowModal(true)}
                          >
                            View SOW
                          </Button>
                        )}
                        {doc.attachment_path && (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setOpenPdfModal(true);
                              }}
                            >
                              View Document
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={async () => {
                                try {
                                  const res = await api.get(
                                    `/document-preparations/${doc.preparation_id}/attachment`,
                                    {
                                      responseType: "blob",
                                    }
                                  );
                                  const url = URL.createObjectURL(res.data);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = `${doc.name}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                } catch (err) {
                                  console.error("Error downloading PDF:", err);
                                }
                              }}
                            >
                              Download PDF
                            </Button>
                          </>
                        )}
                        {!doc.attachment_path && (
                          <Button variant="outlined" size="small" disabled>
                            Document Not Uploaded
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </Box>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        {isFromApprovalPage && approval?.status === "pending" && (
          <Button onClick={handleApprove} variant="contained" color="success">
            Approve
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      <BoqModal
        open={openBoqModal}
        handleClose={() => setOpenBoqModal(false)}
        projectId={project?.pn_number}
        projectValue={project?.po_value}
        role={role}
        token={token}
        viewOnly={true}
      />

      <SowModal
        open={openSowModal}
        handleClose={() => setOpenSowModal(false)}
        projectId={project?.pn_number}
        token={token}
        viewOnly={true}
      />

      <Dialog
        open={openPdfModal}
        onClose={() => {
          setOpenPdfModal(false);
          setSelectedDoc(null);
          setPdfUrl("");
          setPdfError(false);
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          📄 View Document: {selectedDoc?.name}
          <IconButton
            aria-label="close"
            onClick={() => {
              setOpenPdfModal(false);
              setSelectedDoc(null);
              setPdfUrl("");
              setPdfError(false);
            }}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pdfLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 400,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {pdfError && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: 400,
              }}
            >
              <Typography variant="h6" color="error">
                Error loading PDF
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unable to load the document. Please try again later.
              </Typography>
            </Box>
          )}
          {!pdfLoading && !pdfError && pdfUrl && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages);
                  setPdfLoading(false);
                }}
                onLoadError={() => setPdfError(true)}
                loading={<CircularProgress />}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                ))}
              </Document>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenPdfModal(false);
              setSelectedDoc(null);
              setPdfUrl("");
              setPdfError(false);
            }}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PIN Modal for Approval */}
      <Dialog
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <TextField
            label="PIN"
            type="password"
            fullWidth
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPinModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmApprove} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
