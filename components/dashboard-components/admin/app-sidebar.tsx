"use client"

import * as React from "react"
import {
  IconChalkboardTeacher,
  IconDatabase,
  IconFileWord,
  IconCoinRupeeFilled,
  IconInnerShadowTop,
  IconLayoutDashboardFilled,
  IconReport,
  IconSearch,
  IconCalendarMonth,
  IconSettings,
  IconSchool,
  IconUser,
  IconUsersPlus
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/dashboard-components/admin/nav-documents"
import { NavMain } from "@/components/dashboard-components/admin/nav-main"
import { NavSecondary } from "@/components/dashboard-components/admin/nav-secondary"
import { NavUser } from "@/components/dashboard-components/admin/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconLayoutDashboardFilled,
    },
    {
      title: "Students",
      url: "/admin/students",
      icon: IconSchool,
    },
    {
      title: "Faculties",
      url: "/admin/faculties",
      icon: IconUser,
    },
    {
      title: "Departments",
      url: "/admin/departments",
      icon: IconChalkboardTeacher,
    },
    {
      title: "Class Schedules",
      url: "/admin/schedule",
      icon: IconCalendarMonth,
    },
    {
      title: "Payment",
      url: "/admin/payment",
      icon: IconCoinRupeeFilled,
    },
    {
      title: "Admissions",
      url: "/admin/admissions",
      icon: IconUsersPlus,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Students Reports",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "College Payments Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Hostel Payments Reports",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">CUMS GCE Kalahandi</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
