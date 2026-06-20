'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trash2, Loader2, Star, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface ReviewItem {
  _id: string;
  product_id: {
    _id: string;
    title: string;
  } | null;
  customer_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.success && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        );
      } else {
        alert(data.error || 'Failed to update review status');
      }
    } catch (err) {
      alert('Error updating review status');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    setActioningId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch (err) {
      alert('Error deleting review');
    } finally {
      setActioningId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
        <p className="text-sm text-gray-500">Moderate customer reviews before they are displayed on the store front pages</p>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-250 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{reviews.length}</p>
        </div>
        <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-yellow-600 uppercase">Pending Approvals</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {reviews.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50/50 border border-green-200 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-green-600 uppercase">Approved Reviews</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {reviews.filter((r) => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-red-50/50 border border-red-200 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-red-600 uppercase">Rejected Reviews</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {reviews.filter((r) => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 capitalize transition-colors outline-none whitespace-nowrap ${
              statusFilter === tab
                ? 'border-[#34a121] text-[#34a121]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reviews Table Card */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="animate-spin inline-block mr-2 text-[#34a121]" size={20} />
            Loading product reviews catalog...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No reviews found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-600 uppercase">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {filteredReviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 max-w-[200px] truncate">
                      {rev.product_id?.title || 'Unknown Product'}
                    </td>
                    <td className="px-6 py-4 font-medium">{rev.customer_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex text-[#ffc107]">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i <= rev.rating ? 'fill-current text-[#ffc107]' : 'text-gray-200'
                            }
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={rev.comment}>
                      {rev.comment}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {rev.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck size={12} /> Approved
                        </span>
                      )}
                      {rev.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-250">
                          <ShieldAlert size={12} /> Pending
                        </span>
                      )}
                      {rev.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <ShieldX size={12} /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rev.status !== 'approved' && (
                          <button
                            disabled={actioningId === rev._id}
                            onClick={() => handleUpdateStatus(rev._id, 'approved')}
                            className="p-1.5 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Approve Review"
                          >
                            <Check size={15} />
                          </button>
                        )}
                        {rev.status !== 'rejected' && (
                          <button
                            disabled={actioningId === rev._id}
                            onClick={() => handleUpdateStatus(rev._id, 'rejected')}
                            className="p-1.5 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Reject Review"
                          >
                            <X size={15} />
                          </button>
                        )}
                        <button
                          disabled={actioningId === rev._id}
                          onClick={() => handleDeleteReview(rev._id)}
                          className="p-1.5 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
