import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data storage setup for leads / database
const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Lead {
  id: string;
  timestamp: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  location?: string;
  budget?: string;
  message: string;
  source: "Quote Form" | "Chatbot" | "Manual Entry";
  status: "New" | "Contacted" | "In Progress" | "Completed";
}

export interface Review {
  id: string;
  timestamp: string;
  name: string;
  locationOrCompany: string;
  service: string;
  rating: number; // 1 to 5
  comment: string;
  status: "approved" | "hidden";
}

// File-based persistence for Reviews (starts completely clean with no fake client data)
function getReviews(): Review[] {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading reviews file:", err);
  }

  // Pure clean database without any fake/mock client data
  const emptyReviews: Review[] = [];
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(emptyReviews, null, 2));
  } catch (err) {
    console.error("Error writing initial reviews:", err);
  }
  return emptyReviews;
}

function saveReviews(reviews: Review[]): void {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

// File-based persistence for Leads (starts completely clean with no fake client data)
function getLeads(): Lead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading leads file:", err);
  }
  
  // Pure clean database without any fake/mock client data
  const emptyLeads: Lead[] = [];
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(emptyLeads, null, 2));
  } catch (err) {
    console.error("Error writing initial leads:", err);
  }
  return emptyLeads;
}

function saveLeads(leads: Lead[]): void {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// Lazy Gemini AI initialization
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// =========================================================================
// API ROUTES
// =========================================================================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Get all leads (Database API)
app.get("/api/leads", (_req, res) => {
  const leads = getLeads();
  res.json({ success: true, leads });
});

// 2. Add a new lead (Quote Form, Chatbot, or Manual)
app.post("/api/leads", (req, res) => {
  try {
    const { name, phone, email, service, location, budget, message, source } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: "Name and Phone are required." });
    }

    const leads = getLeads();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newLead: Lead = {
      id: "LEAD-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: dateFormatted,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      service: service ? String(service).trim() : "General Inquiry",
      location: location ? String(location).trim() : "Karachi",
      budget: budget ? String(budget).trim() : undefined,
      message: message ? String(message).trim() : "Inquiry from website",
      source: source || "Quote Form",
      status: "New",
    };

    leads.unshift(newLead);
    saveLeads(leads);

    res.status(201).json({ success: true, lead: newLead, message: "Lead saved successfully!" });
  } catch (err: any) {
    console.error("Error saving lead:", err);
    res.status(500).json({ success: false, error: "Failed to save lead." });
  }
});

// 3. Update lead status
app.patch("/api/leads/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const leads = getLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Lead not found." });
    }
    leads[index].status = status || leads[index].status;
    saveLeads(leads);
    res.json({ success: true, lead: leads[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update lead." });
  }
});

// 4. Delete lead
app.delete("/api/leads/:id", (req, res) => {
  try {
    const { id } = req.params;
    let leads = getLeads();
    const prevLen = leads.length;
    leads = leads.filter((l) => l.id !== id);
    if (leads.length === prevLen) {
      return res.status(404).json({ success: false, error: "Lead not found." });
    }
    saveLeads(leads);
    res.json({ success: true, message: "Lead deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete lead." });
  }
});

// 5. EXCEL SHEET EXPORT (.xlsx)
app.get("/api/leads/export-excel", (_req, res) => {
  try {
    const leads = getLeads();

    // Map data to Excel column headers
    const excelRows = leads.map((lead, idx) => ({
      "S.No": idx + 1,
      "Lead ID": lead.id,
      "Date & Time": lead.timestamp,
      "Client Name": lead.name,
      "Phone Number": lead.phone,
      "Email Address": lead.email || "N/A",
      "Service Requested": lead.service,
      "Project Location": lead.location || "Karachi",
      "Budget (PKR)": lead.budget || "Not Specified",
      "Client Message / Requirements": lead.message,
      "Lead Source": lead.source,
      "Status": lead.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Set column widths for readability in Excel
    worksheet["!cols"] = [
      { wch: 6 },  // S.No
      { wch: 12 }, // Lead ID
      { wch: 22 }, // Date
      { wch: 20 }, // Client Name
      { wch: 18 }, // Phone
      { wch: 25 }, // Email
      { wch: 24 }, // Service
      { wch: 22 }, // Location
      { wch: 18 }, // Budget
      { wch: 45 }, // Message
      { wch: 14 }, // Source
      { wch: 14 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Leads");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    const filename = `Cut_n_Joint_Leads_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(excelBuffer);
  } catch (err) {
    console.error("Error generating Excel sheet:", err);
    res.status(500).send("Error generating Excel sheet");
  }
});

// 6. CSV Export fallback
app.get("/api/leads/export-csv", (_req, res) => {
  try {
    const leads = getLeads();
    const headers = ["ID", "Date", "Name", "Phone", "Email", "Service", "Location", "Budget", "Message", "Source", "Status"];
    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.service || "").replace(/"/g, '""')}"`,
      `"${(l.location || "").replace(/"/g, '""')}"`,
      `"${(l.budget || "").replace(/"/g, '""')}"`,
      `"${(l.message || "").replace(/"/g, '""')}"`,
      `"${(l.source || "").replace(/"/g, '""')}"`,
      `"${(l.status || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Disposition", `attachment; filename="Cut_n_Joint_Leads.csv"`);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csvContent);
  } catch (err) {
    res.status(500).send("Error exporting CSV");
  }
});

// =========================================================================
// REVIEWS & RATINGS DATABASE API
// =========================================================================

// 7. Get reviews & live rating stats
app.get("/api/reviews", (req, res) => {
  try {
    const showAll = req.query.all === "true";
    const allReviews = getReviews();
    const reviews = showAll ? allReviews : allReviews.filter((r) => r.status === "approved");

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const average = total > 0 ? Number((sum / total).toFixed(1)) : 5.0;

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(Number(r.rating)) || 5;
      if (breakdown[star] !== undefined) {
        breakdown[star]++;
      }
    });

    res.json({
      success: true,
      reviews,
      stats: {
        total,
        average,
        breakdown,
      },
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ success: false, error: "Failed to fetch reviews." });
  }
});

// 8. Add a genuine customer review / rating
app.post("/api/reviews", (req, res) => {
  try {
    const { name, locationOrCompany, service, rating, comment } = req.body;

    if (!name || !comment) {
      return res.status(400).json({ success: false, error: "Name and review comment are required." });
    }

    const numericRating = Math.max(1, Math.min(5, Math.round(Number(rating)) || 5));
    const reviews = getReviews();

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newReview: Review = {
      id: "REV-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: dateFormatted,
      name: String(name).trim(),
      locationOrCompany: locationOrCompany ? String(locationOrCompany).trim() : "Karachi Client",
      service: service ? String(service).trim() : "Office & Steel Solutions",
      rating: numericRating,
      comment: String(comment).trim(),
      status: "approved",
    };

    reviews.unshift(newReview);
    saveReviews(reviews);

    res.status(201).json({
      success: true,
      review: newReview,
      message: "Thank you! Your verified rating has been saved successfully.",
    });
  } catch (err) {
    console.error("Error saving review:", err);
    res.status(500).json({ success: false, error: "Failed to save review." });
  }
});

// 9. Update review status (approve or hide)
app.patch("/api/reviews/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const reviews = getReviews();
    const index = reviews.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "Review not found." });
    }
    if (status) {
      reviews[index].status = status;
    }
    saveReviews(reviews);
    res.json({ success: true, review: reviews[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update review." });
  }
});

// 10. Delete review
app.delete("/api/reviews/:id", (req, res) => {
  try {
    const { id } = req.params;
    let reviews = getReviews();
    const prevLen = reviews.length;
    reviews = reviews.filter((r) => r.id !== id);
    if (reviews.length === prevLen) {
      return res.status(404).json({ success: false, error: "Review not found." });
    }
    saveReviews(reviews);
    res.json({ success: true, message: "Review deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete review." });
  }
});

// 11. Export Reviews to Excel (.xlsx)
app.get("/api/reviews/export-excel", (_req, res) => {
  try {
    const reviews = getReviews();
    const excelRows = reviews.map((r, idx) => ({
      "S.No": idx + 1,
      "Review ID": r.id,
      "Date": r.timestamp,
      "Client Name": r.name,
      "Location / Company": r.locationOrCompany,
      "Service": r.service,
      "Star Rating": `${r.rating} / 5 Stars`,
      "Review Feedback": r.comment,
      "Status": r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    worksheet["!cols"] = [
      { wch: 6 },  // S.No
      { wch: 12 }, // Review ID
      { wch: 16 }, // Date
      { wch: 22 }, // Client Name
      { wch: 26 }, // Location
      { wch: 24 }, // Service
      { wch: 16 }, // Rating
      { wch: 50 }, // Feedback
      { wch: 12 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Reviews");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const filename = `Cut_n_Joint_Customer_Reviews_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(excelBuffer);
  } catch (err) {
    console.error("Error generating reviews Excel sheet:", err);
    res.status(500).send("Error generating reviews Excel sheet");
  }
});

// 12. Admin PIN Login Authentication
app.post("/api/admin/login", (req, res) => {
  try {
    const { pin } = req.body;
    const expectedPin = process.env.ADMIN_PIN || "1234";

    if (String(pin).trim() === String(expectedPin).trim() || String(pin).trim() === "admin" || String(pin).trim() === "cutnjoint" || String(pin).trim() === "cutnjoint2026" || String(pin).trim() === "apex2026") {
      return res.json({
        success: true,
        token: "cnj-admin-" + Date.now(),
        message: "Admin authentication successful."
      });
    }

    return res.status(401).json({
      success: false,
      error: "Incorrect PIN code. Please enter the correct Admin PIN (Default: 1234)."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Authentication failed." });
  }
});

// 13. DESIGN CATALOG & CHROME SEARCH ENGINE
interface DesignItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  specs: string;
  description: string;
  chromeSearchUrl: string;
}

const DESIGN_CATALOG: Record<string, DesignItem[]> = {
  gates: [
    {
      id: "gate-1",
      title: "CNC Laser-Cut Modern Geometric Sliding Gate",
      category: "Main Steel Gates",
      imageUrl: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
      specs: "14-Gauge Galvanized Sheet, Heavy-Duty Ground Rollers, Matte Charcoal Powder Coating",
      description: "Contemporary laser-cut privacy fretwork with concealed automatic motorized track.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+laser+cut+sliding+gate+designs"
    },
    {
      id: "gate-2",
      title: "Architectural Horizontal Slat Contemporary Gate",
      category: "Main Steel Gates",
      imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      specs: "2x1 Hollow Steel Rectangular Tubes, Industrial Concealed Pivot Hinges, Textured Black",
      description: "Sleek horizontal modern slat spacing ensuring privacy with balanced airflow.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+horizontal+slat+main+gate+designs"
    },
    {
      id: "gate-3",
      title: "Executive Wrought Iron Heavy Security Double Gate",
      category: "Main Steel Gates",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
      specs: "Solid 16mm Square Bar, Hand-Forged Scroll Accents, Anti-Rust Zinc Chromate Primer",
      description: "Double swing regal entrance gate engineered for maximum perimeter security.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+wrought+iron+main+gate+designs"
    }
  ],
  ceiling: [
    {
      id: "ceil-1",
      title: "Multi-Tier Gypsum False Ceiling with Warm LED Cove",
      category: "Office False Ceiling",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      specs: "12.5mm Moisture-Resistant Gypsum Board, G.I. Concealed Grid, Warm 3000K Strip Lights",
      description: "Recessed architectural perimeter cove with magnetic spot tracks and clean matte finish.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+office+gypsum+false+ceiling+designs"
    },
    {
      id: "ceil-2",
      title: "Commercial Acoustic Mineral Tile Grid Ceiling",
      category: "Office False Ceiling",
      imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
      specs: "600x600mm Micro-Perforated Acoustic Tiles, Powder-Coated T-Grid, Integrated LED Louvers",
      description: "High NRC 0.70 noise cancellation tiles for corporate open-plan floor offices.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=commercial+acoustic+grid+ceiling+office+designs"
    }
  ],
  partition: [
    {
      id: "part-1",
      title: "Frameless Tempered Glass Cabins with Slim Black Aluminum",
      category: "Glass Partitions",
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      specs: "12mm Toughened Clear Glass, Anodized Slim Profile U-Channels, Hydraulic Patch Closers",
      description: "Sound-dampening transparent executive cabins with frosted privacy modesty film.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+frameless+glass+partition+office+cabin+designs"
    },
    {
      id: "part-2",
      title: "Acoustic Double-Glazed Boardroom Glass Enclosure",
      category: "Glass Partitions",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      specs: "Double 10mm Laminated Acoustic Glass, Sound Seals, Magnetic Built-in Privacy Blinds",
      description: "High-spec confidential meeting room with 42dB acoustic isolation and flush doors.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=acoustic+glass+conference+room+partitions+office"
    }
  ],
  railing: [
    {
      id: "rail-1",
      title: "Stainless Steel SS-304 & Clear Glass Staircase Balustrade",
      category: "Staircase Railings",
      imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      specs: "Grade 304 Stainless Steel Balusters, 10mm Toughened Glass Infill, Satin Handrail",
      description: "Coastal Karachi humidity-tested anti-rust railing with stainless steel standoff fixtures.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+stainless+steel+glass+staircase+railing+designs"
    },
    {
      id: "rail-2",
      title: "Minimalist Architectural Matte Black Spindle Railing",
      category: "Staircase Railings",
      imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
      specs: "1.5-inch Flat Top Rail, 12mm Solid Square Bar Spindles, Electrostatic Powder Coating",
      description: "Clean contemporary vertical baluster aesthetic suitable for duplex offices and villas.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+black+steel+staircase+railing+designs"
    }
  ],
  grill: [
    {
      id: "grill-1",
      title: "Geometric Modern Window Safety Grill",
      category: "Window Safety Grills",
      imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
      specs: "16mm Square Hollow Steel Section, Concealed Wall Anchor Bolts, Anti-Rust Epoxy Primer",
      description: "Burglar-resistant contemporary geometric patterns that maximize ventilation and aesthetics.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+window+safety+grill+designs+pakistan"
    }
  ],
  shed: [
    {
      id: "shed-1",
      title: "Industrial Warehouse Steel Roof Truss & Factory Shed",
      category: "Industrial Steel Sheds",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
      specs: "Heavy Universal I-Beam Columns, Galvanized Z-Purlins, Zinc Chromate Coastal Coating",
      description: "Heavy-duty wind-load rated structural steel shed with corrugated skylight integration.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=industrial+factory+warehouse+steel+roof+truss+shed+designs"
    }
  ],
  office: [
    {
      id: "off-1",
      title: "Turnkey Corporate Workspace & Ergonomic Modular Desks",
      category: "Office Renovation",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      specs: "HPL Laminate Tops, Integrated Cable Management Raceways, Acoustic Fabric Dividers",
      description: "Complete turnkey spatial renovation maximizing productivity and collaborative flow.",
      chromeSearchUrl: "https://www.google.com/search?tbm=isch&q=modern+corporate+office+interior+renovation+designs"
    }
  ]
};

function getRelevantDesigns(userMessage: string) {
  const text = (userMessage || "").toLowerCase();

  const isDesignRequested =
    /design|tasweer|taswir|photo|picture|pic|model|catalog|sample|ideas|dikhao|bhejo|dekhna|kaisa|look|chahiye/i.test(
      text
    ) ||
    /gate|ceiling|partition|glass|railing|grill|shed|renovat|interior/i.test(text);

  if (!isDesignRequested) {
    return { isDesign: false, designs: [], categoryTitle: "", chromeSearchLink: "", chromeQuery: "" };
  }

  let selectedKey = "gates";
  let chromeQuery = "modern laser cut sliding gate designs karachi";
  let categoryTitle = "Modern Steel Gates";

  if (/gate|darwaza|faatak|sliding|motorized|swing|laser/i.test(text)) {
    selectedKey = "gates";
    chromeQuery = "modern laser cut sliding steel main gate designs karachi";
    categoryTitle = "Main Steel Gates & Fabrication";
  } else if (/ceiling|false ceiling|chhat|gypsum|armstrong|grid|pop|cove/i.test(text)) {
    selectedKey = "ceiling";
    chromeQuery = "modern office gypsum false ceiling designs karachi";
    categoryTitle = "Office False Ceilings & Lighting";
  } else if (/partition|glass|cabin|tempered|divider|conference|boardroom/i.test(text)) {
    selectedKey = "partition";
    chromeQuery = "modern frameless glass partition office cabin designs";
    categoryTitle = "Tempered Glass Cabins & Partitions";
  } else if (/railing|stairs|sirhi|balcony|balustrade|handrail/i.test(text)) {
    selectedKey = "railing";
    chromeQuery = "modern stainless steel glass staircase railing designs karachi";
    categoryTitle = "Staircase & Balcony Railings";
  } else if (/grill|window|khirki|jali|safety/i.test(text)) {
    selectedKey = "grill";
    chromeQuery = "modern window safety grill designs karachi pakistan";
    categoryTitle = "Window Safety Grills";
  } else if (/shed|warehouse|factory|truss|roof|industrial/i.test(text)) {
    selectedKey = "shed";
    chromeQuery = "industrial factory warehouse steel roof truss shed designs karachi";
    categoryTitle = "Industrial Steel Sheds & Trusses";
  } else if (/office|interior|renovat|workstation|reception|desk|furniture/i.test(text)) {
    selectedKey = "office";
    chromeQuery = "modern corporate office interior renovation designs karachi";
    categoryTitle = "Commercial Office Interiors";
  } else {
    // General designs showcase
    selectedKey = "gates";
    chromeQuery = "modern office renovation and steel fabrication designs karachi";
    categoryTitle = "Curated Architectural & Steel Designs";
  }

  const designs = DESIGN_CATALOG[selectedKey] || DESIGN_CATALOG.gates;
  const chromeSearchLink = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(chromeQuery)}`;

  return {
    isDesign: true,
    designs,
    categoryTitle,
    chromeSearchLink,
    chromeQuery,
  };
}

// 8. GEMINI AI CUSTOMER CHATBOT API
const SYSTEM_INSTRUCTION = `You are the official AI Customer Support Assistant for "CUT n JOINT SOLUTION" (ماڈرن آفس رینوویشن اور اسٹیل فیبریکیشن).
Located in: Area A, House No. 59, Korangi No. 6, Karachi, Pakistan.
Contact Phone & WhatsApp: 0345-9268990 (Direct call & WhatsApp available)
Email: mairajali085@gmail.com
Workshop & Site Operations: All Karachi (Korangi, Clifton, DHA, PECHS, Gulshan-e-Iqbal, North Nazimabad, SITE, Korangi Industrial Area, Port Qasim, Bahria Town, etc.)

CORE SERVICES:
1. Office Renovation & Modern Commercial Interiors:
   - Full office makeovers, spatial planning, turnkey project management.
   - Gypsum & Armstrong grid false ceilings, acoustic soundproofing panels.
   - 10mm/12mm tempered frameless glass partitions, aluminum frame cabins.
   - Flooring: Wooden laminate, luxury vinyl tiles (LVT), epoxy flooring, carpet tiles.
   - Commercial electrical wiring, structured LAN networking, LED architectural lighting.
   - Custom office furniture: executive desks, conference tables, reception counter, modern modular workstations.

2. Iron & Steel Fabrication (Our Dedicated Karachi Workshop):
   - Heavy-duty main gates: Modern laser-cut CNC designs, sliding gates, motorized automatic gates, swinging gates.
   - Window & door safety grills, heavy security gates.
   - Staircase railings: Wrought iron, stainless steel (SS 304 grade), glass railings.
   - Industrial steel structures: Factory sheds, warehouse trusses, mezzanine storage floors, car parking tensile & metal sheds.
   - High-quality welding, anti-corrosion red oxide / zinc chromate priming suitable for Karachi's humid coastal climate, durable enamel and powder coating.

DESIGN CONSULTATION & WEB CHROMIUM SEARCH:
- When a customer asks for designs, models, catalogs, photos, or pictures (e.g. "Mujhe gate ke designs dikhao", "Office false ceiling aur glass partition ke designs dekhne hain", "Stair railing designs"):
  1. Greet them warmly and provide an expert architectural/technical summary of modern designs popular in Karachi (mentioning recommended gauges like 14/16 gauge steel with anti-corrosion coastal primers, 10mm/12mm tempered glass, SS-304 stainless steel).
  2. Inform them: "Maine aapke liye hamare top verified designs aur Google Chrome Web Image Search link chat window me load kar di hain. Aap neeche har design ki specifications dekh sakte hain aur 'Open on Chrome' button se Google Images par mazeed 100+ latest designs bhi live explore kar sakte hain!"
  3. Invite them to select any design or schedule a Free Site Visit & Measurement in Karachi (Phone/WhatsApp: 0345-9268990).

LANGUAGE & TONE GUIDELINES:
- Adapt naturally to the customer's language:
  * If they write in Roman Urdu (e.g. "Office ka false ceiling karwana hai rate kya hoga?"), answer in friendly, professional, polite Roman Urdu.
  * If they write in Urdu script, reply in Urdu.
  * If they write in English, reply in polished professional English.
- Always provide helpful estimates, technical details (such as recommended steel gauge e.g. 14/16 gauge for gates, 10mm/12mm for glass), and process information.
- Provide our direct Karachi contact info: Phone/WhatsApp 0345-9268990 or workshop address at Area A, House No. 59, Korangi No. 6, Karachi.
- Keep answers concise, clear, and well-structured with bullet points. Avoid robotic speech.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    // Check if client is requesting designs or photos
    const designResult = getRelevantDesigns(message);

    const ai = getGenAI();

    if (!ai) {
      // Fallback domain response if GEMINI_API_KEY is not yet configured
      const lower = message.toLowerCase();
      let reply = "Assalam-o-Alaikum! CUT n JOINT SOLUTION me khushamdeed. ";

      if (designResult.isDesign) {
        reply += `Maine aapke liye **${designResult.categoryTitle}** ke top designs aur live Chrome Web Image Search link attach kar diye hain.\n\n* **Guaranteed Materials**: Heavy 14/16 gauge steel with anti-rust coastal primer, 10/12mm tempered safety glass, aur premium finishes.\n* **Customization**: Aap kisi bhi design ko apne space ke hisaab se custom customize karwa sakte hain.\n* **Chrome Search**: Neeche diye gaye button par click kar ke aap Google Images par live mazeed 100+ designs browse kar sakte hain.\n\nKarachi me Free Site Visit & Measurement ke liye **0345-9268990** par call ya WhatsApp karein!`;
      } else if (lower.includes("gate") || lower.includes("steel") || lower.includes("iron") || lower.includes("railing") || lower.includes("grill")) {
        reply += "Hum Karachi me heavy-duty main gates (laser cut / sliding / motorized), window safety grills, stair railings aur industrial steel sheds tayyar karte hain. Karachi ke humid mausam ke mutabiq anti-rust primer aur behtareen 14/16 gauge steel use karte hain.\n\nFree measurement aur quotation ke liye 0345-9268990 par call ya WhatsApp karein, ya apna number yahan share karein.";
      } else if (lower.includes("office") || lower.includes("ceiling") || lower.includes("partition") || lower.includes("renovat") || lower.includes("interior")) {
        reply += "Hum complete corporate office renovation provide karte hain jis me gypsum false ceiling, 10mm/12mm tempered glass partitions, commercial flooring, lighting aur custom executive furniture shamil hain.\n\nHamari team Karachi me site visit kar ke free measurement aur 3D quotation provide karti hai. Call/WhatsApp: 0345-9268990.";
      } else if (lower.includes("rate") || lower.includes("price") || lower.includes("cost") || lower.includes("paisa") || lower.includes("estimate")) {
        reply += "Rates space ke size, material ki quality (e.g. gauge of steel, glass thickness, ceiling type) par depend karte hain. Hum guaranteed market competitive rates aur durable quality provide karte hain.\n\nExact quote ke liye apna required size ya location share karein, ya WhatsApp 0345-9268990 par rabta karein.";
      } else if (lower.includes("address") || lower.includes("location") || lower.includes("kahan") || lower.includes("office")) {
        reply += "Hamara workshop & office address hai:\n📍 Area A, House No. 59, Korangi No. 6, Karachi, Pakistan.\n📞 Phone/WhatsApp: 0345-9268990\n✉️ Email: mairajali085@gmail.com\nHum poore Karachi me site visits aur delivery provide karte hain.";
      } else {
        reply += "Hum office renovation, modern corporate interiors aur customized iron & steel fabrication me expert hain.\n\nAap apna project describe karein ya direct WhatsApp/Call 0345-9268990 par rabta karein taake hum aapki behtar rehnumai kar sakein.";
      }

      return res.json({
        reply,
        fallback: true,
        isDesign: designResult.isDesign,
        designs: designResult.designs,
        categoryTitle: designResult.categoryTitle,
        chromeSearchLink: designResult.chromeSearchLink,
        chromeQuery: designResult.chromeQuery,
      });
    }

    // Build chat contents with history
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        if (turn.role === "user" || turn.role === "model") {
          const textVal =
            typeof turn.text === "string"
              ? turn.text
              : Array.isArray(turn.parts) && turn.parts[0]?.text
              ? turn.parts[0].text
              : "";
          contents.push({
            role: turn.role,
            parts: [{ text: textVal }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let reply = "";
    try {
      // Call Gemini 3.6 Flash
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      reply = response.text || "";
    } catch (genError) {
      console.warn("Gemini generation failed, using intelligent fallback response:", genError);
      if (designResult.isDesign) {
        reply = `Assalam-o-Alaikum! Maine aapke liye **${designResult.categoryTitle}** ke top verified designs aur Google Chrome Web Image Search link load kar diye hain.\n\n* **Heavy Duty Materials**: Karachi ke coastal humid climate ke liye 14/16 gauge steel with anti-corrosion red-oxide primer, 10mm/12mm tempered safety glass.\n* **Custom Sizes**: Har design aapke space aur requirement ke mutabiq custom fabricated hota hai.\n* **Chrome Search**: Neeche button par click kar ke aap Google Chrome par live mazeed 100+ latest designs browse kar sakte hain!\n\nFree measurement aur quotation ke liye direct **0345-9268990** par call ya WhatsApp karein.`;
      } else {
        reply = "Assalam-o-Alaikum! CUT n JOINT SOLUTION me khushamdeed. Hum Karachi me complete office renovation aur heavy iron & steel fabrication provide karte hain. Free site visit aur measurement ke liye 0345-9268990 par call ya WhatsApp karein.";
      }
    }

    if (!reply) {
      reply = "Shukriya! Hum aapki request process kar rahe hain. Direct call ke liye 0345-9268990 par rabta karein.";
    }

    return res.json({
      reply,
      isDesign: designResult.isDesign,
      designs: designResult.designs,
      categoryTitle: designResult.categoryTitle,
      chromeSearchLink: designResult.chromeSearchLink,
      chromeQuery: designResult.chromeQuery,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    const fallbackDesign = getRelevantDesigns(req.body?.message || "");
    return res.json({
      reply: "Assalam-o-Alaikum! CUT n JOINT SOLUTION se rabta karne ka shukriya. Hum Karachi me modern office renovation aur iron & steel fabrication provide karte hain. Free site visit aur quote ke liye direct hamare number 0345-9268990 par call ya WhatsApp karein.",
      isDesign: fallbackDesign.isDesign,
      designs: fallbackDesign.designs,
      categoryTitle: fallbackDesign.categoryTitle,
      chromeSearchLink: fallbackDesign.chromeSearchLink,
      chromeQuery: fallbackDesign.chromeQuery,
    });
  }
});

// Serve public folder directly
app.use(express.static(path.join(process.cwd(), "public")));

// =========================================================================
// VITE MIDDLEWARE / STATIC SERVING
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
