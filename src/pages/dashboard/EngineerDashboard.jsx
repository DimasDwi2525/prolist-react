import React, { useEffect, useState, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  FaProjectDiagram,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChartPie,
  FaChartLine,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api/api";
import { clearAuth } from "../../utils/storage";
import LoadingScreen from "../../components/loading/loadingScreen";
import { FaUsersCog, FaCalendarAlt } from "react-icons/fa";
import { formatDate } from "../../utils/FormatDate";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import Echo from "../../echo";

const dateRenderer = (instance, td, row, col, prop, value) => {
  td.innerText = formatDate(value);
  return td;
};

const DashboardCard = ({ title, value, color, icon, onViewClick }) => {
  const displayValue = value === 0 ? "No data" : value || "No data available";
  return (
    <div
      className={`bg-white shadow rounded-xl p-3 sm:p-4 lg:p-5 xl:p-6 2xl:p-7 flex flex-col justify-center kpi-card cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={onViewClick}
    >
      {/* Value + Icon */}
      <div className="flex items-center justify-between">
        <div
          className={`font-bold ${color.text} kpi-value text-lg lg:text-xl xl:text-2xl 2xl:text-3xl`}
        >
          {displayValue}
        </div>
        <div className={`${color.bg} p-2 sm:p-3 lg:p-4 2xl:p-5 rounded-lg`}>
          {React.cloneElement(icon, {
            size: window.innerWidth > 2500 ? 36 : 28,
            className: "icon-size",
          })}
        </div>
      </div>

      {/* Title */}
      <p className="mt-3 text-gray-600 kpi-title text-sm lg:text-base xl:text-lg 2xl:text-xl">
        {title}
      </p>
    </div>
  );
};

export default function EngineerDashboard() {
  const [stats, setStats] = useState(null);
  const [workOrdersThisMonth, setWorkOrdersThisMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalColumns, setModalColumns] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const renderCharts = useCallback((data) => {
    if (lineChartRef.current) lineChartRef.current.destroy();
    if (pieChartRef.current) pieChartRef.current.destroy();

    // Line Chart Completion Trend
    lineChartRef.current = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: data.months,
        datasets: [
          {
            label: "On Time",
            font: {
              size: window.innerWidth > 2500 ? 18 : 12, // auto-scale
            },
            data: data.onTimeProjects,
            borderColor: "#10b981",
            fill: true,
            backgroundColor: "rgba(16,185,129,0.1)",
          },
          {
            label: "Late",
            font: {
              size: window.innerWidth > 2500 ? 18 : 12, // auto-scale
            },
            data: data.lateProjects,
            borderColor: "#ef4444",
            fill: true,
            backgroundColor: "rgba(239,68,68,0.1)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
      scales: {
        x: {
          ticks: {
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
        y: {
          ticks: {
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
      },
    });

    // Pie Chart Status Distribution
    pieChartRef.current = new Chart(document.getElementById("statusPie"), {
      type: "pie",
      data: {
        labels: [
          "Overdue",
          "Project One Month Out (OMO)",
          "Project On Track (OTP)",
        ],
        font: {
          size: window.innerWidth > 2500 ? 18 : 12, // auto-scale
        },
        datasets: [
          {
            data: data.statusCounts,
            backgroundColor: ["#ef4444", "#fbbf24", "#10b981"],
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: "right" } } },
      scales: {
        x: {
          ticks: {
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
        y: {
          ticks: {
            font: { size: window.innerWidth > 2500 ? 16 : 12 },
          },
        },
      },
    });
  }, []);

  const fetchDashboardData = useCallback(() => {
    api
      .get("/engineer/dashboard")
      .then((res) => {
        setStats(res.data);
        setWorkOrdersThisMonth(res.data.workOrdersThisMonth || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ API error:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          clearAuth();
          toast.error("Session expired. Please log in again.");
          window.location.href = "/login";
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const channel = Echo.channel("engineer.dashboard.updated");
    channel.listen(".dashboard.updated", (e) => {
      console.log("Dashboard updated event received:", e);
      fetchDashboardData();
    });

    return () => {
      channel.stopListening(".dashboard.updated");
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    if (stats) renderCharts(stats);

    return () => {
      if (lineChartRef.current) lineChartRef.current.destroy();
      if (pieChartRef.current) pieChartRef.current.destroy();
    };
  }, [stats, renderCharts]);

  if (loading || !stats) return <LoadingScreen />;

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
        { data: "delay_days", title: "Delay (days)" },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("Overdue Projects");
    } else if (type === "dueThisMonth") {
      setModalData(stats.projectDueThisMonthList);
      setModalColumns([
        { data: "project_number", title: "Project Number" },
        { data: "project_name", title: "Project Name" },
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
      setModalTitle("Overdue Projects");
    } else if (type === "onTrack") {
      setModalData(stats.projectOnTrackList);
      setModalColumns([
        { data: "project_number", title: "Project Number" },
        { data: "project_name", title: "Project Name" },
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
      setModalTitle("On Track Projects");
    } else if (type === "workOrders") {
      setModalData(workOrdersThisMonth.slice(0, 10));
      setModalColumns([
        {
          data: "wo_kode_no",
          title: "WO Code",
          type: "text",
          editor: false,
          width: 120,
        },
        {
          data: "wo_date",
          title: "WO Date",
          type: "date",
          dateFormat: "YYYY-MM-DD",
          editor: false,
          width: 100,
          renderer: dateRenderer,
        },
        {
          data: "project_name",
          title: "Project Name",
          type: "text",
          editor: false,
          width: 150,
        },
        {
          data: "client_name",
          title: "Client Name",
          type: "text",
          editor: false,
          width: 150,
        },
        {
          data: "created_by",
          title: "Created By",
          type: "text",
          editor: false,
          width: 100,
        },
        {
          data: "pic_names",
          title: "PIC Names",
          type: "text",
          editor: false,
          width: 120,
        },
      ]);
      setModalTitle("Work Orders This Month");
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
      color: { bg: "bg-red-100", text: "text-red-600" },
      icon: <FaExclamationTriangle size={22} />,
      onViewClick: () => handleViewClick("overdue"),
    },
    {
      title: "Project One Month Out (OMO)",
      value: stats.projectDueThisMonth,
      color: { bg: "bg-yellow-100", text: "text-yellow-600" },
      icon: <FaClock size={22} />,
      onViewClick: () => handleViewClick("dueThisMonth"),
    },
    {
      title: "Project On Track (OTP)",
      value: stats.projectOnTrack,
      color: { bg: "bg-purple-100", text: "text-purple-600" },
      icon: <FaCheckCircle size={22} />,
      onViewClick: () => handleViewClick("onTrack"),
    },
    {
      title: "Total Open Project (TOP)",
      value: stats.totalOutstandingProjects,
      color: { bg: "bg-orange-100", text: "text-orange-600" },
      icon: <FaProjectDiagram size={22} />,
    },
  ];

  return (
    <div className="w-full p-4 lg:p-6 space-y-8 bg-gray-50">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((c, i) => (
          <DashboardCard key={i} {...c} />
        ))}
      </div>

      {/* Chart */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8
                    h-auto lg:h-[30vh] 2xl:h-[40vh]"
      >
        <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[250px] 2xl:min-h-[350px]">
          <h2 className="text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold">
            <FaChartPie className="text-purple-500" /> Open Project Status
          </h2>
          <canvas id="statusPie" className="flex-1"></canvas>
        </div>
      </div>
      {/* Utilization + Top 5 */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[300px]">
          <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
            <FaProjectDiagram className="text-blue-500" /> Project Overdue
          </h2>
          {stats.top5Overdue.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">
              No overdue projects.
            </p>
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
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      renderer: (instance, td, row, col, prop, value) => {
                        td.innerText = value || "-";
                        return td;
                      },
                    },
                    { data: "pic", type: "text", editor: false },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      editor: false,
                      renderer: (instance, td, row, col, prop, value) => {
                        const displayValue = value ? formatDate(value) : "";
                        td.innerHTML = displayValue;
                        return td;
                      },
                    },
                    { data: "delay_days", type: "numeric", editor: false },
                    { data: "status", type: "text", editor: false },
                  ]}
                  stretchH="all"
                  height={calculateTableHeight(
                    stats.top5Overdue.length,
                    200,
                    400
                  )}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Upcoming Projects */}
      <div className="bg-white shadow rounded-xl p-6 flex flex-col min-h-[200px]">
        <h2 className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <FaCalendarAlt className="text-indigo-500" /> Target Project Less Than
          1 Month
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
                    { data: "project_number", type: "text" },
                    { data: "project_name", type: "text" },
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      renderer: (instance, td, row, col, prop, value) => {
                        td.innerText = value || "-";
                        return td;
                      },
                    },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      renderer: (instance, td, row, col, prop, value) => {
                        const displayValue = value ? formatDate(value) : "";
                        td.innerHTML = displayValue;
                        return td;
                      },
                    },
                    { data: "status", type: "text" },
                  ]}
                  stretchH="all"
                  height={calculateTableHeight(
                    stats.upcomingProjects.length,
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
          )}
        </Box>
      </Modal>
    </div>
  );
}
