import { useEffect, useState } from "react";
import { useSearchParams,useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu ,ArrowLeft} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const navigate=useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState(null); // Local state for immediate UI update
  const { setSelectedUser: setGlobalSelectedUser } = useSelectedUser(); // Global context for sync

  // Handle userId from query params (for notifications)
  useEffect(() => {
    const userIdFromQuery = searchParams.get("userId");
    if (userIdFromQuery) {
      const userObj = { _id: userIdFromQuery };
      setSelectedUser(userObj);
      setGlobalSelectedUser(userObj);
    }
  }, [searchParams, setGlobalSelectedUser]);

  // Sync Sheet open state with sidebar toggle on mobile
  const handleSheetOpenChange = (open) => {
    setIsSheetOpen(open);
    if (open !== isSidebarOpen) {
      toggleSidebar(); // Sync with useSidebar state
    }
  };

  // Handle user selection and close Sheet on mobile after selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setGlobalSelectedUser(user); // Sync with global context for unread count logic
    if (isSheetOpen) {
      setIsSheetOpen(false); // Close Sheet on mobile after selection
      toggleSidebar(); // Sync sidebar state
    }
  };

  return (
    <div
      className={cn(
        "flex relative h-[calc(100vh-100px)] overflow-hidden transition-all duration-300",
        isSidebarOpen ? "p-4 lg:ml-56" : "p-4 lg:ml-16"
      )}
    >

      {/* Mobile: Sheet (triggered by Header) */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="left" className="w-[300px] p-0 border-r-0">
          <Sidebar onSelect={handleUserSelect} />
        </SheetContent>
      </Sheet>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block h-full bg-white rounded-l-2xl shadow-sm border-l border-y border-slate-200 overflow-hidden">
        <Sidebar onSelect={handleUserSelect} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 bg-white rounded-r-2xl lg:rounded-l-none shadow-sm border border-slate-200 overflow-hidden">
        <Header onMenuClick={() => setIsSheetOpen(true)} />
        <ChatWindow selectedUser={selectedUser} />
      </div>
    </div>
  );
}
