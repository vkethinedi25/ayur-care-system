import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
}

export default function TopBar({ title, subtitle, onSearch }: TopBarProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ayur-gray-900">{title}</h1>
          {subtitle && <p className="text-ayur-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ayur-gray-400 w-4 h-4" />
            <Input
              placeholder="Search patients..."
              className="pl-10 pr-4 py-2 w-80 border-ayur-gray-300 focus:ring-2 focus:ring-ayur-primary focus:border-ayur-primary"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="p-2 text-ayur-gray-400 hover:text-ayur-gray-600 relative">
            <Bell className="w-5 h-5" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}
