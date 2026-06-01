import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import DashboardCharts from "@/components/admin/DashboardCharts";
import DashboardStats from "@/components/admin/DashboardStats";

export default async function AdminDashboard() {
  await dbConnect();
  
  const totalOrders = await Order.countDocuments();
  const totalUsers = await User.countDocuments();
  
  const revenueObj = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]);
  const totalRevenue = revenueObj[0]?.total || 0;

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const serializedOrders = recentOrders.map((order: any) => ({
    _id: order._id.toString(),
    orderId: order.orderId || `#${order._id.toString().slice(-8)}`,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    isPaid: order.isPaid,
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold font-heading text-gray-800 mb-8">Dashboard Overview</h1>
      
      <DashboardStats
        totalRevenue={totalRevenue}
        totalOrders={totalOrders}
        totalUsers={totalUsers}
        recentOrders={serializedOrders}
      />

      <DashboardCharts orderData={serializedOrders} />
    </div>
  );
}
