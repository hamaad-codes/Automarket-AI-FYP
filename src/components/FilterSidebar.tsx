import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export interface FilterState {
  priceRange: number[];
  yearRange: number[];
  mileageRange: number[];
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  colors: string[];
  registrationCities: string[];
  locations: string[];
  engineCCRange: number[];
}

interface FilterSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onApply: (filters: FilterState) => void;
}

const FilterSidebar = ({ isOpen = true, onClose, onApply }: FilterSidebarProps) => {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 50000000],
    yearRange: [1980, 2025],
    mileageRange: [0, 1000000],
    makes: [],
    bodyTypes: [],
    fuelTypes: [],
    transmissions: [],
    colors: [],
    registrationCities: [],
    locations: [],
    engineCCRange: [600, 6000],
  });

  const makes = ["Suzuki", "Toyota", "Honda", "Daihatsu", "Kia", "Hyundai", "Changan", "MG", "Audi", "BMW", "Mercedes", "Nissan", "Mitsubishi", "Ford", "Tesla"];
  const bodyTypes = ["Sedan", "SUV", "Hatchback", "Micro Van", "Crossover", "Truck", "Coupe", "Convertible"];
  const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"];
  const transmissions = ["Automatic", "Manual"];
  const colors = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Gold", "Green", "Bronze"];
  const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Faisalabad", "Multan", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];
  const locations = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Faisalabad", "Multan", "Quetta", "Hyderabad", "Abbottabad", "Bahawalpur"];

  const handleCheckboxChange = (category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category] as string[];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleApply = () => {
    onApply(filters);
    if (onClose) onClose();
  };

  const handleReset = () => {
    const resetState = {
      priceRange: [0, 50000000],
      yearRange: [1980, 2025],
      mileageRange: [0, 1000000],
      makes: [],
      bodyTypes: [],
      fuelTypes: [],
      transmissions: [],
      colors: [],
      registrationCities: [],
      locations: [],
      engineCCRange: [600, 6000],
    };
    setFilters(resetState);
    onApply(resetState);
  };

  return (
    <div className={`bg-card rounded-xl border border-border/50 p-4 shadow-premium ${isOpen ? "block" : "hidden lg:block"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-base text-foreground">Filters</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Price Range</h4>
        <Slider
          defaultValue={[0, 50000000]}
          max={50000000}
          step={50000}
          className="mb-3"
          value={filters.priceRange}
          onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>PKR {filters.priceRange[0].toLocaleString()}</span>
          <span>PKR {filters.priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Year Range */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Year</h4>
        <Slider
          defaultValue={[1980, 2025]}
          min={1980}
          max={2025}
          step={1}
          className="mb-3"
          value={filters.yearRange}
          onValueChange={(val) => setFilters(prev => ({ ...prev, yearRange: val }))}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filters.yearRange[0]}</span>
          <span>{filters.yearRange[1]}</span>
        </div>
      </div>

      {/* Mileage Range */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Mileage</h4>
        <Slider
          defaultValue={[0, 1000000]}
          min={0}
          max={1000000}
          step={1000}
          className="mb-3"
          value={filters.mileageRange}
          onValueChange={(val) => setFilters(prev => ({ ...prev, mileageRange: val }))}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filters.mileageRange[0].toLocaleString()} km</span>
          <span>{filters.mileageRange[1].toLocaleString()} km</span>
        </div>
      </div>

      {/* Make */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Make</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {makes.map((make) => (
            <label key={make} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.makes.includes(make)}
                onCheckedChange={() => handleCheckboxChange("makes", make)}
                className="border-muted-foreground/30 data-[state=checked]:bg-primary"
              />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                {make}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Engine CC */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Engine Capacity (CC)</h4>
        <Slider
          defaultValue={[600, 6000]}
          min={600}
          max={6000}
          step={50}
          className="mb-3"
          value={filters.engineCCRange}
          onValueChange={(val) => setFilters(prev => ({ ...prev, engineCCRange: val }))}
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filters.engineCCRange[0]} cc</span>
          <span>{filters.engineCCRange[1]} cc</span>
        </div>
      </div>

      {/* Body Type */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Body Type</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {bodyTypes.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.bodyTypes.includes(type)}
                onCheckedChange={() => handleCheckboxChange("bodyTypes", type)}
                className="border-muted-foreground/30 data-[state=checked]:bg-primary"
              />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Transmission</h4>
        <div className="space-y-2">
          {transmissions.map((trans) => (
            <label key={trans} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.transmissions.includes(trans)}
                onCheckedChange={() => handleCheckboxChange("transmissions", trans)}
                className="border-muted-foreground/30 data-[state=checked]:bg-primary"
              />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                {trans}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Fuel Type</h4>
        <div className="space-y-2">
          {fuelTypes.map((fuel) => (
            <label key={fuel} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.fuelTypes.includes(fuel)}
                onCheckedChange={() => handleCheckboxChange("fuelTypes", fuel)}
                className="border-muted-foreground/30 data-[state=checked]:bg-primary"
              />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                {fuel}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Registration City */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Registration City</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {cities.map((city) => (
            <label key={city} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.registrationCities.includes(city)}
                onCheckedChange={() => handleCheckboxChange("registrationCities", city)}
                className="border-muted-foreground/30 data-[state=checked]:bg-primary"
              />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                {city}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">Color</h4>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <label key={color} className="cursor-pointer group relative">
              <Checkbox
                checked={filters.colors.includes(color)}
                onCheckedChange={() => handleCheckboxChange("colors", color)}
                className="sr-only"
              />
              <div
                className={`w-7 h-7 rounded-full border border-border shadow-sm transition-all ${filters.colors.includes(color) ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: color.toLowerCase() }}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-white px-1.5 py-0.5 rounded z-10">
                {color}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 sticky bottom-0 bg-card pt-2 mt-4 border-t border-border/50">
        <Button variant="outline" size="sm" className="flex-1 rounded-lg h-9" onClick={handleReset}>
          Reset
        </Button>
        <Button size="sm" className="flex-1 rounded-lg h-9" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </div>
  );
};

export default FilterSidebar;
