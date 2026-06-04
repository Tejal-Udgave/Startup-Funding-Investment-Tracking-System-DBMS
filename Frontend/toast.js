(function () {
  const TOAST_TYPES = {
    success: { className: "sfits-toast--success", icon: "✓" },
    error: { className: "sfits-toast--error", icon: "⚠️" },
    warning: { className: "sfits-toast--warning", icon: "⚠️" },
    info: { className: "sfits-toast--info", icon: "ℹ️" },
  };

  const containerId = "sfits-toast-container";

  function ensureToastContainer() {
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.className = "sfits-toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  window.showToast = function showToast(message, type = "info") {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    const toastType = TOAST_TYPES[type] ? type : "info";
    toast.className = `sfits-toast ${TOAST_TYPES[toastType].className}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const icon = document.createElement("span");
    icon.className = "sfits-toast__icon";
    icon.textContent = TOAST_TYPES[toastType].icon;

    const messageNode = document.createElement("div");
    messageNode.className = "sfits-toast__message";
    messageNode.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.className = "sfits-toast__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Dismiss notification");
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => {
      toast.classList.add("sfits-toast--hide");
      toast.addEventListener(
        "animationend",
        () => {
          toast.remove();
        },
        { once: true },
      );
    });

    toast.append(icon, messageNode, closeButton);
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("sfits-toast--visible");
    });

    setTimeout(() => {
      if (!toast.parentElement) return;
      toast.classList.add("sfits-toast--hide");
      toast.addEventListener(
        "animationend",
        () => {
          toast.remove();
        },
        { once: true },
      );
    }, 3800);

    return toast;
  };
})();
