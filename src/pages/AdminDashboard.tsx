import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Check, 
  X, 
  Eye, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Mail,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "users">("pending");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = '';
      if (activeTab === 'users') {
        url = `${API_BASE_URL}/api/auth/users`;
      } else {
        const status = activeTab === 'approved' ? 'active' : activeTab;
        url = `${API_BASE_URL}/api/cars/admin/list?status=${status}`;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { 'x-auth-token': token || '' }
      });
      const resData = await response.json();
      setData(resData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: `Failed to fetch ${activeTab}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (carId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars/${carId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({ 
        title: "Success", 
        description: `Listing ${newStatus === 'active' ? 'approved' : 'rejected'} successfully` 
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update listing status", variant: "destructive" });
    }
  };

  const tabs = [
    { id: "pending", label: "Pending", icon: Clock },
    { id: "approved", label: "Approved", icon: CheckCircle },
    { id: "rejected", label: "Rejected", icon: XCircle },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Manage platform users and review vehicle listings.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-premium"
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <Badge variant="secondary" className={`ml-2 ${activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : ""}`}>
                {activeTab === tab.id ? data.length : ""}
              </Badge>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-premium overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                {activeTab === 'users' ? (
                  <>
                    <TableHead className="font-heading font-semibold">User</TableHead>
                    <TableHead className="font-heading font-semibold">Contact</TableHead>
                    <TableHead className="font-heading font-semibold">Role</TableHead>
                    <TableHead className="font-heading font-semibold">Joined</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-heading font-semibold">Vehicle</TableHead>
                    <TableHead className="font-heading font-semibold">Seller</TableHead>
                    <TableHead className="font-heading font-semibold">Price</TableHead>
                    <TableHead className="font-heading font-semibold">Status</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Actions</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTab === 'users' ? (
                data.map((user) => (
                  <TableRow key={user._id} className="hover:bg-muted/50 border-border/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={user.role === 'admin' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : ""}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                data.map((car) => (
                  <TableRow key={car._id} className="hover:bg-muted/50 border-border/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img src={car.image || '/placeholder-car.jpg'} alt={car.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{car.title}</p>
                          <p className="text-xs text-muted-foreground">{car.make} {car.model} ({car.year})</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{car.sellerName || car.user?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{car.sellerEmail || car.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-primary">PKR {car.price?.toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${
                          car.status === 'active' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                          car.status === 'pending' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                          "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {car.status === 'active' ? 'Approved' : car.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/vehicles/${car._id}`)}
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        {car.status !== 'active' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-green-500/10 hover:text-green-600"
                            onClick={() => handleStatusUpdate(car._id, 'active')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {car.status !== 'rejected' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleStatusUpdate(car._id, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">No {activeTab} found</h3>
              <p className="text-muted-foreground">Try switching to a different tab.</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading {activeTab}...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
