"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerticalMembersTab } from "./vertical-members-tab";
import { VerticalProjectsTab } from "./vertical-projects-tab";
import { VerticalSettingsTab } from "./vertical-settings-tab";
import { Users, FolderKanban, Settings } from "lucide-react";

interface VerticalDetailTabsProps {
  vertical: {
    id: string;
    name: string;
    _count: {
      users: number;
      projects: number;
    };
    users: Array<{
      id: string;
      userId: string;
      createdAt: Date;
      user: {
        id: string;
        name: string | null;
        email: string;
        designation: string | null;
        role: string;
      };
    }>;
    projects: Array<{
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
      _count: {
        members: number;
        sprints: number;
      };
    }>;
  };
}

export function VerticalDetailTabs({ vertical }: VerticalDetailTabsProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Verticals", href: "/admin/verticals" },
          { label: vertical.name },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{vertical.name}</h1>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span>{vertical._count.users} members</span>
          <span>{vertical._count.projects} projects</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <VerticalMembersTab
            verticalId={vertical.id}
            members={vertical.users}
          />
        </TabsContent>

        <TabsContent value="projects">
          <VerticalProjectsTab projects={vertical.projects} />
        </TabsContent>

        <TabsContent value="settings">
          <VerticalSettingsTab
            verticalId={vertical.id}
            verticalName={vertical.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
