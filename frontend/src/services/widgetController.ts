class WidgetController {
  private isOpen: boolean;
  private eventTarget: EventTarget;
  private updateCallback: ((isOpen: boolean) => void) | null;

  // Add visitor information properties
  private visitorId: string | null;
  private visitorData: Record<string, string | number | boolean | null> | null;

  constructor() {
    this.isOpen = false;
    this.eventTarget = new EventTarget();
    this.updateCallback = null;
    this.visitorId = null;
    this.visitorData = null;
  }

  // Set callback to update React state
  setUpdateCallback(callback: (isOpen: boolean) => void) {
    this.updateCallback = callback;
  }

  // Open the widget
  open() {
    this.isOpen = true;

    // Update React state if callback exists
    if (this.updateCallback) {
      this.updateCallback(true);
    }

    this.eventTarget.dispatchEvent(new CustomEvent('chatSupport.open'));
    document.dispatchEvent(new CustomEvent('chatSupport.open'));
  }

  // Hide the widget
  hide() {
    this.isOpen = false;

    // Update React state if callback exists
    if (this.updateCallback) {
      this.updateCallback(false);
    }

    this.eventTarget.dispatchEvent(new CustomEvent('chatSupport.hide'));
    document.dispatchEvent(new CustomEvent('chatSupport.hide'));
  }

  // Identify visitor - store their information
  identify(userId: string, userData: Record<string, string | number | boolean | null>) {
    this.visitorId = userId;
    this.visitorData = userData;

    // Dispatch event to notify of identification
    document.dispatchEvent(
      new CustomEvent('chatSupport.identify', {
        detail: { userId, userData }
      })
    );

    console.log('Visitor identified:', userId, userData);
    return true;
  }

  // Get visitor information - for use when sending messages
  getVisitorInfo(): { id: string | null, data: Record<string, string | number | boolean | null> | null } {
    return {
      id: this.visitorId,
      data: this.visitorData
    };
  }

  // Emit ready event when the widget is ready
  ready() {
    // Pass the controller instance in the event detail
    this.eventTarget.dispatchEvent(
      new CustomEvent('chatSupport.ready', {
        detail: { controller: this },
        bubbles: true,
        composed: true
      })
    );

    // Also dispatch on document for global access
    document.dispatchEvent(
      new CustomEvent('chatSupport.ready', {
        detail: { controller: this }
      })
    );
  }

  // Getter for widget open state
  get isWidgetOpen() {
    return this.isOpen;
  }
}

export default WidgetController;