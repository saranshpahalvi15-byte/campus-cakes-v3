/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  getFirestore, doc, getDoc, getDocFromServer, getDocs, setDoc, updateDoc, 
  deleteDoc, collection, query, where, onSnapshot 
} from 'firebase/firestore';
import { db, auth, isRealFirebase } from '../firebase';
import { Campus, CakeItem, KioskCake, Order, UserProfile, FeedbackReview, Coupon, Employee, Vendor, GiftItem } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Mandatory Error Handler meeting Firestore Isolation constraints
 */
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Triggered:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes all keys that have a value of undefined.
 * This is crucial to prevent Firestore setDoc/updateDoc crashes due to unsupported undefined values.
 */
function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) {
    return data.map(v => sanitizeFirestoreData(v));
  }
  if (typeof data === 'object') {
    const fresh: any = {};
    Object.keys(data).forEach(k => {
      if (data[k] !== undefined) {
        fresh[k] = sanitizeFirestoreData(data[k]);
      }
    });
    return fresh;
  }
  return data;
}

import { safeStorage } from './safeStorage';

// ============================================================================
// High-performance local caching layers to conserve Firestore read quotas.
// This prevents read spikes during fresh visits and ensures scaling inside free-tier.
// ============================================================================
interface LocalCacheItem<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache freshness guarantee

function getFromLocalCache<T>(key: string): T | null {
  try {
    const cached = safeStorage.getItem(`cc_cache_${key}`);
    if (!cached) return null;
    const item: LocalCacheItem<T> = JSON.parse(cached);
    const now = Date.now();
    if (now - item.timestamp < CACHE_TTL_MS) {
      console.log(`%c[Firestore Cache] Serving '${key}' from memory/local storage bypass (Saved server reads)`, "color: #10B981; font-weight: bold;");
      return item.data;
    }
  } catch (e) {
    console.warn("Error reading cache:", e);
  }
  return null;
}

function setToLocalCache<T>(key: string, data: T): void {
  try {
    const item: LocalCacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    safeStorage.setItem(`cc_cache_${key}`, JSON.stringify(item));
  } catch (e) {
    console.warn("Error saving to cache:", e);
  }
}

function clearLocalCache(key: string): void {
  try {
    safeStorage.removeItem(`cc_cache_${key}`);
  } catch (e) {
    console.warn("Error invalidating cache:", e);
  }
}


// Ensure remote connectivity test on init
export async function testFirestoreConnection() {
  if (!isRealFirebase) return;
  try {
    const testDocPath = 'test/connection';
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('offline_timeout')), 2500))
    ]);
  } catch (error) {
    console.warn("[Firestore] Operating in local/offline fallback mode:", error instanceof Error ? error.message : String(error));
  }
}

// ==========================================
// 1. CAMPUSES COLLECTION OPERATIONS
// ==========================================
export async function getCampuses(): Promise<Campus[]> {
  if (!isRealFirebase) return [];
  const colPath = 'campuses';
  
  // High efficiency LocalStorage fallback first
  const cached = getFromLocalCache<Campus[]>(colPath);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const q = collection(db, colPath);
    const snap = await getDocs(q);
    const items: Campus[] = [];
    snap.forEach((d) => {
      items.push(d.data() as Campus);
    });
    
    if (items.length > 0) {
      setToLocalCache(colPath, items);
    }
    return items;
  } catch (err) {
    console.warn(`[Firestore] getCampuses offline or fallback:`, err);
    return cached || [];
  }
}

export async function writeCampus(campus: Campus): Promise<void> {
  if (!isRealFirebase) return;
  const path = `campuses/${campus.id}`;
  try {
    await setDoc(doc(db, 'campuses', campus.id), sanitizeFirestoreData(campus));
    clearLocalCache('campuses');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeCampus(campusId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `campuses/${campusId}`;
  try {
    await deleteDoc(doc(db, 'campuses', campusId));
    clearLocalCache('campuses');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}


// ==========================================
// 2. PRODUCTS (DELIVERY CAKES) COLLECTION OPERATIONS
// ==========================================
export async function getProducts(): Promise<CakeItem[]> {
  if (!isRealFirebase) return [];
  const colPath = 'products';
  
  // Avoid network read roundtrip if caches are fresh
  const cached = getFromLocalCache<CakeItem[]>(colPath);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const q = collection(db, colPath);
    const snap = await getDocs(q);
    const items: CakeItem[] = [];
    snap.forEach((d) => {
      items.push(d.data() as CakeItem);
    });
    
    if (items.length > 0) {
      setToLocalCache(colPath, items);
    }
    return items;
  } catch (err) {
    console.warn(`[Firestore] getProducts offline or fallback:`, err);
    return cached || [];
  }
}

export async function writeProduct(product: CakeItem): Promise<void> {
  if (!isRealFirebase) return;
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), sanitizeFirestoreData(product));
    clearLocalCache('products');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeProduct(productId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
    clearLocalCache('products');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}


// ==========================================
// 3. KIOSK PRODUCTS COLLECTION OPERATIONS
// ==========================================
export async function getKioskProducts(): Promise<KioskCake[]> {
  if (!isRealFirebase) return [];
  const colPath = 'kiosk_products';
  
  // Guard kiosk catalogs from causing continuous loads
  const cached = getFromLocalCache<KioskCake[]>(colPath);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const q = collection(db, colPath);
    const snap = await getDocs(q);
    const items: KioskCake[] = [];
    snap.forEach((d) => {
      items.push(d.data() as KioskCake);
    });
    
    if (items.length > 0) {
      setToLocalCache(colPath, items);
    }
    return items;
  } catch (err) {
    console.warn(`[Firestore] getKioskProducts offline or fallback:`, err);
    return cached || [];
  }
}

export async function writeKioskProduct(kioskItem: KioskCake): Promise<void> {
  if (!isRealFirebase) return;
  const path = `kiosk_products/${kioskItem.id}`;
  try {
    await setDoc(doc(db, 'kiosk_products', kioskItem.id), sanitizeFirestoreData(kioskItem));
    clearLocalCache('kiosk_products');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeKioskProduct(kioskId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `kiosk_products/${kioskId}`;
  try {
    await deleteDoc(doc(db, 'kiosk_products', kioskId));
    clearLocalCache('kiosk_products');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}


// ==========================================
// 4. USER PROFILES COLLECTION OPERATIONS
// ==========================================
export function subscribeToUserProfile(userId: string, onUpdate: (profile: UserProfile | null) => void) {
  if (!isRealFirebase) return () => {};
  const docRef = doc(db, 'users', userId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onUpdate({ uid: snap.id, ...(snap.data() as any) } as UserProfile);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isRealFirebase) return null;
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return { uid: snap.id, ...(snap.data() as any) } as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function writeUserProfile(profile: UserProfile): Promise<void> {
  if (!isRealFirebase) return;
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), sanitizeFirestoreData(profile));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  if (!isRealFirebase) return [];
  const colPath = 'users';
  try {
    const snap = await getDocs(collection(db, colPath));
    const items: UserProfile[] = [];
    snap.forEach((d) => {
      items.push({ uid: d.id, ...(d.data() as any) } as UserProfile);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
    return [];
  }
}

// ==========================================
// 5. ORDERS COLLECTION OPERATIONS
// ==========================================
export function subscribeToUserOrders(userId: string, onUpdate: (orders: Order[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const orders: Order[] = [];
    snap.forEach((d) => orders.push({ id: d.id, ...(d.data() as any) } as Order));
    onUpdate(orders);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `orders?userId=${userId}`);
  });
}

export function subscribeToReferredOrders(employeeId: string, onUpdate: (orders: Order[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = query(collection(db, 'orders'), where('employeeReferral', '==', employeeId));
  return onSnapshot(q, (snap) => {
    const orders: Order[] = [];
    snap.forEach((d) => orders.push({ id: d.id, ...(d.data() as any) } as Order));
    onUpdate(orders);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `orders?employeeReferral=${employeeId}`);
  });
}

export function subscribeToAssignedOrders(employeeId: string, onUpdate: (orders: Order[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = query(collection(db, 'orders'), where('assignedEmployeeId', '==', employeeId));
  return onSnapshot(q, (snap) => {
    const orders: Order[] = [];
    snap.forEach((d) => orders.push({ id: d.id, ...(d.data() as any) } as Order));
    onUpdate(orders);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `orders?assignedEmployeeId=${employeeId}`);
  });
}

export function subscribeToAllOrders(onUpdate: (orders: Order[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = collection(db, 'orders');
  return onSnapshot(q, (snap) => {
    const orders: Order[] = [];
    snap.forEach((d) => orders.push({ id: d.id, ...(d.data() as any) } as Order));
    onUpdate(orders);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'orders');
  });
}

export function subscribeToCampusOrders(campusId: string, onUpdate: (orders: Order[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = query(collection(db, 'orders'), where('campusId', '==', campusId));
  return onSnapshot(q, (snap) => {
    const orders: Order[] = [];
    snap.forEach((d) => orders.push({ id: d.id, ...(d.data() as any) } as Order));
    onUpdate(orders);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `orders?campusId=${campusId}`);
  });
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  if (!isRealFirebase) return [];
  const colPath = 'orders';
  try {
    const q = query(collection(db, colPath), where('userId', '==', userId));
    const snap = await getDocs(q);
    const items: Order[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as any) } as Order);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
  }
}

export async function writeOrder(order: Order): Promise<void> {
  if (!isRealFirebase) return;
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), sanitizeFirestoreData(order));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getAllOrders(): Promise<Order[]> {
  if (!isRealFirebase) return [];
  const colPath = 'orders';
  try {
    const snap = await getDocs(collection(db, colPath));
    const items: Order[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as any) } as Order);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
    return [];
  }
}


// ==========================================
// 6. CAKE IMAGES CATALOG OPERATIONS
// ==========================================
export interface CakeImageRecord {
  id: string;
  cakeId?: string;
  name?: string;
  imageUrl: string;
  uploadedBy?: string;
  createdAt: string;
}

export async function getCakeImages(): Promise<CakeImageRecord[]> {
  if (!isRealFirebase) return [];
  const colPath = 'cake_images';
  
  // Guard cake images library from query spikes
  const cached = getFromLocalCache<CakeImageRecord[]>(colPath);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const q = collection(db, colPath);
    const snap = await getDocs(q);
    const items: CakeImageRecord[] = [];
    snap.forEach((d) => {
      items.push(d.data() as CakeImageRecord);
    });
    
    if (items.length > 0) {
      setToLocalCache(colPath, items);
    }
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
  }
}

export async function writeCakeImage(imageRecord: CakeImageRecord): Promise<void> {
  if (!isRealFirebase) return;
  const path = `cake_images/${imageRecord.id}`;
  try {
    await setDoc(doc(db, 'cake_images', imageRecord.id), sanitizeFirestoreData(imageRecord));
    clearLocalCache('cake_images');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeOrder(orderId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function clearAllFirestoreCaches(): void {
  const keys = ['campuses', 'products', 'kiosk_products', 'cake_images', 'gifts'];
  keys.forEach(k => clearLocalCache(k));
}

// ==========================================
// 7. COUPONS COLLECTION OPERATIONS
// ==========================================
export function subscribeToCoupons(onUpdate: (coupons: Coupon[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = collection(db, 'coupons');
  return onSnapshot(q, (snap) => {
    const coupons: Coupon[] = [];
    snap.forEach((d) => coupons.push({ ...d.data() as Coupon, id: d.id }));
    onUpdate(coupons);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'coupons');
  });
}

export async function getCoupons(): Promise<Coupon[]> {
  if (!isRealFirebase) return [];
  const colPath = 'coupons';
  try {
    const snap = await getDocs(collection(db, colPath));
    const items: Coupon[] = [];
    snap.forEach((d) => items.push({ ...d.data() as Coupon, id: d.id }));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
    return [];
  }
}

export async function writeCoupon(coupon: Coupon): Promise<void> {
  if (!isRealFirebase) return;
  const path = `coupons/${coupon.id}`;
  try {
    await setDoc(doc(db, 'coupons', coupon.id), sanitizeFirestoreData(coupon));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeCoupon(couponId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `coupons/${couponId}`;
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}


// ==========================================
// 8. REVIEWS COLLECTION OPERATIONS
// ==========================================
export function subscribeToReviews(onUpdate: (reviews: FeedbackReview[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = collection(db, 'reviews');
  return onSnapshot(q, (snap) => {
    const reviewsList: FeedbackReview[] = [];
    snap.forEach((d) => reviewsList.push({ ...d.data() as FeedbackReview, id: d.id }));
    reviewsList.sort((a, b) => b.id.localeCompare(a.id));
    onUpdate(reviewsList);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'reviews');
  });
}

export async function writeReview(review: FeedbackReview): Promise<void> {
  if (!isRealFirebase) return;
  const path = `reviews/${review.id}`;
  try {
    await setDoc(doc(db, 'reviews', review.id), sanitizeFirestoreData(review));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeReview(reviewId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ==========================================
// 9. EMPLOYEES COLLECTION OPERATIONS
// ==========================================
export async function getEmployees(): Promise<Employee[]> {
  if (!isRealFirebase) return [];
  const colPath = 'employees';
  
  const cached = getFromLocalCache<Employee[]>(colPath);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const q = collection(db, colPath);
    const snap = await getDocs(q);
    const items: Employee[] = [];
    snap.forEach((d) => {
      items.push(d.data() as Employee);
    });
    
    if (items.length > 0) {
      setToLocalCache(colPath, items);
    }
    return items;
  } catch (err) {
    console.warn(`[Firestore] getEmployees offline or fallback:`, err);
    return cached || [];
  }
}

export async function writeEmployee(employee: Employee): Promise<void> {
  if (!isRealFirebase) return;
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), sanitizeFirestoreData(employee));
    clearLocalCache('employees');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeEmployee(employeeId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
    clearLocalCache('employees');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ==========================================
// 10. VENDORS COLLECTION OPERATIONS
// ==========================================
export async function getVendors(): Promise<Vendor[]> {
  if (!isRealFirebase) return [];
  const colPath = 'vendors';
  
  const cached = getFromLocalCache<Vendor[]>(colPath);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const q = collection(db, colPath);
    const snap = await getDocs(q);
    const items: Vendor[] = [];
    snap.forEach((d) => {
      items.push(d.data() as Vendor);
    });
    
    if (items.length > 0) {
      setToLocalCache(colPath, items);
    }
    return items;
  } catch (err) {
    console.warn(`[Firestore] getVendors offline or fallback:`, err);
    return cached || [];
  }
}

export async function writeVendor(vendor: Vendor): Promise<void> {
  if (!isRealFirebase) return;
  const path = `vendors/${vendor.id}`;
  try {
    await setDoc(doc(db, 'vendors', vendor.id), sanitizeFirestoreData(vendor));
    clearLocalCache('vendors');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeVendor(vendorId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `vendors/${vendorId}`;
  try {
    await deleteDoc(doc(db, 'vendors', vendorId));
    clearLocalCache('vendors');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ==========================================
// 11. GIFTS COLLECTION OPERATIONS
// ==========================================
export function subscribeToGifts(onUpdate: (gifts: GiftItem[]) => void) {
  if (!isRealFirebase) return () => {};
  const q = collection(db, 'gifts');
  return onSnapshot(q, (snap) => {
    const gifts: GiftItem[] = [];
    snap.forEach((d) => gifts.push({ ...d.data() as GiftItem, id: d.id }));
    onUpdate(gifts);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'gifts');
  });
}

export async function getGifts(): Promise<GiftItem[]> {
  if (!isRealFirebase) return [];
  const colPath = 'gifts';
  const cached = getFromLocalCache<GiftItem[]>(colPath);
  if (cached) return cached;

  try {
    const snap = await getDocs(collection(db, colPath));
    const items: GiftItem[] = [];
    snap.forEach((d) => items.push({ ...d.data() as GiftItem, id: d.id }));
    if (items.length > 0) {
      setToLocalCache(colPath, items);
    }
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
    return [];
  }
}

export async function writeGift(gift: GiftItem): Promise<void> {
  if (!isRealFirebase) return;
  const path = `gifts/${gift.id}`;
  try {
    await setDoc(doc(db, 'gifts', gift.id), sanitizeFirestoreData(gift));
    clearLocalCache('gifts');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeGift(giftId: string): Promise<void> {
  if (!isRealFirebase) return;
  const path = `gifts/${giftId}`;
  try {
    await deleteDoc(doc(db, 'gifts', giftId));
    clearLocalCache('gifts');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}






