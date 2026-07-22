import idolDagadusheth from "@/assets/idol-dagadusheth.jpg";
import idolGauri from "@/assets/idol-gauri.jpg";
import idolEco from "@/assets/idol-eco.jpg";

export type Category = "Ganapati" | "Gauri" | "Devi";

export interface Model {
  id: string;
  sku: string;
  name: string;
  category: Category;
  size: string;
  photo: string;
  purchasePrice: number;
  sellingPrice: number;
  rawMaterialCost: number;
  available: number;
  lowStockAt: number;
  wholesaleSold: number;
  retailSold: number;
}

export const models: Model[] = [
  {
    id: "1",
    sku: "GN-24-DG",
    name: 'Dagadusheth 24" Gold',
    category: "Ganapati",
    size: "24 inch",
    photo: idolDagadusheth,
    purchasePrice: 9500,
    sellingPrice: 12500,
    rawMaterialCost: 1800,
    available: 124,
    lowStockAt: 150,
    wholesaleSold: 320,
    retailSold: 88,
  },
  {
    id: "2",
    sku: "GR-18-ML",
    name: "Mahalaxmi Gauri Set",
    category: "Gauri",
    size: "18 inch",
    photo: idolGauri,
    purchasePrice: 3600,
    sellingPrice: 4800,
    rawMaterialCost: 900,
    available: 42,
    lowStockAt: 50,
    wholesaleSold: 145,
    retailSold: 62,
  },
  {
    id: "3",
    sku: "GN-12-EC",
    name: 'Eco-Friendly 12" Red',
    category: "Ganapati",
    size: "12 inch",
    photo: idolEco,
    purchasePrice: 850,
    sellingPrice: 1250,
    rawMaterialCost: 320,
    available: 512,
    lowStockAt: 200,
    wholesaleSold: 980,
    retailSold: 410,
  },
  {
    id: "4",
    sku: "GN-36-LB",
    name: 'Lalbaugcha Raja 36"',
    category: "Ganapati",
    size: "36 inch",
    photo: idolDagadusheth,
    purchasePrice: 24500,
    sellingPrice: 32000,
    rawMaterialCost: 5400,
    available: 18,
    lowStockAt: 25,
    wholesaleSold: 74,
    retailSold: 12,
  },
  {
    id: "5",
    sku: "DV-14-DG",
    name: "Durga Devi Idol",
    category: "Devi",
    size: "14 inch",
    photo: idolGauri,
    purchasePrice: 4200,
    sellingPrice: 5800,
    rawMaterialCost: 1100,
    available: 34,
    lowStockAt: 40,
    wholesaleSold: 88,
    retailSold: 21,
  },
  {
    id: "6",
    sku: "GN-08-EC",
    name: 'Eco-Friendly 8" Natural',
    category: "Ganapati",
    size: "8 inch",
    photo: idolEco,
    purchasePrice: 420,
    sellingPrice: 650,
    rawMaterialCost: 180,
    available: 890,
    lowStockAt: 300,
    wholesaleSold: 1420,
    retailSold: 680,
  },
];

export type BookingStatus = "Booked" | "Advance Paid" | "Loading" | "Dispatched" | "Delivered" | "Pending";

export interface Booking {
  id: string;
  customer: string;
  village: string;
  mobile: string;
  modelSku: string;
  modelName: string;
  qty: number;
  amount: number;
  advance: number;
  status: BookingStatus;
  channel: "Wholesale" | "Retail";
  collector: string;
  date: string;
}

export const bookings: Booking[] = [
  {
    id: "BK-9024",
    customer: "Ramesh Patil",
    village: "Alandi",
    mobile: "98220 41120",
    modelSku: "GN-36-LB",
    modelName: 'Lalbaugcha Raja 36"',
    qty: 5,
    amount: 145000,
    advance: 50000,
    status: "Dispatched",
    channel: "Wholesale",
    collector: "Manish",
    date: "2026-07-18",
  },
  {
    id: "BK-9023",
    customer: "Sunil Deshmukh",
    village: "Chinchwad",
    mobile: "98505 88472",
    modelSku: "GN-24-DG",
    modelName: 'Dagadusheth 24" Gold',
    qty: 12,
    amount: 320000,
    advance: 100000,
    status: "Loading",
    channel: "Wholesale",
    collector: "Rupesh",
    date: "2026-07-19",
  },
  {
    id: "BK-9022",
    customer: "Amol Shinde",
    village: "Hadapsar",
    mobile: "77980 12210",
    modelSku: "GN-12-EC",
    modelName: 'Eco-Friendly 12" Red',
    qty: 2,
    amount: 4500,
    advance: 1500,
    status: "Booked",
    channel: "Retail",
    collector: "Eknath",
    date: "2026-07-20",
  },
  {
    id: "BK-9021",
    customer: "Vikas Kadam",
    village: "Kothrud",
    mobile: "96040 22118",
    modelSku: "GR-18-ML",
    modelName: "Mahalaxmi Gauri Set",
    qty: 3,
    amount: 14400,
    advance: 5000,
    status: "Advance Paid",
    channel: "Retail",
    collector: "Manish",
    date: "2026-07-20",
  },
  {
    id: "BK-9020",
    customer: "Ganesh Mandal Sec 4",
    village: "Baner",
    mobile: "70306 11800",
    modelSku: "GN-36-LB",
    modelName: 'Lalbaugcha Raja 36"',
    qty: 4,
    amount: 128000,
    advance: 40000,
    status: "Delivered",
    channel: "Wholesale",
    collector: "Rupesh",
    date: "2026-07-16",
  },
  {
    id: "BK-9019",
    customer: "Sagar Deshpande",
    village: "Warje",
    mobile: "98812 44029",
    modelSku: "GN-08-EC",
    modelName: 'Eco-Friendly 8" Natural',
    qty: 6,
    amount: 3900,
    advance: 0,
    status: "Pending",
    channel: "Retail",
    collector: "Eknath",
    date: "2026-07-15",
  },
];

export interface Worker {
  id: string;
  name: string;
  role: string;
  category: "Production" | "Painter";
  operation: string;
  pieceRate: number;
  todayProduction: number;
  monthlyProduction: number;
  attendance: "Present" | "Half Day" | "Absent" | "Late";
  pendingSalary: number;
}

export const workers: Worker[] = [
  {
    id: "W-01",
    name: "Bhagwan Jadhav",
    role: "Polish",
    category: "Production",
    operation: "Polish",
    pieceRate: 25,
    todayProduction: 120,
    monthlyProduction: 2840,
    attendance: "Present",
    pendingSalary: 18500,
  },
  {
    id: "W-02",
    name: "Kishor Waghmare",
    role: "Golden Painter",
    category: "Painter",
    operation: "Golden",
    pieceRate: 50,
    todayProduction: 80,
    monthlyProduction: 1920,
    attendance: "Present",
    pendingSalary: 32000,
  },
  {
    id: "W-03",
    name: "Sanjay More",
    role: "Whiting",
    category: "Production",
    operation: "Whiting",
    pieceRate: 18,
    todayProduction: 50,
    monthlyProduction: 1240,
    attendance: "Late",
    pendingSalary: 8400,
  },
  {
    id: "W-04",
    name: "Anita Pawar",
    role: "Eye Drawing",
    category: "Painter",
    operation: "Eye Drawing",
    pieceRate: 40,
    todayProduction: 65,
    monthlyProduction: 1580,
    attendance: "Present",
    pendingSalary: 22600,
  },
  {
    id: "W-05",
    name: "Ramchandra Bhosle",
    role: "Varnish",
    category: "Production",
    operation: "Varnish",
    pieceRate: 22,
    todayProduction: 0,
    monthlyProduction: 980,
    attendance: "Absent",
    pendingSalary: 12200,
  },
  {
    id: "W-06",
    name: "Prakash Ingole",
    role: "Shading Painter",
    category: "Painter",
    operation: "Shading",
    pieceRate: 60,
    todayProduction: 42,
    monthlyProduction: 1120,
    attendance: "Half Day",
    pendingSalary: 27800,
  },
];

const fmtINR = (n: number) =>
  n >= 100000
    ? `₹ ${(n / 100000).toFixed(2)} L`
    : n >= 1000
      ? `₹ ${n.toLocaleString("en-IN")}`
      : `₹ ${n}`;

export const formatCurrency = fmtINR;

export const dashboardKpis = () => {
  const totalStock = models.reduce((s, m) => s + m.available, 0);
  const totalModels = models.length;
  const wholesaleValue = bookings
    .filter((b) => b.channel === "Wholesale")
    .reduce((s, b) => s + b.amount, 0);
  const retailValue = bookings
    .filter((b) => b.channel === "Retail")
    .reduce((s, b) => s + b.amount, 0);
  const collection = bookings.reduce((s, b) => s + b.advance, 0);
  const pending = bookings.reduce((s, b) => s + (b.amount - b.advance), 0);
  const expenses = 285000;
  const staffPayments = workers.reduce((s, w) => s + w.pendingSalary, 0);
  const revenue = wholesaleValue + retailValue;
  const netProfit = revenue - expenses - staffPayments;
  return {
    totalStock,
    totalModels,
    wholesaleValue,
    retailValue,
    collection,
    pending,
    expenses,
    staffPayments,
    netProfit,
  };
};

export const lowStockModels = () => models.filter((m) => m.available < m.lowStockAt);
