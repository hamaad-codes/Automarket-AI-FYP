import Header from "@/components/Header";
import { API_BASE_URL } from "@/config/api";
import CategoryCard from "@/components/CategoryCard";
import suvIcon from "@/assets/suv-icon.png";
import sedanIcon from "@/assets/sedan-icon.png";
import truckIcon from "@/assets/truck-icon.png";
import { Link, useNavigate } from "react-router-dom";
import VehicleCard from "@/components/VehicleCard";
import { useState, useEffect } from "react";
import { Search, MapPin, Tag, Landmark, Shield, Award, Users, Check, Car } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Hero Search States
  const [searchBrand, setSearchBrand] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchBudget, setSearchBudget] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let query = "/buy-now?";
    const params: string[] = [];
    if (searchBrand) params.push(`make=${encodeURIComponent(searchBrand)}`);
    if (searchCity) params.push(`location=${encodeURIComponent(searchCity)}`);
    if (searchBudget) params.push(`maxPrice=${searchBudget}`);
    if (searchModel) params.push(`search=${encodeURIComponent(searchModel)}`);
    
    query += params.join("&");
    navigate(query);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cars?random=true&limit=6`); // Fetch 6 random cars
        const data = await res.json();
        if (data.cars) {
          const mapped = data.cars.map((car: any) => ({
            id: car._id,
            title: car.title,
            price: car.price,
            image: car.image,
            year: car.year || parseInt(car.title.match(/\d{4}/)?.[0] || "2020"),
            mileage: car.mileage || "N/A",
            fuelType: car.fuelType || car.features?.find((f: string) => ["Petrol", "Diesel", "Hybrid", "Electric"].includes(f)) || "Petrol",
            location: car.location,
            make: car.make || car.title.split(' ')[1] || 'Unknown'
          }));
          setFeaturedVehicles(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch featured vehicles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories = [
    {
      title: "SUVs",
      subtitle: "Explore off-road capability and spacious utility.",
      listingCount: "2,450+",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Sedans",
      subtitle: "Experience premium comfort and daily reliability.",
      listingCount: "3,120+",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Hatchbacks",
      subtitle: "Compact, fuel-efficient, and easy to park.",
      listingCount: "1,650+",
      image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Trucks",
      subtitle: "Powerful towing capability and heavy duty performance.",
      listingCount: "1,890+",
      image: "https://images.unsplash.com/photo-1533557838564-702b65dad6e1?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Luxury Cars",
      subtitle: "Top-tier premium performance and ultimate style.",
      listingCount: "820+",
      image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Electric Vehicles",
      subtitle: "Eco-friendly, modern tech, and zero emissions.",
      listingCount: "450+",
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 transition-all duration-300">
        {/* Hero Section */}
        <section className="relative mb-8 lg:mb-10 rounded-2xl overflow-hidden shadow-2xl group min-h-[68vh] lg:min-h-[72vh] flex flex-col justify-between py-12 px-6 sm:px-8 lg:px-12">
          {/* Background Image with Parallax & Zoom Effect */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop"
              alt="Luxury Car Background"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              style={{ transform: `translateY(${scrollY * 0.3}px) scale(1.05)` }}
            />
            {/* Premium Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30 lg:from-black/95 lg:via-black/70 lg:to-transparent opacity-95" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60" />
          </div>

          {/* Main Hero Content (Top/Middle Area) */}
          <div className="relative z-10 w-full max-w-[1440px] mx-auto flex flex-col justify-center flex-grow">
            <div className="max-w-3xl">
              {/* Small Badge */}
              <div dangerouslySetInnerHTML={{
                __html: `<div class="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-lg border border-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 animate-fade-in shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                </span>
                AI-Powered Vehicle Marketplace
              </div>` }} />

              {/* Large Heading */}
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-4 tracking-tight">
                <span className="block animate-fade-in-up" style={{ animationDelay: "0ms" }}>Find Your</span>
                <span className="block animate-fade-in-up text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" style={{ animationDelay: "150ms" }}>
                  Perfect Drive
                </span>
              </h1>

              {/* Short description (max 2 lines) */}
              <p className="text-sm md:text-base text-white/80 max-w-xl mb-6 animate-fade-in-up leading-relaxed" style={{ animationDelay: "300ms" }}>
                Experience Pakistan's smartest automotive marketplace. Get instant AI price valuations, verified listings, and seamless matching.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <Link to="/buy-now">
                  <button className="relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] group/btn ring-1 ring-white/20">
                    <span className="relative z-10 flex items-center gap-2">
                      Browse Inventory <span className="text-base">→</span>
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </button>
                </Link>
                <Link to="/create-listing">
                  <button className="bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/15 px-6 py-3 rounded-xl font-heading font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:border-white/25">
                    Sell Your Car
                  </button>
                </Link>
              </div>

              {/* Compact Search Module */}
              <form onSubmit={handleHeroSearch} className="w-full max-w-4xl animate-fade-in-up mb-4" style={{ animationDelay: "500ms" }}>
                <div className="flex flex-col md:flex-row items-center gap-1.5 bg-black/45 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
                  {/* Brand Select */}
                  <div className="flex items-center gap-2 px-3 py-1.5 w-full md:w-1/4 border-b md:border-b-0 md:border-r border-white/10">
                    <Tag className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <label className="block text-[9px] uppercase tracking-wider text-white/40 font-bold">Brand</label>
                      <select 
                        value={searchBrand} 
                        onChange={(e) => setSearchBrand(e.target.value)}
                        className="bg-transparent text-white text-xs outline-none border-none w-full cursor-pointer pr-4 [&>option]:bg-neutral-900"
                      >
                        <option value="">All Brands</option>
                        {["Suzuki", "Toyota", "Honda", "Daihatsu", "Kia", "Hyundai", "Changan", "MG", "Audi", "BMW", "Mercedes", "Nissan"].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Model Input */}
                  <div className="flex items-center gap-2 px-3 py-1.5 w-full md:w-1/4 border-b md:border-b-0 md:border-r border-white/10">
                    <Car className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <label className="block text-[9px] uppercase tracking-wider text-white/40 font-bold">Model</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Corolla, Civic" 
                        value={searchModel}
                        onChange={(e) => setSearchModel(e.target.value)}
                        className="bg-transparent text-white text-xs outline-none border-none w-full placeholder:text-white/25"
                      />
                    </div>
                  </div>

                  {/* City Select */}
                  <div className="flex items-center gap-2 px-3 py-1.5 w-full md:w-1/4 border-b md:border-b-0 md:border-r border-white/10">
                    <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <label className="block text-[9px] uppercase tracking-wider text-white/40 font-bold">City</label>
                      <select 
                        value={searchCity} 
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="bg-transparent text-white text-xs outline-none border-none w-full cursor-pointer pr-4 [&>option]:bg-neutral-900"
                      >
                        <option value="">All Cities</option>
                        {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Faisalabad", "Multan", "Quetta"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Budget Select */}
                  <div className="flex items-center gap-2 px-3 py-1.5 w-full md:w-1/4">
                    <Landmark className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <label className="block text-[9px] uppercase tracking-wider text-white/40 font-bold">Max Budget</label>
                      <select 
                        value={searchBudget} 
                        onChange={(e) => setSearchBudget(e.target.value)}
                        className="bg-transparent text-white text-xs outline-none border-none w-full cursor-pointer pr-4 [&>option]:bg-neutral-900"
                      >
                        <option value="">Any Price</option>
                        <option value="1000000">Under 10 Lakh</option>
                        <option value="2000000">Under 20 Lakh</option>
                        <option value="3000000">Under 30 Lakh</option>
                        <option value="5000000">Under 50 Lakh</option>
                        <option value="8000000">Under 80 Lakh</option>
                        <option value="15000000">Under 1.5 Crore</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Button */}
                  <button 
                    type="submit" 
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2 flex-shrink-0 md:ml-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 mt-3 animate-fade-in-up text-[11px] text-white/70" style={{ animationDelay: "580ms" }}>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 bg-blue-500/10 p-0.5 rounded-full" />
                  <span>Verified Listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 bg-blue-500/10 p-0.5 rounded-full" />
                  <span>AI Price Insights</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 bg-blue-500/10 p-0.5 rounded-full" />
                  <span>Secure Transactions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Statistics Strip */}
          <div className="relative z-10 w-full max-w-[1440px] mx-auto border-t border-white/10 pt-4 mt-8 flex flex-wrap justify-between items-center text-xs md:text-sm text-white/75 gap-4 animate-fade-in" style={{ animationDelay: "650ms" }}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">5,000+</span>
              <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">Cars Listed</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">1,200+</span>
              <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">Verified Sellers</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">95%</span>
              <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">AI Price Accuracy</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">50+</span>
              <span className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">Cities Covered</span>
            </div>
          </div>
        </section>

        {/* Featured Vehicles */}
        <section className="mb-16 lg:mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Featured Vehicles
              </h2>
              <p className="text-muted-foreground mt-1">
                Hand-picked selections just for you
              </p>
            </div>
            <Link
              to="/buy-now"
              className="hidden sm:flex items-center text-primary font-medium hover:underline"
            >
              View Inventory
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredVehicles.map((vehicle, index) => (
              <VehicleCard key={vehicle.id} {...vehicle} delay={index * 100} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Browse Categories
              </h2>
              <p className="text-muted-foreground mt-1">
                Explore our curated vehicle categories
              </p>
            </div>
            <Link
              to="/buy-now"
              className="hidden sm:flex items-center text-primary font-medium hover:underline"
            >
              View All Categories
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.title}
                title={category.title}
                subtitle={category.subtitle}
                listingCount={category.listingCount}
                image={category.image}
                delay={index * 100}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Index;