import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type InvoiceItem = {
  name: string;
  price: number;
  quantity: number;
};

type InvoiceOrder = {
  orderId?: string;
  items: InvoiceItem[];
  subtotalAmount?: number;
  deliveryFee?: number;
  totalWeightKg?: number;
  courierRate?: number;
  totalAmount: number;
  createdAt: string | Date;
  status: string;
  isPaid?: boolean;
  shippingAddress?: {
    fullName?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
  };
  user?: {
    name?: string;
  };
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateInvoiceHTML(order: InvoiceOrder): string {
  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13px;">${formatCurrency(item.price)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13px; font-weight: 600;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const calculatedSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = typeof order.subtotalAmount === 'number' && order.subtotalAmount > 0 ? order.subtotalAmount : calculatedSubtotal;
  const deliveryFee = typeof order.deliveryFee === 'number' ? order.deliveryFee : order.totalAmount - subtotal;

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${order.orderId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; background: #fff; }
    .invoice-wrapper { max-width: 800px; margin: 0 auto; padding: 40px; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 30px; border-bottom: 3px solid #34a121; margin-bottom: 30px; }
    .brand { display: flex; flex-direction: column; }
    .brand-name { font-size: 26px; font-weight: 900; color: #34a121; letter-spacing: -0.5px; text-transform: uppercase; }
    .brand-sub { font-size: 10px; color: #6b7280; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; font-weight: 900; color: #34a121; letter-spacing: -1px; }
    .invoice-title p { font-size: 13px; color: #6b7280; margin-top: 4px; }
    
    /* Addresses */
    .addresses { display: flex; gap: 40px; margin-bottom: 30px; }
    .address-block { flex: 1; background: #f9fafb; border-radius: 8px; padding: 16px; }
    .address-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-bottom: 10px; font-weight: 700; }
    .address-block p { font-size: 13px; color: #333; line-height: 1.6; }
    .address-block strong { color: #111; font-weight: 700; }
    
    /* Order meta */
    .order-meta { display: flex; gap: 20px; margin-bottom: 30px; }
    .meta-item { flex: 1; text-align: center; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; }
    .meta-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
    .meta-item .value { font-size: 15px; font-weight: 700; color: #34a121; margin-top: 4px; }
    
    /* Items table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #34a121; }
    thead th { padding: 12px; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    
    /* Totals */
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table tr td { padding: 6px 12px; font-size: 13px; }
    .totals-table .subtotal td { color: #6b7280; }
    .totals-table .grand-total td { background: #34a121; color: #fff; font-size: 16px; font-weight: 900; padding: 12px; border-radius: 4px; }
    
    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px; }
    .footer strong { color: #34a121; }
    
    /* Payment badge */
    .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
    .paid { background: #dcfce7; color: #15803d; }
    .cod { background: #fef9c3; color: #854d0e; }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <span class="brand-name">🌿 Vivasaya Ulagam</span>
        <span class="brand-sub">Agri Products · Tamil Nadu</span>
        <span style="font-size:11px; color:#6b7280; margin-top:6px;">📍 Tamil Nadu, India</span>
        <span style="font-size:11px; color:#6b7280;">📧 vivasayaulagam@gmail.com</span>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p><strong>#${order.orderId}</strong></p>
        <p>Date: ${invoiceDate}</p>
        <span class="payment-badge ${order.isPaid ? 'paid' : 'cod'}">${order.isPaid ? '✓ PAID' : '💵 CASH ON DELIVERY'}</span>
      </div>
    </div>
    
    <!-- Addresses -->
    <div class="addresses">
      <div class="address-block">
        <h3>Bill From</h3>
        <p><strong>Vivasaya Ulagam</strong><br>
        Agri Products<br>
        Tamil Nadu, India<br>
        GSTIN: [Your GSTIN]</p>
      </div>
      <div class="address-block">
        <h3>Ship To</h3>
        <p>
          <strong>${order.shippingAddress?.fullName || order.user?.name || 'Customer'}</strong><br>
          ${order.shippingAddress?.address || ''}<br>
          ${order.shippingAddress?.city || ''} - ${order.shippingAddress?.postalCode || ''}<br>
          📞 ${order.shippingAddress?.phone || ''}
        </p>
      </div>
    </div>
    
    <!-- Order Meta -->
    <div class="order-meta">
      <div class="meta-item">
        <div class="label">Order ID</div>
        <div class="value">${order.orderId}</div>
      </div>
      <div class="meta-item">
        <div class="label">Order Date</div>
        <div class="value">${invoiceDate}</div>
      </div>
      <div class="meta-item">
        <div class="label">Status</div>
        <div class="value">${order.status.toUpperCase()}</div>
      </div>
    </div>
    
    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals">
      <table class="totals-table">
        <tr class="subtotal">
          <td>Subtotal</td>
          <td style="text-align:right;">${formatCurrency(subtotal)}</td>
        </tr>
        ${order.totalWeightKg ? `
        <tr class="subtotal">
          <td>Total Weight</td>
          <td style="text-align:right;">${order.totalWeightKg.toFixed(2)} kg</td>
        </tr>
        ` : ''}
        ${order.courierRate ? `
        <tr class="subtotal">
          <td>Courier Rate</td>
          <td style="text-align:right;">${formatCurrency(order.courierRate)} / kg</td>
        </tr>
        ` : (order.deliveryFee && order.totalWeightKg ? `
        <tr class="subtotal">
          <td>Courier Rate</td>
          <td style="text-align:right;">${formatCurrency(order.deliveryFee / order.totalWeightKg)} / kg</td>
        </tr>
        ` : '')}
        <tr class="subtotal">
          <td>Delivery Fee</td>
          <td style="text-align:right;">${formatCurrency(Math.max(0, deliveryFee))}</td>
        </tr>
        <tr class="grand-total">
          <td>TOTAL</td>
          <td style="text-align:right;">${formatCurrency(order.totalAmount)}</td>
        </tr>
      </table>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Thank you for shopping with <strong>Vivasaya Ulagam</strong>! 🌿</p>
      <p style="margin-top:6px;">For queries, contact us at vivasayaulagam@gmail.com or WhatsApp: +91 XXXXXXXXXX</p>
      <p style="margin-top:8px; color:#d1d5db;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate ownership or admin authorization
    const orderUser = order.user as { _id?: { toString: () => string }; email?: string } | null;
    const sessionUser = session.user as { id?: string; email?: string | null; role?: string } | undefined;
    const isOwner = sessionUser?.email === orderUser?.email || sessionUser?.id === orderUser?._id?.toString();
    const isAdmin = sessionUser?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Access denied to other user invoices' }, { status: 403 });
    }

    const html = generateInvoiceHTML(order.toObject ? order.toObject() : order);

    // Return HTML that browser can print as PDF
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Invoice-For': order.orderId || orderId,
      },
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
