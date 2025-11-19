import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import api from "../../api/api";

import LogTable from "../../components/table/LogTable";
import ManPowerAllocationView from "../../components/ManPowerAllocationView";
import {
  Dialog,
  IconButton,
  Button,
  Box,
  Link,
  CircularProgress,
  DialogContent,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ViewPhcModal from "./ViewPhcModal";

const ViewProjectsModalManPower = ({ open = false, onClose, pn_number }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("project");
  const [showViewPhc, setShowViewPhc] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!open || !pn_number) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/projects/${pn_number}`);
        const projectData = res.data?.data?.project;
        setProject(projectData);
      } catch (err) {
        console.error(err.response?.data || err);
        setError("Failed to fetch project details");
      } finally {
        setLoading(false);
      }
    };

    // Expose refresh function to window for modal communication
    window.handleRefreshProject = () => {
      const refreshProject = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/projects/${pn_number}`);
          const projectData = res.data?.data?.project;
          setProject(projectData);
        } catch (err) {
          console.error(err.response?.data || err);
          setError("Failed to fetch project details");
        } finally {
          setLoading(false);
        }
      };
      refreshProject();
    };

    fetchProject();
  }, [pn_number, open]);

  // Helper functions
  const display = (value) => value || "—";

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(parseISO(dateString), "dd MMM yyyy");
    } catch {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogContent>
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  if (error)
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <div className="text-red-500 text-center p-8">Error: {error}</div>
      </Dialog>
    );
  if (!project)
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <div className="text-center p-8">Project not found</div>
      </Dialog>
    );

  // Mapping warna untuk setiap status
  const statusColors = {
    "On Progress": { bg: "bg-blue-100", text: "text-blue-800" },
    "Documents Completed": { bg: "bg-green-100", text: "text-green-800" },
    "Engineering Work Completed": {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
    },
    "Hold By Customer": { bg: "bg-yellow-100", text: "text-yellow-800" },
    "Project Finished": { bg: "bg-gray-300", text: "text-gray-800" },
    "Material Delay": { bg: "bg-red-100", text: "text-red-800" },
    "Invoice On Progress": { bg: "bg-purple-100", text: "text-purple-800" },
  };

  // Fungsi helper untuk ambil warna
  const getStatusStyle = (statusName) => {
    return (
      statusColors[statusName] || { bg: "bg-gray-100", text: "text-gray-800" }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <div
        className="w-full mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-8 relative"
        style={{ maxHeight: "100vh", overflowY: "auto", paddingRight: "1rem" }}
      >
        {/* Close Button */}
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

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Project Details
              </h1>
              {project.status_project && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold
        ${getStatusStyle(project.status_project.name).bg}
        ${getStatusStyle(project.status_project.name).text}`}
                >
                  {project.status_project.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.phc && project.phc.status === "ready" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowViewPhc(true)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View PHC
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("project")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "project"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Project Information
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "status"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Status
              </button>
              <button
                onClick={() => setActiveTab("manpower")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "manpower"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Man Power Allocation
              </button>
            </nav>
          </div>

          {activeTab === "project" && (
            <div className="py-6 space-y-6">
              {/* 3 kolom sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Number
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.project_number)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.project_name)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.category?.name)}
                  </p>
                </div>
              </div>

              {/* 2 kolom sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Date
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.target_dates)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(
                      project.client?.name || project.quotation?.client?.name
                    )}
                  </p>
                </div>
              </div>

              {/* 2 kolom sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mandays (Engineer)
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.mandays_engineer)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mandays (Technician)
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.mandays_technician)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status & Timeline Tab */}
          {activeTab === "status" && (
            <div className="py-6">
              {/* 2 kolom sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Status
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.status_project?.name)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Progress
                  </h3>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${project.project_progress || 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 text-right">
                      {project.project_progress
                        ? `${project.project_progress}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.created_at)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.updated_at)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Completion
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.target_dates)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Man Power Allocation Tab */}
          {activeTab === "manpower" && (
            <div className="py-6">
              <ManPowerAllocationView
                embedded={true}
                pn_number={project.pn_number}
              />
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <LogTable projectId={project.pn_number} />

        {/* Render View PHC Modal */}
        <ViewPhcModal
          phcId={project.phc?.id}
          open={showViewPhc}
          handleClose={() => setShowViewPhc(false)}
        />

        {/* Snackbar for success messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ zIndex: 9999 }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </Dialog>
  );
};

export default ViewProjectsModalManPower;
