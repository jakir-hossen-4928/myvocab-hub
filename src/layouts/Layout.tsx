import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/navigation/Sidebar";
import { BottomNav } from "@/navigation/BottomNav";
import { MobileDrawer } from "@/navigation/MobileDrawer";
import { MobileHeader } from "@/navigation/MobileHeader";
import { useNative } from "@/hooks/useNative";
import { useKeyboard } from "@/hooks/useKeyboard";
import { usePlatform } from "@/hooks/usePlatform";

export const Layout = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });
    const { setStatusBarColor, isCapacitor } = useNative();
    const isKeyboardOpen = useKeyboard();
    const { isNative } = usePlatform();

    useEffect(() => {
        // Set native status bar color to primary blue (approx matching #3b82f6)
        setStatusBarColor('#3b82f6');

        const handleStorageChange = () => {
            const saved = localStorage.getItem('sidebarCollapsed');
            setSidebarCollapsed(saved === 'true');
        };

        // Listen for changes to localStorage (cross-tab)
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const location = useLocation();

    // In the native app, always use the mobile-first layout:
    // bottom nav for navigation and a compact top header. No desktop sidebar.
    return (
        <div className="min-h-screen bg-background">
            {!isNative && <Sidebar />}
            <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
            {!isNative && <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />}
            <main
                className={`min-h-screen transition-all duration-300 ${
                    isNative
                        ? 'pt-[calc(52px+var(--safe-area-top))] pb-[calc(72px+var(--safe-area-bottom))]'
                        : `pt-[calc(52px+var(--safe-area-top))] md:pt-0 pb-[calc(4rem+var(--safe-area-bottom))] md:pb-0 ${sidebarCollapsed ? 'md:pl-24' : 'md:pl-72'}`
                }`}
            >
                <Outlet />
            </main>
            <BottomNav isKeyboardOpen={isKeyboardOpen} />
        </div>
    );
};