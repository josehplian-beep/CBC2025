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
import Resources from "./pages/Resources";
import GetInvolved from "./pages/GetInvolved";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import AdminAlbums from "./pages/AdminAlbums";
import RevVanDuhCeu from "./pages/RevVanDuhCeu";
import RevJosephNihreBawihrin from "./pages/RevJosephNihreBawihrin";
import TheBible from "./pages/TheBible";
import Salvation from "./pages/Salvation";
import Testimony from "./pages/Testimony";
import TestimonyPost from "./pages/TestimonyPost";
import Blog from "./pages/Blog";
import ProfileEdit from "./pages/ProfileEdit";
import ColorPalette from "./pages/ColorPalette";
import AdminStaff from "./pages/AdminStaff";
import StaffBiography from "./pages/StaffBiography";
import Mission from "./pages/Mission";
import Departments from "./pages/Departments";
import AdminDepartments from "./pages/AdminDepartments";
import MemberProfileDepartment from "./pages/MemberProfileDepartment";
import AdminPrayerRequests from "./pages/AdminPrayerRequests";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import AlbumGallery from "./pages/AlbumGallery";
import AdminSchoolTeachers from "./pages/AdminSchoolTeachers";
import AdminSchoolStudents from "./pages/AdminSchoolStudents";
import AdminSchoolClasses from "./pages/AdminSchoolClasses";
import AdminSchoolReports from "./pages/AdminSchoolReports";
import TakeAttendance from "./pages/TakeAttendance";
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
          <Route path="/resources" element={<Resources />} />
          <Route path="/get-involved" element={<GetInvolved />} />
          <Route path="/members" element={<AdminLayout><Members /></AdminLayout>} />
          <Route path="/members/:id" element={<AdminLayout><MemberProfile /></AdminLayout>} />
          <Route path="/members/:id/edit" element={<AdminLayout><ProfileEdit /></AdminLayout>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/albums" element={<AdminLayout><AdminAlbums /></AdminLayout>} />
          <Route path="/staff/rev-van-duh-ceu" element={<RevVanDuhCeu />} />
          <Route path="/staff/rev-joseph-nihre-bawihrin" element={<RevJosephNihreBawihrin />} />
          <Route path="/beliefs/the-bible" element={<TheBible />} />
          <Route path="/beliefs/salvation" element={<Salvation />} />
          <Route path="/beliefs/mission" element={<Mission />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/department-member/:id" element={<MemberProfileDepartment />} />
          <Route path="/testimony" element={<Testimony />} />
          <Route path="/testimony/:id" element={<TestimonyPost />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/admin/color-palette" element={<AdminLayout><ColorPalette /></AdminLayout>} />
          <Route path="/admin/staff" element={<AdminLayout><AdminStaff /></AdminLayout>} />
          <Route path="/admin/departments" element={<AdminLayout><AdminDepartments /></AdminLayout>} />
          <Route path="/admin/prayer-requests" element={<AdminLayout><AdminPrayerRequests /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/school/teachers" element={<AdminSchoolTeachers />} />
          <Route path="/admin/school/students" element={<AdminSchoolStudents />} />
          <Route path="/admin/school/classes" element={<AdminSchoolClasses />} />
          <Route path="/admin/school/classes/:classId/attendance" element={<TakeAttendance />} />
          <Route path="/admin/school/reports" element={<AdminSchoolReports />} />
          <Route path="/staff/:slug" element={<StaffBiography />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
