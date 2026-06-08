export interface SkinPackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  category: 'xsuit' | 'gunskin';
  description?: string;
  zoom?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export const SKIN_PACKAGES: SkinPackage[] = [
  // X-Suits
  { 
    id: 'skin-dark-raven', 
    name: 'Dark Raven X-Suit', 
    price: 1999, 
    currency: 'INR', 
    category: 'xsuit',
    image: '/skins/dark-raven.png',
    zoom: 'scale-[1.1] group-hover/skin:scale-[1.2]'
  },
  { 
    id: 'skin-pharaoh', 
    name: 'Golden Pharaoh X-Suit', 
    price: 2499, 
    currency: 'INR', 
    category: 'xsuit',
    image: '/skins/pharaoh.png',
    zoom: 'scale-[1.15] group-hover/skin:scale-[1.25]'
  },
  { 
    id: 'skin-phoenixtra', 
    name: 'Phoenixtra X-Suit', 
    price: 1299, 
    currency: 'INR', 
    category: 'xsuit',
    image: '/skins/phoenixtra.png',
    zoom: 'scale-[1.1] group-hover/skin:scale-[1.2]'
  },
  { 
    id: 'skin-poseidon', 
    name: 'Poseidon X-Suit', 
    price: 1799, 
    currency: 'INR', 
    category: 'xsuit',
    image: '/skins/poseidon.jpg',
    zoom: 'scale-[1.15] group-hover/skin:scale-[1.25]'
  },
  // Gun Skins
  { 
    id: 'skin-m4-glacier', 
    name: 'M416 Glacier', 
    price: 999, 
    currency: 'INR', 
    category: 'gunskin',
    image: '/skins/m4-glacier.png',
    zoom: 'scale-[1.2] group-hover/skin:scale-[1.3]'
  },
  { 
    id: 'skin-m4-fool', 
    name: 'M416 The Fool', 
    price: 1899, 
    currency: 'INR', 
    category: 'gunskin',
    image: '/skins/m4-fool.png',
    zoom: 'scale-[1.2] group-hover/skin:scale-[1.3]'
  },
  { 
    id: 'skin-akm-glacier', 
    name: 'AKM Glacier', 
    price: 1499, 
    currency: 'INR', 
    category: 'gunskin',
    image: '/skins/akm-glacier.png',
    zoom: 'scale-[1.2] group-hover/skin:scale-[1.3]'
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'upi', name: 'UPI Payment Gateway', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg', description: 'Pay using any UPI app (PhonePe, Google Pay, Paytm, etc.)' },
];

