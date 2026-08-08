import * as React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Home, BookOpen, GraduationCap, Languages, Grid3x3, Sparkles } from "lucide-react";
import { NavLink } from "@/navigation/NavLink";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "./Logo";

const coreNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/study", icon: Sparkles, label: "Study", highlight: true },
    { path: "/control-center", icon: Grid3x3, label: "Control Center" },
];

const englishNavItems = [
    { path: "/vocabularies", icon: BookOpen, label: "Vocabulary" },
    { path: "/resources", icon: GraduationCap, label: "Resources" },
];

const arabicNavItems = [
    { path: "/arabic-vocabularies", icon: Languages, label: "Vocabulary" },
    { path: "/arabic-resources", icon: GraduationCap, label: "Resources" },
];

interface MobileDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MobileDrawer = ({ open, onOpenChange }: MobileDrawerProps) => {
    const NavItem = ({ item }: { item: typeof coreNavItems[0] }) => {
        const isHighlighted = !!item.highlight;
        return (
            <NavLink
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] group ${isHighlighted ? 'text-primary font-semibold' : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'}`}
                activeClassName="bg-primary/10 text-primary font-bold ring-1 ring-primary/10"
            >
                <span className={`flex items-center justify-center h-10 w-10 rounded-full ${isHighlighted ? 'bg-primary/15' : 'bg-primary/5'}`}>
                    <item.icon className="h-5 w-5" />
                </span>
                <span className="text-[15px] font-medium tracking-tight">{item.label}</span>
                {item.highlight && (
                    <span className="ml-auto text-[8px] font-black uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded-full">Focus</span>
                )}
            </NavLink>
        );
    };

    const SectionLabel = ({ label }: { label: string }) => (
        <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {label}
        </p>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="w-[300px] p-0 flex flex-col border-r-0 sm:border-r"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {/* App Bar */}
                <div className="pt-[calc(var(--safe-area-top)+8px)] px-6 pb-4">
                    <div className="flex items-center justify-between">
                        <Logo onOpenChange={onOpenChange} />
                    </div>
                </div>
                <div className="h-px bg-border/50" />

                {/* Navigation Content */}
                <ScrollArea className="flex-1">
                    <div className="px-3 py-3 space-y-1">
                        <SectionLabel label="Core" />
                        {coreNavItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                        <SectionLabel label="English" />
                        {englishNavItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                        <SectionLabel label="Arabic" />
                        {arabicNavItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};