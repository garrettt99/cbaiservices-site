/* CBAIS demo chatbot widget + sticky mobile CTA bar.
 * Loaded on every page (script tag before </body>). No dependencies.
 * The widget injects its own DOM: a floating bubble (bottom-right) that opens
 * a chat panel, plus a sticky Call/Book bar shown only on small screens.
 * It is HONEST by design: the header carries a "Demo" badge and the bot says
 * upfront it only knows a few scripted topics. Answers are drawn from the
 * site's real content (services, pricing, hours, phone, booking link). */
(function () {
  "use strict";

  var BOOKING_URL = "https://api.leadconnectorhq.com/widget/booking/DgGSXap9g3fHGGPrjPCV";
  var PHONE_HREF = "tel:+19027090974";
  var PHONE_LABEL = "902-709-0974";
  var DEMO_URL = "https://muse.ai/s/interactive-demo-fg6nxlxrxdxodxdxx";
  var SERVICES_URL = "/services/";
  var LOGO_URL = "/logo.webp";

  function track(name) {
    try {
      document.dispatchEvent(new CustomEvent("cbai:conversion", { detail: { event: "cbai_conversion", conversion_name: name } }));
    } catch (e) { /* no listener on this page — fine */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- bot brain: keyword rules over the site's real content ---------- */
  var RULES = [
    { k: ["price", "pricing", "cost", "much", "package"], h: 'Current packages: <strong>AI Receptionist</strong> — $997 setup + $197/mo · <strong>Follow-Up &amp; Review Engine</strong> — $697 setup + $147/mo · <strong>Website Optimization</strong> — $997 one-time · <strong>New Website Build</strong> — from $2,500 · <strong>Complete System Bundle</strong> — $1,500 setup + $297/mo. Exact scope is confirmed on a free call: <a href="' + BOOKING_URL + '" target="_blank" rel="noopener">book here</a>.' },
    { k: ["book", "consult", "appointment", "schedule", "talk to", "speak to", "call me", "sign up", "get started", "start"], h: 'You can grab a free 30-minute AI automation consultation here: <a href="' + BOOKING_URL + '" target="_blank" rel="noopener">Book your free consultation</a> — or call <a href="' + PHONE_HREF + '">' + PHONE_LABEL + "</a>, Mon–Fri 9–5." },
    { k: ["service", "offer", "what do you do", "help with"], h: 'We set up 8 practical systems: AI Receptionist, Missed-Call Text-Back, Automated Lead Follow-Up, Appointment Booking Automation, AI Chatbots, CRM Automation, Email &amp; SMS Automation, and Review Generation. Full details: <a href="' + SERVICES_URL + '">Services</a>.' },
    { k: ["demo", "hear", "listen", "recording", "sample"], h: 'You can hear our AI receptionist handle a real recorded call here: <a href="' + DEMO_URL + '" target="_blank" rel="noopener">Hear the live demo</a>.' },
    { k: ["hour", "open", "when are", "available"], h: "We’re available Mon–Fri, 9am–5pm Atlantic. After hours, the AI systems keep answering — that’s rather the point." },
    { k: ["phone", "number", "contact", "reach"], h: 'Call us at <a href="' + PHONE_HREF + '">' + PHONE_LABEL + "</a> — Mon–Fri, 9–5 Atlantic." },
    { k: ["where", "location", "sydney", "area", "cape breton", "nova scotia", "based"], h: "We’re based in Sydney, Nova Scotia and work with businesses across Cape Breton and Nova Scotia." },
    { k: ["staff", "replace", "employees", "job"], h: "No — it handles the repetitive stuff (answering routine questions, capturing details, follow-up) so your team spends time on the work that needs a human." },
    { k: ["wrong", "mistake", "error", "hallucinat"], h: "It answers from information set up with you — your services, area, and process — and hands off to a human when a question goes beyond that. You can review every conversation." },
    { k: ["setup", "set up", "how long", "timeline", "implement"], h: "A single focused system is usually live within a couple of weeks of the consultation. You’ll get a clear timeline before anything starts." },
    { k: ["human", "person", "real person", "garrett", "owner"], h: 'Garrett runs the AI systems here — the fastest way to reach a human is <a href="' + PHONE_HREF + '">' + PHONE_LABEL + "</a> (Mon–Fri 9–5)." },
    { k: ["review", "google review", "stars"], h: 'We build a consistent, policy-compliant review process: happy customers get asked at the right moment, automatically. Details: <a href="/services/review-generation/">Review Generation</a>.' },
    { k: ["missed call", "missed-call", "missed"], h: 'Missed-call text-back texts the caller within seconds so the conversation starts instead of ending. Details: <a href="/services/missed-call-text-back/">Missed-Call Text-Back</a>.' },
    { k: ["receptionist"], h: 'An AI receptionist answers calls, handles common questions, captures lead details, and guides callers toward booking. <a href="' + DEMO_URL + '" target="_blank" rel="noopener">Hear the live demo</a> or see <a href="/services/ai-receptionist/">AI Receptionist</a>.' },
    { k: ["chatbot", "chat bot", "website chat"], h: 'Our chatbots answer visitor questions, guide them to the right service, and capture contact details — this little widget is a deliberately simple demo of the idea. See <a href="/services/ai-chatbots/">AI Chatbots</a>.' },
    { k: ["hi", "hello", "hey", "morning", "afternoon"], h: "Hello! Ask me about our services, pricing, or booking a free consultation — or tap a shortcut below." },
    { k: ["thank", "thanks", "great", "awesome", "perfect"], h: 'You\u2019re welcome! If you\u2019d like to talk through your business, <a href="' + BOOKING_URL + '" target="_blank" rel="noopener">book a free consultation</a> \u2014 no pressure.' },
    { k: ["bye"], h: 'Goodbye! The free consultation is here whenever you’re ready: <a href="' + BOOKING_URL + '" target="_blank" rel="noopener">book a call</a>.' }
  ];
  var FALLBACK = 'I’m only a demo with a few scripted answers — the real chatbots we build hold full conversations. For anything beyond my script, <a href="' + BOOKING_URL + '" target="_blank" rel="noopener">book a free consultation</a> and we’ll talk it through.';

  function answer(text) {
    var t = " " + text.toLowerCase() + " ";
    for (var i = 0; i < RULES.length; i++) {
      var rule = RULES[i];
      for (var j = 0; j < rule.k.length; j++) {
        if (t.indexOf(rule.k[j]) !== -1) return rule.h;
      }
    }
    return FALLBACK;
  }

  /* ---------- DOM ---------- */
  function build() {
    var wrap = document.createElement("div");
    wrap.className = "chat-widget";
    wrap.innerHTML =
      '<button type="button" class="chat-fab" aria-label="Open chat demo" aria-expanded="false">' +
        '<img src="' + LOGO_URL + '" alt="" width="62" height="62" />' +
        '<span class="chat-fab-badge">Demo</span>' +
      "</button>" +
      '<section class="chat-panel" hidden aria-label="CBAIS Assistant demo chat">' +
        '<div class="chat-header">' +
          '<img class="chat-avatar" src="' + LOGO_URL + '" alt="CBAIS Assistant avatar" width="38" height="38" />' +
          '<div><strong>CBAIS Assistant<span class="chat-demo-badge">Demo</span></strong><small>Scripted demo — try me</small></div>' +
          '<button type="button" class="chat-close" aria-label="Close chat">×</button>' +
        "</div>" +
        '<div class="chat-messages" role="log" aria-live="polite"></div>' +
        '<div class="chat-quick" aria-label="Suggested questions"></div>' +
        '<form class="chat-input-row"><label class="chat-sr" for="chatDemoInput">Type your message</label><input id="chatDemoInput" type="text" placeholder="Ask about services, pricing…" autocomplete="off" maxlength="300" /><button type="submit">Send</button></form>' +
        '<a class="chat-book" href="' + BOOKING_URL + '" target="_blank" rel="noopener" data-chat-book>Book free consultation</a>' +
      "</section>";

    var bar = document.createElement("nav");
    bar.className = "sticky-cta";
    bar.setAttribute("aria-label", "Quick contact");
    bar.innerHTML =
      '<a class="sticky-call" href="' + PHONE_HREF + '">Call ' + PHONE_LABEL + "</a>" +
      '<a class="sticky-book" href="' + BOOKING_URL + '" target="_blank" rel="noopener">Book free consult</a>';

    document.body.appendChild(wrap);
    document.body.appendChild(bar);
    return wrap;
  }

  function init() {
    var wrap = build();
    var fab = wrap.querySelector(".chat-fab");
    var panel = wrap.querySelector(".chat-panel");
    var messages = wrap.querySelector(".chat-messages");
    var quick = wrap.querySelector(".chat-quick");
    var form = wrap.querySelector(".chat-input-row");
    var input = wrap.querySelector("#chatDemoInput");
    var greeted = false;

    var QUICK = ["Our services", "Pricing", "Book a free call"];
    QUICK.forEach(function (label) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", function () { send(label); });
      quick.appendChild(b);
    });

    function scroll() { messages.scrollTop = messages.scrollHeight; }

    function addMsg(html, who) {
      var d = document.createElement("div");
      d.className = "chat-msg " + who;
      d.innerHTML = html;
      messages.appendChild(d);
      scroll();
    }

    function botReply(text) {
      var typing = document.createElement("div");
      typing.className = "chat-msg bot chat-typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      typing.setAttribute("aria-label", "Assistant is typing");
      messages.appendChild(typing);
      scroll();
      window.setTimeout(function () {
        typing.remove();
        addMsg(answer(text), "bot");
      }, 450);
    }

    function send(text) {
      var t = (text || "").trim();
      if (!t) return;
      addMsg(esc(t), "user");
      input.value = "";
      botReply(t);
    }

    function open() {
      panel.hidden = false;
      fab.setAttribute("aria-expanded", "true");
      fab.setAttribute("aria-label", "Close chat demo");
      if (!greeted) {
        greeted = true;
        addMsg("Hi! I’m a <strong>demo</strong> of the kind of AI chatbot we build for local businesses — I only know a few topics, but go ahead and try me.", "bot");
      }
      input.focus();
      track("chat-demo-open");
    }
    function close() {
      panel.hidden = true;
      fab.setAttribute("aria-expanded", "false");
      fab.setAttribute("aria-label", "Open chat demo");
      fab.focus();
    }

    fab.addEventListener("click", function () { panel.hidden ? open() : close(); });
    wrap.querySelector(".chat-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) close();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send(input.value);
    });
    wrap.querySelector("[data-chat-book]").addEventListener("click", function () { track("chat-demo-book"); });
    document.querySelector(".sticky-book").addEventListener("click", function () { track("sticky-bar-book"); });
    document.querySelector(".sticky-call").addEventListener("click", function () { track("sticky-bar-call"); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
