import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  title: string;
  subtitle: string;
  listingCount: string;
  image: string;
  delay?: number;
}

const CategoryCard = ({ title, subtitle, listingCount, image, delay = 0 }: CategoryCardProps) => {
  // Let's build a path for the category to filter by type/search query
  const filterPath = `/buy-now?search=${encodeURIComponent(title.replace("Electric Vehicles", "Electric").replace("Luxury Cars", "Luxury"))}`;

  return (
    <Link to={filterPath} className="block w-full">
      <div
        className="group relative bg-card h-64 rounded-3xl overflow-hidden cursor-pointer shadow-premium hover:shadow-[0_20px_45px_-15px_rgba(59,130,246,0.35)] border border-border/40 hover:border-primary/30 transition-all duration-500 will-change-transform hover:-translate-y-1.5 hover:rotate-[0.5deg] animate-fade-in transform-gpu flex flex-col justify-end p-6"
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Deep Dark Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10 opacity-90 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-2 text-left">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            {listingCount} listings
          </span>
          <h3 className="text-2xl font-heading font-extrabold text-white mt-2">
            {title}
          </h3>
          <p className="text-xs text-white/70 line-clamp-2 max-w-[90%] font-medium">
            {subtitle}
          </p>
          <div className="pt-2 flex items-center text-xs text-blue-400 font-bold tracking-wide transition-all group-hover:text-blue-300">
            <span>Browse Category</span>
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1.5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;