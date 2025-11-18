import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import MarketingDashboard from "../pages/dashboard/MarketingDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../layouts/MainLayout"; // layout utama
import ClientTable from "../pages/client/ClientTable";
import QuotationTable from "../pages/quotation/QuotationTable";
import CategorieProjectTable from "../pages/categorie-project/CategorieProjectTable";
import StatusProjectTable from "../pages/status-project/StatusProjectTable";
import SalesReportTable from "../pages/sales-report/SalesReport";
import MarketingReport from "../pages/marketing-report/MarketingReport";
import ProjectTable from "../pages/project/ProjectTable";
import ProjectFinishedSummary from "../pages/project/ProjectFinishedSummary";
import ProjectDetails from "../pages/project/ProjectDetails";
import PhcForm from "../pages/phc/PhcForm";
import ApprovalPage from "../pages/approvall/ApprovallPage";
import EngineerDashboard from "../pages/dashboard/EngineerDashboard";
import ViewProjects from "../pages/engineer-page/project/ViewProjects";
import UpdateDocumentPhc from "../pages/engineer-page/phc/UpdateDocumentPhc";
import ViewPhc from "../pages/phc/ViewPhc";
import PhcEdit from "../pages/phc/PhcEdit";
import SucDashboard from "../pages/dashboard/SucDashboard";
import MaterialRequestPage from "../pages/material-request/MaterialRequestPage";
import MaterialRequestTable from "../pages/material-request/MaterialRequestTable";
import WorkOrderPage from "../pages/engineer-page/work-order/WorkOrderPage";
import WorkOrderTable from "../pages/engineer-page/work-order/WorkOrderTable";
import WorkOrderSummary from "../pages/work-order/WorkOrderSummary";
import ManPowerAllocationTable from "../pages/engineer-page/man-power/ManPowerAllocationTable";
import PackingListPage from "../pages/packing-list/PackingListPage";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import UserTable from "../pages/users/UserTable";
import RoleTable from "../pages/role/RoleTable";
import DepartmentTable from "../pages/department/DepartmentTable";
import ManPowerDashboard from "../pages/dashboard/ManPowerDashboard";
import DocumentTable from "../pages/document/DocumentTable";
import CategorieLogTable from "../pages/categorie-log/CategorieLogTable";
import PurposeWorkOrderTable from "../pages/purpose-work-order/PurposeWorkOrderTable";
import OutstandingProjectsTable from "../pages/outstanding-project/OutstandingProjectTable";
import ProfilePage from "../pages/profile/ProfilePage";
import UpdatePasswordPage from "../pages/profile/UpdatePasswordPage";
import UpdatePinPage from "../pages/profile/UpdatePinPage";
import ManPowerProjectTable from "../pages/man-power-page/project/ManPowerProjectTable";
import ManPowerWorkOrderPage from "../pages/man-power-page/work-order/ManPowerWorkOrderPage";
import ManPowerWorkOrderTable from "../pages/man-power-page/work-order/ManPowerWorkOrderTable";
import FinanceDashboard from "../pages/dashboard/FinanceDashboard";
import InvoiceTypeTable from "../pages/Finance/InvoiceTypeTable";
import InvoiceSummary from "../pages/Finance/InvoiceSummary";
import InvoiceList from "../pages/Finance/InvoiceList";
import RequestInvoiceSummary from "../pages/Finance/RequestInvoiceSummary";
import RequestInvoiceTable from "../pages/Finance/RequestInvoiceTable";
import EngineerDashboard4K from "../pages/dashboard/EngineerDashboard4K";
import ActivityLogPage from "../pages/activity-log/ActivityLogPage";
import TaxTable from "../pages/Finance/TaxTable";
import RetentionTable from "../pages/Finance/RetentionTable";
import DeliveryOrderTable from "../pages/Finance/DeliveryOrderTable";
import StatusMaterialRequestTable from "../pages/status-material-request/StatusMaterialRequestTable";
import TypePackingListTable from "../pages/type-packing-list/TypePackingListTable";
import ExpeditionTable from "../pages/expedition/ExpeditionTable";
import DestinationTable from "../pages/destination/DestinationTable";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        {/* Marketing Dashboard (protected) */}
        <Route
          path="/marketing"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <MarketingDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <ClientTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotation"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <QuotationTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/category-project"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "project controller",
                "project manager",
              ]}
            >
              <MainLayout>
                <CategorieProjectTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/status-project"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "project controller",
                "project manager",
              ]}
            >
              <MainLayout>
                <StatusProjectTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-report"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <SalesReportTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing-report"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <MarketingReport />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "project controller",
                "project manager",
                "warehouse",
                "engineering_admin",
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
              ]}
            >
              <MainLayout>
                <ProjectTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/finished-summary"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "engineering_director",
                "project controller",
                "project manager",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <ProjectFinishedSummary />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:pn_number"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "project controller",
                "project manager",
                "engineering_admin",
              ]}
            >
              <MainLayout>
                <ProjectDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/phc/:pn_number"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "engineering_admin",
              ]}
            >
              <MainLayout>
                <PhcForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvall"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "engineer",
                "project controller",
                "project manager",
                "engineering_admin",
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "suc_manager",
                "warehouse",
              ]}
            >
              <MainLayout>
                <ApprovalPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/phcs/show/:phcId"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "engineer",
                "project controller",
                "project manager",
                "engineering_admin",
              ]}
            >
              <MainLayout>
                <ViewPhc />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/phc/:projectId/edit"
          element={
            <ProtectedRoute
              roles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "engineer",
                "project controller",
                "project manager",
              ]}
            >
              <MainLayout>
                <PhcEdit />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Engineer */}
        <Route
          path="/engineer"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <EngineerDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/engineer4k"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <EngineerDashboard4K />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/engineer/projects/:pn_number"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <ViewProjects />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/engineer/phc/:phcId"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <UpdateDocumentPhc />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-order"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineer",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <WorkOrderPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-order/:pn_number"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineer",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <WorkOrderTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-order/summary"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "engineering_director",
                "project controller",
                "project manager",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <WorkOrderSummary />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/man-power/:pn_number"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <ManPowerAllocationTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suc"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <SucDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/material-request"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <MaterialRequestPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/material-request/:pn_number"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <MaterialRequestTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/packing-list"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <PackingListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/status-material-request"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <StatusMaterialRequestTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/type-packing-list"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <TypePackingListTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expedition"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <ExpeditionTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/destination"
          element={
            <ProtectedRoute
              roles={[
                "warehouse",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <DestinationTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "engineering_director",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <UserTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/role"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <RoleTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/department"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <DepartmentTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/man-power"
          element={
            <ProtectedRoute
              roles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "engineer",
                "super_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <ManPowerDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/document"
          element={
            <ProtectedRoute
              roles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "super_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <DocumentTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categorie-log"
          element={
            <ProtectedRoute
              roles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "super_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <CategorieLogTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purpose-work-order"
          element={
            <ProtectedRoute
              roles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "super_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <PurposeWorkOrderTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/outstanding-project"
          element={
            <ProtectedRoute
              roles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "super_admin",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <OutstandingProjectsTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/man-power/project"
          element={
            <ProtectedRoute
              roles={[
                "engineer_supervisor",
                "engineer",
                "drafter",
                "electrician_supervisor",
                "electrician",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <ManPowerProjectTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-password"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UpdatePasswordPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-pin"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UpdatePinPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/man-power/work-order"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ManPowerWorkOrderPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/man-power/work-order/:pn_number"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ManPowerWorkOrderTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Finance */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <FinanceDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/invoice-types"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <InvoiceTypeTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/invoice-summary"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <InvoiceSummary />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/invoice-list"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <InvoiceList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/request-invoice-summary"
          element={
            <ProtectedRoute
              roles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineering_admin",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <RequestInvoiceSummary />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/request-invoice-list"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <RequestInvoiceTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity-logs"
          element={
            <ProtectedRoute
              roles={[
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <ActivityLogPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/taxes"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <TaxTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/retentions"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <RetentionTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/delivery-orders"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <DeliveryOrderTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/delivery-orders/:pn_id"
          element={
            <ProtectedRoute
              roles={[
                "acc_fin_manager",
                "acc_fin_supervisor",
                "finance_administration",
                "super_admin",
                "marketing_director",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <DeliveryOrderTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* 404 */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
