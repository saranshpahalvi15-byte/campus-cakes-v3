/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Campus, CakeItem, KioskCake, FeedbackReview, GiftItem } from './types';

const hazelnutImage = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80';
const bentoImage = 'https://images.unsplash.com/photo-1519340333755-56e87770b92d?w=800&auto=format&fit=crop&q=80';
const redVelvetImage = 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=800&auto=format&fit=crop&q=80';

export const CAMPUSES: Campus[] = [
  { id: 'abc-univ', name: 'ABC University (Main Campus)', location: 'Hub & Central Quad', active: true },
  { id: 'xyz-coll', name: 'XYZ College of Engineering', location: 'Tech Quad, Block D', active: true },
  { id: 'pqr-inst', name: 'PQR Institute of Business', location: 'East Campus Gate', active: true },
  { id: 'future-nsit', name: 'NSIT Campus (Coming Soon)', location: 'Metro Junction Block', active: false },
  { id: 'future-dce', name: 'DCE Technical Camps (Coming Soon)', location: 'Academic Galleria', active: false },
];

export const CATEGORIES = [
  'All Cakes',
  'Birthday Cakes',
  'Chocolate Cakes',
  'Red Velvet',
  'Black Forest',
  'Bento Cakes',
  'Photo Cakes',
  'Anniversary Cakes',
  'Customized Cakes',
  'Cupcakes',
  'Eggless Cakes',
];

export const CAKE_PRODUCTS: CakeItem[] = [
  {
    id: 'choc-hazelnut',
    name: 'Gourmet Chocolate Hazelnut Dream',
    description: 'Our signature whole chocolate truffle layers infused with direct-sourced roasted hazelnuts, premium cocoa curls, and molten Ganache.',
    price: 549,
    rating: 4.9,
    category: 'Chocolate Cakes',
    isEggless: false,
    isTrending: true,
    image: hazelnutImage,
    deliveryTime: '24 Hours',
    weights: [0.5, 1.0, 1.5, 2.0],
    flavors: ['Classic Hazelnut Premium', 'Intense Dark Velvet', 'Mocha Crunch Chocolate'],
  },
  {
    id: 'minimalist-bento',
    name: 'Korean Pastel Bento Cake',
    description: 'Adorably petite customized bento, perfect for 2-3 hostel roommates. Write your custom playful note on the clean pastel pink buttercream!',
    price: 299,
    rating: 4.8,
    category: 'Bento Cakes',
    isEggless: true,
    isTrending: true,
    image: bentoImage,
    deliveryTime: '24 Hours',
    weights: [0.3, 0.5],
    flavors: ['Sweet Strawberry Cloud', 'Fresh Bourbon Vanilla', 'Classic Salted Caramel'],
  },
  {
    id: 'red-velvet-grad',
    name: 'Red Velvet Sparkle Swirl',
    description: 'Irresistibly moist layers of deep crimson red velvet cake paired with artisanal whipped cream-cheese frosting and sparkly sugar dust.',
    price: 499,
    rating: 4.7,
    category: 'Red Velvet',
    isEggless: false,
    isTrending: false,
    image: redVelvetImage,
    deliveryTime: '24 Hours',
    weights: [0.5, 1.0, 1.5],
    flavors: ['Classic Velvet Cream', 'Double Cheese Swirl', 'Eggless Velvet Dream'],
  },
  {
    id: 'retro-black-forest',
    name: 'Classic Black Forest Gateau',
    description: 'Rich dark chocolate sponges soaked with sweet cherry reduction, clouds of fresh whipped cream, and chocolate flakes galore.',
    price: 449,
    rating: 4.6,
    category: 'Black Forest',
    isEggless: true,
    isTrending: false,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
    deliveryTime: '24 Hours',
    weights: [0.5, 1.0, 1.5, 2.0],
    flavors: ['Spiced Cherry Classic', 'Kirsch-Free Safe Blend', 'Double Fudge Cherry'],
  },
  {
    id: 'sweet-sixteen-bday',
    name: 'Happy Birthday Funfetti Blast',
    description: 'The ultimate birthday core signature. Festive multi-colored rainbow sprinkles baked right inside soft vanilla layers, loaded with sweet white cream.',
    price: 599,
    rating: 4.9,
    category: 'Birthday Cakes',
    isEggless: true,
    isTrending: true,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
    deliveryTime: '24 Hours',
    weights: [0.5, 1.0, 1.5, 2.0],
    flavors: ['Confetti White Frosting', 'Sprinkle Buttercream', 'Strawberry Confetti Swirl'],
  },
  {
    id: 'anniversary-royal',
    name: 'Royal Golden Anniversary Rose',
    description: 'Exquisite two-tiered look cake decorated with sugar fondant flowers and a metallic gold finish for club events or couple milestones.',
    price: 999,
    rating: 4.9,
    category: 'Anniversary Cakes',
    isEggless: false,
    isTrending: false,
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?w=500&auto=format&fit=crop&q=80',
    deliveryTime: '24 Hours',
    weights: [1.0, 1.5, 2.0, 3.0],
    flavors: ['Gilded Strawberry Rose', 'Eldorado Rich Chocolate', 'Creamy Vanilla Bean'],
  },
  {
    id: 'campus-photo-cake',
    name: 'Custom Instax Photo Cake',
    description: 'Upload any memorable group selfie or text. We print it on edible crisp sugar sheet ink with edible high-resolution crop overlays!',
    price: 699,
    rating: 4.8,
    category: 'Photo Cakes',
    isEggless: true,
    isTrending: true,
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=500&auto=format&fit=crop&q=80',
    deliveryTime: '24 Hours',
    weights: [1.0, 1.5, 2.0],
    flavors: ['High-Res Vanilla Crunch', 'Photo Truffle Supreme', 'Pineapple Snap Cloud'],
  },
  {
    id: 'custom-creative-box',
    name: 'Bespoke Theme Customized Cake',
    description: 'Want a cake shaped like a laptop, a physics book, or a guitar? Design your dream, choose dynamic flavors, and tell us your design requirements.',
    price: 1199,
    rating: 4.9,
    category: 'Customized Cakes',
    isEggless: true,
    isTrending: true,
    image: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop&q=80',
    deliveryTime: '24 Hours',
    weights: [1.0, 1.5, 2.0, 3.0],
    flavors: ['Custom Mix Request', 'Classic Velvet Cream', 'Triple Fudge Heaven'],
  },
  {
    id: 'party-cupcakes-six',
    name: 'Gourmet Hostelier Box of 6 Cupcakes',
    description: 'A shared variety platter: 2x Chocolate Ganache, 2x Red Velvet Crown, and 2x Confetti Surprise cupcakes. Instant happiness guaranteed!',
    price: 349,
    rating: 4.7,
    category: 'Cupcakes',
    isEggless: true,
    isTrending: false,
    image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500&auto=format&fit=crop&q=80',
    deliveryTime: '24 Hours',
    weights: [0.5], // representations for boxes
    flavors: ['Assorted Baker Selection', 'All Chocolate Box', 'Vegan/Eggless Assorted'],
  },
  {
    id: 'eggless-mango-delight',
    name: 'Pure Vegetarian Mango Passionate',
    description: '100% eggless, guilt-free paradise. Whipped plant cream, seasonal organic mango coulis, and high-altitude sponge layers.',
    price: 499,
    rating: 4.7,
    category: 'Eggless Cakes',
    isEggless: true,
    isTrending: false,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=80',
    deliveryTime: '24 Hours',
    weights: [0.5, 1.0, 1.5],
    flavors: ['Tropical Mango Pulp', 'Mango Coco Swirl', 'Eggless Vanilla Mango'],
  }
];

export const KIOSK_INVENTORY: KioskCake[] = [
  {
    id: 'kiosk-choc-truffle',
    name: 'Campus Truffle Smash (Kiosk Ready)',
    price: 449,
    flavor: 'Double Chocolate Fudge',
    remainingStock: 3,
    totalStock: 5,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'kiosk-velvet-bite',
    name: 'Red Velvet Classic Kiosk Joy',
    price: 449,
    flavor: 'Classic Whipped Cream Velvet',
    remainingStock: 4,
    totalStock: 4,
    image: redVelvetImage,
  },
  {
    id: 'kiosk-mini-bento',
    name: 'Bento Kiosk Surprise (Limited)',
    price: 299,
    flavor: 'Vanilla Sprinkles with Cute Art',
    remainingStock: 1,
    totalStock: 4,
    image: bentoImage,
  },
  {
    id: 'kiosk-pineapple-rush',
    name: 'Emergency Pineapple Dream',
    price: 349,
    flavor: 'Fresh Eggless Pineapple Blast',
    remainingStock: 0,
    totalStock: 3,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=80',
  }
];

export const AI_RECOMMENDATION_TEMPLATES = [
  {
    occasionId: 'birthday',
    title: '🎂 Birthday Celebrations',
    tagline: 'Make their day unforgettable, even in a shared-dorm bunk!',
    counsel: 'Students love the Gourmet Chocolate Hazelnut Dream with custom handwritten letters. Go for 1.0kg to ensure the whole floor gets a bite!',
    recommendedIds: ['choc-hazelnut', 'sweet-sixteen-bday', 'campus-photo-cake'],
  },
  {
    occasionId: 'hostel-party',
    title: '🎉 Late-Night Hostel Parties',
    tagline: 'Last-minute semester plans or floor reunions?',
    counsel: 'Cupcake party boxes are highly rated for late-night ease since you do not even need knives or plates. No-mess roommates win!',
    recommendedIds: ['party-cupcakes-six', 'retro-black-forest', 'minimalist-bento'],
  },
  {
    occasionId: 'freshers',
    title: '🤝 Freshers Induction Welcome',
    tagline: 'Welcome incoming juniors with delicious campus heritage.',
    counsel: 'Custom Instax Photo cakes showing the university logo or current batch banner are high standard hits.',
    recommendedIds: ['campus-photo-cake', 'custom-creative-box', 'choc-hazelnut'],
  },
  {
    occasionId: 'farewell',
    title: '🎓 Graduation/Farewell Send-off',
    tagline: 'Goodbye seniors! Celebrate the late nights and early lectures.',
    counsel: 'We highly suggest the Custom Instax Photo cake containing your best roommates collage to cry on before you cut.',
    recommendedIds: ['campus-photo-cake', 'anniversary-royal', 'custom-creative-box'],
  },
  {
    occasionId: 'exams',
    title: '📚 Post-Exam Relief Rush',
    tagline: 'Passed that impossible fluid mechanics midterm? Treat yourself!',
    counsel: 'Mini Korean Bentos are the undisputed champions for quick post-exam venting with your study group.',
    recommendedIds: ['minimalist-bento', 'eggless-mango-delight', 'red-velvet-grad'],
  }
];

export const STUDENT_TESTIMONIALS: FeedbackReview[] = [
  {
    id: 'test-1',
    userName: 'Aarav Sharma',
    userImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Literally saved our club treasurer birthday! We forgot until 10 PM. Ordered for next evening and was delivered right to the mess gate. Tastes phenomenal!',
    cakeName: 'Gourmet Chocolate Hazelnut Dream',
    date: '3 days ago',
    image: hazelnutImage
  },
  {
    id: 'test-2',
    userName: 'Kriti Deshmukh',
    userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'The Kiosk emergency reserve is the best thing about Campus Cakes. Picked up a bento at 5 PM right after exams. Tastes super light and perfectly balanced!',
    cakeName: 'Korean Pastel Bento Cake',
    date: '1 week ago',
    image: bentoImage
  },
  {
    id: 'test-3',
    userName: 'Vikram Aditya',
    userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Edible photo print was unbelievably clear. We uploaded our wacky group selfie from hostel induction and cut it during hostel night. Clean delivery too.',
    cakeName: 'Custom Instax Photo Cake',
    date: '2 weeks ago',
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=500&auto=format&fit=crop&q=80'
  }
];

export const FAQS = [
  {
    q: 'Why must we pre-order cakes at least 24 hours in advance?',
    a: 'To guarantee premium freshness while keeping startup overhead low! We partner with top artisan bakeries near campus. This ensures your custom cake is baked precisely to order, avoiding stagnant inventory and maintaining our low, student-friendly pricing.'
  },
  {
    q: 'Do you bake these gourmet cakes yourselves?',
    a: 'Not initially! We operate as a smart tech-and-logistics brand. We source freshly baked products from our vetted premium partner bakery. We then handle quality checks, branding, smart custom photo assembly, safe refrigeration, and deliver them directly into your campus hostel, lab, or common area.'
  },
  {
    q: 'I need a cake right now! What emergency options do you have?',
    a: 'Visit our Campus Kiosk! We keep 3–4 ultra-popular, ready-to-go flavors in live refrigeration on campus. You can view the Live Stock on our webpage and instantly reserve your cake to prevent someone else from snatching it.'
  },
  {
    q: 'Can I get a refund if my hostel event or professor seminar is cancelled?',
    a: 'Absolutely! Cancel at least 12 hours before your selected delivery or pickup slot, and we will issue a full refund back to your payment mode. Kiosk reservations are held for 1.5 hours, after which they are automatically cancelled with zero penalty.'
  }
];

export const GIFT_PRODUCTS: GiftItem[] = [
  {
    id: 'gift-roses',
    name: 'Gilded Rose Bouquet',
    description: 'A premium bunch of 6 fresh crimson red roses, elegantly hand-tied with a golden satin ribbon.',
    price: 399,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&auto=format&fit=crop&q=80',
    category: 'Flowers',
    partnerGallery: 'Flora Partners'
  },
  {
    id: 'gift-card',
    name: 'Handwritten Premium Greeting Card',
    description: 'An elegant heavyweight card with gold foil accents. Our campus team will handwrite your custom warm message!',
    price: 99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=80',
    category: 'Cards',
    partnerGallery: 'Scribble Studio'
  },
  {
    id: 'gift-truffles',
    name: 'Belgian Truffles Gift Box',
    description: 'Assorted box of 8 premium milk and dark Belgian chocolate truffles in an exquisite golden gift box.',
    price: 299,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1548907040-4d42b52145ea?w=500&auto=format&fit=crop&q=80',
    category: 'Chocolates',
    partnerGallery: 'Sweet Treat Gallery'
  },
  {
    id: 'gift-teddy',
    name: 'Plush Teddy Bear Companion',
    description: 'A super soft, huggable 8-inch beige plush teddy bear wearing a cute miniature red ribbon.',
    price: 249,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=500&auto=format&fit=crop&q=80',
    category: 'Toys',
    partnerGallery: 'Dorm Toy Loft'
  },
  {
    id: 'gift-neon',
    name: 'Happy Birthday Neon Topper',
    description: 'A mini battery-operated warm-glow LED neon sign that can be placed next to the cake for the ultimate dorm party look.',
    price: 499,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80',
    category: 'Decorations',
    partnerGallery: 'Dorm Sparkles'
  }
];
