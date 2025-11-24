import React, { useEffect, useState, useRef } from "react";
import { HotTable } from "@handsontable/react";
import { Box, Stack, TablePagination } from "@mui/material";
import api from "../../api/api";
import { dateRenderer, textRenderer } from "../../utils/handsontableRenderers";

export default function PackingListPage() {
  const hotTableRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch packing lists
  const fetchPackingLists = async () => {
    try {
      const res = await api.get("/packing-lists");
      setRows(
        res.data.map((pl) => ({
          pl_id: pl.pl_id,
          pl_number: pl.pl_number,
          pn_id: pl.project?.project_number,
          client_pic: pl.client_pic || null,
          int_pic: pl.int_pic?.name || null,
          destination: pl.destination?.destination || "",
          expedition_name: pl.expedition?.name || "",
          pl_date: pl.pl_date ? new Date(pl.pl_date) : null,
          ship_date: pl.ship_date ? new Date(pl.ship_date) : null,
          receive_date: pl.receive_date ? new Date(pl.receive_date) : null,
          pl_return_date: pl.pl_return_date
            ? new Date(pl.pl_return_date)
            : null,
          pl_type: pl.pl_type?.name || "",
          remark: pl.remark,
          created_by: pl.creator?.name || null,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackingLists();
  }, []);

  const columns = [
    {
      data: "pl_number",
      title: "PL_NO",
      readOnly: true,
      renderer: textRenderer,
    },
    { data: "pn_id", title: "PNID", readOnly: true, renderer: textRenderer },
    {
      data: "destination",
      title: "DESTINATION",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "expedition_name",
      title: "EXPEDITION",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "pl_type",
      title: "PL_TYPE",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "pl_date",
      title: "PL_DATE",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "ship_date",
      title: "SHIP_DATE",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "receive_date",
      title: "RECEIVE_DATE",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "pl_return_date",
      title: "PL_RETURN_DATE",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "int_pic",
      title: "INT_PIC",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "client_pic",
      title: "CLIENT_PIC",
      readOnly: true,
      renderer: textRenderer,
    },
    { data: "remark", title: "REMARK", readOnly: true, renderer: textRenderer },
    {
      data: "created_by",
      title: "CREATED_BY",
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

  const paginatedData = rows.slice(page * pageSize, page * pageSize + pageSize);

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2} p={2}>
        {/* Removed Add Packing List button and modal */}

        {/* Handsontable */}
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
              fixedColumnsLeft={3}
              stretchH="all"
              filters
              dropdownMenu
              className="ht-theme-horizon"
              manualColumnMove
            />
          </div>
        </div>

        {/* Pagination */}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangePageSize}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Box>
      </Stack>
    </Box>
  );
}
