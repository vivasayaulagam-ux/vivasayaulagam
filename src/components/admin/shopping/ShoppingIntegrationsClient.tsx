"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2, Check, Copy, ExternalLink, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, ShoppingBag, Eye, HelpCircle, ShieldCheck
} from "lucide-react";
import { ShoppingIntegrationsSummary, ProductHealthRow } from "@/lib/shopping/feedValidation";

export default function ShoppingIntegrationsClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [data, setData] = useState<ShoppingIntegrationsSummary | null>(null);
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedGoogle, setCopiedGoogle] = useState(false);

  const fetchValidation = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      setApiError(null);
      const res = await fetch("/api/admin/shopping-integrations");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.summary) {
        setData(json.summary);
      } else {
        setApiError(json.error || "Failed to load validation data");
      }
    } catch (err: any) {
      console.error("Failed to fetch shopping integrations data:", err);
      setApiError(err.message || "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, []);

  const metaFeedUrl = typeof window !== "undefined" ? `${window.location.origin}/api/feeds/meta` : "/api/feeds/meta";
  const googleFeedUrl = typeof window !== "undefined" ? `${window.location.origin}/api/feeds/google.xml` : "/api/feeds/google.xml";

  const handleCopy = (text: string, type: "meta" | "google") => {
    navigator.clipboard.writeText(text);
    if (type === "meta") {
      setCopiedMeta(true);
      setTimeout(() => setCopiedMeta(false), 2000);
    } else {
      setCopiedGoogle(true);
      setTimeout(() => setCopiedGoogle(false), 2000);
    }
  };

  const healthDisplay = (data && data.totalActiveProducts > 0)
    ? `${data.feedHealthPercentage}%`
    : "N/A";

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[600px]">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="animate-spin" size={20} />
          <span className="text-sm font-medium">Loading Shopping Integrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-green-50 text-[#34a121]">
              <Share2 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Shopping Integrations</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage &amp; sync products with Meta Catalog (Facebook/Instagram) and Google Merchant Center / YouTube Shopping
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchValidation}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60 transition-all shadow-sm cursor-pointer border-0"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Feed Status"}
        </button>
      </div>

      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Failed to load live feed validation: {apiError}</span>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Active Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data?.totalActiveProducts || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Eligible for Feeds</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{data?.eligibleProductsCount || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Excluded from Feeds</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{data?.excludedProductsCount || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Missing Info Warnings</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{data?.missingInfoProductsCount || 0}</p>
        </div>
      </div>

      {/* Feed Cards: Meta & Google */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta Catalog Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                  f
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Meta Product Catalog</h2>
                  <p className="text-xs text-gray-500">Facebook &amp; Instagram Shopping, Product Tagging</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                data?.metaStatus === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                data?.metaStatus === 'Warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {data?.metaStatus || 'Warning'}
              </span>
            </div>

            <p className="text-xs text-gray-600 mt-4 leading-relaxed">
              Connect this URL to Meta Commerce Manager to sync your product catalog for Facebook Shop, Instagram Shop, and Instagram post/reel product tagging.
            </p>

            {/* Feed URL input & buttons */}
            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Feed URL</label>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <input
                  type="text"
                  readOnly
                  value={metaFeedUrl}
                  className="bg-transparent text-xs font-mono text-gray-700 flex-1 outline-none px-2"
                />
                <button
                  onClick={() => handleCopy(metaFeedUrl, "meta")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  {copiedMeta ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedMeta ? "Copied" : "Copy"}
                </button>
                <a
                  href={metaFeedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all"
                >
                  <ExternalLink size={14} />
                  Preview
                </a>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Supports RSS 2.0 XML / Meta Commerce format</span>
            <span className="font-semibold text-gray-700">{data?.eligibleProductsCount || 0} Eligible Items</span>
          </div>
        </div>

        {/* Google Merchant Center Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                  G
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Google Merchant Center</h2>
                  <p className="text-xs text-gray-500">Google Shopping &amp; YouTube Shopping</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                data?.googleStatus === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                data?.googleStatus === 'Warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {data?.googleStatus || 'Warning'}
              </span>
            </div>

            <p className="text-xs text-gray-600 mt-4 leading-relaxed">
              Connect this URL to Google Merchant Center to list products in Google Shopping search, Google Free Listings, and YouTube Shopping store channels.
            </p>

            {/* Feed URL input & buttons */}
            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Feed URL</label>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <input
                  type="text"
                  readOnly
                  value={googleFeedUrl}
                  className="bg-transparent text-xs font-mono text-gray-700 flex-1 outline-none px-2"
                />
                <button
                  onClick={() => handleCopy(googleFeedUrl, "google")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  {copiedGoogle ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedGoogle ? "Copied" : "Copy"}
                </button>
                <a
                  href={googleFeedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all"
                >
                  <ExternalLink size={14} />
                  Preview
                </a>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Supports Google RSS 2.0 XML Namespace</span>
            <span className="font-semibold text-gray-700">{data?.eligibleProductsCount || 0} Eligible Items</span>
          </div>
        </div>
      </div>

      {/* Product Health Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">Product Feed Health &amp; Eligibility</h3>
            <p className="text-xs text-gray-500 mt-0.5">Review items for missing data (images, prices, weights, categories) that could affect feed approval</p>
          </div>
          <div className="text-xs text-gray-500 font-semibold">
            Health Index: <span className="text-emerald-600 font-bold">{healthDisplay}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Feed Sync</th>
                <th className="px-6 py-3 text-center">Meta Ready</th>
                <th className="px-6 py-3 text-center">Google Ready</th>
                <th className="px-6 py-3">Missing Data / Warnings</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.productRows && data.productRows.length > 0 ? (
                data.productRows.map((row) => (
                  <tr key={row.mongoId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-gray-900">
                      {row.title}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 font-mono">
                      {row.sku}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.feedEnabled ? (
                        <span className="text-emerald-600 font-semibold">Enabled</span>
                      ) : (
                        <span className="text-gray-400 font-semibold">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.metaReady ? (
                        <CheckCircle2 size={16} className="text-emerald-500 inline-block" />
                      ) : (
                        <XCircle size={16} className="text-gray-300 inline-block" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.googleReady ? (
                        <CheckCircle2 size={16} className="text-emerald-500 inline-block" />
                      ) : (
                        <XCircle size={16} className="text-amber-500 inline-block" />
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {row.missingData.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.missingData.map((msg, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium"
                            >
                              <AlertTriangle size={10} />
                              {msg}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <Check size={14} /> Perfect
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/admin/products/${row.mongoId}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all text-xs inline-block"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
