/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Reusable premium Receipt Generation Utility for Campus Cakes.
 * Creates an elegant, printable HTML invoice Blob and triggers an automatic browser download.
 */

import { Order } from '../types';
import { brandLogo } from '../assets/logo';

async function getBase64Image(imgUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
          return;
        }
      } catch (e) {
        console.error('Error rendering image to canvas for base64', e);
      }
      resolve(imgUrl);
    };
    img.onerror = () => {
      resolve(imgUrl);
    };
    const finalUrl = (imgUrl.startsWith('http') || imgUrl.startsWith('data:'))
      ? imgUrl 
      : `${window.location.origin}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
    img.src = finalUrl;
  });
}

export async function downloadReceiptFile(order: Order, studentName?: string) {
  const orderId = order.id;
  
  // Convert logo to offline base64 dynamically so it doesn't break in downloaded files
  const logoUrl = await getBase64Image(brandLogo);

  // Let's determine if any loyalty points were used. 
  // Standard surcharge (packaging + taxes) = 50. 
  // If points were used during purchase, total paid amount is less than (subtotal + 50)
  const defaultTotalWithSurcharges = order.subtotal + 50;
  const pointsRedeemedValue = Math.max(0, defaultTotalWithSurcharges - order.total);
  const isPointsRedeemed = pointsRedeemedValue > 0;

  const itemsHtml = order.items.map((it) => {
    const customDetails: string[] = [];
    if (it.customization) {
      if (it.customization.flavor) customDetails.push(`Flavor: ${it.customization.flavor}`);
      if (it.customization.weight) customDetails.push(`Weight: ${it.customization.weight} kg`);
      if (it.customization.messageOnCake) customDetails.push(`Cake Message: "${it.customization.messageOnCake}"`);
      if (it.customization.addCandles) customDetails.push(`🕯️ Extra Candles Included`);
      if (it.customization.addKnife) customDetails.push(`🔪 Safety Wood Knife Included`);
      if (it.customization.pickupTime) {
        // format nicely as time or date
        customDetails.push(`⏰ Scheduled Time: ${it.customization.pickupTime}`);
      }
      if (it.customization.specialInstructions) customDetails.push(`📝 Notes: "${it.customization.specialInstructions}"`);
    } else if (it.isInstantKiosk) {
      customDetails.push(`⚡ Instant pick up from Campus Kiosk`);
    }

    const customList = customDetails.length > 0 
      ? `<ul style="margin: 4px 0 0 0; padding: 0; list-style: none; font-size: 11.5px; color: #57534E; line-height: 1.5; font-weight: 600;">
          ${customDetails.map(d => `
            <li style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
              <span style="color: #E23744; font-size: 12px; line-height: 1;">•</span>
              <span>${d}</span>
            </li>
          `).join('')}
         </ul>`
      : '';

    return `
      <tr style="border-bottom: 2px dashed #E4E4E7;">
        <td style="padding: 16px 8px; text-align: left; vertical-align: middle;">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #FEFDFB; border: 1.5px solid #D4AF37; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(196, 154, 37, 0.1);">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9C7815" stroke-width="2">
                <path d="M12 2v4" />
                <path d="M12 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3Z" fill="#E23744" stroke="none" />
                <path d="M18 8H6a2 2 0 0 0-2 2v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3a2 2 0 0 0-2-2Z" fill="#FAF6F0" />
                <path d="M20 14H4v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4Z" fill="#FAF3D9" />
              </svg>
            </div>
            <div>
              <div style="font-weight: 800; color: #18181b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em;">${it.name}</div>
              ${customList}
            </div>
          </div>
        </td>
        <td style="padding: 16px 8px; text-align: right; vertical-align: middle; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #1C1917;">₹${it.price}</td>
        <td style="padding: 16px 8px; text-align: center; vertical-align: middle; font-weight: 800; font-size: 14px; color: #1C1917;">${it.quantity}</td>
        <td style="padding: 16px 8px; text-align: right; vertical-align: middle; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #9C7815; font-size: 14px;">₹${it.price * it.quantity}</td>
      </tr>
    `;
  }).join('');

  const paymentModeLabel = order.paymentMethod || 'UPI / Online Card';
  const customerName = order.customerName || studentName || 'Campus Student';
  const deliveryAddress = order.deliveryAddress || 'Campus Pick-up Stall';

  // Points redemption calculation info line
  const redemptionRowHtml = isPointsRedeemed
    ? `
      <div class="calc-row" style="color: #B45309; font-weight: 800; display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0;">
        <span style="display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#CA8A04" style="color: #CA8A04;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Loyalty Points Reward Offset:
        </span>
        <span style="font-family: 'JetBrains Mono', monospace;">-₹${pointsRedeemedValue}</span>
      </div>
    `
    : '';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt_Order_${orderId}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
    
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #FAF6F0; /* Soft, ivory background */
      color: #1C1917;
      -webkit-font-smoothing: antialiased;
    }
    .receipt-container {
      max-width: 680px;
      margin: 0 auto;
      background-color: #FEFDFB; /* Clear bright paper card */
      border-radius: 28px;
      box-shadow: 0 20px 45px -12px rgba(143, 105, 16, 0.12), 0 8px 16px -8px rgba(143, 105, 16, 0.08);
      border: 1.5px solid #D4AF37; /* Royal golden border frame */
      padding: 40px;
      position: relative;
    }
    
    .receipt-container::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 10px;
      background-image: linear-gradient(-135deg, #FEFDFB 5px, transparent 0), linear-gradient(135deg, #FEFDFB 5px, transparent 0);
      background-size: 10px 10px;
    }

    .brand-header-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr 1fr;
      align-items: center;
      margin-bottom: 28px;
      border-bottom: 2px dashed #E5E5E0;
      padding-bottom: 28px;
    }

    .meta-box-header {
      text-align: left;
    }

    .invoice-tag {
      background-color: #C0392B; 
      color: #FFFFFF; 
      font-size: 10px; 
      font-weight: 800; 
      padding: 4px 10px; 
      border-radius: 6px; 
      display: inline-block; 
      letter-spacing: 0.12em; 
      text-transform: uppercase; 
      margin-bottom: 8px;
    }

    .order-heading {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 18px;
      font-weight: 900;
      color: #1C1917;
      margin: 0;
    }

    .order-id-high {
      color: #E23744;
    }

    .slot-detail {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #78716C;
      margin-top: 6px;
      font-weight: 700;
    }

    .billed-on-col {
      text-align: right;
    }

    .billed-label {
      text-transform: uppercase;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #854D0E;
      margin-bottom: 6px;
    }

    .billed-date-row {
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: flex-end;
      font-weight: 700;
      color: #1C1917;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .billed-time-row {
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: flex-end;
      font-family: 'JetBrains Mono', monospace;
      color: #78716C;
      font-size: 11px;
    }

    .middle-crest-svg {
      text-align: center;
    }

    .brand-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 950;
      color: #8F6910;
      letter-spacing: 0.12em;
      margin: 6px 0 0 0;
      text-transform: uppercase;
    }

    .brand-motto {
      font-size: 10px;
      font-weight: 800;
      color: #78716C;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin: 4px 0 0 0;
    }

    .customer-split-card {
      background-color: #FAFAF7; 
      border: 1.5px solid #E7E5E4; 
      border-radius: 20px; 
      padding: 20px; 
      display: grid; 
      grid-template-columns: 1.2fr 1fr; 
      gap: 20px; 
      margin-bottom: 28px;
    }

    .table-section-title-wrapper {
      text-align: center; 
      margin: 32px 0 16px 0;
    }

    .section-ribbon-badge {
      background-color: #C0392B; 
      color: #FFFFFF; 
      font-size: 11px; 
      font-weight: 800; 
      padding: 6px 20px; 
      border-radius: 50px; 
      letter-spacing: 0.08em; 
      text-transform: uppercase;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }

    .items-table th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #FEFAF6;
      font-weight: 800;
      background-color: #3C2216; /* Fancier chocolate brown header bar */
      padding: 12px 10px;
    }

    .items-table th:first-child {
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
    }

    .items-table th:last-child {
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .calculation-section {
      background-color: #FAFAF9;
      border-radius: 20px;
      padding: 22px;
      border: 1.5px dashed #D4AF37;
      margin-bottom: 28px;
      position: relative;
      overflow: hidden;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 0;
      color: #57534E;
      position: relative;
      z-index: 2;
    }

    .calc-row-bold {
      font-weight: 700;
      color: #1C1917;
    }

    .calc-row-total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 2px dashed #E2E1DF;
      padding-top: 14px;
      margin-top: 12px;
      position: relative;
      z-index: 2;
    }

    .total-amount-box {
      background-color: #FEFDF6;
      border: 2px solid #D4AF37;
      border-radius: 12px;
      padding: 6px 20px;
      font-size: 20px;
      font-weight: 950;
      color: #8F6910;
      font-family: 'JetBrains Mono', monospace;
      box-shadow: 0 4px 12px rgba(143, 105, 16, 0.06);
    }

    .points-star-bar {
      background-color: #FEFCE8; 
      border: 1.5px solid #FDE047; 
      border-radius: 16px; 
      padding: 14px 18px; 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      margin-bottom: 28px; 
      box-shadow: 0 4px 10px rgba(253, 224, 71, 0.12);
    }

    .star-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #FEF08A;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #FACC15;
      flex-shrink: 0;
    }

    .footer-greeting-card {
      border: 1.5px dashed #D4AF37; 
      border-radius: 20px; 
      background-color: #FEFDF9; 
      padding: 24px; 
      text-align: center; 
      position: relative; 
      overflow: hidden; 
      margin-bottom: 28px;
    }

    .contact-charcoal-bar {
      background-color: #272522; 
      border-radius: 14px; 
      padding: 14px 24px; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      font-size: 11px; 
      color: #F5F5F4; 
      font-weight: 700;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .actions-bar {
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 800;
      padding: 12px 22px;
      border-radius: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      transition: all 0.2s ease-in-out;
      border: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-primary {
      background-color: #8F6910;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(143, 105, 16, 0.15);
    }
    .btn-primary:hover {
      background-color: #76550B;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background-color: #E7E5E4;
      color: #44403C;
    }
    .btn-secondary:hover {
      background-color: #D6D3D1;
      transform: translateY(-1px);
    }

    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .receipt-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Printable Header Controls Selection -->
  <div class="actions-bar no-print">
    <button class="btn btn-primary" onclick="window.print()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print & Save as PDF
    </button>
    <button class="btn btn-secondary" onclick="window.close()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      Close Invoice Window
    </button>
  </div>

  <div class="receipt-container">
    
    <!-- Top Brand Header Section of Invoice -->
    <div class="brand-header-grid">
      <div class="meta-box-header">
        <div class="invoice-tag">Invoice</div>
        <h2 class="order-heading">Order <span class="order-id-high">#${orderId}</span></h2>
        
        <div class="slot-detail">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          Slot: <strong style="color: #1C1917;">${order.orderType === 'instant-pickup' ? 'Campus Cakes Now' : 'Pre-Order'}</strong>
        </div>
      </div>

      <div class="middle-crest-svg">
        <img src="${logoUrl}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2.5px solid #D4AF37; margin: 0 auto 10px auto; display: block; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);" alt="Campus Cakes Logo" />
        <div class="brand-title">CAMPUS CAKES</div>
        <div class="brand-motto">Imperial Royal Confectioners</div>
      </div>

      <div class="billed-on-col">
        <div class="billed-label">Billed On</div>
        <div class="billed-date-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${order.date}</span>
        </div>
        <div class="billed-time-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>${order.timestamp ? new Date(order.timestamp).toLocaleTimeString('en-US', { hour12: false }) : ''}</span>
        </div>
      </div>
    </div>

    <!-- Padded Customer Details Grid block -->
    <div class="customer-split-card">
      <div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #78716C; margin-bottom: 10px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Customer Details
        </div>
        <div style="font-size: 18px; font-weight: 900; color: #1C1917; margin-bottom: 4px;">${customerName}</div>
        <div style="font-size: 12px; color: #57534E; margin-bottom: 6px;">📧 ${order.userEmail || 'N/A'}</div>
        <div style="font-size: 11.5px; color: #9C7815; font-weight: 800; display: flex; align-items: flex-start; gap: 4px; line-height: 1.4;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-top: 2px; flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>Delivery Location: ${deliveryAddress}</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 16px; padding: 14px; height: 100%;">
        <div style="flex-shrink: 0;">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 6 L38 12 L22 18 L6 12 Z" fill="#FAF6F0" stroke="#C49A25" stroke-width="1.5" />
            <path d="M6 12 L22 18 L22 40 L6 34 Z" fill="#FBF7F1" stroke="#C49A25" stroke-width="1.5" />
            <path d="M22 18 L38 12 L38 34 L22 40 Z" fill="#F4EFE6" stroke="#C49A25" stroke-width="1.5" />
            <path d="M22 6 L22 18" stroke="#E23744" stroke-width="2.5" />
            <path d="M14 9 L30 15" stroke="#E23744" stroke-width="2.5" />
            <path d="M6 23 L22 29" stroke="#E23744" stroke-width="1.5" />
            <path d="M22 29 L38 23" stroke="#E23744" stroke-width="1.5" />
            <circle cx="22" cy="7" r="4" stroke="#E23744" stroke-width="1.5" />
          </svg>
        </div>
        <div style="font-size: 11px; line-height: 1.4; color: #57534E;">
          Thank you for choosing <strong>Campus Cakes!</strong> 🍰
          <br>We appreciate your trust in making your moments extra special.
        </div>
      </div>
    </div>

    <!-- Centered section banner -->
    <div class="table-section-title-wrapper">
      <span class="section-ribbon-badge">Ordered Items Breakdown</span>
    </div>

    <!-- Items Specifications Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 55%;">Item & Specifications</th>
          <th style="text-align: right; width: 15%;">Unit Price</th>
          <th style="text-align: center; width: 12%;">Qty</th>
          <th style="text-align: right; width: 18%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Pricing Summary Block -->
    <div class="calculation-section">
      <!-- Vector Lineart outline decoration -->
      <div style="position: absolute; right: -15px; bottom: -10px; opacity: 0.12; pointer-events: none;">
        <svg width="240" height="150" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 110 L190 110" stroke="#9C7815" stroke-width="1.5"/>
          <rect x="30" y="50" width="140" height="60" rx="3" stroke="#9C7815" stroke-width="1.2" fill="#FAF6F0"/>
          <path d="M85 50 Q100 20, 115 50" fill="#FAF6F0" stroke="#9C7815" stroke-width="1.5"/>
          <rect x="96" y="15" width="8" height="15" stroke="#9C7815" stroke-width="1.2"/>
          <circle cx="100" cy="8" r="3" fill="#D4AF37" stroke="#9C7815" stroke-width="1"/>
          <rect x="42" y="65" width="12" height="20" rx="2" stroke="#9C7815" stroke-width="1"/>
          <rect x="62" y="65" width="12" height="20" rx="2" stroke="#9C7815" stroke-width="1"/>
          <rect x="126" y="65" width="12" height="20" rx="2" stroke="#9C7815" stroke-width="1"/>
          <rect x="146" y="65" width="12" height="20" rx="2" stroke="#9C7815" stroke-width="1"/>
          <path d="M90 110 L90 85 A 10 10 0 0 1 110 85 L110 110 Z" stroke="#9C7815" stroke-width="1.5" fill="#FAF6F0"/>
          <circle cx="100" cy="72" r="3" fill="#9C7815"/>
          <path d="M10 85 Q16 70, 22 85 Z" fill="#FAF3D9" stroke="#9C7815" stroke-width="1.2"/>
          <line x1="16" y1="85" x2="16" y2="110" stroke="#9C7815" stroke-width="1"/>
          <path d="M178 85 Q184 70, 190 85 Z" fill="#FAF3D9" stroke="#9C7815" stroke-width="1.2"/>
          <line x1="184" y1="85" x2="184" y2="110" stroke="#9C7815" stroke-width="1"/>
        </svg>
      </div>

      <div class="calc-row">
        <span>Cart Items Subtotal:</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">₹${order.subtotal}</span>
      </div>
      <div class="calc-row">
        <span>Packaging Box Surcharge:</span>
        <span style="font-family: 'JetBrains Mono', monospace;">₹20</span>
      </div>
      <div class="calc-row">
        <span>GST & Campus Food Taxes:</span>
        <span style="font-family: 'JetBrains Mono', monospace;">₹30</span>
      </div>
      
      ${redemptionRowHtml}
      
      <div class="calc-row-total">
        <span style="font-size: 15px; font-weight: 900; color: #1C1917; text-transform: uppercase; letter-spacing: 0.05em;">Total Paid Amount:</span>
        <div class="total-amount-box">₹${Math.round(order.total)}</div>
      </div>
    </div>

    <!-- Loyalty Rewards points Star block -->
    <div class="points-star-bar">
      <div class="star-circle">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#CA8A04" style="color: #CA8A04;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <div style="flex-grow: 1; text-align: left;">
        <div style="font-size: 12.5px; font-weight: 900; color: #854D0E;">
          ${isPointsRedeemed ? `Applied Points Discount on this Royal Treat!` : `Earned +${order.pointsEarned} VIP XP Loyalty Points on this purchase!`}
        </div>
        <div style="font-size: 10px; font-weight: 700; color: #A16207; opacity: 0.85; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">
          PAYMENT METHOD USED: ${paymentModeLabel}
        </div>
      </div>
    </div>

    <!-- Gorgeous Floral branches Greeting card -->
    <div class="footer-greeting-card">
      <div style="display: flex; justify-content: center; margin-bottom: 10px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#E23744" style="color: #E23744;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>
      
      <div style="font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 900; color: #C0392B; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <img src="${logoUrl}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; border: 1.5px solid #D4AF37; vertical-align: middle;" alt="Campus Cakes" />
        <span>Thank you for celebrating with Campus Cakes! 🍰</span>
      </div>
      
      <div style="font-size: 11.5px; line-height: 1.6; color: #57534E; font-weight: 600; max-width: 480px; margin: 0 auto; position: relative; z-index: 2;">
        Bring or show this receipt to collect your instant orders from our stall at your campus and also for collecting delivery of your pre-orders. 
        <div style="margin-top: 6px; font-weight: 850; color: #9C7815; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">
          Unique Order Reference: #${orderId}
        </div>
      </div>

      <!-- Left branch floral arrangement background SVG -->
      <div style="position: absolute; left: -10px; bottom: -5px; opacity: 0.16; pointer-events: none;">
        <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 90 Q30 80, 40 40 Q45 20, 35 10" stroke="#9C7815" stroke-width="2" stroke-linecap="round"/>
          <path d="M22 75 Q15 65, 25 65 Z" fill="#D4AF37" stroke="#9C7815" stroke-width="1"/>
          <path d="M32 60 Q25 50, 35 50 Z" fill="#D4AF37" stroke="#9C7815" stroke-width="1"/>
          <path d="M38 42 Q32 32, 42 32 Z" fill="#D4AF37" stroke="#9C7815" stroke-width="1"/>
          <circle cx="35" cy="10" r="3" fill="#E23744"/>
        </svg>
      </div>
      <!-- Right branch floral arrangement background SVG -->
      <div style="position: absolute; right: -10px; bottom: -5px; opacity: 0.16; pointer-events: none; transform: scaleX(-1);">
        <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 90 Q30 80, 40 40 Q45 20, 35 10" stroke="#9C7815" stroke-width="2" stroke-linecap="round"/>
          <path d="M22 75 Q15 65, 25 65 Z" fill="#D4AF37" stroke="#9C7815" stroke-width="1"/>
          <path d="M32 60 Q25 50, 35 50 Z" fill="#D4AF37" stroke="#9C7815" stroke-width="1"/>
          <path d="M38 42 Q32 32, 42 32 Z" fill="#D4AF37" stroke="#9C7815" stroke-width="1"/>
          <circle cx="35" cy="10" r="3" fill="#E23744"/>
        </svg>
      </div>
    </div>

  </div>

</body>
</html>
  `;

  // Standard elegant file container write & download trigger
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.href = url;
  tempLink.download = `CampusCakes_Receipt_Order_${orderId}.html`;
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);
}
