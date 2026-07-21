import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "@/config/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
    MapPin,
    Calendar,
    Gauge,
    Fuel,
    Settings,
    Shield,
    Clock,
    ChevronLeft,
    Share2,
    Heart,
    Phone,
    MessageSquare,
    CheckCircle2,
    Car,
    Wind
} from "lucide-react";

const VehicleDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [bidAmount, setBidAmount] = useState("");
    const [auctionData, setAuctionData] = useState<any>(null);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/cars/${id}`);
                if (!res.ok) throw new Error("Vehicle not found");
                const data = await res.json();
                setVehicle(data);

                // Fetch auction data if it's an auction
                if (data.type === 'auction') {
                    const aucRes = await fetch(`${API_BASE_URL}/api/auctions/${id}`);
                    if (aucRes.ok) {
                        const aucData = await aucRes.json();
                        setAuctionData(aucData);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicle();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        
        const token = localStorage.getItem("token");
        const socket = io(SOCKET_URL, {
            auth: { token }
        });

        socket.on("connect", () => {
            console.log("Socket.io connected successfully! Socket ID:", socket.id);
            socket.emit("join_room", id);
            console.log(`Joined Room: ${id}`);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket.io connection error:", error.message);
        });

        socket.on("bid_placed", (data) => {
            console.log("Real-time bid received:", data);
            toast({
                title: "Live Bid Updated!",
                description: `New highest bid: PKR ${data.currentBid.toLocaleString()}`,
            });
            setAuctionData((prev: any) => {
                const base = prev || {};
                return {
                    ...base,
                    currentBid: data.currentBid,
                    bids: data.bids
                };
            });
        });

        return () => {
            console.log("Disconnecting Socket.io...");
            socket.disconnect();
        };
    }, [id]);

    const handlePlaceBid = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast({ title: "Login Required", description: "Please login to place a bid", variant: "destructive" });
            return;
        }

        const amount = Number(bidAmount);
        if (!amount || amount <= (auctionData?.currentBid || 0)) {
            toast({ title: "Invalid Bid", description: `Bid must be higher than PKR ${(auctionData?.currentBid || vehicle.price).toLocaleString()}`, variant: "destructive" });
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auctions/${id}/bid`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ amount })
            });

            if (!res.ok) throw new Error("Failed to place bid");

            toast({ title: "Success", description: "Bid placed successfully!" });
            setBidAmount("");
            const updated = await res.json();
            setAuctionData(updated);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to place bid", variant: "destructive" });
        }
    };

    const handleSendInquiry = async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            toast({ 
                title: "Login Required", 
                description: "Please login to contact the seller", 
                variant: "destructive" 
            });
            return;
        }

        const currentUser = JSON.parse(userStr);
        const sellerId = vehicle.user?._id || vehicle.user;

        if (!sellerId) {
            toast({ 
                title: "Error", 
                description: "Seller details not available for this listing", 
                variant: "destructive" 
            });
            return;
        }

        const sellerIdStr = typeof sellerId === 'object' ? sellerId._id || sellerId.id : sellerId;
        const currentUserIdStr = currentUser.id || currentUser._id;

        if (currentUserIdStr === sellerIdStr) {
            toast({ 
                title: "Inquiry Not Allowed", 
                description: "You cannot start an inquiry on your own listing", 
                variant: "destructive" 
            });
            return;
        }

        try {
            // 1. Create or retrieve conversation
            const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    sellerId: sellerIdStr,
                    carId: vehicle._id
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.msg || "Failed to start conversation");
            }

            const conversation = await res.json();

            // 2. Send default message if it's a new conversation
            if (conversation.lastMessage === 'Inquiry started') {
                const msgRes = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversation._id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({
                        text: `Hi, I am interested in your ${vehicle.title}. Is it still available?`
                    })
                });
                
                if (msgRes.ok) {
                    console.log("Inquiry message sent successfully!");
                }
            }

            // 3. Navigate to inbox
            navigate(`/inbox?conversationId=${conversation._id}`);

        } catch (err: any) {
            console.error(err);
            toast({ 
                title: "Error", 
                description: err.message || "Failed to start inquiry", 
                variant: "destructive" 
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-20">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-pulse flex flex-col items-center">
                        <Car className="w-12 h-12 text-primary opacity-50 mb-4" />
                        <p className="text-muted-foreground">Loading vehicle details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="min-h-screen bg-background pb-20">
                <Header />
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <h1 className="text-2xl font-bold">Vehicle Not Found</h1>
                    <Button asChild>
                        <Link to="/buy-now">Return to Listings</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Use features or defaults
    const features = vehicle.features || [
        "Leather Seats", "Sunroof", "Navigation System", "Bluetooth",
        "Backup Camera", "Heated Seats", "Alloy Wheels", "Apple CarPlay"
    ];

    // Parse year if string
    const year = vehicle.year || 2020;

    // Images array (fallback if single image)
    const images = vehicle.images && vehicle.images.length > 0
        ? vehicle.images
        : [vehicle.image || "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80"];

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb & Navigation */}
                <div className="flex items-center justify-between mb-6 animate-fade-in">
                    <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all" asChild>
                        <Link to="/buy-now">
                            <ChevronLeft className="w-4 h-4" />
                            Back to Listings
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-full">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full">
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Images & Details */}
                    <div className="lg:col-span-2 space-y-8 animate-slide-in-left">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-muted rounded-3xl overflow-hidden shadow-premium">
                                <img
                                    src={images[activeImage]}
                                    alt={vehicle.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-background/80 backdrop-blur text-foreground border-white/20">
                                        {year} model
                                    </Badge>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {images.map((img: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all ${activeImage === idx ? "ring-2 ring-primary ring-offset-2" : "opacity-70 hover:opacity-100"
                                                }`}
                                        >
                                            <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Vehicle Header Mobile (Visible on desktop too within col) */}
                        <div className="space-y-4">
                            <div>
                                <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{vehicle.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                                    <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
                                        <Gauge className="w-4 h-4 text-primary" />
                                        <span>{vehicle.mileage} miles</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
                                        <Fuel className="w-4 h-4 text-primary" />
                                        <span>{vehicle.fuelType || "Petrol"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
                                        <Settings className="w-4 h-4 text-primary" />
                                        <span>{vehicle.transmission || "Automatic"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span>{vehicle.location || "Islamabad, PK"}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Description */}
                            <div>
                                <h3 className="font-heading font-semibold text-lg mb-3">Description</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {vehicle.description || "No description available for this vehicle."}
                                </p>
                            </div>

                            {/* Features Grid */}
                            <div>
                                <h3 className="font-heading font-semibold text-lg mb-3">Key Features</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {features.map((feature: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                            </div>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Pricing & Contact */}
                    <div className="lg:col-span-1 animate-slide-in-right">
                        <div className="sticky top-28 space-y-6">
                            {/* Price Card */}
                            <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-premium">
                                <div className="mb-6 space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">Base Price</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-md font-semibold text-muted-foreground">PKR</span>
                                            <span className="font-heading text-2xl font-bold text-muted-foreground">
                                                {vehicle.price?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-primary font-medium uppercase tracking-wide mb-1">Current Highest Bid</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-semibold text-primary">PKR</span>
                                            <span className="font-heading text-4xl font-bold text-foreground">
                                                {(auctionData?.currentBid || vehicle.price)?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {vehicle.type === 'auction' && (
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground bg-accent-racing/10 p-2 rounded-lg border border-accent-racing/20">
                                            <Clock className="w-4 h-4 text-accent-racing" />
                                            <span className="text-accent-racing font-medium">Live Auction • Place your best offer!</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {vehicle.type === 'auction' ? (
                                        auctionData?.status === 'sold' ? (
                                            <div className="bg-accent-racing/10 border border-accent-racing/20 p-4 rounded-xl text-center">
                                                <p className="text-accent-racing font-bold text-lg uppercase tracking-wider">Sold</p>
                                                <p className="text-sm text-muted-foreground mt-1">This auction has ended.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-muted-foreground">Place your bid</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">PKR</span>
                                                        <input 
                                                            type="number" 
                                                            value={bidAmount}
                                                            onChange={(e) => setBidAmount(e.target.value)}
                                                            placeholder={`Min: ${((auctionData?.currentBid || vehicle.price) + 1000).toLocaleString()}`}
                                                            className="w-full h-12 pl-12 pr-4 bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={handlePlaceBid}
                                                    className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                                                >
                                                    Place Bid
                                                </Button>
                                            </>
                                        )
                                    ) : (
                                        <Button onClick={handleSendInquiry} className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
                                            <MessageSquare className="w-5 h-5 mr-2" />
                                            Send Inquiry
                                        </Button>
                                    )}
                                    <Button variant="outline" className="w-full h-12 text-lg font-semibold rounded-xl">
                                        <Phone className="w-5 h-5 mr-2" />
                                        Call Seller
                                    </Button>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-secondary/30 py-3 rounded-lg">
                                    <Shield className="w-3 h-3 text-primary" />
                                    <span>Verified Seller • Secure Transaction</span>
                                </div>
                            </div>

                            {/* Seller Info */}
                            <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
                                <h3 className="font-heading font-semibold mb-4">Seller Information</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-accent-racing/10 flex items-center justify-center font-bold text-accent-racing text-lg uppercase">
                                        {vehicle.user?.name ? vehicle.user.name.substring(0, 2) : "AM"}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{vehicle.user?.name || "AutoMarket Verified"}</p>
                                        <p className="text-sm text-muted-foreground">{vehicle.user?.phone ? `Contact: ${vehicle.user.phone}` : "Member since 2024"}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Response Rate</span>
                                        <span className="font-medium text-green-600">98%</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Location</span>
                                        <span className="font-medium">{vehicle.location || "Islamabad"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VehicleDetails;
