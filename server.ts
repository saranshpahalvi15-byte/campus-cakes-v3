import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { Resend } from "resend";
import nodemailer from "nodemailer";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Customer Support AI Chat
  app.post("/api/support/chat", async (req, res) => {
    try {
      const { messages, user, selectedCampus, campuses, cakeProducts, kioskInventory } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare conversation history
      const contents = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Prepare student context dynamically
      let studentContext = "";
      if (user) {
        studentContext = `
---
CURRENT STUDENT PROFILE (Grounded Real-time Context):
- Name: ${user.name || "Student"}
- Email: ${user.email || "N/A"}
- Phone: ${user.phone || "N/A"}
- Campus Address: ${user.address || "Not specified yet"}
- Campus ID: ${user.campusId || "N/A"}
- Reward Points (XP): ${user.rewardPoints || 0} XP
- Saved Celebrations: ${user.savedCelebrationsCount || 0} event(s)
- Wallet Balance: ₹${user.walletBalance || 0}
`;
      }

      if (selectedCampus) {
        studentContext += `\n- STUDENT'S CURRENTLY SELECTED CAMPUS / ACTIVE HUBS LOCATION: "${selectedCampus.name}" (Delivery/Kiosk Hub Spot: ${selectedCampus.location})\n`;
      }
      studentContext += `---`;

      // Dynamically load active campuses
      let campusesContextStr = "";
      if (campuses && Array.isArray(campuses)) {
        campusesContextStr = campuses.map((c: any) => {
          return `- ${c.name} (${c.location}) -> ${c.active ? "ACTIVE & LIVE DELIVERY/KIOSK HUB" : "COMING SOON (Inactive)"}`;
        }).join("\n");
      } else {
        campusesContextStr = `- ABC University (Main Campus) (Hub & Central Quad) -> ACTIVE & LIVE DELIVERY/KIOSK HUB
- XYZ College of Engineering (Tech Quad, Block D) -> ACTIVE & LIVE DELIVERY/KIOSK HUB
- PQR Institute of Business (East Campus Gate) -> ACTIVE & LIVE DELIVERY/KIOSK HUB
- NSIT Campus (Coming Soon) (Metro Junction Block) -> COMING SOON (Inactive)
- DCE Technical Camps (Coming Soon) (Academic Galleria) -> COMING SOON (Inactive)`;
      }

      // Dynamically load active product catalog
      let catalogContextStr = "";
      if (cakeProducts && Array.isArray(cakeProducts)) {
        catalogContextStr = cakeProducts.map((p: any, idx: number) => {
          const weightsStr = p.weights ? p.weights.map((w: any) => `${w}kg`).join(", ") : "N/A";
          const flavorsStr = p.flavors ? p.flavors.join(", ") : "N/A";
          return `${idx + 1}. ${p.name} (${p.category})
   - Price: ₹${p.price}
   - Available Weights: ${weightsStr}
   - Available Flavors: ${flavorsStr}
   - Eggless (100% Vegetarian): ${p.isEggless ? "Yes" : "No"}
   - Prep/Delivery Time Required: ${p.deliveryTime || "24 Hours"}`;
        }).join("\n\n");
      } else {
        catalogContextStr = "No active products returned from client context.";
      }

      // Dynamically load kiosk emergency inventory
      let kioskContextStr = "";
      if (kioskInventory && Array.isArray(kioskInventory)) {
        kioskContextStr = kioskInventory.map((k: any) => {
          return `- ${k.name} -> Price: ₹${k.price} | Flavor: ${k.flavor} | Real-time Stock remaining at Kiosk: ${k.remainingStock}/${k.totalStock} units`;
        }).join("\n");
      } else {
        kioskContextStr = "- Campus Truffle Smash: ₹449\n- Red Velvet Classic Kiosk Joy: ₹449\n- Bento Kiosk Surprise: ₹299\n- Emergency Pineapple Dream: ₹349";
      }

      const systemInstruction = `You are "Bakery Coordinator", a warm, empathetic, polite, and extremely knowledgeable AI Student Support Coordinator for "Campus Cakes" (the premium college-campus-focused bakery service).

${studentContext}

KEY BRAND VALUE & OUR STORY:
Campus Cakes delivers premium, handcrafted custom-made cakes, customized celebrations, and gourmet bento boxes directly to university dorm rooms, library foyers, study rooms, and canteens. Every cake is custom-made by master pastry chefs. We partner with vetted elite bakeries near each campus to keep startup overhead low and freshness high.

- Founded by Tanisha (Founder) and Saransh (Co-Founder): Two young innovators united by a shared vision of transforming college campus celebrations.
  - Tanisha: Founder and Visionary who envisioned a student-first celebration brand making premium, customized treats and confectionery accessible, affordable, and convenient.
  - Saransh: Co-Founder and Technical Architect who spearheaded the technology and digital innovation behind the brand, designing and developing the website, the digital ecosystem, and this AI Support Chatbot!
  - Together: They combined entrepreneurship, creativity, and technology to build a modern, tech-driven platform for seamless online ordering, smart features, real-time tracking, and delightful celebration experiences.

- Our Story: Founded to make college campus celebrations simple, affordable, and memorable, addressing student struggles in finding high-quality, budget-friendly, easily customizable celebration items like handcrafted cakes, cupcakes, bento treat boxes, and photo confectionery.
- Our Aim: To make premium-quality sweet delicacies and customized celebrations accessible to every student with affordable pricing, hassle-free ordering, complete customization, and reliable service.
- Our Vision: To become India's leading campus-focused dessert and celebration brand by revolutionizing celebrations, building a tech-driven platform connecting colleges nationwide, and empowering young entrepreneurs.
- Our Core Values:
  * Quality First: Freshly prepared using quality ingredients.
  * Customer Happiness: Every celebration matters; every customer deserves the best.
  * Innovation: Continuously introducing smart features for ease and enjoyment.
  * Affordability: Great celebrations and sweet sharing treats should be accessible to everyone.
  * Trust & Transparency: Honest pricing, reliable service, keeping customers informed.
- Our Promise: Deliver fresh celebration goods, reliable service, and enjoyable ordering experiences that turn special occasions into lasting memories.

---
REAL-TIME ACTIVE CAMPUS HUBS:
Below are our actual currently configured campus spots. When answering location, pickup, or dine-in queries, you MUST refer to these locations exactly. If a campus is "COMING SOON", let the student know we do not serve them yet but are opening there soon!

${campusesContextStr}

---
REAL-TIME PRODUCT CATALOG:
Use ONLY these exact prices, categories, weights, and flavors when students ask about cakes from our menu. Do not invent or use old hardcoded items if they are not in this list:

${catalogContextStr}

---
CAMPUS KIOSK INVENTORY (Instant Pickup/Reservation):
If a student needs a cake right now, we keep emergency cakes in live refrigeration. Refer to this real-time inventory and current stock levels:

${kioskContextStr}

---
VIP XP LOYALTY PROGRAM:
- Every student earns reward points (XP) on purchases.
- Points value: 10 points = ₹1 of direct discount during checkout!
- Loyalty Tiers:
  - Bronze: 0 - 150 XP
  - Silver: 151 - 500 XP
  - Gold: 501 - 1000 XP
  - Platinum: 1000+ XP (Unlocks VIP express dispatch and bespoke packaging ribbon upgrades)

---
OPERATIONAL RULES & POLICIES:
- Delivery Hours: 08:00 AM to 11:30 PM daily.
- Preorder Rules: Pre-ordered themed or custom cakes require exactly 24-hours advance prep.
- Cancelations & Refunds: Cancelations made at least 12 hours before the scheduled slot get a 100% full refund. Kiosk reservations are held for 1.5 hours before auto-releasing.
- Damage / Compensation Guarantee: If a cake arrives with damaged frosting or the delivery partner gets delayed, direct the student to notify our helpline at +91 99887 76655. We replace the cake or process a 100% cash-back refund.

---
COMMUNICATION STYLE:
- Greet students warmly by their name (e.g. "Hello ${user ? user.name : "there"}!").
- Relate your answers directly to their current profile, especially their currently selected campus (${selectedCampus ? selectedCampus.name : "No campus selected yet"}) so they get fully personalized assistance.
- Mention their current Reward Points or Wallet Balance when discussing loyalty or pricing, if relevant.
- Write answers in gorgeous, highly scannable Markdown formatting. Use bolding, clear tables, and elegant lists.
- Be enthusiastic, reassuring, collegiate, and empathetic. Never make up order numbers or details.
- Always offer clear next steps. Keep responses concise but complete and professional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.5,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Error in AI support chat:", err);
      res.status(500).json({ error: err.message || "An error occurred in server-side AI generation." });
    }
  });

  // API Route: Order Confirmation Email Dispatcher
  app.post("/api/orders/confirm", async (req, res) => {
    try {
      const { order } = req.body;
      if (!order) {
        return res.status(400).json({ error: "No order object provided." });
      }

      const { id, customerName, userEmail, items, total } = order;
      const recipientEmail = userEmail || order.customerEmail || "unverified@campus-cakes.com";
      const orderId = id || "ORD-UNKNOWN";

      const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const host = req.headers.host || "localhost:3000";
      const appUrl = process.env.APP_URL || `${protocol}://${host}`;

      const logoPath = path.join(process.cwd(), "public", "brand_logo.jpg");
      let logoSrc = `${appUrl}/brand_logo.jpg`;
      if (fs.existsSync(logoPath)) {
        try {
          const logoBuffer = fs.readFileSync(logoPath);
          logoSrc = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
        } catch (e) {
          console.warn("Failed to convert logo to base64 data URI:", e);
        }
      }

      const brandName = "Campus Cakes";
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      const itemsHtml = (items || [])
        .map(
          (item: any) =>
            `<tr>
               <td style="padding: 12px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.15);">
                 <div style="font-weight: 700; color: #FEFAF6; font-size: 14px; font-family: 'Inter', Arial, sans-serif;">${item.name}</div>
                 ${item.selectedWeight ? `<div style="font-size: 11px; color: #D4AF37; margin-top: 3px; font-family: 'Inter', Arial, sans-serif;">⚖️ Weight: ${item.selectedWeight}kg</div>` : ""}
                 ${item.selectedFlavor ? `<div style="font-size: 11px; color: #FBCFE8; margin-top: 2px; font-family: 'Inter', Arial, sans-serif;">🍰 Flavor: ${item.selectedFlavor}</div>` : ""}
               </td>
               <td style="padding: 12px 0; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.15); color: #FEFAF6; font-size: 13px; font-family: 'Inter', Arial, sans-serif; font-weight: 600;">${item.quantity || item.qty || 1}</td>
               <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid rgba(212, 175, 55, 0.15); color: #D4AF37; font-weight: 700; font-size: 14px; font-family: 'Inter', Arial, sans-serif;">₹${item.price}</td>
             </tr>`
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Campus Cakes Order is Confirmed!</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #070102; color: #FEFAF6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070102; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 540px; background-color: #140407; border: 1px solid #D4AF37; border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 35px rgba(212, 175, 55, 0.15);">
                  
                  <!-- Header Text -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <h1 style="font-family: 'Georgia', serif; font-size: 32px; font-weight: 800; color: #D4AF37; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">
                        Campus Cakes
                      </h1>
                      <div style="font-size: 11px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; opacity: 0.85;">
                        Freshly Baked Campus Celebrations
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 24px;">
                      <h2 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 22px; font-style: italic; color: #FEFAF6; margin: 0 0 12px 0;">Your Sweet Celebration is Booked! ✨</h2>
                      
                      <p style="font-size: 14px; color: #D1D5DB; line-height: 1.6; margin: 0 0 14px 0;">
                        Hi <strong>${customerName || "there"}</strong>,
                      </p>
                      
                      <p style="font-size: 13px; color: #D1D5DB; line-height: 1.6; margin: 0 0 20px 0;">
                        We have received your order and sent the recipe details to our expert campus baking kitchen team. They are already hand-selecting the finest local ingredients to bake your order to absolute perfection.
                      </p>

                      <!-- Reference Badge -->
                      <div style="text-align: center; margin-bottom: 28px;">
                        <span style="background-color: rgba(212, 175, 55, 0.08); border: 1px solid #D4AF37; padding: 8px 22px; border-radius: 50px; font-size: 13px; font-weight: 700; color: #D4AF37; display: inline-block; letter-spacing: 0.5px;">
                          Order Reference: #${orderId}
                        </span>
                      </div>

                      <!-- Preparation Tracker Card -->
                      <div style="background: rgba(250, 247, 242, 0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 28px;">
                        <h3 style="font-size: 11px; font-weight: 800; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px 0; font-family: Arial, sans-serif;">Preparation Tracker</h3>
                        
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="24" valign="middle">
                              <span style="width: 12px; height: 12px; border-radius: 50%; background-color: #D4AF37; display: inline-block;"></span>
                            </td>
                            <td style="padding-left: 10px;">
                              <div style="font-size: 13px; font-weight: 700; color: #D4AF37;">1. Order Booked & Confirmed</div>
                              <div style="font-size: 11px; color: #8E7C80; margin-top: 2px;">Verified securely and sent to kitchen</div>
                            </td>
                          </tr>
                          <tr>
                            <td width="24" align="center" style="padding: 4px 0;">
                              <div style="height: 16px; border-left: 1.5px dashed rgba(212, 175, 55, 0.4); margin-left: 5px;"></div>
                            </td>
                            <td></td>
                          </tr>
                          <tr>
                            <td width="24" valign="middle">
                              <span style="width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(212, 175, 55, 0.4); display: inline-block;"></span>
                            </td>
                            <td style="padding-left: 10px;">
                              <div style="font-size: 13px; font-weight: 700; color: #FEFAF6;">2. Baking & Custom Artistry</div>
                              <div style="font-size: 11px; color: #8E7C80; margin-top: 2px;">Hand-crafted decoration, frosting & details</div>
                            </td>
                          </tr>
                          <tr>
                            <td width="24" align="center" style="padding: 4px 0;">
                              <div style="height: 16px; border-left: 1.5px dashed rgba(212, 175, 55, 0.4); margin-left: 5px;"></div>
                            </td>
                            <td></td>
                          </tr>
                          <tr>
                            <td width="24" valign="middle">
                              <span style="width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(212, 175, 55, 0.4); display: inline-block;"></span>
                            </td>
                            <td style="padding-left: 10px;">
                              <div style="font-size: 13px; font-weight: 700; color: #FEFAF6;">3. Handover & Delivery</div>
                              <div style="font-size: 11px; color: #8E7C80; margin-top: 2px;">Packed in insulated box and out to your campus address</div>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Order Summary Table -->
                      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                          <tr>
                            <th align="left" style="padding-bottom: 10px; color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #D4AF37; font-family: Arial, sans-serif;">Item</th>
                            <th align="center" width="50" style="padding-bottom: 10px; color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #D4AF37; font-family: Arial, sans-serif;">Qty</th>
                            <th align="right" width="90" style="padding-bottom: 10px; color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #D4AF37; font-family: Arial, sans-serif;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>

                      <!-- Total -->
                      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="right">
                            <div style="font-size: 12px; color: #8E7C80;">Grand Total Paid</div>
                            <div style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 32px; font-weight: 800; color: #FEFAF6; margin-top: 4px;">₹${total}</div>
                          </td>
                        </tr>
                      </table>

                      <!-- Action Button -->
                      <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${appUrl}" style="background: #D4AF37; color: #070102 !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 16px 32px; border-radius: 50px; display: block; text-align: center; letter-spacing: 0.5px;">
                          TRACK YOUR ORDER LIVE ➔
                        </a>
                      </div>

                      <hr style="border: none; border-top: 1px solid rgba(212, 175, 55, 0.2); margin: 24px 0 20px 0;" />

                      <p style="font-size: 12px; color: #8E7C80; line-height: 1.6; text-align: center; margin: 0 0 16px 0;">
                        Need to make any modifications? Reach our campus student helpline directly at <strong>+91 99887 76655</strong> or reply to this receipt.
                      </p>

                      <p style="font-family: 'Georgia', serif; font-style: italic; font-size: 16px; color: #D4AF37; text-align: center; margin: 0;">
                        With sweet regards,<br>
                        <strong>The Campus Cakes Team</strong>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      let deliveryMethod = "simulated";
      let emailSent = false;
      let errorDetails: string | null = null;

      if (resendApiKey) {
        deliveryMethod = "resend";
        try {
          const resendClient = new Resend(resendApiKey);
          const response = await resendClient.emails.send({
            from: `${brandName} <${fromEmail}>`,
            to: recipientEmail,
            subject: `Your ${brandName} order is confirmed! 🎂`,
            html,
          });

          if (response && (response as any).error) {
            const resErr = (response as any).error;
            console.error(`[Resend] API returned error:`, resErr);
            errorDetails = resErr.message || JSON.stringify(resErr);
            emailSent = false;
          } else {
            emailSent = true;
            console.log(`[Resend] Confirmation email sent successfully for Order #${orderId} to ${recipientEmail}`);
          }
        } catch (err: any) {
          console.error(`[Resend] Failed to send confirmation email:`, err);
          errorDetails = err.message || String(err);
          emailSent = false;
        }
      } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        deliveryMethod = "gmail";
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD,
            },
          });
          const logoPath = path.join(process.cwd(), "public", "brand_logo.jpg");
          const attachments: any[] = [];
          if (fs.existsSync(logoPath)) {
            attachments.push({
              filename: "brand_logo.jpg",
              path: logoPath,
              cid: "brand_logo",
            });
          }
          await transporter.sendMail({
            from: `"${brandName}" <${process.env.GMAIL_USER}>`,
            to: recipientEmail,
            subject: `Your ${brandName} order is confirmed! 🎂`,
            html,
            attachments,
          });
          emailSent = true;
          console.log(`[Gmail] Confirmation email sent successfully for Order #${orderId} to ${recipientEmail}`);
        } catch (err: any) {
          console.error(`[Gmail] Failed to send confirmation email:`, err);
          errorDetails = err.message || String(err);
        }
      } else {
        console.log(`\n======================================================`);
        console.log(`📧 [CAMPUS CAKES] SIMULATED EMAIL CONFIRMATION DISPATCH`);
        console.log(`======================================================`);
        console.log(`Order Number : #${orderId}`);
        console.log(`Customer     : ${customerName}`);
        console.log(`Email to     : ${recipientEmail}`);
        console.log(`Total Price  : ₹${total}`);
        console.log(`Items count  : ${(items || []).length}`);
        console.log(`======================================================\n`);
        emailSent = true;
      }

      return res.json({
        success: true,
        emailSent,
        deliveryMethod,
        recipientEmail,
        errorDetails,
      });
    } catch (error: any) {
      console.error("Error inside order confirmation email endpoint:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running securely on port ${PORT}`);
  });
}

startServer();
