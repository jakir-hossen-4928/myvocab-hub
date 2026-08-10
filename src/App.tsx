import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

import { NetworkStatus } from "@/components/NetworkStatus";
import { PlatformBootstrap } from "@/components/PlatformBootstrap";
import { lazy, Suspense, useEffect } from "react";
import Auth from "./authentication/Auth";
import { Layout } from "@/layouts/Layout";
import { LandingLayout } from "@/layouts/LandingLayout";

import { AdminRoute } from "@/routes/AdminRoute";
import { syncService } from "@/services/syncService";
import { RouteSkeleton } from "@/components/skeletons";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Vocabularies = lazy(() => import("./pages/Vocabularies"));
const AddVocabulary = lazy(() => import("./admin/AddVocabulary"));
const BulkAddVocabulary = lazy(() => import("./admin/BulkAddVocabulary"));
const VocabularyDetail = lazy(() => import("./pages/VocabularyDetail"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const ResourcesGallery = lazy(() => import("./pages/ResourcesGallery"));
const AdminUsers = lazy(() => import("./admin/AdminUsers"));
const AiEnhancementStudio = lazy(() => import("./admin/AiEnhancementStudio"));
const ArabicAiEnhancementStudio = lazy(() => import("./admin/ArabicAiEnhancementStudio"));
const Favorites = lazy(() => import("./pages/Favorites"));
const DuplicateManager = lazy(() => import("./admin/DuplicateManager"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));

const AdminResourceGallery = lazy(() => import("./admin/AdminResourceGallery"));
const AdminAddResource = lazy(() => import("./admin/AdminAddResource"));
const PrintVocabulary = lazy(() => import("./pages/PrintVocabulary"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OnlineDictionary = lazy(() => import("./pages/OnlineDictionary"));
const MeetDeveloper = lazy(() => import("./pages/MeetDeveloper"));
const ListeningList = lazy(() => import("./pages/ListeningList"));
const ListeningDetail = lazy(() => import("./pages/ListeningDetail"));
const ListeningBuilder = lazy(() => import("./admin/ListeningBuilder"));

// Arabic pages
const ArabicVocabularies = lazy(() => import("./pages/ArabicVocabularies"));
const ArabicWordDetail = lazy(() => import("./pages/ArabicWordDetail"));
const ArabicResources = lazy(() => import("./pages/ArabicResources"));
const ArabicResourceDetail = lazy(() => import("./pages/ArabicResourceDetail"));
const AddArabicVocabulary = lazy(() => import("./admin/AddArabicVocabulary"));
const AddArabicResource = lazy(() => import("./admin/AddArabicResource"));
const AdminArabicResourceGallery = lazy(() => import("./admin/AdminArabicResourceGallery"));
const Study = lazy(() => import("./pages/Study"));
const ControlCenter = lazy(() => import("./pages/ControlCenter"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteSkeleton />;
  }

  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const ArabicEditRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/admin/arabic-vocabularies/edit/${id}`} replace />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<LandingLayout />}>
          <Route path="/auth" element={<Auth />} />
        </Route>

        {/* App Pages - With Sidebar/BottomNav */}
        <Route element={<Layout />}>
          {/* Home dashboard - public */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Publicly accessible content - no sign-in needed to read */}
          <Route path="/vocabularies" element={<Vocabularies />} />
          <Route path="/vocabularies/:id" element={<VocabularyDetail />} />
          <Route path="/resources" element={<ResourcesGallery />} />
          <Route path="/resources/:slug" element={<ResourceDetail />} />
          <Route path="/dictionary" element={<OnlineDictionary />} />
          <Route path="/meet-developer" element={<MeetDeveloper />} />
          <Route path="/ielts-listing" element={<ListeningList />} />
          <Route path="/ielts-listing/:id" element={<ListeningDetail />} />
          <Route path="/print-vocabularies" element={<PrintVocabulary />} />
          <Route path="/arabic-vocabularies" element={<ArabicVocabularies />} />
          <Route path="/arabic-vocabularies/:id" element={<ArabicWordDetail />} />
          <Route path="/arabic-resources" element={<ArabicResources />} />
          <Route path="/arabic-resources/:slug" element={<ArabicResourceDetail />} />

          {/* Study - public */}
          <Route path="/study" element={<Study />} />

          {/* Account-only pages */}
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/vocabularies/add" element={<AdminRoute><AddVocabulary /></AdminRoute>} />
          <Route path="/vocabularies/bulk-add" element={<AdminRoute><BulkAddVocabulary /></AdminRoute>} />
          <Route path="/vocabularies/edit/:id" element={<AdminRoute><AddVocabulary /></AdminRoute>} />

          {/* Redirects from old grammar routes to new resources routes */}
          <Route path="/grammar" element={<Navigate to="/resources" replace />} />
          <Route path="/grammar/:slug" element={<Navigate to="/resources/:slug" replace />} />

          {/* Redirect old admin routes to resources gallery */}
          <Route path="/admin/resources" element={<AdminRoute><AdminResourceGallery /></AdminRoute>} />
          <Route path="/admin/resources/add" element={<AdminRoute><AdminAddResource /></AdminRoute>} />
          <Route path="/admin/resources/edit/:id" element={<AdminRoute><AdminAddResource /></AdminRoute>} />
          <Route path="/admin/grammar" element={<Navigate to="/admin/resources" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/ai-enhancement-studio" element={<AdminRoute><AiEnhancementStudio /></AdminRoute>} />
          <Route path="/admin/arabic-ai-enhancement-studio" element={<AdminRoute><ArabicAiEnhancementStudio /></AdminRoute>} />
          <Route path="/admin/duplicates" element={<AdminRoute><DuplicateManager /></AdminRoute>} />

          <Route path="/admin/ielts-listening-builder" element={<AdminRoute><ListeningBuilder /></AdminRoute>} />

          {/* Control Center Hub - requires sign-in */}
          <Route path="/control-center" element={<ProtectedRoute><ControlCenter /></ProtectedRoute>} />

          {/* Arabic admin routes */}
          <Route path="/admin/arabic-vocabularies/add" element={<AdminRoute><AddArabicVocabulary /></AdminRoute>} />
          <Route path="/admin/arabic-vocabularies/edit/:id" element={<AdminRoute><AddArabicVocabulary /></AdminRoute>} />
          <Route path="/admin/arabic-vocabularies/:id/edit" element={<AdminRoute><ArabicEditRedirect /></AdminRoute>} />
          <Route path="/admin/arabic-resources" element={<AdminRoute><AdminArabicResourceGallery /></AdminRoute>} />
          <Route path="/admin/arabic-resources/add" element={<AdminRoute><AddArabicResource /></AdminRoute>} />
          <Route path="/admin/arabic-resources/edit/:id" element={<AdminRoute><AddArabicResource /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};


import { ShareProvider } from "@/contexts/ShareContext";
import { GlobalShareProxy } from "@/components/GlobalShareProxy";
import { UTMProvider } from "@/contexts/UTMContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ShareProvider>
          <GlobalShareProxy />
          <FavoritesProvider>
            <Toaster />
            <Sonner />
            <NetworkStatus />
            <PlatformBootstrap />
            <BrowserRouter>
              <UTMProvider>
                <AuthProvider>
                  <AnalyticsProvider>
                    <AppContent />
                  </AnalyticsProvider>
                </AuthProvider>
              </UTMProvider>
            </BrowserRouter>
          </FavoritesProvider>
        </ShareProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

import { useScrollToTop } from "@/hooks/useScrollToTop";

// Separate component to use hooks that exist inside the providers (like Router)
const AppContent = () => {
  useScrollToTop();
  usePageTitle();

  useEffect(() => {
    // Start background synchronization
    syncService.startRealtimeSync();
    return () => syncService.stopSyncManager();
  }, []);

  return <AppRoutes />;
}

export default App;
