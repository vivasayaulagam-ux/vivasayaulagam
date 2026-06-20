'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Truck, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CourierRule {
  _id: string;
  state_name?: string;
  state_code?: string;
  pincode?: string;
  pincode_start?: number;
  pincode_end?: number;
  courier_charge: number;
  minimum_order_value: number;
  free_shipping_above: number | null;
  status: 'active' | 'inactive';
}

const INDIAN_STATES = [
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UT", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" }
];

export default function CourierChargesPage() {
  const [rules, setRules] = useState<CourierRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [ruleType, setRuleType] = useState<'state' | 'pincode' | 'range'>('state');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeStart, setPincodeStart] = useState('');
  const [pincodeEnd, setPincodeEnd] = useState('');
  const [courierCharge, setCourierCharge] = useState('');
  const [minOrderVal, setMinOrderVal] = useState('0');
  const [freeShippingAbove, setFreeShippingAbove] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/courier');
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error('Failed to load courier rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const resetForm = () => {
    setEditingId(null);
    setRuleType('state');
    setStateName('');
    setPincode('');
    setPincodeStart('');
    setPincodeEnd('');
    setCourierCharge('');
    setMinOrderVal('0');
    setFreeShippingAbove('');
    setStatus('active');
  };

  const handleEdit = (rule: CourierRule) => {
    setEditingId(rule._id);
    if (rule.pincode) {
      setRuleType('pincode');
      setPincode(rule.pincode);
    } else if (rule.pincode_start !== undefined || rule.pincode_end !== undefined) {
      setRuleType('range');
      setPincodeStart(rule.pincode_start?.toString() || '');
      setPincodeEnd(rule.pincode_end?.toString() || '');
    } else {
      setRuleType('state');
      setStateName(rule.state_name || '');
    }

    setCourierCharge(rule.courier_charge.toString());
    setMinOrderVal(rule.minimum_order_value.toString());
    setFreeShippingAbove(rule.free_shipping_above !== null ? rule.free_shipping_above.toString() : '');
    setStatus(rule.status);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      const res = await fetch(`/api/admin/courier/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRules();
      } else {
        alert(data.error || 'Failed to delete courier rule');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting rule');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierCharge) return;
    setSaving(true);

    const ruleData: any = {
      courier_charge: Number(courierCharge),
      minimum_order_value: Number(minOrderVal),
      free_shipping_above: freeShippingAbove ? Number(freeShippingAbove) : null,
      status,
    };

    if (ruleType === 'state') {
      const matchedState = INDIAN_STATES.find(s => s.name === stateName);
      ruleData.state_name = stateName;
      ruleData.state_code = matchedState ? matchedState.code : undefined;
      ruleData.pincode = undefined;
      ruleData.pincode_start = undefined;
      ruleData.pincode_end = undefined;
    } else if (ruleType === 'pincode') {
      ruleData.pincode = pincode.trim();
      ruleData.state_name = undefined;
      ruleData.state_code = undefined;
      ruleData.pincode_start = undefined;
      ruleData.pincode_end = undefined;
    } else {
      ruleData.pincode_start = Number(pincodeStart);
      ruleData.pincode_end = Number(pincodeEnd);
      ruleData.pincode = undefined;
      ruleData.state_name = undefined;
      ruleData.state_code = undefined;
    }

    try {
      const url = editingId ? `/api/admin/courier/${editingId}` : '/api/admin/courier';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        resetForm();
        fetchRules();
      } else {
        alert(data.error || 'Failed to save courier rule');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving courier rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-gray-800">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">Courier Shipping Charges</h1>
          <p className="text-xs text-gray-500 mt-1">Configure custom courier rates based on states, pincodes, or pincode ranges.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 bg-[#34a121] hover:bg-[#28801a] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border-0 cursor-pointer shadow-sm"
          >
            <Plus size={15} /> Add Rule
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm"
          >
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
              <h3 className="font-bold text-sm text-gray-900">{editingId ? 'Edit Courier Rule' : 'New Courier Rule'}</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-650 bg-transparent border-0 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-3">
                {(['state', 'pincode', 'range'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRuleType(t)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      ruleType === t
                        ? 'bg-[#34a121] text-white border-[#34a121]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t === 'state' ? 'State Wise' : t === 'pincode' ? 'Specific Pincode' : 'Pincode Range'}
                  </button>
                ))}
              </div>

              {/* Conditional Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ruleType === 'state' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-650">Select Indian State *</label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      required
                      className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121] bg-white h-[42px]"
                    >
                      <option value="">Choose State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {ruleType === 'pincode' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-650">Postal Code (PIN) *</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 600001"
                      className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121]"
                    />
                  </div>
                )}

                {ruleType === 'range' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-650">PIN Start *</label>
                      <input
                        type="number"
                        required
                        value={pincodeStart}
                        onChange={(e) => setPincodeStart(e.target.value)}
                        placeholder="e.g. 600001"
                        className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-650">PIN End *</label>
                      <input
                        type="number"
                        required
                        value={pincodeEnd}
                        onChange={(e) => setPincodeEnd(e.target.value)}
                        placeholder="e.g. 640000"
                        className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121]"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-650">Courier Rate Per KG (₹) *</label>
                  <input
                    type="number"
                    required
                    value={courierCharge}
                    onChange={(e) => setCourierCharge(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-650">Min Order Value for Rule (₹)</label>
                  <input
                    type="number"
                    value={minOrderVal}
                    onChange={(e) => setMinOrderVal(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-650">Free Shipping Above (₹) (Optional)</label>
                  <input
                    type="number"
                    value={freeShippingAbove}
                    onChange={(e) => setFreeShippingAbove(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-650">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:border-[#34a121] bg-white h-[42px]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1 bg-[#34a121] hover:bg-[#28801a] text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border-0 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Rule'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-750 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-xs font-semibold">Loading courier configurations...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Truck size={38} className="mx-auto text-gray-300 mb-3 animate-pulse" />
            <p className="font-bold text-sm text-gray-800">No courier rules found</p>
            <p className="text-xs mt-1">Click &quot;Add Rule&quot; to configure custom shipping rules.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 font-heading font-bold text-gray-650 uppercase tracking-wider">
                  <th className="px-5 py-4">Configuration Target</th>
                  <th className="px-5 py-4">Rate Per KG</th>
                  <th className="px-5 py-4">Min Order Threshold</th>
                  <th className="px-5 py-4">Free Shipping Target</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((rule) => {
                  let targetLabel = '';
                  if (rule.pincode) {
                    targetLabel = `PIN: ${rule.pincode}`;
                  } else if (rule.pincode_start !== undefined || rule.pincode_end !== undefined) {
                    targetLabel = `PINs: ${rule.pincode_start} – ${rule.pincode_end}`;
                  } else {
                    targetLabel = rule.state_name || 'All States';
                  }

                  return (
                    <tr key={rule._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-gray-900">{targetLabel}</td>
                      <td className="px-5 py-4 text-primary font-bold">{formatPrice(rule.courier_charge)} / kg</td>
                      <td className="px-5 py-4 font-medium text-gray-650">{formatPrice(rule.minimum_order_value)}</td>
                      <td className="px-5 py-4 font-medium text-gray-650">
                        {rule.free_shipping_above !== null ? formatPrice(rule.free_shipping_above) : 'N/A'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rule.status === 'active' 
                            ? 'bg-[#34a121]/10 text-[#34a121]' 
                            : 'bg-red-50 text-red-650'
                        }`}>
                          {rule.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="text-gray-400 hover:text-[#34a121] bg-transparent border-0 cursor-pointer p-1 transition-colors"
                            title="Edit Rule"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(rule._id)}
                            className="text-gray-400 hover:text-red-500 bg-transparent border-0 cursor-pointer p-1 transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
