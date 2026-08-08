import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useNative } from "@/hooks/useNative";
import { usePlatform } from "@/hooks/usePlatform";

interface MobileHeaderProps {
    onMenuClick: () => void;
    title?: string;
}

export const MobileHeader = ({ onMenuClick, title = "MyVocab Hub" }: MobileHeaderProps) => {
    const navigate = useNavigate();
    const { haptic } = useNative();
    const { isNative } = usePlatform();

    const handleMenuClick = () => {
        haptic('light');
        onMenuClick();
    };

    // In the native app the top app bar is the primary header (always visible).
    // On web it only appears below the md breakpoint.
    return (
        <header className={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg pt-[var(--safe-area-top)] ${isNative ? '' : 'md:hidden'}`}>
            <div className="flex items-center gap-3 px-3 py-2.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMenuClick}
                    className="shrink-0 text-white hover:bg-white/20 h-11 w-11 min-h-[44px] min-w-[44px]"
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate("/")}>
                    <h1 className="text-base font-bold truncate">{title}</h1>
                    <p className="text-[10px] text-white/80 truncate">Learn English Vocabulary</p>
                </div>
            </div>
        </header>
    );
};