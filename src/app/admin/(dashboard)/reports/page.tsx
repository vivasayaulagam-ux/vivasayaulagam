import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import ReportsFilter from "@/components/admin/ReportsFilter";

export default async function AdminReports({ searchParams }: { searchParams: { status?: string, city?: string, date?: string } }) {
  await dbConnect();

  // Build query
  const query: any = {};
  
  if (searchParams.status && searchParams.status !== 'all') {
    query.status = searchParams.status;
  }
  
  if (searchParams.city && searchParams.city !== 'all') {
    // Note: This matches the exact string, case-sensitive right now
    query['shippingAddress.city'] = { $regex: new RegExp(searchParams.city, 'i') };
  }

  if (searchParams.date && searchParams.date !== 'all') {
    const now = new Date();
    if (searchParams.date === 'today') {
      query.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
    } else if (searchParams.date === 'week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: lastWeek };
    } else if (searchParams.date === 'month') {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: lastMonth };
    }
  }

  // Fetch unique cities for filter dropdown
  const allOrders = await Order.find().select('shippingAddress.city').lean();
  const uniqueCities = Array.from(new Set(allOrders.map((o: any) => o.shippingAddress?.city?.toLowerCase()).filter(Boolean)));

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
  
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.isPaid ? order.totalAmount : 0), 0);
  const totalCOD = orders.reduce((sum: number, order: any) => sum + (!order.isPaid && order.status !== 'cancelled' ? order.totalAmount : 0), 0);
  const totalOrders = orders.length;

  return (
    <div>
      <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">Reports & Analytics</h1>
      
      {/* Client Component for Filter Form */}
      <ReportsFilter currentParams={searchParams} cities={uniqueCities as string[]} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-br from-green-50 to-white">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paid Revenue</p>
          <p className="text-3xl font-bold text-primary mt-2">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Online / Razorpay payments</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-br from-yellow-50 to-white">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">COD Pending</p>
          <p className="text-3xl font-bold text-yellow-700 mt-2">₹{totalCOD.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Collect on delivery</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-br from-blue-50 to-white">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
          <p className="text-3xl font-bold text-blue-700 mt-2">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">Matching filters</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
              <th className="p-4 font-semibold">Order ID</th>
              <th className="p-4 font-semibold">City</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {orders.map((order: any) => (
              <tr key={order._id.toString()} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono font-bold text-primary">{order.orderId || order._id.toString().slice(-8)}</td>
                <td className="p-4 capitalize">{order.shippingAddress?.city || 'N/A'}</td>
                <td className="p-4 font-bold">₹{Number(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No orders match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
