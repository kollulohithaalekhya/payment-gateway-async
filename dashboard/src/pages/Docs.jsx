import { useEffect } from "react";

export default function Docs() {

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "http://localhost:3001/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openCheckout = () => {
    if (!window.PaymentGateway) {
      alert("SDK not loaded yet. Please wait a moment.");
      return;
    }

    const checkout = new window.PaymentGateway({
      key: "key_test_123",
      orderId: "order_test_1",
      onSuccess: (res) => {
        console.log("SUCCESS:", res);
        alert("Payment Success!");
      },
      onFailure: (err) => {
        console.log("FAIL:", err);
        alert("Payment Failed!");
      },
      onClose: () => {
        console.log("CLOSED");
      }
    });

    checkout.open();
  };

  return (
    <div data-test-id="api-docs">
      <h2>Integration Guide</h2>

      <h3>1. Create Order</h3>
      <pre>
{`curl -X POST http://localhost:8000/api/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: key_test_123" \\
  -d '{
    "amount": 50000,
    "currency": "INR"
  }'`}
      </pre>

      <h3>2. SDK Integration</h3>
      <pre>
{`<script src="http://localhost:3001/checkout.js"></script>
<script>
const checkout = new PaymentGateway({
  key: 'key_test_abc123',
  orderId: 'order_xyz',
  onSuccess: (res) => console.log(res)
});
checkout.open();
</script>`}
      </pre>

      <button
        style={{
          marginTop: 20,
          padding: "10px 20px",
          cursor: "pointer"
        }}
        onClick={openCheckout}
      >
        Open Checkout Test
      </button>

      <h3 style={{ marginTop: 40 }}>3. Verify Webhook Signature</h3>
      <pre>
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex') === signature;
}`}
      </pre>
    </div>
  );
}