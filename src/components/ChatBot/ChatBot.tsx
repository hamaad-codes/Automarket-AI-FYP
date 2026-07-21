import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    MessageCircle, X, Send, Mic, Volume2, VolumeX, Languages, Bot, Star, Sparkles,
    MessageSquareHeart, Maximize2, ArrowDownLeft, Calendar, Gauge, Fuel,
    MapPin, ChevronRight, Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CarRecommendation {
    _id: string;
    title: string;
    image: string;
    price: number;
    year?: number;
    mileage?: string;
    fuelType?: string;
    transmission?: string;
    location?: string;
    compatibility: {
        score: number;
        reason?: string;
    };
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    recommendations?: CarRecommendation[];
}

const ChatBot: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<'en' | 'ur'>('en');
    const [isRecording, setIsRecording] = useState(false);
    const [showBadge, setShowBadge] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const hideOnPaths = ['/login', '/register'];
    const shouldHide = hideOnPaths.includes(location.pathname);

    // Preload system voices
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading, isMaximized, isOpen]);

    const sendMessageText = async (textToSend: string) => {
        if (!textToSend.trim()) return;

        const userMsg: Message = { role: 'user', content: textToSend };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const historyToSend = [...messages, userMsg];

            const response = await axios.post(`${API_BASE_URL}/api/chat/message`, {
                messages: historyToSend,
                preferredLanguage: language,
                userPreferences: {
                    maxPrice: 10000000,
                    familySize: 4,
                    usage: 'city'
                }
            });

            const replyText = response.data.message;
            const assistantMsg: Message = {
                role: 'assistant',
                content: replyText,
                recommendations: response.data.recommendations
            };

            setMessages(prev => [...prev, assistantMsg]);

            if (!isMuted) {
                speak(replyText);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: Message = { 
                role: 'assistant', 
                content: language === 'ur' ? 'معذرت، میں رابطہ نہیں کر پا رہا ہوں۔' : 'Sorry, I am having trouble connecting. Please try again later.' 
            };
            setMessages(prev => [...prev, errorMsg]);
            if (!isMuted) {
                speak(errorMsg.content);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessageText(input);
        setInput('');
    };

    const speak = (text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        // Clean markdown and link structures
        const cleanText = text
            .replace(/[\*\#\_`\-]/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();

        const arabicPattern = /[\u0600-\u06FF]/;
        let detectedLang: 'en' | 'ur' | 'pa' = 'en';

        if (arabicPattern.test(cleanText)) {
            const punjabiWords = ['اے', 'نوں', 'دا', 'دی', 'دے', 'سی', 'تسی', 'ساڈا', 'تہاڈا', 'ہن', 'لئی', 'وچ', 'گاڈی', 'کیہڑے'];
            const words = cleanText.split(/\s+/);
            const isPunjabi = words.some(w => punjabiWords.includes(w));
            detectedLang = isPunjabi ? 'pa' : 'ur';
        }

        if (detectedLang === 'pa') {
            utterance.lang = 'pa-IN';
            const punjabiVoice = voices.find(v => v.lang.startsWith('pa')) ||
                voices.find(v => v.name.toLowerCase().includes('punjabi'));
            if (punjabiVoice) {
                utterance.voice = punjabiVoice;
            } else {
                const urduVoice = voices.find(v => v.lang.startsWith('ur')) ||
                    voices.find(v => v.name.toLowerCase().includes('urdu'));
                if (urduVoice) utterance.voice = urduVoice;
            }
            utterance.pitch = 1.0;
            utterance.rate = 0.95;
        } else if (detectedLang === 'ur') {
            utterance.lang = 'ur-PK';
            const urduVoice = voices.find(v => v.lang.startsWith('ur')) ||
                voices.find(v => v.name.toLowerCase().includes('urdu'));
            if (urduVoice) utterance.voice = urduVoice;
            utterance.pitch = 1.0;
            utterance.rate = 0.95;
        } else {
            utterance.lang = 'en-US';
            const englishVoice = voices.find(v => v.lang.startsWith('en')) ||
                voices.find(v => v.name.toLowerCase().includes('english'));
            if (englishVoice) utterance.voice = englishVoice;
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }

        window.speechSynthesis.speak(utterance);
    };

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handleVoiceInput = async () => {
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
                    const formData = new FormData();
                    formData.append('audio', blob, 'voice.webm');

                    setInput(language === 'ur' ? 'آواز پروسیس ہو رہی ہے...' : 'Processing voice...');

                    try {
                        const response = await axios.post(`${API_BASE_URL}/api/chat/voice`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });

                        setInput('');

                        if (response.data.text && response.data.text.trim()) {
                            sendMessageText(response.data.text);
                        } else {
                            setInput(language === 'ur' ? 'معذرت، آواز سمجھ نہیں آئی۔' : 'Sorry, could not understand voice.');
                        }
                    } catch (error) {
                        console.error('Voice Service Error:', error);
                        setInput(language === 'ur' ? 'معذرت، آواز سمجھ نہیں آئی۔' : 'Sorry, could not understand voice.');
                    }
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone.");
            }
        }
    };

    if (shouldHide) return null;

    return (
        <div className={`fixed z-[100] flex flex-col items-end gap-3 transition-all duration-500 ease-in-out ${isMaximized
            ? 'inset-0 w-full h-full bg-background/95 backdrop-blur-sm p-4 sm:p-6'
            : 'bottom-6 right-6'
            }`}>
            {isOpen && (
                <Card className={`flex flex-col shadow-2xl border-primary/20 bg-background/98 backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-500 overflow-hidden ring-1 ring-black/10 transition-all ${isMaximized
                    ? 'w-full h-full max-h-full rounded-2xl'
                    : 'mb-4 w-[95vw] sm:w-[340px] h-[500px] max-h-[500px] rounded-xl'
                    }`}>
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white flex justify-between items-center shadow-lg relative overflow-hidden shrink-0">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl ring-1 ring-white/30">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                                    AutoMarket Advisor
                                </h3>
                                <p className="text-[9px] font-bold opacity-90 uppercase tracking-[0.1em] flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                                    ONLINE • {language === 'en' ? 'ENGLISH' : 'اردو'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 relative z-10">
                            {/* Mute/Unmute Voice Response */}
                            <Button variant="ghost" size="icon" onClick={() => {
                                const newMuted = !isMuted;
                                setIsMuted(newMuted);
                                if (newMuted) {
                                    window.speechSynthesis.cancel();
                                } else {
                                    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
                                    if (lastAssistantMsg) {
                                        speak(lastAssistantMsg.content);
                                    }
                                }
                            }} className="h-9 w-9 text-white hover:bg-white/20 rounded-xl transition-all" title={isMuted ? "Unmute Assistant Voice" : "Mute Assistant Voice"}>
                                {isMuted ? <VolumeX className="w-5 h-5 opacity-70" /> : <Volume2 className="w-5 h-5 text-accent-green animate-pulse" />}
                            </Button>

                            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')} className="h-9 w-9 text-white hover:bg-white/20 rounded-xl transition-all" title="Switch Language">
                                <Languages className="w-5 h-5" />
                            </Button>

                            {/* Maximize/Minimize Button */}
                            <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} className="h-9 w-9 text-white hover:bg-white/20 rounded-xl transition-all" title={isMaximized ? "Minimize" : "Full Screen"}>
                                {isMaximized ? <ArrowDownLeft className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </Button>

                            <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); setIsMaximized(false); }} className="h-9 w-9 text-white hover:bg-white/20 rounded-xl transition-all" title="Close">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full py-10 space-y-6">
                                <div className="text-center opacity-50">
                                    <Bot className="w-16 h-16 mx-auto mb-4 text-primary animate-bounce" />
                                    <p className="text-sm font-bold">{language === 'en' ? 'Ask anything about cars!' : 'گاڑیوں کے بارے میں کچھ بھی پوچھیں!'}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                                    {[
                                        { en: "Toyota Cars", ur: "ٹویوٹا گاڑیاں" },
                                        { en: "Budget Cars", ur: "سستی گاڑیاں" },
                                        { en: "Automatic Cars", ur: "آٹومیٹک گاڑیاں" },
                                        { en: "Honda Civic", ur: "ہونڈا سووک" }
                                    ].map((chip, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setInput(language === 'en' ? chip.en : chip.ur)}
                                            className="px-3 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl text-[11px] font-bold text-primary transition-all text-center"
                                        >
                                            {language === 'en' ? chip.en : chip.ur}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                {/* Message Bubble */}
                                <div className={`max-w-[95%] p-4 rounded-2xl shadow-sm text-[14px] leading-relaxed relative ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-card backdrop-blur-sm text-foreground rounded-tl-none border border-border/60 shadow-md'
                                    }`}>
                                    <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-neutral'} ${language === 'ur' || /[\u0600-\u06FF]/.test(msg.content) ? 'urdu-text text-lg' : ''}`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <button onClick={() => speak(msg.content)} className="absolute bottom-2 right-2 p-1 rounded-lg hover:bg-primary/5 text-primary/40 hover:text-primary transition-all">
                                            <Volume2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Grid Car Recommendations */}
                                {msg.recommendations && msg.recommendations.length > 0 && (
                                    <div className="mt-4 w-full space-y-3">
                                        <div className="flex items-center gap-3 px-1">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{language === 'en' ? 'Exclusive Matches' : 'آپ کے لیے بہترین گاڑیاں'}</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {msg.recommendations.map((car) => (
                                                <Card key={car._id}
                                                    className="overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl group cursor-pointer bg-card/60 backdrop-blur-sm flex flex-col"
                                                    onClick={() => navigate(`/vehicles/${car._id}`)}
                                                >
                                                    <div className="aspect-[16/9] w-full overflow-hidden relative">
                                                        <img src={car.image || '/placeholder-car.jpg'} alt={car.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        <div className="absolute top-2 right-2">
                                                            <Badge className="bg-white/90 text-primary border-none font-bold shadow-sm backdrop-blur-sm">
                                                                {car.compatibility.score}% Match
                                                            </Badge>
                                                        </div>
                                                        {car.year && (
                                                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold">
                                                                {car.year}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-3 flex-1 flex flex-col space-y-2">
                                                        <div>
                                                            <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors leading-tight">{car.title}</h4>
                                                            <p className="text-lg font-black text-primary mt-1">
                                                                {car.price ? `Rs ${(car.price / 100000).toFixed(1)} Lac` : 'Price on Call'}
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 border-t border-border/40">
                                                            {car.mileage && (
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <Gauge className="w-3 h-3 text-primary/60" />
                                                                    <span className="text-[10px] font-medium">{car.mileage}</span>
                                                                </div>
                                                            )}
                                                            {car.fuelType && (
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <Fuel className="w-3 h-3 text-primary/60" />
                                                                    <span className="text-[10px] font-medium">{car.fuelType}</span>
                                                                </div>
                                                            )}
                                                            {car.transmission && (
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <Settings className="w-3 h-3 text-primary/60" />
                                                                    <span className="text-[10px] font-medium">{car.transmission}</span>
                                                                </div>
                                                            )}
                                                            {car.location && (
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <MapPin className="w-3 h-3 text-primary/60" />
                                                                    <span className="text-[10px] font-medium line-clamp-1">{car.location.split(',')[0]}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <Button variant="outline" size="sm" className="w-full mt-2 h-8 text-[11px] font-bold uppercase tracking-wider group-hover:bg-primary group-hover:text-white transition-all rounded-xl">
                                                            View Details <ChevronRight className="w-3 h-3 ml-1" />
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2 p-4 bg-muted/20 w-max rounded-2xl animate-pulse">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.2s]" />
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.4s]" />
                            </div>
                        )}
                        <div id="chat-end" />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-background border-t border-border/50 shrink-0">
                        <div className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-xl border border-border/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                            <Button variant={isRecording ? 'destructive' : 'ghost'} size="icon" onClick={handleVoiceInput} className="h-10 w-10">
                                <Mic className={`w-5 h-5 ${isRecording ? 'animate-ping' : ''}`} />
                            </Button>
                            <Input
                                placeholder={language === 'en' ? "Ask about any car..." : "گاڑی کے بارے میں پوچھیں..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent h-10"
                                dir={language === 'ur' ? 'rtl' : 'ltr'}
                            />
                            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()} className="h-9 w-9 shadow-lg">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Prominent Button */}
            {!isMaximized && (
                <div className="relative group">
                    {!isOpen && showBadge && (
                        <div className="absolute -top-14 right-0 bg-primary text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-xl animate-bounce flex items-center gap-2">
                            AI AUTO ADVISOR <Sparkles className="w-3 h-3" />
                            <div className="absolute -bottom-1 right-8 w-2 h-2 bg-primary rotate-45" />
                        </div>
                    )}
                    <Button
                        size="lg"
                        className={`rounded-full w-[70px] h-[70px] shadow-2xl transition-all duration-500 border-4 border-background ${isOpen ? 'rotate-90 bg-destructive' : 'bg-primary hover:scale-110'
                            }`}
                        onClick={() => { setIsOpen(!isOpen); setShowBadge(false); }}
                    >
                        {isOpen ? <X className="w-8 h-8" /> : <MessageSquareHeart className="w-8 h-8" />}
                    </Button>
                    {!isOpen && <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse -z-10" />}
                </div>
            )}
        </div>
    );
};

export default ChatBot;
