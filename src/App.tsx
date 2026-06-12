import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { 
  Gamepad2, 
  User as UserIcon, 
  CheckCircle2, 
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  Loader2,
  X,
  Mail,
  Menu,
  CreditCard,
  MessageCircle,
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
import { UC_PACKAGES, PAYMENT_METHODS, type UCPackage, type PaymentMethod } from './constants';
import { cn } from '@/lib/utils';


const TelegramIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.198-.054-.31-.35-.11l-6.4 4.024-2.76-.86c-.6-.188-.61-.6.125-.89l10.85-4.18c.5-.188.945.11.765.945z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function App() {
  const [playerId, setPlayerId] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<UCPackage | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [isVerifiedPopupOpen, setIsVerifiedPopupOpen] = useState(false);

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

  const [livePurchases, setLivePurchases] = useState<{ id: string; uid: string; amount: number }[]>([]);
  const [recentPurchasesFeed, setRecentPurchasesFeed] = useState<{ id: string; uid: string; amount: number; time: string }[]>([]);

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
      const randomPkg = UC_PACKAGES[Math.floor(Math.random() * UC_PACKAGES.length)];
      return {
        id: `feed-${i}`,
        uid: maskedUid,
        amount: randomPkg.amount,
        time: `${Math.floor(Math.random() * 59) + 1}m ago`
      };
    });
    setRecentPurchasesFeed(initialFeed);

    const interval = setInterval(() => {
      // Random 10-digit ID starting with 5
      const randomUid = Math.floor(5100000000 + Math.random() * 900000000).toString();
      const maskedUid = `${randomUid.substring(0, 4)}****${randomUid.substring(8)}`;
      const randomPkg = UC_PACKAGES[Math.floor(Math.random() * UC_PACKAGES.length)];
      
      const newPurchase = {
        id: Math.random().toString(36).substring(2, 9),
        uid: maskedUid,
        amount: randomPkg.amount
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
    if (!playerId || !selectedPackage || !selectedPayment || !verifiedName) {
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
          packageId: selectedPackage.id,
          amount: selectedPackage.amount,
          price: selectedPackage.price,
          name: 'N/A',
          email: 'not-provided@cardinguc.com',
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
          description: 'Your order has been placed. Complete payment to receive UC.'
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
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="flex items-center justify-start -ml-1 sm:-ml-2">
              <img 
                src="https://files.catbox.moe/rcy9gr.jpg" 
                alt="CU Icon" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] hover:drop-shadow-[0_2px_16px_rgba(255,255,255,0.25)] transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <div className="flex items-center gap-1.5 bg-green-500/10 rounded-full px-2.5 py-1 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold text-green-400 uppercase tracking-wider whitespace-nowrap">Server Active</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-4">
              <Button variant="ghost" className="text-sm font-medium px-3" render={<a href="#packages" />}>
                Packages
              </Button>
              <Button variant="ghost" className="text-sm font-medium px-3" render={<a href="#about" />}>
                About Us
              </Button>
              <Button variant="ghost" className="text-sm font-medium px-3" render={<a href="#support" />}>
                Support
              </Button>
              <Button 
                variant="outline" 
                className="text-xs font-bold border-sky-500/50 text-sky-600 hover:bg-sky-500/10 px-3 h-9 uppercase tracking-tighter" 
                render={<a href="https://t.me/+14347328402" target="_blank" rel="noopener noreferrer" />}
              >
                <TelegramIcon className="w-3.5 h-3.5 mr-1" />
                Telegram <span className="hidden lg:inline ml-1">Support</span>
              </Button>
            </nav>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg touch-target active:bg-primary/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border/40 bg-background/98 backdrop-blur-xl"
            >
              <nav className="container mx-auto px-3 py-3 flex flex-col gap-1">
                <a href="#packages" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary/10 active:bg-primary/15 transition-colors touch-target">
                  <Zap className="w-4 h-4 text-primary" /> Packages
                </a>
                <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary/10 active:bg-primary/15 transition-colors touch-target">
                  <Info className="w-4 h-4 text-primary" /> About Us
                </a>
                <a href="#support" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary/10 active:bg-primary/15 transition-colors touch-target">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Support
                </a>
                <div className="h-px bg-border/40 my-1" />
                <a href="https://t.me/+14347328402" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-sky-500 bg-sky-500/10 hover:bg-sky-500/15 active:bg-sky-500/20 transition-colors touch-target">
                  <TelegramIcon className="w-4 h-4" /> Telegram Support
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        {/* Hero Section */}
        <section 
          className="mb-6 sm:mb-8 md:mb-12 relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/20 via-background to-background border border-primary/20 p-4 sm:p-5 md:p-12 group/hero hardware-grid min-h-[220px] sm:min-h-[300px] flex flex-col justify-center"
          style={{ touchAction: 'pan-y' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            mouseX.set(0);
            mouseY.set(0);
          }}
        >
          {/* Animated Background Elements */}
          <motion.div 
            style={{ x: springX, y: springY }}
            className="absolute top-0 right-0 w-1/2 h-full opacity-5 md:opacity-10 pointer-events-none z-0"
          >
            <Gamepad2 className="w-full h-full text-primary rotate-12 translate-x-1/4 scale-150 md:scale-100" />
          </motion.div>

          <motion.div 
            style={{ 
              translateX: useTransform(springX, (x) => x * -40),
              translateY: useTransform(springY, (y) => y * -40)
            }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"
          />
          <motion.div 
            style={{ 
              translateX: useTransform(springX, (x) => x * 60),
              translateY: useTransform(springY, (y) => y * 60)
            }}
            className="absolute -bottom-24 right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative z-10 max-w-2xl">
            <Badge className="mb-3 md:mb-4 bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] md:text-sm">Official Partner</Badge>
            <h1 className="text-2xl sm:text-3xl md:text-6xl font-black tracking-tight mb-3 md:mb-4 uppercase italic leading-none">
              BGMI UC <span className="text-primary">TOP-UP</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-8 max-w-md">
              Get instant UC delivery to your BGMI account. Secure payments and 24/7 support.
            </p>
            <div className="flex flex-wrap gap-2 md:gap-4 font-mono">
              <div className="flex items-center gap-1.5 md:gap-2 bg-card/50 px-3 py-1.5 rounded-full border border-border">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-xs font-semibold uppercase">Instant Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-card/50 px-3 py-1.5 rounded-full border border-border">
                <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-[10px] md:text-xs font-semibold uppercase">Secure</span>
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
              <div key={i} className="text-center p-3 rounded-xl bg-card/20 border border-white/5">
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
              <Card className="rounded-[2rem] border border-primary/20 bg-card/40 backdrop-blur-md shadow-xl p-6 sm:p-8 w-full glass-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">1</div>
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
                              "pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all text-base disabled:opacity-50 rounded-xl",
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
                            "h-12 px-6 font-bold uppercase tracking-wider rounded-xl transition-all",
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
                            <div className="flex items-center gap-5 p-4 sm:p-5 rounded-[2rem] bg-primary/5 backdrop-blur-sm border border-primary/20 shadow-[0_0_40px_rgba(var(--primary),0.15)] relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 relative z-10 shadow-inner">
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
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>To find your Player ID, open BGMI, click on your profile icon in the top-left corner. Your Player ID is listed under your nickname.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Step 2: Select UC */}
            <motion.div
              id="packages"
              className="scroll-mt-24"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-[2rem] border border-primary/20 bg-card/40 backdrop-blur-md shadow-xl p-6 sm:p-8 w-full glass-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">2</div>
                      <CardTitle className="text-lg uppercase tracking-wider font-black italic">Select UC Pack</CardTitle>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                      {UC_PACKAGES.map((pkg, idx) => (
                        <motion.button
                          key={pkg.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedPackage(pkg)}
                          disabled={isProcessingPayment}
                          className={cn(
                            "relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed touch-target",
                            selectedPackage?.id === pkg.id 
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                              : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                          )}
                        >
                          {pkg.isPopular && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                              <Badge className="bg-primary text-primary-foreground text-[8px] px-2 py-0.5 uppercase font-black tracking-tighter shadow-lg shadow-primary/20 rounded-full">Popular</Badge>
                            </div>
                          )}
                          <div className="w-10 h-10 sm:w-14 sm:h-14 mb-1.5 sm:mb-2 relative">
                            <img 
                              src="https://i.ibb.co/LdZSDhwf/f5cb4b08e7501ad2a7f3423256672e29-removebg-preview.png" 
                              alt="UC" 
                              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-sm sm:text-lg font-black tracking-tight">{pkg.amount} UC</span>
                          {pkg.bonus && (
                            <Badge variant="secondary" className="mt-1 text-[10px] bg-primary/20 text-primary border-primary/20 rounded-full px-2 py-0">
                              +{pkg.bonus} Bonus
                            </Badge>
                          )}
                          <div className="mt-3 text-sm font-bold text-muted-foreground group-hover/btn:text-foreground transition-colors">
                            {pkg.currency} {pkg.price}
                          </div>
                          {selectedPackage?.id === pkg.id && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <CheckCircle2 className="w-5 h-5 text-primary drop-shadow-md" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
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
              <Card className="rounded-[2rem] border border-primary/20 bg-card/40 backdrop-blur-md shadow-xl p-6 sm:p-8 w-full glass-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">3</div>
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
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group/btn disabled:opacity-50 disabled:cursor-not-allowed",
                            selectedPayment?.id === method.id 
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" 
                              : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-white p-2.5 flex items-center justify-center shrink-0 shadow-inner">
                            <img src={method.icon} alt={method.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6 bg-background/30 p-4 rounded-2xl border border-border/30">
                        <div className="text-center sm:text-left">
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Subtotal</div>
                          <div className="text-3xl font-black text-primary tracking-tighter drop-shadow-sm">
                            {selectedPackage ? `${selectedPackage.currency} ${selectedPackage.price}` : '--'}
                          </div>
                        </div>
                        <Button 
                          className="w-full sm:w-auto min-w-[240px] h-14 text-lg font-black uppercase tracking-widest italic group/pay overflow-hidden relative shadow-xl shadow-primary/20 gap-2 rounded-xl"
                          disabled={!playerId || !verifiedName || !selectedPackage || !selectedPayment || isProcessingPayment}
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
                                <ChevronRight className="w-5 h-5 group-hover/pay:translate-x-1 transition-transform" />
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
            <p className="text-muted-foreground text-sm">Real-time successful top-ups from our community</p>
          </div>

          <Card className="border-border/50 bg-card/20 backdrop-blur-sm overflow-hidden max-w-2xl mx-auto shadow-2xl shadow-primary/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 border-b border-border/50">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Player ID</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
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
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted hidden sm:flex items-center justify-center">
                              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            </div>
                            <span className="text-xs sm:text-sm font-mono tracking-wider">{purchase.uid}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-black text-primary uppercase italic tracking-tighter">{purchase.amount} UC</span>
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
                className="bg-card/95 backdrop-blur-md border border-primary/20 p-2 md:p-2.5 rounded-lg shadow-xl shadow-primary/10 flex items-center gap-2.5 min-w-[180px] md:min-w-[220px] relative pointer-events-auto"
              >
                <button 
                  onClick={() => setLivePurchases([])}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border border-background hover:scale-110 active:scale-95 transition-transform z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="text-[10px] font-bold text-foreground truncate leading-none mb-0.5">
                    {purchase.uid}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium truncate leading-none">
                    bought <span className="text-primary font-black uppercase tracking-tighter">{purchase.amount} UC</span>
                  </div>
                </div>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* How It Works Section */}
        <section id="about" className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight mb-2">How it <span className="text-primary">Works</span></h2>
            <p className="text-muted-foreground">Get your UC in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            {[
              { icon: UserIcon, title: "Enter ID", desc: "Enter your BGMI Player ID and verify your nickname." },
              { icon: Zap, title: "Select UC", desc: "Choose the UC package that fits your needs." },
              { icon: CreditCard, title: "Pay & Receive", desc: "Complete payment and receive UC instantly." }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-card/20 border border-border/50"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 border border-primary/20">
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
              { q: "Is it safe to top-up here?", a: "Yes, we are an official partner. All transactions are secure and encrypted." },
              { q: "How long does delivery take?", a: "UC is delivered instantly to your account after payment confirmation." },
              { q: "What if I enter the wrong ID?", a: "Please double-check your ID. We verify nicknames to help prevent errors." },
              { q: "Do you offer refunds?", a: "Refunds are processed only if the UC is not delivered due to technical issues." }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="p-4 sm:p-6 rounded-xl bg-card/30 border border-border/50 hover:border-primary/30 transition-colors"
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
        <section id="support" className="mb-12 sm:mb-16 md:mb-24 p-4 sm:p-6 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight mb-4">Need <span className="text-primary">Support?</span></h2>
              <p className="text-muted-foreground mb-8">Our dedicated support team is available 24/7 to help you with any issues or questions.</p>
              <div className="space-y-4">
                <Button 
                  className="w-full sm:w-auto h-12 px-8 font-bold uppercase tracking-wider gap-2 shadow-lg shadow-sky-500/20 bg-sky-600 hover:bg-sky-700 border-none mb-4 sm:mb-0" 
                  render={
                    <a href="https://t.me/+14347328402" target="_blank" rel="noopener noreferrer">
                      <TelegramIcon className="w-5 h-5 text-white" />
                      Telegram Support
                    </a>
                  } 
                />
                <Button 
                  className="w-full sm:w-auto h-12 px-8 font-bold uppercase tracking-wider gap-2 ml-0 sm:ml-4 shadow-lg shadow-green-500/20 bg-[#25D366] hover:bg-[#20bd5a] border-none text-white" 
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
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
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
                <div key={idx} className={cn("p-4 rounded-xl bg-background/50 border border-border/50")}>
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
        <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-green-500/20 overflow-hidden p-0 rounded-[2rem] shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <div className="relative p-6 sm:p-8">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header section with status */}
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
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
              className="relative z-10 bg-gradient-to-br from-background/80 to-background/40 border border-white/5 rounded-2xl p-6 mb-8 shadow-inner overflow-hidden group"
            >
              {/* Card Background Patterns */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/30 group-hover:scale-105 transition-transform duration-500 p-2 overflow-hidden bg-black/40">
                    <UserIcon className="w-10 h-10 text-primary" />
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full border-4 border-background flex items-center justify-center"
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
                className="w-full h-14 text-base font-black uppercase tracking-widest italic group/verified relative overflow-hidden bg-primary hover:bg-primary/90 text-white border-none rounded-xl shadow-xl shadow-primary/20"
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
      <footer className="mt-12 md:mt-20 border-t border-border/30 bg-background py-12 md:py-16 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none opacity-50" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-16">
            <div className="col-span-1 md:col-span-6 flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-foreground mb-3">
                  CARDING <span className="text-primary">UC</span>
                </h3>
                <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-md">
                  India's premier destination for instant BGMI UC top-ups. We deliver lightning-fast processing, bank-grade security, and unmatched reliability for gamers nationwide.
                </p>
              </div>
              
              <div className="flex flex-col gap-3 text-sm font-medium text-muted-foreground/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                  </div>
                  100% Safe & Official Process
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Zap className="w-3 h-3 text-amber-500" />
                  </div>
                  Instant Automated Delivery
                </div>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-3 md:pl-8">
              <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-foreground/90">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground/70 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Refund Policy</a></li>
              </ul>
            </div>
            
            <div className="col-span-1 md:col-span-3">
              <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-foreground/90">Support</h4>
              <ul className="space-y-4 text-sm text-muted-foreground/70 font-medium">
                <li><a href="#support" className="hover:text-primary transition-colors inline-flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Help Center</a></li>
                <li>
                  <a href="https://t.me/+14347328402" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center">
                      <TelegramIcon className="w-3 h-3 text-sky-500" />
                    </div>
                    Telegram Support
                  </a>
                </li>
                <li><a href="#support" className="hover:text-primary transition-colors inline-flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" /> FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs text-muted-foreground/50 uppercase tracking-widest font-bold">
            <p>Copyright © 2026 CARDINGUC. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Gamepad2 className="w-3.5 h-3.5" /> Gamers First</span>
              <div className="w-1 h-1 rounded-full bg-border/50" />
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> SSL Secured</span>
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
        className="fixed bottom-4 right-3 sm:right-4 md:bottom-6 md:right-6 z-[60] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(37,211,102,0.4)] border border-white/20 transition-all touch-target safe-bottom"
      >
        <WhatsAppIcon className="w-8 h-8 md:w-10 md:h-10" />
        <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-30" />
      </motion.a>
    </div>
  );
}
