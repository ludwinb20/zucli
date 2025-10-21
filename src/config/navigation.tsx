import React from "react";
import {
  Home,
  Settings,
  Users,
  Calendar,
  Stethoscope,
  DollarSign,
  FileText,
  Activity,
  Bed,
  Scissors,
  BarChart3,
} from "lucide-react";
import { NavigationItem } from "@/types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Home size={20} />,
    roles: ["especialista", "recepcion", "caja", "radiologo", "admin"],
  },
  {
    name: "Pacientes",
    href: "/patients",
    icon: <Users size={20} />,
    roles: ["especialista", "recepcion", "caja", "radiologo", "admin"],
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
    name: "Radiología",
    href: "/radiologia",
    icon: <Activity size={20} />,
    roles: ["radiologo", "admin"],
  },
  {
    name: "Hospitalizaciones",
    href: "/hospitalizaciones",
    icon: <Bed size={20} />,
    roles: ["especialista", "recepcion", "admin"],
  },
  {
    name: "Cirugías",
    href: "/surgeries",
    icon: <Scissors size={20} />,
    roles: ["especialista", "recepcion", "admin"],
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
    name: "Reportería",
    href: "/reportes",
    icon: <BarChart3 size={20} />,
    roles: ["admin"],
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
