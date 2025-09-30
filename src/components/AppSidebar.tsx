"use client";

import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Home,
  Users,
  FileText,
  Scan,
  CreditCard,
  Bed,
  Zap,
  Settings,
  LogOut,
  ArrowLeft,
  Dot,
} from "lucide-react";
import "@/styles/sidebar.css";
import Image from "next/image";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggleCollapsed } = useSidebar();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home size={20} />,
      roles: ["especialista", "recepcion", "caja", "admin"],
    },
    {
      name: "Pacientes",
      icon: <Users size={20} />,
      roles: ["especialista", "recepcion", "admin"],
      subItems: [
        {
          name: "Lista de Pacientes",
          href: "/patients",
          roles: ["especialista", "recepcion", "admin"],
        },
        {
          name: "Registrar Paciente",
          href: "/patients/register",
          roles: ["recepcion", "admin"],
        },
      ],
    },
    {
      name: "Consultas",
      href: "/consultations",
      icon: <FileText size={20} />,
      roles: ["especialista", "recepcion"],
    },
    {
      name: "Hospitalización",
      href: "/hospitalization",
      icon: <Bed size={20} />,
      roles: ["especialista", "recepcion", "admin"],
    },
    {
      name: "Cirugía",
      href: "/surgery",
      icon: <Zap size={20} />,
      roles: ["especialista", "recepcion", "admin"],
    },
    {
      name: "Rayos X",
      href: "/xray",
      icon: <Scan size={20} />,
      roles: ["recepcion", "admin"],
    },
    {
      name: "Facturación",
      icon: <CreditCard size={20} />,
      roles: ["caja", "admin"],
      subItems: [
        {
          name: "Caja",
          href: "/cashier",
          roles: ["caja", "admin"],
        },
        {
          name: "Historial de Facturas",
          href: "/invoices",
          roles: ["caja", "admin"],
        },
      ],
    },
    {
      name: "Administración",
      icon: <Settings size={20} />,
      roles: ["admin"],
      subItems: [
        {
          name: "Panel General",
          href: "/admin",
          roles: ["admin"],
        },
        {
          name: "Gestión de Usuarios",
          href: "/admin/users",
          roles: ["admin"],
        },
      ],
    },
  ];

  const filteredItems = navigationItems.filter(
    (item) => user?.role?.name && item.roles.includes(user.role.name)
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Sidebar
      collapsed={collapsed}
      width="250px"
      collapsedWidth="90px"
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
        backgroundColor: "#2E9589 ",
        transition: "width 0.3s ease",
      }}
      rootStyles={{
        "& .ps-sidebar-container": {
          backgroundColor: "transparent !important",
        },
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
        }}
      >
        {!collapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Image
              src="/assets/logotipo.png"
              alt="Clinica Zuniga"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
            <div>
              <span
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "white",
                  display: "block",
                }}
              >
                Clinica Zuniga
              </span>
              <p
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "12px",
                  color: "white",
                  margin: 0,
                  opacity: 0.8,
                }}
              >
                Sistema Médico
              </p>
            </div>
          </div>
        )}

        <button
          onClick={toggleCollapsed}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            padding: "0px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <Image
              src="/assets/logotipo.png"
              alt="Clinica Zuniga"
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
              }}
            />
          ) : (
            <ArrowLeft size={16} />
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "10px 0" }}>
        <Menu
          style={{
            backgroundColor: "transparent",
          }}
        >
          {filteredItems.map((item) => {
            // Si el item tiene subitems, usar SubMenu
            if (item.subItems) {
              const hasActiveSubItem = item.subItems.some((subItem) =>
                user?.role?.name
                  ? subItem.roles.includes(user.role.name) &&
                    pathname === subItem.href
                  : false
              );

              const filteredSubItems = item.subItems.filter((subItem) =>
                user?.role?.name
                  ? subItem.roles.includes(user.role.name)
                  : false
              );

              if (filteredSubItems.length === 0) return null;

              return (
                <SubMenu
                  key={item.name}
                  label={!collapsed ? item.name : ""}
                  icon={item.icon}
                  rootStyles={{
                    "& .ps-submenu-content": {
                      backgroundColor: "rgba(46, 149, 137, 0.8) !important",
                      borderRadius: "8px",
                      margin: "4px 6px",
                      padding: "0px 0px",
                    },
                  }}
                  style={{
                    backgroundColor: hasActiveSubItem
                      ? "rgba(64, 128, 65, 0.2)"
                      : "transparent",
                    color: "white",
                    margin: "2px 8px",
                    borderRadius: "8px",
                    justifyContent: collapsed ? "flex-start" : "flex-start",
                    textAlign: collapsed ? "left" : "left",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!hasActiveSubItem) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasActiveSubItem) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {filteredSubItems.map((subItem) => {
                    const isSubActive = pathname === subItem.href;

                    return (
                      <MenuItem
                        key={subItem.name}
                        icon={<Dot size={54} />}
                        active={isSubActive}
                        onClick={() => router.push(subItem.href)}
                        onMouseEnter={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                        style={{
                          backgroundColor: isSubActive
                            ? "#4CAF50"
                            : "transparent",
                          color: "white",
                          margin: "2px 4px",
                          paddingLeft: "20px",
                          borderRadius: "6px",
                          fontSize: "14px",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        {subItem.name}
                      </MenuItem>
                    );
                  })}
                </SubMenu>
              );
            }

            // Si no tiene subitems, usar MenuItem normal
            const isActive = pathname === item.href;

            return (
              <MenuItem
                key={item.name}
                icon={item.icon}
                active={isActive}
                onClick={() => router.push(item.href)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = collapsed
                      ? "translateX(2px)"
                      : "translateX(2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "none";
                  }
                }}
                style={{
                  backgroundColor: isActive ? "#4CAF50" : "transparent",
                  color: "white",
                  margin: "2px 8px",
                  paddingRight: "10px",
                  borderRadius: "8px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  textAlign: collapsed ? "center" : "left",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                {!collapsed && item.name}
              </MenuItem>
            );
          })}
        </Menu>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: collapsed ? "80px" : "250px",
          backgroundColor: "#2E9589",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          transition: "width 0.3s ease",
          padding: "5px",
        }}
      >
        <Menu>
          <MenuItem
            icon={<LogOut size={20} />}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.color = "#ff4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.color = "white";
            }}
            style={{
              color: "white",
              paddingRight: "10px",
              borderRadius: "8px",
              justifyContent: collapsed ? "center" : "flex-start",
              textAlign: collapsed ? "center" : "left",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
          >
            {!collapsed && "Cerrar Sesión"}
          </MenuItem>
        </Menu>
      </div>
    </Sidebar>
  );
}

