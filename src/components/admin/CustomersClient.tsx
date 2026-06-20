'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Mail, UserCheck, Award, X, Phone, 
  MapPin, Calendar, ShoppingBag, ArrowUpRight, ShieldAlert 
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export interface CustomerAddress {
  _id: string;
  label: string;
  line1: string;
  line2: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  joined: string;
  addresses: CustomerAddress[];
}

export interface CustomerOrder {
  id: string;
  orderId: string;
  userId: string;
  totalAmount: number;
  status: string;
  isPaid: boolean;
  createdAt: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
}

interface Props {
  customers: Customer[];
  orders: CustomerOrder[];
}

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  delivered:  { pill: "bg-emerald-50 text-emerald-700 border-emerald-200",  dot: "bg-emerald-500" },
  processing: { pill: "bg-blue-50 text-blue-700 border-blue-200",           dot: "bg-blue-500" },
  shipped:    { pill: "bg-violet-50 text-violet-700 border-violet-200",     dot: "bg-violet-500" },
  cancelled:  { pill: "bg-red-50 text-red-650 border-red-200",              dot: "bg-red-500" },
  pending:    { pill: "bg-amber-50 text-amber-700 border-amber-200",        dot: "bg-amber-500" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { pill: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${s.pill}`}>
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function CustomersClient({ customers, orders }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Compute customer list with order stats
  const customerList = useMemo(() => {
    return customers.map(c => {
      const userOrders = orders.filter(o => o.userId === c.id);
      const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        ...c,
        ordersCount: userOrders.length,
        totalSpent,
        recentOrders: userOrders,
        status: userOrders.length > 0 ? 'active' : 'inactive' as const
      };
    });
  }, [customers, orders]);

  // Filters
  const filtered = useMemo(() => {
    return customerList.filter(
      c => c.name.toLowerCase().includes(search.toLowerCase()) || 
           c.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [customerList, search]);

  // Statistics
  const stats = useMemo(() => {
    const totalCustomers = customerList.length;
    // VIP: Spent more than ₹5000
    const vipMembers = customerList.filter(c => c.totalSpent >= 5000).length;
    
    // Active This Month: Placed order in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeThisMonth = customerList.filter(c => 
      c.recentOrders.some(o => new Date(o.createdAt) >= thirtyDaysAgo)
    ).length;

    return { totalCustomers, vipMembers, activeThisMonth };
  }, [customerList]);

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerList.find(c => c.id === selectedCustomerId) || null;
  }, [customerList, selectedCustomerId]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalCustomers.toLocaleString()}</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">VIP Members (₹5k+ Spend)</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.vipMembers.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active (Last 30 Days)</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.activeThisMonth.toLocaleString()}</p>
          </div>
        </motion.div>
      </div>

      {/* Filter and table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                <th className="p-4 pl-6">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Orders Completed</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 pr-6">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filtered.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCustomerId(c.id)}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <td className="p-4 pl-6 flex items-center gap-3 font-semibold text-gray-800">
                    <span className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {getInitials(c.name)}
                    </span>
                    {c.name}
                  </td>
                  <td className="p-4 text-gray-500 font-mono text-xs">{c.email}</td>
                  <td className="p-4 font-semibold">{c.ordersCount} orders</td>
                  <td className="p-4 font-bold text-gray-900">{formatPrice(c.totalSpent)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 pr-6">
                    {new Date(c.joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Drawer */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomerId(null)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <Users size={18} className="text-[#34a121]" />
                  Customer Profile
                </h3>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile details */}
                <div className="flex items-center gap-4 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                  <span className="w-16 h-16 rounded-full bg-[#34a121] text-white flex items-center justify-center font-extrabold text-xl uppercase shrink-0">
                    {getInitials(selectedCustomer.name)}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 truncate">{selectedCustomer.name}</h4>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{selectedCustomer.role}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <Calendar size={12} />
                      Joined {new Date(selectedCustomer.joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Grid of contact details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-150 rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Mail size={10} /> Email
                    </span>
                    <p className="text-xs text-gray-700 font-mono break-all font-semibold select-all">
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-150 rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Phone size={10} /> Phone
                    </span>
                    <p className="text-xs text-gray-700 font-semibold">
                      {selectedCustomer.phone || '—'}
                    </p>
                  </div>
                </div>

                {/* Performance stats summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50/30 border border-green-100 rounded-xl">
                    <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Total Value</p>
                    <p className="text-xl font-extrabold text-[#34a121] mt-1">{formatPrice(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Orders count</p>
                    <p className="text-xl font-extrabold text-blue-800 mt-1">{selectedCustomer.ordersCount} orders</p>
                  </div>
                </div>

                {/* Addresses */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} /> Saved Addresses
                  </h5>
                  {selectedCustomer.addresses.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No addresses saved in profile.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCustomer.addresses.map((addr) => (
                        <div key={addr._id} className="p-3 border border-gray-150 rounded-xl space-y-1 text-xs">
                          <span className="font-bold text-[#34a121] uppercase tracking-wider text-[9px] bg-green-50 px-1.5 py-0.5 rounded-md">
                            {addr.label}
                          </span>
                          <p className="text-gray-700 font-semibold leading-tight mt-1">{addr.line1}</p>
                          {addr.line2 && <p className="text-gray-500 font-medium">{addr.line2}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders History */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <ShoppingBag size={12} /> Order History ({selectedCustomer.ordersCount})
                  </h5>
                  {selectedCustomer.recentOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No orders placed yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCustomer.recentOrders.map((ord) => (
                        <div key={ord.id} className="p-4 border border-gray-150 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-[#34a121]">{ord.orderId}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          
                          {/* Items brief */}
                          <div className="space-y-1.5 pl-1.5 border-l-2 border-gray-100">
                            {ord.items.map((itm, idx) => (
                              <p key={idx} className="text-xs text-gray-600 font-medium">
                                {itm.name} <span className="text-gray-400 text-[10px]">({itm.quantity}x)</span>
                              </p>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <StatusBadge status={ord.status} />
                            <span className="font-extrabold text-gray-800 text-xs">{formatPrice(ord.totalAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
