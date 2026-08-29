/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, Order, CakeItem, KioskCake, SavedCelebration, Coupon, CustomQuestion, Employee, Vendor, GiftItem } from '../types';
import { 
  User, Award, Calendar, Gift, RefreshCw, Eye, Sparkles, MapPin, 
  ArrowRight, Coins, Share2, Plus, Trash2, Shield, Settings,
  TrendingUp, Clock, ShoppingBag, BarChart2, IndianRupee, Users, CheckCircle, Package,
  Truck, Phone, Mail, Download, Tag, QrCode, Edit, Bell, ClipboardCheck, Bike, Star, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadReceiptFile } from '../lib/receipt';
import { safeStorage } from '../lib/safeStorage';

interface DashboardSectionProps {
  user: UserProfile;
  orders: Order[];
  allCakes: CakeItem[];
  kioskInventory: KioskCake[];
  coupons?: Coupon[];
  onAddCoupon?: (c: Coupon) => void;
  onUpdateCouponStatus?: (id: string, active: boolean) => void;
  onDeleteCoupon?: (id: string) => void;
  onRepeatOrder: (orderId: string) => void;
  onUpdateKioskStock: (id: string, newStock: number) => void;
  onUpdateOrderStatus: (orderId: string, status: any, updateClientVisible?: boolean, isUserVisibleOnly?: boolean) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onAddCelebration: (celebration: SavedCelebration) => void;
  onDeleteCelebration: (id: string) => void;
  onAddCustomCake: (newCake: CakeItem) => void;
  onAddCampus?: (name: string, location: string) => void;
  onAddKioskProduct?: (newProduct: KioskCake) => void;
  onDeleteCustomCake?: (cakeId: string) => void;
  onEditCustomCake?: (updatedCake: CakeItem) => void;
  onDeleteKioskProduct?: (kioskId: string) => void;
  onEditKioskProduct?: (updatedKioskProduct: KioskCake) => void;
  campuses?: { id: string; name: string; location: string; active: boolean }[];
  onDeleteCampus?: (id: string) => void;
  isAdmin?: boolean;
  onPurgeAndResetDatabase?: () => void;
  onShowToast?: (title: string, body: string) => void;
  employees?: Employee[];
  onAddEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
  onSavePushSubscription?: (sub: any) => Promise<void>;
  vendors?: Vendor[];
  onAddVendor?: (v: Vendor) => void;
  onDeleteVendor?: (id: string) => void;
  gifts?: GiftItem[];
  onAddGift?: (gift: GiftItem) => void;
  onDeleteGift?: (id: string) => void;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function DashboardSection({
  user,
  orders,
  allCakes,
  kioskInventory,
  coupons = [],
  onAddCoupon,
  onUpdateCouponStatus,
  onDeleteCoupon,
  onRepeatOrder,
  onUpdateKioskStock,
  onUpdateOrderStatus,
  onUpdateOrder,
  onAddCelebration,
  onDeleteCelebration,
  onAddCustomCake,
  onAddCampus,
  onAddKioskProduct,
  onDeleteCustomCake,
  onEditCustomCake,
  onDeleteKioskProduct,
  onEditKioskProduct,
  campuses = [],
  onDeleteCampus,
  isAdmin = false,
  onPurgeAndResetDatabase,
  onShowToast,
  employees = [],
  onAddEmployee,
  onDeleteEmployee,
  onSavePushSubscription,
  vendors = [],
  onAddVendor,
  onDeleteVendor,
  gifts = [],
  onAddGift,
  onDeleteGift,
}: DashboardSectionProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'admin' | 'employee' | 'vendor'>('student');
  const [addressInput, setAddressInput] = useState(user.address);
  const [isSavedAddress, setIsSavedAddress] = useState(true);

  const [subscribing, setSubscribing] = useState(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isInIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  });

  const handleSubscribePush = async () => {
    try {
      setSubscribing(true);
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers are not supported in this browser.');
      }
      if (!('PushManager' in window)) {
        throw new Error('Push Notifications are not supported in this browser.');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission was denied.');
      }

      // Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Subscribe to Push
      const vapidPublicKey = 'BGPRoIA45fmkvy9r8ZWSJ5qq9zQrRP3mR3J-QmAuZQdlsK91HwtWBP4wbEjjDLvZsLqrnF1b353KSDjLAJtxOWg';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('Successfully subscribed to Web Push:', subscription);

      // Convert Subscription to JSON for saving
      const subscriptionJSON = subscription.toJSON();

      if (onSavePushSubscription) {
        await onSavePushSubscription(subscriptionJSON);
      }
      if (onShowToast) {
        onShowToast("🔔 Web Push Activated", "You have successfully subscribed to Web Push tracking alerts.");
      }
    } catch (err: any) {
      console.error('Push Subscription Error:', err);
      if (onShowToast) {
        onShowToast("⚠️ Activation Failed", err?.message || "Could not complete push registration.");
      }
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribePush = async () => {
    try {
      setSubscribing(true);
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      if (onSavePushSubscription) {
        await onSavePushSubscription(null);
      }
      if (onShowToast) {
        onShowToast("🔕 Web Push Deactivated", "You have unsubscribed from Web Push tracking alerts.");
      }
    } catch (err: any) {
      console.error('Push Unsubscription Error:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Show a local push notification as a test
        await registration.showNotification("🎉 Push Success!", {
          body: "Web Push API is fully integrated with VAPID authentication!",
          icon: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=128&auto=format&fit=crop&q=80',
          badge: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=128&auto=format&fit=crop&q=80',
          vibrate: [100, 50, 100],
        } as any);
        setTestNotificationStatus('success');
        setTimeout(() => setTestNotificationStatus('idle'), 3000);
      } else {
        throw new Error("No active service worker found to trigger test notification.");
      }
    } catch (err: any) {
      console.error('Test Push Error:', err);
      setTestNotificationStatus('failed');
      setTimeout(() => setTestNotificationStatus('idle'), 3000);
    }
  };

  // Employee referral / commission settings states for onboarding
  const [newEmpPromoCode, setNewEmpPromoCode] = useState('');
  const [newEmpDiscountType, setNewEmpDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [newEmpDiscountValue, setNewEmpDiscountValue] = useState('10');
  const [newEmpCommissionType, setNewEmpCommissionType] = useState<'percentage' | 'flat'>('percentage');
  const [newEmpCommissionValue, setNewEmpCommissionValue] = useState('5');

  // Inline directory employee editing states
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingEmployeePost, setEditingEmployeePost] = useState<Employee['post']>('Campus Manager');
  const [editingEmployeeCampusId, setEditingEmployeeCampusId] = useState('');
  const [editingPromoCode, setEditingPromoCode] = useState('');
  const [editingDiscountType, setEditingDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [editingDiscountValue, setEditingDiscountValue] = useState('');
  const [editingCommissionType, setEditingCommissionType] = useState<'percentage' | 'flat'>('percentage');
  const [editingCommissionValue, setEditingCommissionValue] = useState('');

  const userEmailLower = user?.email?.toLowerCase().trim() || '';
  const currentEmployee = employees.find(emp => emp?.email?.toLowerCase().trim() === userEmailLower);
  const isEmployee = !!currentEmployee;

  const currentVendor = vendors.find(v => v?.email?.toLowerCase().trim() === userEmailLower);
  const isVendor = !!currentVendor;

  // Dynamic Ambassador QR configurations
  const [qrBaseUrlType, setQrBaseUrlType] = useState<'production' | 'editor' | 'custom'>(() => {
    return (safeStorage.getItem('cc_qr_base_url_type') as any) || 'production';
  });
  const [customQrBaseUrl, setCustomQrBaseUrl] = useState(() => {
    return safeStorage.getItem('cc_custom_qr_base_url') || '';
  });

  React.useEffect(() => {
    if (isVendor) {
      setActiveTab('vendor');
    } else if (isEmployee) {
      setActiveTab('employee');
    } else if (isAdmin) {
      setActiveTab('admin');
    } else {
      setActiveTab('student');
    }
  }, [isVendor, isEmployee, isAdmin, user.email]);

  // New celebration state
  const [newCelebName, setNewCelebName] = useState('');
  const [newCelebRelation, setNewCelebRelation] = useState('Dorm Roommate');
  const [newCelebDate, setNewCelebDate] = useState('2026-05-24');

  // Admin section: new product state
  const [newCakeName, setNewCakeName] = useState('');
  const [newCakePrice, setNewCakePrice] = useState('499');
  const [newCakeCategory, setNewCakeCategory] = useState('Birthday Cakes');
  const [newCakeDesc, setNewCakeDesc] = useState('');
  const [newCakeImage, setNewCakeImage] = useState<string>('');
  const [newCakeWeights, setNewCakeWeights] = useState<number[]>([0.5, 1.0, 1.5, 2.0]);
  const [newCakeWeightPrices, setNewCakeWeightPrices] = useState<Record<number, number>>({});
  const [newCakeCampusIds, setNewCakeCampusIds] = useState<string[]>([]);
  const [newCakeIsDineIn, setNewCakeIsDineIn] = useState<boolean>(true);
  const [newCakeIsDelivery, setNewCakeIsDelivery] = useState<boolean>(true);
  const [newCakeQuestions, setNewCakeQuestions] = useState<CustomQuestion[]>([]);
  const [newCakeHideWeight, setNewCakeHideWeight] = useState(false);
  const [newCakeHideFlavor, setNewCakeHideFlavor] = useState(false);
  const [newCakeHideMessage, setNewCakeHideMessage] = useState(false);
  const [newCakeHideAddons, setNewCakeHideAddons] = useState(false);
  const [newCakeHideQuantity, setNewCakeHideQuantity] = useState(false);

  // Admin section: editing product state
  const [editingCakeId, setEditingCakeId] = useState<string | null>(null);
  const [editingCakeName, setEditingCakeName] = useState('');
  const [editingCakePrice, setEditingCakePrice] = useState('');
  const [editingCakeCategory, setEditingCakeCategory] = useState('');
  const [editingCakeDesc, setEditingCakeDesc] = useState('');
  const [editingCakeImage, setEditingCakeImage] = useState('');
  const [editingCakeWeights, setEditingCakeWeights] = useState<number[]>([]);
  const [editingCakeWeightPrices, setEditingCakeWeightPrices] = useState<Record<number, number>>({});
  const [editingCakeCampusIds, setEditingCakeCampusIds] = useState<string[]>([]);
  const [editingCakeIsDineIn, setEditingCakeIsDineIn] = useState<boolean>(true);
  const [editingCakeIsDelivery, setEditingCakeIsDelivery] = useState<boolean>(true);
  const [editingCakeQuestions, setEditingCakeQuestions] = useState<CustomQuestion[]>([]);
  const [editingCakeHideWeight, setEditingCakeHideWeight] = useState(false);
  const [editingCakeHideFlavor, setEditingCakeHideFlavor] = useState(false);
  const [editingCakeHideMessage, setEditingCakeHideMessage] = useState(false);
  const [editingCakeHideAddons, setEditingCakeHideAddons] = useState(false);
  const [editingCakeHideQuantity, setEditingCakeHideQuantity] = useState(false);

  // Admin section: new kiosk product state
  const [newKioskName, setNewKioskName] = useState('');
  const [newKioskPrice, setNewKioskPrice] = useState('99');
  const [newKioskFlavor, setNewKioskFlavor] = useState('Chocolate');
  const [newKioskStock, setNewKioskStock] = useState('25');
  const [newKioskImage, setNewKioskImage] = useState('');
  const [newKioskCampusIds, setNewKioskCampusIds] = useState<string[]>([]);

  // Admin section: editing kiosk product state
  const [editingKioskId, setEditingKioskId] = useState<string | null>(null);
  const [editingKioskName, setEditingKioskName] = useState('');
  const [editingKioskPrice, setEditingKioskPrice] = useState('');
  const [editingKioskFlavor, setEditingKioskFlavor] = useState('');
  const [editingKioskStock, setEditingKioskStock] = useState('');
  const [editingKioskImage, setEditingKioskImage] = useState('');
  const [editingKioskCampusIds, setEditingKioskCampusIds] = useState<string[]>([]);

  // Admin section: new campus state
  const [newCampusName, setNewCampusName] = useState('');
  const [newCampusLocation, setNewCampusLocation] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'orders' | 'prepared' | 'kiosk' | 'catalog' | 'campus' | 'coupons' | 'qrcodes' | 'employees' | 'vendors' | 'gifts'>('analytics');
  const [preparedCampusFilter, setPreparedCampusFilter] = useState<string>('all');
  
  // Admin section: gift items states
  const [editingGiftItem, setEditingGiftItem] = useState<GiftItem | null>(null);
  const [giftName, setGiftName] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftCategory, setGiftCategory] = useState('Flowers');
  const [giftRating, setGiftRating] = useState('4.8');
  const [giftImage, setGiftImage] = useState('');
  const [giftDescription, setGiftDescription] = useState('');
  const [giftSearch, setGiftSearch] = useState('');
  const [deletingGiftId, setDeletingGiftId] = useState<string | null>(null);
  
  // Admin section: new employee state
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPost, setNewEmpPost] = useState<Employee['post']>('Campus Manager');
  const [newEmpCampusId, setNewEmpCampusId] = useState('');

  const [empSearch, setEmpSearch] = useState('');
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);

  // Admin section: vendor states
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorCampusId, setNewVendorCampusId] = useState('all');
  const [vendorSearch, setVendorSearch] = useState('');
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);

  // Vendor Workspace states
  const [activeVendorSubTab, setActiveVendorSubTab] = useState<'inventory' | 'orders'>('inventory');
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'placed' | 'preparing' | 'prepared' | 'delivery' | 'ready'>('all');
  const [adminServiceModeFilter, setAdminServiceModeFilter] = useState<'all' | 'delivery' | 'dinein'>('all');

  // Admin section: coupons
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponOccasion, setNewCouponOccasion] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage'|'flat'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponLimit, setNewCouponLimit] = useState('');

  // Admin section: qr codes
  const [qrTableCount, setQrTableCount] = useState<number>(4);
  const [qrBaseUrl, setQrBaseUrl] = useState<string>(`${window.location.origin}${window.location.pathname}`);

  // Real-time dynamic business startup calculations
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's revenue (sum total of orders placed today)
  const todayOrders = orders.filter(o => o.timestamp && o.timestamp.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  // Calculate yesterday's stats to show dynamic comparison trends
  const yesterdaysDate = new Date();
  yesterdaysDate.setDate(yesterdaysDate.getDate() - 1);
  const yesterdayStr = yesterdaysDate.toISOString().split('T')[0];
  const yesterdayOrders = orders.filter(o => o.timestamp && o.timestamp.startsWith(yesterdayStr));
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  const revenueTrendPercent = yesterdayRevenue > 0
    ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
    : null;

  // Active / Total Orders counts
  const totalOrdersCount = orders.length;
  const instantPickupCount = orders.filter(o => o.orderType === 'instant-pickup' || o.items?.some(i => i.isInstantKiosk)).length;
  const preOrdersCount = orders.filter(o => o.orderType === 'pre-order' && !o.items?.some(i => i.isInstantKiosk)).length;

  // Returning Customer Retention rates
  const customersMap: Record<string, number> = {};
  let anonymousCount = 0;
  orders.forEach(o => {
    const key = o.userId && o.userId !== 'anonymous-user'
      ? o.userId
      : (o.userEmail && o.userEmail !== 'unverified@campus-cakes.com'
          ? o.userEmail
          : (o.customerName || `anon-${anonymousCount++}`));
    customersMap[key] = (customersMap[key] || 0) + 1;
  });
  const uniqueCustomers = Object.keys(customersMap).length;
  const repeatCustomers = Object.values(customersMap).filter(count => count > 1).length;
  const returningRate = uniqueCustomers > 0 
    ? ((repeatCustomers / uniqueCustomers) * 100).toFixed(1)
    : '0.0';

  // Popular Flavor
  const flavorCounts: Record<string, number> = {};
  orders.forEach(o => {
    o.items?.forEach(item => {
      const flavorOption = item.customization?.flavor || item.name;
      if (flavorOption) {
        flavorCounts[flavorOption] = (flavorCounts[flavorOption] || 0) + item.quantity;
      }
    });
  });
  let popularFlavor = 'None yet';
  let maxFlavorCount = 0;
  Object.entries(flavorCounts).forEach(([flavor, count]) => {
    if (count > maxFlavorCount) {
      maxFlavorCount = count;
      popularFlavor = flavor;
    }
  });

  // Hourly Peak Orders indicator (live counts grouped dynamically)
  const hourlyDistribution: Record<string, number> = {
    '12 PM': 0, '2 PM': 0, '4 PM': 0, '6 PM': 0, '8 PM': 0, '10 PM': 0, '12 AM': 0
  };
  orders.forEach(o => {
    if (!o.timestamp) return;
    const hour = new Date(o.timestamp).getHours(); // 0-23
    if (hour >= 11 && hour < 13) hourlyDistribution['12 PM']++;
    else if (hour >= 13 && hour < 15) hourlyDistribution['2 PM']++;
    else if (hour >= 15 && hour < 17) hourlyDistribution['4 PM']++;
    else if (hour >= 17 && hour < 19) hourlyDistribution['6 PM']++;
    else if (hour >= 19 && hour < 21) hourlyDistribution['8 PM']++;
    else if (hour >= 21 && hour < 23) hourlyDistribution['10 PM']++;
    else if (hour >= 23 || hour < 1) hourlyDistribution['12 AM']++;
  });
  const maxHourValue = Math.max(...Object.values(hourlyDistribution), 1);

  // Segment yields
  let totalItemsCount = 0;
  let kioskItemsCount = 0;
  let customItemsCount = 0;
  let regularPreOrderCount = 0;

  orders.forEach(o => {
    o.items?.forEach(item => {
      totalItemsCount += item.quantity;
      if (o.orderType === 'instant-pickup' || item.isInstantKiosk) {
        kioskItemsCount += item.quantity;
      } else if (item.customization) {
        customItemsCount += item.quantity;
      } else {
        regularPreOrderCount += item.quantity;
      }
    });
  });

  const kioskPct = totalItemsCount > 0 ? Math.round((kioskItemsCount / totalItemsCount) * 100) : 0;
  const customPct = totalItemsCount > 0 ? Math.round((customItemsCount / totalItemsCount) * 100) : 0;
  const preOrderPct = totalItemsCount > 0 ? Math.round((regularPreOrderCount / totalItemsCount) * 100) : 0;

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail || !newEmpPost) return;
    
    const cleanEmail = newEmpEmail.toLowerCase().trim();

    // 1. Check if email belongs to platform administrators
    const adminEmails = ['saransh1860@gmail.com', 'tanishapahal606@gmail.com', 'tanishapahal606@gmal.com'];
    if (adminEmails.includes(cleanEmail)) {
      if (onShowToast) {
        onShowToast("Registration Blocked", "This email is registered to a Campus Administrator and cannot hold multiple posts simultaneously.");
      }
      return;
    }

    // 2. Check if email is already registered as an employee
    const isAlreadyEmployee = employees.some(emp => emp?.email?.toLowerCase().trim() === cleanEmail);
    if (isAlreadyEmployee) {
      if (onShowToast) {
        onShowToast("Registration Blocked", "This email is already registered as an Employee.");
      }
      return;
    }

    // 3. Check if email is registered as a vendor (no dual role allowed)
    const isAlreadyVendor = vendors.some(v => v?.email?.toLowerCase().trim() === cleanEmail);
    if (isAlreadyVendor) {
      if (onShowToast) {
        onShowToast("Registration Blocked", "This email is currently registered as a Vendor and cannot hold multiple posts. Please revoke/delete their Vendor status first.");
      }
      return;
    }

    onAddEmployee?.({
      id: 'emp-' + Date.now(),
      name: newEmpName,
      email: newEmpEmail.trim(),
      post: newEmpPost,
      campusId: newEmpCampusId || undefined,
      dateJoined: new Date().toISOString().split('T')[0],
      promoCode: newEmpPromoCode.trim().toUpperCase() || undefined,
      discountType: newEmpDiscountType,
      discountValue: Number(newEmpDiscountValue),
      commissionType: newEmpCommissionType,
      commissionValue: Number(newEmpCommissionValue),
    });
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPost('Campus Manager');
    setNewEmpCampusId('');
    setNewEmpPromoCode('');
    setNewEmpDiscountType('percentage');
    setNewEmpDiscountValue('10');
    setNewEmpCommissionType('percentage');
    setNewEmpCommissionValue('5');
    if (onShowToast) {
      onShowToast("Hiring Complete", `${newEmpName} has been registered as ${newEmpPost}!`);
    }
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newVendorEmail || !newVendorCampusId) return;

    const cleanEmail = newVendorEmail.toLowerCase().trim();

    // 1. Check if email belongs to platform administrators
    const adminEmails = ['saransh1860@gmail.com', 'tanishapahal606@gmail.com', 'tanishapahal606@gmal.com'];
    if (adminEmails.includes(cleanEmail)) {
      if (onShowToast) {
        onShowToast("Registration Blocked", "This email is registered to a Campus Administrator and cannot hold multiple posts simultaneously.");
      } else {
        alert("This email is registered to a Campus Administrator and cannot hold multiple posts simultaneously.");
      }
      return;
    }

    // 2. Check if email is registered as an Employee (no dual role allowed)
    const isAlreadyEmployee = employees.some(emp => emp?.email?.toLowerCase().trim() === cleanEmail);
    if (isAlreadyEmployee) {
      if (onShowToast) {
        onShowToast("Registration Blocked", "This email is currently registered as an Employee and cannot hold multiple posts. Please revoke/delete their Employee status first.");
      } else {
        alert("This email is currently registered as an Employee and cannot hold multiple posts. Please revoke/delete their Employee status first.");
      }
      return;
    }

    // 3. Check if email is already registered as a Vendor
    const isAlreadyVendor = vendors.some(v => v?.email?.toLowerCase().trim() === cleanEmail);
    if (isAlreadyVendor) {
      if (onShowToast) {
        onShowToast("Registration Blocked", "This email is already registered as a Vendor.");
      } else {
        alert("This email is already registered as a Vendor.");
      }
      return;
    }

    onAddVendor?.({
      id: newVendorEmail.trim().toLowerCase(),
      name: newVendorName.trim(),
      email: newVendorEmail.trim().toLowerCase(),
      campusId: newVendorCampusId,
      dateRegistered: new Date().toISOString().split('T')[0],
    });

    setNewVendorName('');
    setNewVendorEmail('');
    setNewVendorCampusId('all');

    if (onShowToast) {
      onShowToast("Vendor Registered", "New vendor onboarded successfully!");
    } else {
      alert("Vendor registered successfully!");
    }
  };

  const handleAddCelebSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCelebName || !newCelebDate) return;
    onAddCelebration({
      id: 'celeb-' + Date.now(),
      name: newCelebName,
      relation: newCelebRelation,
      date: newCelebDate,
      remindMe: true,
    });
    setNewCelebName('');
  };

  const handleAddNewCakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCakeName || !newCakePrice) return;
    onAddCustomCake({
      id: 'custom-' + Date.now(),
      name: newCakeName,
      description: newCakeDesc || 'Artisan campus custom specialty cake.',
      price: parseFloat(newCakePrice),
      rating: 5.0,
      category: newCakeCategory,
      isEggless: true,
      isTrending: true,
      image: newCakeImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
      deliveryTime: '24 Hours',
      weights: newCakeWeights.length > 0 ? newCakeWeights : [0.5, 1.0, 1.5, 2.0],
      weightPrices: newCakeWeightPrices,
      flavors: ['Vanilla Cream', 'Dark Ganache Swirl'],
      campusIds: newCakeCampusIds,
      isDineIn: newCakeIsDineIn,
      isDelivery: newCakeIsDelivery,
      customQuestions: newCakeQuestions,
      hideWeightSelection: newCakeHideWeight,
      hideFlavorSelection: newCakeHideFlavor,
      hideMessageOnCake: newCakeHideMessage,
      hideEventAddons: newCakeHideAddons,
      hideQuantitySelection: newCakeHideQuantity,
    });
    setNewCakeName('');
    setNewCakePrice('499');
    setNewCakeDesc('');
    setNewCakeImage('');
    setNewCakeWeights([0.5, 1.0, 1.5, 2.0]);
    setNewCakeWeightPrices({});
    setNewCakeCampusIds([]);
    setNewCakeIsDineIn(true);
    setNewCakeIsDelivery(true);
    setNewCakeQuestions([]);
    setNewCakeHideWeight(false);
    setNewCakeHideFlavor(false);
    setNewCakeHideMessage(false);
    setNewCakeHideAddons(false);
    setNewCakeHideQuantity(false);
    if (onShowToast) {
      onShowToast("Catalog Updated", "Artisan cake added to pre-order menu successfully!");
    } else {
      alert('Artisan cake added to pre-order menu successfully!');
    }
  };

  const handleAddNewCampusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusName || !newCampusLocation) return;
    if (onAddCampus) {
      onAddCampus(newCampusName, newCampusLocation);
      setNewCampusName('');
      setNewCampusLocation('');
      if (onShowToast) {
        onShowToast("Hub Added", `New campus "${newCampusName}" added successfully!`);
      } else {
        alert('New campus added successfully!');
      }
    }
  };

  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponOccasion || !newCouponValue || !newCouponLimit) return;
    if (onAddCoupon) {
      onAddCoupon({
        id: 'coupon-' + Date.now().toString(),
        code: newCouponCode,
        occasion: newCouponOccasion,
        discountType: newCouponType,
        discountValue: parseFloat(newCouponValue),
        usageLimit: parseInt(newCouponLimit),
        usersUsed: [],
        isActive: true,
        createdAt: new Date().toISOString()
      });
      setNewCouponCode('');
      setNewCouponOccasion('');
      setNewCouponValue('');
      setNewCouponLimit('');
      if (onShowToast) {
        onShowToast("Coupon Generated", `Discount code "${newCouponCode}" is now live!`);
      } else {
        alert("Coupon Generated!");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCakeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKioskImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewKioskImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewKioskProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKioskName || !newKioskPrice) return;
    if (onAddKioskProduct) {
      onAddKioskProduct({
        id: 'kiosk-prod-' + Date.now(),
        name: newKioskName,
        price: parseFloat(newKioskPrice),
        flavor: newKioskFlavor,
        remainingStock: parseInt(newKioskStock),
        totalStock: parseInt(newKioskStock),
        image: newKioskImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
        campusIds: newKioskCampusIds,
      });
      setNewKioskName('');
      setNewKioskPrice('99');
      setNewKioskFlavor('Chocolate');
      setNewKioskStock('25');
      setNewKioskImage('');
      setNewKioskCampusIds([]);
      if (onShowToast) {
        onShowToast("Now Catalog Updated", `Campus Cakes Now product "${newKioskName}" added successfully!`);
      } else {
        alert('Kiosk product added successfully!');
      }
    }
  };

  const handleEditCakeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingCakeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditKioskImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingKioskImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCakeEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCakeId) return;
    if (onEditCustomCake) {
      onEditCustomCake({
        id: editingCakeId,
        name: editingCakeName,
        description: editingCakeDesc,
        price: parseFloat(editingCakePrice) || 0,
        rating: 4.8,
        category: editingCakeCategory,
        isEggless: true,
        isTrending: true,
        image: editingCakeImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
        deliveryTime: '24 Hours',
        weights: editingCakeWeights.length > 0 ? [...editingCakeWeights].sort() : [0.5, 1.0, 1.5, 2.0],
        weightPrices: editingCakeWeightPrices,
        flavors: ['Vanilla Cream', 'Dark Ganache Swirl'],
        campusIds: editingCakeCampusIds,
        isDineIn: editingCakeIsDineIn,
        isDelivery: editingCakeIsDelivery,
        customQuestions: editingCakeQuestions,
        hideWeightSelection: editingCakeHideWeight,
        hideFlavorSelection: editingCakeHideFlavor,
        hideMessageOnCake: editingCakeHideMessage,
        hideEventAddons: editingCakeHideAddons,
        hideQuantitySelection: editingCakeHideQuantity,
      });
      setEditingCakeId(null);
      setEditingCakeCampusIds([]);
      setEditingCakeQuestions([]);
      setEditingCakeHideWeight(false);
      setEditingCakeHideFlavor(false);
      setEditingCakeHideMessage(false);
      setEditingCakeHideAddons(false);
      setEditingCakeHideQuantity(false);
      if (onShowToast) {
        onShowToast("Product Edited", "Advance cake product details updated successfully!");
      } else {
        alert('Advance product details updated successfully!');
      }
    }
  };

  const handleSaveKioskEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKioskId) return;
    if (onEditKioskProduct) {
      onEditKioskProduct({
        id: editingKioskId,
        name: editingKioskName,
        price: parseFloat(editingKioskPrice) || 0,
        flavor: editingKioskFlavor,
        remainingStock: parseInt(editingKioskStock) || 0,
        totalStock: parseInt(editingKioskStock) || 0,
        image: editingKioskImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
        campusIds: editingKioskCampusIds,
      });
      setEditingKioskId(null);
      setEditingKioskCampusIds([]);
      if (onShowToast) {
        onShowToast("Kiosk Product Edited", "Kiosk product details updated successfully!");
      } else {
        alert('Kiosk product details updated successfully!');
      }
    }
  };

  return (
    <div id="dashboard-section" className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-100 dark:border-[#291316] shadow-xl overflow-hidden mb-14">
      
      {/* Tab bar header */}
      <div className="bg-gray-50 dark:bg-[#1a0d0f]/80/80 px-4 md:px-6 py-4 border-b border-gray-100 dark:border-[#291316] flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#FAF3D9] dark:bg-[#1E1407] rounded-xl text-[#C49A25] dark:text-[#D4AF37] border border-[#D4AF37]/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black font-display text-gray-900 dark:text-white tracking-tight">Hi, {user.name}</h2>
            <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa] font-medium">Logged in as {user.name}</p>
          </div>
        </div>

        <div className="flex gap-1.5 mt-2 sm:mt-0 p-1 bg-gray-200 dark:bg-[#1a0d0f]/50 rounded-2xl text-xs font-bold text-gray-600 dark:text-[#d4d4d8]">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
              activeTab === 'student' ? 'bg-white dark:bg-[#120709] text-[#C49A25] dark:text-[#D4AF37] shadow-sm dark:shadow-none' : 'hover:text-gray-900 hover:dark:text-white'
            }`}
          >
            👤 Student Hub
          </button>
          {isEmployee && (
            <button
              onClick={() => setActiveTab('employee')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                activeTab === 'employee' ? 'bg-white dark:bg-[#120709] text-purple-700 dark:text-purple-450 shadow-sm dark:shadow-none' : 'hover:text-gray-900 hover:dark:text-white'
              }`}
            >
              💼 Employee Desk
            </button>
          )}
          {isVendor && (
            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                activeTab === 'vendor' ? 'bg-white dark:bg-[#120709] text-pink-700 dark:text-pink-450 shadow-sm dark:shadow-none' : 'hover:text-gray-900 hover:dark:text-white'
              }`}
            >
              🏪 Vendor Desk
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                activeTab === 'admin' ? 'bg-white dark:bg-[#120709] text-amber-700 dark:text-amber-400 shadow-sm dark:shadow-none' : 'hover:text-gray-900 hover:dark:text-white'
              }`}
            >
              🛠️ Team Desk
            </button>
          )}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-5 md:p-6">
        <AnimatePresence mode="wait">
          
          {/* 1. STUDENT DASHBOARD */}
          {activeTab === 'student' && (
            <motion.div
              key="student-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Rewards Points & Loyalty Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 1. Metallic Elite Loyalty Member Card (Luxury Theme) */}
                <div className="lg:col-span-6 xl:col-span-5 bg-gradient-to-br from-[#0c0406] via-[#1a0e12] to-[#0c0406] rounded-[32px] p-6 text-[#F9D98A] border border-amber-500/25 shadow-2xl relative overflow-hidden group flex flex-col justify-between h-[210px]">
                  {/* Sheen Overlay Effect */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                  <motion.div 
                    animate={{ x: [-200, 400] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", repeatDelay: 4 }}
                    className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -skew-x-12 pointer-events-none" 
                  />
                  
                  {/* Decorative background logo watermark */}
                  <div className="absolute right-[-20px] bottom-[-20px] w-44 h-44 bg-amber-500/[0.02] rounded-full border border-amber-500/[0.05] pointer-events-none flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-amber-500/[0.03]" />
                  </div>

                  <div className="flex justify-between items-start z-10">
                    <div>
                      <span className="text-[9px] font-black tracking-[0.2em] bg-gradient-to-r from-amber-400 to-[#D4AF37] text-black px-2.5 py-1 rounded-md uppercase font-display select-none">
                        Dorm Elite Platinum
                      </span>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{user.name}</h4>
                    </div>
                    {/* Golden Card Chip Component */}
                    <div className="w-9 h-7 bg-gradient-to-br from-amber-400 via-amber-200 to-[#996515] rounded-md relative shadow-md p-1 flex flex-col justify-between overflow-hidden">
                      <div className="flex justify-between h-[20%]"><div className="w-1.5 h-1 bg-black/20 rounded-sm" /><div className="w-1.5 h-1 bg-black/20 rounded-sm" /></div>
                      <div className="h-[2px] bg-black/15 w-full" />
                      <div className="flex justify-between h-[20%]"><div className="w-1.5 h-1 bg-black/20 rounded-sm" /><div className="w-1.5 h-1 bg-black/20 rounded-sm" /></div>
                    </div>
                  </div>

                  <div className="z-10 mt-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Acquired Loyalty Balance</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3px md:text-3xl font-black font-display tracking-tight text-white bg-gradient-to-r from-amber-200 via-amber-100 to-[#D4AF37] bg-clip-text text-transparent">
                        {user.rewardPoints}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-widest">XP</span>
                    </div>

                    {/* Progress Slider to next reward milestone */}
                    <div className="w-full mt-3">
                      <div className="flex justify-between items-center text-[8px] text-zinc-500 font-extrabold tracking-widest mb-1.5">
                        <span className="uppercase">LEVEL {(Math.floor(user.rewardPoints / 100)) + 1}</span>
                        <span className="text-[#D4AF37] uppercase">{(100 - (user.rewardPoints % 100))} XP TO NEXT CAKE REWARD</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-zinc-800 p-[1px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${user.rewardPoints % 100}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-200 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Dorm GPS Delivery Station address picker layout */}
                <div className="lg:col-span-6 xl:col-span-7 bg-white dark:bg-[#120709] rounded-[32px] p-5 border border-amber-500/10 dark:border-[#291316] shadow-xl flex flex-col justify-between min-h-[210px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/[0.04] to-transparent rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between gap-2.5 mb-2">
                      <span className="text-[9px] font-extrabold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-xl uppercase tracking-widest leading-none">
                        GPS Landing Station
                      </span>
                      <div className="flex gap-1.5">
                        {/* Chrome Native Notification Trigger Button */}
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={async () => {
                            if ('Notification' in window) {
                              try {
                                const permission = await Notification.requestPermission();
                                if (permission === 'granted') {
                                  if (onShowToast) {
                                    onShowToast("🔔 Alerts Enabled", "You'll receive push tracking updates for campus cake arrivals!");
                                  }
                                } else {
                                  if (onShowToast) {
                                    onShowToast("⚠️ Alerts Blocked", "Notification permission was denied. Please reset permissions in your browser settings to allow.");
                                  }
                                }
                              } catch (e: any) {
                                if (onShowToast) {
                                  onShowToast("⚠️ Error", e?.message || "Could not request permission.");
                                }
                              }
                            } else {
                              if (onShowToast) {
                                onShowToast("⚠️ Unsupported", "Notifications are not supported in this browser.");
                              }
                            }
                          }}
                          className="text-[10px] bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 hover:dark:bg-amber-500/20 px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-400 font-black transition-all flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3" /> ENABLE ALERTS
                        </motion.button>

                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => {
                            setIsSavedAddress(!isSavedAddress);
                            if (!isSavedAddress && onShowToast) {
                              onShowToast("Coordinates Synchronized", "Your delivery landing spot has been registered in the startup grid.");
                            }
                          }}
                          className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1d0e11] hover:dark:bg-[#2e1518] px-2.5 py-1 rounded-lg text-[#E23744] font-black transition-all"
                        >
                          {isSavedAddress ? "EDIT SPOT" : "LOCK IN"}
                        </motion.button>
                      </div>
                    </div>

                    <div className="mt-3.5">
                      {isSavedAddress ? (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">CURRENT DESTINATION:</p>
                          <p className="text-xs text-gray-900 dark:text-white font-heavy flex items-start gap-1.5 leading-relaxed">
                            <MapPin className="w-4 h-4 text-[#E23744] flex-shrink-0 mt-0.5" />
                            <span className="font-extrabold">{addressInput}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-gray-400 font-extrabold">OVERWRITE DESTINATION COORDINATES:</p>
                          <input
                            type="text"
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            className="w-full text-xs font-semibold p-2 border border-gray-200 dark:border-[#3c1a1e] rounded-xl outline-none focus:border-[#E23744] bg-gray-50 dark:bg-black/40"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium leading-normal mt-2">
                    Dorm dispatch uses university maps. Every driver is a collegiate helper.
                  </p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="text-xs font-black text-gray-800 dark:text-[#fafafa] uppercase tracking-widest mb-3.5 flex items-center gap-1 font-display">
                  <ShoppingBag className="w-4 h-4 text-[#C49A25] dark:text-[#D4AF37]" /> Recent Campus Orders
                </h3>

                {orders.length === 0 ? (
                  <div className="p-8 bg-gray-50 dark:bg-[#1a0d0f]/80/40 rounded-3xl border border-dashed dark:border-[#3c1a1e] border-gray-200 dark:border-[#3c1a1e]/80 text-center text-gray-500 dark:text-[#a1a1aa]">
                    <p className="text-xs font-bold">No active cake orders yet.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Pre-order something premium or visit Kiosk to start celebrating!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      // Use userStatus managed by admin, fall back to status (mapping 'ready' to 'prepared')
                      const clientStatus = order.userStatus ? (order.userStatus === 'ready' ? 'prepared' : order.userStatus) : (order.status === 'ready' ? 'prepared' : order.status);
                      const currentStatusColor = 
                        clientStatus === 'placed' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 border border-indigo-200/20' :
                        clientStatus === 'preparing' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 border border-amber-200/20' :
                        clientStatus === 'prepared' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 border border-orange-200/20' :
                        clientStatus === 'delivery' ? 'bg-red-50 dark:bg-red-950/45 text-[#E23744] font-bold animate-pulse border border-red-200/35' :
                        'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border border-emerald-200/20';

                      return (
                        <div key={order.id} className="p-4 rounded-3xl border border-gray-150 dark:border-[#291316] hover:border-gray-200 hover:dark:border-[#3c1a1e] bg-white dark:bg-[#120709] shadow-sm dark:shadow-none flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-[#FAF3D9] dark:bg-[#1E1407] rounded-xl text-[#C49A25] dark:text-[#D4AF37] border border-[#D4AF37]/25 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-exrabold text-xs text-gray-800 dark:text-[#fafafa] font-bold">Order #{order.id}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${currentStatusColor}`}>
                                  {clientStatus === 'completed' ? 'delivered' : clientStatus === 'prepared' ? 'ready for pickup' : clientStatus}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">{order.date} @ ABC University</p>
                              
                              <div className="mt-2 space-y-1">
                                {order.items.map((it, idx) => (
                                  <p key={idx} className="text-xs font-semibold text-gray-700 dark:text-[#e4e4e7] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                    {it.name} <span className="text-[10px] text-gray-400">({it.quantity}x)</span>
                                    {it.customization && (
                                      <span className="text-[9px] bg-amber-50 text-amber-600 px-1 py-0.5 rounded border border-amber-100 font-bold">
                                        Custom: "{it.customization.messageOnCake}"
                                      </span>
                                    )}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-[#291316] flex-wrap md:flex-nowrap">
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400">Points Earned</p>
                              <p className="text-xs font-bold text-[#C49A25] dark:text-[#D4AF37]">+{order.pointsEarned} XP</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400">Total Charges</p>
                              <p className="text-sm font-black text-gray-900 dark:text-white">₹{Math.round(order.total)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => downloadReceiptFile(order, user.name)}
                                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1a0e10] hover:dark:bg-[#251214] text-gray-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-[#3c1a1e] rounded-xl font-black text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                title="Download Official Receipt"
                              >
                                <Download className="w-3.5 h-3.5" /> Receipt
                              </button>
                              <button
                                type="button"
                                onClick={() => onRepeatOrder(order.id)}
                                className="px-3 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100/40 dark:hover:bg-red-950/40 rounded-xl text-[#E23744] font-black text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" /> Quick Repeat
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>



            </motion.div>
          )}



          {/* 3. CAMPUS TEAM ADMIN PANEL */}
          {activeTab === 'admin' && isAdmin && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="p-4 bg-purple-50 dark:bg-purple-500/10 text-purple-950 dark:text-pink-300 dark:text-purple-300 border border-purple-100 rounded-3xl flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-700" />
                <div className="text-xs">
                  <p className="font-extrabold uppercase tracking-wide">Campus Owners Administrative Workspace</p>
                  <p className="text-[11px] text-purple-800">
                    Use these control keys to change order stages, update kiosk inventories, and monitor live startup statistics.
                  </p>
                </div>
              </div>

              {/* Admin Sidebar Layout */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 shrink-0 px-2 md:border-r border-gray-100 dark:border-[#291316] flex flex-col gap-1.5 md:pr-4">
                  <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest pl-3 mb-2 pt-2">Admin Panel</h4>
                  
                  <button 
                    onClick={() => setActiveAdminTab('analytics')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'analytics' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Startup Analytics</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveAdminTab('orders')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'orders' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Order Central</span>
                  </button>

                  <button 
                    onClick={() => setActiveAdminTab('prepared')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'prepared' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Prepared Orders</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveAdminTab('kiosk')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'kiosk' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <Package className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Kiosk Inventory</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveAdminTab('catalog')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'catalog' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Catalog Publisher</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveAdminTab('campus')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'campus' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Campus Expansion</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveAdminTab('coupons')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'coupons' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <Tag className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Discount Codes</span>
                  </button>

                  <button 
                    onClick={() => setActiveAdminTab('qrcodes')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'qrcodes' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Table QR Codes</span>
                  </button>

                  <button 
                    onClick={() => setActiveAdminTab('employees')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'employees' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Employees & Roles</span>
                  </button>

                  <button 
                    onClick={() => setActiveAdminTab('vendors')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'vendors' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-[11px] font-bold">Vendor Registration</span>
                  </button>

                  <button 
                    onClick={() => setActiveAdminTab('gifts')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeAdminTab === 'gifts' ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 font-black' : 'text-gray-600 dark:text-[#d4d4d8] hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80'}`}
                  >
                    <Gift className="w-4 h-4 text-pink-500" />
                    <span className="text-[11px] font-bold">Gifts Manager</span>
                  </button>
                </div>

                {/* Main Admin Content */}
                <div className="flex-1 min-w-0 space-y-6">

              {/* Startup Analytics Section */}
              {activeAdminTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Administrative Database Clean-slate action panel */}
                  {onPurgeAndResetDatabase && (
                    <div className="p-4 bg-red-50/50 dark:bg-rose-500/5 border border-red-200/60 dark:border-red-950/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-xs font-black text-red-900 dark:text-red-400 uppercase tracking-wide">Production Launch Deployment Guard</h4>
                        <p className="text-[10.5px] text-red-700/90 dark:text-gray-400 mt-0.5">Prepare the platform for production by purging development-era test orders and resetting all user XP metrics to zero.</p>
                      </div>
                      <button
                        onClick={onPurgeAndResetDatabase}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200/95 dark:bg-rose-950/40 hover:dark:bg-rose-900/40 text-red-700 dark:text-red-400 border border-red-250 dark:border-[#3c1a1e] rounded-xl font-bold text-[11px] uppercase tracking-wide transition-colors active:scale-95 cursor-pointer shadow-sm"
                      >
                        Wipe Database & Reset XP
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#120709] p-4 rounded-2xl border border-gray-150 dark:border-[#291316]">
                      <div className="flex justify-between items-center text-gray-400">
                        <span className="text-[10px] font-bold uppercase">Today Revenue</span>
                        <IndianRupee className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xl font-black text-gray-800 dark:text-[#fafafa] mt-1.5">₹{todayRevenue.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] mt-0.5 flex items-center gap-1">
                        {revenueTrendPercent !== null ? (
                          <>
                            <TrendingUp className={`w-3 h-3 ${Number(revenueTrendPercent) >= 0 ? "text-green-600" : "text-red-500"}`} />
                            <span className={Number(revenueTrendPercent) >= 0 ? "text-green-600 text-xs" : "text-red-500 text-xs"}>
                              {Number(revenueTrendPercent) >= 0 ? `+${revenueTrendPercent}%` : `${revenueTrendPercent}%`} from yesterday
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500 dark:text-[#a1a1aa]">First sales day of this week</span>
                        )}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#120709] p-4 rounded-2xl border border-gray-150 dark:border-[#291316]">
                      <div className="flex justify-between items-center text-gray-400">
                        <span className="text-[10px] font-bold uppercase">Total Orders</span>
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xl font-black text-gray-800 dark:text-[#fafafa] mt-1.5">{totalOrdersCount} Total</p>
                      <p className="text-[9px] text-purple-500 mt-0.5">
                        {instantPickupCount} instant / {preOrdersCount} pre-ordered
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#120709] p-4 rounded-2xl border border-gray-150 dark:border-[#291316]">
                      <div className="flex justify-between items-center text-gray-400">
                        <span className="text-[10px] font-bold uppercase">Returning Rate</span>
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xl font-black text-gray-800 dark:text-[#fafafa] mt-1.5">{returningRate}%</p>
                      <p className="text-[9px] text-gray-500 dark:text-[#a1a1aa] mt-0.5">
                        {uniqueCustomers > 0 ? `${repeatCustomers} repeat of ${uniqueCustomers} unique buyers` : 'Waiting for real buyers'}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#120709] p-4 rounded-xl border border-gray-150 dark:border-[#291316]">
                      <div className="flex justify-between items-center text-gray-400 font-bold">
                        <span className="text-[10px] uppercase">Popular Flavor</span>
                        <Clock className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      <p className="text-sm font-black text-gray-800 dark:text-[#fafafa] mt-1.5 truncate" title={popularFlavor}>{popularFlavor}</p>
                      <p className="text-[9px] text-[#C49A25] dark:text-[#D4AF37] font-bold mt-0.5">Based on ordered quantity</p>
                    </div>
                  </div>

                  {/* Graphical Custom charts simulating metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Simulated Peak Hours bar chart */}
                    <div className="p-4 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-gray-200 dark:border-[#3c1a1e]">
                      <h5 className="text-[11px] font-black text-gray-700 dark:text-[#e4e4e7] uppercase tracking-widest mb-3 flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Hourly Peak Orders Indicator
                      </h5>
                      <div className="h-28 flex items-end justify-between p-2 pt-4 bg-white dark:bg-[#120709] rounded-xl border border-gray-100 dark:border-[#291316]">
                        {Object.entries(hourlyDistribution).map(([h, count], id) => {
                          const percentHeight = maxHourValue > 0 ? (count / maxHourValue) * 100 : 0;
                          return (
                            <div key={id} className="flex-1 flex flex-col items-center">
                              <div className="w-5 bg-gradient-to-t from-[#B38F1D] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#FFF3CD] transition-colors rounded-t-xs relative group" style={{ height: `${Math.max(4, percentHeight * 0.6)}px` }}>
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-bold p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {count} order{count !== 1 ? 's' : ''} ({Math.round(percentHeight)}%)
                                </span>
                              </div>
                              <span className="text-[8px] text-gray-405 font-black mt-1">{h}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Simulated Revenue Sources Pie Chart Representation */}
                    <div className="p-4 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-gray-200 dark:border-[#3c1a1e] text-xs">
                      <h5 className="text-[11px] font-black text-gray-700 dark:text-[#e4e4e7] uppercase tracking-widest mb-3 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-600" /> Order Segment Yields
                      </h5>
                      <div className="flex items-center justify-around bg-white dark:bg-[#120709] p-3 rounded-xl border border-gray-100 dark:border-[#291316] h-28">
                        {/* Interactive horizontal custom percent graph */}
                        <div className="space-y-2.5 w-full">
                          <div>
                            <div className="flex justify-between items-center text-[10px] mb-1 text-gray-600 dark:text-[#d4d4d8]">
                              <span className="font-bold text-indigo-700">🎂 Custom celebration designs</span>
                              <span className="font-extrabold text-gray-900 dark:text-white">{customPct}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 dark:bg-[#1a0d0f] rounded-full">
                              <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${customPct}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[10px] mb-1 text-gray-600 dark:text-[#d4d4d8]">
                              <span className="font-bold text-amber-700">⚡ Emergency Kiosk slice orders</span>
                              <span className="font-extrabold text-gray-900 dark:text-white">{kioskPct}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 dark:bg-[#1a0d0f] rounded-full">
                              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${kioskPct}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[10px] mb-1 text-gray-600 dark:text-[#d4d4d8]">
                              <span className="font-bold text-[#E23744]">🎉 Standard Dorm pre-orders</span>
                              <span className="font-extrabold text-gray-900 dark:text-white">{preOrderPct}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 dark:bg-[#1a0d0f] rounded-full">
                              <div className="h-full bg-[#E23744] rounded-full transition-all duration-500" style={{ width: `${preOrderPct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Tracking Controller */}
              {activeAdminTab === 'orders' && (() => {
                const countAll = orders.length;
                const countPending = orders.filter(o => o.status === 'placed').length;
                const countPacked = orders.filter(o => o.status === 'preparing').length;
                const countPrepared = orders.filter(o => o.status === 'prepared').length;
                const countDelivery = orders.filter(o => o.status === 'delivery').length;
                const countDelivered = orders.filter(o => o.status === 'ready' || o.status === 'completed').length;

                const filteredOrdersByFilter = orders.filter(o => {
                  // 1. Status Filter
                  let matchesStatus = true;
                  if (adminOrderFilter !== 'all') {
                    if (adminOrderFilter === 'ready') {
                      matchesStatus = o.status === 'ready' || o.status === 'completed';
                    } else {
                      matchesStatus = o.status === adminOrderFilter;
                    }
                  }

                  // 2. Service Mode Filter
                  let matchesServiceMode = true;
                  if (adminServiceModeFilter !== 'all') {
                    if (adminServiceModeFilter === 'delivery') {
                      matchesServiceMode = !o.serviceMode || o.serviceMode === 'delivery';
                    } else if (adminServiceModeFilter === 'dinein') {
                      matchesServiceMode = o.serviceMode === 'dinein';
                    }
                  }

                  return matchesStatus && matchesServiceMode;
                });

                return (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Header Controls */}
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 bg-white dark:bg-[#120709] p-5 rounded-3xl border border-gray-150 dark:border-[#291316] shadow-sm dark:shadow-none">
                      <div>
                        <h4 className="font-black text-sm text-[#C49A25] dark:text-[#D4AF37] uppercase tracking-wider font-display">📦 Start-up Order Central</h4>
                        <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mt-0.5">
                          Manage real-time order states and dispatched hostel runner directions.
                        </p>
                      </div>

                      {/* Filter Badges / Tabs Stack */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Row 1: Workflow States */}
                        <div className="flex flex-wrap gap-1 p-1 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-gray-100 dark:border-[#291316] h-fit">
                          <button
                            onClick={() => setAdminOrderFilter('all')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              adminOrderFilter === 'all'
                                ? 'bg-[#1a080a] border border-[#D4AF37]/35 text-amber-200 shadow-sm dark:shadow-none'
                                : 'text-gray-500 dark:text-[#a1a1aa] hover:text-gray-900 hover:dark:text-white hover:bg-gray-100 hover:dark:bg-slate-800/50'
                            }`}
                          >
                            All ({countAll})
                          </button>
                          <button
                            onClick={() => setAdminOrderFilter('placed')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                              adminOrderFilter === 'placed'
                                ? 'bg-amber-500 text-white shadow-sm dark:shadow-none'
                                : 'text-amber-600 hover:text-amber-900 hover:bg-amber-50/50'
                            }`}
                          >
                            <span className="w-1 h-1 rounded-full bg-current animate-ping" />
                            Pending ({countPending})
                          </button>
                           <button
                            onClick={() => setAdminOrderFilter('preparing')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              adminOrderFilter === 'preparing'
                                ? 'bg-blue-600 text-white shadow-sm dark:shadow-none'
                                : 'text-blue-600 hover:text-blue-950 hover:bg-blue-50 hover:dark:bg-blue-500/10/50'
                            }`}
                          >
                            Packed ({countPacked})
                          </button>
                          <button
                            onClick={() => setAdminOrderFilter('prepared')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              adminOrderFilter === 'prepared'
                                ? 'bg-indigo-600 text-white shadow-sm dark:shadow-none'
                                : 'text-indigo-600 hover:text-indigo-950 hover:bg-indigo-50 hover:dark:bg-indigo-500/10/50'
                            }`}
                          >
                            Prepared ({countPrepared})
                          </button>
                          <button
                            onClick={() => setAdminOrderFilter('delivery')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              adminOrderFilter === 'delivery'
                                ? 'bg-[#E23744] text-white shadow-sm dark:shadow-none'
                                : 'text-[#E23744] hover:text-red-950 hover:bg-red-50 hover:dark:bg-[#1a0d0f]'
                            }`}
                          >
                            Runner Out ({countDelivery})
                          </button>
                          <button
                            onClick={() => setAdminOrderFilter('ready')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              adminOrderFilter === 'ready'
                                ? 'bg-emerald-600 text-white shadow-sm dark:shadow-none'
                                : 'text-emerald-600 hover:text-emerald-950 hover:bg-emerald-50 hover:dark:bg-emerald-500/10/50'
                            }`}
                          >
                            Delivered ({countDelivered})
                          </button>
                        </div>

                        {/* Row 2: Service Modes */}
                        <div className="flex flex-wrap gap-1 p-1 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-gray-100 dark:border-[#291316] h-fit">
                          <button
                            onClick={() => setAdminServiceModeFilter('all')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              adminServiceModeFilter === 'all'
                                ? 'bg-purple-700 text-white shadow-sm'
                                : 'text-gray-500 dark:text-[#a1a1aa] hover:text-purple-700 hover:bg-purple-50 hover:dark:bg-purple-500/10'
                            }`}
                          >
                            All Modes ({orders.length})
                          </button>
                          <button
                            onClick={() => setAdminServiceModeFilter('delivery')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                              adminServiceModeFilter === 'delivery'
                                ? 'bg-[#E23744] text-white shadow-sm'
                                : 'text-[#E23744] hover:bg-red-50 hover:dark:bg-red-950/20'
                            }`}
                          >
                            🚚 Deliv ({orders.filter(o => !o.serviceMode || o.serviceMode === 'delivery').length})
                          </button>
                          <button
                            onClick={() => setAdminServiceModeFilter('dinein')}
                            className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                              adminServiceModeFilter === 'dinein'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-emerald-600 hover:bg-emerald-50 hover:dark:bg-emerald-950/20'
                            }`}
                          >
                            🍽️ Dine ({orders.filter(o => o.serviceMode === 'dinein').length})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Orders Render Block */}
                    {filteredOrdersByFilter.length === 0 ? (
                      <div className="p-12 text-center bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-3xl border border-dashed dark:border-[#3c1a1e] border-gray-200 dark:border-[#3c1a1e]">
                        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h4 className="font-extrabold text-xs text-gray-500 dark:text-[#a1a1aa] uppercase tracking-widest">No matching orders found</h4>
                        <p className="text-[10px] text-gray-400 mt-1">There are currently no orders under this workflow status tab.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredOrdersByFilter.map(or => {
                          // Determine style variables based on current status
                          let badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                          let leftBorder = "border-l-4 border-l-amber-500";
                          let statusLabel = "Pending Arrival";
                          if (or.status === 'preparing') {
                            badgeBg = "bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200";
                            leftBorder = "border-l-4 border-l-blue-500";
                            statusLabel = "Packed & Ready";
                          } else if (or.status === 'prepared') {
                            badgeBg = "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border-indigo-200";
                            leftBorder = "border-l-4 border-l-indigo-500";
                            statusLabel = "Prepared by Vendor";
                          } else if (or.status === 'delivery') {
                            badgeBg = "bg-pink-50 dark:bg-pink-500/10 text-pink-700 border-pink-200";
                            leftBorder = "border-l-4 border-l-pink-500";
                            statusLabel = "Out with Runner";
                          } else if (or.status === 'ready' || or.status === 'completed') {
                            badgeBg = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200";
                            leftBorder = "border-l-4 border-l-emerald-500";
                            statusLabel = "Delivered";
                          }

                          return (
                            <motion.div
                              key={or.id}
                              layoutId={`admin-order-${or.id}`}
                              className={`bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm dark:shadow-none transition-all hover:shadow-md dark:shadow-none ${leftBorder} flex flex-col gap-5`}
                            >
                              {/* Card Header row */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-[#291316] pb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-sm text-purple-950 dark:text-pink-300 dark:text-purple-300">Order #{or.id}</span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                                      {statusLabel}
                                    </span>
                                    <span className="text-[9px] font-bold bg-gray-100 dark:bg-[#1a0d0f] text-gray-600 dark:text-[#d4d4d8] px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#3c1a1e] capitalize">
                                      {or.orderType === 'instant-pickup' ? '⚡ Campus Cakes Now' : '📅 Pre-Order'}
                                    </span>
                                    {or.serviceMode === 'dinein' ? (
                                      <span className="text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-250 dark:border-emerald-800/40 flex items-center gap-1">
                                        🍽️ Dine-In
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-extrabold bg-[#E23744]/5 dark:bg-[#E23744]/10 text-[#E23744] dark:text-[#f472b6] px-2 py-0.5 rounded-full border border-[#E23744]/20 flex items-center gap-1">
                                        🚚 Room Delivery
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-gray-400" /> Received: {or.timestamp ? new Date(or.timestamp).toLocaleString() : or.date}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  {/* Operational State */}
                                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a0d0f]/80 p-1.5 rounded-2xl border border-gray-100 dark:border-[#291316]">
                                    <span className="text-[10px] font-black text-gray-500 dark:text-[#a1a1aa] uppercase tracking-widest pl-1.5 mr-1">Operational State</span>
                                    <select
                                      value={or.status}
                                      onChange={(e) => onUpdateOrderStatus(or.id, e.target.value as any, false, false)}
                                      className="bg-white dark:bg-[#120709] border text-[11px] font-black py-1 px-2.5 rounded-xl border-purple-200 text-purple-800 focus:outline-none cursor-pointer"
                                    >
                                      <option value="placed">Pending (Placed)</option>
                                      <option value="preparing">Packed (Preparing)</option>
                                      <option value="prepared">Prepared by Vendor</option>
                                      <option value="delivery">Out for Delivery</option>
                                      <option value="ready">Delivered (Completed)</option>
                                    </select>
                                  </div>

                                  {/* User-Facing Status */}
                                  <div className="flex items-center gap-2 bg-amber-50/60 dark:bg-amber-950/20 p-1.5 rounded-2xl border border-amber-200/50">
                                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest pl-1.5 mr-1">User-Facing Status</span>
                                    <select
                                      value={or.userStatus || 'placed'}
                                      onChange={(e) => onUpdateOrderStatus(or.id, e.target.value as any, false, true)}
                                      className="bg-white dark:bg-[#120709] border text-[11px] font-black py-1 px-2.5 rounded-xl border-amber-200 text-amber-800 focus:outline-none cursor-pointer"
                                    >
                                      <option value="placed">Pending (Placed)</option>
                                      <option value="preparing">Preparing at Bakery</option>
                                      <option value="prepared">Ready for Pickup</option>
                                      <option value="delivery">Out for Delivery</option>
                                      <option value="completed">Delivered & Completed</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Vendor-prepared status alert and employee dispatch */}
                              {or.status === 'prepared' && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 rounded-2xl flex flex-col gap-4">
                                  <div className="flex items-start gap-2.5">
                                    <span className="text-xl">👩‍🍳</span>
                                    <div>
                                      <h5 className="font-extrabold text-xs text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                                        Prepared by Vendor (Ready for Dispatch Assignments)
                                      </h5>
                                      <p className="text-[10.5px] text-indigo-700/90 dark:text-gray-400 mt-0.5">
                                        Select a Campus Manager to pick up the cake from the vendor's bakery, and a Delivery Executive to handle delivery from the campus stall/HQ to the student's hostel.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {/* Campus Manager Pickup Selection */}
                                    <div className="flex flex-col gap-1 bg-white dark:bg-black/30 p-2.5 rounded-xl border border-indigo-200">
                                      <span className="text-[9px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                                        1. Campus Manager (Bakery Pickup):
                                      </span>
                                      {(or.assignedManagerId || or.assignedEmployeeId) ? (
                                        <div className="flex items-center justify-between bg-indigo-50/55 px-2.5 py-1.5 rounded-lg text-indigo-900 dark:text-indigo-300 text-[10px] font-bold">
                                          <span className="flex items-center gap-1">🏃 {or.assignedManagerName || or.assignedEmployeeName}</span>
                                          <button 
                                            onClick={() => {
                                              if (onUpdateOrder) {
                                                const updated = { ...or };
                                                delete updated.assignedManagerId;
                                                delete updated.assignedManagerName;
                                                delete updated.assignedEmployeeId;
                                                delete updated.assignedEmployeeName;
                                                onUpdateOrder(updated);
                                              }
                                            }}
                                            className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                                            type="button"
                                          >
                                            ✕ Unassign
                                          </button>
                                        </div>
                                      ) : (
                                        <select
                                          onChange={(e) => {
                                            const empId = e.target.value;
                                            if (!empId) return;
                                            const emp = employees.find(emp => emp.id === empId);
                                            if (emp && onUpdateOrder) {
                                              onUpdateOrder({
                                                ...or,
                                                assignedManagerId: emp.id,
                                                assignedManagerName: emp.name,
                                                assignedEmployeeId: emp.id,
                                                assignedEmployeeName: emp.name
                                              });
                                            }
                                          }}
                                          className="bg-transparent text-[10px] font-bold text-indigo-800 dark:text-indigo-300 focus:outline-none cursor-pointer py-1"
                                          defaultValue=""
                                        >
                                          <option value="" disabled>Select campus manager...</option>
                                          {employees.filter(emp => emp.post === 'Campus Manager').map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                          ))}
                                          {employees.filter(emp => emp.post === 'Campus Manager').length === 0 && (
                                            <option disabled>No Campus Managers registered</option>
                                          )}
                                        </select>
                                      )}
                                    </div>

                                    {/* Delivery Executive Hostel Delivery Selection */}
                                    <div className="flex flex-col gap-1 bg-white dark:bg-black/30 p-2.5 rounded-xl border border-indigo-200">
                                      <span className="text-[9px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                                        2. Delivery Executive (Hostel Delivery):
                                      </span>
                                      {or.assignedDeliveryId ? (
                                        <div className="flex items-center justify-between bg-indigo-50/55 px-2.5 py-1.5 rounded-lg text-indigo-900 dark:text-indigo-300 text-[10px] font-bold">
                                          <span className="flex items-center gap-1">🚴 {or.assignedDeliveryName}</span>
                                          <button 
                                            onClick={() => {
                                              if (onUpdateOrder) {
                                                const updated = { ...or };
                                                delete updated.assignedDeliveryId;
                                                delete updated.assignedDeliveryName;
                                                onUpdateOrder(updated);
                                              }
                                            }}
                                            className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                                            type="button"
                                          >
                                            ✕ Unassign
                                          </button>
                                        </div>
                                      ) : (
                                        <select
                                          onChange={(e) => {
                                            const empId = e.target.value;
                                            if (!empId) return;
                                            const emp = employees.find(emp => emp.id === empId);
                                            if (emp && onUpdateOrder) {
                                              onUpdateOrder({
                                                ...or,
                                                assignedDeliveryId: emp.id,
                                                assignedDeliveryName: emp.name
                                              });
                                            }
                                          }}
                                          className="bg-transparent text-[10px] font-bold text-indigo-800 dark:text-indigo-300 focus:outline-none cursor-pointer py-1"
                                          defaultValue=""
                                        >
                                          <option value="" disabled>Select delivery executive...</option>
                                          {employees.filter(emp => emp.post.startsWith('Delivery Executive')).map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.post.replace('Delivery Executive ', '')})</option>
                                          ))}
                                          {employees.filter(emp => emp.post.startsWith('Delivery Executive')).length === 0 && (
                                            <option disabled>No Delivery Executives registered</option>
                                          )}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Card Body Grid (Recipient on Left, Cake info on Right) */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                                
                                {/* CUSTOMER & DELIVERY DIRECTION DETAILS */}
                                <div className="space-y-3.5 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100 max-h-72 overflow-y-auto">
                                  <h5 className="font-black text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-200 dark:border-[#3c1a1e]/50 pb-1.5">
                                    <User className="w-3.5 h-3.5 text-purple-600" /> Courier & Recipient Details
                                  </h5>

                                  <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#120709] flex items-center justify-center border text-gray-400">
                                        <User className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Student Name</p>
                                        <p className="font-extrabold text-gray-800 dark:text-[#fafafa] leading-tight">{or.customerName || 'Campus Student'}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#120709] flex items-center justify-center border text-gray-400">
                                        <Mail className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Email Address</p>
                                        <p className="font-bold text-gray-700 dark:text-[#e4e4e7] leading-tight select-all">{or.userEmail || 'No Email Provided'}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#120709] flex items-center justify-center border text-gray-400">
                                        <Phone className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Contact Number</p>
                                        <p className="font-bold text-gray-700 dark:text-[#e4e4e7] leading-tight select-all">{or.customerPhone || 'Not specified'}</p>
                                      </div>
                                    </div>

                                    {/* HIGHLIGHTED DELIVERY LOCATION BLOCK */}
                                    <div className="p-3 bg-red-50 dark:bg-red-500/10/50 rounded-xl border border-red-100 flex gap-2.5 mt-2">
                                      <div className="w-8 h-8 shrink-0 rounded-lg bg-white dark:bg-[#120709] flex items-center justify-center border border-red-200 text-[#E23744]">
                                        <MapPin className="w-4 h-4 animate-pulse" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-[9px] text-[#E23744] font-black uppercase tracking-widest">Hostel Delivery Address</p>
                                        <p className="font-extrabold text-neutral-800 dark:text-[#fafafa] leading-normal mt-0.5">
                                          {or.deliveryAddress || 'Campus Ground Delivery (No delivery address provided)'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* INDIVIDUAL CAKE SPECS & IMAGES */}
                                <div className="space-y-3.5">
                                  <h5 className="font-black text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 dark:border-[#291316] pb-1.5">
                                    <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> Ordered Items List ({or.items.length})
                                  </h5>

                                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                                    {or.items.map((item, idx) => (
                                      <div key={idx} className="flex gap-3 bg-gray-50 dark:bg-[#1a0d0f]/80 p-2.5 rounded-2xl border border-gray-100 dark:border-[#291316]/50 hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80 transition-colors">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-14 h-14 object-cover rounded-xl border border-gray-250 dark:border-[#3c1a1e] shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="flex-1">
                                          <div className="flex justify-between">
                                            <h6 className="font-extrabold text-gray-900 dark:text-white leading-snug">{item.name}</h6>
                                            <span className="font-mono text-purple-950 dark:text-pink-300 dark:text-purple-300 font-bold shrink-0 ml-2">₹{item.price} × {item.quantity}</span>
                                          </div>
                                          
                                          {item.customization && (
                                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 bg-white dark:bg-[#120709] p-2 rounded-xl text-[10px] text-gray-600 dark:text-[#d4d4d8] border border-gray-100 dark:border-[#291316]">
                                              {item.customization.flavor && (
                                                <p>✨ <strong>Flavor:</strong> {item.customization.flavor}</p>
                                              )}
                                              {item.customization.weight && (
                                                <p>⚖️ <strong>Weight:</strong> {item.customization.weight} kg</p>
                                              )}
                                              {item.customization.messageOnCake && (
                                                <p className="sm:col-span-2 text-pink-600 dark:text-pink-400 font-bold bg-pink-50 dark:bg-pink-500/10/30 px-1.5 py-0.5 rounded border border-pink-100/35">
                                                  🎂 <strong>Message:</strong> "{item.customization.messageOnCake}"
                                                </p>
                                              )}
                                              {item.customization.addCandles && <p>🕯️ <strong>Candles:</strong> Included</p>}
                                              {item.customization.addKnife && <p>🪓 <strong>Knife:</strong> Included</p>}
                                              {item.customization.pickupTime && (
                                                <p className="sm:col-span-2 text-purple-700 font-semibold bg-purple-50 dark:bg-purple-500/10/30 px-1.5 py-0.5 rounded border border-purple-100/35 mt-0.5">
                                                  ⏰ <strong>Scheduled:</strong> {item.customization.pickupTime}
                                                </p>
                                              )}
                                              {item.customization.customAnswers && Object.entries(item.customization.customAnswers).map(([qId, answer]) => {
                                                  const c = allCakes.find(x => x.id === item.cakeId);
                                                  const qText = c?.customQuestions?.find(q => q.id === qId)?.question || 'Custom Question';
                                                  return (
                                                    <p key={qId} className="sm:col-span-2 text-indigo-700 font-semibold bg-indigo-50 dark:bg-indigo-500/10/30 px-1.5 py-0.5 rounded border border-indigo-100/35 mt-0.5">
                                                      💬 <strong>{qText}:</strong> {typeof answer === 'boolean' ? (answer ? 'Yes' : 'No') : answer}
                                                    </p>
                                                  );
                                              })}
                                              
                                              {/* Custom Reference Image Uploaded preview */}
                                              {item.customization.photoUrl && (
                                                <div className="sm:col-span-2 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-[#291316]">
                                                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Uploaded Custom Reference Photo</p>
                                                  <a
                                                    href={item.customization.photoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 dark:text-purple-300 font-bold hover:underline bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-lg"
                                                  >
                                                    <Eye className="w-3 h-3" /> View Photo Design File
                                                  </a>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer: Summary of Fees + Single click transition button */}
                              <div className="border-t border-gray-100 dark:border-[#291316] pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
                                <div className="text-[10px] text-gray-500 dark:text-[#a1a1aa] font-semibold">
                                  <span className="mr-3 text-neutral-800 dark:text-[#fafafa]">Payment: <strong>{or.paymentMethod || 'UPI/Card'}</strong></span>
                                  <span>Subtotal: ₹{or.subtotal}</span> | <span>Delivery: ₹{or.deliveryFee}</span> | <span>Taxes: ₹{or.tax}</span>
                                  <div className="mt-1 text-xs text-gray-900 dark:text-white">
                                    Total Paid Amount: <strong className="font-mono text-pink-600 dark:text-pink-400 text-sm">₹{or.total}</strong>
                                  </div>
                                </div>

                                {/* Step Promotion Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadReceiptFile(or, or.customerName)}
                                    className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1a0e10] hover:dark:bg-[#251214] border border-neutral-200/80 dark:border-[#3c1a1e] text-gray-800 dark:text-neutral-200 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 h-fit shrink-0 self-center"
                                    title="Download Invoice Ticket"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Ticket
                                  </button>

                                  {or.status === 'placed' && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateOrderStatus(or.id, 'preparing', true)}
                                      className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md dark:shadow-none shadow-blue-500/10 cursor-pointer text-center select-none"
                                    >
                                      👨‍🍳 Mark Ready & Packed
                                    </button>
                                  )}
                                  
                                  {or.status === 'preparing' && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateOrderStatus(or.id, 'delivery', true)}
                                      className="py-2 px-3.5 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md dark:shadow-none shadow-pink-500/10 cursor-pointer text-center select-none"
                                    >
                                      🚴 Out for Delivery
                                    </button>
                                  )}

                                  {or.status === 'delivery' && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateOrderStatus(or.id, 'ready', true)}
                                      className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md dark:shadow-none shadow-emerald-500/10 cursor-pointer text-center select-none"
                                    >
                                      ✅ Complete & Delivered
                                    </button>
                                  )}

                                  {(or.status === 'ready' || or.status === 'completed') && (
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-200">
                                      <CheckCircle className="w-3.5 h-3.5" /> Order Completed
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Prepared Orders Tab */}
              {activeAdminTab === 'prepared' && (() => {
                const preparedOrdersList = orders.filter(o => o.status === 'prepared');
                
                const filteredPrepared = preparedOrdersList.filter(o => 
                  preparedCampusFilter === 'all' || o.campusId === preparedCampusFilter
                );

                return (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-[#291316] pb-4 mb-4">
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                            <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Prepared Orders Central
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                            Orders marked as prepared by vendors that are waiting for pickup, runner dispatch, and delivery.
                          </p>
                        </div>
                        
                        {/* Campus Filter */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-[#291316]">
                          <span className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">Campus Hub:</span>
                          <select
                            value={preparedCampusFilter}
                            onChange={(e) => setPreparedCampusFilter(e.target.value)}
                            className="bg-transparent text-[10.5px] font-extrabold text-gray-800 dark:text-[#fafafa] focus:outline-none cursor-pointer"
                          >
                            <option value="all">All Campuses</option>
                            {campuses.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {filteredPrepared.length === 0 ? (
                        <div className="p-16 text-center">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center mx-auto mb-3 border border-indigo-100/50">
                            <ClipboardCheck className="w-6 h-6 text-indigo-500" />
                          </div>
                          <h5 className="text-xs font-black text-gray-700 dark:text-zinc-300 uppercase tracking-wider">No Prepared Orders</h5>
                          <p className="text-[10px] text-gray-400 mt-1 max-w-md mx-auto font-medium">
                            No orders are currently waiting in the prepared status for the selected campus.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6">
                          {filteredPrepared.map(or => {
                            const orderCampusName = campuses.find(c => c.id === or.campusId)?.name || 'Specified Campus';
                            
                            return (
                              <div key={or.id} className="p-5 bg-indigo-50/10 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-100/40 pb-3 pl-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-xs text-[#C49A25]">#{or.id}</span>
                                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                                        {or.serviceMode === 'delivery' ? 'Delivery' : 'Dine In / Pickup'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Campus: {orderCampusName} | Prepared: {or.date}</p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 px-2.5 py-1 rounded-lg">
                                      👩‍🍳 Prepared by Vendor
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
                                  {/* Items list */}
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Items Ordered:</span>
                                    <div className="space-y-2">
                                      {or.items.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5 p-2 bg-white dark:bg-black/20 rounded-xl border border-gray-100 dark:border-[#291316]">
                                          <span className="text-pink-600 dark:text-pink-400 font-extrabold text-sm">•</span>
                                          <div className="text-xs text-gray-800 dark:text-zinc-200 font-bold">
                                            <span>{item.quantity || 1}x {item.name}</span>
                                            {item.customization?.weight && <span className="text-[10px] text-gray-400 font-medium ml-1.5">({item.customization.weight} kg)</span>}
                                            {item.customization?.flavor && <span className="text-[10px] text-gray-400 font-medium ml-1.5">[{item.customization.flavor}]</span>}
                                            {item.customization?.messageOnCake && <p className="text-[10px] text-[#C49A25] font-black italic mt-0.5">"Message: {item.customization.messageOnCake}"</p>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Customer details */}
                                  <div className="space-y-3">
                                    <div className="space-y-1.5 text-xs text-gray-650 dark:text-zinc-400 font-semibold">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Customer Details:</span>
                                      <p><span className="text-gray-400 font-medium">Name:</span> {or.customerName || 'N/A'}</p>
                                      <p><span className="text-gray-400 font-medium">Phone:</span> {or.customerPhone || 'N/A'}</p>
                                      <p><span className="text-gray-400 font-medium">Location:</span> {or.deliveryAddress || 'N/A'}</p>
                                      <p><span className="text-gray-400 font-medium">Total Price:</span> <span className="font-extrabold text-gray-900 dark:text-white">₹{or.total}</span></p>
                                    </div>

                                    {/* Campus Manager Assignment */}
                                    <div className="p-3 bg-white dark:bg-black/30 border border-indigo-100 dark:border-[#291316] rounded-xl space-y-2">
                                      <span className="text-[9.5px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                                        Campus Manager (Bakery Pickup):
                                      </span>
                                      {(or.assignedManagerId || or.assignedEmployeeId) ? (
                                        <div className="flex items-center justify-between bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                                          <div className="text-[10.5px] font-bold text-indigo-900 dark:text-indigo-300">
                                            🏃 {or.assignedManagerName || or.assignedEmployeeName}
                                          </div>
                                          <button 
                                            onClick={() => {
                                              if (onUpdateOrder) {
                                                const updated = { ...or };
                                                delete updated.assignedManagerId;
                                                delete updated.assignedManagerName;
                                                delete updated.assignedEmployeeId;
                                                delete updated.assignedEmployeeName;
                                                onUpdateOrder(updated);
                                              }
                                            }}
                                            className="text-red-500 hover:text-red-700 text-[10px] font-extrabold cursor-pointer"
                                          >
                                            Unassign
                                          </button>
                                        </div>
                                      ) : (
                                        <select
                                          onChange={(e) => {
                                            const empId = e.target.value;
                                            if (!empId) return;
                                            const emp = employees.find(emp => emp.id === empId);
                                            if (emp && onUpdateOrder) {
                                              onUpdateOrder({
                                                ...or,
                                                assignedManagerId: emp.id,
                                                assignedManagerName: emp.name,
                                                assignedEmployeeId: emp.id,
                                                assignedEmployeeName: emp.name
                                              });
                                            }
                                          }}
                                          className="w-full bg-transparent text-[11px] font-bold text-gray-800 dark:text-zinc-300 focus:outline-none border border-gray-200 dark:border-[#291316] p-1.5 rounded-lg cursor-pointer bg-white dark:bg-[#120709]"
                                          defaultValue=""
                                        >
                                          <option value="" disabled>Select campus manager...</option>
                                          {employees.filter(emp => emp.post === 'Campus Manager').map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                          ))}
                                          {employees.filter(emp => emp.post === 'Campus Manager').length === 0 && (
                                            <option disabled>No Campus Managers registered</option>
                                          )}
                                        </select>
                                      )}
                                    </div>

                                    {/* Delivery Executive Assignment */}
                                    <div className="p-3 bg-white dark:bg-black/30 border border-indigo-100 dark:border-[#291316] rounded-xl space-y-2">
                                      <span className="text-[9.5px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                                        Delivery Executive (Hostel Delivery):
                                      </span>
                                      {or.assignedDeliveryId ? (
                                        <div className="flex items-center justify-between bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                                          <div className="text-[10.5px] font-bold text-indigo-900 dark:text-indigo-300">
                                            🚴 {or.assignedDeliveryName}
                                          </div>
                                          <button 
                                            onClick={() => {
                                              if (onUpdateOrder) {
                                                const updated = { ...or };
                                                delete updated.assignedDeliveryId;
                                                delete updated.assignedDeliveryName;
                                                onUpdateOrder(updated);
                                              }
                                            }}
                                            className="text-red-500 hover:text-red-700 text-[10px] font-extrabold cursor-pointer"
                                          >
                                            Unassign
                                          </button>
                                        </div>
                                      ) : (
                                        <select
                                          onChange={(e) => {
                                            const empId = e.target.value;
                                            if (!empId) return;
                                            const emp = employees.find(emp => emp.id === empId);
                                            if (emp && onUpdateOrder) {
                                              onUpdateOrder({
                                                ...or,
                                                assignedDeliveryId: emp.id,
                                                assignedDeliveryName: emp.name
                                              });
                                            }
                                          }}
                                          className="w-full bg-transparent text-[11px] font-bold text-gray-800 dark:text-zinc-300 focus:outline-none border border-gray-200 dark:border-[#291316] p-1.5 rounded-lg cursor-pointer bg-white dark:bg-[#120709]"
                                          defaultValue=""
                                        >
                                          <option value="" disabled>Select delivery executive...</option>
                                          {employees.filter(emp => emp.post.startsWith('Delivery Executive')).map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.post.replace('Delivery Executive ', '')})</option>
                                          ))}
                                          {employees.filter(emp => emp.post.startsWith('Delivery Executive')).length === 0 && (
                                            <option disabled>No Delivery Executives registered</option>
                                          )}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons Footer */}
                                <div className="border-t border-indigo-100/40 pt-3.5 flex flex-wrap gap-2.5 justify-end pl-2">
                                  <button
                                    onClick={() => onUpdateOrderStatus(or.id, 'preparing')}
                                    className="px-4 py-2 bg-white dark:bg-black/30 hover:bg-gray-50 border border-gray-200 text-gray-600 dark:text-zinc-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    ↩ Send Back to Preparing
                                  </button>
                                  
                                  <button
                                    onClick={() => onUpdateOrderStatus(or.id, 'delivery')}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                  >
                                    🚚 Dispatch (Out for Delivery)
                                  </button>

                                  <button
                                    onClick={() => onUpdateOrderStatus(or.id, 'ready')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                  >
                                    ✓ Complete & Deliver
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Kiosk Stock level changer */}
              {activeAdminTab === 'kiosk' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form (Add or Edit) */}
                  <div className="col-span-12 lg:col-span-5 space-y-5">
                    {editingKioskId ? (
                      <div className="p-5 bg-purple-50 dark:bg-purple-500/10/50 rounded-3xl border border-purple-200/60 shadow-md dark:shadow-none flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-extrabold text-xs text-purple-950 dark:text-pink-300 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5 text-purple-700 animate-spin" /> Edit Kiosk Item
                          </h4>
                          <button
                            type="button"
                            onClick={() => setEditingKioskId(null)}
                            className="text-[10px] text-gray-400 hover:text-gray-600 hover:dark:text-[#d4d4d8] uppercase font-black tracking-wider"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-[11px] text-purple-900 dark:text-purple-300/80 mb-4 leading-normal font-medium">
                          Modify price, base options, maximum stock levels, or images for the live self-serve kiosk.
                        </p>
                        <form onSubmit={handleSaveKioskEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Product Name</label>
                            <input
                              type="text"
                              value={editingKioskName}
                              onChange={(e) => setEditingKioskName(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingKioskPrice}
                              onChange={(e) => setEditingKioskPrice(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Flavor / Base</label>
                            <input
                              type="text"
                              value={editingKioskFlavor}
                              onChange={(e) => setEditingKioskFlavor(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Total Stock</label>
                            <input
                              type="number"
                              value={editingKioskStock}
                              onChange={(e) => setEditingKioskStock(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                              required
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-purple-705 dark:text-pink-300 uppercase mb-1.5 font-sans">Campuses Zone Availability (Edit)</label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const allIds = campuses.map(c => c.id);
                                  if (editingKioskCampusIds.length === allIds.length) {
                                    setEditingKioskCampusIds([]);
                                  } else {
                                    setEditingKioskCampusIds(allIds);
                                  }
                                }}
                                className="px-2.5 py-1 text-[9px] font-extrabold uppercase text-purple-700 dark:text-[#f472b6] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                              >
                                {editingKioskCampusIds.length === campuses.length ? "Deselect All" : "Select All"}
                              </button>
                              {campuses.map((c) => {
                                const isSelected = editingKioskCampusIds.includes(c.id);
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditingKioskCampusIds(prev => prev.filter(id => id !== c.id));
                                      } else {
                                        setEditingKioskCampusIds(prev => [...prev, c.id]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-purple-700 text-white border-purple-705' 
                                        : 'bg-white dark:bg-[#120709] text-gray-700 dark:text-[#e4e4e7] border-gray-200 dark:border-[#3c1a1e] hover:bg-gray-50'
                                    }`}
                                  >
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>
                            {editingKioskCampusIds.length === 0 && (
                              <p className="text-[8px] text-[#C49A25] mt-1.5 font-bold">⚠️ Leaving unselected defaults this product to be available across ALL campuses.</p>
                            )}
                          </div>

                          <div className="sm:col-span-2 bg-white dark:bg-[#120709] rounded-xl border border-dashed dark:border-[#3c1a1e] border-purple-200 p-3 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-purple-700 uppercase">Product Image Override</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditKioskImageUpload}
                              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer font-medium"
                            />
                            {editingKioskImage && (
                              <div className="mt-1">
                                <img src={editingKioskImage} alt="Preview" className="h-14 w-14 object-cover rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-[#3c1a1e]" />
                              </div>
                            )}
                          </div>
                          <button
                            type="submit"
                            className="sm:col-span-2 mt-3 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
                          >
                            Save Kiosk Product Updates
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="p-5 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none flex flex-col">
                        <h4 className="font-extrabold text-xs text-purple-950 dark:text-pink-300 dark:text-purple-300 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5 text-purple-600" /> Add to Kiosk Inventory
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mb-4 leading-normal font-medium">
                          Quickly add new instant-pickup items directly to the kiosk inventory.
                        </p>
                        <form onSubmit={handleAddNewKioskProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <input
                            type="text"
                            placeholder="Product Name"
                            value={newKioskName}
                            onChange={(e) => setNewKioskName(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium"
                            required
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={newKioskPrice}
                            onChange={(e) => setNewKioskPrice(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Flavor"
                            value={newKioskFlavor}
                            onChange={(e) => setNewKioskFlavor(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Initial Stock"
                            value={newKioskStock}
                            onChange={(e) => setNewKioskStock(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium"
                            required
                          />

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase mb-1.5 font-sans">Campuses Zone Availability</label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const allIds = campuses.map(c => c.id);
                                  if (newKioskCampusIds.length === allIds.length) {
                                    setNewKioskCampusIds([]);
                                  } else {
                                    setNewKioskCampusIds(allIds);
                                  }
                                }}
                                className="px-2.5 py-1 text-[9px] font-extrabold uppercase text-purple-700 dark:text-[#f472b6] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                              >
                                {newKioskCampusIds.length === campuses.length ? "Deselect All" : "Select All"}
                              </button>
                              {campuses.map((c) => {
                                const isSelected = newKioskCampusIds.includes(c.id);
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setNewKioskCampusIds(prev => prev.filter(id => id !== c.id));
                                      } else {
                                        setNewKioskCampusIds(prev => [...prev, c.id]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-purple-600 text-white border-purple-650' 
                                        : 'bg-white dark:bg-[#120709] text-gray-700 dark:text-[#e4e4e7] border-gray-200 dark:border-[#3c1a1e] hover:bg-gray-50'
                                    }`}
                                  >
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>
                            {newKioskCampusIds.length === 0 && (
                              <p className="text-[8px] text-[#C49A25] mt-1.5 font-bold">⚠️ Leaving unselected defaults this product to be available across ALL campuses.</p>
                            )}
                          </div>

                          <div className="sm:col-span-2 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-xl border border-dashed dark:border-[#3c1a1e] border-gray-300 dark:border-slate-600 p-3 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Product Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleKioskImageUpload}
                              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer font-medium"
                            />
                            {newKioskImage && (
                              <div className="mt-1">
                                <img src={newKioskImage} alt="Preview" className="h-14 w-14 object-cover rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-[#3c1a1e]" />
                              </div>
                            )}
                          </div>
                          <button
                            type="submit"
                            className="sm:col-span-2 mt-auto py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
                          >
                            Add Kiosk Item
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Right Column: List & Inventory Manager */}
                  <div className="col-span-12 lg:col-span-7 p-5 bg-white dark:bg-[#120709] border border-gray-200 dark:border-[#3c1a1e] rounded-3xl shadow-sm dark:shadow-none">
                    <h4 className="font-extrabold text-xs text-purple-950 dark:text-pink-300 dark:text-purple-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-purple-600" /> Live Inventory Adjustments
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mb-4 leading-normal">
                      Configure details, adjust stock, or purge products from immediate kiosk availability.
                    </p>

                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {kioskInventory.map(item => {
                        const itemCampuses = item.campusIds && item.campusIds.length > 0
                          ? campuses.filter(c => item.campusIds?.includes(c.id)).map(c => c.name)
                          : ['All Campuses'];

                        return (
                          <div key={item.id} className="p-3 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-gray-100 dark:border-[#291316] hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <img src={item.image} className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none" referrerPolicy="no-referrer" />
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white block">{item.name}</span>
                                <span className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">{item.flavor}</span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">₹{item.price}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-pink-300 font-extrabold rounded">
                                    Hubs: {itemCampuses.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                              {/* Stock Adjuster */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Stock:</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateKioskStock(item.id, Math.max(0, item.remainingStock - 1))}
                                  className="w-6 h-6 bg-white dark:bg-[#120709] hover:bg-red-50 hover:dark:bg-red-500/10 text-red-600 font-extrabold rounded-lg border border-gray-200 dark:border-[#3c1a1e] hover:border-red-200 transition-colors text-center text-xs flex items-center justify-center active:scale-95"
                                >
                                  -
                                </button>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number"
                                    min="0"
                                    value={item.remainingStock}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      onUpdateKioskStock(item.id, isNaN(val) ? 0 : Math.max(0, val));
                                    }}
                                    className="w-12 h-6 text-center font-mono text-xs font-black text-gray-900 dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-[#3c1a1e] rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-gray-400 font-normal text-xs">/ {item.totalStock}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onUpdateKioskStock(item.id, Math.min(item.totalStock + 10, item.remainingStock + 1))}
                                  className="w-6 h-6 bg-white dark:bg-[#120709] hover:bg-green-50 text-green-600 font-extrabold rounded-lg border border-gray-200 dark:border-[#3c1a1e] hover:border-green-200 transition-colors text-center text-xs flex items-center justify-center active:scale-95"
                                >
                                  +
                                </button>
                              </div>

                              {/* Editing & Deletion */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Edit Product details"
                                  onClick={() => {
                                    setEditingKioskId(item.id);
                                    setEditingKioskName(item.name);
                                    setEditingKioskPrice(item.price.toString());
                                    setEditingKioskFlavor(item.flavor || '');
                                    setEditingKioskStock(item.totalStock.toString());
                                    setEditingKioskImage(item.image);
                                    setEditingKioskCampusIds(item.campusIds || []);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="p-1.5 bg-white dark:bg-[#120709] text-gray-500 dark:text-[#a1a1aa] hover:text-purple-700 hover:bg-purple-50 hover:dark:bg-purple-500/10 rounded-lg border border-gray-250 dark:border-[#3c1a1e] hover:border-purple-200 transition-colors active:scale-95"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              
                              <button
                                type="button"
                                title="Delete from Kiosk"
                                onClick={() => {
                                  if (onDeleteKioskProduct) {
                                    onDeleteKioskProduct(item.id);
                                  }
                                }}
                                className="p-1.5 bg-white dark:bg-[#120709] text-gray-400 hover:text-red-600 hover:bg-red-50 hover:dark:bg-red-500/10 rounded-lg border border-gray-250 dark:border-[#3c1a1e] hover:border-red-200 transition-colors active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}

              {/* Catalog Publisher section */}
              {activeAdminTab === 'catalog' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form (Add or Edit) */}
                  <div className="col-span-12 lg:col-span-5 space-y-5">
                    {editingCakeId ? (
                      <div className="p-5 bg-purple-50 dark:bg-purple-500/10/50 rounded-3xl border border-purple-200/60 shadow-md dark:shadow-none flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-extrabold text-xs text-purple-950 dark:text-pink-300 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5 text-purple-700 animate-spin" /> Edit Catalog Product
                          </h4>
                          <button
                            type="button"
                            onClick={() => setEditingCakeId(null)}
                            className="text-[10px] text-gray-400 hover:text-gray-600 hover:dark:text-[#d4d4d8] uppercase font-black tracking-wider"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-[11px] text-purple-900 dark:text-purple-300/80 mb-4 leading-normal font-medium">
                          Modify prices, culinary description, categories, and photographs for the live campus store menu.
                        </p>
                        <form onSubmit={handleSaveCakeEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Cake Title</label>
                            <input
                              type="text"
                              value={editingCakeName}
                              onChange={(e) => setEditingCakeName(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                              required
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Base Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingCakePrice}
                              onChange={(e) => setEditingCakePrice(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Category</label>
                            <select
                              value={editingCakeCategory}
                              onChange={(e) => setEditingCakeCategory(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                            >
                              <option value="Birthday Cakes">Birthday Cakes</option>
                              <option value="Chocolate Cakes">Chocolate Cakes</option>
                              <option value="Red Velvet">Red Velvet</option>
                              <option value="Bento Cakes">Bento Cakes</option>
                              <option value="Photo Cakes">Photo Cakes</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Description</label>
                            <input
                              type="text"
                              value={editingCakeDesc}
                              onChange={(e) => setEditingCakeDesc(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#120709] text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:outline-none focus:ring-2 focus:ring-purple-150 transition-colors font-bold text-gray-800 dark:text-[#fafafa]"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Available Weights (kg)</label>
                            <div className="flex flex-wrap gap-2">
                              {[0.5, 1.0, 1.5, 2.0, 3.0].map((w) => (
                                <div key={w} className="flex flex-col gap-1">
                                  <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#120709] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#3c1a1e] text-xs text-gray-700 dark:text-[#e4e4e7] font-medium hover:bg-purple-50 hover:dark:bg-purple-500/10 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      className="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-1 w-3.5 h-3.5"
                                      checked={editingCakeWeights.includes(w)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditingCakeWeights(prev => [...prev, w].sort());
                                        } else {
                                          setEditingCakeWeights(prev => prev.filter(weight => weight !== w));
                                          setEditingCakeWeightPrices(prev => {
                                            const newPrices = { ...prev };
                                            delete newPrices[w];
                                            return newPrices;
                                          });
                                        }
                                      }}
                                    />
                                    <span>{w} kg</span>
                                  </label>
                                  {editingCakeWeights.includes(w) && (
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Price"
                                      value={editingCakeWeightPrices[w] || ''}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setEditingCakeWeightPrices(prev => {
                                          if (isNaN(val) || val <= 0) {
                                            const newPrices = { ...prev };
                                            delete newPrices[w];
                                            return newPrices;
                                          }
                                          return { ...prev, [w]: val };
                                        });
                                      }}
                                      className="px-2 py-1 bg-white dark:bg-[#120709] text-[10px] rounded border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-1 focus:ring-purple-150 transition-colors w-16"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            {editingCakeWeights.length === 0 && <p className="text-[9px] text-red-500 mt-1 font-medium px-1">Please select at least one weight option.</p>}
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-purple-700 dark:text-pink-300 uppercase mb-1.5 font-sans">Campuses Zone Availability (Edit)</label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const allIds = campuses.map(c => c.id);
                                  if (editingCakeCampusIds.length === allIds.length) {
                                    setEditingCakeCampusIds([]);
                                  } else {
                                    setEditingCakeCampusIds(allIds);
                                  }
                                }}
                                className="px-2.5 py-1 text-[9px] font-extrabold uppercase text-purple-700 dark:text-[#f472b6] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                              >
                                {editingCakeCampusIds.length === campuses.length ? "Deselect All" : "Select All"}
                              </button>
                              {campuses.map((c) => {
                                const isSelected = editingCakeCampusIds.includes(c.id);
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditingCakeCampusIds(prev => prev.filter(id => id !== c.id));
                                      } else {
                                        setEditingCakeCampusIds(prev => [...prev, c.id]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-purple-700 text-white border-purple-705' 
                                        : 'bg-white dark:bg-[#120709] text-gray-700 dark:text-[#e4e4e7] border-gray-200 dark:border-[#3c1a1e] hover:bg-gray-50'
                                    }`}
                                  >
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>
                            {editingCakeCampusIds.length === 0 && (
                              <p className="text-[8px] text-[#C49A25] mt-1.5 font-bold">⚠️ Leaving unselected defaults this product to be available across ALL campuses.</p>
                            )}
                          </div>

                          <div className="sm:col-span-2 space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Service Availability Modes (Edit)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-[#1a0d0f]/80 p-2.5 rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-1 w-4 h-4 cursor-pointer"
                                  checked={editingCakeIsDelivery}
                                  onChange={(e) => setEditingCakeIsDelivery(e.target.checked)}
                                />
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-800 dark:text-[#fafafa] flex items-center gap-1 font-extrabold">🚚 Room Delivery</span>
                                  <span className="text-[9px] text-gray-400 font-medium font-sans">Deliverable to room/hostels</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-[#1a0d0f]/80 p-2.5 rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-1 w-4 h-4 cursor-pointer"
                                  checked={editingCakeIsDineIn}
                                  onChange={(e) => setEditingCakeIsDineIn(e.target.checked)}
                                />
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-800 dark:text-[#fafafa] flex items-center gap-1 font-extrabold">🍽️ Dine-In Canteen</span>
                                  <span className="text-[9px] text-gray-400 font-medium font-sans">Available for Canteen dining</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <div className="sm:col-span-2 space-y-2 pt-2 border-t border-gray-100 dark:border-[#3c1a1e]">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Standard Customizations (Uncheck to Hide)</label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!editingCakeHideWeight} onChange={(e) => setEditingCakeHideWeight(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Weight / Size</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!editingCakeHideFlavor} onChange={(e) => setEditingCakeHideFlavor(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Flavor / Variant</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!editingCakeHideMessage} onChange={(e) => setEditingCakeHideMessage(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Custom Message</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!editingCakeHideAddons} onChange={(e) => setEditingCakeHideAddons(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Event Add-ons</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!editingCakeHideQuantity} onChange={(e) => setEditingCakeHideQuantity(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Quantity</span>
                              </label>
                            </div>
                          </div>

                          <div className="sm:col-span-2 space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Custom Order Questions (Edit)</label>
                              <button
                                type="button"
                                onClick={() => setEditingCakeQuestions([...editingCakeQuestions, { id: Date.now().toString(), question: '', type: 'text', options: [] }])}
                                className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                              >
                                + Add Question
                              </button>
                            </div>
                            {editingCakeQuestions.map((q, idx) => (
                              <div key={q.id} className="p-3 bg-white dark:bg-[#120709] border border-gray-200 dark:border-[#3c1a1e] rounded-xl flex flex-col gap-2 relative">
                                <button type="button" onClick={() => setEditingCakeQuestions(editingCakeQuestions.filter(x => x.id !== q.id))} className="absolute top-2 right-2 text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                <input
                                  type="text" placeholder="Question Title" value={q.question}
                                  onChange={(e) => { const n = [...editingCakeQuestions]; n[idx].question = e.target.value; setEditingCakeQuestions(n); }}
                                  className="px-2 py-1.5 text-xs border rounded-md dark:bg-[#1a0d0f] dark:border-[#3c1a1e] dark:text-white"
                                />
                                <div className="flex gap-2 items-center">
                                  <select
                                    value={q.type}
                                    onChange={(e) => { const n = [...editingCakeQuestions]; n[idx].type = e.target.value as any; setEditingCakeQuestions(n); }}
                                    className="px-2 py-1.5 text-xs border rounded-md dark:bg-[#1a0d0f] dark:border-[#3c1a1e] dark:text-white"
                                  >
                                    <option value="text">Text Input</option>
                                    <option value="dropdown">Dropdown Options</option>
                                    <option value="checkbox">Checkbox (Yes/No)</option>
                                  </select>
                                  <label className="text-[10px] flex items-center gap-1 cursor-pointer dark:text-gray-300">
                                    <input type="checkbox" checked={q.required || false} onChange={(e) => { const n = [...editingCakeQuestions]; n[idx].required = e.target.checked; setEditingCakeQuestions(n); }} /> Required
                                  </label>
                                </div>
                                {q.type === 'dropdown' && (
                                  <input
                                    type="text" placeholder="Comma separated options"
                                    value={q.options?.join(', ') || ''}
                                    onChange={(e) => { const n = [...editingCakeQuestions]; n[idx].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setEditingCakeQuestions(n); }}
                                    className="px-2 py-1.5 text-xs border rounded-md dark:bg-[#1a0d0f] dark:border-[#3c1a1e] dark:text-white"
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="sm:col-span-2 bg-white dark:bg-[#120709] rounded-xl border border-dashed dark:border-[#3c1a1e] border-purple-200 p-3 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-purple-700 uppercase">Artwork Override</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditCakeImageUpload}
                              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer font-medium"
                            />
                            {editingCakeImage && (
                              <div className="mt-1">
                                <img src={editingCakeImage} alt="Preview" className="h-14 w-14 object-cover rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-[#3c1a1e]" />
                              </div>
                            )}
                          </div>

                          <button
                            type="submit"
                            className="sm:col-span-2 mt-3 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
                          >
                            Save Product Updates
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="p-5 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none flex flex-col">
                        <h4 className="font-extrabold text-xs text-purple-950 dark:text-pink-300 dark:text-purple-300 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> Catalog Publisher
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mb-4 leading-normal font-medium font-sans">
                          Quickly add new specialty cakes or seasonal features directly to the live campus store menu.
                        </p>
                        <form onSubmit={handleAddNewCakeSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <input
                            type="text"
                            placeholder="Cake Title (e.g., Midnight Fudge)"
                            value={newCakeName}
                            onChange={(e) => setNewCakeName(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium"
                            required
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price (e.g., 499)"
                            value={newCakePrice}
                            onChange={(e) => setNewCakePrice(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium"
                            required
                          />
                          <select
                            value={newCakeCategory}
                            onChange={(e) => setNewCakeCategory(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium sm:col-span-2"
                          >
                            <option value="Birthday Cakes">Birthday Cakes</option>
                            <option value="Chocolate Cakes">Chocolate Cakes</option>
                            <option value="Red Velvet">Red Velvet</option>
                            <option value="Bento Cakes">Bento Cakes</option>
                            <option value="Photo Cakes">Photo Cakes</option>
                          </select>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Brief culinary highlights description..."
                              value={newCakeDesc}
                              onChange={(e) => setNewCakeDesc(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-colors text-gray-800 dark:text-[#fafafa] font-medium"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase mb-2">Available Weights (kg)</label>
                            <div className="flex flex-wrap gap-2">
                              {[0.5, 1.0, 1.5, 2.0, 3.0].map((w) => (
                                <div key={w} className="flex flex-col gap-1">
                                  <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#120709] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#3c1a1e] text-xs text-gray-700 dark:text-[#e4e4e7] font-medium hover:bg-gray-50 hover:dark:bg-[#1a0d0f]/80 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      className="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-1 w-3.5 h-3.5"
                                      checked={newCakeWeights.includes(w)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setNewCakeWeights(prev => [...prev, w].sort());
                                        } else {
                                          setNewCakeWeights(prev => prev.filter(weight => weight !== w));
                                          setNewCakeWeightPrices(prev => {
                                            const newPrices = { ...prev };
                                            delete newPrices[w];
                                            return newPrices;
                                          });
                                        }
                                      }}
                                    />
                                    <span>{w} kg</span>
                                  </label>
                                  {newCakeWeights.includes(w) && (
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Price"
                                      value={newCakeWeightPrices[w] || ''}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setNewCakeWeightPrices(prev => {
                                          if (isNaN(val) || val <= 0) {
                                            const newPrices = { ...prev };
                                            delete newPrices[w];
                                            return newPrices;
                                          }
                                          return { ...prev, [w]: val };
                                        });
                                      }}
                                      className="px-2 py-1 bg-gray-50 dark:bg-[#1a0d0f]/80 text-[10px] rounded border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-1 focus:ring-purple-100 transition-colors w-16"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            {newCakeWeights.length === 0 && <p className="text-[9px] text-red-500 mt-1 font-medium">Please select at least one weight option.</p>}
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase mb-1.5 font-sans">Campuses Zone Availability</label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const allIds = campuses.map(c => c.id);
                                  if (newCakeCampusIds.length === allIds.length) {
                                    setNewCakeCampusIds([]);
                                  } else {
                                    setNewCakeCampusIds(allIds);
                                  }
                                }}
                                className="px-2.5 py-1 text-[9px] font-extrabold uppercase text-purple-700 dark:text-[#f472b6] bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                              >
                                {newCakeCampusIds.length === campuses.length ? "Deselect All" : "Select All"}
                              </button>
                              {campuses.map((c) => {
                                const isSelected = newCakeCampusIds.includes(c.id);
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setNewCakeCampusIds(prev => prev.filter(id => id !== c.id));
                                      } else {
                                        setNewCakeCampusIds(prev => [...prev, c.id]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-purple-600 text-white border-purple-650' 
                                        : 'bg-white dark:bg-[#120709] text-gray-700 dark:text-[#e4e4e7] border-gray-200 dark:border-[#3c1a1e] hover:bg-gray-50'
                                    }`}
                                  >
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>
                            {newCakeCampusIds.length === 0 && (
                              <p className="text-[8px] text-[#C49A25] mt-1.5 font-bold">⚠️ Leaving unselected defaults this product to be available across ALL campuses.</p>
                            )}
                          </div>

                          <div className="sm:col-span-2 space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Service Availability Modes</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-[#1a0d0f]/80 p-2.5 rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-1 w-4 h-4 cursor-pointer"
                                  checked={newCakeIsDelivery}
                                  onChange={(e) => setNewCakeIsDelivery(e.target.checked)}
                                />
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-800 dark:text-[#fafafa] flex items-center gap-1 font-extrabold">🚚 Room Delivery</span>
                                  <span className="text-[9px] text-gray-400 font-medium font-sans">Deliverable to room/hostels</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-[#1a0d0f]/80 p-2.5 rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all select-none">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-1 w-4 h-4 cursor-pointer"
                                  checked={newCakeIsDineIn}
                                  onChange={(e) => setNewCakeIsDineIn(e.target.checked)}
                                />
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-800 dark:text-[#fafafa] flex items-center gap-1 font-extrabold">🍽️ Dine-In Canteen</span>
                                  <span className="text-[9px] text-gray-400 font-medium font-sans">Available for Canteen dining</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <div className="sm:col-span-2 space-y-2 pt-2 border-t border-gray-100 dark:border-[#3c1a1e]">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase px-1">Standard Customizations (Uncheck to Hide)</label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!newCakeHideWeight} onChange={(e) => setNewCakeHideWeight(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Weight / Size</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!newCakeHideFlavor} onChange={(e) => setNewCakeHideFlavor(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Flavor / Variant</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!newCakeHideMessage} onChange={(e) => setNewCakeHideMessage(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Custom Message</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!newCakeHideAddons} onChange={(e) => setNewCakeHideAddons(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Event Add-ons</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#1a0d0f] rounded-lg border border-gray-200 dark:border-[#3c1a1e] cursor-pointer">
                                <input type="checkbox" checked={!newCakeHideQuantity} onChange={(e) => setNewCakeHideQuantity(!e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Quantity</span>
                              </label>
                            </div>
                          </div>

                          <div className="sm:col-span-2 space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Custom Order Questions</label>
                              <button
                                type="button"
                                onClick={() => setNewCakeQuestions([...newCakeQuestions, { id: Date.now().toString(), question: '', type: 'text', options: [] }])}
                                className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                              >
                                + Add Question
                              </button>
                            </div>
                            {newCakeQuestions.map((q, idx) => (
                              <div key={q.id} className="p-3 bg-white dark:bg-[#120709] border border-gray-200 dark:border-[#3c1a1e] rounded-xl flex flex-col gap-2 relative">
                                <button type="button" onClick={() => setNewCakeQuestions(newCakeQuestions.filter(x => x.id !== q.id))} className="absolute top-2 right-2 text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                <input
                                  type="text" placeholder="Question Title (e.g. Write message on cake?)" value={q.question}
                                  onChange={(e) => { const n = [...newCakeQuestions]; n[idx].question = e.target.value; setNewCakeQuestions(n); }}
                                  className="px-2 py-1.5 text-xs border rounded-md dark:bg-[#1a0d0f] dark:border-[#3c1a1e] dark:text-white"
                                />
                                <div className="flex gap-2 items-center">
                                  <select
                                    value={q.type}
                                    onChange={(e) => { const n = [...newCakeQuestions]; n[idx].type = e.target.value as any; setNewCakeQuestions(n); }}
                                    className="px-2 py-1.5 text-xs border rounded-md dark:bg-[#1a0d0f] dark:border-[#3c1a1e] dark:text-white"
                                  >
                                    <option value="text">Text Input</option>
                                    <option value="dropdown">Dropdown Options</option>
                                    <option value="checkbox">Checkbox (Yes/No)</option>
                                  </select>
                                  <label className="text-[10px] flex items-center gap-1 cursor-pointer dark:text-gray-300">
                                    <input type="checkbox" checked={q.required || false} onChange={(e) => { const n = [...newCakeQuestions]; n[idx].required = e.target.checked; setNewCakeQuestions(n); }} /> Required
                                  </label>
                                </div>
                                {q.type === 'dropdown' && (
                                  <input
                                    type="text" placeholder="Comma separated options (e.g. Red, Blue, Green)"
                                    value={q.options?.join(', ') || ''}
                                    onChange={(e) => { const n = [...newCakeQuestions]; n[idx].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setNewCakeQuestions(n); }}
                                    className="px-2 py-1.5 text-xs border rounded-md dark:bg-[#1a0d0f] dark:border-[#3c1a1e] dark:text-white"
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="sm:col-span-2 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-xl border border-dashed dark:border-[#3c1a1e] border-gray-300 dark:border-slate-600 p-3 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Featured Artwork</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer font-medium"
                            />
                            {newCakeImage && (
                              <div className="mt-1">
                                <img src={newCakeImage} alt="Preview" className="h-14 w-14 object-cover rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-[#291316]" />
                              </div>
                            )}
                          </div>
                          <button
                            type="submit"
                            className="sm:col-span-2 mt-auto py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
                          >
                            Publish to Marketplace
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Right Column: List & Catalog Menu Organizer */}
                  <div className="col-span-12 lg:col-span-7 p-5 bg-white dark:bg-[#120709] border border-gray-200 dark:border-[#3c1a1e] rounded-3xl shadow-sm dark:shadow-none">
                    <h4 className="font-extrabold text-xs text-purple-950 dark:text-pink-300 dark:text-purple-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> Advance Order Catalog Menu
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mb-4 leading-normal">
                      Listed pre-order cakes currently available across campuses. Adjust descriptions, pricing, or delete old specialties.
                    </p>

                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {allCakes.map(item => {
                        const itemCampuses = item.campusIds && item.campusIds.length > 0
                          ? campuses.filter(c => item.campusIds?.includes(c.id)).map(c => c.name)
                          : ['All Campuses'];

                        return (
                          <div key={item.id} className="p-3 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-gray-100 dark:border-[#291316] hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={item.image} className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none align-self-start" referrerPolicy="no-referrer" />
                              <div className="min-w-0">
                                <span className="font-bold text-gray-900 dark:text-white block truncate max-w-[190px]">{item.name}</span>
                                <span className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider block">{item.category}</span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Base: ₹{item.price}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-pink-300 font-extrabold rounded">
                                    Hubs: {itemCampuses.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                              <button
                                type="button"
                                title="Edit product info"
                                onClick={() => {
                                  setEditingCakeId(item.id);
                                  setEditingCakeName(item.name);
                                  setEditingCakePrice(item.price.toString());
                                  setEditingCakeCategory(item.category);
                                  setEditingCakeDesc(item.description);
                                  setEditingCakeImage(item.image);
                                  setEditingCakeWeights(item.weights || []);
                                  setEditingCakeWeightPrices(item.weightPrices || {});
                                  setEditingCakeCampusIds(item.campusIds || []);
                                  setEditingCakeIsDineIn(item.isDineIn !== false);
                                  setEditingCakeIsDelivery(item.isDelivery !== false);
                                  setEditingCakeQuestions(item.customQuestions || []);
                                  setEditingCakeHideWeight(item.hideWeightSelection || false);
                                  setEditingCakeHideFlavor(item.hideFlavorSelection || false);
                                  setEditingCakeHideMessage(item.hideMessageOnCake || false);
                                  setEditingCakeHideAddons(item.hideEventAddons || false);
                                  setEditingCakeHideQuantity(item.hideQuantitySelection || false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1.5 bg-white dark:bg-[#120709] text-gray-500 dark:text-[#a1a1aa] hover:text-purple-700 hover:bg-purple-50 hover:dark:bg-purple-500/10 rounded-lg border border-gray-250 dark:border-[#3c1a1e] hover:border-purple-200 transition-colors text-[10px] font-bold flex items-center gap-1 active:scale-95"
                              >
                                <Settings className="w-3.5 h-3.5" /> Edit Info
                              </button>
                            
                            <button
                              type="button"
                              title="Delete product"
                              onClick={() => {
                                if (onDeleteCustomCake) {
                                  onDeleteCustomCake(item.id);
                                }
                              }}
                              className="p-1.5 bg-white dark:bg-[#120709] text-gray-400 hover:text-red-600 hover:bg-red-50 hover:dark:bg-red-500/10 rounded-lg border border-gray-250 dark:border-[#3c1a1e] hover:border-red-200 transition-colors active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}

              {/* Add Campus Control */}
              {activeAdminTab === 'campus' && (
                <div className="grid grid-cols-1 gap-5">
                  <div className="p-5 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none flex flex-col">
                  <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Campus Expansion Hub
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mb-4 leading-normal">
                    Provision new campus zones to unlock deliveries and custom kiosks for new student bodies.
                  </p>
                  <form onSubmit={handleAddNewCampusSubmit} className="grid grid-cols-1 gap-3 flex-1">
                    <div className="space-y-1">
                      <label className="pl-1 text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Institution Name</label>
                      <input
                        type="text"
                        placeholder="e.g. SRCC North Campus"
                        value={newCampusName}
                        onChange={(e) => setNewCampusName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="pl-1 text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Primary Drop-off Hub</label>
                      <input
                        type="text"
                        placeholder="e.g. Activity Center, Block D"
                        value={newCampusLocation}
                        onChange={(e) => setNewCampusLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
                        required
                      />
                    </div>
                    
                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800 text-[10px] font-medium leading-relaxed">
                      <strong>Note:</strong> Newly added campuses become instantly visible on the student login portal. Make sure your local ambassadors are ready before adding.
                    </div>

                    <button
                      type="submit"
                      className="mt-auto py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      Provision New Campus
                    </button>
                  </form>
                </div>
                
                {/* List of Active Campuses for Deletion */}
                <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none overflow-hidden flex flex-col">
                    <div className="border-b border-gray-100 dark:border-[#291316] p-4">
                      <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center justify-between">
                        <span>Active Campus Hubs</span>
                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-[#1a0d0f]/80 px-2.5 py-1 rounded-full">{campuses.length} Hubs</span>
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100 p-3 space-y-2">
                       {campuses.map(campus => (
                         <div key={campus.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-xl">
                            <div>
                              <h5 className="font-bold text-xs text-gray-900 dark:text-white">{campus.name}</h5>
                              <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> {campus.location}</p>
                            </div>
                            <button
                              onClick={() => onDeleteCampus?.(campus.id)}
                              className="p-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors shrink-0 cursor-pointer"
                              title="Delete Campus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                       ))}
                       {campuses.length === 0 && (
                         <div className="p-4 text-center text-xs text-gray-500 dark:text-[#a1a1aa] font-medium">No campuses active.</div>
                       )}
                    </div>
                </div>
                </div>
              )}

              {/* Discount Coupons Admin Control */}
              {activeAdminTab === 'coupons' && (
                <div className="grid grid-cols-1 gap-5">
                  <div className="p-5 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none flex flex-col">
                  <h4 className="font-extrabold text-xs text-rose-950 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-600" /> Coupon Generation Hub
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mb-4 leading-normal">
                    Generate discount codes for different occasions and events. New discounts will pop up for users automatically.
                  </p>
                  <form onSubmit={handleAddCouponSubmit} className="grid grid-cols-1 gap-3 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="pl-1 text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Discount Code</label>
                        <input
                          type="text"
                          placeholder="e.g. DIWALI20"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-rose-100 transition-colors uppercase"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="pl-1 text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Occasion/Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Navratri Special Offer"
                          value={newCouponOccasion}
                          onChange={(e) => setNewCouponOccasion(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-rose-100 transition-colors"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-2">
                       <div className="space-y-1">
                        <label className="pl-1 text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Discount Type</label>
                        <select
                          value={newCouponType}
                          onChange={(e) => setNewCouponType(e.target.value as 'percentage' | 'flat')}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-rose-100 transition-colors"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat Amount (₹)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="pl-1 text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Value</label>
                        <input
                          type="number"
                          placeholder={newCouponType === 'percentage' ? "e.g. 15 (for 15%)" : "e.g. 50 (for ₹50)"}
                          value={newCouponValue}
                          onChange={(e) => setNewCouponValue(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-rose-100 transition-colors"
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 mt-2">
                      <label className="pl-1 text-[10px] font-bold text-gray-500 dark:text-[#a1a1aa] uppercase">Usage Limit (Max users)</label>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={newCouponLimit}
                        onChange={(e) => setNewCouponLimit(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a0d0f]/80 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] focus:bg-white focus:dark:bg-[#120709] focus:outline-none focus:ring-2 focus:ring-rose-100 transition-colors"
                        required
                        min="1"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="mt-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98]"
                    >
                      Generate Discount Code
                    </button>
                  </form>
                </div>
                
                {/* List of Active Coupons */}
                <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] shadow-sm dark:shadow-none overflow-hidden flex flex-col">
                    <div className="border-b border-gray-100 dark:border-[#291316] p-4">
                      <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center justify-between">
                        <span>Active Discount Coupons</span>
                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-[#1a0d0f]/80 px-2.5 py-1 rounded-full">{coupons.filter(c => c.isActive).length} Live</span>
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100 p-3 space-y-2">
                       {coupons.map(coupon => (
                         <div key={coupon.id} className={`flex items-center justify-between p-3 rounded-xl border ${coupon.isActive ? 'bg-rose-50 dark:bg-[#1a0d0f] border-rose-100' : 'bg-gray-50 dark:bg-black/40 border-gray-200/50'}`}>
                            <div className={!coupon.isActive ? "opacity-60" : ""}>
                              <div className="flex items-center gap-2">
                                <h5 className="font-black text-xs text-rose-700">{coupon.code}</h5>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-gray-800 dark:text-gray-300 mt-1">{coupon.occasion}</p>
                              <p className="text-[9px] text-gray-500 font-medium mt-1">
                                Used: {coupon.usersUsed.length} / {coupon.usageLimit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {onUpdateCouponStatus && (
                                <button
                                  onClick={() => onUpdateCouponStatus(coupon.id, !coupon.isActive)}
                                  className={`p-2 rounded-xl transition-colors text-[10px] font-bold text-white shrink-0 cursor-pointer ${coupon.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                  {coupon.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                                </button>
                              )}
                              {onDeleteCoupon && (
                                <button
                                  onClick={() => onDeleteCoupon(coupon.id)}
                                  className="p-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors shrink-0 cursor-pointer"
                                  title="Delete Coupon"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                         </div>
                       ))}
                       {coupons.length === 0 && (
                         <div className="p-4 text-center text-xs text-gray-500 dark:text-[#a1a1aa] font-medium">No coupons generated yet.</div>
                       )}
                    </div>
                </div>
                </div>
              )}

              {activeAdminTab === 'qrcodes' && (
                <div className="space-y-6">
                  {/* QR Codes Header */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-6 rounded-3xl border border-purple-500/20">
                    <h3 className="font-extrabold text-sm text-purple-900 dark:text-purple-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <QrCode className="w-5 h-5" /> Dine-In Table QR Codes
                    </h3>
                    <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-medium max-w-2xl">
                      Print these QR codes and place them on the canteen tables. When students scan them, the app will automatically open in Dine-In mode with their table number pre-selected.
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white dark:bg-[#120709] p-4 rounded-2xl border border-gray-200 dark:border-[#3c1a1e]">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">App Domain / Base URL</label>
                      <input 
                        type="text"
                        value={qrBaseUrl}
                        onChange={(e) => setQrBaseUrl(e.target.value)}
                        placeholder="e.g., https://my-canteen-app.vercel.app/"
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Number of Tables</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min="1"
                          max="100"
                          value={qrTableCount}
                          onChange={(e) => setQrTableCount(parseInt(e.target.value) || 1)}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                        />
                        <button onClick={() => setQrTableCount(Math.max(1, qrTableCount - 1))} className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-gray-600 dark:text-gray-300 font-bold">-</button>
                        <button onClick={() => setQrTableCount(qrTableCount + 1)} className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-gray-600 dark:text-gray-300 font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: qrTableCount }, (_, i) => i + 1).map((tableNum) => {
                      const qrDataUrl = `${qrBaseUrl.replace(/\/$/, '')}?mode=dinein&table=${tableNum}`;
                      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrDataUrl)}`;
                      
                      return (
                        <div key={tableNum} className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 flex flex-col items-center justify-center text-center shadow-sm">
                          <h4 className="font-black text-lg text-gray-900 dark:text-white mb-4">Table {tableNum}</h4>
                          <div className="bg-white p-2 rounded-xl shadow-inner border border-gray-100 mb-4">
                            <img 
                              src={qrImageUrl} 
                              alt={`QR Code for Table ${tableNum}`} 
                              className="w-32 h-32 object-contain"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 break-all font-mono">
                            {qrDataUrl}
                          </p>
                          <a 
                            href={qrImageUrl}
                            download={`table-${tableNum}-qr.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors w-full cursor-pointer"
                          >
                            Save QR Code
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeAdminTab === 'employees' && (
                <div className="space-y-6 animate-fade-in">
                  {/* HR Workspace Header */}
                  <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-[#E23744]/10 p-6 rounded-3xl border border-purple-500/20 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-purple-900 dark:text-purple-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-600" /> Human Resources Workspace
                        </h3>
                        <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-medium max-w-2xl">
                          Hire, register, and manage campus ambassador teams, counter hosts, branding designers, and hostel runners with secure access control.
                        </p>
                      </div>
                      <div className="bg-purple-100/50 dark:bg-purple-950/40 px-4 py-2 rounded-2xl border border-purple-200/30 text-center shrink-0">
                        <span className="block text-[10px] text-purple-700 dark:text-purple-400 font-extrabold uppercase tracking-widest">Active Staff</span>
                        <span className="text-xl font-black text-purple-950 dark:text-white">{employees.length} Members</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: REGISTRATION FORM */}
                    <div className="lg:col-span-5 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm">
                      <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest mb-1.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#291316] pb-2">
                        <Plus className="w-4 h-4 text-purple-600" /> Hire New Employee
                      </h4>
                      <p className="text-[10px] text-gray-400 mb-4 font-semibold">
                        Register their official campus email. This grants them secure workspace permissions and includes them in the delivery dispatcher grid.
                      </p>

                      <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Candidate Name</label>
                          <input 
                            type="text"
                            placeholder="e.g. Ananya Nair"
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Registered Email</label>
                          <input 
                            type="email"
                            placeholder="e.g. ananya.nair@campus.edu"
                            value={newEmpEmail}
                            onChange={(e) => setNewEmpEmail(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Campus Hub Assignment</label>
                          <select 
                            value={newEmpCampusId}
                            onChange={(e) => setNewEmpCampusId(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 cursor-pointer"
                          >
                            <option value="">All Campuses (Global Team)</option>
                            {campuses.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Designated Staff Post</label>
                          <select 
                            value={newEmpPost}
                            onChange={(e) => setNewEmpPost(e.target.value as Employee['post'])}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 cursor-pointer"
                            required
                          >
                            <option value="Campus Manager">Campus Manager</option>
                            <option value="Customer Experience Executive">Customer Experience Executive</option>
                            <option value="Packaging & Branding Executive">Packaging & Branding Executive</option>
                            <option value="Delivery Executive (Boys' Hostel)">Delivery Executive (Boys' Hostel)</option>
                            <option value="Delivery Executive (Girls' Hostel)">Delivery Executive (Girls' Hostel)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Custom Promo Code (Optional)</label>
                          <input 
                            type="text"
                            placeholder="e.g. ANANYA10 (Leave blank to use ID)"
                            value={newEmpPromoCode}
                            onChange={(e) => setNewEmpPromoCode(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">User Discount Type</label>
                            <select 
                              value={newEmpDiscountType}
                              onChange={(e) => setNewEmpDiscountType(e.target.value as 'percentage' | 'flat')}
                              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="flat">Flat Cash (₹)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Discount Value</label>
                            <input 
                              type="number"
                              min="0"
                              value={newEmpDiscountValue}
                              onChange={(e) => setNewEmpDiscountValue(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee Commission Type</label>
                            <select 
                              value={newEmpCommissionType}
                              onChange={(e) => setNewEmpCommissionType(e.target.value as 'percentage' | 'flat')}
                              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="flat">Flat Cash (₹)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Commission Value</label>
                            <input 
                              type="number"
                              min="0"
                              value={newEmpCommissionValue}
                              onChange={(e) => setNewEmpCommissionValue(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        {/* Dynamic Role Description Card */}
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl">
                          <span className="block text-[9px] text-purple-700 dark:text-purple-400 font-extrabold uppercase tracking-widest">Role Objectives & Duties</span>
                          <p className="text-[10px] text-purple-950 dark:text-gray-300 font-semibold mt-1 leading-normal">
                            {newEmpPost === 'Campus Manager' && 'Picks up orders from partner bakeries and manages campus operations.'}
                            {newEmpPost === 'Customer Experience Executive' && 'Manages the Dine-In Hub counter, assists customers, takes orders, and handles billing.'}
                            {newEmpPost === 'Packaging & Branding Executive' && 'Packages orders, ensures brand presentation, and prepares orders for dispatch.'}
                            {newEmpPost === 'Delivery Executive (Boys\' Hostel)' && 'Delivers orders directly to boys\' hostels.'}
                            {newEmpPost === 'Delivery Executive (Girls\' Hostel)' && 'Delivers orders directly to girls\' hostels.'}
                          </p>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Onboard & Assign Work Credentials
                        </button>
                      </form>
                    </div>

                    {/* RIGHT COLUMN: ACTIVE STAFF DIRECTORY */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Search Bar */}
                      <div className="bg-white dark:bg-[#120709] rounded-2xl border border-gray-200 dark:border-[#3c1a1e] p-3 shadow-sm flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <input 
                          type="text"
                          placeholder="Filter directory by name, email, or role..."
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none text-xs font-semibold placeholder:text-gray-400 text-gray-800 dark:text-[#fafafa]"
                        />
                        {empSearch && (
                          <button 
                            type="button"
                            onClick={() => setEmpSearch('')}
                            className="text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-[#fafafa] uppercase shrink-0 px-1.5"
                          >
                            clear
                          </button>
                        )}
                      </div>

                      {/* Employee List */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {employees
                          .filter(emp => {
                            if (!emp) return false;
                            // Exclude admins from the employees list
                            const adminEmails = ['saransh1860@gmail.com', 'tanishapahal606@gmail.com', 'tanishapahal606@gmal.com'];
                            const empEmailClean = emp.email?.toLowerCase()?.trim() || '';
                            if (adminEmails.includes(empEmailClean)) {
                              return false;
                            }

                            const query = (empSearch || '').toLowerCase();
                            return (
                              (emp.name || '').toLowerCase().includes(query) ||
                              (emp.email || '').toLowerCase().includes(query) ||
                              (emp.post || '').toLowerCase().includes(query)
                            );
                          })
                          .map((emp) => {
                            // Avatar color & initials
                            const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            
                            // Color scheme by designation
                            let badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
                            let iconLabel = "📋";
                            if (emp.post === 'Campus Manager') {
                              badgeStyle = "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/35";
                              iconLabel = "👔";
                            } else if (emp.post === 'Customer Experience Executive') {
                              badgeStyle = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/35";
                              iconLabel = "🍽️";
                            } else if (emp.post === 'Packaging & Branding Executive') {
                              badgeStyle = "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/35";
                              iconLabel = "🎁";
                            } else if (emp.post === 'Delivery Executive (Boys\' Hostel)') {
                              badgeStyle = "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/35";
                              iconLabel = "🏍️";
                            } else if (emp.post === 'Delivery Executive (Girls\' Hostel)') {
                              badgeStyle = "bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-900/35";
                              iconLabel = "🌸";
                            }

                            const empCampus = campuses.find(c => c.id === emp.campusId);
                            
                            if (editingEmployeeId === emp.id) {
                              return (
                                <div 
                                  key={emp.id}
                                  className="bg-purple-50/40 dark:bg-[#1a0c0e]/80 rounded-2xl border-2 border-purple-400 p-4 space-y-3 shadow-md transition-colors"
                                >
                                  <div className="flex justify-between items-center border-b border-purple-100 dark:border-[#2b1215] pb-2 mb-1">
                                    <h5 className="font-extrabold text-xs text-purple-900 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                                      <span>⚙️ Edit Employee Rates:</span> <span className="text-gray-900 dark:text-white normal-case font-black">{emp.name}</span>
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => setEditingEmployeeId(null)}
                                      className="text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-[#fafafa] uppercase cursor-pointer"
                                    >
                                      cancel
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="pl-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Post Designation</label>
                                      <select 
                                        value={editingEmployeePost}
                                        onChange={(e) => setEditingEmployeePost(e.target.value as Employee['post'])}
                                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer"
                                      >
                                        <option value="Campus Manager">Campus Manager</option>
                                        <option value="Customer Experience Executive">Customer Experience Executive</option>
                                        <option value="Packaging & Branding Executive">Packaging & Branding Executive</option>
                                        <option value="Delivery Executive (Boys' Hostel)">Delivery Executive (Boys' Hostel)</option>
                                        <option value="Delivery Executive (Girls' Hostel)">Delivery Executive (Girls' Hostel)</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="pl-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Campus Hub</label>
                                      <select 
                                        value={editingEmployeeCampusId}
                                        onChange={(e) => setEditingEmployeeCampusId(e.target.value)}
                                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer"
                                      >
                                        <option value="">Global Hub</option>
                                        {campuses.map(c => (
                                          <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="pl-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Custom Promo Code</label>
                                    <input 
                                      type="text"
                                      placeholder="e.g. CUSTOM10"
                                      value={editingPromoCode}
                                      onChange={(e) => setEditingPromoCode(e.target.value)}
                                      className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 border-t border-purple-100/30 dark:border-[#2b1215] pt-2">
                                    <div className="space-y-1">
                                      <label className="pl-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">User Discount Type</label>
                                      <select 
                                        value={editingDiscountType}
                                        onChange={(e) => setEditingDiscountType(e.target.value as 'percentage' | 'flat')}
                                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer"
                                      >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Cash (₹)</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="pl-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Discount Value</label>
                                      <input 
                                        type="number"
                                        min="0"
                                        value={editingDiscountValue}
                                        onChange={(e) => setEditingDiscountValue(e.target.value)}
                                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="pl-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee Commission Type</label>
                                      <select 
                                        value={editingCommissionType}
                                        onChange={(e) => setEditingCommissionType(e.target.value as 'percentage' | 'flat')}
                                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer"
                                      >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Cash (₹)</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="pl-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Commission Value</label>
                                      <input 
                                        type="number"
                                        min="0"
                                        value={editingCommissionValue}
                                        onChange={(e) => setEditingCommissionValue(e.target.value)}
                                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setEditingEmployeeId(null)}
                                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-900 dark:text-zinc-300 text-[10px] font-black rounded-xl uppercase tracking-wider cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onAddEmployee?.({
                                          ...emp,
                                          post: editingEmployeePost,
                                          campusId: editingEmployeeCampusId || undefined,
                                          promoCode: editingPromoCode.trim().toUpperCase() || undefined,
                                          discountType: editingDiscountType,
                                          discountValue: Number(editingDiscountValue || 0),
                                          commissionType: editingCommissionType,
                                          commissionValue: Number(editingCommissionValue || 0),
                                        });
                                        setEditingEmployeeId(null);
                                        if (onShowToast) {
                                          onShowToast("Rates Updated", `${emp.name}'s commission and discount configuration saved successfully!`);
                                        }
                                      }}
                                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-xl uppercase tracking-wider cursor-pointer"
                                    >
                                      Save Rates
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div 
                                key={emp.id}
                                className="bg-white dark:bg-[#120709] rounded-2xl border border-gray-200 dark:border-[#3c1a1e] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-purple-200 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0 w-full">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 flex items-center justify-center text-purple-700 dark:text-purple-400 font-extrabold text-xs shrink-0 border border-purple-200/25">
                                    {initials}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="font-extrabold text-xs text-gray-900 dark:text-white truncate">{emp.name}</h5>
                                    <p className="text-[10px] text-gray-500 truncate font-semibold select-all mt-0.5">{emp.email}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle} flex items-center gap-1`}>
                                        <span>{iconLabel}</span>
                                        <span>{emp.post}</span>
                                      </span>
                                      {empCampus ? (
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-gray-50 dark:bg-black/40 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded border border-gray-150">
                                          📍 {empCampus.name}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-gray-50 dark:bg-black/40 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded border border-gray-150">
                                          🌐 Global Hub
                                        </span>
                                      )}
                                      <span className="text-[9px] text-gray-400 font-medium pl-0.5">Joined: {emp.dateJoined}</span>
                                    </div>

                                    {/* Custom QR Discount and Commission Rates display */}
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-100 dark:border-[#1a0c0e] text-[10px]">
                                      <span className="text-gray-500 dark:text-zinc-400 font-semibold">
                                        🎟️ Code: <strong className="text-purple-600 dark:text-purple-400 font-bold">{emp.promoCode || emp.id}</strong>
                                      </span>
                                      <span className="text-gray-500 dark:text-zinc-400 font-semibold">
                                        🏷️ User Discount: <strong className="text-gray-800 dark:text-gray-200 font-bold">{emp.discountValue !== undefined ? emp.discountValue : 10}{emp.discountType === 'flat' ? '₹' : '%'}</strong>
                                      </span>
                                      <span className="text-gray-500 dark:text-zinc-400 font-semibold">
                                        💰 Comm: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{emp.commissionValue !== undefined ? emp.commissionValue : 5}{emp.commissionType === 'flat' ? '₹' : '%'}</strong>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                  {deletingEmpId === emp.id ? (
                                    <div className="flex items-center gap-1.5 shrink-0 bg-red-50 dark:bg-red-950/20 p-1.5 rounded-xl border border-red-200 dark:border-red-900/40">
                                      <span className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 px-1">Sure?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteEmployee?.(emp.id);
                                          setDeletingEmpId(null);
                                          if (onShowToast) {
                                            onShowToast("Offboarding Complete", `${emp.name} has been removed from the registry.`);
                                          }
                                        }}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black rounded-lg uppercase tracking-wider cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeletingEmpId(null)}
                                        className="px-2 py-1 bg-gray-200 dark:bg-[#1a0d0f] hover:bg-gray-300 text-gray-700 dark:text-gray-300 text-[9px] font-black rounded-lg uppercase tracking-wider cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setEditingEmployeeId(emp.id);
                                          setEditingEmployeePost(emp.post);
                                          setEditingEmployeeCampusId(emp.campusId || '');
                                          setEditingPromoCode(emp.promoCode || '');
                                          setEditingDiscountType(emp.discountType || 'percentage');
                                          setEditingDiscountValue(String(emp.discountValue !== undefined ? emp.discountValue : 10));
                                          setEditingCommissionType(emp.commissionType || 'percentage');
                                          setEditingCommissionValue(String(emp.commissionValue !== undefined ? emp.commissionValue : 5));
                                        }}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-xl transition-all cursor-pointer"
                                        title="Edit Rates & Role Assignment"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      
                                      <button 
                                        type="button"
                                        onClick={() => setDeletingEmpId(emp.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                                        title="Offboard Employee & Revoke Access"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                        {employees.filter(emp => {
                          if (!emp) return false;
                          const query = (empSearch || '').toLowerCase();
                          return (
                            (emp.name || '').toLowerCase().includes(query) ||
                            (emp.email || '').toLowerCase().includes(query) ||
                            (emp.post || '').toLowerCase().includes(query)
                          );
                        }).length === 0 && (
                          <div className="p-12 text-center bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-dashed border-gray-200 dark:border-[#3c1a1e]">
                            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] font-bold uppercase tracking-widest">No matching staff found</p>
                            <p className="text-[10px] text-gray-400 mt-1">Refine your search parameters or register them on the left panel.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAdminTab === 'vendors' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Vendor Workspace Header */}
                  <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-[#E23744]/10 p-6 rounded-3xl border border-pink-500/20 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-pink-900 dark:text-pink-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-pink-600" /> Vendor Onboarding Hub
                        </h3>
                        <p className="text-xs text-pink-700/80 dark:text-pink-300/70 font-medium max-w-2xl">
                          Register brand-authorized bakers, franchise kitchens, and custom ingredient partners. Vendors can manage their campus stock and track real-time orders.
                        </p>
                      </div>
                      <div className="bg-pink-100/50 dark:bg-pink-950/40 px-4 py-2 rounded-2xl border border-pink-200/30 text-center shrink-0">
                        <span className="block text-[10px] text-pink-700 dark:text-pink-400 font-extrabold uppercase tracking-widest">Active Vendors</span>
                        <span className="text-xl font-black text-pink-950 dark:text-white">{vendors.length} Partners</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: REGISTRATION FORM */}
                    <div className="lg:col-span-5 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm">
                      <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest mb-1.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#291316] pb-2">
                        <Plus className="w-4 h-4 text-pink-600" /> Onboard New Vendor
                      </h4>
                      <p className="text-[10px] text-gray-400 mb-4 font-semibold">
                        Assign vendor privileges to any student or external email. They can log in to view orders and update item stock.
                      </p>

                      <form onSubmit={handleAddVendorSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Vendor / Partner Name</label>
                          <input 
                            type="text"
                            required
                            value={newVendorName}
                            onChange={(e) => setNewVendorName(e.target.value)}
                            placeholder="e.g. Royal Bakers or Rohit Sharma"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Address</label>
                          <input 
                            type="email"
                            required
                            value={newVendorEmail}
                            onChange={(e) => setNewVendorEmail(e.target.value)}
                            placeholder="e.g. vendor@campus-cakes.com"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Assigned Campus Jurisdiction</label>
                          <select 
                            value={newVendorCampusId}
                            onChange={(e) => setNewVendorCampusId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 cursor-pointer"
                          >
                            <option value="all" className="bg-white dark:bg-[#120709] text-gray-900 dark:text-white">All Campuses (Universal Access)</option>
                            {campuses.map(c => (
                              <option key={c.id} value={c.id} className="bg-white dark:bg-[#120709] text-gray-900 dark:text-white">{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-black text-xs rounded-xl shadow-md shadow-pink-600/10 transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
                        >
                          Register Vendor Credentials
                        </button>
                      </form>
                    </div>

                    {/* RIGHT COLUMN: ACTIVE VENDORS LIST */}
                    <div className="lg:col-span-7 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-[#291316] pb-3 mb-4">
                        <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-pink-600" /> Active Partners List
                        </h4>
                        <input 
                          type="text"
                          value={vendorSearch}
                          onChange={(e) => setVendorSearch(e.target.value)}
                          placeholder="Search partners..."
                          className="px-3 py-1.5 bg-gray-50 dark:bg-black/40 text-[11px] rounded-lg border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 max-w-xs"
                        />
                      </div>

                      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                        {vendors
                          .filter(v => {
                            if (!v) return false;
                            const query = (vendorSearch || '').toLowerCase();
                            return (
                              (v.name || '').toLowerCase().includes(query) ||
                              (v.email || '').toLowerCase().includes(query)
                            );
                          })
                          .map((v) => {
                            const campusName = v.campusId === 'all' 
                              ? 'All Campuses' 
                              : (campuses.find(c => c.id === v.campusId)?.name || 'Unknown Campus');

                            return (
                              <div key={v.id} className="p-3.5 bg-gray-50/50 dark:bg-[#1c0d0f]/20 border border-gray-100 dark:border-[#291316] rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-gray-100/50 dark:hover:bg-[#1c0d0f]/40">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-black text-xs text-gray-900 dark:text-white">{v.name}</h5>
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-100/20">
                                      {campusName}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 font-mono">{v.email}</p>
                                  <p className="text-[9px] text-gray-400">Onboarded: {v.dateRegistered}</p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {deletingVendorId === v.id ? (
                                    <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded-xl border border-rose-100/30">
                                      <span className="text-[9px] text-rose-600 font-black uppercase tracking-wider px-1">Revoke?</span>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          onDeleteVendor?.(v.id);
                                          setDeletingVendorId(null);
                                          if (onShowToast) {
                                            onShowToast("Vendor Offboarded", `Access revoked for ${v.name}.`);
                                          }
                                        }}
                                        className="px-2 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setDeletingVendorId(null)}
                                        className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-[9px] font-black rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      type="button"
                                      onClick={() => setDeletingVendorId(v.id)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                                      title="Revoke Vendor Access"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                        {vendors.filter(v => {
                          if (!v) return false;
                          const query = (vendorSearch || '').toLowerCase();
                          return (
                            (v.name || '').toLowerCase().includes(query) ||
                            (v.email || '').toLowerCase().includes(query)
                          );
                        }).length === 0 && (
                          <div className="p-12 text-center bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-dashed border-gray-200 dark:border-[#3c1a1e]">
                            <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] font-bold uppercase tracking-widest">No matching partners found</p>
                            <p className="text-[10px] text-gray-400 mt-1">Refine your search parameters or register them on the left panel.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAdminTab === 'gifts' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Gifts Manager Header */}
                  <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 p-6 rounded-3xl border border-pink-500/20 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-pink-900 dark:text-pink-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Gift className="w-5 h-5 text-pink-600" /> Gifts Gallery Manager
                        </h3>
                        <p className="text-xs text-pink-700/80 dark:text-pink-300/70 font-medium max-w-2xl">
                          Add, edit, or remove companion gift items displayed in the student gifts gallery and pre-order add-on selections.
                        </p>
                      </div>
                      <div className="bg-pink-100/50 dark:bg-pink-950/40 px-4 py-2 rounded-2xl border border-pink-200/30 text-center shrink-0">
                        <span className="block text-[10px] text-pink-700 dark:text-pink-400 font-extrabold uppercase tracking-widest">Active Gifts</span>
                        <span className="text-xl font-black text-pink-950 dark:text-white">{gifts.length} Items</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: ADD/EDIT FORM */}
                    <div className="lg:col-span-5 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#291316] pb-2">
                        <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                          {editingGiftItem ? <Edit className="w-4 h-4 text-pink-600" /> : <Plus className="w-4 h-4 text-pink-600" />} 
                          {editingGiftItem ? 'Edit Gift Item' : 'Add New Gift Item'}
                        </h4>
                        {editingGiftItem && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGiftItem(null);
                              setGiftName('');
                              setGiftPrice('');
                              setGiftCategory('Flowers');
                              setGiftRating('4.8');
                              setGiftImage('');
                              setGiftDescription('');
                            }}
                            className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel Edit
                          </button>
                        )}
                      </div>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!giftName || !giftPrice || !giftImage) return;

                          const giftObj: GiftItem = {
                            id: editingGiftItem ? editingGiftItem.id : `gift-${Date.now()}`,
                            name: giftName,
                            price: Number(giftPrice) || 199,
                            category: giftCategory,
                            rating: Number(giftRating) || 4.8,
                            image: giftImage,
                            description: giftDescription || 'Special companion gift item.',
                          };

                          onAddGift?.(giftObj);
                          if (onShowToast) {
                            onShowToast(
                              editingGiftItem ? "Gift Updated" : "Gift Added", 
                              `"${giftName}" is now active in the gifts catalog.`
                            );
                          }

                          // Reset
                          setEditingGiftItem(null);
                          setGiftName('');
                          setGiftPrice('');
                          setGiftCategory('Flowers');
                          setGiftRating('4.8');
                          setGiftImage('');
                          setGiftDescription('');
                        }} 
                        className="space-y-3.5"
                      >
                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Gift Title / Name</label>
                          <input 
                            type="text"
                            required
                            value={giftName}
                            onChange={(e) => setGiftName(e.target.value)}
                            placeholder="e.g. Royal Red Rose Bouquet"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Price (₹)</label>
                            <input 
                              type="number"
                              required
                              min="0"
                              value={giftPrice}
                              onChange={(e) => setGiftPrice(e.target.value)}
                              placeholder="e.g. 299"
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rating (1-5)</label>
                            <input 
                              type="number"
                              step="0.1"
                              min="1"
                              max="5"
                              value={giftRating}
                              onChange={(e) => setGiftRating(e.target.value)}
                              placeholder="4.8"
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Category</label>
                          <select
                            value={giftCategory}
                            onChange={(e) => setGiftCategory(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                          >
                            <option value="Flowers">Flowers</option>
                            <option value="Chocolates">Chocolates</option>
                            <option value="Cards">Cards</option>
                            <option value="Toys">Toys</option>
                            <option value="Decorations">Decorations</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Image URL</label>
                          <input 
                            type="url"
                            required
                            value={giftImage}
                            onChange={(e) => setGiftImage(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="pl-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Short Description</label>
                          <textarea
                            rows={2}
                            value={giftDescription}
                            onChange={(e) => setGiftDescription(e.target.value)}
                            placeholder="Brief description of the gift..."
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-98 cursor-pointer mt-2"
                        >
                          {editingGiftItem ? 'Save Gift Changes' : 'Publish Gift Item'}
                        </button>
                      </form>
                    </div>

                    {/* RIGHT COLUMN: ACTIVE GIFTS LIST */}
                    <div className="lg:col-span-7 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-[#291316] pb-3">
                        <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-pink-600" /> Current Gifts Gallery ({gifts.length})
                        </h4>
                        
                        <input 
                          type="text"
                          value={giftSearch}
                          onChange={(e) => setGiftSearch(e.target.value)}
                          placeholder="Search gifts..."
                          className="px-3 py-1.5 bg-gray-50 dark:bg-black/40 text-xs rounded-xl border border-gray-200 dark:border-[#3c1a1e] text-gray-800 dark:text-white font-bold focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                        {gifts
                          .filter(g => g.name.toLowerCase().includes(giftSearch.toLowerCase()) || g.category.toLowerCase().includes(giftSearch.toLowerCase()))
                          .map((g) => (
                            <div 
                              key={g.id}
                              className="bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl p-3 border border-gray-200 dark:border-[#3c1a1e] flex flex-col justify-between space-y-2 group hover:border-pink-300 transition-colors"
                            >
                              <div className="flex gap-3">
                                <img 
                                  src={g.image} 
                                  alt={g.name}
                                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-zinc-800"
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-black uppercase text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/40 px-1.5 py-0.5 rounded-full inline-block mb-1">
                                    {g.category}
                                  </span>
                                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-white truncate">{g.name}</h5>
                                  <p className="text-xs font-black text-pink-600 dark:text-pink-400 mt-0.5">₹{g.price}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {g.rating}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-200/60 dark:border-zinc-800/60">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGiftItem(g);
                                    setGiftName(g.name);
                                    setGiftPrice(g.price.toString());
                                    setGiftCategory(g.category);
                                    setGiftRating((g.rating || 4.8).toString());
                                    setGiftImage(g.image);
                                    setGiftDescription(g.description || '');
                                  }}
                                  className="px-2.5 py-1 bg-gray-200 dark:bg-zinc-800 hover:bg-pink-100 dark:hover:bg-pink-950/40 text-gray-700 dark:text-gray-300 hover:text-pink-600 text-[10px] font-extrabold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit className="w-3 h-3" /> Edit
                                </button>

                                {deletingGiftId === g.id ? (
                                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 p-1 rounded-lg border border-rose-100/30">
                                    <span className="text-[9px] text-rose-600 font-black uppercase px-1">Delete?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteGift?.(g.id);
                                        setDeletingGiftId(null);
                                        if (onShowToast) {
                                          onShowToast("Gift Deleted", `"${g.name}" removed from gallery.`);
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded hover:bg-red-700 transition-colors cursor-pointer"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingGiftId(null)}
                                      className="px-2 py-0.5 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-[9px] font-black rounded hover:bg-gray-300 transition-colors cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingGiftId(g.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Gift Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                        {gifts.filter(g => g.name.toLowerCase().includes(giftSearch.toLowerCase()) || g.category.toLowerCase().includes(giftSearch.toLowerCase())).length === 0 && (
                          <div className="col-span-2 p-8 text-center bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-dashed border-gray-200 dark:border-[#3c1a1e]">
                            <Gift className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] font-bold uppercase tracking-widest">No gifts found</p>
                            <p className="text-[10px] text-gray-400 mt-1">Add a new gift using the form on the left.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

                </div>
              </div>

            </motion.div>
          )}

          {/* 3. EMPLOYEE DASHBOARD CONTENT */}
          {activeTab === 'employee' && currentEmployee && (
            <motion.div
              key="employee-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 animate-fade-in"
            >
              {/* Header Profile Badge */}
              <div className="bg-gradient-to-r from-purple-500/10 via-[#AF2430]/10 to-[#C49A25]/10 p-6 rounded-3xl border border-purple-500/20 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md border border-white/20">
                      {currentEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                          {currentEmployee.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/20">
                          Staff Account
                        </span>
                      </div>
                      <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-semibold mt-0.5">
                        Role: {currentEmployee.post} • Connected: {currentEmployee.email}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/30 px-4 py-2 rounded-2xl border border-[#D4AF37]/20 shrink-0">
                    <span className="block text-[9px] text-[#C49A25] font-extrabold uppercase tracking-widest">Commission Settings</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {currentEmployee.commissionValue !== undefined ? `${currentEmployee.commissionValue}${currentEmployee.commissionType === 'percentage' ? '%' : ' Rs Flat'}` : '5% Referrals'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Referral Analytics Stats Cards */}
              {(() => {
                const referredOrders = orders.filter(o => o.employeeReferral === currentEmployee.id);
                const totalCommission = referredOrders.reduce((acc, o) => acc + (o.employeeCommission || 0), 0);
                const totalSales = referredOrders.reduce((acc, o) => acc + o.subtotal, 0);
                let resolvedBaseUrl = window.location.origin;
                if (qrBaseUrlType === 'production' && window.location.origin.includes('ais-dev-')) {
                  resolvedBaseUrl = window.location.origin.replace('ais-dev-', 'ais-pre-');
                } else if (qrBaseUrlType === 'custom' && customQrBaseUrl.trim()) {
                  resolvedBaseUrl = customQrBaseUrl.trim();
                  if (!resolvedBaseUrl.startsWith('http://') && !resolvedBaseUrl.startsWith('https://')) {
                    resolvedBaseUrl = 'https://' + resolvedBaseUrl;
                  }
                }
                const refUrl = `${resolvedBaseUrl}${resolvedBaseUrl.endsWith('/') ? '' : '/'}?ref=${currentEmployee.promoCode || currentEmployee.id}`;

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Commissions Earned Card */}
                      <div className="bg-[#FAF6F0] dark:bg-[#120708] border border-[#D4AF37]/25 dark:border-[#3C2216] p-5 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider block mb-1">Total Payout</span>
                            <h4 className="text-2xl font-black font-mono text-[#C49A25] dark:text-[#D4AF37]">₹{totalCommission}</h4>
                          </div>
                          <div className="p-2 bg-amber-100 dark:bg-amber-950/20 rounded-xl text-amber-600">
                            <IndianRupee className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#D4AF37]/10 flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 font-semibold">Live Earned Surcharges</span>
                          <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Fully Synced
                          </span>
                        </div>
                      </div>

                      {/* Total Referred Orders */}
                      <div className="bg-white dark:bg-[#120709] border border-gray-100 dark:border-[#291316] p-5 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider block mb-1">Referral Sales</span>
                            <h4 className="text-2xl font-black font-mono text-zinc-800 dark:text-white">{referredOrders.length} Orders</h4>
                          </div>
                          <div className="p-2 bg-purple-100 dark:bg-purple-950/20 rounded-xl text-purple-600">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#291316] flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 font-semibold">Scanned Discount Conversions</span>
                          <span className="text-[10px] text-zinc-650 dark:text-zinc-300 font-bold">₹{totalSales} Volume</span>
                        </div>
                      </div>

                      {/* Your Unique Promo Code */}
                      <div className="bg-white dark:bg-[#120709] border border-gray-100 dark:border-[#291316] p-5 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider block mb-1">Your Promo Code</span>
                            <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight font-display select-all">{currentEmployee.promoCode || currentEmployee.id}</h4>
                          </div>
                          <div className="p-2 bg-pink-100 dark:bg-pink-950/20 rounded-xl text-pink-600">
                            <Tag className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#291316] flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 font-semibold">Active Customer Reward</span>
                          <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                            {currentEmployee.discountValue !== undefined ? `${currentEmployee.discountValue}${currentEmployee.discountType === 'percentage' ? '%' : ' Rs Flat'} off` : '10% OFF'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code and Sharing Actions Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5 bg-gradient-to-tr from-purple-500/5 to-[#AF2430]/5 rounded-3xl border border-purple-500/15 p-6 shadow-sm flex flex-col items-center justify-center text-center bg-white dark:bg-[#120709]">
                        <span className="text-[9px] font-black tracking-[0.2em] bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full uppercase mb-4 font-display">
                          Scan to Order & Get Discount
                        </span>
                        
                        {/* QR Code Container */}
                        <div className="bg-white p-3.5 rounded-2xl shadow-md border border-gray-150 inline-block">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(refUrl)}`}
                            className="w-44 h-44 object-contain"
                            alt="Referral QR Code"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="mt-4 space-y-1">
                          <p className="text-xs font-black text-gray-900 dark:text-white">Your Ambassador QR Code</p>
                          <p className="text-[10px] text-gray-400 font-medium px-4">
                            Students who order via your QR code instantly receive an ambassador discount. You earn commission on their total subtotal!
                          </p>
                        </div>

                        <div className="mt-5 w-full flex flex-col sm:flex-row gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(refUrl);
                              if (onShowToast) {
                                onShowToast("Copied!", "Your dynamic referral URL is copied to clipboard.");
                              } else {
                                alert("Link Copied!");
                              }
                            }}
                            className="flex-1 py-2 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Copy Link
                          </button>
                          <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(refUrl)}`}
                            download={`referral-${currentEmployee.promoCode || currentEmployee.id}-qr.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3.5 bg-white hover:bg-gray-50 dark:bg-[#120709] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Save Image
                          </a>
                        </div>

                        {/* Dynamic QR target configurations */}
                        <div className="mt-5 pt-4 border-t border-gray-150 dark:border-zinc-800 w-full text-left space-y-2">
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                            ⚙️ QR Target Link Settings
                          </span>
                          
                          <div className="grid grid-cols-2 gap-1 bg-gray-50 dark:bg-[#1a0d0f] p-1 rounded-xl border border-gray-150 dark:border-[#291316]">
                            <button
                              type="button"
                              onClick={() => {
                                setQrBaseUrlType('production');
                                safeStorage.setItem('cc_qr_base_url_type', 'production');
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                qrBaseUrlType === 'production'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'
                              }`}
                            >
                              Live Website
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQrBaseUrlType('custom');
                                safeStorage.setItem('cc_qr_base_url_type', 'custom');
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                qrBaseUrlType === 'custom'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'
                              }`}
                            >
                              Custom Domain
                            </button>
                          </div>

                          {qrBaseUrlType === 'production' && (
                            <div className="p-2 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100/50 dark:border-purple-900/30 text-[9px] text-purple-700 dark:text-purple-300 font-medium">
                              {window.location.origin.includes('ais-dev-') ? (
                                <p>
                                  <strong>Automatic Rewrite:</strong> Currently in editor view. We automatically rewrite the link to your public Shared/Preview Application URL (<code className="font-mono bg-purple-100/80 dark:bg-purple-950 px-1 py-0.5 rounded text-purple-800 dark:text-purple-200">ais-pre-</code>) so customers can order directly from their mobile phones!
                                </p>
                              ) : (
                                <p>
                                  QR codes point to your live site domain: <code className="font-mono bg-purple-100/80 dark:bg-purple-950 px-1 py-0.5 rounded text-purple-800 dark:text-purple-200">{resolvedBaseUrl}</code>
                                </p>
                              )}
                            </div>
                          )}

                          {qrBaseUrlType === 'custom' && (
                            <div className="space-y-1.5 animate-fade-in">
                              <input
                                type="text"
                                placeholder="e.g. mycampuscakes.com"
                                value={customQrBaseUrl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomQrBaseUrl(val);
                                  safeStorage.setItem('cc_custom_qr_base_url', val);
                                }}
                                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#1a0d0f] text-[11px] rounded-lg border border-gray-200 dark:border-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-800 dark:text-[#fafafa] font-bold placeholder-gray-400"
                              />
                              <p className="text-[9px] text-gray-400">
                                Enter your custom website address. The referral parameter <code className="font-mono text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1 py-0.5 rounded">?ref={currentEmployee.promoCode || currentEmployee.id}</code> will be added automatically.
                              </p>
                            </div>
                          )}

                          <div className="mt-1 flex flex-col gap-0.5 text-[9px] text-gray-400 dark:text-zinc-500 break-all select-all font-mono p-1.5 bg-gray-50 dark:bg-[#1a0d0f]/50 border border-gray-150 dark:border-[#291316] rounded-lg">
                            <span className="shrink-0 font-sans font-black text-gray-400 uppercase tracking-wider text-[8px]">Current QR Target URL:</span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold">{refUrl}</span>
                          </div>
                        </div>
                      </div>

                      {/* Referred Orders Ledger table */}
                      <div className="lg:col-span-7 bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest mb-1.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#291316] pb-2">
                            <BarChart2 className="w-4 h-4 text-purple-600" /> Referred Orders History
                          </h4>
                          
                          <div className="overflow-x-auto text-gray-900 dark:text-white">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-gray-150 dark:border-[#291316] text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">
                                  <th className="py-2.5 pl-1">Order ID</th>
                                  <th className="py-2.5">Date</th>
                                  <th className="py-2.5">Amt (Sub)</th>
                                  <th className="py-2.5 text-right">Commission</th>
                                  <th className="py-2.5 text-right pr-1">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-[#1c0a0c]">
                                {referredOrders.map(order => {
                                  let statusColor = "bg-gray-100 text-gray-600";
                                  if (order.status === 'placed') statusColor = "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";
                                  else if (order.status === 'preparing') statusColor = "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
                                  else if (order.status === 'delivery') statusColor = "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
                                  else if (order.status === 'ready') statusColor = "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
                                  else if (order.status === 'completed') statusColor = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold";
                                  
                                  return (
                                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-[#150a0c]/50">
                                      <td className="py-3 pl-1 font-mono font-black text-[#C49A25]">{order.id}</td>
                                      <td className="py-3 text-[11px] text-gray-500 dark:text-zinc-400 font-medium">{order.date}</td>
                                      <td className="py-3 font-mono font-bold text-gray-800 dark:text-zinc-200">₹{order.subtotal}</td>
                                      <td className="py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                        +₹{order.employeeCommission || 0}
                                      </td>
                                      <td className="py-3 text-right pr-1">
                                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${statusColor}`}>
                                          {order.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {referredOrders.length === 0 && (
                            <div className="p-10 text-center bg-gray-50 dark:bg-[#1a0d0f]/50 rounded-2xl border border-dashed border-gray-150 mt-4">
                              <QrCode className="w-8 h-8 text-zinc-350 mx-auto mb-2" />
                              <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">No referred transactions yet</p>
                              <p className="text-[10px] text-zinc-400 mt-1 max-w-sm mx-auto">
                                Share your dynamic URL or print your QR code. Once students use it to place an order, it will appear here instantly!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role-Specific Employee Workspace */}
                    <div className="mt-8 space-y-8">
                      {/* 1. CAMPUS MANAGER WORKSPACE */}
                      {currentEmployee.post === 'Campus Manager' && (
                        <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-6 shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-[#291316] pb-4">
                            <div>
                              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Truck className="w-5 h-5 text-purple-600" /> Campus Manager: Bakery Pickups
                              </h4>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                Pick up the prepared orders from the vendor's bakery and bring them safely to the campus stall or headquarters.
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-black rounded-xl border border-purple-150 shrink-0 w-fit">
                              {orders.filter(o => (o.assignedManagerId === currentEmployee.id || o.assignedEmployeeId === currentEmployee.id) && o.status === 'prepared').length} Pending Pickups
                            </span>
                          </div>

                          {(() => {
                            const managerPickups = orders.filter(o => o.assignedManagerId === currentEmployee.id || o.assignedEmployeeId === currentEmployee.id);
                            if (managerPickups.length === 0) {
                              return (
                                <div className="p-12 text-center bg-gray-50 dark:bg-[#1a0d0f]/50 rounded-2xl border border-dashed border-gray-150">
                                  <Truck className="w-10 h-10 text-zinc-350 mx-auto mb-2" />
                                  <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">No assigned pickups right now</p>
                                  <p className="text-[10px] text-zinc-400 mt-1 max-w-sm mx-auto">
                                    Once the administrator assigns you to pick up an order from the vendor's bakery, it will appear here instantly!
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {managerPickups.map(order => {
                                  const campusName = campuses?.find(c => c.id === order.campusId)?.name || 'Unknown Campus';
                                  
                                  let statusLabel: string = order.status;
                                  let statusBadgeStyle = "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300";
                                  
                                  if (order.status === 'prepared') {
                                    statusLabel = "At Vendor Bakery (Needs Pickup)";
                                    statusBadgeStyle = "bg-orange-50 text-orange-600 dark:bg-orange-950/45 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 font-black";
                                  } else if (order.status === 'ready') {
                                    statusLabel = "Delivered to Stall (Ready for Packing)";
                                    statusBadgeStyle = "bg-purple-50 text-purple-600 dark:bg-purple-950/45 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30";
                                  } else if (order.status === 'delivery') {
                                    statusLabel = "Out for Hostel Delivery";
                                    statusBadgeStyle = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/45 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30";
                                  } else if (order.status === 'completed') {
                                    statusLabel = "Completed";
                                    statusBadgeStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-black";
                                  }

                                  return (
                                    <div 
                                      key={order.id}
                                      className="bg-white dark:bg-[#150a0c]/40 border border-gray-150 dark:border-[#291316] rounded-2xl p-5 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                                    >
                                      {/* ID & Status */}
                                      <div className="space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider block">Order ID</span>
                                            <span className="font-mono font-black text-sm text-[#C49A25]">#{order.id}</span>
                                          </div>
                                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${statusBadgeStyle}`}>
                                            {statusLabel}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Specifications */}
                                      <div className="bg-gray-50/50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-zinc-900 text-xs space-y-1.5">
                                        <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Items to Pick Up:</span>
                                        {order.items.map((item, idx) => (
                                          <div key={idx} className="font-bold text-gray-800 dark:text-zinc-200">
                                            • {item.name} <span className="text-purple-600 font-extrabold font-mono">x{item.quantity}</span>
                                            {item.customization?.weight && <span className="text-[10px] text-gray-400 font-medium ml-1">({item.customization.weight} kg/lbs)</span>}
                                            {item.customization?.flavor && <span className="text-[10px] text-gray-400 font-medium ml-1">[{item.customization.flavor}]</span>}
                                          </div>
                                        ))}
                                      </div>

                                      {/* Actions */}
                                      <div className="border-t border-gray-100 dark:border-zinc-800/60 pt-3 flex items-center justify-between gap-3">
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Stall: {campusName}</span>
                                        {order.status === 'prepared' ? (
                                          <button
                                            type="button"
                                            onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                                            className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                                          >
                                            📦 Delivered to Stall
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-black uppercase flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded-lg">
                                            ✓ Picked Up
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* 2. PACKAGING AND BRANDING EXECUTIVE WORKSPACE */}
                      {currentEmployee.post === 'Packaging & Branding Executive' && (
                        <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-6 shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-[#291316] pb-4">
                            <div>
                              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-5 h-5 text-pink-600" /> Packaging & Branding Desk
                              </h4>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                Pack the picked-up orders beautifully with custom branding, boxes, cards, and ribbon decorations.
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-black rounded-xl border border-pink-150 shrink-0 w-fit">
                              {orders.filter(o => o.status === 'ready' && !o.isPacked).length} Unpacked Orders
                            </span>
                          </div>

                          {(() => {
                            const packableOrders = orders.filter(o => o.status === 'ready');
                            if (packableOrders.length === 0) {
                              return (
                                <div className="p-12 text-center bg-gray-50 dark:bg-[#1a0d0f]/50 rounded-2xl border border-dashed border-gray-150">
                                  <Package className="w-10 h-10 text-zinc-350 mx-auto mb-2" />
                                  <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">No orders waiting for packaging</p>
                                  <p className="text-[10px] text-zinc-400 mt-1 max-w-sm mx-auto">
                                    Once Campus Managers deliver bakery-fresh cakes to your campus stall, they will show up here immediately to pack!
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {packableOrders.map(order => {
                                  return (
                                    <div 
                                      key={order.id}
                                      className="bg-white dark:bg-[#150a0c]/40 border border-gray-150 dark:border-[#291316] rounded-2xl p-5 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                                    >
                                      {/* ID & Status */}
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono font-black text-sm text-[#C49A25]">#{order.id}</span>
                                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${order.isPacked ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                            {order.isPacked ? 'Packed & Branded' : 'Awaiting Packaging'}
                                          </span>
                                        </div>
                                        {order.isPacked && (
                                          <p className="text-[9px] text-emerald-600 font-bold">
                                            Packed by {order.packedByEmployeeName || 'Staff'}
                                          </p>
                                        )}
                                      </div>

                                      {/* Items details */}
                                      <div className="bg-gray-50/50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-zinc-900 text-xs space-y-2">
                                        {order.items.map((item, idx) => (
                                          <div key={idx} className="font-bold text-gray-800 dark:text-zinc-200">
                                            • {item.quantity}x {item.name}
                                            {item.customization && (
                                              <div className="pl-2 border-l border-pink-200 text-[10px] text-zinc-500 font-medium space-y-0.5 mt-0.5">
                                                {item.customization.flavor && <p>Flavor: {item.customization.flavor}</p>}
                                                {item.customization.messageOnCake && <p>Message: "{item.customization.messageOnCake}"</p>}
                                                {item.customization.specialInstructions && <p>Instructions: {item.customization.specialInstructions}</p>}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>

                                      {/* Actions */}
                                      <div className="border-t border-gray-100 dark:border-zinc-800/60 pt-3 flex items-center justify-end">
                                        {!order.isPacked ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (onUpdateOrder) {
                                                onUpdateOrder({
                                                  ...order,
                                                  isPacked: true,
                                                  packedByEmployeeId: currentEmployee.id,
                                                  packedByEmployeeName: currentEmployee.name,
                                                  packedAt: new Date().toISOString()
                                                });
                                              }
                                            }}
                                            className="py-1.5 px-3 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                                          >
                                            🎀 Mark as Packed & Branded
                                          </button>
                                        ) : (
                                          <div className="text-[10px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-100">
                                            ✓ Ready for Delivery Executive
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* 3. DELIVERY EXECUTIVE WORKSPACE */}
                      {currentEmployee.post.startsWith('Delivery Executive') && (
                        <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-6 shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-[#291316] pb-4">
                            <div>
                              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Bike className="w-5 h-5 text-emerald-600" /> Delivery Desk: Hostel Deliveries
                              </h4>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                Deliver premium cakes directly to the students' hostels. Deliveries only appear here once packed by our Packaging Team.
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-xl border border-emerald-150 shrink-0 w-fit">
                              {orders.filter(o => o.assignedDeliveryId === currentEmployee.id && o.isPacked && o.status !== 'completed').length} Active Deliveries
                            </span>
                          </div>

                          {(() => {
                            // Only show assigned order pickups when packed by packaging and branding executive
                            const deliveryOrders = orders.filter(o => o.assignedDeliveryId === currentEmployee.id && o.isPacked);
                            if (deliveryOrders.length === 0) {
                              return (
                                <div className="p-12 text-center bg-gray-50 dark:bg-[#1a0d0f]/50 rounded-2xl border border-dashed border-gray-150">
                                  <Bike className="w-10 h-10 text-zinc-350 mx-auto mb-2" />
                                  <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">No packed deliveries assigned</p>
                                  <p className="text-[10px] text-zinc-400 mt-1 max-w-sm mx-auto">
                                    Your assigned deliveries will populate here once they have been securely packed & branded by our packing desk!
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {deliveryOrders.map(order => {
                                  const campusName = campuses?.find(c => c.id === order.campusId)?.name || 'Unknown Campus';
                                  
                                  let statusLabel: string = order.status;
                                  let statusBadgeStyle = "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300";
                                  
                                  if (order.status === 'ready') {
                                    statusLabel = "At Stall (Ready for Delivery)";
                                    statusBadgeStyle = "bg-purple-50 text-purple-600 dark:bg-purple-950/45 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 font-extrabold";
                                  } else if (order.status === 'delivery') {
                                    statusLabel = "Out for Hostel Delivery";
                                    statusBadgeStyle = "bg-amber-50 text-amber-600 dark:bg-amber-950/45 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse";
                                  } else if (order.status === 'completed') {
                                    statusLabel = "Completed & Delivered";
                                    statusBadgeStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-black";
                                  }

                                  return (
                                    <div 
                                      key={order.id}
                                      className="bg-white dark:bg-[#150a0c]/40 border border-gray-150 dark:border-[#291316] rounded-2xl p-5 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                                    >
                                      {/* Top Row */}
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono font-black text-sm text-[#C49A25]">#{order.id}</span>
                                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${statusBadgeStyle}`}>
                                            {statusLabel}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium">Recipient: {order.customerName}</p>
                                      </div>

                                      {/* Delivery address & Phone */}
                                      <div className="space-y-1 bg-gray-50/50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 text-xs">
                                        <p><strong>Campus:</strong> {campusName}</p>
                                        <p><strong>Hostel Address:</strong> {order.deliveryAddress || 'No address specified'}</p>
                                        {order.customerPhone && (
                                          <a 
                                            href={`tel:${order.customerPhone}`}
                                            className="text-[10px] font-black text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1 hover:underline"
                                          >
                                            <Phone className="w-3 h-3" /> {order.customerPhone}
                                          </a>
                                        )}
                                      </div>

                                      {/* Action buttons */}
                                      <div className="border-t border-gray-100 dark:border-zinc-800/60 pt-3 flex items-center justify-end gap-2">
                                        {order.status === 'ready' && (
                                          <button
                                            type="button"
                                            onClick={() => onUpdateOrderStatus(order.id, 'delivery')}
                                            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                          >
                                            🚴 Start Delivery
                                          </button>
                                        )}
                                        {order.status === 'delivery' && (
                                          <button
                                            type="button"
                                            onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                          >
                                            ✓ Mark as Delivered
                                          </button>
                                        )}
                                        {order.status === 'completed' && (
                                          <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                                            ✓ Completed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* 4. VENDOR WORKSPACE CONTENT */}
          {activeTab === 'vendor' && currentVendor && (
            <motion.div
              key="vendor-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 animate-fade-in"
            >
              {/* Header Profile Badge */}
              <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-[#E23744]/10 p-6 rounded-3xl border border-pink-500/20 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md border border-white/20">
                      {currentVendor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                          {currentVendor.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-100 dark:bg-pink-950/40 text-pink-750 dark:text-pink-400 border border-pink-200/20">
                          Authorized Vendor Account
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                        Jurisdiction: <span className="font-bold text-pink-600 dark:text-pink-400">{currentVendor.campusId === 'all' ? 'All Campuses (Universal Access)' : (campuses.find(c => c.id === currentVendor.campusId)?.name || 'Specified Campus')}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">Logged in: {currentVendor.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveVendorSubTab('inventory')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeVendorSubTab === 'inventory' 
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/15' 
                          : 'bg-white dark:bg-[#120709] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3c1a1e] hover:bg-gray-50'
                      }`}
                    >
                      Inventory & Stock
                    </button>
                    <button
                      onClick={() => setActiveVendorSubTab('orders')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeVendorSubTab === 'orders' 
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/15' 
                          : 'bg-white dark:bg-[#120709] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3c1a1e] hover:bg-gray-50'
                      }`}
                    >
                      Campus Orders
                    </button>
                  </div>
                </div>
              </div>

              {/* A. SUB-TAB: INVENTORY */}
              {activeVendorSubTab === 'inventory' && (
                <div className="space-y-6">
                  {/* Kiosk Stock Section */}
                  <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm">
                    <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest mb-1.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#291316] pb-2">
                      <Package className="w-4 h-4 text-pink-600" /> Kiosk Fridge Inventory Management
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-4 font-semibold">
                      Edit the live stock quantities available in physical fridge kiosks on campus. Changes are updated instantly for ordering.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {kioskInventory
                        .filter(item => !currentVendor || currentVendor.campusId === 'all' || (item?.campusIds && Array.isArray(item.campusIds) && item.campusIds.includes(currentVendor.campusId)))
                        .map(item => {
                          const itemCampusNames = item.campusIds?.map(cid => campuses.find(c => c.id === cid)?.name || cid).join(', ') || 'Global';
                          return (
                            <div key={item.id} className="p-4 bg-gray-50/50 dark:bg-[#1c0d0f]/20 border border-gray-150 dark:border-[#291316] rounded-2xl flex flex-col justify-between gap-4">
                              <div className="flex items-start gap-3">
                                {item.image && (
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100" 
                                  />
                                )}
                                <div>
                                  <h5 className="font-black text-xs text-gray-900 dark:text-white leading-tight">{item.name}</h5>
                                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">₹{item.price}</p>
                                  <p className="text-[9px] text-gray-400 mt-0.5">Campuses: {itemCampusNames}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#291316] pt-3">
                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Stock Qty:</span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => onUpdateKioskStock(item.id, Math.max(0, item.remainingStock - 1))}
                                    className="w-6 h-6 bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-xs font-black text-gray-600 hover:bg-gray-100 active:scale-95 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input 
                                    type="number"
                                    min="0"
                                    value={item.remainingStock}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      onUpdateKioskStock(item.id, isNaN(val) ? 0 : Math.max(0, val));
                                    }}
                                    className="w-12 h-6 text-center font-mono text-xs font-black text-gray-900 dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button 
                                    onClick={() => onUpdateKioskStock(item.id, item.remainingStock + 1)}
                                    className="w-6 h-6 bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-xs font-black text-gray-600 hover:bg-gray-100 active:scale-95 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {kioskInventory.filter(item => !currentVendor || currentVendor.campusId === 'all' || (item?.campusIds && Array.isArray(item.campusIds) && item.campusIds.includes(currentVendor.campusId))).length === 0 && (
                        <div className="col-span-full p-8 text-center text-gray-400 text-xs font-bold bg-gray-50 rounded-2xl">
                          No kiosk products assigned to your campus.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pre-Order Catalog Customization */}
                  <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm">
                    <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest mb-1.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#291316] pb-2">
                      <ShoppingBag className="w-4 h-4 text-pink-600" /> Catalog Availability
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-4 font-semibold">
                      Control which artisan pre-order cakes are active and purchasable for your campus hub.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allCakes.map(cake => {
                        const isCurrentlyActive = !currentVendor || currentVendor.campusId === 'all' || (cake?.campusIds && Array.isArray(cake.campusIds) && cake.campusIds.includes(currentVendor.campusId));
                        
                        return (
                          <div key={cake.id} className="p-4 bg-gray-50/50 dark:bg-[#1c0d0f]/20 border border-gray-150 dark:border-[#291316] rounded-2xl flex flex-col justify-between gap-4">
                            <div className="flex items-start gap-3">
                              {cake.image && (
                                <img 
                                  src={cake.image} 
                                  alt={cake.name} 
                                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100" 
                                />
                              )}
                              <div>
                                <h5 className="font-black text-xs text-gray-900 dark:text-white leading-tight">{cake.name}</h5>
                                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">₹{cake.price}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#291316] pt-3">
                              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Status:</span>
                              {currentVendor.campusId === 'all' ? (
                                <span className="text-[9px] uppercase font-black text-emerald-600 font-extrabold">Global Admin</span>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const currentIds = cake.campusIds || [];
                                    const nextIds = isCurrentlyActive 
                                      ? currentIds.filter(id => id !== currentVendor.campusId)
                                      : [...currentIds, currentVendor.campusId];
                                    onEditCustomCake?.({ ...cake, campusIds: nextIds });
                                    if (onShowToast) {
                                      onShowToast("Catalog Status Changed", `${cake.name} is now ${isCurrentlyActive ? 'inactive' : 'active'} for your campus!`);
                                    }
                                  }}
                                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                                    isCurrentlyActive 
                                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                      : 'bg-gray-100 text-gray-650 hover:bg-gray-200'
                                  }`}
                                >
                                  {isCurrentlyActive ? 'Active' : 'Disabled'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* B. SUB-TAB: ORDERS */}
              {activeVendorSubTab === 'orders' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#120709] rounded-3xl border border-gray-200 dark:border-[#3c1a1e] p-5 shadow-sm">
                    <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-widest mb-1.5 flex items-center gap-1.5 border-b border-gray-100 dark:border-[#291316] pb-2">
                      <ShoppingBag className="w-4 h-4 text-pink-600" /> Active Campus Orders
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-4 font-semibold">
                      Track, adjust, and progress incoming orders placed for your campus hub.
                    </p>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {(() => {
                        return orders
                          .filter(order => currentVendor.campusId === 'all' || order.campusId === currentVendor.campusId)
                          .map(order => {
                            const isPrepared = order.status === 'prepared';
                            const isLaterStatus = ['delivery', 'ready', 'completed'].includes(order.status);
                            
                            return (
                              <div key={order.id} className="p-4 bg-gray-50/50 dark:bg-[#1c0d0f]/10 border border-gray-150 dark:border-[#291316] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-3 flex-1 w-full">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center font-extrabold text-[#C49A25] font-mono text-sm border border-pink-200">
                                      #
                                    </div>
                                    <div>
                                      <h5 className="font-mono font-black text-sm text-gray-800 dark:text-[#fafafa]">
                                        Order No: #{order.id}
                                      </h5>
                                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                        Status: <span className="uppercase text-pink-600 dark:text-pink-400 font-bold">{order.status}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Items Ordered List */}
                                  <div className="pl-1 space-y-1.5 border-t border-gray-100 dark:border-zinc-800/50 pt-2.5">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Items Ordered:</span>
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="text-xs text-gray-800 dark:text-zinc-200 font-bold flex items-start gap-2">
                                        <span className="text-pink-600 dark:text-pink-400">•</span>
                                        <div>
                                          <span>{item.quantity || 1}x {item.name}</span>
                                          {(item.customization?.weight || item.customization?.flavor || item.customization?.messageOnCake) && (
                                            <span className="text-[10px] text-gray-400 font-medium ml-1.5">
                                              ({item.customization.weight ? `${item.customization.weight} kg` : ''} 
                                              {item.customization.flavor ? ` | ${item.customization.flavor}` : ''}
                                              {item.customization.messageOnCake ? ` | Msg: "${item.customization.messageOnCake}"` : ''})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="w-full md:w-auto flex justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-zinc-800/50">
                                  {isLaterStatus ? (
                                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 text-gray-500 border border-gray-200">
                                      Dispatched by Admin
                                    </span>
                                  ) : isPrepared ? (
                                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 flex items-center gap-1">
                                      ✓ Prepared
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => onUpdateOrderStatus(order.id, 'prepared')}
                                      className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-pink-600 hover:bg-pink-700 text-white transition-all cursor-pointer shadow-sm active:scale-95 w-full md:w-auto text-center"
                                    >
                                      Mark as Prepared
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>

                    {orders.filter(order => currentVendor.campusId === 'all' || order.campusId === currentVendor.campusId).length === 0 && (
                      <div className="p-12 text-center bg-gray-50 dark:bg-[#1a0d0f]/80 rounded-2xl border border-dashed border-gray-200 dark:border-[#3c1a1e]">
                        <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] font-bold uppercase tracking-widest">No campus orders found</p>
                        <p className="text-[10px] text-gray-400 mt-1">Orders placed for your campus hub will show up here instantly!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
