import { Home, BookOpen, GraduationCap, ChevronLeft, ChevronRight, Languages, Grid3x3, Sparkles } from "lucide-react";
import { NavLink } from "@/navigation/NavLink";
import { useNative } from "@/hooks/useNative";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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

export const Sidebar = () => {
    const navigate = useNavigate();
    const { haptic } = useNative();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    }, [isCollapsed]);

    const toggleSidebar = () => {
        haptic('light');
        setIsCollapsed(!isCollapsed);
    };

    const SectionHeader = ({ title }: { title: string }) => (
        !isCollapsed && (
            <div className="px-4 pt-6 pb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {title}
                </p>
            </div>
        )
    );

    return (
        <aside
            className={`hidden md:flex flex-col h-screen fixed left-0 top-0 border-r bg-card/80 backdrop-blur-xl z-50 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'
                }`}
        >
            {/* Logo & Toggle */}
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} min-h-[100px]`}>
                <Logo isCollapsed={isCollapsed} />
                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isCollapsed && (
                <div className="flex flex-col items-center mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 mb-4"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Separator className="w-12 opacity-50" />
                </div>
            )}

            <ScrollArea className="flex-1 mask-fade-bottom">
                <nav className="px-4 pb-10 space-y-1.5">
                    <SectionHeader title="Core" />
                    {coreNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.97] group ${isCollapsed ? 'justify-center h-14 w-14 mx-auto p-0' : ''
                                } ${item.highlight && !isCollapsed ? 'bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-transparent text-fuchsia-700 dark:text-fuchsia-400 font-bold border border-fuchsia-500/20 hover:from-fuchsia-500/20' : ''
                                } ${item.highlight && isCollapsed ? 'justify-center h-14 w-14 mx-auto p-0 text-fuchsia-600' : ''}`}
                            activeClassName={`${item.highlight ? "bg-fuchsia-500/25 text-fuchsia-700 dark:text-fuchsia-400 font-black shadow-[0_4px_12px_rgba(217,70,239,0.25)] border border-fuchsia-500/40" : "bg-primary/10 text-primary font-bold shadow-[0_4px_12px_rgba(59,130,246,0.12)] border border-primary/10"}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                            {!isCollapsed && (
                                <span className="flex items-center gap-2 text-[13px] font-semibold">
                                    <span className={`${item.highlight ? '' : ''}`}>{item.label}</span>
                                    {item.highlight && (
                                        <span className="text-[8px] font-black uppercase tracking-wider bg-fuchsia-500 text-white px-1.5 py-0.5 rounded-full">Focus</span>
                                    )}
                                </span>
                            )}
                        </NavLink>
                    ))}

                    <SectionHeader title="English" />
                    {englishNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.97] group ${isCollapsed ? 'justify-center h-14 w-14 mx-auto p-0' : ''}`}
                            activeClassName="bg-primary/10 text-primary font-bold shadow-[0_4px_12px_rgba(59,130,246,0.12)] border border-primary/10"
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                            {!isCollapsed && (
                                <span className="flex items-center gap-2 text-[13px] font-semibold">{item.label}</span>
                            )}
                        </NavLink>
                    ))}

                    <SectionHeader title="Arabic" />
                    {arabicNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.97] group ${isCollapsed ? 'justify-center h-14 w-14 mx-auto p-0' : ''}`}
                            activeClassName="bg-primary/10 text-primary font-bold shadow-[0_4px_12px_rgba(59,130,246,0.12)] border border-primary/10"
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                            {!isCollapsed && (
                                <span className="flex items-center gap-2 text-[13px] font-semibold">{item.label}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </ScrollArea>
        </aside>
    );
};
