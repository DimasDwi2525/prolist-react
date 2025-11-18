import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import api from "../../api/api";
import LogTable from "../../components/table/LogTable";
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

const ViewProjectsModalForSuc = ({ open, onClose, pn_number }) => {
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
                onClick={() => setActiveTab("relationships")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "relationships"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Variatian Order
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

              {/* 3 kolom sejajar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    PO Date
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.po_date)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.po_number)}
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

          {/* Project Relationships Tab */}
          {activeTab === "relationships" && (
            <div className="py-6">
              {project.hasParent || project.hasVariants ? (
                <div className="space-y-6">
                  {/* Parent Project Section */}
                  {project.hasParent && project.parentProject && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Parent Project
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wider">
                              Project Number
                            </h4>
                            <p className="mt-1 text-sm font-medium text-blue-900">
                              {project.parentProject.project_number}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wider">
                              Project Name
                            </h4>
                            <p className="mt-1 text-sm font-medium text-blue-900">
                              {project.parentProject.project_name}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wider">
                              Status
                            </h4>
                            <p className="mt-1 text-sm font-medium text-blue-900">
                              {project.parentProject.status_project?.name ||
                                "N/A"}
                            </p>
                          </div>
                        </div>
                        {/* Removed Link */}
                      </div>
                    </div>
                  )}

                  {/* Child Projects Section */}
                  {project.hasVariants &&
                    project.childProjects &&
                    project.childProjects.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          Variant Orders
                        </h3>
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {project.childProjects.map((child) => (
                              <li key={child.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate">
                                      {child.project_number}
                                    </p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${
                                      child.status_project?.name === "Active"
                                        ? "bg-green-100 text-green-800"
                                        : child.status_project?.name ===
                                          "On Hold"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : child.status_project?.name ===
                                          "Completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                      >
                                        {child.status_project?.name || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                      <p className="flex items-center text-sm text-gray-500">
                                        <svg
                                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Target: {formatDate(child.target_dates)}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <svg
                                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Created: {formatDate(child.created_at)}
                                    </div>
                                  </div>
                                  {/* Removed Link */}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No variatian order
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This project doesn't have any parent or variant projects
                    associated with it.
                  </p>
                </div>
              )}
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

export default ViewProjectsModalForSuc;
