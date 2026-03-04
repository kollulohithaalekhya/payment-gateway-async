import React from 'react';

export default function CheckoutForm() {
  const targetOrigin =
    new URLSearchParams(window.location.search).get('origin') ||
    'http://localhost:3000'; // fallback

  const pay = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': Date.now().toString()
        },
        body: JSON.stringify({
          amount: 50000,
          currency: 'INR'
        })
      });

      const data = await res.json();

      window.parent.postMessage(
        {
          type: 'PAYMENT_SUCCESS',
          payload: data
        },
        targetOrigin
      );
    } catch (err) {
      window.parent.postMessage(
        {
          type: 'PAYMENT_FAILURE',
          payload: { error: 'Payment failed' }
        },
        targetOrigin
      );
    }
  };
  return (
  <div style={{
    padding: 28,
    fontFamily: "system-ui, -apple-system, sans-serif",
    textAlign: "center"
  }}>
    <h2 style={{
      marginBottom: 24,
      fontSize: "22px",
      fontWeight: "600"
    }}>
      Pay ₹500
    </h2>

    <button
      style={{
        padding: "12px 20px",
        marginRight: 12,
        background: "#005D30",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        cursor: "pointer",
        transition: "0.2s ease"
      }}
      onClick={pay}
    >
      Pay Now
    </button>

    <button
      style={{
        padding: "12px 20px",
        background: "#f5f5f5",
        border: "1px solid #ddd",
        borderRadius: 8,
        fontSize: 14,
        cursor: "pointer"
      }}
      onClick={() =>
        window.parent.postMessage({ type: 'CLOSE_MODAL' }, targetOrigin)
      }
    >
      Cancel
    </button>
  </div>
);

}