import Header from "@/components/Header";
import { API_BASE_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  Car,
  Banknote,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  Camera,
  X,
  Mic,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CreateListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [isAuction, setIsAuction] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<{
    predictedPrice: number;
    minPrice: number;
    maxPrice: number;
  } | null>(null);
  const [fetchingAiPrice, setFetchingAiPrice] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleVoiceAutofill = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const formDataObj = new FormData();
          formDataObj.append('audio', blob, 'voice.webm');

          setIsProcessingVoice(true);
          toast({
            title: "AI Voice Assistant",
            description: "Extracting car details from your voice note...",
          });

          try {
            const response = await fetch(`${API_BASE_URL}/api/cars/extract-from-voice`, {
              method: 'POST',
              body: formDataObj,
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.message || 'Failed to process voice note');
            }

            const extracted = result.data;
            if (extracted) {
              setFormData(prev => ({
                ...prev,
                make: extracted.make || prev.make,
                model: extracted.model || prev.model,
                year: extracted.year || prev.year,
                bodyType: extracted.bodyType || prev.bodyType,
                mileage: extracted.mileage || prev.mileage,
                fuelType: extracted.fuelType || prev.fuelType,
                transmission: extracted.transmission || prev.transmission,
                exteriorColor: extracted.exteriorColor || prev.exteriorColor,
                price: extracted.price || prev.price,
                title: extracted.title || prev.title,
                description: extracted.description || prev.description,
                location: extracted.location || prev.location
              }));

              toast({
                title: "AI Auto-Filler Success",
                description: `Successfully extracted: ${extracted.year || ""} ${extracted.make || ""} ${extracted.model || ""}. Fields have been populated.`,
              });
            }
          } catch (error: any) {
            console.error('Voice Autofill Error:', error);
            toast({
              title: "AI Voice Assistant Error",
              description: error.message || 'Failed to extract details from voice.',
              variant: "destructive"
            });
          } finally {
            setIsProcessingVoice(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({
          title: "Microphone Access Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "2024",
    bodyType: "",
    mileage: "",
    vin: "",
    fuelType: "",
    transmission: "",
    exteriorColor: "",
    interiorColor: "",
    price: "",
    minBid: "",
    auctionDuration: "3",
    reservePrice: "",
    buyNowPrice: "",
    title: "",
    description: "",
    location: "",
    features: ""
  });

  useEffect(() => {
    if (id) {
      const fetchCar = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/cars/${id}`);
          const data = await res.json();
          if (res.ok && data) {
            setFormData({
              make: data.make || "",
              model: data.model || "",
              year: (data.year || "2024").toString(),
              bodyType: data.bodyType || "",
              mileage: (data.mileage || "").toString(),
              vin: data.vin || "",
              fuelType: data.fuelType || "",
              transmission: data.transmission || "",
              exteriorColor: data.exteriorColor || "",
              interiorColor: data.interiorColor || "",
              price: (data.price || "").toString(),
              minBid: (data.minBid || "").toString(),
              auctionDuration: (data.auctionDuration || "3").toString(),
              reservePrice: (data.reservePrice || "").toString(),
              buyNowPrice: (data.buyNowPrice || "").toString(),
              title: data.title || "",
              description: data.description || "",
              location: data.location || "",
              features: Array.isArray(data.features) ? data.features.join('\n') : ""
            });
            if (data.image) setImages([data.image]);
            setIsAuction(data.type === 'auction');
          }
        } catch (err) {
          console.error("Failed to fetch car", err);
        }
      };
      fetchCar();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep === 3) {
      const fetchAiPrice = async () => {
        try {
          setFetchingAiPrice(true);
          const response = await fetch(`${API_BASE_URL}/api/cars/predict-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              make: formData.make,
              model: formData.model,
              year: Number(formData.year),
              bodyType: formData.bodyType,
              mileage: Number(formData.mileage),
              fuelType: formData.fuelType,
              transmission: formData.transmission,
              color: formData.exteriorColor,
              location: formData.location || "Lahore"
            })
          });
          if (response.ok) {
            const data = await response.json();
            setAiPriceSuggestion(data);
          } else {
            setAiPriceSuggestion(null);
          }
        } catch (error) {
          console.error("Error fetching AI price suggestion:", error);
          setAiPriceSuggestion(null);
        } finally {
          setFetchingAiPrice(false);
        }
      };
      fetchAiPrice();
    }
  }, [currentStep, formData.make, formData.model, formData.year, formData.bodyType, formData.mileage, formData.fuelType, formData.transmission, formData.exteriorColor, formData.location]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.make || !formData.model || !formData.year || !formData.bodyType || !formData.mileage || !formData.fuelType || !formData.transmission || !formData.exteriorColor || !formData.interiorColor) {
        toast({ title: "Validation Error", description: "Please fill all required fields marked with * in Vehicle Information.", variant: "destructive" });
        return false;
      }
    } else if (currentStep === 2) {
      if (images.length === 0) {
        toast({ title: "Validation Error", description: "Please upload at least one photo.", variant: "destructive" });
        return false;
      }
    } else if (currentStep === 3) {
      if (isAuction) {
        if (!formData.minBid || !formData.auctionDuration) {
          toast({ title: "Validation Error", description: "Please fill Starting Bid and Auction Duration.", variant: "destructive" });
          return false;
        }
      } else {
        if (!formData.price) {
          toast({ title: "Validation Error", description: "Please enter an Asking Price.", variant: "destructive" });
          return false;
        }
      }
    } else if (currentStep === 4) {
      if (!formData.title || !formData.description || !formData.location) {
        toast({ title: "Validation Error", description: "Please provide Title, Description, and Location.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const steps = [
    { id: 1, title: "Vehicle Details", icon: Car },
    { id: 2, title: "Photos", icon: ImageIcon },
    { id: 3, title: "Pricing", icon: Banknote },
    { id: 4, title: "Description", icon: FileText },
  ];

  const makes = ["Toyota", "Honda", "Ford", "BMW", "Mercedes-Benz", "Audi", "Tesla", "Porsche", "Chevrolet", "Lexus", "Suzuki", "Kia", "Hyundai", "Nissan", "Mitsubishi"];
  const bodyTypes = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Convertible", "Van", "Wagon"];
  const fuelTypes = ["Gasoline", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid", "Petrol"];
  const transmissions = ["Automatic", "Manual", "CVT", "Semi-Automatic"];
  const colors = ["Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Brown", "Beige", "Gold"];

  const handleImageUpload = () => {
    document.getElementById('file-upload-input')?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/cars/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          throw new Error('Failed to upload image');
        }
        
        const data = await res.json();
        setImages(prev => [...prev, data.url]);
        toast({ title: "Success", description: `${file.name} uploaded successfully!` });
      } catch (err: any) {
        toast({ title: "Upload Error", description: err.message || "Failed to upload image", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePublish = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;

      if (!userId) {
        toast({ title: "Error", description: "You must be logged in to create a listing", variant: "destructive" });
        return;
      }

      const payload = {
        ...formData,
        user: userId,
        sellerName: user.name || "Unknown",
        sellerEmail: user.email || "",
        price: isAuction ? Number(formData.minBid) : Number(formData.price),
        type: isAuction ? 'auction' : 'buy-now',
        images: images,  
        image: images[0] || "", 
        year: Number(formData.year),
        features: formData.features.split('\n').filter(Boolean)
      };

      const token = localStorage.getItem('token');
      const res = await fetch(id ? `${API_BASE_URL}/api/cars/${id}` : `${API_BASE_URL}/api/cars`, {
        method: id ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Failed to ${id ? 'update' : 'create'} listing`);

      toast({ title: "Success", description: `Listing ${id ? 'updated' : 'created'} successfully!` });
      navigate('/inventory');
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: `Failed to ${id ? 'update' : 'create'} listing`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Listing
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            {id ? "Edit Your" : "Create Your"} <span className="text-gradient">Listing</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            List your vehicle in minutes with our intelligent form. Our AI will help optimize your listing for maximum visibility.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 overflow-x-auto pb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (step.id < currentStep || validateStep()) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentStep === step.id
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : currentStep > step.id
                    ? "bg-primary/20 text-primary"
                    : "bg-card border border-border/50 text-muted-foreground hover:border-primary/50"
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === step.id
                    ? "bg-primary-foreground/20"
                    : currentStep > step.id
                      ? "bg-primary/30"
                      : "bg-muted"
                    }`}
                >
                  {step.id}
                </div>
                <span className="hidden md:block font-medium whitespace-nowrap">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-muted-foreground mx-2 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-premium-lg p-6 md:p-8 animate-fade-in">
          {/* Step 1: Vehicle Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-bold text-foreground mb-6">Vehicle Information</h2>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-br from-primary/10 to-accent-racing/5 border border-primary/20 rounded-2xl mb-6">
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    AI Voice Auto-Filler
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Apni car ki details (Make, Model, Year, Transmission, Price, Mileage, etc.) aawaz me bolejn aur AI form automatically fill kar dega!
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    type="button"
                    onClick={handleVoiceAutofill}
                    variant={isRecording ? "destructive" : "default"}
                    className={`rounded-xl flex items-center gap-2 font-semibold shadow-md ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
                    disabled={isProcessingVoice}
                  >
                    {isRecording ? (
                      <>
                        <Mic className="w-4 h-4 animate-ping" /> Stop Recording
                      </>
                    ) : isProcessingVoice ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" /> Processing Voice...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" /> Fill Form with Voice
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Make *</Label>
                  <Select value={formData.make} onValueChange={(val) => handleChange('make', val)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make} value={make.toLowerCase()}>
                          {make}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="e.g., Camry, Civic, F-150"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Select value={formData.year} onValueChange={(val) => handleChange('year', val)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => 2024 - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Body Type *</Label>
                  <Select value={formData.bodyType} onValueChange={(val) => handleChange('bodyType', val)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypes.map((type) => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mileage *</Label>
                  <Input
                    value={formData.mileage}
                    onChange={(e) => handleChange('mileage', e.target.value)}
                    placeholder="e.g., 25000"
                    type="number"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>VIN (Optional)</Label>
                  <Input 
                    value={formData.vin}
                    onChange={(e) => handleChange('vin', e.target.value)}
                    placeholder="17-character VIN" 
                    className="h-12 rounded-xl" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fuel Type *</Label>
                  <Select value={formData.fuelType} onValueChange={(val) => handleChange('fuelType', val)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((fuel) => (
                        <SelectItem key={fuel} value={fuel.toLowerCase()}>
                          {fuel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Transmission *</Label>
                  <Select value={formData.transmission} onValueChange={(val) => handleChange('transmission', val)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      {transmissions.map((trans) => (
                        <SelectItem key={trans} value={trans.toLowerCase()}>
                          {trans}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exterior Color *</Label>
                  <Select value={formData.exteriorColor} onValueChange={(val) => handleChange('exteriorColor', val)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color} value={color.toLowerCase()}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interior Color *</Label>
                  <Select value={formData.interiorColor} onValueChange={(val) => handleChange('interiorColor', val)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color} value={color.toLowerCase()}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Upload Photos *</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Add high-quality photos to attract more buyers. At least 1 photo is required.
              </p>

              {/* Upload Area */}
              <div
                onClick={handleImageUpload}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 hover:bg-primary/5 group"
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium text-foreground mb-1">Click to upload photos</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB each</p>
              </div>

              {/* Uploaded Images */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-video bg-muted rounded-xl overflow-hidden group"
                    >
                      <img src={img} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 p-1.5 bg-accent-charcoal/80 text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-accent-charcoal/80 text-primary-foreground text-xs px-2 py-1 rounded">
                        Photo {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              <div className="bg-primary/5 rounded-2xl p-5 mt-6">
                <h4 className="font-semibold text-foreground mb-3">📸 Photo Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Include exterior shots from all angles</li>
                  <li>• Capture the dashboard and interior</li>
                  <li>• Show the engine bay and trunk</li>
                  <li>• Highlight any special features or upgrades</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-bold text-foreground mb-6">Set Your Price</h2>

              {/* Listing Type Toggle */}
              <div className="bg-muted/50 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Enable Auction</p>
                    <p className="text-sm text-muted-foreground">
                      Let buyers bid on your vehicle instead of a fixed price
                    </p>
                  </div>
                  <Switch checked={isAuction} onCheckedChange={setIsAuction} />
                </div>
              </div>

              {isAuction ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Starting Bid *</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">PKR</span>
                      <Input
                        value={formData.minBid}
                        onChange={(e) => handleChange('minBid', e.target.value)}
                        placeholder="10,000"
                        type="number"
                        className="h-12 pl-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reserve Price (Optional)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">PKR</span>
                      <Input 
                        value={formData.reservePrice}
                        onChange={(e) => handleChange('reservePrice', e.target.value)}
                        placeholder="15,000" 
                        type="number" 
                        className="h-12 pl-12 rounded-xl" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Auction Duration *</Label>
                    <Select value={formData.auctionDuration} onValueChange={(val) => handleChange('auctionDuration', val)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="5">5 Days</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Buy Now Price (Optional)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">PKR</span>
                      <Input 
                        value={formData.buyNowPrice}
                        onChange={(e) => handleChange('buyNowPrice', e.target.value)}
                        placeholder="25,000" 
                        type="number" 
                        className="h-12 pl-12 rounded-xl" 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Asking Price *</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">PKR</span>
                      <Input
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        placeholder="25,000"
                        type="number"
                        className="h-12 pl-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center gap-3 h-12 bg-muted/50 rounded-xl px-4">
                      <Switch />
                      <span className="text-sm text-muted-foreground">Accept offers</span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Price Suggestion */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">AI Price Suggestion</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Based on machine learning market analysis, similar vehicles are selling for:
                    </p>
                    {fetchingAiPrice ? (
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        Calculating recommendation...
                      </div>
                    ) : aiPriceSuggestion ? (
                      <div>
                        <p className="font-heading text-2xl font-bold text-primary">
                          PKR {aiPriceSuggestion.minPrice.toLocaleString()} - PKR {aiPriceSuggestion.maxPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Model Prediction: PKR {aiPriceSuggestion.predictedPrice.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Could not generate price suggestion. Please ensure vehicle details are entered correctly.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Description */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-bold text-foreground mb-6">Describe Your Vehicle</h2>

              <div className="space-y-2">
                <Label>Listing Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., 2023 Toyota Camry XSE - Low Miles, One Owner"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description *</Label>
                  <Button variant="ghost" size="sm" className="text-primary">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your vehicle's condition, features, history, and any modifications..."
                  className="min-h-[200px] rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Key Features (Optional)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => handleChange('features', e.target.value)}
                  placeholder="• Leather seats&#10;• Sunroof&#10;• Backup camera&#10;• Heated seats"
                  className="min-h-[120px] rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Your Location *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="City, State"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="rounded-xl px-6"
            >
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => {
                  if (validateStep()) {
                    setCurrentStep(Math.min(4, currentStep + 1));
                  }
                }}
                className="rounded-xl px-8 shadow-premium hover:shadow-premium-lg transition-all"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="rounded-xl px-8 shadow-premium hover:shadow-premium-lg transition-all bg-gradient-to-r from-primary to-primary/80">
                <Upload className="w-4 h-4 mr-2" />
                {loading ? (id ? "Updating..." : "Publishing...") : (id ? "Update Listing" : "Publish Listing")}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateListing;
