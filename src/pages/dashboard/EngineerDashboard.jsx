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
import {
  dateRenderer,
  textRenderer,
  statusRenderer,
} from "../../utils/handsontableRenderers";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
// import Echo from "../../echo";
import { formatDate } from "../../utils/FormatDate";
import ViewProjectsModal from "../../components/modal/ViewProjectsModal";

// Removed inline dateRenderer as we import from handsontableRenderers now

const DashboardCard = ({ title, value, color, icon, onViewClick }) => {
  const displayValue = value === 0 ? "No data" : value || "No data available";
  return (
    <div
      className="shadow rounded-xl p-3 sm:p-4 lg:p-5 xl:p-6 2xl:p-7 flex flex-col justify-center kpi-card cursor-pointer hover:shadow-lg transition-shadow"
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

export default function EngineerDashboard() {
  const [stats, setStats] = useState(null);
  const [workOrdersThisMonth, setWorkOrdersThisMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalColumns, setModalColumns] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [openViewProjectsModal, setOpenViewProjectsModal] = useState(false);
  const [selectedPnNumberForViewProjects, setSelectedPnNumberForViewProjects] =
    useState(null);

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
      setModalData(stats.top5Overdue.map((p) => ({ ...p, actions: "" })));
      setModalColumns([
        {
          data: "actions",
          title: "Actions",
          readOnly: true,
          width: 90,
          renderer: (instance, td, row) => {
            td.innerHTML = "";

            const wrapper = document.createElement("div");
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.gap = "6px";

            const viewBtn = document.createElement("button");
            viewBtn.style.cursor = "pointer";
            viewBtn.style.border = "none";
            viewBtn.style.background = "#e8f5e8";
            viewBtn.style.padding = "8px";
            viewBtn.style.borderRadius = "4px";
            viewBtn.style.color = "#2e7d32";
            viewBtn.style.display = "flex";
            viewBtn.style.alignItems = "center";
            viewBtn.style.justifyContent = "center";
            viewBtn.style.width = "40px";
            viewBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
            viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
            viewBtn.title = "View";
            viewBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
            viewBtn.onmouseover = () => {
              viewBtn.style.backgroundColor = "#2e7d32";
              viewBtn.style.color = "#fff";
              viewBtn.style.boxShadow = "0 2px 6px rgba(46, 125, 50, 0.3)";
              viewBtn.style.transform = "translateY(-1px)";
            };
            viewBtn.onmouseout = () => {
              viewBtn.style.backgroundColor = "#e8f5e8";
              viewBtn.style.color = "#2e7d32";
              viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
              viewBtn.style.transform = "translateY(0)";
            };

            viewBtn.onclick = () => {
              const project = instance.getSourceDataAtRow(row);
              if (project?.pn_number) {
                setSelectedPnNumberForViewProjects(project.pn_number);
                setOpenViewProjectsModal(true);
              }
            };

            wrapper.appendChild(viewBtn);
            td.appendChild(wrapper);
            return td;
          },
        },
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
        { data: "latest_log", title: "Latest Log" },
        { data: "status", title: "Status" },
      ]);
      setModalTitle("Overdue Projects");
    } else if (type === "dueThisMonth") {
      setModalData(
        stats.projectDueThisMonthList.map((p) => ({ ...p, actions: "" }))
      );
      setModalColumns([
        {
          data: "actions",
          title: "Actions",
          readOnly: true,
          width: 90,
          renderer: (instance, td, row) => {
            td.innerHTML = "";

            const wrapper = document.createElement("div");
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.gap = "6px";

            const viewBtn = document.createElement("button");
            viewBtn.style.cursor = "pointer";
            viewBtn.style.border = "none";
            viewBtn.style.background = "#e8f5e8";
            viewBtn.style.padding = "8px";
            viewBtn.style.borderRadius = "4px";
            viewBtn.style.color = "#2e7d32";
            viewBtn.style.display = "flex";
            viewBtn.style.alignItems = "center";
            viewBtn.style.justifyContent = "center";
            viewBtn.style.width = "40px";
            viewBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
            viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
            viewBtn.title = "View";
            viewBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
            viewBtn.onmouseover = () => {
              viewBtn.style.backgroundColor = "#2e7d32";
              viewBtn.style.color = "#fff";
              viewBtn.style.boxShadow = "0 2px 6px rgba(46, 125, 50, 0.3)";
              viewBtn.style.transform = "translateY(-1px)";
            };
            viewBtn.onmouseout = () => {
              viewBtn.style.backgroundColor = "#e8f5e8";
              viewBtn.style.color = "#2e7d32";
              viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
              viewBtn.style.transform = "translateY(0)";
            };

            viewBtn.onclick = () => {
              const project = instance.getSourceDataAtRow(row);
              if (project?.pn_number) {
                setSelectedPnNumberForViewProjects(project.pn_number);
                setOpenViewProjectsModal(true);
              }
            };

            wrapper.appendChild(viewBtn);
            td.appendChild(wrapper);
            return td;
          },
        },
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
      setModalTitle("Projects Due This Month");
    } else if (type === "onTrack") {
      setModalData(
        stats.projectOnTrackList.map((p) => ({ ...p, actions: "" }))
      );
      setModalColumns([
        {
          data: "actions",
          title: "Actions",
          readOnly: true,
          width: 90,
          renderer: (instance, td, row) => {
            td.innerHTML = "";

            const wrapper = document.createElement("div");
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.gap = "6px";

            const viewBtn = document.createElement("button");
            viewBtn.style.cursor = "pointer";
            viewBtn.style.border = "none";
            viewBtn.style.background = "#e8f5e8";
            viewBtn.style.padding = "8px";
            viewBtn.style.borderRadius = "4px";
            viewBtn.style.color = "#2e7d32";
            viewBtn.style.display = "flex";
            viewBtn.style.alignItems = "center";
            viewBtn.style.justifyContent = "center";
            viewBtn.style.width = "40px";
            viewBtn.style.transition = "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
            viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
            viewBtn.title = "View";
            viewBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
            viewBtn.onmouseover = () => {
              viewBtn.style.backgroundColor = "#2e7d32";
              viewBtn.style.color = "#fff";
              viewBtn.style.boxShadow = "0 2px 6px rgba(46, 125, 50, 0.3)";
              viewBtn.style.transform = "translateY(-1px)";
            };
            viewBtn.onmouseout = () => {
              viewBtn.style.backgroundColor = "#e8f5e8";
              viewBtn.style.color = "#2e7d32";
              viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
              viewBtn.style.transform = "translateY(0)";
            };

            viewBtn.onclick = () => {
              const project = instance.getSourceDataAtRow(row);
              if (project?.project_number) {
                setSelectedPnNumberForViewProjects(project.project_number);
                setOpenViewProjectsModal(true);
              }
            };

            wrapper.appendChild(viewBtn);
            td.appendChild(wrapper);
            return td;
          },
        },
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
      title: "Total Open Project (TOP)",
      value: stats.totalOutstandingProjects,
      color: { bgColor: "#0074A8", textColor: "#ffffff" },
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
            <FaProjectDiagram className="text-blue-500" /> Project Overdue (POV)
          </h2>
          {stats.top5Overdue.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">
              No overdue projects.
            </p>
          ) : (
            <div className="table-wrapper">
              <div className="table-inner">
                <HotTable
                  data={stats.top5Overdue.map((p) => ({ ...p, actions: "" }))}
                  colHeaders={[
                    "Actions",
                    "Project Number",
                    "Project Name",
                    "Client Name",
                    "PIC",
                    "Target Date",
                    "Latest Log",
                    "Status",
                  ]}
                  columns={[
                    {
                      data: "actions",
                      title: "Actions",
                      readOnly: true,
                      width: 90,
                      renderer: (instance, td, row) => {
                        td.innerHTML = "";

                        const wrapper = document.createElement("div");
                        wrapper.style.display = "flex";
                        wrapper.style.alignItems = "center";
                        wrapper.style.gap = "6px";

                        const viewBtn = document.createElement("button");
                        viewBtn.style.cursor = "pointer";
                        viewBtn.style.border = "none";
                        viewBtn.style.background = "#e8f5e8";
                        viewBtn.style.padding = "8px";
                        viewBtn.style.borderRadius = "4px";
                        viewBtn.style.color = "#2e7d32";
                        viewBtn.style.display = "flex";
                        viewBtn.style.alignItems = "center";
                        viewBtn.style.justifyContent = "center";
                        viewBtn.style.width = "40px";
                        viewBtn.style.transition =
                          "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
                        viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                        viewBtn.title = "View";
                        viewBtn.innerHTML =
                          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
                        viewBtn.onmouseover = () => {
                          viewBtn.style.backgroundColor = "#2e7d32";
                          viewBtn.style.color = "#fff";
                          viewBtn.style.boxShadow =
                            "0 2px 6px rgba(46, 125, 50, 0.3)";
                          viewBtn.style.transform = "translateY(-1px)";
                        };
                        viewBtn.onmouseout = () => {
                          viewBtn.style.backgroundColor = "#e8f5e8";
                          viewBtn.style.color = "#2e7d32";
                          viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                          viewBtn.style.transform = "translateY(0)";
                        };

                        viewBtn.onclick = () => {
                          const project = instance.getSourceDataAtRow(row);
                          if (project?.pn_number) {
                            setSelectedPnNumberForViewProjects(
                              project.pn_number
                            );
                            setOpenViewProjectsModal(true);
                          }
                        };

                        wrapper.appendChild(viewBtn);
                        td.appendChild(wrapper);
                        return td;
                      },
                    },
                    {
                      data: "project_number",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "project_name",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "pic",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      editor: false,
                      renderer: dateRenderer,
                    },
                    {
                      data: "latest_log",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "status",
                      type: "text",
                      editor: false,
                      renderer: statusRenderer,
                    },
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
                  data={stats.projectDueThisMonthList.map((p) => ({
                    ...p,
                    actions: "",
                  }))}
                  colHeaders={[
                    "Actions",
                    "Project Number",
                    "Project Name",
                    "Client Name",
                    "PIC",
                    "Target Date",
                    "Status",
                  ]}
                  columns={[
                    {
                      data: "actions",
                      title: "Actions",
                      readOnly: true,
                      width: 90,
                      renderer: (instance, td, row) => {
                        td.innerHTML = "";

                        const wrapper = document.createElement("div");
                        wrapper.style.display = "flex";
                        wrapper.style.alignItems = "center";
                        wrapper.style.gap = "6px";

                        const viewBtn = document.createElement("button");
                        viewBtn.style.cursor = "pointer";
                        viewBtn.style.border = "none";
                        viewBtn.style.background = "#e8f5e8";
                        viewBtn.style.padding = "8px";
                        viewBtn.style.borderRadius = "4px";
                        viewBtn.style.color = "#2e7d32";
                        viewBtn.style.display = "flex";
                        viewBtn.style.alignItems = "center";
                        viewBtn.style.justifyContent = "center";
                        viewBtn.style.width = "40px";
                        viewBtn.style.transition =
                          "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
                        viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                        viewBtn.title = "View";
                        viewBtn.innerHTML =
                          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
                        viewBtn.onmouseover = () => {
                          viewBtn.style.backgroundColor = "#2e7d32";
                          viewBtn.style.color = "#fff";
                          viewBtn.style.boxShadow =
                            "0 2px 6px rgba(46, 125, 50, 0.3)";
                          viewBtn.style.transform = "translateY(-1px)";
                        };
                        viewBtn.onmouseout = () => {
                          viewBtn.style.backgroundColor = "#e8f5e8";
                          viewBtn.style.color = "#2e7d32";
                          viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                          viewBtn.style.transform = "translateY(0)";
                        };

                        viewBtn.onclick = () => {
                          const project = instance.getSourceDataAtRow(row);
                          if (project?.pn_number) {
                            setSelectedPnNumberForViewProjects(
                              project.pn_number
                            );
                            setOpenViewProjectsModal(true);
                          }
                        };

                        wrapper.appendChild(viewBtn);
                        td.appendChild(wrapper);
                        return td;
                      },
                    },
                    {
                      data: "project_number",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "project_name",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "pic",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      editor: false,
                      renderer: dateRenderer,
                    },
                    {
                      data: "status",
                      type: "text",
                      editor: false,
                      renderer: statusRenderer,
                    },
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
                  data={stats.upcomingProjects.map((p) => ({
                    ...p,
                    actions: "",
                  }))}
                  colHeaders={[
                    "Actions",
                    "Project Number",
                    "Project Name",
                    "Client Name",
                    "Target Date",
                    "Status",
                  ]}
                  columns={[
                    {
                      data: "actions",
                      title: "Actions",
                      readOnly: true,
                      width: 90,
                      renderer: (instance, td, row) => {
                        td.innerHTML = "";

                        const wrapper = document.createElement("div");
                        wrapper.style.display = "flex";
                        wrapper.style.alignItems = "center";
                        wrapper.style.gap = "6px";

                        const viewBtn = document.createElement("button");
                        viewBtn.style.cursor = "pointer";
                        viewBtn.style.border = "none";
                        viewBtn.style.background = "#e8f5e8";
                        viewBtn.style.padding = "8px";
                        viewBtn.style.borderRadius = "4px";
                        viewBtn.style.color = "#2e7d32";
                        viewBtn.style.display = "flex";
                        viewBtn.style.alignItems = "center";
                        viewBtn.style.justifyContent = "center";
                        viewBtn.style.width = "40px";
                        viewBtn.style.transition =
                          "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
                        viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                        viewBtn.title = "View";
                        viewBtn.innerHTML =
                          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
                        viewBtn.onmouseover = () => {
                          viewBtn.style.backgroundColor = "#2e7d32";
                          viewBtn.style.color = "#fff";
                          viewBtn.style.boxShadow =
                            "0 2px 6px rgba(46, 125, 50, 0.3)";
                          viewBtn.style.transform = "translateY(-1px)";
                        };
                        viewBtn.onmouseout = () => {
                          viewBtn.style.backgroundColor = "#e8f5e8";
                          viewBtn.style.color = "#2e7d32";
                          viewBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                          viewBtn.style.transform = "translateY(0)";
                        };

                        viewBtn.onclick = () => {
                          const project = instance.getSourceDataAtRow(row);
                          if (project?.pn_number) {
                            setSelectedPnNumberForViewProjects(
                              project.pn_number
                            );
                            setOpenViewProjectsModal(true);
                          }
                        };

                        wrapper.appendChild(viewBtn);
                        td.appendChild(wrapper);
                        return td;
                      },
                    },
                    {
                      data: "project_number",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "project_name",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "client_name",
                      title: "Client Name",
                      type: "text",
                      editor: false,
                      renderer: textRenderer,
                    },
                    {
                      data: "target_dates",
                      type: "date",
                      dateFormat: "YYYY-MM-DD",
                      editor: false,
                      renderer: dateRenderer,
                    },
                    {
                      data: "status",
                      type: "text",
                      editor: false,
                      renderer: statusRenderer,
                    },
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

      {/* View Projects Modal */}
      <ViewProjectsModal
        open={openViewProjectsModal}
        onClose={() => {
          setOpenViewProjectsModal(false);
          setSelectedPnNumberForViewProjects(null);
        }}
        pn_number={selectedPnNumberForViewProjects}
      />
    </div>
  );
}
