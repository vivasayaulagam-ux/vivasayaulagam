"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Package, RotateCcw, CheckCircle2, Truck, Timer } from "lucide-react";

interface OrderStat {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: number[];
}

interface Props {
  orders: any[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const pointsStr = pts.join(" ");
  const areaPath = `M ${pts[0]} L ${pts.slice(1).join(" L ")} L ${w},${h} L 0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* last dot */}
      {pts.length > 0 && (
        <circle
          cx={w}
          cy={parseFloat(pts[pts.length - 1].split(",")[1])}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
}

export default function OrdersStatsBar({ orders }: Props) {
  const totalOrders = orders.length;
  const totalItems = orders.reduce((s, o) => s + (o.items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0), 0);
  const totalReturns = 0; // placeholder — no returns model yet
  const fulfilled = orders.filter((o) => ["shipped", "delivered"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  // Average fulfillment time in hours (from pending → processing)
  const avgFulfill = (() => {
    const times = orders
      .filter((o) => o.updatedAt && o.createdAt && o.status !== "pending")
      .map((o) => (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 3600000);
    if (!times.length) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  })();

  // Generate last-7-day counts for sparklines
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
  });

  const last7Items = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return orders
      .filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      })
      .reduce((s, o) => s + (o.items?.reduce((a: number, itm: any) => a + itm.quantity, 0) || 0), 0);
  });

  const last7Fulfilled = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= d.getTime() && t < next.getTime() && ["shipped", "delivered"].includes(o.status);
    }).length;
  });

  const last7Delivered = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= d.getTime() && t < next.getTime() && o.status === "delivered";
    }).length;
  });

  const stats: OrderStat[] = [
    {
      title: "Orders",
      value: totalOrders,
      icon: <ShoppingBag size={16} />,
      color: "#34a121",
      bgColor: "#f0fdf4",
      trend: last7,
    },
    {
      title: "Items ordered",
      value: totalItems,
      icon: <Package size={16} />,
      color: "#2563eb",
      bgColor: "#eff6ff",
      trend: last7Items,
    },
    {
      title: "Returns",
      value: `₹${totalReturns}`,
      icon: <RotateCcw size={16} />,
      color: "#dc2626",
      bgColor: "#fef2f2",
      trend: [0, 0, 0, 0, 0, 0, 0],
    },
    {
      title: "Orders fulfilled",
      value: fulfilled,
      icon: <CheckCircle2 size={16} />,
      color: "#7c3aed",
      bgColor: "#f5f3ff",
      trend: last7Fulfilled,
    },
    {
      title: "Orders delivered",
      value: delivered,
      icon: <Truck size={16} />,
      color: "#0891b2",
      bgColor: "#ecfeff",
      trend: last7Delivered,
    },
    {
      title: "Avg. fulfillment time",
      value: avgFulfill !== null ? `${avgFulfill}h` : "—",
      icon: <Timer size={16} />,
      color: "#d97706",
      bgColor: "#fffbeb",
      trend: [1, 2, 1, 3, 2, 1, avgFulfill ?? 0],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
          className="bg-white border border-[#e5e5e5] rounded-[14px] p-4 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200 group cursor-default"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: stat.bgColor, color: stat.color }}
            >
              {stat.icon}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">
              {stat.title}
            </p>
            <p
              className="text-xl font-bold leading-none"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
          {stat.trend && (
            <div className="mt-auto pt-1">
              <MiniSparkline data={stat.trend} color={stat.color} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
