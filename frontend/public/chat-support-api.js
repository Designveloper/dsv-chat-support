(function () {
  const queue = [];
  let isReady = false;
  let controller = null;

  document.addEventListener("chatSupport.ready", function (event) {
    if (event.detail && event.detail.controller) {
      controller = event.detail.controller;
      isReady = true;
      console.log("Chat support API ready, processing queue:", queue);
      processQueue();
    }
  });

  const methods = {
    open: function () {
      if (controller) {
        console.log("Opening chat widget via API");
        controller.open();
        return true;
      } else {
        console.log("Queueing open command");
        queue.push({ method: "open" });
        return false;
      }
    },

    hide: function () {
      if (controller) {
        console.log("Hiding chat widget via API");
        controller.hide();
        return true;
      } else {
        console.log("Queueing hide command");
        queue.push({ method: "hide" });
        return false;
      }
    },

    isShown: function () {
      return controller ? controller.isWidgetOpen : false;
    },

    // Add identify method
    identify: function (userId, userData) {
      if (!userId || typeof userId !== "string") {
        console.error("Invalid userId provided to identify()");
        return false;
      }

      if (!userData || typeof userData !== "object") {
        console.error("Invalid userData provided to identify()");
        return false;
      }

      if (controller) {
        console.log("Identifying visitor via API:", userId, userData);
        return controller.identify(userId, userData);
      } else {
        console.log("Queueing identify command");
        queue.push({ method: "identify", args: [userId, userData] });
        return false;
      }
    },
  };

  window._chatSupport = new Proxy(methods, {
    get(target, prop) {
      if ((controller && isReady) || prop === "isShown") {
        return target[prop].apply(null, args);
      } else {
        queue.push({ method: prop, args });
        return false;
      }
    },
  });

  function processQueue() {
    queue.forEach(({ method, args = [] }) => {
      if (typeof methods[method] === "function") {
        methods[method].apply(null, args);
      }
    });
    queue.length = 0;
  }
})();
