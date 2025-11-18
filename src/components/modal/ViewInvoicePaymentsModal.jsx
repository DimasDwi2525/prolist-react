import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  TablePagination,
  TextField,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { HotTable } from "@handsontable/react";
import api from "../../api/api";
import LoadingOverlay from "../loading/LoadingOverlay";
import { filterBySearch } from "../../utils/filter";
import { formatDate } from "../../utils/FormatDate";
import { formatValue } from "../../utils/formatValue";
import FormInvoicePaymentsModal from "./FormInvoicePaymentsModal";

const ViewInvoicePaymentsModal = ({
  open,
  onClose,
  invoiceId,
  invoiceData,
  onDataUpdated,
}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const hotTableRef = useRef(null);
  const [openFormPaymentModal, setOpenFormPaymentModal] = useState(false);

  const fetchPayments = async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const response = await api.get("/finance/invoice-payments", {
        params: { invoice_id: invoiceId },
      });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && invoiceId) {
      fetchPayments();
    }
  }, [open, invoiceId]);

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const currencyRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatValue(value).formatted;
    return td;
  };

  const columns = [
    { data: "payment_number", title: "Payment #" },
    { data: "payment_date", title: "Payment Date", renderer: dateRenderer },
    { data: "payment_amount", title: "Amount", renderer: currencyRenderer },
    { data: "notes", title: "Notes" },
    { data: "currency", title: "Currency" },
  ];

  const filteredData = filterBySearch(payments, searchTerm);

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const tableHeight = Math.min(pageSize * 40 + 50, 400);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Payments for Invoice {invoiceData?.invoice_id || invoiceId}
          </Typography>
          <Button
            variant="contained"
            size="small"
            sx={{ minWidth: "auto" }}
            onClick={() => setOpenFormPaymentModal(true)}
          >
            <AddIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative" }}>
          <LoadingOverlay loading={loading} />

          <Box mb={2}>
            <TextField
              size="small"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                width: 240,
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
          </Box>

          {paginatedData.length > 0 ? (
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
                  fixedColumnsLeft={2}
                  stretchH="all"
                  filters
                  dropdownMenu
                  className="ht-theme-horizon"
                  manualColumnMove
                />
              </div>
            </div>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No payment data available for this invoice
              </Typography>
            </Box>
          )}

          {paginatedData.length > 0 && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={pageSize}
                onRowsPerPageChange={handleChangePageSize}
                rowsPerPageOptions={[10, 25, 50]}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>

      {/* Form Payment Modal */}
      <FormInvoicePaymentsModal
        open={openFormPaymentModal}
        onClose={() => {
          setOpenFormPaymentModal(false);
        }}
        invoiceId={invoiceId}
        onSave={() => {
          fetchPayments(); // Refresh payments
          if (onDataUpdated) {
            onDataUpdated();
          }
        }}
      />
    </Dialog>
  );
};

export default ViewInvoicePaymentsModal;
