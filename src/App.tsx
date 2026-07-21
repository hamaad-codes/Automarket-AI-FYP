import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BuyNow from "./pages/BuyNow";
import Auctions from "./pages/Auctions";
import CreateListing from "./pages/CreateListing";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import VehicleDetails from "./pages/VehicleDetails";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Inbox from "./pages/Inbox";
import { ChatBot } from "@/components/ChatBot";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <ChatBot />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/buy-now" element={<BuyNow />} />
        <Route path="/vehicles/:id" element={<VehicleDetails />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/edit-listing/:id" element={<CreateListing />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
