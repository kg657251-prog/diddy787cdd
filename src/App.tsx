import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { 
  Gamepad2, 
  User as UserIcon, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Star,
  Quote,
  Info,
  ShieldCheck,
  Zap,
  Loader2,
  X,
  Mail,
  Menu,
  CreditCard,

  Headphones,
  Phone,
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SKIN_PACKAGES, PAYMENT_METHODS, type SkinPackage, type PaymentMethod } from './constants';
import { cn } from '@/lib/utils';


const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.029c0 2.125.547 4.197 1.591 6.042L0 24l6.135-1.61a11.75 11.75 0 005.911 1.603h.005c6.634 0 12.032-5.396 12.034-12.03a11.75 11.75 0 00-3.489-8.487" />
  </svg>
);



const REVIEWS = [
  {
    name: "Aarav Mehta",
    uid: "5189****43",
    rating: 5,
    item: "Golden Pharaoh X-Suit",
    text: "Was super anxious about entering my UID, but this is 100% legit. Got my Golden Pharaoh X-Suit in exactly 45 seconds in my game mail! Highly recommend EliteSkins.",
    date: "Just now"
  },
  {
    name: "Ishaan Sharma",
    uid: "5423****12",
    rating: 5,
    item: "M416 Glacier",
    text: "M416 Glacier at this price is a steal! Transaction was super fast and clean. No password requested. Truly official and secure process.",
    date: "30 mins ago"
  },
  {
    name: "Kabir Malhotra",
    uid: "5298****76",
    rating: 5,
    item: "Poseidon X-Suit",
    text: "Amazing customer support! I had a typo in my UID, but they fixed it instantly over WhatsApp support. Got my Poseidon X-Suit. Best store ever!",
    date: "2 hours ago"
  },
  {
    name: "Rohan Das",
    uid: "5109****98",
    rating: 5,
    item: "M416 The Fool",
    text: "My account security is my top priority. EliteSkins didn't ask for any login info or password. The item was sent via global sync mailbox. Absolute peace of mind.",
    date: "Yesterday"
  }
];

export default function App() {
  const [playerId, setPlayerId] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [selectedSkin, setSelectedSkin] = useState<SkinPackage | null>(null);
  const [isVerifiedPopupOpen, setIsVerifiedPopupOpen] = useState(false);
  
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isHoveredReview, setIsHoveredReview] = useState(false);

  useEffect(() => {
    if (isHoveredReview) return;
    const interval = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHoveredReview]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setActiveReviewIndex((prev) => (prev + 1) % REVIEWS.length);
    } else if (info.offset.x > swipeThreshold) {
      setActiveReviewIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
    }
  };

  const handleVerify = async () => {
    if (!playerId || playerId.length < 8) {
      toast.error('Invalid Player ID', { description: 'Please enter a valid BGMI Player ID (8-12 digits).' });
      return;
    }
    
    setIsVerifying(true);
    setVerifiedName(null);
    
    try {
      const response = await fetch('/api/verify-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (data.success && data.name) {
        setVerifiedName(data.name);
        setIsVerifiedPopupOpen(true);
      } else {
        toast.error('Player Not Found', { 
          description: 'PLEASE ENTER CORRECT UID AND TRY AGAIN' 
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification Failed', { 
        description: 'Could not verify player ID. Please try again later.' 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const [livePurchases, setLivePurchases] = useState<{ id: string; uid: string; itemName: string }[]>([]);
  const [recentPurchasesFeed, setRecentPurchasesFeed] = useState<{ id: string; uid: string; itemName: string; time: string }[]>([]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    // Skip parallax on touch/mobile devices to avoid scroll blocking
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Simulation for live purchase popups and feed
  useEffect(() => {
    // Initial feed data
    const initialFeed = Array.from({ length: 8 }).map((_, i) => {
      const randomUid = Math.floor(5100000000 + Math.random() * 900000000).toString();
      const maskedUid = `${randomUid.substring(0, 4)}****${randomUid.substring(8)}`;
      const randomPkg = SKIN_PACKAGES[Math.floor(Math.random() * SKIN_PACKAGES.length)];
      return {
        id: `feed-${i}`,
        uid: maskedUid,
        itemName: randomPkg.name,
        time: `${Math.floor(Math.random() * 59) + 1}m ago`
      };
    });
    setRecentPurchasesFeed(initialFeed);

    const interval = setInterval(() => {
      // Random 10-digit ID starting with 5
      const randomUid = Math.floor(5100000000 + Math.random() * 900000000).toString();
      const maskedUid = `${randomUid.substring(0, 4)}****${randomUid.substring(8)}`;
      const randomPkg = SKIN_PACKAGES[Math.floor(Math.random() * SKIN_PACKAGES.length)];
      
      const newPurchase = {
        id: Math.random().toString(36).substring(2, 9),
        uid: maskedUid,
        itemName: randomPkg.name
      };

      setLivePurchases([newPurchase]);
      
      // Update feed
      setRecentPurchasesFeed(prev => [
        { ...newPurchase, time: 'Just now' },
        ...prev.map(p => ({
          ...p,
          time: p.time === 'Just now' ? '1m ago' : p.time.includes('m ago') ? `${parseInt(p.time) + 1}m ago` : p.time
        })).slice(0, 7)
      ]);
    }, 6000 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, []);




  const handlePurchase = async () => {
    const selectedItem = selectedSkin;

    if (!playerId || !selectedItem || !selectedPayment || !verifiedName) {
      toast.error('Please complete all steps and verify your ID');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Check for network status before proceeding
      if (!navigator.onLine) {
        toast.error('Offline', {
          description: 'You appear to be offline. Please reconnect and try again.'
        });
        setIsProcessingPayment(false);
        return;
      }

      const response = await fetch(`/api/create-payment?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId, 
          packageId: selectedItem.id,
          amount: 1,
          price: selectedItem.price,
          name: 'N/A',
          email: 'not-provided@eliteskins.in',
          phone: '0000000000'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        toast.success('Redirecting to Payment Gateway...');
        window.location.href = data.paymentUrl;
      } else if (data.success && !data.paymentUrl) {
        toast.success('Order Created', {
          description: 'Your order has been placed. Complete payment to receive your items.'
        });
      } else {
        toast.error('Payment Error', {
          description: data.error || 'Could not initiate secure transaction.',
          action: {
            label: 'Retry',
            onClick: () => handlePurchase()
          }
        });
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Transaction Failed', {
        description: error.message || 'Payment gateway is taking too long. Please try again or contact support.'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full golden-header safe-top">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <a href="#" className="flex items-center min-w-0">
            <img 
              src="/logo.png" 
              alt="EliteSkins Official Logo" 
              aria-label="EliteSkins Official Logo"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.3)] transition-transform duration-300 hover:scale-105"
              width="88"
              height="48"
              fetchPriority="high"
              decoding="async"
            />
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <nav className="flex items-center gap-1">
              <Button variant="ghost" className="text-sm font-bold px-4 uppercase tracking-wider text-primary/80 hover:text-primary hover:bg-primary/10" render={<a href="#packages" />}>
                Packs
              </Button>
              <Button variant="ghost" className="text-sm font-bold px-4 uppercase tracking-wider text-primary/80 hover:text-primary hover:bg-primary/10" render={<a href="#about" />}>
                How It Works
              </Button>
              <Button variant="ghost" className="text-sm font-bold px-4 uppercase tracking-wider text-primary/80 hover:text-primary hover:bg-primary/10" render={<a href="#support" />}>
                Support
              </Button>
              <div className="w-px h-6 bg-primary/20 mx-2" />
              <Button 
                variant="outline" 
                className="text-xs font-black border-primary/30 text-primary hover:bg-primary/10 px-4 h-9 uppercase tracking-wider" 
                render={<a href="https://wa.me/+918090034774" target="_blank" rel="noopener noreferrer" />}
              >
                <WhatsAppIcon className="w-3.5 h-3.5 mr-1.5" />
                WhatsApp
              </Button>
            </nav>
          </div>

          {/* Mobile Menu + Status */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live</span>
            </div>
            <button
              className="flex items-center justify-center w-10 h-10 touch-target active:bg-primary/10 transition-colors border border-primary/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-primary/20 bg-background/98 backdrop-blur-xl"
            >
              <nav className="container mx-auto px-3 py-3 flex flex-col gap-1">
                <a href="#packages" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider hover:bg-primary/10 active:bg-primary/15 transition-colors touch-target border-l-2 border-transparent hover:border-primary">
                  <Zap className="w-4 h-4 text-primary" /> Packs
                </a>
                <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider hover:bg-primary/10 active:bg-primary/15 transition-colors touch-target border-l-2 border-transparent hover:border-primary">
                  <Info className="w-4 h-4 text-primary" /> How It Works
                </a>
                <a href="#support" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider hover:bg-primary/10 active:bg-primary/15 transition-colors touch-target border-l-2 border-transparent hover:border-primary">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Support
                </a>
                <div className="h-px bg-primary/20 my-1" />
                <a href="https://wa.me/+918090034774" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm font-black text-green-500 bg-green-500/10 hover:bg-green-500/15 active:bg-green-500/20 transition-colors touch-target uppercase tracking-wider">
                  <WhatsAppIcon className="w-4 h-4" /> WhatsApp Support
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        {/* Hero Section */}
        <section 
          className="mb-6 sm:mb-8 md:mb-12 relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background border border-primary/20 p-4 sm:p-5 md:p-12 group/hero hardware-grid min-h-[220px] sm:min-h-[300px] flex flex-col justify-center rounded-2xl sm:rounded-3xl"
          style={{ touchAction: 'pan-y' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            mouseX.set(0);
            mouseY.set(0);
          }}
        >
          {/* Diagonal accent line */}
          <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] border border-primary/10 rotate-45" />
            <div className="absolute -top-10 -right-10 w-[400px] h-[400px] border border-primary/5 rotate-45" />
          </div>

          <motion.div 
            style={{ 
              translateX: useTransform(springX, (x) => x * -40),
              translateY: useTransform(springY, (y) => y * -40)
            }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-3xl pointer-events-none"
          />
          <motion.div 
            style={{ 
              translateX: useTransform(springX, (x) => x * 60),
              translateY: useTransform(springY, (y) => y * 60)
            }}
            className="absolute -bottom-24 right-24 w-64 h-64 bg-primary/5 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] md:text-sm font-black uppercase tracking-wider">⚡ Official Partner</Badge>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Server Active</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-6xl font-black tracking-tight mb-3 md:mb-4 uppercase italic leading-none">
              PREMIUM <span className="text-primary">BGMI SKINS</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-8 max-w-md">
              Get exclusive X-Suits and legendary Gun Skins delivered directly to your in-game mailbox. No password needed.
            </p>
            <div className="flex flex-wrap gap-2 md:gap-3 font-mono">
              <div className="flex items-center gap-1.5 md:gap-2 bg-primary/10 px-3 py-1.5 border border-primary/30">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">Instant Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-primary/10 px-3 py-1.5 border border-primary/30">
                <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">100% Secure</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-primary/10 px-3 py-1.5 border border-primary/30">
                <Lock className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">No Password</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6 sm:gap-8 mb-16 sm:mb-24 max-w-3xl mx-auto">
          {/* Trust Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 px-0 sm:px-4"
          >
            {[
              { label: "10K+ Orders", desc: "Completed today" },
              { label: "1 Min", desc: "Avg. Delivery" },
              { label: "100% Safe", desc: "Official Process" },
              { label: "Secure", desc: "Encrypted Pay" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 bg-card/20 border border-primary/10 relative overflow-hidden group/stat hover:border-primary/30 transition-colors rounded-xl">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                <div className="text-xs sm:text-sm font-black text-primary uppercase italic">{stat.label}</div>
                <div className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">{stat.desc}</div>
              </div>
            ))}
          </motion.div>

          {/* Form Steps */}
          <div className="space-y-8 w-full">
            {/* Step 1: User ID */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border border-primary/20 bg-card/40 backdrop-blur-md shadow-xl p-6 sm:p-8 w-full glass-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">1</div>
                      <CardTitle className="text-lg uppercase tracking-wider font-black italic">Enter Player ID</CardTitle>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Example: 5123456789" 
                            className={cn(
                              "pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all text-base disabled:opacity-50",
                              verifiedName && "border-green-500/50 focus:border-green-500"
                            )}
                            value={playerId}
                            onChange={(e) => {
                              setPlayerId(e.target.value);
                              setVerifiedName(null);
                            }}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            disabled={isProcessingPayment || isVerifying}
                          />
                        </div>
                        <Button 
                          className={cn(
                            "h-12 px-6 font-bold uppercase tracking-wider transition-all",
                            verifiedName 
                              ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20" 
                              : "shadow-lg shadow-primary/20"
                          )}
                          onClick={handleVerify}
                          disabled={isProcessingPayment || isVerifying || !playerId}
                        >
                          {isVerifying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : verifiedName ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>
                      
                      <AnimatePresence>
                        {verifiedName && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="mt-6"
                          >
                            <div className="flex items-center gap-5 p-4 sm:p-5 bg-primary/5 backdrop-blur-sm border border-primary/20 shadow-[0_0_40px_rgba(var(--primary),0.15)] relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 relative z-10 shadow-inner">
                                <CheckCircle2 className="w-7 h-7 text-primary" />
                              </div>
                              <div className="flex flex-col min-w-0 relative z-10">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Player Verified</span>
                                <h4 className="text-xl font-black text-white tracking-tight leading-none truncate mb-1.5">{verifiedName}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">UID:</span>
                                  <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded-md">{playerId}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 border border-border/50">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>To find your Player ID, open BGMI, click on your profile icon in the top-left corner. Your Player ID is listed under your nickname.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Step 2: Select Skin/Outfit */}
            <motion.div
              id="packages"
              className="scroll-mt-24"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border border-primary/20 bg-card/40 backdrop-blur-md shadow-xl p-0 w-full glass-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
                
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">2</div>
                        <CardTitle className="text-lg uppercase tracking-wider font-black italic">
                          Select Skin/Outfit
                        </CardTitle>
                      </div>
                      
                      {/* Item Source Badge */}
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black tracking-[0.1em] px-2 py-0.5">
                        OFFICIAL GLOBAL SYNC
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="space-y-8">
                      {/* X-Suits Section */}
                      <div>
                        <div className="border-l-4 border-primary pl-4 mb-6 relative">
                          <h3 className="text-sm sm:text-base font-black text-white uppercase italic tracking-[0.25em] leading-none">
                            Exclusive X-Suits
                          </h3>
                          <div className="text-[8px] sm:text-[9px] text-primary/70 uppercase font-black tracking-widest mt-1.5">
                            Premium Outfits
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {SKIN_PACKAGES.filter(s => s.category === 'xsuit').map((skin, idx) => (
                            <motion.button
                              key={skin.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedSkin(skin)}
                              className={cn(
                                "relative flex flex-col p-4 border transition-all overflow-hidden group/skin rounded-2xl bg-card/25 backdrop-blur-md text-center items-center justify-between min-h-[240px] sm:min-h-[260px] cursor-pointer",
                                selectedSkin?.id === skin.id
                                  ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(250,204,21,0.15)]"
                                  : "border-border/40 bg-background/30 hover:border-primary/40 hover:bg-primary/5"
                              )}
                            >

                              <div className="absolute top-2 right-2 z-10">
                                <span className="text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-md bg-green-500 text-white shadow-sm uppercase">
                                  50% OFF
                                </span>
                              </div>

                              {/* Circular Frame of Photos */}
                              <div className={cn(
                                "w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3.5 mt-4 relative bg-gradient-to-b from-neutral-900 to-black border-2 transition-all duration-300 mx-auto flex items-center justify-center shadow-md",
                                selectedSkin?.id === skin.id 
                                  ? "border-primary shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
                                  : "border-primary/20 group-hover/skin:border-primary/60 group-hover/skin:shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                              )}>
                                <img 
                                  src={skin.image} 
                                  alt={skin.name} 
                                  className={cn(
                                    "w-full h-full object-cover transition-transform duration-500",
                                    skin.zoom || "scale-100 group-hover/skin:scale-110"
                                  )}
                                  loading="eager"
                                  fetchPriority="high"
                                  decoding="async"
                                  width="112"
                                  height="112"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                              </div>

                              {selectedSkin?.id === skin.id && (
                                <div className="absolute top-0 left-0 w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center z-10 rounded-br-2xl shadow-md">
                                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                                </div>
                              )}

                              {/* Card Metadata */}
                              <div className="w-full mt-auto text-center">
                                <div className="text-[10px] sm:text-xs font-black text-white uppercase italic truncate mb-1 group-hover/skin:text-primary transition-colors">
                                  {skin.name}
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-xs sm:text-sm font-black text-primary">₹{skin.price}</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground/60 line-through">₹{skin.price * 2}</span>
                                </div>
                              </div>

                              {/* Action Button Indicator */}
                              <div className="w-full mt-3">
                                <div className={cn(
                                  "w-full py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                                  selectedSkin?.id === skin.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                                    : "bg-transparent text-muted-foreground/80 border-border/40 group-hover/skin:text-white group-hover/skin:border-primary/40 group-hover/skin:bg-primary/5"
                                )}>
                                  {selectedSkin?.id === skin.id ? "Selected" : "Select"}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Gun Skins Section */}
                      <div>
                        <div className="border-l-4 border-amber-500 pl-4 mb-6 mt-8 relative">
                          <h3 className="text-sm sm:text-base font-black text-white uppercase italic tracking-[0.25em] leading-none">
                            Premium Gun Skins
                          </h3>
                          <div className="text-[8px] sm:text-[9px] text-amber-500/70 uppercase font-black tracking-widest mt-1.5">
                            Legendary Weapons
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {SKIN_PACKAGES.filter(s => s.category === 'gunskin').map((skin, idx) => (
                            <motion.button
                              key={skin.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedSkin(skin)}
                              className={cn(
                                "relative flex flex-col p-4 border transition-all overflow-hidden group/skin rounded-2xl bg-card/25 backdrop-blur-md text-center items-center justify-between min-h-[260px] sm:min-h-[280px] cursor-pointer",
                                selectedSkin?.id === skin.id
                                  ? "border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                  : "border-border/40 bg-background/30 hover:border-amber-500/40 hover:bg-amber-500/5"
                              )}
                            >

                              <div className="absolute top-2 right-2 z-10">
                                <span className="text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-md bg-green-500 text-white shadow-sm uppercase">
                                  50% OFF
                                </span>
                              </div>

                              {/* Circular Frame of Photos */}
                              <div className={cn(
                                "w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-3.5 mt-4 relative bg-gradient-to-b from-neutral-900 to-black border-2 transition-all duration-300 mx-auto flex items-center justify-center shadow-md",
                                selectedSkin?.id === skin.id 
                                  ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
                                  : "border-amber-500/20 group-hover/skin:border-amber-500/60 group-hover/skin:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                              )}>
                                <img 
                                  src={skin.image} 
                                  alt={skin.name} 
                                  className={cn(
                                    "w-full h-full object-contain transition-transform duration-500",
                                    skin.zoom || "scale-100 group-hover/skin:scale-110"
                                  )}
                                  loading="eager"
                                  fetchPriority="high"
                                  decoding="async"
                                  width="128"
                                  height="128"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                              </div>

                              {selectedSkin?.id === skin.id && (
                                <div className="absolute top-0 left-0 w-8 h-8 bg-amber-500 text-white flex items-center justify-center z-10 rounded-br-2xl shadow-md">
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                              )}

                              {/* Card Metadata */}
                              <div className="w-full mt-auto text-center">
                                <div className="text-[10px] sm:text-xs font-black text-white uppercase italic truncate mb-1 group-hover/skin:text-amber-400 transition-colors">
                                  {skin.name}
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-xs sm:text-sm font-black text-primary">₹{skin.price}</span>
                                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground/60 line-through">₹{skin.price * 2}</span>
                                </div>
                              </div>

                              {/* Action Button Indicator */}
                              <div className="w-full mt-3">
                                <div className={cn(
                                  "w-full py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                                  selectedSkin?.id === skin.id
                                    ? "bg-amber-500 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                    : "bg-transparent text-muted-foreground/80 border-border/40 group-hover/skin:text-white group-hover/skin:border-amber-400/40 group-hover/skin:bg-amber-500/5"
                                )}>
                                  {selectedSkin?.id === skin.id ? "Selected" : "Select"}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Note section */}
                      <div className="mt-8 flex items-start gap-3 p-4 bg-primary/5 border-l-2 border-primary">
                        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest">Security Protocol</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-bold leading-relaxed">
                            NO PLAYER ID PASSWORD REQUIRED. All items are sent directly to your in-game mailbox via official global sync.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Step 3: Payment Method */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border border-primary/20 bg-card/40 backdrop-blur-md shadow-xl p-6 sm:p-8 w-full glass-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">3</div>
                      <CardTitle className="text-lg uppercase tracking-wider font-black italic">Select Payment Channel</CardTitle>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      {PAYMENT_METHODS.map((method, idx) => (
                        <motion.button
                          key={method.id}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedPayment(method)}
                          disabled={isProcessingPayment}
                          className={cn(
                            "flex items-center gap-4 p-4 border transition-all text-left group/btn disabled:opacity-50 disabled:cursor-not-allowed",
                            selectedPayment?.id === method.id 
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" 
                              : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                          )}
                        >
                          <div className="w-12 h-12 bg-white p-2.5 flex items-center justify-center shrink-0 shadow-inner">
                            <img src={method.icon} alt={method.name} className="w-full h-full object-contain" decoding="async" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm uppercase tracking-wide">{method.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{method.description}</div>
                          </div>
                          {selectedPayment?.id === method.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle2 className="w-6 h-6 text-primary shrink-0 drop-shadow-md" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Integrated Purchase Action */}
                    <div className="pt-6 border-t border-border/50">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6 bg-background/30 p-4 border border-border/30">
                        <div className="text-center sm:text-left">
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Subtotal</div>
                          <div className="text-3xl font-black text-primary tracking-tighter drop-shadow-sm">
                            {selectedSkin ? `₹${selectedSkin.price}` : '--'}
                          </div>
                        </div>
                          <Button 
                            className="w-full sm:w-auto min-w-[240px] h-14 text-lg font-black uppercase tracking-widest italic group/pay overflow-hidden relative shadow-xl shadow-primary/20 gap-2"
                            disabled={!playerId || !verifiedName || !selectedSkin || !selectedPayment || isProcessingPayment}
                            onClick={() => handlePurchase()}
                          >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Continue to Pay
                                <ArrowRight className="w-5 h-5 group-hover/pay:translate-x-1 transition-transform" />
                              </>
                            )}
                          </span>
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-primary via-primary-foreground/20 to-primary opacity-0 group-hover/pay:opacity-100 transition-opacity"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          />
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary/60" />
                        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-medium opacity-80">
                          Instantly Delivery • Secure Encryption • 24/7 Support
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <section className="mb-16 sm:mb-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Updates</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight mb-2">Recent <span className="text-primary">Transactions</span></h2>
            <p className="text-muted-foreground text-sm">Real-time successful deliveries from our community</p>
          </div>

          <Card className="border-border/50 bg-card/20 backdrop-blur-sm overflow-hidden max-w-2xl mx-auto shadow-2xl shadow-primary/5 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-border/50">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Player ID</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Purchased</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {recentPurchasesFeed.map((purchase) => (
                      <motion.tr
                        key={purchase.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-b border-border/30 hover:bg-primary/5 transition-colors group"
                      >
                        <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted hidden sm:flex items-center justify-center">
                              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            </div>
                            <span className="text-xs sm:text-sm font-mono tracking-wider">{purchase.uid}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-black text-primary uppercase italic tracking-tighter">{purchase.itemName}</span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">{purchase.time}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-right">
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">
                            Success
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Live Purchase Notifications */}
        <div className="fixed bottom-20 left-3 sm:bottom-4 md:bottom-6 sm:left-4 md:left-6 z-50 pointer-events-none max-w-[calc(100vw-4rem)] sm:max-w-[calc(100vw-2rem)]">
          <AnimatePresence mode="wait">
            {livePurchases.map((purchase) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="bg-card/95 backdrop-blur-md border border-primary/20 p-2 md:p-2.5 shadow-xl shadow-primary/10 flex items-center gap-2.5 min-w-[180px] md:min-w-[220px] relative pointer-events-auto rounded-xl"
              >
                <button 
                  onClick={() => setLivePurchases([])}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center shadow-md border border-background hover:scale-110 active:scale-95 transition-transform z-10 rounded-full"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
                <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 rounded-lg">
                  <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="text-[10px] font-bold text-foreground truncate leading-none mb-0.5">
                    {purchase.uid}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium truncate leading-none">
                    bought <span className="text-primary font-black uppercase tracking-tighter">{purchase.itemName}</span>
                  </div>
                </div>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="ml-auto w-1.5 h-1.5 bg-green-500 shrink-0"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* How It Works Section */}
        <section id="about" className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight mb-2">How it <span className="text-primary">Works</span></h2>
            <p className="text-muted-foreground">Get your item in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            {[
              { icon: UserIcon, title: "Enter ID", desc: "Enter your BGMI Player ID and verify your nickname." },
              { icon: Zap, title: "Select Skin", desc: "Choose the X-Suit or Gun Skin you want." },
              { icon: CreditCard, title: "Pay & Receive", desc: "Complete payment and receive items in your mailbox." }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="flex flex-col items-center text-center p-4 sm:p-6 bg-card/20 border border-border/50 relative overflow-hidden group/step hover:border-primary/30 transition-colors rounded-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover/step:opacity-100 transition-opacity" />
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 border border-primary/20 rounded-2xl">
                  <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12 sm:mb-16 md:mb-24">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight mb-2">Frequently Asked <span className="text-primary">Questions</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { q: "Is it safe to buy skins here?", a: "Yes, we are an official partner. All transactions are secure and encrypted." },
              { q: "How long does delivery take?", a: "Skins are delivered instantly to your in-game mailbox after payment confirmation." },
              { q: "What if I enter the wrong ID?", a: "Please double-check your ID. We verify nicknames to help prevent errors." },
              { q: "Do you offer refunds?", a: "Refunds are processed only if the item is not delivered due to technical issues." }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="p-4 sm:p-6 bg-card/30 border border-border/50 hover:border-primary/30 transition-colors relative overflow-hidden group/faq rounded-2xl"
              >
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {faq.q}
                </h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Support Section */}
        <section id="support" className="mb-12 sm:mb-16 md:mb-24 p-4 sm:p-6 md:p-12 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight mb-4">Need <span className="text-primary">Support?</span></h2>
              <p className="text-muted-foreground mb-8">Our dedicated support team is available 24/7 to help you with any issues or questions.</p>
              <div className="space-y-4">
                <Button 
                  className="w-full sm:w-auto h-12 px-8 font-bold uppercase tracking-wider gap-2 shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 border-none mb-4 sm:mb-0 rounded-xl" 
                  render={
                    <a href="https://wa.me/+918090034774" target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="w-5 h-5 text-white" />
                      WhatsApp Support
                    </a>
                  } 
                />

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 border-2 border-background bg-muted flex items-center justify-center rounded-full">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">5 Agents Online</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Response Time", value: "< 15 Mins" },
                { label: "Working Hours", value: "24/7" },
                { label: "Location", value: "India" }
              ].map((item, idx) => (
                <div key={idx} className={cn("p-4 bg-background/50 border border-border/50 rounded-xl")}>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-sm font-bold text-primary">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Player Verified Popup */}
      <Dialog open={isVerifiedPopupOpen} onOpenChange={setIsVerifiedPopupOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-primary/20 overflow-hidden p-0 shadow-[0_0_50px_rgba(250,204,21,0.1)] rounded-2xl">
          <div className="relative p-6 sm:p-8">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/5 blur-3xl pointer-events-none" />
 
            {/* Header section with status */}
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Secure Connection</span>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black px-2 py-0">
                OFFICIAL SYNC
              </Badge>
            </div>
 
            {/* Main Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 bg-gradient-to-br from-background/80 to-background/40 border border-white/5 p-6 mb-8 shadow-inner overflow-hidden group rounded-2xl"
            >
              {/* Card Background Patterns */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -translate-y-1/2 translate-x-1/2 blur-2xl" />
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/30 group-hover:scale-105 transition-transform duration-500 p-2 overflow-hidden bg-black/40 rounded-2xl">
                    <UserIcon className="w-10 h-10 text-primary" />
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary border-4 border-background flex items-center justify-center rounded-full"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-foreground uppercase italic leading-none px-2 overflow-visible">
                    {verifiedName}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Player ID:</span>
                    <span className="text-sm font-mono font-medium text-foreground/80 tracking-tighter">{playerId}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 w-full grid grid-cols-2 gap-4">
                  <div className="text-left">
                    <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Server Status</div>
                    <div className="text-[10px] font-bold text-primary uppercase">Live & Active</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Region</div>
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-tight">India (IN)</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Section */}
            <div className="space-y-4 relative z-10">
              <Button
                className="w-full h-14 text-base font-black uppercase tracking-widest italic group/verified relative overflow-hidden bg-primary hover:bg-primary/90 text-white border-none shadow-xl shadow-primary/20 rounded-xl"
                onClick={() => {
                  setIsVerifiedPopupOpen(false);
                  document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue to Packs
                  <ChevronRight className="w-5 h-5 group-hover/verified:translate-x-1 transition-transform" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </Button>
              
              <p className="text-[9px] text-center text-muted-foreground uppercase tracking-[0.2em] font-black opacity-40">
                Verified via Secure API Gateway
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Footer */}
      {/* Footer */}
      <footer className="mt-12 md:mt-20 border-t-2 border-primary/30 bg-gradient-to-b from-background to-primary/5 py-10 md:py-16 relative overflow-hidden">
        {/* Engaging Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8 mb-12">
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <a href="#">
                  <img 
                    src="/logo.png" 
                    alt="EliteSkins Official Logo" 
                    className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(250,204,21,0.2)] transition-transform duration-300 hover:scale-105"
                    width="146"
                    height="80"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8">
                The most trusted and fastest growing platform for premium BGMI X-Suits and Gun Skins in India. We guarantee lightning-fast delivery, secure payments, and the most competitive prices in the market.
              </p>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 border border-border/50 text-xs font-bold text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  100% Safe
                </div>
                <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 border border-border/50 text-xs font-bold text-muted-foreground">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Instant
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold uppercase tracking-wider text-sm mb-4 text-foreground">Quick Links</h4>
              <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-primary/50" />About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-primary/50" />Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-primary/50" />Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-primary/50" />Refund Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold uppercase tracking-wider text-sm mb-4 text-foreground">Support</h4>
              <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                <li><a href="#support" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-primary/50" />Help Center</a></li>
                <li><a href="https://wa.me/+918090034774" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2"><WhatsAppIcon className="w-3 h-3 text-green-500" />WhatsApp Support</a></li>
                <li><a href="#support" className="hover:text-primary transition-colors flex items-center gap-2"><Info className="w-3 h-3 text-primary/50" />FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="mb-8 bg-primary/10" />
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground uppercase tracking-widest font-bold">
            <p className="opacity-80">© 2026 ELITESKINS.IN. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center gap-4 opacity-80">
              <span className="flex items-center gap-1.5"><Gamepad2 className="w-3.5 h-3.5 text-primary" /> Made for Gamers</span>
              <Separator orientation="vertical" className="h-4 bg-primary/20" />
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure SSL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/+918090034774"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-4 right-3 sm:right-4 md:bottom-6 md:right-6 z-[60] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(37,211,102,0.4)] border border-white/20 transition-all touch-target safe-bottom rounded-full"
      >
        <WhatsAppIcon className="w-8 h-8 md:w-10 md:h-10" />
        <div className="absolute inset-0 border-2 border-[#25D366] animate-ping opacity-30 rounded-full" />
      </motion.a>
    </div>
  );
}
