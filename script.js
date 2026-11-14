const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
  });
}

const cartStorageKey = "trina-studio-print-cart";
const shippingHandling = 1;
const cartDialog = document.querySelector("[data-cart-dialog]");
const cartItemsList = document.querySelector("[data-cart-items]");
const cartCounts = Array.from(document.querySelectorAll("[data-cart-count]"));
const cartOpenLink = document.querySelector("[data-cart-open]");
let cart = {};

try {
  const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
  if (savedCart && typeof savedCart === "object" && !Array.isArray(savedCart)) {
    Object.entries(savedCart).forEach(([id, item]) => {
      if (item && typeof item.name === "string" && Number.isFinite(item.price)
        && Number.isInteger(item.quantity) && item.quantity > 0) {
        cart[id] = { name: item.name, price: item.price, quantity: item.quantity };
      }
    });
  }
} catch (error) {
  console.warn("Could not restore the print cart.", error);
}

const saveCart = () => {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  } catch (error) {
    console.warn("Could not save the print cart.", error);
  }
};

const renderCart = () => {
  const items = Object.entries(cart);
  const itemCount = items.reduce((total, [, item]) => total + item.quantity, 0);
  cartCounts.forEach((count) => {
    count.textContent = String(itemCount);
    count.closest("[data-cart-open]")?.setAttribute(
      "aria-label",
      `Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`,
    );
  });

  if (!cartDialog || !cartItemsList) return;
  const emptyMessage = cartDialog.querySelector("[data-cart-empty]");
  const cartTotal = cartDialog.querySelector("[data-cart-total]");
  const subtotal = cartDialog.querySelector("[data-cart-subtotal]");
  const shipping = cartDialog.querySelector("[data-cart-shipping]");
  const grandTotal = cartDialog.querySelector("[data-cart-grand-total]");
  const checkout = cartDialog.querySelector("[data-cart-checkout]");
  cartItemsList.replaceChildren();

  items.forEach(([id, item]) => {
    const line = document.createElement("li");
    line.className = "cart-line";

    const thumbnail = document.createElement("img");
    thumbnail.className = "cart-thumbnail";
    thumbnail.src = id;
    thumbnail.alt = "";

    const description = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = item.name;
    const quantity = document.createElement("p");
    quantity.textContent = `${item.quantity} × $${item.price.toFixed(2)} each`;
    description.append(name, quantity);

    const lineTotal = document.createElement("strong");
    lineTotal.textContent = `$${(item.quantity * item.price).toFixed(2)}`;

    const remove = document.createElement("button");
    remove.className = "cart-remove";
    remove.type = "button";
    remove.dataset.cartRemove = id;
    remove.setAttribute("aria-label", `Remove ${item.name} from cart`);
    remove.textContent = "remove";
    line.append(thumbnail, description, lineTotal, remove);
    cartItemsList.append(line);
  });

  if (emptyMessage) emptyMessage.hidden = itemCount > 0;
  if (cartTotal) cartTotal.hidden = itemCount === 0;
  if (checkout) checkout.hidden = itemCount === 0;
  const subtotalAmount = items.reduce((total, [, item]) => total + item.quantity * item.price, 0);
  if (subtotal) subtotal.textContent = `$${subtotalAmount.toFixed(2)}`;
  if (shipping) shipping.textContent = `$${shippingHandling.toFixed(2)}`;
  if (grandTotal) {
    grandTotal.textContent = `$${(subtotalAmount + shippingHandling).toFixed(2)}`;
  }
};

const renderCheckout = () => {
  const checkoutItems = document.querySelector("[data-checkout-items]");
  if (!checkoutItems) return;

  const items = Object.entries(cart);
  const emptyState = document.querySelector("[data-checkout-empty]");
  const checkoutContent = document.querySelector("[data-checkout-content]");
  const subtotal = document.querySelector("[data-checkout-subtotal]");
  const shipping = document.querySelector("[data-checkout-shipping]");
  const grandTotal = document.querySelector("[data-checkout-grand-total]");

  if (emptyState) emptyState.hidden = items.length > 0;
  if (checkoutContent) checkoutContent.hidden = items.length === 0;
  checkoutItems.replaceChildren();

  const subtotalAmount = items.reduce((total, [, item]) => total + item.quantity * item.price, 0);
  items.forEach(([id, item]) => {
    const row = document.createElement("li");
    row.className = "checkout-item";

    const thumbnail = document.createElement("img");
    thumbnail.className = "checkout-item-image";
    thumbnail.src = id;
    thumbnail.alt = "";

    const quantity = document.createElement("span");
    quantity.className = "checkout-item-quantity";
    quantity.textContent = String(item.quantity);

    const details = document.createElement("div");
    details.className = "checkout-item-details";
    const name = document.createElement("strong");
    name.textContent = item.name;
    details.append(name);

    const lineTotal = document.createElement("strong");
    lineTotal.textContent = `$${(item.quantity * item.price).toFixed(2)}`;
    row.append(thumbnail, quantity, details, lineTotal);
    checkoutItems.append(row);
  });

  if (subtotal) subtotal.textContent = `$${subtotalAmount.toFixed(2)}`;
  if (shipping) shipping.textContent = `$${shippingHandling.toFixed(2)}`;
  if (grandTotal) {
    grandTotal.textContent = `$${(subtotalAmount + shippingHandling).toFixed(2)}`;
  }
};

renderCart();
renderCheckout();

cartOpenLink?.addEventListener("click", (event) => {
  if (!cartDialog) return;
  event.preventDefault();
  if (!cartDialog.open) cartDialog.showModal();
});

cartDialog?.querySelector("[data-cart-close]")?.addEventListener("click", () => cartDialog.close());
cartDialog?.addEventListener("click", (event) => {
  if (event.target === cartDialog) cartDialog.close();
});
cartItemsList?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-cart-remove]");
  if (!removeButton) return;
  delete cart[removeButton.dataset.cartRemove];
  saveCart();
  renderCart();
});

if (cartDialog && window.location.hash === "#cart-dialog") {
  cartDialog.showModal();
}

document.querySelectorAll("[data-cart-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".shop-card");
    const name = card?.querySelector("h2")?.textContent.trim();
    const image = card?.querySelector(".print-image");
    const priceText = card?.querySelector(".shop-card-info p")?.textContent;
    const priceMatch = priceText?.match(/\$(\d+(?:\.\d{1,2})?)/);
    if (!name || !image || !priceMatch) {
      console.error("Could not add the print because its name, image, or price is missing.");
      return;
    }

    const id = image.getAttribute("src");
    const price = Number(priceMatch[1]);
    const item = cart[id] || { name, price, quantity: 0 };
    item.quantity += 1;
    cart[id] = item;
    saveCart();
    renderCart();

    const originalText = button.textContent;
    button.textContent = "added ✓";
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  });
});

const imageViewer = document.querySelector("[data-image-viewer]");
const imageViewerImage = imageViewer?.querySelector("[data-image-viewer-image]");
let openImageViewer;

if (imageViewer && imageViewerImage) {
  const closeImageViewer = () => {
    if (!imageViewer.open) return;
    imageViewer.close();
  };

  openImageViewer = (image) => {
    if (!image) {
      console.error("Could not open the artwork because its image is missing.");
      return;
    }

    imageViewerImage.src = image.currentSrc || image.src;
    imageViewerImage.alt = image.alt;
    imageViewer.showModal();
    document.body.classList.add("image-viewer-open");
  };

  document.querySelectorAll(".print-image-button").forEach((button) => {
    button.addEventListener("click", () => {
      openImageViewer(button.querySelector(".print-image"));
    });
  });

  imageViewer.querySelector("[data-image-viewer-close]")?.addEventListener("click", closeImageViewer);
  imageViewer.addEventListener("close", () => {
    document.body.classList.remove("image-viewer-open");
  });
  imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) closeImageViewer();
  });
  imageViewer.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeImageViewer();
  });
}

const studioTabs = document.querySelector("[data-studio-tabs]");

if (studioTabs) {
  const tabs = Array.from(studioTabs.querySelectorAll('[role="tab"]'));
  const activateTab = (tab, moveFocus = false) => {
    tabs.forEach((currentTab) => {
      const selected = currentTab === tab;
      const panel = document.getElementById(currentTab.getAttribute("aria-controls"));
      currentTab.setAttribute("aria-selected", String(selected));
      currentTab.tabIndex = selected ? 0 : -1;
      if (panel) panel.hidden = !selected;
    });
    if (moveFocus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      const nextIndex = event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : -1;
      if (nextIndex < 0) return;
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });
}

document.querySelectorAll("[data-year]").forEach((year) => {
  year.textContent = String(new Date().getFullYear());
});

const commissionDetails = document.querySelector("#commission-details");
const messageCount = document.querySelector("[data-message-count]");

if (commissionDetails && messageCount) {
  const updateMessageCount = () => {
    messageCount.textContent = `${commissionDetails.value.length} / ${commissionDetails.maxLength}`;
  };
  commissionDetails.addEventListener("input", updateMessageCount);
  updateMessageCount();
}

const galleryCarousel = document.querySelector("[data-gallery-carousel]");

if (galleryCarousel) {
  const viewport = galleryCarousel.querySelector("[data-gallery-viewport]");
  const track = galleryCarousel.querySelector(".painting-track");
  const paintings = Array.from(galleryCarousel.querySelectorAll(".painting-card"));
  const previous = galleryCarousel.querySelector("[data-gallery-prev]");
  const next = galleryCarousel.querySelector("[data-gallery-next]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer;
  let pointerOver = false;
  let focusWithin = false;

  const scrollByPainting = (direction) => {
    if (!viewport || !track || paintings.length === 0) return;
    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const step = paintings[0].getBoundingClientRect().width + gap;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const nextPosition = viewport.scrollLeft + direction * step;
    const behavior = reducedMotion.matches ? "auto" : "smooth";

    if (direction > 0 && nextPosition >= maxScroll - 2) {
      viewport.scrollTo({ left: 0, behavior });
    } else if (direction < 0 && nextPosition <= 2) {
      viewport.scrollTo({ left: maxScroll, behavior });
    } else {
      viewport.scrollBy({ left: direction * step, behavior });
    }
  };

  const stopAutoplay = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (!reducedMotion.matches && !document.hidden && !pointerOver && !focusWithin) {
      timer = window.setInterval(() => scrollByPainting(1), 5000);
    }
  };

  previous?.addEventListener("click", () => {
    scrollByPainting(-1);
    startAutoplay();
  });
  next?.addEventListener("click", () => {
    scrollByPainting(1);
    startAutoplay();
  });
  galleryCarousel.addEventListener("pointerenter", () => {
    pointerOver = true;
    stopAutoplay();
  });
  galleryCarousel.addEventListener("pointerleave", () => {
    pointerOver = false;
    startAutoplay();
  });
  galleryCarousel.addEventListener("focusin", () => {
    focusWithin = true;
    stopAutoplay();
  });
  galleryCarousel.addEventListener("focusout", (event) => {
    if (!galleryCarousel.contains(event.relatedTarget)) {
      focusWithin = false;
      startAutoplay();
    }
  });
  galleryCarousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByPainting(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByPainting(1);
    }
  });
  document.addEventListener("visibilitychange", startAutoplay);
  reducedMotion.addEventListener?.("change", startAutoplay);
  startAutoplay();
}

const artworkWall = document.querySelector(".gallery-grid");

if (artworkWall) {
  const storageKey = "trina-studio-gallery-positions";
  const cards = Array.from(artworkWall.querySelectorAll(".artwork-card[data-artwork-id]"));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  let positions = {};

  try {
    const savedPositions = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (savedPositions && typeof savedPositions === "object" && !Array.isArray(savedPositions)) {
      cards.forEach((card) => {
        const saved = savedPositions[card.dataset.artworkId];
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          positions[card.dataset.artworkId] = { x: saved.x, y: saved.y };
        }
      });
    }
  } catch (error) {
    console.warn("Could not restore the gallery arrangement.", error);
  }

  const savePositions = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(positions));
    } catch (error) {
      console.warn("Could not save the gallery arrangement.", error);
    }
  };

  const setOffset = (card, x, y) => {
    const wallRect = artworkWall.getBoundingClientRect();
    const current = positions[card.dataset.artworkId] || { x: 0, y: 0 };
    const currentX = current.x;
    const currentY = current.y;
    const cardRect = card.getBoundingClientRect();
    const baseLeft = cardRect.left - currentX;
    const baseTop = cardRect.top - currentY;
    const nextX = clamp(x, wallRect.left - baseLeft, wallRect.right - baseLeft - cardRect.width);
    const nextY = clamp(y, wallRect.top - baseTop, wallRect.bottom - baseTop - cardRect.height);

    positions[card.dataset.artworkId] = { x: nextX, y: nextY };
    card.style.setProperty("--drag-x", `${nextX}px`);
    card.style.setProperty("--drag-y", `${nextY}px`);
  };

  const restorePositions = () => {
    const wallRect = artworkWall.getBoundingClientRect();
    cards.forEach((card) => {
      const position = positions[card.dataset.artworkId] || { x: 0, y: 0 };
      card.style.setProperty("--drag-x", "0px");
      card.style.setProperty("--drag-y", "0px");
      const cardRect = card.getBoundingClientRect();
      const x = clamp(position.x, wallRect.left - cardRect.left, wallRect.right - cardRect.right);
      const y = clamp(position.y, wallRect.top - cardRect.top, wallRect.bottom - cardRect.bottom);
      positions[card.dataset.artworkId] = { x, y };
      card.style.setProperty("--drag-x", `${x}px`);
      card.style.setProperty("--drag-y", `${y}px`);
    });
  };

  cards.forEach((card) => {
    const artwork = card.querySelector(".gallery-artwork");
    if (!artwork) return;
    let pointerDrag;
    let suppressViewerClick = false;

    artwork.addEventListener("click", () => {
      if (suppressViewerClick) {
        suppressViewerClick = false;
        return;
      }
      openImageViewer?.(artwork);
    });

    artwork.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      artwork.setPointerCapture(event.pointerId);
      card.classList.add("is-dragging");
      const wallRect = artworkWall.getBoundingClientRect();
      const position = positions[card.dataset.artworkId] || { x: 0, y: 0 };
      pointerDrag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: position.x,
        offsetY: position.y,
        moved: false,
      };
    });

    artwork.addEventListener("pointermove", (event) => {
      if (!pointerDrag || event.pointerId !== pointerDrag.id) return;
      const deltaX = event.clientX - pointerDrag.startX;
      const deltaY = event.clientY - pointerDrag.startY;
      if (!pointerDrag.moved && Math.hypot(deltaX, deltaY) < 3) return;
      pointerDrag.moved = true;
      setOffset(card, pointerDrag.offsetX + deltaX, pointerDrag.offsetY + deltaY);
    });

    const finishPointerDrag = (event) => {
      if (!pointerDrag || event.pointerId !== pointerDrag.id) return;
      const moved = pointerDrag.moved;
      card.classList.remove("is-dragging");
      if (moved) savePositions();
      pointerDrag = undefined;
      if (moved && event.type === "pointerup") {
        suppressViewerClick = true;
        window.setTimeout(() => { suppressViewerClick = false; }, 0);
      }
    };

    artwork.addEventListener("pointerup", finishPointerDrag);
    artwork.addEventListener("pointercancel", finishPointerDrag);
    card.addEventListener("keydown", (event) => {
      if (event.target !== card) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImageViewer?.(artwork);
        return;
      }
      const step = event.shiftKey ? 30 : 10;
      const moves = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      const position = positions[card.dataset.artworkId] || { x: 0, y: 0 };
      setOffset(card, position.x + move[0], position.y + move[1]);
      savePositions();
    });
  });

  restorePositions();
  window.addEventListener("resize", restorePositions);
}

const commissionForm = document.querySelector(".request-form");
if (commissionForm) {
  const nameInput = commissionForm.querySelector('[name="name"]');
  const emailInput = commissionForm.querySelector('[name="email"]');
  const projectInput = commissionForm.querySelector('[name="type"]');
  const subjectInput = commissionForm.querySelector('[name="_subject"]');
  const replyToInput = commissionForm.querySelector('[name="_replyto"]');

  const updateEmailMetadata = () => {
    const subjectParts = ["Commission request", nameInput.value.trim(), projectInput.value.trim()]
      .filter(Boolean);
    subjectInput.value = subjectParts.join(" — ");
    replyToInput.value = emailInput.value.trim();
  };

  nameInput.addEventListener("input", updateEmailMetadata);
  emailInput.addEventListener("input", updateEmailMetadata);
  projectInput.addEventListener("change", updateEmailMetadata);
  commissionForm.addEventListener("submit", updateEmailMetadata);
  updateEmailMetadata();
}
