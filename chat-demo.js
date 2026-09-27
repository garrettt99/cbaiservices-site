/* CBAIS site utilities: real GHL chat widget + sticky mobile CTA bar +
 * in-page booking modal.
 * Loaded on every page (script tag before </body>). No dependencies.
 *
 * - Injects the live GoHighLevel "CBAIS Website Chat" Conversation AI widget
 *   (the widget renders its own chat bubble; this file adds none).
 * - Sticky Call/Book bar shown only on small screens (its CSS lives in the
 *   site stylesheet; this file injects the element and its tracking).
 * - Booking happens ON the site: every leadconnectorhq.com/widget/booking
 *   link (sticky bar, page content) opens an in-page modal with the booking
 *   widget instead of navigating away. Escape / backdrop / x close it.
 * - Fires cbai:conversion CustomEvents for the site's tracker:
 *   chat-demo-book (modal opened), sticky-bar-book, sticky-call. */
(function () {
  "use strict";

  /* ---------- config ---------- */
  var BOOKING_URL = "https://api.leadconnectorhq.com/widget/booking/DgGSXap9g3fHGGPrjPCV";
  var PHONE_HREF = "tel:+19027090974";
  var PHONE_LABEL = "902-709-0974";
  var GHL_WIDGET_SRC = "https://widgets.leadconnectorhq.com/loader.js";
  var GHL_WIDGET_RESOURCES = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";
  var GHL_WIDGET_ID = "6ab99a2208a179ce3804a912";

  /* ---------- tracking ---------- */
  function track(name) {
    try {
      document.dispatchEvent(new CustomEvent("cbai:conversion", { detail: { event: "cbai_conversion", conversion_name: name } }));
    } catch (e) { /* no listener on this page — fine */ }
  }

  /* ---------- DOM ---------- */
  /* In-page booking modal (booking happens ON the site). Modal z-index stays
   * above the GHL widget bubble. */
  var EXTRA_CSS =
  ".chat-book-modal{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}" +
  ".chat-book-modal[hidden]{display:none}" +
  ".chat-book-backdrop{position:absolute;inset:0;background:rgba(2,6,23,.62)}" +
  ".chat-book-card{position:relative;width:min(780px,100%);height:min(740px,94vh);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 70px rgba(2,6,23,.35);display:flex;flex-direction:column}" +
  ".chat-book-frame{flex:1;width:100%;border:0;background:#fff}" +
  ".chat-book-x{position:absolute;top:10px;right:10px;z-index:2;width:38px;height:38px;border-radius:50%;border:0;background:#0f2a4a;color:#fff;font-size:22px;line-height:1;cursor:pointer;box-shadow:0 4px 14px rgba(2,6,23,.3)}" +
  ".chat-book-x:hover{background:#1a3a5f}" +
  "@media (max-width:760px){.chat-book-modal{padding:0}.chat-book-card{width:100%;height:100%;height:100dvh;border-radius:0}}";

  /* Inject the real GHL Conversation AI chat widget exactly once. */
  function injectGhlWidget() {
    if (document.querySelector('script[data-widget-id="' + GHL_WIDGET_ID + '"]')) return;
    var s = document.createElement("script");
    s.src = GHL_WIDGET_SRC;
    s.setAttribute("data-resources-url", GHL_WIDGET_RESOURCES);
    s.setAttribute("data-widget-id", GHL_WIDGET_ID);
    document.body.appendChild(s);
  }

  function build() {
    var st = document.createElement("style");
    st.textContent = EXTRA_CSS;
    document.head.appendChild(st);

    var bar = document.createElement("nav");
    bar.className = "sticky-cta";
    bar.setAttribute("aria-label", "Quick contact");
    bar.innerHTML =
      '<a class="sticky-call" href="' + PHONE_HREF + '">Call ' + PHONE_LABEL + "</a>" +
      '<a class="sticky-book" href="' + BOOKING_URL + '" target="_blank" rel="noopener">Book free consult</a>';
    document.body.appendChild(bar);

    var modal = document.createElement("div");
    modal.className = "chat-book-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Book a free consultation");
    modal.innerHTML =
      '<div class="chat-book-backdrop"></div>' +
      '<div class="chat-book-card">' +
        '<button type="button" class="chat-book-x" aria-label="Close booking">×</button>' +
        '<iframe class="chat-book-frame" title="Book a free consultation" src="about:blank"></iframe>' +
      "</div>";
    document.body.appendChild(modal);
  }

  function init() {
    build();
    injectGhlWidget();

    var modalOpen = false;
    var prevBodyOverflow = "";

    /* ---------- in-page booking modal ---------- */
    function openBooking() {
      if (modalOpen) return; /* ignore repeat opens */
      var modal = document.querySelector(".chat-book-modal");
      if (!modal) return;
      modalOpen = true;
      modal.querySelector(".chat-book-frame").src = BOOKING_URL;
      modal.hidden = false;
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      modal.querySelector(".chat-book-x").focus();
      track("chat-demo-book");
    }
    function closeBooking() {
      if (!modalOpen) return;
      var modal = document.querySelector(".chat-book-modal");
      modalOpen = false;
      if (modal) {
        modal.hidden = true;
        modal.querySelector(".chat-book-frame").src = "about:blank";
      }
      document.body.style.overflow = prevBodyOverflow;
    }

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (modalOpen) closeBooking();
    });

    document.querySelector(".sticky-book").addEventListener("click", function () { track("sticky-bar-book"); });
    document.querySelector(".sticky-call").addEventListener("click", function () { track("sticky-call"); });

    /* Wire the modal's own close controls. */
    document.querySelector(".chat-book-x").addEventListener("click", closeBooking);
    document.querySelector(".chat-book-backdrop").addEventListener("click", closeBooking);

    /* Intercept EVERY booking link site-wide (sticky bar, page content):
     * open the in-page modal instead of navigating away.
     * Capture phase, but we never stopPropagation — existing click listeners
     * (e.g. the sticky-bar-book tracker) still fire.
     * Modifier keys and non-primary buttons are left alone so e.g. ctrl-click
     * still opens the widget in a new tab as the user intended. */
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;
      if (typeof e.button === "number" && e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href*="leadconnectorhq.com/widget/booking"]') : null;
      if (!a) return;
      e.preventDefault();
      openBooking();
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
