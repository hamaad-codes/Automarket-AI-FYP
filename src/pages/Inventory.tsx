import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Car,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Inventory = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [selectedAuctionBids, setSelectedAuctionBids] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"listings" | "liked">("listings");

  useEffect(() => {
    fetchListings();
  }, [page, activeTab]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      const userId = user.id || user._id;

      if (activeTab === 'listings') {
        let url = `${API_BASE_URL}/api/cars?page=${page}&limit=10`;
        if (userId) {
          url += `&user=${userId}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setListings(data.cars);
        setTotalPages(data.totalPages);
        setTotalListings(data.totalCars);
      } else {
        if (!token) {
          setListings([]);
          setTotalListings(0);
          setLoading(false);
          return;
        }

        const favRes = await fetch(`${API_BASE_URL}/api/auth/favorites`, {
          headers: { 'x-auth-token': token }
        });

        if (!favRes.ok) throw new Error("Failed to fetch favorites");

        const favData = await favRes.json();
        const validListings = Array.isArray(favData) ? favData.filter(item => item && typeof item === 'object') : [];
        setListings(validListings);
        setTotalPages(1);
        setTotalListings(validListings.length);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/cars/${carId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token || '' }
      });

      if (!res.ok) throw new Error("Failed to delete listing");

      toast({ title: "Success", description: "Listing deleted successfully" });
      fetchListings();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" });
    }
  };

  const fetchAuctionBids = async (carId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auctions/${carId}`);
      const data = await res.json();
      setSelectedAuctionBids(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to fetch bids" });
    }
  };

  const handleAcceptSpecificBid = async (auctionId: string, bidId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auctions/${auctionId}/accept-bid/${bidId}`, {
        method: 'POST',
        headers: { 'x-auth-token': token || '' }
      });
      if (!res.ok) throw new Error("Failed to accept bid");
      toast({ title: "Success", description: "Bid accepted!" });
      setSelectedAuctionBids(null);
      fetchListings();
    } catch (err) {
      toast({ title: "Error", description: "Failed to accept bid", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-600 border-green-500/20",
      auction: "bg-accent-gold/10 text-accent-gold border-accent-gold/20",
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      sold: "bg-muted text-muted-foreground border-border",
      draft: "bg-muted text-muted-foreground border-border",
    };

    return (
      <Badge variant="outline" className={`${styles[status]} capitalize font-medium`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              My <span className="text-gradient">Inventory</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your vehicle listings, track performance, and monitor sales
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setActiveTab("listings"); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                My Listings
              </button>
              <button
                onClick={() => { setActiveTab("liked"); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'liked' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                Liked Cars
              </button>
            </div>
          </div>
          <Button className="rounded-xl px-6 shadow-premium hover:shadow-premium-lg transition-all" asChild>
            <Link to="/create-listing">
              <Plus className="w-5 h-5 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6 shadow-premium animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search your listings..."
                className="pl-12 h-11 rounded-xl border-border/50"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-40 h-11 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="auction">In Auction</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-40 h-11 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy-now">Buy Now</SelectItem>
                <SelectItem value="auction">Auction</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-premium overflow-hidden animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-heading font-semibold">Vehicle</TableHead>
                <TableHead className="font-heading font-semibold">Price / Bid</TableHead>
                <TableHead className="font-heading font-semibold">Status</TableHead>
                <TableHead className="font-heading font-semibold hidden md:table-cell">Views</TableHead>
                <TableHead className="font-heading font-semibold hidden lg:table-cell">Inquiries</TableHead>
                <TableHead className="font-heading font-semibold hidden lg:table-cell">Created</TableHead>
                <TableHead className="font-heading font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing, index) => (
                <TableRow
                  key={listing._id}
                  className="hover:bg-muted/50 border-border/50 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{listing.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {listing.type === "auction" && listing.timeLeft
                            ? `⏱ ${listing.timeLeft} left`
                            : listing.type.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-heading font-bold text-foreground">
                        PKR {listing.price?.toLocaleString()} 
                        <span className="text-xs text-muted-foreground ml-2">(Base)</span>
                      </p>
                      {listing.type === 'auction' && (
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                            onClick={() => fetchAuctionBids(listing._id)}
                            disabled={listing.status === 'sold'}
                          >
                            View Bids
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(listing.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground">{listing.views?.toLocaleString() || 0}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-muted-foreground">{listing.inquiries || 0}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/vehicles/${listing._id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Listing
                        </DropdownMenuItem>
                        {activeTab === 'listings' && (
                          <>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/edit-listing/${listing._id}`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-accent-racing focus:text-accent-racing" onClick={() => handleDelete(listing._id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {listings.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first listing to start selling
              </p>
              <Button className="rounded-xl" asChild>
                <Link to="/create-listing">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(page - 1) * 10 + 1}-{Math.min(page * 10, totalListings)}</span> of{" "}
            <span className="font-medium text-foreground">{totalListings}</span> listings
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </main>

      {/* Bids Modal Overlay */}
      {selectedAuctionBids && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border/50 shadow-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-xl font-bold">Auction Bids: {selectedAuctionBids.title}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAuctionBids(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedAuctionBids.bids?.length > 0 ? (
                selectedAuctionBids.bids.map((bid: any) => (
                  <div key={bid._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <div>
                      <p className="font-semibold text-foreground">PKR {bid.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">User ID: {bid.user?.name || bid.user}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                      onClick={() => handleAcceptSpecificBid(selectedAuctionBids._id, bid._id)}
                    >
                      Accept
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No bids received yet.
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
              <p className="text-sm font-medium">Base Price: PKR {selectedAuctionBids.minBid?.toLocaleString()}</p>
              <Button variant="outline" onClick={() => setSelectedAuctionBids(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
