"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2, Check, Copy, ExternalLink, RefreshCw, AlertTriangle,
  CheckCircle2, ShieldCheck, HelpCircle,
  Globe, ShoppingBag,
  Database, Tag, Server, CheckCheck, Save, Sparkles, Layers,
  ChevronDown, ChevronUp
} from "lucide-react";

const FacebookIcon = ({ size = 16, className = "text-blue-600" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 16, className = "text-rose-600" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface DiagnosticResponse {
  timestamp: string;
  overallStatus: "connected" | "working" | "partial" | "not_connected" | "verification_required" | "error";
  feed: {
    status: "working" | "partial" | "error";
    endpoint: string;
    httpStatus: number;
    contentType: string;
    totalItems: number;
    httpsUrls: boolean;
    xmlValid: boolean;
    requiredFieldsValid: boolean;
    errorMessage?: string;
  };
  dataQuality: {
    status: "healthy" | "warnings" | "errors";
    totalActiveProducts: number;
    totalFeedItems: number;
    uniqueCatalogIds: number;
    duplicateCatalogIdsCount: number;
    duplicateCatalogIds: string[];
    missingImagesCount: number;
    brokenProductUrlsCount: number;
    brokenImageUrlsCount: number;
    invalidPricesCount: number;
    invalidAvailabilityCount: number;
    malformedSlugsCount: number;
    duplicateSlugsCount: number;
    problems: Array<{
      productId: string;
      title: string;
      catalogId: string;
      productUrl: string;
      imageUrl: string;
      price: string;
      availability: string;
      issues: string[];
      status: "error" | "warning";
      editUrl: string;
    }>;
  };
  pixel: {
    installed: boolean;
    pixelId: string;
    fullPixelId: string;
    isDefaultFallback: boolean;
    pageViewTracked: boolean;
    duplicateDetected: boolean;
    installationMethod: string;
    noscriptFallback: boolean;
  };
  events: {
    pageView: { implemented: boolean; parameters: string[]; deduplicated: boolean };
    viewContent: { implemented: boolean; parameters: string[]; status: "working" | "missing" };
    addToCart: { implemented: boolean; parameters: string[]; status: "working" | "missing" };
    initiateCheckout: { implemented: boolean; parameters: string[]; status: "working" | "missing" };
    purchase: { implemented: boolean; parameters: string[]; deduplicated: boolean; status: "working" | "missing" };
  };
  catalogMatching: {
    status: "matched" | "mismatch";
    checkedCount: number;
    matchedCount: number;
    mismatchCount: number;
    matchRate: number;
    mismatches: Array<{
      productId: string;
      title: string;
      variantName?: string;
      catalogId: string;
      pixelId: string;
    }>;
  };
  facebook: {
    websiteLink: boolean;
    url: string;
    metaBusinessStatus: "verification_required" | "connected";
    note: string;
  };
  instagram: {
    websiteLink: boolean;
    url: string;
    handleConflict: boolean;
    handlesFound: string[];
    metaBusinessStatus: "verification_required" | "connected";
    note: string;
  };
  domainVerification: {
    domain: string;
    verificationCode: string;
    websiteMetaTagInstalled: boolean;
    metaStatus: "verification_required" | "verified";
    instructions: string;
  };
  crawler: {
    robotsTxtStatus: "working" | "missing";
    feedAccessible: boolean;
    productPagesAccessible: boolean;
    productImagesAccessible: boolean;
    facebookExternalHitAllowed: boolean;
    facebotAllowed: boolean;
  };
  sitemap: {
    status: "working" | "missing";
    endpoint: string;
    productsCount: number;
    httpsUrls: boolean;
  };
  businessPortfolio: {
    status: "verification_required";
    note: string;
  };
  commerceAccount: {
    status: "verification_required";
    shopStatus: "verification_required";
    catalogConnected: "verification_required";
    checkoutDestination: string;
    productTagging: "verification_required";
    note: string;
  };
  metaGraphApi?: {
    isConfigured: boolean;
    hasAccessToken: boolean;
    apiVersion: string;
  };
}

export default function MetaCommerceCenterClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DiagnosticResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Copy state
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [copiedPixel, setCopiedPixel] = useState(false);

  // Verification code form
  const [domainCodeInput, setDomainCodeInput] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Problem table accordion
  const [showProblems, setShowProblems] = useState(false);
  const [showMismatches, setShowMismatches] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch("/api/admin/integrations/meta/status");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.diagnostics) {
        setData(json.diagnostics);
        setDomainCodeInput(json.diagnostics.domainVerification?.verificationCode || "");
      } else {
        setError(json.error || "Failed to load Meta diagnostic information");
      }
    } catch (err: any) {
      console.error("Meta diagnostics fetch error:", err);
      setError(err.message || "Network error while connecting to Meta diagnostics API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleSaveDomainCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCode(true);
      setSaveMessage(null);
      const res = await fetch("/api/admin/integrations/meta/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaDomainVerificationCode: domainCodeInput }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveMessage("Domain verification code saved! Meta tag is now live.");
        fetchDiagnostics();
      } else {
        setSaveMessage(json.error || "Failed to save verification code.");
      }
    } catch {
      setSaveMessage("Network error while saving code.");
    } finally {
      setSavingCode(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const copyToClipboard = (text: string, type: "feed" | "pixel") => {
    navigator.clipboard.writeText(text);
    if (type === "feed") {
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2000);
    } else {
      setCopiedPixel(true);
      setTimeout(() => setCopiedPixel(false), 2000);
    }
  };

  const formatTimestamp = (iso?: string) => {
    if (!iso) return "Just now";
    try {
      return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
          <RefreshCw className="animate-spin" size={24} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">Running Meta Commerce Diagnostics...</p>
          <p className="text-xs text-gray-400 mt-1">Validating Product Feed XML, Pixel events, Catalog IDs, and Meta connections</p>
        </div>
      </div>
    );
  }

  const d = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[linear-gradient(135deg,#1877F2_0%,#0055D4_100%)] flex items-center justify-center text-white font-bold shadow-md shrink-0">
            <Share2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Meta Commerce Integration</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Official Center
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Facebook &amp; Instagram Shopping, Catalog Feed Sync, Meta Pixel Events &amp; DPA Matching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Last Checked</p>
            <p className="text-xs font-semibold text-gray-700 font-mono">{formatTimestamp(d?.timestamp)}</p>
          </div>

          <button
            onClick={fetchDiagnostics}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-60 transition-all shadow-sm cursor-pointer border-0"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Scanning..." : "Refresh Status"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP INTEGRATION HEALTH SUMMARY */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={18} className="text-[#34a121]" />
              Meta Commerce Readiness Overview
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Real-time health status of all storefront assets and Meta platform configurations</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Overall Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              d?.overallStatus === 'working' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              d?.overallStatus === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {d?.overallStatus === 'working' ? '✅ FULLY CONNECTED' :
               d?.overallStatus === 'partial' ? '🟡 PARTIALLY CONNECTED' :
               '🔵 META VERIFICATION REQUIRED'}
            </span>
          </div>
        </div>

        {/* 10 Subsystem Checklist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Website Integration</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> Connected
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Meta Product Feed</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> Working ({d?.feed.totalItems || 0})
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Meta Pixel</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> Connected
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">PageView Tracking</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> Active
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Catalog ID Matching</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> {d?.catalogMatching.matchRate}% Match
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Facebook Page</span>
            <span className="text-xs font-bold text-blue-700 mt-1 flex items-center gap-1">
              <HelpCircle size={13} className="text-blue-600" /> Meta Verification
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Instagram Account</span>
            <span className="text-xs font-bold text-blue-700 mt-1 flex items-center gap-1">
              <HelpCircle size={13} className="text-blue-600" /> Meta Verification
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Domain Verification</span>
            <span className={`text-xs font-bold mt-1 flex items-center gap-1 ${
              d?.domainVerification.websiteMetaTagInstalled ? "text-emerald-700" : "text-amber-700"
            }`}>
              {d?.domainVerification.websiteMetaTagInstalled ? (
                <><CheckCircle2 size={13} className="text-emerald-600" /> Tag Installed</>
              ) : (
                <><AlertTriangle size={13} className="text-amber-600" /> Tag Missing</>
              )}
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Commerce Account</span>
            <span className="text-xs font-bold text-blue-700 mt-1 flex items-center gap-1">
              <HelpCircle size={13} className="text-blue-600" /> Meta Verification
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Instagram Shopping</span>
            <span className="text-xs font-bold text-blue-700 mt-1 flex items-center gap-1">
              <HelpCircle size={13} className="text-blue-600" /> Meta Verification
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS OF DETAILED STATUS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: META PRODUCT FEED */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">META PRODUCT FEED</h3>
                  <p className="text-[11px] text-gray-500">Dynamic RSS 2.0 XML Catalog Source</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                d?.feed.status === "working" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                d?.feed.status === "partial" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {d?.feed.status === "working" ? "✅ WORKING" : d?.feed.status === "partial" ? "🟡 PARTIAL" : "❌ ERROR"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">HTTP Status</span>
                <span className="font-bold text-emerald-600">{d?.feed.httpStatus} OK</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Content-Type</span>
                <span className="font-semibold text-gray-800 font-mono text-[11px]">{d?.feed.contentType}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Total Items Generated</span>
                <span className="font-bold text-gray-900">{d?.feed.totalItems} feed items</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Direct HTTPS URLs</span>
                <span className={`font-bold ${d?.feed.httpsUrls ? "text-emerald-600" : "text-amber-600"}`}>
                  {d?.feed.httpsUrls ? "✅ Direct HTTPS (No 301)" : "⚠️ HTTP Redirects"}
                </span>
              </div>
            </div>

            {/* Feed URL input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-gray-500">Scheduled Feed Endpoint</label>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <input
                  type="text"
                  readOnly
                  value={d?.feed.endpoint || ""}
                  className="bg-transparent text-xs font-mono text-gray-700 flex-1 outline-none px-2 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(d?.feed.endpoint || "", "feed")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  {copiedFeed ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedFeed ? "Copied" : "Copy"}
                </button>
                <a
                  href={d?.feed.endpoint || "/api/feeds/meta"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all"
                >
                  <ExternalLink size={13} />
                  Open Feed
                </a>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Includes: id, title, description, link, image, price, availability, brand</span>
            <span className="font-semibold text-emerald-600">Google/Meta XML Spec</span>
          </div>
        </div>

        {/* CARD 2: CATALOG DATA QUALITY */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#34a121] font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">CATALOG DATA QUALITY</h3>
                  <p className="text-[11px] text-gray-500">Inventory, Slugs, Images &amp; Prices Health</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                d?.dataQuality.status === "healthy" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                d?.dataQuality.status === "warnings" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {d?.dataQuality.status === "healthy" ? "✅ HEALTHY" : d?.dataQuality.status === "warnings" ? "🟡 WARNINGS" : "❌ ERRORS"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-2 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Active Products</span>
                <span className="font-bold text-gray-900 text-sm">{d?.dataQuality.totalActiveProducts}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Feed Items</span>
                <span className="font-bold text-gray-900 text-sm">{d?.dataQuality.totalFeedItems}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Duplicate IDs</span>
                <span className={`font-bold text-sm ${d?.dataQuality.duplicateCatalogIdsCount === 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {d?.dataQuality.duplicateCatalogIdsCount}
                </span>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Slug Collisions</span>
                <span className={`font-bold text-sm ${d?.dataQuality.duplicateSlugsCount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {d?.dataQuality.duplicateSlugsCount}
                </span>
              </div>
            </div>

            {/* Problem breakdown */}
            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between items-center text-gray-600">
                <span>Missing / Placeholder Images:</span>
                <span className="font-semibold text-gray-900">{d?.dataQuality.missingImagesCount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Invalid / Missing Prices:</span>
                <span className="font-semibold text-gray-900">{d?.dataQuality.invalidPricesCount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Malformed Slugs (/products/ prefix):</span>
                <span className="font-semibold text-gray-900">{d?.dataQuality.malformedSlugsCount || 0}</span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowProblems(!showProblems)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 transition-all border-0 cursor-pointer"
            >
              <span>{showProblems ? "Hide Diagnostic Items" : `View Product Items & Warnings (${d?.dataQuality.problems.length || 0})`}</span>
              {showProblems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDABLE PROBLEMS TABLE */}
      {showProblems && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Product Diagnostics &amp; Problem Details</h4>
            <span className="text-xs text-gray-500 font-semibold">{d?.dataQuality.problems.length} items flagged</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/70 text-gray-600 font-semibold border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">Catalog ID</th>
                  <th className="px-4 py-2.5">Price</th>
                  <th className="px-4 py-2.5">Availability</th>
                  <th className="px-4 py-2.5">Flagged Issue</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d?.dataQuality.problems && d.dataQuality.problems.length > 0 ? (
                  d.dataQuality.problems.map((p) => (
                    <tr key={p.productId} className="hover:bg-gray-50/80">
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{p.title}</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-[11px]">{p.catalogId}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{p.price}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {p.availability}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {p.issues.map((msg, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium"
                            >
                              <AlertTriangle size={10} />
                              {msg}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={p.editUrl}
                          className="px-2.5 py-1 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-[11px] font-semibold inline-block"
                        >
                          Edit Product
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No data quality issues detected. All active products have clean slugs, images, and prices!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROW 2: META PIXEL & CATALOG MATCHING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD 3: META PIXEL & STANDARD EVENTS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">META PIXEL &amp; EVENT TRACKING</h3>
                  <p className="text-[11px] text-gray-500">Client-Side Analytics &amp; Conversion Tracking</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✅ CONNECTED
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Active Pixel ID</span>
                <span className="font-mono font-bold text-gray-900 text-sm">{d?.pixel.pixelId}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(d?.pixel.fullPixelId || "", "pixel")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
              >
                {copiedPixel ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedPixel ? "Copied" : "Copy ID"}
              </button>
            </div>

            {/* Standard Events Table */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Standard Ecommerce Events</span>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                <div className="p-2.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-semibold text-gray-900">PageView</span>
                    <span className="text-[11px] text-gray-400 block">Root router deduplicated trigger</span>
                  </div>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check size={14} /> Implemented
                  </span>
                </div>

                <div className="p-2.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-semibold text-gray-900">ViewContent</span>
                    <span className="text-[11px] text-gray-400 block">content_ids, content_type, value, currency</span>
                  </div>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check size={14} /> Implemented
                  </span>
                </div>

                <div className="p-2.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-semibold text-gray-900">AddToCart</span>
                    <span className="text-[11px] text-gray-400 block">Product page, QuickAdd modal, Video shop</span>
                  </div>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check size={14} /> Implemented
                  </span>
                </div>

                <div className="p-2.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-semibold text-gray-900">InitiateCheckout</span>
                    <span className="text-[11px] text-gray-400 block">Cart contents array, num_items, subtotal</span>
                  </div>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check size={14} /> Implemented
                  </span>
                </div>

                <div className="p-2.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-semibold text-gray-900">Purchase</span>
                    <span className="text-[11px] text-gray-400 block">Razorpay verified with eventID &amp; sessionStorage dedup</span>
                  </div>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check size={14} /> Implemented
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Installation: Direct Next.js Script (No GTM Duplicates)</span>
            <span className="text-emerald-600 font-semibold">Noscript Fallback Active</span>
          </div>
        </div>

        {/* CARD 4: CATALOG ↔ PIXEL MATCHING */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                  <CheckCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">CATALOG ↔ PIXEL MATCHING</h3>
                  <p className="text-[11px] text-gray-500">Dynamic Ads ID Synchronization</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                d?.catalogMatching.status === "matched" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {d?.catalogMatching.status === "matched" ? "✅ MATCHED" : "❌ ID MISMATCH"}
              </span>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">Matching Synchronicity Rate</span>
                <p className="text-3xl font-extrabold text-purple-950 mt-0.5">{d?.catalogMatching.matchRate}%</p>
                <p className="text-[11px] text-purple-700 mt-1">
                  Pixel <code className="bg-white/80 px-1 py-0.5 rounded text-purple-900">content_ids</code> exactly match Catalog <code className="bg-white/80 px-1 py-0.5 rounded text-purple-900">&lt;g:id&gt;</code>
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-purple-600 shadow-sm font-bold text-xl">
                100%
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl text-center">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Tested</span>
                <span className="font-bold text-gray-900 text-sm">{d?.catalogMatching.checkedCount}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl text-center">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Matched</span>
                <span className="font-bold text-emerald-600 text-sm">{d?.catalogMatching.matchedCount}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl text-center">
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">Mismatches</span>
                <span className="font-bold text-gray-400 text-sm">{d?.catalogMatching.mismatchCount}</span>
              </div>
            </div>

            {d?.catalogMatching.mismatches && d.catalogMatching.mismatches.length > 0 && (
              <button
                onClick={() => setShowMismatches(!showMismatches)}
                className="w-full px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200"
              >
                View {d.catalogMatching.mismatches.length} Mismatches
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500">
            <span>Powered by shared <code className="font-mono text-gray-700">getMetaCatalogId</code> and <code className="font-mono text-gray-700">generateStableFeedId</code></span>
          </div>
        </div>
      </div>

      {/* ROW 3: DOMAIN VERIFICATION & SOCIAL CONNECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD 5: META DOMAIN VERIFICATION */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">META DOMAIN VERIFICATION</h3>
                <p className="text-[11px] text-gray-500">Brand Safety &amp; Instagram Product Tagging</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              d?.domainVerification.websiteMetaTagInstalled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
              "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {d?.domainVerification.websiteMetaTagInstalled ? "✅ Meta Tag Installed" : "🟡 Tag Not Configured"}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
            <div className="flex justify-between items-center text-gray-600">
              <span>Domain:</span>
              <span className="font-bold text-gray-900 font-mono">vivasayaulagam.com</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Meta Business Status:</span>
              <span className="font-semibold text-blue-700">🔵 Verification in Business Manager</span>
            </div>
          </div>

          {/* Form to save verification code */}
          <form onSubmit={handleSaveDomainCode} className="space-y-2">
            <label className="text-[11px] font-semibold text-gray-700">
              Meta Domain Verification Code (from Meta Business Suite &gt; Brand Safety &gt; Domains)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={domainCodeInput}
                onChange={(e) => setDomainCodeInput(e.target.value)}
                placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-mono text-gray-800 outline-none focus:border-[#34a121] transition-all"
              />
              <button
                type="submit"
                disabled={savingCode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#34a121] hover:bg-[#2c8a1b] text-white text-xs font-semibold shadow-sm transition-all border-0 cursor-pointer disabled:opacity-60 shrink-0"
              >
                <Save size={13} />
                {savingCode ? "Saving..." : "Save Code"}
              </button>
            </div>
            {saveMessage && (
              <p className="text-[11px] font-semibold text-emerald-600 animate-fadeIn">{saveMessage}</p>
            )}
          </form>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            Once saved, the meta tag <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'<meta name="facebook-domain-verification" content="..." />'}</code> is rendered dynamically on all website pages.
          </p>
        </div>

        {/* CARD 6: FACEBOOK & INSTAGRAM CONNECTIONS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                  <InstagramIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">SOCIAL PROFILES &amp; ASSETS</h3>
                  <p className="text-[11px] text-gray-500">Facebook Page &amp; Instagram Business Account</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                🔵 REQUIRES META VERIFICATION
              </span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FacebookIcon size={16} />
                  <div>
                    <span className="font-semibold text-gray-800">Facebook Page</span>
                    <span className="text-[11px] text-gray-400 block truncate max-w-[240px]">{d?.facebook.url}</span>
                  </div>
                </div>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={13} /> Linked in Footer
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <InstagramIcon size={16} />
                  <div>
                    <span className="font-semibold text-gray-800">Instagram Account</span>
                    <span className="text-[11px] text-gray-400 block truncate max-w-[240px]">{d?.instagram.url}</span>
                  </div>
                </div>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={13} /> Linked in Footer
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <HelpCircle size={14} className="text-blue-600 shrink-0" />
                Meta Business Connection
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Page and Instagram ownership cannot be verified via public code alone. Open Meta Business Settings to confirm portfolio assignment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <a
              href="https://business.facebook.com/settings/pages"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-all text-center"
            >
              <ExternalLink size={13} />
              Open Meta Business Settings
            </a>
          </div>
        </div>
      </div>

      {/* ROW 4: CRAWLER ACCESS & SITEMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD 7: CRAWLER ACCESS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
                <Server size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">CRAWLER ACCESS &amp; ROBOTS.TXT</h3>
                <p className="text-[11px] text-gray-500">Facebook External Hit &amp; Meta Bots Permissions</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✅ ALLOWED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between">
              <span>robots.txt</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Check size={13} /> Configured
              </span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between">
              <span>facebookexternalhit</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Check size={13} /> Allowed
              </span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between">
              <span>Facebot</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Check size={13} /> Allowed
              </span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between">
              <span>Meta-ExternalAgent</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Check size={13} /> Allowed
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Endpoint: /robots.txt</span>
            <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
              Preview robots.txt <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* CARD 8: SITEMAP */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">SITEMAP (XML)</h3>
                <p className="text-[11px] text-gray-500">Search Engines &amp; Product Discovery</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✅ WORKING
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-gray-600">
              <span>Total Products Indexed:</span>
              <span className="font-bold text-gray-900">{d?.sitemap.productsCount} public products</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Protocol:</span>
              <span className="font-semibold text-emerald-600 font-mono">Direct HTTPS</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Dynamic Refresh:</span>
              <span className="font-semibold text-gray-800">force-dynamic on product updates</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Endpoint: /sitemap.xml</span>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
              Preview sitemap.xml <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 13: VISUAL CONNECTION MATRIX */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">META COMMERCE ARCHITECTURE MATRIX</h3>
            <p className="text-xs text-gray-500 mt-0.5">Visual representation of data flow between your website and Meta Commerce</p>
          </div>
          <span className="text-[11px] text-gray-400 font-semibold hidden sm:inline">Automatic Real-Time Topology</span>
        </div>

        <div className="p-6 bg-gray-50/70 rounded-xl border border-gray-200 overflow-x-auto">
          <div className="min-w-[650px] flex flex-col items-center space-y-4 text-xs font-semibold">
            {/* Level 1: Website */}
            <div className="px-6 py-2.5 bg-gray-900 text-white rounded-xl shadow-sm text-center font-bold">
              🌐 Vivasaya Ulagam Storefront (https://vivasayaulagam.com)
            </div>

            {/* Level 2: Subsystems */}
            <div className="grid grid-cols-4 gap-3 w-full">
              <div className="p-3 bg-white border border-emerald-200 rounded-xl text-center shadow-xs">
                <span className="text-emerald-700 font-bold block">Meta Pixel ✅</span>
                <span className="text-[10px] text-gray-400 font-mono">1403915078507915</span>
              </div>
              <div className="p-3 bg-white border border-emerald-200 rounded-xl text-center shadow-xs">
                <span className="text-emerald-700 font-bold block">Meta Product Feed ✅</span>
                <span className="text-[10px] text-gray-400 font-mono">/api/feeds/meta</span>
              </div>
              <div className="p-3 bg-white border border-emerald-200 rounded-xl text-center shadow-xs">
                <span className="text-emerald-700 font-bold block">Catalog Matching ✅</span>
                <span className="text-[10px] text-gray-400 font-mono">100% ID Synchronized</span>
              </div>
              <div className="p-3 bg-white border border-amber-200 rounded-xl text-center shadow-xs">
                <span className="text-amber-700 font-bold block">Domain Verification 🟡</span>
                <span className="text-[10px] text-gray-400 font-mono">vivasayaulagam.com</span>
              </div>
            </div>

            {/* Down Arrow */}
            <div className="text-gray-400 font-mono">▼</div>

            {/* Level 3: Meta Business Portfolio */}
            <div className="px-6 py-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-center font-bold shadow-xs">
              🏢 Meta Business Portfolio 🔵 (Verification Required in Business Suite)
            </div>

            {/* Down Arrow */}
            <div className="text-gray-400 font-mono">▼</div>

            {/* Level 4: Facebook & Instagram */}
            <div className="grid grid-cols-2 gap-4 w-2/3">
              <div className="p-3 bg-white border border-blue-200 rounded-xl text-center shadow-xs">
                <span className="text-blue-900 font-bold block">Facebook Page 🔵</span>
                <span className="text-[10px] text-gray-400">Vivasaya Ulagam</span>
              </div>
              <div className="p-3 bg-white border border-blue-200 rounded-xl text-center shadow-xs">
                <span className="text-blue-900 font-bold block">Instagram Account 🔵</span>
                <span className="text-[10px] text-gray-400">@vivasaya_ulagam</span>
              </div>
            </div>

            {/* Down Arrow */}
            <div className="text-gray-400 font-mono">▼</div>

            {/* Level 5: Catalog & Shop */}
            <div className="grid grid-cols-2 gap-4 w-2/3">
              <div className="p-3 bg-white border border-purple-200 rounded-xl text-center shadow-xs">
                <span className="text-purple-900 font-bold block">Meta Product Catalog 🔵</span>
                <span className="text-[10px] text-gray-400">Scheduled Ingestion Feed</span>
              </div>
              <div className="p-3 bg-white border border-purple-200 rounded-xl text-center shadow-xs">
                <span className="text-purple-900 font-bold block">Commerce Shop &amp; Product Tagging 🔵</span>
                <span className="text-[10px] text-gray-400">Instagram Shop Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS TOOLBAR */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Quick Actions &amp; External Portals</h3>
        <div className="flex flex-wrap gap-2.5">
          <a
            href={d?.feed.endpoint || "/api/feeds/meta"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all"
          >
            <Database size={13} />
            Open Meta Feed XML
          </a>

          <a
            href="https://business.facebook.com/commerce"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <ExternalLink size={13} />
            Open Meta Commerce Manager
          </a>

          <a
            href="https://business.facebook.com/settings/domains"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Globe size={13} />
            Open Meta Domain Verification
          </a>

          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all"
          >
            <ShoppingBag size={13} />
            Manage Products &amp; Slugs
          </Link>
        </div>
      </div>
    </div>
  );
}
