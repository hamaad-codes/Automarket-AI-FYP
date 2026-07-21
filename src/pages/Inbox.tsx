import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "@/config/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  User, 
  Phone, 
  Car, 
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";

const Inbox = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationParam = searchParams.get("conversationId");

  // Chat Data States
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // UI & Loading States
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Refs for UI manipulation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Quick reply templates
  const quickReplies = [
    "Is the price negotiable?",
    "Can I inspect the car this weekend?",
    "Are all documents original and clear?",
    "Has the car been in any accidents?",
  ];

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user & conversations on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUser(user);

    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
          headers: { "x-auth-token": token },
        });

        if (!res.ok) throw new Error("Failed to fetch conversations");

        const data = await res.json();
        setConversations(data);

        // Auto-select conversation if query param is present
        if (conversationParam) {
          const matched = data.find((c: any) => c._id === conversationParam);
          if (matched) {
            setActiveConversation(matched);
          }
        } else if (data.length > 0) {
          // Default to first conversation
          setActiveConversation(data[0]);
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Inbox Error",
          description: "Failed to load chats. Please reload.",
          variant: "destructive",
        });
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [conversationParam, toast]);

  // Initialize Socket.io Connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket.io connected in chat window! ID:", socket.id);
    });

    socket.on("new_message", (message: any) => {
      console.log("Received new message from socket:", message);
      // Append if it belongs to current active conversation
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === message.conversation) {
            return { ...c, lastMessage: message.text, updatedAt: message.createdAt };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

      setMessages((prev) => {
        if (prev.length > 0 && prev[0].conversation === message.conversation) {
          // Check for duplicate message ID
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        }
        return prev;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch messages whenever the active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Join Socket.io room for the active conversation
    if (socketRef.current) {
      socketRef.current.emit("join_room", activeConversation._id);
      console.log(`Joined Socket.io Chat Room: ${activeConversation._id}`);
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${activeConversation._id}/messages`, {
          headers: { "x-auth-token": token },
        });

        if (!res.ok) throw new Error("Failed to fetch messages");

        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversation, toast]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = textToSend || inputText;
    if (!finalMsg.trim() || !activeConversation) return;

    setSendingMessage(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!textToSend) setInputText("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${activeConversation._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ text: finalMsg }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();

      // Update active list locally so it scrolls/adds instantly
      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === activeConversation._id) {
            return { ...c, lastMessage: finalMsg, updatedAt: data.createdAt };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    } catch (err) {
      console.error(err);
      toast({
        title: "Send Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper to extract the counterpart user details from a conversation
  const getCounterpart = (convo: any) => {
    if (!convo || !currentUser) return null;
    const currentUserId = currentUser.id || currentUser._id;
    return convo.participants.find((p: any) => p._id !== currentUserId);
  };

  // Helper to format timestamps
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      <Header />

      {/* Main Inbox Container */}
      <main className="flex-1 flex max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] overflow-hidden">
        <div className="w-full flex bg-card border border-border/50 rounded-3xl shadow-premium overflow-hidden h-full">
          
          {/* LEFT PANEL: Chat List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-border/50 flex flex-col h-full bg-muted/10 ${
            activeConversation ? "hidden md:flex" : "flex"
          }`}>
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card">
              <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Conversations
              </h2>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {conversations.length} total
              </span>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/20 p-2 space-y-1">
              {loadingConversations ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading chats...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Inquire on listings to initiate chats.</p>
                </div>
              ) : (
                conversations.map((convo) => {
                  const counterpart = getCounterpart(convo);
                  const isSelected = activeConversation?._id === convo._id;
                  const counterpartInitials = counterpart?.name?.substring(0, 2) || "AM";

                  return (
                    <button
                      key={convo._id}
                      onClick={() => {
                        setActiveConversation(convo);
                        setSearchParams({ conversationId: convo._id });
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all duration-300 flex items-start gap-3.5 relative overflow-hidden group ${
                        isSelected 
                          ? "bg-primary text-primary-foreground shadow-premium font-medium" 
                          : "hover:bg-muted bg-card border border-border/40"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {counterpart?.profilePicture ? (
                          <img 
                            src={counterpart.profilePicture} 
                            alt={counterpart.name} 
                            className="w-11 h-11 rounded-full object-cover border-2 border-background shadow-sm"
                          />
                        ) : (
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm uppercase ${
                            isSelected ? "bg-primary-foreground/20 text-white" : "bg-primary/10 text-primary"
                          }`}>
                            {counterpartInitials}
                          </div>
                        )}
                      </div>

                      {/* Content Preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className={`truncate text-sm font-semibold ${isSelected ? "text-white" : "text-foreground"}`}>
                            {counterpart?.name || "AutoMarket User"}
                          </span>
                          <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                            {formatTime(convo.updatedAt)}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${isSelected ? "text-white/90" : "text-foreground/80"} mb-1`}>
                          {convo.car?.title || "Car Listing"}
                        </p>
                        <p className={`text-[11px] truncate leading-normal ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                          {convo.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Chat Area */}
          <div className={`flex-1 flex flex-col h-full bg-card ${
            !activeConversation ? "hidden md:flex items-center justify-center" : "flex"
          }`}>
            {activeConversation ? (
              <>
                {/* Chat Header details */}
                <div className="p-4 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card z-10 shadow-sm">
                  {/* Counterpart info */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden -ml-2 rounded-full"
                      onClick={() => setActiveConversation(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="relative">
                      {getCounterpart(activeConversation)?.profilePicture ? (
                        <img
                          src={getCounterpart(activeConversation).profilePicture}
                          alt={getCounterpart(activeConversation).name}
                          className="w-10 h-10 rounded-full object-cover border border-border shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase text-sm">
                          {getCounterpart(activeConversation)?.name?.substring(0, 2) || "AM"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        {getCounterpart(activeConversation)?.name || "AutoMarket User"}
                      </h3>
                      {getCounterpart(activeConversation)?.phone && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="w-3 h-3" />
                          {getCounterpart(activeConversation).phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connected Listing widget */}
                  {activeConversation.car && (
                    <div className="flex items-center gap-3 bg-secondary/30 hover:bg-secondary/50 border border-border/50 p-2 rounded-2xl max-w-xs md:max-w-md transition-all duration-300 group">
                      <img
                        src={
                          activeConversation.car.image || 
                          "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80"
                        }
                        alt={activeConversation.car.title}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {activeConversation.car.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          PKR {activeConversation.car.price?.toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 shrink-0 hover:bg-primary/10" asChild>
                        <Link to={`/vehicles/${activeConversation.car._id}`}>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Message display panel */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-muted/5">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Loading chat messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                      <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm font-semibold text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground">Send a message to kick off the negotiation.</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOutgoing = msg.sender._id === currentUser?.id || msg.sender._id === currentUser?._id;
                      return (
                        <div
                          key={msg._id || index}
                          className={`flex items-start gap-2.5 max-w-[80%] ${
                            isOutgoing ? "ml-auto flex-row-reverse" : "mr-auto"
                          }`}
                        >
                          {/* Avatar */}
                          {!isOutgoing && (
                            <div className="relative mt-0.5 shrink-0">
                              {msg.sender.profilePicture ? (
                                <img
                                  src={msg.sender.profilePicture}
                                  alt={msg.sender.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-xs uppercase">
                                  {msg.sender.name?.substring(0, 2) || "AM"}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bubble */}
                          <div className="space-y-1">
                            <div
                              className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-300 ${
                                isOutgoing
                                  ? "bg-primary text-primary-foreground rounded-tr-none"
                                  : "bg-muted text-foreground rounded-tl-none border border-border/20"
                              }`}
                            >
                              <p className="whitespace-pre-line">{msg.text}</p>
                            </div>
                            <div
                              className={`text-[9px] text-muted-foreground flex items-center gap-1.5 ${
                                isOutgoing ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {isOutgoing && (
                                <CheckCircle className={`w-3.5 h-3.5 ${msg.read ? "text-primary fill-primary/10" : "text-muted-foreground/50"}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Helpers */}
                {messages.length > 0 && (
                  <div className="p-3 bg-muted/10 border-t border-border/30 flex items-center gap-2 overflow-x-auto select-none no-scrollbar">
                    {quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(reply)}
                        disabled={sendingMessage}
                        className="px-4 py-2 text-xs font-medium bg-card hover:bg-primary hover:text-white border border-border/50 rounded-full transition-all shrink-0 hover:shadow-sm"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat composer input */}
                <div className="p-4 border-t border-border/50 bg-card">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-3"
                  >
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message to negotiate details..."
                      disabled={sendingMessage}
                      className="flex-1 h-12 rounded-2xl px-4 bg-muted border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all duration-300"
                    />
                    <Button
                      type="submit"
                      disabled={sendingMessage || !inputText.trim()}
                      className="h-12 w-12 rounded-2xl shadow-premium shrink-0 bg-primary hover:bg-primary/90 text-white"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-2 shadow-sm">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground">Your Chat Inbox</h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Select an active conversation from the sidebar list or browse car listings and click "Send Inquiry" to negotiate.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inbox;
