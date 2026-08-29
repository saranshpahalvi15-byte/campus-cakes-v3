/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Campus {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface CustomQuestion {
  id: string;
  question: string;
  type: 'text' | 'dropdown' | 'checkbox';
  options?: string[];
  required?: boolean;
}

export interface CakeItem {
  id: string;
  name: string;
  description: string;
  price: number; // base price for smallest weight
  rating: number;
  category: string;
  isEggless: boolean;
  isTrending: boolean;
  image: string;
  deliveryTime: string;
  weights: number[]; // e.g. [0.5, 1, 1.5, 2]
  weightPrices?: Record<number, number>; // Maps weight to its specific price
  flavors: string[];
  campusIds?: string[];
  isDineIn?: boolean;
  isDelivery?: boolean;
  customQuestions?: CustomQuestion[];
  hideWeightSelection?: boolean;
  hideFlavorSelection?: boolean;
  hideMessageOnCake?: boolean;
  hideEventAddons?: boolean;
  hideQuantitySelection?: boolean;
}

export interface KioskCake {
  id: string;
  name: string;
  price: number;
  flavor: string;
  remainingStock: number;
  totalStock: number;
  image: string;
  campusIds?: string[];
}

export interface OrderItemCustomization {
  flavor: string;
  weight: number;
  messageOnCake: string;
  photoUrl?: string;
  addCandles: boolean;
  addKnife: boolean;
  pickupTime: string;
  specialInstructions?: string;
  customAnswers?: Record<string, any>;
}

export interface CartItem {
  id: string; // uniques composite id
  cakeId: string;
  name: string;
  basePrice: number;
  price: number;
  image: string;
  quantity: number;
  customization?: OrderItemCustomization;
  isInstantKiosk?: boolean;
  category?: string;
}

export type OrderStatus = 'placed' | 'preparing' | 'prepared' | 'delivery' | 'ready' | 'completed';

export interface Order {
  id: string;
  campusId: string;
  items: CartItem[];
  orderType: 'pre-order' | 'instant-pickup';
  status: OrderStatus;
  userStatus?: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  pointsEarned: number;
  date: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  serviceMode?: 'delivery' | 'dinein';
  employeeReferral?: string;
  employeeCommission?: number;
  discountCode?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedManagerId?: string;
  assignedManagerName?: string;
  assignedDeliveryId?: string;
  assignedDeliveryName?: string;
  isPacked?: boolean;
  packedByEmployeeId?: string;
  packedByEmployeeName?: string;
  packedAt?: string;
}

export interface SavedCelebration {
  id: string;
  name: string;
  relation: string;
  date: string; // YYYY-MM-DD
  remindMe: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  campusId: string;
  rewardPoints: number;
  savedCelebrations: SavedCelebration[];
  wishlist: string[]; // cakeIds
  uid?: string;
  walletBalance?: number;
  didWalletReset2026?: boolean;
  didDeploymentReset2026?: boolean;
  dob?: string;
  employeeId?: string;
  pushSubscription?: any;
}

export interface Coupon {
  id: string;
  code: string;
  occasion: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  usageLimit: number;
  usersUsed: string[];
  isActive: boolean;
  createdAt: string;
}

export interface FeedbackReview {
  id: string;
  userName: string;
  userImage: string;
  rating: number;
  comment: string;
  cakeName: string;
  date: string;
  image?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  post: 'Campus Manager' | 'Customer Experience Executive' | 'Packaging & Branding Executive' | 'Delivery Executive (Boys\' Hostel)' | 'Delivery Executive (Girls\' Hostel)';
  campusId?: string;
  dateJoined: string;
  discountType?: 'percentage' | 'flat';
  discountValue?: number;
  commissionType?: 'percentage' | 'flat';
  commissionValue?: number;
  promoCode?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  campusId: string; // 'all' or specific campusId
  dateRegistered: string;
}

export interface GiftItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  partnerGallery?: string;
}

