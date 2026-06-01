'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Mail, UserCheck, ShieldAlert, Award } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: string;
  status: 'active' | 'inactive';
  role: 'user' | 'admin';
  joined: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Arun Kumar', email: 'arun.k@gmail.com', orders: 12, spent: '₹4,850', status: 'active', role: 'user', joined: '12 May 2026' },
  { id: '2', name: 'Priya Ramasamy', email: 'priya.r@yahoo.com', orders: 8, spent: '₹3,200', status: 'active', role: 'user', joined: '05 May 2026' },
  { id: '3', name: 'Karthik Raja', email: 'karthik.raja@outlook.com', orders: 0, spent: '₹0', status: 'inactive', role: 'user', joined: '28 Apr 2026' },
  { id: '4', name: 'Anitha Devi', email: 'anitha.devi@gmail.com', orders: 19, spent: '₹8,900', status: 'active', role: 'user', joined: '15 Apr 2026' },
  { id: '5', name: 'Vignesh Balaji', email: 'vignesh.b@gmail.com', orders: 4, spent: '₹1,500', status: 'active', role: 'user', joined: '02 Apr 2026' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);

  const filtered = customers.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">Track and manage customer profiles, orders, and value tier levels</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">1,240</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">VIP Members</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">84</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active This Month</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">426</p>
          </div>
        </div>
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
              className="w-full text-sm pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-3 font-semibold text-gray-800">
                    <span className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs uppercase">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </span>
                    {c.name}
                  </td>
                  <td className="p-4 text-gray-500 font-mono text-xs">{c.email}</td>
                  <td className="p-4 font-semibold">{c.orders} orders</td>
                  <td className="p-4 font-bold text-gray-900">{c.spent}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 pr-6">{c.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
