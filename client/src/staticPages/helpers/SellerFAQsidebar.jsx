import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, LayoutList } from "lucide-react";

const Sidebar = ({ topics, selectedTopic, setSelectedTopic }) => {
  return (
    <nav className="space-y-2">
      {topics.map((topic) => {
        const isActive = selectedTopic === topic;

        return (
          <Button
            key={topic}
            variant="ghost"
            onClick={() => setSelectedTopic(topic)}
            className={cn(
              "w-full justify-between group h-auto py-3 px-4 text-sm font-medium transition-all duration-200 rounded-lg",
              isActive
                ? "bg-[#0c1f4d] text-white shadow-md hover:bg-[#1a2f6d] hover:text-white"
                : "text-slate-600 hover:bg-white hover:text-[#0c1f4d] hover:shadow-sm"
            )}
          >
            <div className="flex items-center gap-3">
              <LayoutList className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-blue-300" : "text-slate-400 group-hover:text-[#0c1f4d]"
              )} />
              <span className="truncate">{topic}</span>
            </div>

            {isActive && (
              <ChevronRight className="w-4 h-4 text-blue-300 animate-in fade-in slide-in-from-left-1 duration-300" />
            )}
          </Button>
        );
      })}
    </nav>
  );
};

export default Sidebar;
