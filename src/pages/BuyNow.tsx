import Header from "@/components/Header";
import { API_BASE_URL } from "@/config/api";
import VehicleCard from "@/components/VehicleCard";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const BuyNow = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Read search parameters from URL
  const initMake = searchParams.get('make') ? [searchParams.get('make')!] : [];
  const initLocation = searchParams.get('location') ? [searchParams.get('location')!] : [];
  const initMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : 50000000;
  const initSearch = searchParams.get('search') || "";

  // Filter State
  const [searchQuery, setSearchQuery] = useState(initSearch);
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: [0, initMaxPrice],
    yearRange: [1980, 2025],
    makes: initMake,
    bodyTypes: [],
    fuelTypes: [],
    transmissions: [],
    colors: [],
    registrationCities: [],
    locations: initLocation,
    engineCCRange: [600, 6000],
    mileageRange: [0, 1000000],
  });

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const limit = 12;
      let url = `${API_BASE_URL}/api/cars?type=buy-now&page=${page}&limit=${limit}`;

      // Search Query
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      // Sort
      if (sortBy) url += `&sort=${sortBy}`;

      // Randomization only if no filters and no search
      if (!searchQuery && activeFilters.makes.length === 0) {
        url += `&random=true`;
      }

      // Arrays
      if (activeFilters.makes.length > 0) url += `&make=${activeFilters.makes.join(',')}`;
      if (activeFilters.fuelTypes.length > 0) url += `&fuelType=${activeFilters.fuelTypes.join(',')}`;
      if (activeFilters.bodyTypes.length > 0) url += `&bodyType=${activeFilters.bodyTypes.join(',')}`;
      if (activeFilters.transmissions.length > 0) url += `&transmission=${activeFilters.transmissions.join(',')}`;
      if (activeFilters.colors.length > 0) url += `&color=${encodeURIComponent(activeFilters.colors.join(','))}`;
      if (activeFilters.registrationCities.length > 0) url += `&registrationCity=${activeFilters.registrationCities.join(',')}`;
      if (activeFilters.locations.length > 0) url += `&location=${activeFilters.locations.join(',')}`;

      // Numeric Ranges
      if (activeFilters.engineCCRange[0] > 600 || activeFilters.engineCCRange[1] < 6000) {
        url += `&minEngineCC=${activeFilters.engineCCRange[0]}&maxEngineCC=${activeFilters.engineCCRange[1]}`;
      }
      if (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 50000000) {
        url += `&minPrice=${activeFilters.priceRange[0]}&maxPrice=${activeFilters.priceRange[1]}`;
      }
      if (activeFilters.yearRange[0] > 1980 || activeFilters.yearRange[1] < 2025) {
        url += `&minYear=${activeFilters.yearRange[0]}&maxYear=${activeFilters.yearRange[1]}`;
      }
      if (activeFilters.mileageRange[0] > 0 || activeFilters.mileageRange[1] < 1000000) {
        url += `&minMileage=${activeFilters.mileageRange[0]}&maxMileage=${activeFilters.mileageRange[1]}`;
      }

      const res = await fetch(url);
      const data = await res.json();

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

      if (page === 1) {
        setVehicles(mapped);
      } else {
        setVehicles(prev => [...prev, ...mapped]);
      }
      setTotal(data.totalCars);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeFilters, sortBy]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
    setPage(1); // Reset to page 1 on filter change
    setIsFilterOpen(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Page Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">
            Buy Now <span className="text-gradient">Vehicles</span>
          </h1>
          <p className="text-muted-foreground">
            Browse our curated selection of premium vehicles available for immediate purchase
          </p>
          {(activeFilters.makes.length > 0) && (
            <div className="mt-4 inline-flex items-center gap-2 flex-wrap">
              {activeFilters.makes.map(make => (
                <div key={make} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {make}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search & Controls Bar */}
        <div className="bg-card rounded-xl border border-border/50 p-3 mb-6 shadow-premium animate-fade-in">
          {/* Actions */}
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, or keyword..."
                className="pl-12 h-12 rounded-xl border-border/50 focus:border-primary"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-48 h-12 rounded-xl border-border/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="year-new">Year: Newest First</SelectItem>
                <SelectItem value="year-old">Year: Oldest First</SelectItem>
                <SelectItem value="mileage">Lowest Mileage</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden h-12 rounded-xl"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar onApply={handleApplyFilters} />
            </div>
          </aside>

          {/* Mobile Filter Overlay */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-accent-charcoal/50"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full overflow-y-auto animate-slide-in-right">
                <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={handleApplyFilters} />
              </div>
            </div>
          )}

          {/* Vehicle Grid */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{vehicles.length}</span> vehicles
              </p>
            </div>

            <div
              className={`grid gap-4 ${viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
                : "grid-cols-1"
                }`}
            >
              {vehicles.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} {...vehicle} delay={index * 100} />
              ))}
            </div>

            {/* Load More */}
            {vehicles.length < total && (
              <div className="mt-12 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                  className="rounded-xl px-8 font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                >
                  {loading ? "Loading..." : "Load More Vehicles"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuyNow;
