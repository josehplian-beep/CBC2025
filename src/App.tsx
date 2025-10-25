import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Media from "./pages/Media";
import WatchVideo from "./pages/WatchVideo";
import Events from "./pages/Events";
import GetInvolved from "./pages/GetInvolved";
import Members from "./pages/Members";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminAlbums from "./pages/AdminAlbums";
import AdminDepartments from "./pages/AdminDepartments";
import RevVanDuhCeu from "./pages/RevVanDuhCeu";
import RevJosephNihreBawihrin from "./pages/RevJosephNihreBawihrin";
import TheBible from "./pages/TheBible";
import Salvation from "./pages/Salvation";
import Community from "./pages/Community";
import Mission from "./pages/Mission";
import Departments from "./pages/Departments";
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
          <Route path="/media" element={<Media />} />
          <Route path="/watch/:videoId" element={<WatchVideo />} />
          <Route path="/events" element={<Events />} />
          <Route path="/get-involved" element={<GetInvolved />} />
          <Route path="/members" element={<Members />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/albums" element={<AdminAlbums />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/staff/rev-van-duh-ceu" element={<RevVanDuhCeu />} />
          <Route path="/staff/rev-joseph-nihre-bawihrin" element={<RevJosephNihreBawihrin />} />
          <Route path="/beliefs/the-bible" element={<TheBible />} />
          <Route path="/beliefs/salvation" element={<Salvation />} />
          <Route path="/beliefs/community" element={<Community />} />
          <Route path="/beliefs/mission" element={<Mission />} />
          <Route path="/departments" element={<Departments />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
