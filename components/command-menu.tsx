"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { globalSearch, type SearchResult } from "@/server/actions/search";
import { Loader2, Search, Briefcase, CheckSquare, Users } from "lucide-react";
import { staticCommands } from "@/config/commands";

interface CommandMenuProps {
    isAdmin?: boolean;
}

export function CommandMenu({ isAdmin = false }: CommandMenuProps) {
    const router = useRouter();

    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);

    // ✅ Cmd + K toggle
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // ✅ Debounced Search
    React.useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await globalSearch(query);
                setResults(data);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // ✅ Prefetch top results automatically (feels FAST)
    React.useEffect(() => {
        results.slice(0, 3).forEach((r) => {
            router.prefetch(r.url);
        });
    }, [results, router]);

    // ✅ Central navigation handler
    const handleSelect = React.useCallback(
        (url: string) => {
            setOpen(false);
            setQuery("");
            setResults([]); // ⭐ prevents ghost selection issues
            router.push(url);
        },
        [router]
    );

    // Split results by type
    const projects = results.filter((r) => r.type === "project");
    const tasks = results.filter((r) => r.type === "task");
    const users = results.filter((r) => r.type === "user");

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-input bg-background/50 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:w-64 lg:justify-between"
            >
                <span className="hidden lg:inline-flex">Search projects...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium lg:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Command Dialog */}
            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                // ⭐ Disable cmdk internal filtering because we do it server-side (dynamic) and manually (static)
                commandProps={{ shouldFilter: false }}
            >
                <CommandInput
                    placeholder="Type to search..."
                    value={query}
                    onValueChange={setQuery}
                />

                <CommandList>
                    <CommandEmpty>
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : query.length < 2 ? (
                            "Type to search..."
                        ) : (
                            "No results found."
                        )}
                    </CommandEmpty>

                    {/* 🔥 Static Commands (Manually Filtered) */}
                    {staticCommands.map((group) => {
                        if (group.adminOnly && !isAdmin) return null;

                        // Manual filtering for static commands since we disabled cmdk's filter
                        const filteredItems = group.items.filter((item) =>
                            item.title.toLowerCase().includes(query.toLowerCase())
                        );

                        if (filteredItems.length === 0) return null;

                        return (
                            <React.Fragment key={group.group}>
                                <CommandGroup heading={group.group}>
                                    {filteredItems.map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <CommandItem
                                                key={item.id}
                                                value={item.title} // ⭐ keep simple
                                                onSelect={() => handleSelect(item.url)}
                                                onMouseEnter={() => router.prefetch(item.url)} // ⚡ Prefetch
                                                className="cursor-pointer flex items-center w-full min-h-[32px]"
                                            >
                                                <Icon className="mr-2 h-4 w-4" />
                                                <span>{item.title}</span>

                                                {item.shortcut && (
                                                    <CommandShortcut className="ml-auto">
                                                        {item.shortcut}
                                                    </CommandShortcut>
                                                )}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                                <CommandSeparator />
                            </React.Fragment>
                        );
                    })}

                    {/* 🔥 Dynamic Results - Grouped by Type */}

                    {/* Projects */}
                    {projects.length > 0 && (
                        <CommandGroup heading="Projects">
                            {projects.map((result) => (
                                <CommandItem
                                    key={`${result.type}-${result.id}`}
                                    value={result.title}
                                    onSelect={() => handleSelect(result.url)}
                                    onMouseEnter={() => router.prefetch(result.url)}
                                    className="cursor-pointer flex items-center w-full min-h-[32px]"
                                >
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{result.title}</span>
                                        {result.subtitle && (
                                            <span className="text-xs text-muted-foreground">
                                                {result.subtitle}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Tasks */}
                    {tasks.length > 0 && (
                        <CommandGroup heading="Tasks">
                            {tasks.map((result) => (
                                <CommandItem
                                    key={`${result.type}-${result.id}`}
                                    value={result.title}
                                    onSelect={() => handleSelect(result.url)}
                                    onMouseEnter={() => router.prefetch(result.url)}
                                    className="cursor-pointer flex items-center w-full min-h-[32px]"
                                >
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{result.title}</span>
                                        {result.subtitle && (
                                            <span className="text-xs text-muted-foreground">
                                                {result.subtitle}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Team Members */}
                    {users.length > 0 && (
                        <CommandGroup heading="Team Members">
                            {users.map((result) => (
                                <CommandItem
                                    key={`${result.type}-${result.id}`}
                                    value={result.title}
                                    onSelect={() => handleSelect(result.url)}
                                    onMouseEnter={() => router.prefetch(result.url)}
                                    className="cursor-pointer flex items-center w-full min-h-[32px]"
                                >
                                    <div className="mr-2 flex h-6 w-6 items-center justify-center">
                                        <Avatar
                                            src={result.avatar || undefined}
                                            name={result.title}
                                            size="sm"
                                            className="h-6 w-6"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span>{result.title}</span>
                                        {result.subtitle && (
                                            <span className="text-xs text-muted-foreground">
                                                {result.subtitle}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                </CommandList>
            </CommandDialog>
        </>
    );
}