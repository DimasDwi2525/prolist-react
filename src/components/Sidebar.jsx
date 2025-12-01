import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaFileInvoice,
  FaTools,
  FaChartLine,
  FaUsers,
  FaTasks,
  FaChevronRight,
  FaCheckCircle,
  FaPaypal,
  FaShippingFast,
  FaInbox,
} from "react-icons/fa";
import Badge from "@mui/material/Badge";

const roleMapping = {
  super_admin: "admin",
  marketing_director: "admin",
  engineering_director: "admin",
  "supervisor marketing": "marketing",
  manager_marketing: "marketing",
  sales_supervisor: "marketing",
  marketing_admin: "marketing",
  marketing_estimator: "marketing",
  engineer: "manPower",
  "project controller": "engineer",
  "project manager": "engineer",
  warehouse: "suc",
  engineering_admin: "engineer",
  engineer_supervisor: "manPower",
  drafter: "manPower",
  site_engineer: "manPower",
  electrician_supervisor: "manPower",
  electrician: "manPower",

  acc_fin_manager: "finance",
  acc_fin_supervisor: "finance",
  finance_administration: "finance",
};

// Menu per role dengan icon
const menuByRole = {
  admin: [
    {
      name: "Dashboard",
      icon: <FaTools />,
      submenu: [
        { name: "Admin Dashboard", path: "/admin", icon: <FaTachometerAlt /> },
        {
          name: "Marketing Dashboard",
          path: "/marketing",
          icon: <FaTachometerAlt />,
        },

        {
          name: "Engineer Dashboard",
          path: "/engineer",
          icon: <FaTachometerAlt />,
        },
        {
          name: "Finance Dashboard",
          path: "/finance",
          icon: <FaTachometerAlt />,
        },
        { name: "SUC Dashboard", path: "/suc", icon: <FaTachometerAlt /> },
        {
          name: "Engineer 4K Dashboard",
          path: "/engineer4k",
          icon: <FaTachometerAlt />,
        },
      ],
    },
    {
      name: "Manajamen User",
      icon: <FaUsers />,
      submenu: [
        {
          name: "Department",
          path: "/department",
          icon: <FaUsers />,
        },
        { name: "Role", path: "/role", icon: <FaUsers /> },
        { name: "User", path: "/user", icon: <FaUsers /> },
      ],
    },
    {
      name: "Master Data",
      icon: <FaTools />,
      submenu: [
        { name: "Client", path: "/client", icon: <FaUsers /> },
        {
          name: "Categories Project",
          path: "/category-project",
          icon: <FaTasks />,
        },
        { name: "Status Project", path: "/status-project", icon: <FaTasks /> },
        {
          name: "Document",
          path: "/document",
          icon: <FaTasks />,
        },
        {
          name: "Purpose Work Order",
          path: "/purpose-work-order",
          icon: <FaTasks />,
        },
        {
          name: "Category Log",
          path: "/categorie-log",
          icon: <FaTasks />,
        },
        {
          name: "Type Invoices",
          path: "/finance/invoice-types",
          icon: <FaTasks />,
        },
        {
          name: "Tax",
          path: "/taxes",
          icon: <FaTasks />,
        },
      ],
    },
    {
      name: "Marketing",
      icon: <FaUsers />,
      submenu: [
        {
          name: "Reports",
          icon: <FaChartLine />,
          submenu: [
            {
              name: "Marketing Reports",
              path: "/marketing-report",
              icon: <FaChartLine />,
            },
            {
              name: "Sales Reports",
              path: "/sales-report",
              icon: <FaChartLine />,
            },
          ],
        },
        { name: "Quotation", path: "/quotation", icon: <FaFileInvoice /> },
      ],
    },
    {
      name: "Engineering",
      icon: <FaUsers />,
      submenu: [
        {
          name: "Summary",
          icon: <FaFileInvoice />,
          submenu: [
            {
              name: "Project Finished Summary",
              path: "/projects/finished-summary",
              icon: <FaTasks />,
            },
            {
              name: "Work Order Summary",
              path: "/work-order/summary",
              icon: <FaTasks />,
            },
          ],
        },
        {
          name: "List Project Outstanding",
          path: "/outstanding-project",
          icon: <FaTasks />,
        },
        { name: "Work Order", path: "/work-order", icon: <FaFileInvoice /> },

        {
          name: "Request Invoice",
          path: "/finance/request-invoice-summary",
          icon: <FaPaypal />,
        },
      ],
    },
    {
      name: "SUC",
      icon: <FaUsers />,
      submenu: [
        {
          name: "Material Request",
          icon: <FaTools />,
          submenu: [
            {
              name: "Material Request",
              path: "/material-request",
              icon: <FaTasks />,
            },
            { name: "Packing List", path: "/packing-list", icon: <FaTasks /> },
          ],
        },
      ],
    },
    {
      name: "Finance",
      icon: <FaUsers />,
      submenu: [
        {
          name: "Payments",
          path: "/finance/invoice-summary",
          icon: <FaPaypal />,
        },
        {
          name: "Invoices List",
          path: "/finance/invoice-list",
          icon: <FaPaypal />,
        },
        {
          name: "Request Invoices List",
          path: "/finance/request-invoice-list",
          icon: <FaPaypal />,
        },
        {
          name: "Retentions",
          path: "/finance/retentions",
          icon: <FaPaypal />,
        },
        {
          name: "Delivery Orders",
          path: "/finance/delivery-orders",
          icon: <FaPaypal />,
        },
      ],
    },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
    { name: "Inbox", path: "/inbox", icon: <FaInbox /> },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
    { name: "Activity Log", path: "/activity-logs", icon: <FaTasks /> },
  ],
  marketing: [
    { name: "Dashboard", path: "/marketing", icon: <FaTachometerAlt /> },
    { name: "Inbox", path: "/inbox", icon: <FaInbox /> },
    {
      name: "Master Data",
      icon: <FaTools />,
      submenu: [
        { name: "Client", path: "/client", icon: <FaUsers /> },
        {
          name: "Categories Project",
          path: "/category-project",
          icon: <FaTasks />,
        },
        { name: "Status Project", path: "/status-project", icon: <FaTasks /> },
      ],
    },
    {
      name: "Reports",
      icon: <FaChartLine />,
      submenu: [
        {
          name: "Marketing Reports",
          path: "/marketing-report",
          icon: <FaChartLine />,
        },
        { name: "Sales Reports", path: "/sales-report", icon: <FaChartLine /> },
      ],
    },
    { name: "Quotation", path: "/quotation", icon: <FaFileInvoice /> },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],
  engineer: [
    {
      name: "Dashboard",
      path: "/engineer",
      icon: <FaTachometerAlt />,
    },
    { name: "Inbox", path: "/inbox", icon: <FaInbox /> },
    {
      name: "Master Data",
      icon: <FaTools />,
      submenu: [
        {
          name: "Document",
          path: "/document",
          icon: <FaTasks />,
        },
        {
          name: "Purpose Work Order",
          path: "/purpose-work-order",
          icon: <FaTasks />,
        },
        {
          name: "Category Log",
          path: "/categorie-log",
          icon: <FaTasks />,
        },
        {
          name: "Categories Project",
          path: "/category-project",
          icon: <FaTasks />,
        },
        { name: "Status Project", path: "/status-project", icon: <FaTasks /> },
      ],
    },
    {
      name: "Material Request",
      icon: <FaTools />,
      submenu: [
        {
          name: "Material Request",
          path: "/material-request",
          icon: <FaTasks />,
        },
        { name: "Packing List", path: "/packing-list", icon: <FaTasks /> },
      ],
    },
    {
      name: "Summary",
      icon: <FaFileInvoice />,
      submenu: [
        {
          name: "Project Finished Summary",
          path: "/projects/finished-summary",
          icon: <FaTasks />,
        },
        {
          name: "Work Order Summary",
          path: "/work-order/summary",
          icon: <FaTasks />,
        },
      ],
    },
    {
      name: "List Project Outstanding",
      path: "/outstanding-project",
      icon: <FaTasks />,
    },
    { name: "Work Order", path: "/work-order", icon: <FaFileInvoice /> },
    { name: "Projects", path: "/projects", icon: <FaTools /> },

    {
      name: "Request Invoice",
      path: "/finance/request-invoice-summary",
      icon: <FaPaypal />,
    },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],
  suc: [
    { name: "Dashboard", path: "/suc", icon: <FaTachometerAlt /> },
    { name: "Inbox", path: "/inbox", icon: <FaInbox /> },
    {
      name: "Data Master",
      icon: <FaTools />,
      submenu: [
        {
          name: "Status Material Request",
          path: "/status-material-request",
          icon: <FaTasks />,
        },
        {
          name: "Type Packing List",
          path: "/type-packing-list",
          icon: <FaTasks />,
        },
        {
          name: "Expedition",
          path: "/expedition",
          icon: <FaTasks />,
        },
        {
          name: "Destination",
          path: "/destination",
          icon: <FaTasks />,
        },
      ],
    },

    {
      name: "Material Request",
      path: "/material-request",
      icon: <FaTasks />,
    },
    { name: "Packing List", path: "/packing-list", icon: <FaTasks /> },

    { name: "Projects", path: "/projects", icon: <FaTools /> },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],
  manPower: [
    {
      name: "Dashboard",
      path: "/man-power",
      icon: <FaTachometerAlt />,
    },
    { name: "Inbox", path: "/inbox", icon: <FaInbox /> },
    {
      name: "Work Order",
      path: "/man-power/work-order",
      icon: <FaFileInvoice />,
    },
    { name: "Projects", path: "/man-power/project", icon: <FaTools /> },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],

  finance: [
    { name: "Dashboard", path: "/finance", icon: <FaTachometerAlt /> },
    { name: "Inbox", path: "/inbox", icon: <FaInbox /> },
    {
      name: "Master Data",
      icon: <FaTools />,
      submenu: [
        {
          name: "Type Invoices",
          path: "/finance/invoice-types",
          icon: <FaTasks />,
        },
      ],
    },

    {
      name: "Invoice Summary",
      path: "/finance/invoice-summary",
      icon: <FaPaypal />,
    },
    {
      name: "Invoices List",
      path: "/finance/invoice-list",
      icon: <FaPaypal />,
    },

    {
      name: "Request Invoices List",
      path: "/finance/request-invoice-list",
      icon: <FaPaypal />,
    },
    {
      name: "Retentions",
      path: "/finance/retentions",
      icon: <FaPaypal />,
    },
    {
      name: "Delivery Orders",
      path: "/finance/delivery-orders",
      icon: <FaShippingFast />,
    },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
  ],
};

export default function Sidebar({
  role,
  sidebarOpen,
  unreadNotifications,
  pendingApprovals,
  pendingRequestInvoices,
}) {
  const [openSubmenu, setOpenSubmenu] = useState({});

  // Mapping role dari props
  const mappedRole = roleMapping[role] || role;
  const menu = menuByRole[mappedRole] || [];

  return (
    <div
      className={`fixed inset-y-0 left-0 bg-[#0074A8] text-white shadow-md z-30 transform transition-all duration-300 ease-in-out flex flex-col justify-between overflow-y-auto text-sm ${
        sidebarOpen ? "translate-x-0 md:w-52" : "-translate-x-full md:w-0"
      }`}
    >
      {/* Menu */}
      <nav className="mt-3 space-y-1 px-2">
        {menu.map((item, idx) => {
          const hasSubmenu = item.submenu?.length > 0;
          const isOpen = openSubmenu[idx];

          return (
            <div key={idx}>
              {hasSubmenu ? (
                <button
                  onClick={() =>
                    setOpenSubmenu((prev) => ({ ...prev, [idx]: !prev[idx] }))
                  }
                  className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-[#005f87] transition"
                >
                  <div className="flex items-center gap-2">
                    {item.icon} <span>{item.name}</span>
                  </div>

                  <FaChevronRight
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ) : (
                <Link
                  to={item.path}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#005f87] transition"
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {item.name === "Request Invoices List" &&
                    pendingRequestInvoices > 0 && (
                      <Badge
                        badgeContent={pendingRequestInvoices}
                        color="error"
                        sx={{
                          "& .MuiBadge-badge": {
                            fontSize: "0.7rem",
                            height: "16px",
                            minWidth: "16px",
                            backgroundColor: "#ff4444",
                            color: "white",
                          },
                          ml: 1,
                        }}
                      />
                    )}
                  {item.name === "Inbox" && unreadNotifications > 0 && (
                    <Badge
                      badgeContent={unreadNotifications}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.7rem",
                          height: "16px",
                          minWidth: "16px",
                          backgroundColor: "#ff4444",
                          color: "white",
                        },
                        ml: 1,
                      }}
                    />
                  )}
                  {item.name === "Approvall" && pendingApprovals > 0 && (
                    <Badge
                      badgeContent={pendingApprovals}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.7rem",
                          height: "16px",
                          minWidth: "16px",
                          backgroundColor: "#ff4444",
                          color: "white",
                        },
                        ml: 1,
                      }}
                    />
                  )}
                </Link>
              )}

              {hasSubmenu && isOpen && (
                <div className="pl-6 mt-1 space-y-1 text-xs">
                  {item.submenu.map((sub, sidx) => {
                    const subHasSubmenu = sub.submenu?.length > 0;
                    const subIsOpen = openSubmenu[`${idx}-${sidx}`];
                    return subHasSubmenu ? (
                      <div key={sidx}>
                        <button
                          onClick={() =>
                            setOpenSubmenu((prev) => ({
                              ...prev,
                              [`${idx}-${sidx}`]: !prev[`${idx}-${sidx}`],
                            }))
                          }
                          className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-[#005f87] transition"
                        >
                          <div className="flex items-center gap-2">
                            {sub.icon} <span>{sub.name}</span>
                          </div>
                          <FaChevronRight
                            className={`transition-transform duration-300 ${
                              subIsOpen ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        {subHasSubmenu && subIsOpen && (
                          <div className="pl-6 mt-1 space-y-1 text-xs">
                            {sub.submenu.map((subsub, ssidx) => (
                              <Link
                                key={ssidx}
                                to={subsub.path}
                                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#005f87]"
                              >
                                {subsub.icon} <span>{subsub.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        key={sidx}
                        to={sub.path}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#005f87]"
                      >
                        {sub.icon} <span>{sub.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
