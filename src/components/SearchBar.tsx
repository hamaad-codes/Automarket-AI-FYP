import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ isHeader = false }: { isHeader?: boolean }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/buy-now?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/buy-now');
    }
  };

  return (
    <div
      className={`${isHeader ? "bg-transparent shadow-none p-0" : "bg-card rounded-2xl p-4 md:p-6 shadow-premium"} transition-all duration-500 ${isFocused && !isHeader ? "shadow-glow scale-[1.01]" : ""
        }`}
    >
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search Icon Animation Container */}
        <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 flex-shrink-0">
          <Car
            className={`h-7 w-7 text-primary transition-all duration-500 ${isFocused ? "animate-bounce-subtle" : ""
              }`}
          />
        </div>

        {/* Simple Search Input */}
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search by make, model, or keywords..."
            className="w-full h-12 lg:h-14 pl-4 pr-4 rounded-xl border border-border/50 bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="w-full md:w-auto h-12 lg:h-14 px-8 rounded-xl font-semibold text-base shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-0.5 group shrink-0"
        >
          <Search className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;