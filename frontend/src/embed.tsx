import { createRoot, Root } from "react-dom/client";
import ChatWidget from "./components/ChatWidget";
import { useChatStore } from "./stores/useChatStore";
import type { VisitorData } from "./stores/useChatStore";
import "./styles/main.scss";
import "./components/ChatWidget.scss";

// Extend the Window interface to declare custom properties
declare global {
  interface Window {
    initChatWidget: (container: HTMLElement, workspaceId: string) => void;
    useChatStore: typeof useChatStore;
    _chatSupport: {
      open: () => boolean;
      hide: () => boolean;
      identify: (userId: string, userData: VisitorData) => boolean;
      isShown: () => boolean;
    };
  }
}

// Assign the store to the window object
window.useChatStore = useChatStore;

// Define the chat widget initialization function (keep for backward compatibility)
window.initChatWidget = function (container: HTMLElement, workspaceId: string) {
  if (!(container instanceof HTMLElement)) {
    console.error("Invalid container provided to initChatWidget");
    return;
  }
  if (!workspaceId || typeof workspaceId !== "string") {
    console.error("Invalid workspaceId provided to initChatWidget");
    return;
  }
  const root = createRoot(container);
  root.render(<ChatWidget workspaceId={workspaceId} />);
};

// Define the chat support API
window._chatSupport = {
  open: function () {
    const store = window.useChatStore;
    if (!store) {
      console.error("Chat support store not initialized");
      return false;
    }
    console.log("Opening chat widget via API");
    store.getState().open();

    // Dispatch an event to notify that the state has changed
    document.dispatchEvent(
      new CustomEvent("chatSupport.stateChanged", {
        detail: { isOpen: true },
      })
    );

    return true;
  },
  hide: function () {
    const store = window.useChatStore;
    if (!store) {
      console.error("Chat support store not initialized");
      return false;
    }
    console.log("Hiding chat widget via API");
    store.getState().hide();

    // Dispatch an event to notify that the state has changed
    document.dispatchEvent(
      new CustomEvent("chatSupport.stateChanged", {
        detail: { isOpen: false },
      })
    );

    return true;
  },
  identify: function (userId: string, userData: VisitorData) {
    const store = window.useChatStore;
    if (!store) {
      console.error("Chat support store not initialized");
      return false;
    }
    console.log("Identifying user via API", { userId, userData });
    store.getState().identify(userId, userData);

    return true;
  },
  isShown: function () {
    const store = window.useChatStore;
    return store ? store.getState().isOpen : false;
  },
};

// Create and register the custom element
class ChatSupportWidget extends HTMLElement {
  private root: Root | null = null;
  private mountPoint: HTMLDivElement;
  private initialized = false;
  private workspaceId: string | null = null;

  constructor() {
    super();
    console.log("Chat support widget constructor called");

    // Use a div without shadow DOM for better React compatibility
    this.mountPoint = document.createElement("div");
    this.appendChild(this.mountPoint);

    // Style the container
    this.style.display = "contents"; // This makes the element itself invisible but shows its children

    // Initialize the store
    if (!this.initialized) {
      console.log("Initializing chat store");
      useChatStore.getState().initialize();
      this.initialized = true;
    }
  }

  connectedCallback() {
    // Get the workspace ID from the attribute
    console.log("ChatSupportWidget connectedCallback called");
    this.workspaceId = this.getAttribute("widgetid");

    if (!this.workspaceId) {
      console.error("No widgetid attribute provided to chat-support-widget");
      return;
    }

    console.log(
      "Initializing chat widget with workspace ID:",
      this.workspaceId
    );
    this.renderWidget();

    // Set up event listeners for API interactions
    document.addEventListener(
      "chatSupport.stateChanged",
      this.handleStateChange.bind(this)
    );
  }

  disconnectedCallback() {
    // Clean up when the element is removed from the DOM
    document.removeEventListener(
      "chatSupport.stateChanged",
      this.handleStateChange.bind(this)
    );
    if (this.root) {
      this.root.unmount();
    }
  }

  handleStateChange() {
    // Force re-render when state changes
    if (this.root && this.workspaceId) {
      console.log("State changed, re-rendering widget");
      this.renderWidget();
    }
  }

  renderWidget() {
    if (!this.workspaceId) return;
    try {
      if (!this.root) {
        this.root = createRoot(this.mountPoint);
      }
      console.log("Rendering ChatWidget into mountPoint");
      this.root.render(<ChatWidget workspaceId={this.workspaceId} />);
    } catch (error) {
      console.error("Error rendering chat widget:", error);
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    // Handle attribute changes
    if (name === "widgetid" && oldValue !== newValue) {
      this.workspaceId = newValue;
      this.renderWidget();
    }
  }

  static get observedAttributes() {
    return ["widgetid"];
  }
}
customElements.define("chat-support-widget", ChatSupportWidget);
