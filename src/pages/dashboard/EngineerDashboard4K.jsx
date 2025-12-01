import React, { useEffect, useState, useCallback, useRef } from "react";
import Chart from "chart.js/auto";
import Highcharts from "highcharts";
import {
  FaProjectDiagram,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChartPie,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../api/api";
import { clearAuth } from "../../utils/storage";
import LoadingScreen from "../../components/loading/loadingScreen";
import { FaUsersCog, FaCalendarAlt } from "react-icons/fa";
import { formatDate } from "../../utils/FormatDate";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { Close, Visibility } from "@mui/icons-material";
import { HotTable } from "@handsontable/react";
import Handsontable from "../../handsontable.config";
// import Echo from "../../echo";

const dateRenderer = (instance, td, row, col, prop, value) => {
  td.innerText = formatDate(value);
  td.style.fontSize = "54px";
  td.style.textAlign = "center";
  td.style.verticalAlign = "middle";
  return td;
};

const textRenderer = (instance, td, row, col, prop, value) => {
  td.innerText = value || "-";
  td.style.fontSize = "54px";
  td.style.textAlign = "center";
  td.style.verticalAlign = "middle";
  return td;
};

const logRenderer = (instance, td, row, col, prop, value) => {
  td.style.overflow = "visible";
  td.innerHTML = `<div style="font-size: 54px; text-align: left; vertical-align: top; white-space: normal; word-wrap: break-word; overflow-wrap: break-word; padding: 10px; line-height: 1.2;">${
    value || "-"
  }</div>`;
  return td;
};

const createHeader = (text) => {
  return `<div style="font-size: 64px; font-weight: bold; text-align: center; height: 120px; display: flex; align-items: center; justify-content: center;">${text}</div>`;
};

const DashboardCard = ({ title, value, color, onViewClick }) => {
  const displayValue = value === 0 ? "No data" : value || "No data available";
  return (
    <div
      className="shadow rounded-xl p-6 lg:p-8 xl:p-10 2xl:p-12 3xl:p-16 flex flex-col justify-center items-center kpi-card relative hover:shadow-lg transition-shadow duration-300 h-64 lg:h-80 xl:h-96 2xl:h-[28rem] 3xl:h-[32rem]"
      style={{ backgroundColor: color.bgColor }}
    >
      {/* Value */}
      <div className="flex items-center justify-center flex-1">
        <div
          className="font-bold kpi-value"
          style={{ color: color.textColor, fontSize: "64px" }}
        >
          {displayValue}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-center flex-1">
        <p
          className="kpi-title text-center"
          style={{
            color: color.textColor,
            fontSize: "64px",
            lineHeight: "1.2",
          }}
        >
          {title}
        </p>
      </div>

      {/* View Button */}
      {onViewClick && (
        <IconButton
          onClick={onViewClick}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: color.textColor,
            "&:hover": { color: color.textColor, opacity: 0.8 },
          }}
        >
          <Visibility fontSize="large" />
        </IconButton>
      )}
    </div>
  );
};

export default function EngineerDashboard4K() {
  const [stats, setStats] = useState(null);
  const [workOrdersThisMonth, setWorkOrdersThisMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalColumns, setModalColumns] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;
  const [currentPageOverdue, setCurrentPageOverdue] = useState(0);
  const [currentPageUpcoming, setCurrentPageUpcoming] = useState(0);
  const [currentPageDueThisMonth, setCurrentPageDueThisMonth] = useState(0);

  const [overduePages, setOverduePages] = useState([]);
  const [dueThisMonthPages, setDueThisMonthPages] = useState([]);
  const [onTrackPages, setOnTrackPages] = useState([]);
  const overdueTableRef = useRef(null);
  const dueThisMonthTableRef = useRef(null);
  const onTrackTableRef = useRef(null);
  const availableHeight = window.innerHeight - 100; // Estimate for 4K minus headers

  const calculatePages = useCallback(
    (data) => {
      if (!data || data.length === 0) return [data];
      const pages = [];
      let currentPage = [];
      let currentHeight = 0;
      data.forEach((row) => {
        const logLength = row.latest_log ? row.latest_log.length : 0;
        const estimatedRowHeight = 120 + Math.floor(logLength / 50) * 10; // Base 120px + 10px per 50 chars
        if (currentHeight + estimatedRowHeight > availableHeight) {
          pages.push(currentPage);
          currentPage = [row];
          currentHeight = estimatedRowHeight;
        } else {
          currentPage.push(row);
          currentHeight += estimatedRowHeight;
        }
      });
      if (currentPage.length > 0) pages.push(currentPage);
      return pages;
    },
    [availableHeight]
  );

  const renderCharts = useCallback((data) => {
    // Destroy existing pie chart if it exists
    const pieCanvas = document.getElementById("statusPie");

    if (pieCanvas) {
      const existingPieChart = Chart.getChart(pieCanvas);
      if (existingPieChart) {
        existingPieChart.destroy();
      }
    }

    // Pie Chart Status Distribution using Highcharts
    Highcharts.chart("statusPie", {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        spacing: 20,
      },
      title: {
        text: null,
        style: {
          fontSize: "64px",
          fontWeight: "bold",
        },
      },
      tooltip: {
        pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
        style: { fontSize: "42px" },
      },
      plotOptions: {
        pie: {
          borderWidth: 0,
          allowPointSelect: true,
          cursor: "pointer",
        },
      },
      series: [
        // INNER PIE — persentase di dalam
        {
          name: "Percentage",
          size: "60%", // ukuran inner pie
          dataLabels: {
            enabled: true,
            distance: -40,
            format: "{point.y}",
            style: {
              fontSize: "64px",
              fontWeight: "bold",
              color: "white",
              textOutline: "none",
            },
          },
          data: [
            {
              name: "Project Overdue",
              y: data.statusCounts[0],
              color: "#ef4444",
            },
            {
              name: "Project One Month Out (OMO)",
              y: data.statusCounts[1],
              color: "#fbbf24",
            },
            {
              name: "Project On Track (OTP)",
              y: data.statusCounts[2],
              color: "#10b981",
            },
          ],
        },

        // OUTER PIE — label dan connector di luar
        {
          name: "Status",
          size: "100%", // full pie
          innerSize: "60%", // biar jadi layer luar
          dataLabels: {
            enabled: true,
            distance: 100,
            connectorColor: "#000000",
            connectorWidth: 10,
            format: "<b>{point.name}</b>",
            style: {
              fontSize: "64px",
              fontWeight: "500",
              color: "black",
              textOutline: "none",
            },
          },
          data: [
            {
              name: "Project Overdue",
              y: data.statusCounts[0],
              color: "#ef4444",
            },
            {
              name: "Project One Month Out (OMO)",
              y: data.statusCounts[1],
              color: "#fbbf24",
            },
            {
              name: "Project On Track (OTP)",
              y: data.statusCounts[2],
              color: "#10b981",
            },
          ],
        },
      ],
      credits: { enabled: false },
    });
  }, []);

  const fetchDashboardData = useCallback(() => {
    api
      .get("/engineer/dashboard4k")
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

  // useEffect(() => {
  //   const channel = Echo.channel("engineer.dashboard.updated");
  //   channel.listen(".dashboard.updated", (e) => {
  //     console.log("Dashboard updated event received:", e);
  //     fetchDashboardData();
  //   });

  //   return () => {
  //     channel.stopListening(".dashboard.updated");
  //   };
  // }, [fetchDashboardData]);

  useEffect(() => {
    if (stats && currentSlide === 0) renderCharts(stats);
  }, [stats, renderCharts, currentSlide]);

  useEffect(() => {
    let interval;
    if (currentSlide === 0) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 15000); // 10 seconds for slide 0
    } else if (currentSlide === 1) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, (overduePages.length || 1) * 5000);
    } else if (currentSlide === 2) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, (dueThisMonthPages.length || 1) * 5000);
    } else if (currentSlide === 3) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, (onTrackPages.length || 1) * 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    currentSlide,
    totalSlides,
    overduePages.length,
    dueThisMonthPages.length,
    onTrackPages.length,
  ]);

  useEffect(() => {
    if (stats?.top5Overdue) {
      const pages = calculatePages(stats.top5Overdue);
      setOverduePages(pages);
      setCurrentPageOverdue(0);
    }
  }, [stats?.top5Overdue, calculatePages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPageOverdue((prev) => (prev + 1) % (overduePages.length || 1));
    }, 5000); // Auto-page every 5 seconds for overdue
    return () => clearInterval(interval);
  }, [overduePages.length]);

  useEffect(() => {
    if (stats?.projectOnTrackList) {
      const pages = calculatePages(stats.projectOnTrackList);
      setOnTrackPages(pages);
      setCurrentPageUpcoming(0);
    }
  }, [stats?.projectOnTrackList, calculatePages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPageUpcoming((prev) => (prev + 1) % (onTrackPages.length || 1));
    }, 5000); // Auto-page every 5 seconds for upcoming
    return () => clearInterval(interval);
  }, [onTrackPages.length]);

  useEffect(() => {
    if (stats?.projectDueThisMonthList) {
      const pages = calculatePages(stats.projectDueThisMonthList);
      setDueThisMonthPages(pages);
      setCurrentPageDueThisMonth(0);
    }
  }, [stats?.projectDueThisMonthList, calculatePages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPageDueThisMonth(
        (prev) => (prev + 1) % (dueThisMonthPages.length || 1)
      );
    }, 5000); // Auto-page every 5 seconds for due this month
    return () => clearInterval(interval);
  }, [dueThisMonthPages.length]);

  // Auto-refresh data at midnight every day
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set to next midnight

    const timeUntilMidnight = midnight - now;

    const timeout = setTimeout(() => {
      fetchDashboardData();
      // Set up daily refresh
      const dailyInterval = setInterval(() => {
        fetchDashboardData();
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, [fetchDashboardData]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  if (loading || !stats) return <LoadingScreen />;

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
          width: 160,
        },
        {
          data: "wo_date",
          title: "WO Date",
          type: "date",
          dateFormat: "YYYY-MM-DD",
          editor: false,
          width: 140,
          renderer: dateRenderer,
        },
        {
          data: "project_name",
          title: "Project Name",
          type: "text",
          editor: false,
          width: 200,
        },
        {
          data: "client_name",
          title: "Client Name",
          type: "text",
          editor: false,
          width: 200,
        },
        {
          data: "created_by",
          title: "Created By",
          type: "text",
          editor: false,
          width: 140,
        },
        {
          data: "pic_names",
          title: "PIC Names",
          type: "text",
          editor: false,
          width: 160,
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
      color: { bgColor: "#ef4444", textColor: "#ffffff" },
      onViewClick: () => handleViewClick("overdue"),
    },
    {
      title: "Project One Month Out (OMO)",
      value: stats.projectDueThisMonth,
      color: { bgColor: "#fbbf24", textColor: "#000000" },
      onViewClick: () => handleViewClick("dueThisMonth"),
    },
    {
      title: "Project On Track (OTP)",
      value: stats.projectOnTrack,
      color: { bgColor: "#10b981", textColor: "#ffffff" },
      onViewClick: () => handleViewClick("onTrack"),
    },
    {
      title: "Total Open Project",
      value: stats.totalOutstandingProjects,
      color: { bgColor: "#0074A8", textColor: "#ffffff" },
    },
  ];

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-300"
      >
        <FaChevronLeft size={32} className="text-gray-600" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-300"
      >
        <FaChevronRight size={32} className="text-gray-600" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentSlide ? "bg-blue-500" : "bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Carousel Slides */}
      {currentSlide === 0 && (
        <div className="flex-1 flex flex-col p-4">
          {/* KPI Cards */}
          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((c, i) => (
                <DashboardCard key={i} {...c} />
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="flex-1 grid grid-cols-1 gap-4">
            <div className="bg-gradient-to-br from-white to-gray-100 shadow rounded-xl p-8 flex flex-col">
              <h2
                className="font-semibold mb-4 flex-shrink-0 text-gray-800"
                style={{ fontSize: "64px" }}
              >
                <FaChartPie className="text-gray-800" /> Open Project Status
              </h2>
              <div className="flex-1 flex justify-center items-center">
                <div id="statusPie" className="w-full h-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentSlide === 1 && (
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Project Overdue */}
          <div className="bg-white shadow rounded-xl p-4 flex flex-col flex-1">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl font-semibold mb-4 flex items-center gap-4">
              <FaProjectDiagram className="text-red-500" /> Project Overdue
            </h2>
            {stats.top5Overdue.length === 0 ? (
              <p className="text-center text-gray-500 flex-1 flex items-center justify-center text-2xl">
                No overdue projects.
              </p>
            ) : (
              <div
                className="flex-1"
                style={{ marginTop: "20px", overflowX: "hidden" }}
              >
                <HotTable
                  ref={overdueTableRef}
                  data={overduePages[currentPageOverdue] || []}
                  colHeaders={[
                    createHeader("Project Number"),
                    createHeader("Project Name"),
                    createHeader("Client Name"),
                    createHeader("PIC"),
                    createHeader("Target Date"),
                    createHeader("Latest Log"),
                  ]}
                  columns={[
                    { data: "project_number", renderer: textRenderer },
                    { data: "project_name", renderer: textRenderer },
                    { data: "client_name", renderer: textRenderer },
                    { data: "pic", renderer: textRenderer },
                    { data: "target_dates", renderer: dateRenderer },
                    { data: "latest_log", renderer: logRenderer, width: 600 },
                  ]}
                  height="auto"
                  stretchH="all"
                  manualColumnResize={false}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                  rowHeights="auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {currentSlide === 2 && (
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Target Project Due Less Than 1 Month */}
          <div className="bg-white shadow rounded-xl p-4 flex flex-col flex-1">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl font-semibold mb-4 flex items-center gap-4">
              <FaClock className="text-yellow-500" /> Project One Month Out
              (OMO)
            </h2>
            {stats.projectDueThisMonthList.length === 0 ? (
              <p className="text-center text-gray-500 flex-1 flex items-center justify-center text-2xl">
                No projects due in less than 1 month.
              </p>
            ) : (
              <div
                className="flex-1"
                style={{ marginTop: "20px", overflowX: "hidden" }}
              >
                <HotTable
                  ref={dueThisMonthTableRef}
                  data={dueThisMonthPages[currentPageDueThisMonth] || []}
                  colHeaders={[
                    createHeader("Project Number"),
                    createHeader("Project Name"),
                    createHeader("Client Name"),
                    createHeader("PIC"),
                    createHeader("Target Date"),
                    createHeader("Latest Log"),
                  ]}
                  columns={[
                    { data: "project_number", renderer: textRenderer },
                    { data: "project_name", renderer: textRenderer },
                    { data: "client_name", renderer: textRenderer },
                    { data: "pic", renderer: textRenderer },
                    { data: "target_dates", renderer: dateRenderer },
                    { data: "latest_log", renderer: logRenderer, width: 600 },
                  ]}
                  height="auto"
                  stretchH="all"
                  manualColumnResize={false}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                  rowHeights="auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {currentSlide === 3 && (
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Target Project Due Greater Than 1 Month */}
          <div className="bg-white shadow rounded-xl p-4 flex flex-col flex-1">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl font-semibold mb-4 flex items-center gap-4">
              <FaCalendarAlt className="text-indigo-500" /> Project On Track
              (OTP)
            </h2>
            {stats.projectOnTrackList.length === 0 ? (
              <p className="text-center text-gray-500 flex-1 flex items-center justify-center text-2xl">
                No projects in the next 30 days.
              </p>
            ) : (
              <div
                className="flex-1"
                style={{ marginTop: "20px", overflowX: "hidden" }}
              >
                <HotTable
                  ref={onTrackTableRef}
                  data={onTrackPages[currentPageUpcoming] || []}
                  colHeaders={[
                    createHeader("Project Number"),
                    createHeader("Project Name"),
                    createHeader("Client Name"),
                    createHeader("PIC"),
                    createHeader("Target Date"),
                    createHeader("Latest Log"),
                  ]}
                  columns={[
                    { data: "project_number", renderer: textRenderer },
                    { data: "project_name", renderer: textRenderer },
                    { data: "client_name", renderer: textRenderer },
                    { data: "pic", renderer: textRenderer },
                    { data: "target_dates", renderer: dateRenderer },
                    { data: "latest_log", renderer: logRenderer, width: 600 },
                  ]}
                  height="auto"
                  stretchH="all"
                  manualColumnResize={false}
                  licenseKey="non-commercial-and-evaluation"
                  className="ht-theme-horizon"
                  rowHeights="auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

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
            width: "95%",
            maxWidth: 1600,
            maxHeight: "85%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 6,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Typography id="modal-title" variant="h5" component="h2">
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
            <div className="table-wrapper" style={{ height: "100%" }}>
              <div className="table-inner">
                <HotTable
                  data={modalData}
                  colHeaders={modalColumns.map((c) => c.title)}
                  columns={modalColumns}
                  height="auto"
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
