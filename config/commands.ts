import { LayoutDashboard, Settings, Users, FolderKanban, Shield, User } from "lucide-react";

export type CommandItem = {
    id: string;
    title: string;
    url: string;
    icon: any;
    shortcut?: string;
};

export type CommandGroup = {
    group: string;
    items: CommandItem[];
    adminOnly?: boolean;
};

export const staticCommands: CommandGroup[] = [
    {
        group: "Navigation",
        items: [
            {
                id: "dashboard",
                title: "Dashboard",
                url: "/",
                icon: LayoutDashboard,
                shortcut: "D",
            },
            {
                id: "projects",
                title: "My Projects",
                url: "/#projects",
                icon: FolderKanban,
                shortcut: "P",
            },
            {
                id: "team",
                title: "Team Members",
                url: "/team",
                icon: Users,
                shortcut: "T",
            },
            {
                id: "profile",
                title: "My Profile",
                url: "/profile",
                icon: User,
                shortcut: "M",
            },
        ],
    },
    {
        group: "Admin",
        adminOnly: true,
        items: [
            {
                id: "admin-verticals",
                title: "Manage Verticals",
                url: "/admin/verticals",
                icon: Shield,
            },
            {
                id: "admin-users",
                title: "User Management",
                url: "/admin/users",
                icon: Users,
            },
        ],
    },
    // {
    //     group: "Settings",
    //     items: [
    //         {
    //             id: "github-settings",
    //             title: "GitHub Integration",
    //             url: "/settings/github", // Assuming we might have this or similar
    //             icon: Settings,
    //             shortcut: "G",
    //         },
    //     ],
    // },
];
