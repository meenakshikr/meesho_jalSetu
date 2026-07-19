export async function createRazorpayOrder(amount: number, receipt: string) {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
    }),
  })
  return response.json()
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface RazorpayWindow extends Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: { contact?: string; name?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

export interface RazorpayInstance {
  open: () => void
}

export interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}
