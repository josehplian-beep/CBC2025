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
import Messages from "./pages/Messages";
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
import AdminSchoolTeacherEdit from "./pages/AdminSchoolTeacherEdit";
import TeacherProfile from "./pages/TeacherProfile";
import AdminSchoolStudents from "./pages/AdminSchoolStudents";
import AdminSchoolStudentEdit from "./pages/AdminSchoolStudentEdit";
import AdminSchoolClasses from "./pages/AdminSchoolClasses";
import AdminSchoolClassEdit from "./pages/AdminSchoolClassEdit";
import AdminSchoolReports from "./pages/AdminSchoolReports";
import TakeAttendance from "./pages/TakeAttendance";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import AdminRoleManagement from "./pages/AdminRoleManagement";
import AdminEvents from "./pages/AdminEvents";
import AdminMessages from "./pages/AdminMessages";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminMySQLSync from "./pages/AdminMySQLSync";
import { ProtectedRoute } from "./components/ProtectedRoute";

// School Management Edit Pages
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
          <Route path="/members" element={<ProtectedRoute permission="view_member_directory"><AdminLayout><Members /></AdminLayout></ProtectedRoute>} />
          <Route path="/members/:id" element={<ProtectedRoute permission="view_member_directory"><AdminLayout><MemberProfile /></AdminLayout></ProtectedRoute>} />
          <Route path="/members/:id/edit" element={<ProtectedRoute permission="view_member_directory"><AdminLayout><ProfileEdit /></AdminLayout></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute permission="view_admin_panel"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/teacher/dashboard" element={<ProtectedRoute permission="take_attendance"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/admin/albums" element={<ProtectedRoute permission="manage_albums"><AdminLayout><AdminAlbums /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute permission="manage_events"><AdminLayout><AdminEvents /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute permission="manage_testimonies"><AdminLayout><AdminMessages /></AdminLayout></ProtectedRoute>} />
          <Route path="/staff/rev-van-duh-ceu" element={<RevVanDuhCeu />} />
          <Route path="/staff/rev-joseph-nihre-bawihrin" element={<RevJosephNihreBawihrin />} />
          <Route path="/beliefs/the-bible" element={<TheBible />} />
          <Route path="/beliefs/salvation" element={<Salvation />} />
          <Route path="/beliefs/mission" element={<Mission />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/department-member/:id" element={<MemberProfileDepartment />} />
          <Route path="/testimony" element={<Messages />} />
          <Route path="/testimony/:id" element={<TestimonyPost />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/admin/color-palette" element={<ProtectedRoute permission="manage_users"><AdminLayout><ColorPalette /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute permission="manage_staff"><AdminLayout><AdminStaff /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute permission="manage_departments"><AdminLayout><AdminDepartments /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/prayer-requests" element={<ProtectedRoute permission="manage_prayer_requests"><AdminLayout><AdminPrayerRequests /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute permission="manage_users"><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute permission="manage_roles"><AdminLayout><AdminRoleManagement /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/mysql-sync" element={<ProtectedRoute permission="manage_users"><AdminLayout><AdminMySQLSync /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/teachers" element={<ProtectedRoute permission="manage_students"><AdminLayout><AdminSchoolTeachers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/teachers/:id" element={<ProtectedRoute permission="manage_students"><AdminLayout><TeacherProfile /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/teachers/:id/edit" element={<ProtectedRoute permission="manage_students"><AdminLayout><AdminSchoolTeacherEdit /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/students" element={<ProtectedRoute permission="manage_students"><AdminLayout><AdminSchoolStudents /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/students/:id/edit" element={<ProtectedRoute permission="manage_students"><AdminLayout><AdminSchoolStudentEdit /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/classes" element={<ProtectedRoute permission="manage_classes"><AdminLayout><AdminSchoolClasses /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/classes/:id/edit" element={<ProtectedRoute permission="manage_classes"><AdminLayout><AdminSchoolClassEdit /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/classes/:classId/attendance" element={<ProtectedRoute permission="take_attendance"><AdminLayout><TakeAttendance /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/school/reports" element={<ProtectedRoute permissions={["manage_students", "take_attendance"]}><AdminLayout><AdminSchoolReports /></AdminLayout></ProtectedRoute>} />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/staff/:slug" element={<StaffBiography />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
