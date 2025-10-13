import React from "react";

export interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  roles: string[];
  subItems?: {
    name: string;
    href: string;
    roles: string[];
  }[];
}
