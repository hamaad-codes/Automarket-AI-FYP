import { Heart, MapPin, Fuel, Gauge, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";

interface VehicleCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  year: number;
  mileage: string;
  fuelType: string;
  location: string;
  isAuction?: boolean;
  currentBid?: number;
  timeLeft?: string;
  delay?: number;
  sellerType?: "Owner" | "Dealer";
  aiPriceScore?: number;
  matchScore?: number;
  postedDate?: string;
}

const VehicleCard = ({
  id,
  title,
  price,
  image,
  year,
  mileage,
  fuelType,
  location,
  isAuction = false,
  currentBid,
  timeLeft,
  delay = 0,
  sellerType,
  aiPriceScore,
  matchScore,
  postedDate,
}: VehicleCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Stable deterministic mock values based on the vehicle ID
  const numId = id ? parseInt(id.slice(-4), 16) || 0 : 0;
  const seller = sellerType || (numId % 2 === 0 ? "Owner" : "Dealer");
  const daysAgo = numId % 6;
  const posted = postedDate || (daysAgo === 0 ? "Posted today" : `Posted ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if this car is in user's favorites
    const checkFavorite = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/favorites`, {
          headers: { 'x-auth-token': token }
        });
        const favorites = await res.json();
        if (Array.isArray(favorites) && favorites.some((fav: any) => fav === id || fav._id === id)) {
          setIsFavorite(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkFavorite();
  }, [id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      if (confirm("You must be logged in to save cars. Proceed to login?")) {
        navigate('/login');
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/favorites/${id}`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        setIsFavorite(!isFavorite);
      } else {
        const txt = await res.text();
        console.error("Failed to toggle favorite:", txt);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(var(--primary),0.3)] transition-all duration-500 will-change-transform hover:-translate-y-1.5 hover:rotate-[0.5deg] animate-fade-in transform-gpu"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image Container */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={image || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop";
          }}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[80%]">
          <Badge className="bg-background/60 backdrop-blur-md text-foreground border-white/20 hover:bg-background/80 transition-colors text-[9px] px-1.5 py-0.5">
            {year}
          </Badge>
          <Badge className="bg-primary/95 backdrop-blur-md text-primary-foreground border-none text-[9px] px-1.5 py-0.5">
            Verified
          </Badge>
          {isAuction && (
            <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-white border-none animate-pulse shadow-md text-[9px] px-1.5 py-0.5 font-bold">
              Auction Live
            </Badge>
          )}
          {isAuction && timeLeft && (
            <Badge variant="destructive" className="animate-pulse shadow-lg text-[9px] px-1.5 py-0.5">
              {timeLeft} left
            </Badge>
          )}
        </div>
        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${isFavorite ? "fill-accent-racing text-accent-racing" : "text-white"
              }`}
          />
        </button>

        {/* Bottom Info Overlay (on image) */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-white transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-2 text-xs font-medium bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">{posted}</span>
            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${seller === "Owner" ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"}`}>
              {seller}
            </span>
          </div>
          <h3 className="font-heading font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 p-1 rounded-lg">
            <Gauge className="w-3 h-3 text-primary" />
            <span>{mileage}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/50 p-1 rounded-lg">
            <Fuel className="w-3 h-3 text-primary" />
            <span>{fuelType}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            {isAuction ? (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Bid</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-primary">PKR</span>
                  <span className="font-heading font-bold text-xl text-foreground">
                    {currentBid?.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-semibold text-primary">PKR</span>
                  <span className="font-heading font-bold text-lg text-foreground">
                    {price.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <Link to={`/vehicles/${id}`}>
            <Button
              size="sm"
              className="h-8 rounded-lg px-3 text-xs font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {isAuction ? "Bid" : "Details"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
