import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.scss";
import App from "./App.tsx";
import { useChatStore } from "./stores/useChatStore.ts";

// Expose the store to window for external API usage
window.useChatStore = useChatStore;

// Initialize the chat widget API after DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded, initializing chat support");
  setTimeout(() => {
    if (window.useChatStore) {
      window.useChatStore.getState().initialize();
      console.log("Chat support initialized successfully");
    } else {
      console.error("Failed to initialize chat support: store not available");
    }
  }, 100);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
