export interface OrderEmailData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  items?: Array<{
    product_title: string;
    quantity: number;
    price: number;
  }>;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: #6366f1; color: white; padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
  .content { padding: 32px 24px; background: #f9fafb; }
  .card { background: white; padding: 24px; margin: 16px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
  .footer { text-align: center; padding: 24px; color: #6b7280; font-size: 14px; }
  .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
  li:last-child { border-bottom: none; }
  .label { color: #6b7280; font-size: 14px; }
  .value { color: #1f2937; font-weight: 500; }
`;

export function renderOrderConfirmationEmail(order: OrderEmailData): string {
  const itemsList = order.items?.map(item => 
    `<li>
      <div style="display: flex; justify-content: space-between;">
        <span>${item.product_title} × ${item.quantity}</span>
        <span class="value">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    </li>`
  ).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Order Confirmed</h1>
        </div>
        <div class="content">
          <p>Hi ${order.customer_name},</p>
          <p>Thank you for your order! We've received your payment and are preparing your items.</p>
          
          <div class="card">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><span class="label">Order Number:</span> <strong>${order.order_number}</strong></p>
            <p><span class="label">Total:</span> <strong>$${order.total.toFixed(2)}</strong></p>
            
            ${itemsList ? `<h3>Items</h3><ul>${itemsList}</ul>` : ''}
            
            ${order.shipping_address_line1 ? `
              <h3>Shipping Address</h3>
              <p>
                ${order.shipping_address_line1}<br>
                ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br>' : ''}
                ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br>
                ${order.shipping_country}
              </p>
            ` : ''}
          </div>
          
          <p>We'll send you another email when your order ships.</p>
          <p>Questions? Reply to this email or visit our <a href="https://softbrain.space/contact" style="color: #6366f1;">contact page</a>.</p>
        </div>
        <div class="footer">
          <p><strong>SoftBrain Space</strong><br>
          Therapeutic Line-Art Coloring Books</p>
          <p><a href="https://softbrain.space" style="color: #6366f1; text-decoration: none;">softbrain.space</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function renderShippingEmail(order: OrderEmailData): string {
  const trackingLink = order.tracking_number && order.carrier
    ? getTrackingUrl(order.carrier, order.tracking_number)
    : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: #10b981;">
          <h1>📦 Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <p>Hi ${order.customer_name},</p>
          <p>Great news! Your order is on its way.</p>
          
          <div class="card" style="text-align: center;">
            <h2 style="margin-top: 0;">Tracking Information</h2>
            <p><span class="label">Order Number:</span> <strong>${order.order_number}</strong></p>
            ${order.carrier ? `<p><span class="label">Carrier:</span> <strong>${order.carrier}</strong></p>` : ''}
            ${order.tracking_number ? `<p><span class="label">Tracking Number:</span> <strong>${order.tracking_number}</strong></p>` : ''}
            ${order.estimated_delivery ? `<p><span class="label">Estimated Delivery:</span> <strong>${new Date(order.estimated_delivery).toLocaleDateString()}</strong></p>` : ''}
            
            ${trackingLink ? `<p style="margin-top: 24px;"><a href="${trackingLink}" class="button">Track Your Package</a></p>` : ''}
          </div>
          
          <p>You'll receive another email when your order is delivered.</p>
        </div>
        <div class="footer">
          <p><strong>SoftBrain Space</strong></p>
          <p><a href="https://softbrain.space" style="color: #6366f1; text-decoration: none;">softbrain.space</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function renderDeliveryEmail(order: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: #10b981;">
          <h1>✓ Order Delivered!</h1>
        </div>
        <div class="content">
          <p>Hi ${order.customer_name},</p>
          <p>Your order <strong>${order.order_number}</strong> has been delivered!</p>
          
          <div class="card">
            <p>We hope you enjoy your SoftBrain Space products. If you have any issues or questions, please don't hesitate to reach out.</p>
            <p>Thank you for your purchase!</p>
          </div>
          
          <p style="text-align: center; margin-top: 24px;">
            <a href="https://softbrain.space/store" class="button">Shop Again</a>
          </p>
        </div>
        <div class="footer">
          <p><strong>SoftBrain Space</strong></p>
          <p><a href="https://softbrain.space" style="color: #6366f1; text-decoration: none;">softbrain.space</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const carriers: Record<string, string> = {
    'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  
  return carriers[carrier] || `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;
}
