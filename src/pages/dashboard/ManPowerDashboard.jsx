import React, { useEffect, useState } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  FaProjectDiagram,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";
import api from "../../api/api";
import LoadingScreen from "../../components/loading/loadingScreen";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { formatDate } from "../../utils/FormatDate";
import {
  dateRenderer,
  statusRenderer,
} from "../../utils/handsontableRenderers";

const DashboardCard = ({ title, value, color, icon, onViewClick }) => {
  const displayValue = value === 0 ? "No data" : value || "No data available";
  return (
    <div
      className="shadow rounded-xl p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-10 flex flex-col justify-center kpi-card cursor-pointer hover:shadow-lg transition-shadow"
      style={{ backgroundColor: color.bgColor }}
      onClick={onViewClick}
    >
      {/* Value + Icon */}
      <div className="flex items-center justify-between">
        <div
          className="font-bold kpi-value text-lg lg:text-xl xl:text-2xl 2xl:text-3xl"
          style={{ color: color.textColor }}
        >
          {displayValue}
        </div>
        <div
          className="p-2 sm:p-3 lg:p-4 2xl:p-5 rounded-lg"
          style={{ color: color.textColor }}
        >
          {React.cloneElement(icon, {
            size: window.innerWidth > 2500 ? 36 : 28,
            className: "icon-size",
          })}
        </div>
      </div>

      {/* Title */}
      <p
        className="mt-3 kpi-title text-sm lg:text-base xl:text-lg 2xl:text-xl"
        style={{ color: color.textColor }}
      >
        {title}
      </p>
    </div>
  );
};

export default function ManPowerDashboard() {
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalColumns, setModalColumns] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    api
      .get("/man-power/dashboard")
      .then((res) => {
        setStats(res.data);

        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ API error:", err.response?.data || err.message);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) return <LoadingScreen />;

  const tableHeight = window.innerWidth > 2500 ? 400 : 200;
  const largeTableHeight = window.innerWidth > 2500 ? 500 : 300;

  const calculateTableHeight = (
    dataLength,
    minHeight = 200,
    maxHeight = 400
  ) => {
    const rowHeight = 30; // Approximate height per row
    const calculatedHeight = minHeight + dataLength * rowHeight;
    return Math.min(calculatedHeight, maxHeight);
  };

  const handleViewClick = (type) => {
    if (type === "overdue") {
      setModalData(stats.top5Overdue);
      setModalColumns([
        { data: "project_number", title: "Project Number" },
        { data: "project_name", title: "Project Name" },
        { data: "client_name", title: "Client Name" },
        { data: "pic", title: "PIC" },
        {
          data: "target_dates",
          title: "Target Date",
          renderer: dateRenderer,
        },
        { data: "delay_days", title: "Delay (days)" },
        { data: "status", title: "Status", renderer: statusRenderer },
      ]);
      setModalTitle("Project Overdue (POV)");
    } else if (type === "dueThisMonth") {
      setModalData(stats.projectDueThisMonthList);
      setModalColumns([
        { data: "project_number", title: "Project Number" },
        { data: "project_name", title: "Project Name" },
        { data: "client_name", title: "Client Name" },
        { data: "pic", title: "PIC" },
        {
          data: "target_dates",
          title: "Target Date",
          renderer: (instance, td, row, col, prop, value) => {
            const displayValue = value ? formatDate(value) : "";
            td.innerHTML = displayValue;
            return td;
          },
        },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("Project One Month Out (OMO)");
    } else if (type === "onTrack") {
      setModalData(stats.projectOnTrackList);
      setModalColumns([
        { data: "project_number", title: "Project Number" },
        { data: "project_name", title: "Project Name" },
        { data: "client_name", title: "Client Name" },
        { data: "pic", title: "PIC" },
        {
          data: "target_dates",
          title: "Target Date",
          renderer: (instance, td, row, col, prop, value) => {
            const displayValue = value ? formatDate(value) : "";
            td.innerHTML = displayValue;
            return td;
          },
        },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("On Track Projects (OTP)");
    } else if (type === "totalActive") {
      setModalData(
        stats.projectOnTrackList.concat(
          stats.projectDueThisMonthList,
          stats.top5Overdue
        )
      );
      setModalColumns([
        { data: "project_number", title: "Project Number" },
        { data: "project_name", title: "Project Name" },
        { data: "client_name", title: "Client Name" },
        { data: "pic", title: "PIC" },
        {
          data: "target_dates",
          title: "Target Date",
          renderer: (instance, td, row, col, prop, value) => {
            const displayValue = value ? formatDate(value) : "";
            td.innerHTML = displayValue;
            return td;
          },
        },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("Total Open Projects");
    } else {
      setModalData([]);
      setModalColumns([]);
      setModalTitle("Data Not Available");
    }
    setModalOpen(true);
  };

  const cards = [
    {
      title: "Project Overdue (POV)",
      value: stats.projectOverdue,
      color: { bgColor: "#ef4444", textColor: "#ffffff" },
      icon: <FaExclamationTriangle size={22} />,
      onViewClick: () => handleViewClick("overdue"),
    },
    {
      title: "Project One Month Out (OMO)",
      value: stats.projectDueThisMonth,
      color: { bgColor: "#fbbf24", textColor: "#000000" },
      icon: <FaClock size={22} />,
      onViewClick: () => handleViewClick("dueThisMonth"),
    },
    {
      title: "Project On Track (OTP)",
      value: stats.projectOnTrack,
      color: { bgColor: "#10b981", textColor: "#ffffff" },
      icon: <FaCheckCircle size={22} />,
      onViewClick: () => handleViewClick("onTrack"),
    },
    {
      title: "Total Open Projects (TOP)",
      value: stats.totalActiveProjects,
      color: { bgColor: "#0074A8", textColor: "#ffffff" },
      icon: <FaProjectDiagram size={22} />,
      onViewClick: () => handleViewClick("totalActive"),
    },
  ];

  return (
    <div className="w-full p-4 lg:p-6 space-y-16 bg-gray-50">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((c, i) => (
          <DashboardCard key={i} {...c} />
        ))}
      </div>

      {/* Top 5 Overdue Projects */}
      <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[300px]">
        <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <FaProjectDiagram className="text-blue-500" /> Project Overdue (POV)
        </h2>
        {stats.top5Overdue.length === 0 ? (
          <p className="text-center text-gray-500 mt-4">No overdue projects.</p>
        ) : (
          <div className="table-wrapper">
            <div className="table-inner">
              <HotTable
                data={stats.top5Overdue}
                colHeaders={[
                  "Project Number",
                  "Project Name",
                  "Client Name",
                  "PIC",
                  "Target Date",
                  "Delay (days)",
                  "Status",
                ]}
                columns={[
                  { data: "project_number", type: "text", editor: false },
                  { data: "project_name", type: "text", editor: false },
                  { data: "client_name", type: "text", editor: false },
                  { data: "pic", type: "text", editor: false },
                  {
                    data: "target_dates",
                    type: "date",
                    dateFormat: "YYYY-MM-DD",
                    editor: false,
                    renderer: dateRenderer,
                  },
                  { data: "delay_days", type: "numeric", editor: false },
                  { data: "status", type: "text", editor: false },
                ]}
                stretchH="all"
                height={largeTableHeight}
                licenseKey="non-commercial-and-evaluation"
                className="ht-theme-horizon"
              />
            </div>
          </div>
        )}
      </div>
      {/* Project One Month Out */}
      <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[200px]">
        <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <FaClock className="text-yellow-500" /> Project One Month Out (OMO)
        </h2>
        <div className="flex-1 mt-4">
          {stats.projectDueThisMonthList.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">
              No projects due this month.
            </p>
          ) : (
            <div className="table-wrapper">
              <div className="table-inner">
                <HotTable
                  data={stats.projectDueThisMonthList}
                  colHeaders={[
                    "Project Number",
                    "Project Name",
                    "Client Name",
                    "PIC",
                    "Target Date",
                    "Status",
                  ]}
                  columns={[
                    { data: "project_number", type: "text", editor: false },
                    { data: "project_name", type: "text", editor: false },
                    { data: "client_name", type: "text", editor: false },
                    { data: "pic", type: "text", editor: false },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      editor: false,
                      renderer: dateRenderer,
                    },
                    { data: "status", type: "text", editor: false },
                  ]}
                  stretchH="all"
                  height={calculateTableHeight(
                    stats.projectDueThisMonthList.length,
                    200,
                    400
                  )}
                  className="ht-theme-horizon"
                  licenseKey="non-commercial-and-evaluation"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Upcoming Projects */}
      <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[200px]">
        <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <FaCalendarAlt className="text-indigo-500" /> Project On Track (OTP)
        </h2>
        <div className="flex-1 mt-4">
          {stats.upcomingProjects.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">
              No upcoming projects in the next 30 days.
            </p>
          ) : (
            <div className="table-wrapper">
              <div className="table-inner">
                <HotTable
                  data={stats.upcomingProjects}
                  colHeaders={[
                    "Project Number",
                    "Project Name",
                    "Client Name",
                    "Target Date",
                    "Status",
                  ]}
                  columns={[
                    { data: "project_number", type: "text", editor: false },
                    { data: "project_name", type: "text", editor: false },
                    { data: "client_name", type: "text", editor: false },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      renderer: dateRenderer,
                      editor: false,
                    },
                    {
                      data: "status",
                      type: "text",
                      editor: false,
                      renderer: statusRenderer,
                    },
                  ]}
                  stretchH="all"
                  height={tableHeight}
                  className="ht-theme-horizon"
                  licenseKey="non-commercial-and-evaluation"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 1200,
            maxHeight: "80%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
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
            <Typography id="modal-title" variant="h6" component="h2">
              {modalTitle}
            </Typography>
            <IconButton onClick={() => setModalOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          {modalData.length === 0 ? (
            <Typography
              id="modal-description"
              textAlign="center"
              color="textSecondary"
            >
              No data available for this category. Please check the Projects or
              Work Orders page for full details.
            </Typography>
          ) : (
            <div
              className="table-wrapper"
              style={{ overflow: "auto", height: "100%" }}
            >
              <div className="table-inner">
                <HotTable
                  data={modalData}
                  colHeaders={modalColumns.map((c) => c.title)}
                  columns={modalColumns}
                  height={500}
                  stretchH="all"
                  manualColumnResize={true}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                />
              </div>
            </div>
          )}
        </Box>
      </Modal>
    </div>
  );
}
