import React from "react";
import {
  Home,
  Settings,
  Users,
  Calendar,
  Stethoscope,
  DollarSign,
  FileText,
} from "lucide-react";
import { NavigationItem } from "@/types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Home size={20} />,
    roles: ["especialista", "recepcion", "caja", "admin"],
  },
  {
    name: "Pacientes",
    href: "/patients",
    icon: <Users size={20} />,
    roles: ["especialista", "recepcion", "caja", "admin"],
  },
  {
    name: "Citas",
    href: "/appointments",
    icon: <Calendar size={20} />,
    roles: ["especialista", "recepcion", "admin"],
  },
  {
    name: "Consulta Externa",
    href: "/consulta-externa",
    icon: <Stethoscope size={20} />,
    roles: ["especialista", "admin"],
  },
  {
    name: "Pagos",
    href: "/payments",
    icon: <DollarSign size={20} />,
    roles: ["caja", "admin"],
  },
  {
    name: "Facturas",
    href: "/invoices",
    icon: <FileText size={20} />,
    roles: ["caja", "admin"],
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
        name: "Productos/Servicios",
        href: "/admin/prices",
        roles: ["admin"],
      },
      {
        name: "Usuarios",
        href: "/admin/users",
        roles: ["admin"],
      },
    ],
  },
];
