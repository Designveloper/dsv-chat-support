(function() {
  // Define a function to safely access the store
  function getStore() {
    return window.useChatStore || null;
  }

  window._chatSupport = {
    open: function () {
      const store = getStore();
      if (!store) {
        console.error('Chat support store not initialized');
        return false;
      }

      console.log('Opening chat widget via API');
      store.getState().open();
      return true;
    },

    hide: function () {
      const store = getStore();
      if (!store) {
        console.error('Chat support store not initialized');
        return false;
      }

      console.log('Hiding chat widget via API');
      store.getState().hide();
      return true;
    },

    identify: function (userId, userData) {
      // Input validation
      if (!userId || typeof userId !== "string") {
        console.error("Invalid userId provided to identify()");
        return false;
      }

      if (!userData || typeof userData !== "object") {
        console.error("Invalid userData provided to identify()");
        return false;
      }

      const store = getStore();
      if (!store) {
        console.error('Chat support store not initialized');
        return false;
      }

      console.log('Identifying visitor via API:', userId, userData);
      return store.getState().identify(userId, userData);
    },

    isShown: function () {
      const store = getStore();
      return store ? store.getState().isOpen : false;
    },
  };
})();