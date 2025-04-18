import React from "react";
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
      initChat: (widgetId: string) => boolean;
      open: () => boolean;
      hide: () => boolean;
      identify: (userId: string, userData: VisitorData) => boolean;
      isShown: () => boolean;
    };
  }
}

// Assign the store to the window object
window.useChatStore = useChatStore;

// Define the chat support API
window._chatSupport = {
  initChat: function (widgetId: string) {
    if (!widgetId) {
      console.error("No widgetId provided to initChat");
      return false;
    }

    console.log("Initializing chat widget with ID:", widgetId);

    try {
      if (!customElements.get("chat-support-widget")) {
        customElements.define("chat-support-widget", ChatSupportWidget);
      }

      let widget: HTMLElement | null = document.querySelector(
        "chat-support-widget"
      );

      if (!widget) {
        console.log("Creating new chat-support-widget element");
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = "<chat-support-widget></chat-support-widget>";
        widget = tempDiv.firstChild as HTMLElement;
        document.body.appendChild(widget);
      }

      widget.setAttribute("widgetid", widgetId);
      widget.style.display = "block";

      useChatStore.getState().initialize();

      console.log("Widget mounted in DOM:", widget.isConnected);
      return true;
    } catch (error) {
      console.error("Error initializing chat widget:", error);
      return false;
    }
  },

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
    // Use a div without shadow DOM for better React compatibility
    this.mountPoint = document.createElement("div");
    this.appendChild(this.mountPoint);

    // Style the container to be visible
    this.style.display = "block";

    // Initialize the store
    if (!this.initialized) {
      useChatStore.getState().initialize();
      this.initialized = true;
    }

    this.addEventListener("chat-widget-init", this.handleWidgetInit.bind(this));
  }

  // Add a new method to force initialization
  forceInitialize(widgetId: string) {
    console.log("Forcing widget initialization with ID:", widgetId);
    this.workspaceId = widgetId;
    this.renderWidget();

    // Ensure the chat toggle button is visible
    setTimeout(() => {
      this.renderWidget();
      console.log("Widget re-rendered after forced initialization");
    }, 100);
  }

  handleWidgetInit() {
    console.log("Widget init event received");
    this.workspaceId = this.getAttribute("widgetid");
    if (this.workspaceId) {
      // Log before render
      console.log("About to render widget with ID:", this.workspaceId);
      this.renderWidget();

      // Force a second render after a short delay for stability
      setTimeout(() => {
        if (this.workspaceId) {
          this.renderWidget();
          console.log("Widget re-rendered after init event");
        }
      }, 100);
    } else {
      console.error("Cannot initialize widget: No widgetid attribute");
    }
  }

  connectedCallback() {
    // Get the workspace ID from the attribute
    this.workspaceId = this.getAttribute("widgetid");

    if (!this.workspaceId) {
      console.error("No widgetid attribute provided to chat-support-widget");
      this.mountPoint.innerHTML =
        '<div style="color: red; padding: 10px;">Widget ID missing</div>';
      return;
    }

    console.log(
      "Connected callback - rendering widget with ID:",
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
      this.renderWidget();
    }
  }

  renderWidget() {
    if (!this.workspaceId) return;

    try {
      console.log("Rendering widget with ID:", this.workspaceId);
      if (!this.root) {
        console.log("Creating new React root");
        this.root = createRoot(this.mountPoint);
      }

      console.log("Rendering ChatWidget component");
      this.root.render(<ChatWidget workspaceId={this.workspaceId} />);

      // Add a visual indicator that React has rendered something
      console.log("React render complete");
    } catch (error) {
      console.error("Error rendering chat widget:", error);
      // Display error to help with debugging
      this.mountPoint.innerHTML = `<div style="color: red; padding: 10px;">Error rendering chat: ${error}</div>`;
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
