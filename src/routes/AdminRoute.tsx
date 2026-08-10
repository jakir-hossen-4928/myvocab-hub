import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { RouteSkeleton } from "@/components/skeletons";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return <RouteSkeleton />;
    }

    if (!user) {
        return <Navigate to="/auth" />;
    }

    if (!isAdmin) {
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};
