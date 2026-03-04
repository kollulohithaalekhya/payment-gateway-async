import './styles.css';
class PaymentGateway {
  constructor(options) {
    this.key = options.key;
    this.orderId = options.orderId;
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
    this.onClose = options.onClose;

    this.handleMessage = this.handleMessage.bind(this);
  }

  open() {
    this.createModal();
  }

  close() {
    if (this.overlay) {
      window.removeEventListener('message', this.handleMessage);
      document.body.removeChild(this.overlay);
      this.overlay = null;
      this.onClose?.();
    }
  }

  createModal() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'pg-overlay';
    this.overlay.setAttribute('data-testid', 'payment-modal');

    const iframe = document.createElement('iframe');
    iframe.className = 'pg-iframe';
    iframe.setAttribute('data-testid', 'payment-iframe');

    // Secure origin passing
    const parentOrigin = window.location.origin;
    iframe.src = `http://localhost:3001/iframe.html?origin=${encodeURIComponent(parentOrigin)}`;

    // Close button 
    const closeButton = document.createElement('button');
    closeButton.innerText = '×';
    closeButton.className = 'pg-close-btn';
    closeButton.setAttribute('data-testid', 'close-modal-button');
    closeButton.onclick = () => this.close();

    this.overlay.appendChild(closeButton);
    this.overlay.appendChild(iframe);

    document.body.appendChild(this.overlay);

    window.addEventListener('message', this.handleMessage);
  }

  handleMessage(event) {
    if (!event.data || !event.data.type) return;

    // Security: verify origin matches iframe
    const allowedOrigin = 'http://localhost:3001';
    if (event.origin !== allowedOrigin) return;

    if (event.data.type === 'PAYMENT_SUCCESS') {
      this.onSuccess?.(event.data.payload);
      this.close();
    }

    if (event.data.type === 'PAYMENT_FAILURE') {
      this.onFailure?.(event.data.payload);
      this.close();
    }

    if (event.data.type === 'CLOSE_MODAL') {
      this.close();
    }
  }
}
export { PaymentGateway };