import React, { useState, useRef, useEffect } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TablePagination,
  TextField,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatDate } from "../../utils/FormatDate";
import { filterBySearch } from "../../utils/filter";

const ViewMrOverdueModal = ({ open, onClose, data }) => {
  const hotTableRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const textRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    td.style.color = "black";
    return td;
  };

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value?.name || "-";
    return td;
  };

  const columns = [
    {
      data: "material_number",
      title: "Material Number",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "material_description",
      title: "Description",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "created_at",
      title: "Created At",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "creator",
      title: "Created By",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.name || "-";
        return td;
      },
    },
    {
      data: "mr_handover",
      title: "Handover To",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.name || "-";
        return td;
      },
    },
    {
      data: "target_date",
      title: "Target Date",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "material_status",
      title: "Status",
      readOnly: true,
      renderer: statusRenderer,
    },
    {
      data: "remark",
      title: "Remark",
      readOnly: true,
      renderer: textRenderer,
    },
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset page to 0 when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const filteredData = filterBySearch(data, searchTerm);
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );
  const tableHeight = Math.min(pageSize * 50 + 50, 600);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        MR Overdue ({data.length} items)
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <TextField
            size="small"
            placeholder="Search MR overdue..."
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
              rowHeights={50}
              autoRowSize={false}
            />
          </div>
        </div>
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangePageSize}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewMrOverdueModal;
