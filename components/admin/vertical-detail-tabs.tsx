"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { VerticalMembersTab } from "./vertical-members-tab";
import { VerticalProjectsTab } from "./vertical-projects-tab";
import { VerticalSettingsTab } from "./vertical-settings-tab";
import { Users, FolderKanban, Settings, Edit2, Check, X, Calendar, Hash } from "lucide-react";
import { updateVertical } from "@/server/actions/verticals";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface VerticalDetailTabsProps {
  vertical: {
    id: string;
    name: string;
    createdAt: Date;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(vertical.name);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast({
        title: "Validation Error",
        description: "Vertical name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateVertical(vertical.id, editedName);
      toast({
        title: "Success",
        description: "Vertical name updated successfully",
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update vertical",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(vertical.name);
    setIsEditing(false);
  };

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
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-3xl font-bold h-12 max-w-md"
                disabled={isSaving}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || editedName === vertical.name}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{vertical.name}</h1>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
        </div>

        {/* Meta Information */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            <span className="font-mono text-xs">{vertical.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDistanceToNow(new Date(vertical.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members ({vertical._count.users})
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects ({vertical._count.projects})
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
