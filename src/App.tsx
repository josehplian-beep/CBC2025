import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index";
import About from "./pages/About";
import Staff from "./pages/Staff";
import Media from "./pages/Media";
import WatchVideo from "./pages/WatchVideo";
import Events from "./pages/Events";
import GetInvolved from "./pages/GetInvolved";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminAlbums from "./pages/AdminAlbums";
import RevVanDuhCeu from "./pages/RevVanDuhCeu";
import RevJosephNihreBawihrin from "./pages/RevJosephNihreBawihrin";
import TheBible from "./pages/TheBible";
import Salvation from "./pages/Salvation";
import Testimonials from "./pages/Testimonials";
import ColorPalette from "./pages/ColorPalette";
import AdminStaff from "./pages/AdminStaff";
import StaffBiography from "./pages/StaffBiography";
import Mission from "./pages/Mission";
import Departments from "./pages/Departments";
import AdminDepartments from "./pages/AdminDepartments";
import AdminDashboard from "./pages/AdminDashboard";
import AlbumGallery from "./pages/AlbumGallery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/media" element={<Media />} />
          <Route path="/media/album/:albumId" element={<AlbumGallery />} />
          <Route path="/watch/:videoId" element={<WatchVideo />} />
          <Route path="/events" element={<Events />} />
          <Route path="/get-involved" element={<GetInvolved />} />
          <Route path="/members" element={<AdminLayout><Members /></AdminLayout>} />
          <Route path="/members/:id" element={<AdminLayout><MemberProfile /></AdminLayout>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<AdminLayout><Profile /></AdminLayout>} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/albums" element={<AdminLayout><AdminAlbums /></AdminLayout>} />
          <Route path="/staff/rev-van-duh-ceu" element={<RevVanDuhCeu />} />
          <Route path="/staff/rev-joseph-nihre-bawihrin" element={<RevJosephNihreBawihrin />} />
          <Route path="/beliefs/the-bible" element={<TheBible />} />
          <Route path="/beliefs/salvation" element={<Salvation />} />
          <Route path="/beliefs/mission" element={<Mission />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/admin/color-palette" element={<AdminLayout><ColorPalette /></AdminLayout>} />
          <Route path="/admin/staff" element={<AdminLayout><AdminStaff /></AdminLayout>} />
          <Route path="/admin/departments" element={<AdminLayout><AdminDepartments /></AdminLayout>} />
          <Route path="/staff/:slug" element={<StaffBiography />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
