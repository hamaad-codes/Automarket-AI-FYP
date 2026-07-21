import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu, Plus, Package, User, LogOut, X, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import SearchBar from "./SearchBar";
import { API_BASE_URL } from "@/config/api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Check for user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Invalid user data");
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { 'x-auth-token': token }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
 
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);
 
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
 
    try {
      await Promise.all(unread.map(n => 
        fetch(`${API_BASE_URL}/api/notifications/read/${n._id}`, {
          method: 'POST',
          headers: { 'x-auth-token': token }
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/buy-now", label: "Buy Now" },
    { path: "/auctions", label: "Auctions" },
    ...(user ? [{ path: "/inventory", label: "Inventory", icon: Package }] : []),
    ...(user?.role === 'admin' ? [{ path: "/admin", label: "Admin Panel" }] : []),
  ];

  return (
    <header className="bg-background/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-racing rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative h-9 w-9 bg-primary rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              Auto<span className="text-primary">Market</span>
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group/nav flex items-center gap-1.5 font-medium text-sm transition-all duration-300 relative py-2 px-1 hover:text-primary ${isActive(link.path) ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ease-out ${isActive(link.path) ? "w-full" : "w-0 group-hover/nav:w-full"}`} />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full transition-all duration-300 ${showSearch ? 'bg-primary text-white scale-110 rotate-90' : 'hover:bg-primary/10 hover:text-primary'}`}
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              className="px-5 h-10 rounded-xl font-semibold border-border/50 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
              asChild
            >
              <Link to="/create-listing">
                <Plus className="w-4 h-4 mr-1.5" />
                Sell Car
              </Link>
            </Button>

            {user && (
              <DropdownMenu onOpenChange={(open) => open && handleMarkAllRead()}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary relative"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent-racing text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card border-border shadow-premium max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-border/50 flex justify-between items-center bg-muted/30">
                    <span className="font-heading font-bold text-sm">Notifications</span>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                        {notifications.filter(n => !n.read).length} New
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n._id} className={`p-4 border-b border-border/30 flex flex-col items-start gap-1 hover:bg-muted/30 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                        <p className={`text-xs text-foreground leading-relaxed ${!n.read ? 'font-medium' : ''}`}>{n.message}</p>
                        <span className="text-[9px] text-muted-foreground">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No notifications yet.
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary relative"
                asChild
              >
                <Link to="/inbox">
                  <MessageSquare className="w-5 h-5" />
                </Link>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="px-4 h-10 rounded-xl font-semibold hover:bg-primary/10 transition-all duration-300 flex items-center gap-2"
                  >
                    <User className="h-5 w-5 text-primary" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-premium">
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link to="/profile" className="flex items-center w-full">
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link to="/inbox" className="flex items-center w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      My Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="px-6 h-10 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                asChild
              >
                <Link to="/login">Sign In</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 circle-button hover:bg-muted"
              onClick={toggleTheme}
            >
              {isDark ? '🌞' : '🌙'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar Slide Down */}
        {showSearch && (
          <div className="py-6 border-t border-border/40 animate-in slide-in-from-top-5 duration-300">
            <SearchBar isHeader={true} />
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 font-medium px-3 py-2.5 rounded-xl transition-colors ${isActive(link.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
              <Link
                to="/create-listing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 font-medium px-3 py-2.5 rounded-xl text-primary bg-primary/10"
              >
                <Plus className="w-4 h-4" />
                Create Listing
              </Link>
              <div className="flex gap-3 pt-3 mt-2 border-t border-border">
                {user ? (
                  <Button onClick={handleSignOut} variant="outline" className="flex-1 rounded-xl">
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button className="flex-1 rounded-xl" asChild>
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl" asChild>
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;