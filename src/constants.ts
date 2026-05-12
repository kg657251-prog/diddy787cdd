export interface UCPackage {
  id: string;
  amount: number;
  bonus?: number;
  price: number;
  currency: string;
  isPopular?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export const UC_PACKAGES: UCPackage[] = [
  { id: 'uc-1800', amount: 1800, price: 299, currency: 'INR' },
  { id: 'uc-8100', amount: 8100, price: 599, currency: 'INR', isPopular: true },
  { id: 'uc-16200', amount: 16200, price: 999, currency: 'INR' },
  { id: 'uc-32400', amount: 32400, price: 1899, currency: 'INR' },
  { id: 'uc-64800', amount: 64800, price: 3499, currency: 'INR' },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'upi', name: 'UPI Payment Gateway', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg', description: 'Pay using any UPI app (PhonePe, Google Pay, Paytm, etc.)' },
];
