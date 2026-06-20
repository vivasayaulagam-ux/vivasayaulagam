import dbConnect from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import CustomersClient from "@/components/admin/CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await dbConnect();

  // Fetch users with role 'user'
  const users = await User.find({ role: "user" }).sort({ createdAt: -1 }).lean();
  
  // Fetch all orders
  const orders = await Order.find().sort({ createdAt: -1 }).lean();

  const serializedUsers = users.map((user: any) => ({
    id: user._id.toString(),
    name: user.name || "Guest",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "user",
    joined: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    addresses: (user.addresses || []).map((addr: any) => ({
      _id: addr._id?.toString() || "",
      label: addr.label || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
    })),
  }));

  const serializedOrders = orders.map((order: any) => ({
    id: order._id.toString(),
    orderId: order.orderId || "",
    userId: order.user ? order.user.toString() : "",
    totalAmount: order.totalAmount || 0,
    status: order.status || "pending",
    isPaid: order.isPaid || false,
    createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    items: (order.items || []).map((item: any) => ({
      name: item.name || "",
      price: item.price || 0,
      quantity: item.quantity || 0,
      image: item.image || "",
    })),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Customers</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track and manage customer profiles, orders, and value tier levels</p>
      </div>

      <CustomersClient customers={serializedUsers} orders={serializedOrders} />
    </div>
  );
}
