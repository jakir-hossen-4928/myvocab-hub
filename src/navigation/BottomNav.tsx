import { Home, BookOpen, GraduationCap, Languages, FolderOpen } from "lucide-react";
import { NavLink } from "@/navigation/NavLink";
import { usePlatform } from "@/hooks/usePlatform";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/vocabularies", icon: BookOpen, label: "English" },
  { path: "/resources", icon: GraduationCap, label: "Resources" },
  { path: "/arabic-vocabularies", icon: Languages, label: "Arabic" },
  { path: "/arabic-resources", icon: FolderOpen, label: "Arabic Res" },
];

export const BottomNav = ({ isKeyboardOpen }: { isKeyboardOpen?: boolean }) => {
  const { isNative } = usePlatform();
  const isOpen = !isKeyboardOpen;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-50 safe-bottom pb-[var(--safe-area-bottom)] transition-all duration-300 transform ${
        isNative ? '' : 'md:hidden'
      } ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
    >
      <div className="flex justify-around items-center h-[72px] max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="group relative flex flex-col items-center justify-center flex-1 min-h-[44px] h-full text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-2 h-9 w-16 rounded-full transition-all duration-300 ease-out group-hover:bg-primary/10 ${isActive ? 'bg-primary/15' : ''}`}
                />
                <item.icon
                  className={`relative h-6 w-6 mb-1 transition-transform duration-300 group-active:scale-90 ${isActive ? '-translate-y-0.5' : ''}`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span
                  className={`relative text-[10px] leading-none transition-colors ${isActive ? 'font-semibold text-primary' : 'font-medium'
                    }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};