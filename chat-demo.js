/* CBAIS demo chatbot widget + sticky mobile CTA bar.
 * Loaded on every page (script tag before </body>). No dependencies.
 * The widget injects its own DOM: a floating bubble (bottom-right) that opens
 * a chat panel, plus a sticky Call/Book bar shown only on small screens.
 * It is HONEST by design: the header carries a "Demo" badge and the bot says
 * upfront it is a scripted demo. Answers are drawn from the site's real
 * content (services, pricing, hours, phone, booking link).
 *
 * v2 engine: tokenizer + stopwords, intent scoring with Damerau-Levenshtein
 * fuzzy matching (typo-tolerant), ~29 intents, a multi-turn booking flow with
 * phone validation, session memory + personalization, contextual follow-up
 * quick replies, a one-time proactive nudge, and a graceful smart fallback
 * that never dead-ends. */
(function () {
  "use strict";

  /* ---------- config ---------- */
  var BOOKING_URL = "https://api.leadconnectorhq.com/widget/booking/DgGSXap9g3fHGGPrjPCV";
  var PHONE_HREF = "tel:+19027090974";
  var PHONE_LABEL = "902-709-0974";
  var DEMO_URL = "https://muse.ai/s/interactive-demo-fg6nxlxrxdxodxdxx";
  var SERVICES_URL = "/services/";
  var LOGO_URL = "/logo.webp";

  /*BRAIN-START*/
  /* ---------- conversational engine (pure logic, no DOM) ---------- */
  var STOP = {a:1,an:1,the:1,and:1,or:1,to:1,of:1,in:1,on:1,for:1,with:1,is:1,are:1,was:1,were:1,be:1,been:1,do:1,does:1,did:1,i:1,me:1,my:1,mine:1,you:1,your:1,yours:1,we:1,our:1,ours:1,it:1,its:1,this:1,that:1,these:1,those:1,there:1,here:1,very:1,really:1,just:1,so:1,too:1,also:1,please:1,like:1,want:1,wanna:1,need:1,get:1,got:1,getting:1,gonna:1,gotta:1,let:1,lets:1,im:1,ive:1,dont:1,doesnt:1,isnt:1,arent:1,wasnt:1,wont:1,cant:1,about:1,up:1,out:1,if:1,then:1,than:1,into:1,over:1,after:1,before:1,between:1,again:1,once:1,all:1,any:1,both:1,each:1,few:1,more:1,most:1,other:1,some:1,such:1,only:1,own:1,same:1,from:1,by:1,at:1,as:1};

  function normRaw(s) {
    return " " + String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() + " ";
  }

  function tokenize(s) {
    return normRaw(s).split(" ").filter(function (w) { return w && !STOP[w]; });
  }

  /* Damerau-Levenshtein (transpositions count as 1), early exit above 1. */
  function damerau(a, b) {
    var la = a.length, lb = b.length, i, j;
    if (Math.abs(la - lb) > 1) return 2;
    if (a === b) return 0;
    var d = [];
    for (i = 0; i <= la; i++) { d[i] = [i]; }
    for (j = 0; j <= lb; j++) { d[0][j] = j; }
    for (i = 1; i <= la; i++) {
      for (j = 1; j <= lb; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        var v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
          v = Math.min(v, d[i - 2][j - 2] + 1);
        }
        d[i][j] = v;
      }
    }
    return d[la][lb];
  }

  function bookLink(text) {
    return '<a href="' + BOOKING_URL + '" target="_blank" rel="noopener">' + text + "</a>";
  }
  function phoneLink() {
    return '<a href="' + PHONE_HREF + '">' + PHONE_LABEL + "</a>";
  }

  /* id, label (for fallback suggestions), q (canonical query), k (keyword
   * tokens), p (multi-word phrases, matched on raw text), a (answer HTML),
   * f (follow-up quick replies: [label, query] pairs). */
  var INTENTS = [
    {id:"greeting", label:"Say hello", q:"Hello",
     k:["hi","hello","hey","morning","afternoon","howdy","hiya","yo"], p:["good morning","good afternoon"],
     a:"Hey there! Ask me about our services, pricing, or booking a free consultation — or tap a shortcut below.",
     f:[["Our services","What services do you offer?"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"are_you_real", label:"Are you real?", q:"Are you a real AI?",
     k:["robot","robots","bot","bots"], p:["are you real","are you ai","are you a robot","are you a bot","are you human","is this a demo","are you a demo","r u real","are you a real person"],
     a:"Honest answer: I'm a <strong>scripted demo</strong> of the kind of chatbot Cape Breton AI Services builds — I know a few dozen topics and have excellent manners. The real chatbots we deploy run on conversational AI and hold full, unscripted conversations.",
     f:[["Our services","What services do you offer?"],["Book a free call","I'd like to book a call"],["How does it work?","How does it work?"]]},
    {id:"demo", label:"Hear the demo", q:"Can I hear the demo?",
     k:["demo","recording","sample"], p:["hear it","hear the","listen to","live demo","recorded call","voice demo"],
     a:'You can hear our AI receptionist handle a real recorded call here: <a href="' + DEMO_URL + '" target="_blank" rel="noopener">Hear the live demo</a>.',
     f:[["AI Receptionist","Tell me about the AI receptionist"],["Book a free call","I'd like to book a call"],["Pricing","How much does it cost?"]]},
    {id:"human", label:"Talk to a human", q:"Can I talk to a human?",
     k:["human","people","garrett"], p:["real person","talk to a human","speak to a human","talk to someone","talk to a person","speak to someone","human please","talk to garrett","call garrett"],
     a:"The fastest way to reach a human is Garrett himself — call " + phoneLink() + " (Mon–Fri 9–5), or " + bookLink("book a free consultation") + " and you'll talk everything through with him.",
     f:[["Book a free call","I'd like to book a call"],["Phone number","What's your phone number?"],["Our services","What services do you offer?"]]},
    {id:"book_call", label:"Book a free call", q:"I'd like to book a call",
     k:["book","consult","schedule","signup"], p:["book a call","book a consultation","book consultation","schedule a call","schedule a consultation","i'd like to book","want to book","sign me up","get started","free call","call me","call me back"],
     a:"__FLOW__",
     f:[]},
    {id:"consult_info", label:"About the consultation", q:"What happens in the free consultation?",
     k:["consultation"], p:["what happens in","what happens during","what is the consultation","about the consultation","tell me about the consultation"],
     a:"It's a free 30-minute call with Garrett: we talk through where leads or admin work get stuck, sketch what a better process looks like, and figure out which system — if any — is the right starting point. No prep needed, no pressure.",
     f:[["Book a free call","I'd like to book a call"],["Pricing","How much does it cost?"],["How does it work?","How does it work?"]]},
    {id:"pricing", label:"Pricing", q:"How much does it cost?",
     k:["price","pricing","prices","cost","costs","much","package","packages"], p:["how much","what does it cost"],
     a:"Current packages: <strong>AI Receptionist</strong> — $997 setup + $197/mo · <strong>Follow-Up &amp; Review Engine</strong> — $697 setup + $147/mo · <strong>Website Optimization</strong> — $997 one-time · <strong>New Website Build</strong> — from $2,500 · <strong>Complete System Bundle</strong> — $1,500 setup + $297/mo. Exact scope gets confirmed on a free call: " + bookLink("book here") + ".",
     f:[["Book a free call","I'd like to book a call"],["How long is setup?","How long does setup take?"],["Our services","What services do you offer?"]]},
    {id:"svc_receptionist", label:"AI Receptionist", q:"Tell me about the AI receptionist",
     k:["receptionist","reception"], p:["answer calls","answering calls","answer the phone","answering service","phone answering"],
     a:'An AI receptionist answers every call — even when you’re on the tools or with a customer. It handles common questions, captures the caller’s details, and guides them toward booking, a quote request, or a callback. <a href="' + DEMO_URL + '" target="_blank" rel="noopener">Hear the live demo</a> · <a href="/services/ai-receptionist/">AI Receptionist</a>',
     f:[["Missed-call text-back","What is missed-call text-back?"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"svc_missedcall", label:"Missed-call text-back", q:"What is missed-call text-back?",
     k:["missed"], p:["missed call","missed calls","missed-call","text back","textback"],
     a:'You can’t always answer — you’re driving, on site, or with a customer. Missed-call text-back texts the caller within seconds, so the conversation starts instead of ending. Most missed callers never leave voicemail; speed wins the job. <a href="/services/missed-call-text-back/">Missed-Call Text-Back</a>',
     f:[["AI Receptionist","Tell me about the AI receptionist"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"svc_chatbots", label:"AI Chatbots", q:"Tell me about your AI chatbots",
     k:["chatbot","chatbots","chat","widget"], p:["chat bot","website chat","site chat","web chat"],
     a:'Our chatbots live on your website — they answer visitor questions, point people to the right service, and capture contact details while interest is hot. (I’m a deliberately simple demo of the idea — the real ones hold full conversations.) <a href="/services/ai-chatbots/">AI Chatbots</a>',
     f:[["Pricing","How much does it cost?"],["AI Receptionist","Tell me about the AI receptionist"],["Book a free call","I'd like to book a call"]]},
    {id:"svc_booking", label:"Booking automation", q:"Tell me about booking automation",
     k:["booking"], p:["appointment booking","booking automation","online booking","self booking","booking system","book online"],
     a:'Booking automation lets customers go from interested to booked in minutes — picking a real time from your availability, with confirmations handled for you. No more phone tag. <a href="/services/appointment-booking-automation/">Appointment Booking Automation</a>',
     f:[["Lead follow-up","Tell me about automated follow-up"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"svc_followup", label:"Lead follow-up", q:"Tell me about automated follow-up",
     k:["followup","nurture","nurturing"], p:["follow up","follow-up","lead follow","leads go cold","going cold","drip"],
     a:'Most leads don’t buy on first contact — they go quiet, get busy, and forget. Automated follow-up keeps your business in front of them with timely, helpful messages until they’re ready. It’s part of our Follow-Up &amp; Review Engine. <a href="/services/automated-lead-follow-up/">Automated Lead Follow-Up</a>',
     f:[["Review generation","Tell me about review generation"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"svc_emailsms", label:"Email & SMS automation", q:"Tell me about email and SMS automation",
     k:["email","emails","sms","reminder","reminders","confirmation","confirmations","no-show","noshow"], p:["text automation","texting","text messages"],
     a:'Confirmations, reminders, thank-yous, check-ins — the routine messages that protect your schedule and reputation, sent automatically at the right moment. Fewer no-shows, far less typing. <a href="/services/email-sms-automation/">Email &amp; SMS Automation</a>',
     f:[["Booking automation","Tell me about booking automation"],["CRM automation","Tell me about CRM automation"],["Book a free call","I'd like to book a call"]]},
    {id:"svc_crm", label:"CRM automation", q:"Tell me about CRM automation",
     k:["crm","pipeline","organize","organized"], p:["lead management","track leads","organize leads","organise leads","customer management"],
     a:'Lead details live in texts, voicemails, sticky notes, and memory — until they don’t. CRM automation gives every inquiry a home: captured automatically, organized clearly, with next steps assigned instead of forgotten. <a href="/services/crm-automation/">CRM Automation</a>',
     f:[["Lead follow-up","Tell me about automated follow-up"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"svc_reviews", label:"Review generation", q:"Tell me about review generation",
     k:["review","reviews","reputation","stars","rating","ratings"], p:["google review","google reviews","get reviews","more reviews"],
     a:'Your best customers would gladly leave a review — they just never get asked. We build a consistent, policy-compliant process that asks happy customers at the right moment, automatically. <a href="/services/review-generation/">Review Generation</a>',
     f:[["Lead follow-up","Tell me about automated follow-up"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"services_overview", label:"Our services", q:"What services do you offer?",
     k:["services","service","offer","offers","offerings","solutions","systems"], p:["what do you do","what do you offer","what services","how can you help"],
     a:'We set up 8 practical systems: AI Receptionist, Missed-Call Text-Back, Automated Lead Follow-Up, Appointment Booking Automation, AI Chatbots, CRM Automation, Email &amp; SMS Automation, and Review Generation. Full details: <a href="' + SERVICES_URL + '">Services</a> — which one sounds most useful?',
     f:[["AI Receptionist","Tell me about the AI receptionist"],["AI Chatbots","Tell me about your AI chatbots"],["Pricing","How much does it cost?"]]},
    {id:"how_it_works", label:"How it works", q:"How does it work?",
     k:["process"], p:["how does it work","how it works","how do you do it","what happens","how would it work","how will it work"],
     a:"It starts with a free consultation — we find where leads or admin work get stuck, then recommend the smallest system that fixes it. We set it up with your info (services, area, process), test it together, and it goes live. You can review every conversation.",
     f:[["How long is setup?","How long does setup take?"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"setup_timeline", label:"Setup timeline", q:"How long does setup take?",
     k:["setup","timeline","implement","implemented","long","fast","quick"], p:["set up","how long","how fast","how quickly","get it live","turnaround"],
     a:"A single focused system is typically up and running within a couple of weeks of the consultation. You’ll get a clear timeline before anything starts — no open-ended projects.",
     f:[["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"],["How does it work?","How does it work?"]]},
    {id:"roi", label:"Is it worth it?", q:"Is it worth the money?",
     k:["roi","worth","worthwhile","pay","save","saving","return","value"], p:["worth it","pay for itself","return on investment","save money","worth the money"],
     a:"One saved job a month usually covers it. Every missed call that becomes a conversation, every lead that gets followed up instead of going cold — that’s revenue that was walking away. The free consultation puts real numbers on it for your business: " + bookLink("book here") + ".",
     f:[["Pricing","How much does it cost?"],["Proof it works","Do you have proof it works?"],["Book a free call","I'd like to book a call"]]},
    {id:"proof", label:"Proof it works", q:"Do you have proof it works?",
     k:["proof","results","clients","example","examples","portfolio"], p:["does it work","case study","real business","show me","testimonials"],
     a:"These systems already run a real local business: after-hours calls get answered instead of hitting voicemail, every missed call gets an instant text back, and qualified calls turn into booked appointments — no sticky notes. That’s the setup we’d build for you.",
     f:[["Book a free call","I'd like to book a call"],["Pricing","How much does it cost?"],["Our services","What services do you offer?"]]},
    {id:"about_garrett", label:"About Garrett", q:"Who is Garrett?",
     k:["garrett"], p:["who runs","who owns","who is garrett","about garrett","founder","owner","who's behind"],
     a:"Garrett runs Cape Breton AI Services — and the same kind of AI systems he runs live for Clean Air Atlantic, a local home-services company. Want to talk it through with him? " + bookLink("Book a free consultation") + ".",
     f:[["Proof it works","Do you have proof it works?"],["Book a free call","I'd like to book a call"],["Our services","What services do you offer?"]]},
    {id:"ai_wrong", label:"What if the AI is wrong?", q:"What if the AI gets something wrong?",
     k:["wrong","mistake","mistakes","error","errors","hallucinate","hallucination","messes","mess","screw"], p:["mess up","messes up","gets it wrong","get it wrong","something wrong","what if"],
     a:"The AI answers from information we set up together — your services, area, and process — and hands off to a human when a question goes beyond that. You can review every conversation, so nothing goes out you didn’t approve.",
     f:[["How does it work?","How does it work?"],["Will it replace staff?","Will this replace my staff?"],["Book a free call","I'd like to book a call"]]},
    {id:"replace_staff", label:"Will it replace staff?", q:"Will this replace my staff?",
     k:["staff","replace","replaces","employees","jobs","layoff"], p:["replace my staff","replace staff","take jobs","replace employees"],
     a:"No — it handles the repetitive stuff (routine questions, capturing details, follow-up) so your team spends time on work that actually needs a human. Think of it as cover for the gaps, not a replacement.",
     f:[["How does it work?","How does it work?"],["Pricing","How much does it cost?"],["Book a free call","I'd like to book a call"]]},
    {id:"new_number", label:"Do I need a new number?", q:"Do I need a new phone number?",
     k:[], p:["new phone number","new number","keep my number","existing number","my current number","change my number","keep the same number"],
     a:"Nope — these systems work with your existing business number. If you’d rather keep automation on a separate line, we can do that too.",
     f:[["How does it work?","How does it work?"],["Book a free call","I'd like to book a call"],["Phone number","What's your phone number?"]]},
    {id:"phone", label:"Phone number", q:"What's your phone number?",
     k:["phone","number","contact","telephone","where"], p:["phone number","call you","your number","contact you","reach you","where are you"],
     a:"You can call us at " + phoneLink() + " — Mon–Fri, 9–5 Atlantic.",
     f:[["Book a free call","I'd like to book a call"],["Hours","When are you open?"],["Our services","What services do you offer?"]]},
    {id:"hours", label:"Hours", q:"When are you open?",
     k:["hours","hour","open","opened","available","availability"], p:["when are you open","what are your hours","business hours"],
     a:"We’re available Mon–Fri, 9am–5pm Atlantic. After hours, the AI systems keep answering — that’s rather the point.",
     f:[["Book a free call","I'd like to book a call"],["Phone number","What's your phone number?"],["Our services","What services do you offer?"]]},
    {id:"location", label:"Location", q:"Where are you located?",
     k:["located","location","based","sydney","glace","baddeck","hawkesbury","where"], p:["where are you","cape breton","nova scotia","what area","service area","where do you"],
     a:"We’re based in Sydney, Nova Scotia, and work with businesses across Cape Breton and Nova Scotia — Sydney, Glace Bay, North Sydney, New Waterford, Baddeck, Port Hawkesbury and beyond.",
     f:[["Our services","What services do you offer?"],["Book a free call","I'd like to book a call"],["About Garrett","Who is Garrett?"]]},
    {id:"thanks", label:"Thanks", q:"Thanks",
     k:["thanks","thank","thx"], p:["thank you","thanks a lot","thanks so much"],
     a:"You’re welcome! If you’d like to talk through your business, " + bookLink("the free consultation") + " is right here — no pressure.",
     f:[["Book a free call","I'd like to book a call"],["Our services","What services do you offer?"]]},
    {id:"bye", label:"Bye", q:"Bye",
     k:["bye","goodbye","later","night"], p:["see you","good night","talk later","gotta go"],
     a:"Goodbye! " + bookLink("The free consultation") + " is here whenever you’re ready.",
     f:[]}
  ];

  function scoreIntent(it, toks, raw) {
    var s = 0, j, k, t;
    for (j = 0; j < it.p.length; j++) {
      if (raw.indexOf(" " + it.p[j] + " ") !== -1) s += 4;
    }
    for (j = 0; j < toks.length; j++) {
      t = toks[j];
      var best = 0;
      for (k = 0; k < it.k.length; k++) {
        var kw = it.k[k];
        if (t === kw) { best = 2; break; }
        /* Fuzzy: typos count. Longer words carry more signal, so a
         * one-edit typo on a 6+ char word scores full weight. */
        if (t.length >= 4 && kw.length >= 4 && damerau(t, kw) <= 1) {
          var w = (t.length >= 6 && kw.length >= 6) ? 2 : 1;
          if (w > best) best = w;
        }
      }
      s += best;
    }
    return s;
  }

  /* Route text -> {id, html, f, score}. Never dead-ends: below threshold we
   * suggest the closest topics plus the booking link. */
  function route(text) {
    var raw = normRaw(text);
    var toks = tokenize(text);
    var best = null, bestScore = 0, i, scored = [];
    for (i = 0; i < INTENTS.length; i++) {
      var s = scoreIntent(INTENTS[i], toks, raw);
      scored.push({it: INTENTS[i], s: s});
      if (s > bestScore) { bestScore = s; best = INTENTS[i]; }
    }
    if (best && bestScore >= 2) {
      return {id: best.id, html: best.a, f: best.f, score: bestScore};
    }
    scored.sort(function (x, y) { return y.s - x.s; });
    var sug = [];
    for (i = 0; i < scored.length && sug.length < 3; i++) {
      if (scored[i].s > 0 && scored[i].it.id !== "greeting") sug.push([scored[i].it.label, scored[i].it.q]);
    }
    if (!sug.length) {
      sug = [["Our services", "What services do you offer?"], ["Pricing", "How much does it cost?"], ["Book a free call", "I'd like to book a call"]];
    }
    return {
      id: "fallback",
      html: "I’m still just a scripted demo, so that one’s beyond me — but I can help with one of these, or you can " + bookLink("book a free call") + " and ask Garrett directly:",
      f: sug,
      score: bestScore
    };
  }

  /* Multi-turn booking flow definition (driven by the DOM layer below). */
  var FLOW_STEPS = [
    {key:"name", q:"Great — a few quick details so Garrett’s up to speed. What’s your name?", optional:false},
    {key:"business", q:"What’s your business called? (Or say “skip”.)", optional:true},
    {key:"automate", q:"What would you most like to automate? Calls, follow-up, booking… (Or say “skip”.)", optional:true},
    {key:"phone", q:"What’s the best 10-digit number to reach you?", optional:false, phone:true}
  ];
  /*BRAIN-END*/

  /* ---------- tracking (same event contract as before) ---------- */
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

  /* ---------- DOM ---------- */
  var EXTRA_CSS = ".chat-nudge{position:fixed;right:20px;bottom:104px;z-index:10001;max-width:250px;background:#0f2a4a;color:#fff;border-radius:14px;padding:12px 36px 12px 14px;font-size:13.5px;line-height:1.45;box-shadow:0 10px 28px rgba(2,6,23,.22);cursor:pointer;animation:chatNudgeIn .35s ease}.chat-nudge-x{position:absolute;top:6px;right:10px;background:none;border:0;color:#9fb3cc;font-size:17px;cursor:pointer;line-height:1;padding:2px}.chat-nudge-x:hover{color:#fff}@keyframes chatNudgeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.chat-summary{background:#f1f5f9;border:1px solid #dbe4ef;border-radius:12px;padding:12px;margin:2px 0;color:#0f2a4a}.chat-summary ul{margin:8px 0;padding:0;list-style:none;font-size:13px;line-height:1.5}.chat-summary li{margin:3px 0}.chat-summary-book{display:block;text-align:center;background:#0f2a4a;color:#fff!important;border-radius:10px;padding:10px;margin-top:8px;text-decoration:none;font-weight:600}.chat-summary-book:hover{background:#1a3a5f}.chat-summary small{display:block;margin-top:8px;color:#5b6b82;font-size:12px}@media (max-width:760px){.chat-nudge{bottom:150px;right:12px}}" +
  /* ---------- in-page booking modal (booking happens ON the site) ---------- */
  ".chat-book-modal{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}" +
  ".chat-book-modal[hidden]{display:none}" +
  ".chat-book-backdrop{position:absolute;inset:0;background:rgba(2,6,23,.62)}" +
  ".chat-book-card{position:relative;width:min(780px,100%);height:min(740px,94vh);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 70px rgba(2,6,23,.35);display:flex;flex-direction:column}" +
  ".chat-book-frame{flex:1;width:100%;border:0;background:#fff}" +
  ".chat-book-x{position:absolute;top:10px;right:10px;z-index:2;width:38px;height:38px;border-radius:50%;border:0;background:#0f2a4a;color:#fff;font-size:22px;line-height:1;cursor:pointer;box-shadow:0 4px 14px rgba(2,6,23,.3)}" +
  ".chat-book-x:hover{background:#1a3a5f}" +
  "@media (max-width:760px){.chat-book-modal{padding:0}.chat-book-card{width:100%;height:100%;height:100dvh;border-radius:0}}";

  function build() {
    var st = document.createElement("style");
    st.textContent = EXTRA_CSS;
    document.head.appendChild(st);

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

    /* In-page booking modal: booking happens ON the site, never navigates away. */
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

    var session = { name: "", opened: false };
    var flow = null; /* {step, data:{}} */
    var nudgeShown = false;
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

    var DEFAULT_QUICK = [["Our services", "What services do you offer?"], ["Pricing", "How much does it cost?"], ["Book a free call", "I'd like to book a call"]];

    function scroll() { messages.scrollTop = messages.scrollHeight; }

    function addMsg(html, who) {
      var d = document.createElement("div");
      d.className = "chat-msg " + who;
      d.innerHTML = html;
      messages.appendChild(d);
      scroll();
    }

    /* Bot message with typing indicator; delay scales with message length. */
    function botSay(html, followups) {
      var typing = document.createElement("div");
      typing.className = "chat-msg bot chat-typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      typing.setAttribute("aria-label", "Assistant is typing");
      messages.appendChild(typing);
      scroll();
      var plain = String(html).replace(/<[^>]+>/g, "");
      var delay = Math.min(1500, 450 + plain.length * 7);
      window.setTimeout(function () {
        typing.remove();
        addMsg(html, "bot");
        if (followups) setQuick(followups);
      }, delay);
    }

    function setQuick(pairs) {
      quick.innerHTML = "";
      (pairs || []).forEach(function (pair) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = pair[0];
        b.setAttribute("data-q", pair[1]);
        b.addEventListener("click", function () { send(pair[0], pair[1]); });
        quick.appendChild(b);
      });
    }

    /* ---------- booking flow ---------- */
    function startFlow() {
      flow = { step: 0, data: {} };
      askStep("");
    }

    function stepQuestion(step, prefix) {
      var q = FLOW_STEPS[step].q;
      return prefix ? prefix + " " + q : q;
    }

    function askStep(prefix) {
      var step = FLOW_STEPS[flow.step];
      var chips = step.optional ? [["Skip", "__skip__"], ["Cancel", "__cancel__"]] : [["Cancel", "__cancel__"]];
      botSay(esc(stepQuestion(flow.step, prefix)), chips);
    }

    function fmtPhone(d) {
      return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    }

    function finishFlow() {
      var r = flow.data;
      flow = null;
      var html =
        '<div class="chat-summary"><strong>Here’s what I’ve got:</strong><ul>' +
        "<li><b>Name:</b> " + esc(r.name || "—") + "</li>" +
        "<li><b>Business:</b> " + esc(r.business || "—") + "</li>" +
        "<li><b>Wants to automate:</b> " + esc(r.automate || "—") + "</li>" +
        "<li><b>Callback number:</b> " + esc(fmtPhone(r.phone)) + "</li></ul>" +
        '<a class="chat-summary-book" data-chat-book href="' + BOOKING_URL + '" target="_blank" rel="noopener">Pick a time that suits you</a>' +
        "<small>Prefer not to book online? No problem — Garrett will call you back.</small></div>";
      track("chat-demo-booking-done");
      botSay(html, [["Our services", "What services do you offer?"], ["Pricing", "How much does it cost?"]]);
    }

    function handleFlow(text) {
      var t = text.trim().toLowerCase();
      if (/^(cancel|stop|quit|exit|never mind|nevermind)$/.test(t)) {
        flow = null;
        botSay("No problem — I’ll be here if you change your mind.", DEFAULT_QUICK);
        return;
      }
      var step = FLOW_STEPS[flow.step];
      if (t === "skip" || t === "__skip__") {
        if (step.optional) {
          flow.data[step.key] = "";
          flow.step++;
          if (flow.step >= FLOW_STEPS.length) finishFlow();
          else askStep("");
        } else {
          botSay("I do need this one to continue — or say “cancel” to stop.", [["Cancel", "__cancel__"]]);
        }
        return;
      }
      if (step.phone) {
        var digits = text.replace(/\D/g, "");
        if (digits.length === 11 && digits.charAt(0) === "1") digits = digits.slice(1);
        if (digits.length !== 10) {
          botSay("Hmm, that doesn’t look like a 10-digit number — mind double-checking? (Or say “cancel” to stop.)", [["Cancel", "__cancel__"]]);
          return;
        }
        flow.data.phone = digits;
        finishFlow();
        return;
      }
      var val = text.trim().slice(0, 80);
      if (!val) {
        if (step.optional) { flow.data[step.key] = ""; flow.step++; askStep(""); }
        else botSay("I didn’t quite catch that — " + esc(step.q), [["Cancel", "__cancel__"]]);
        return;
      }
      flow.data[step.key] = val;
      var prefix = "";
      if (step.key === "name") {
        var first = val.split(/\s+/)[0];
        first = first.charAt(0).toUpperCase() + first.slice(1);
        session.name = first;
        prefix = "Got it, " + first + "!";
      }
      flow.step++;
      if (flow.step >= FLOW_STEPS.length) finishFlow();
      else askStep(prefix);
    }

    /* ---------- main send path ---------- */
    function send(display, query) {
      var d = (display || "").trim();
      if (!d) return;
      if (d === "__skip__") d = "Skip";
      if (d === "__cancel__") d = "Cancel";
      addMsg(esc(d), "user");
      input.value = "";
      var q = query || d;
      if (flow) { handleFlow(q); return; }
      var r = route(q);
      if (r.id === "book_call") { startFlow(); return; }
      botSay(r.html, r.f);
    }

    function greet() {
      if (!session.opened) {
        session.opened = true;
        botSay("Hi! I’m a <strong>demo</strong> of the kind of AI chatbot we build for local businesses — ask me about services, pricing, or booking a free call.", DEFAULT_QUICK);
      } else {
        var hello = session.name ? "Welcome back, " + esc(session.name) + "! What else can I help with?" : "Welcome back! What else can I help with?";
        botSay(hello, DEFAULT_QUICK);
      }
    }

    function open() {
      panel.hidden = false;
      fab.setAttribute("aria-expanded", "true");
      fab.setAttribute("aria-label", "Close chat demo");
      var nudge = wrap.querySelector(".chat-nudge");
      if (nudge) nudge.remove();
      greet();
      input.focus();
      track("chat-demo-open");
    }
    function close() {
      panel.hidden = true;
      fab.setAttribute("aria-expanded", "false");
      fab.setAttribute("aria-label", "Open chat demo");
      fab.focus();
    }

    /* ---------- proactive nudge: once per session, 30s, dismissible ---------- */
    window.setTimeout(function () {
      if (session.opened || nudgeShown || panel.hidden === false) return;
      nudgeShown = true;
      var n = document.createElement("div");
      n.className = "chat-nudge";
      n.setAttribute("role", "status");
      n.innerHTML = '<button type="button" class="chat-nudge-x" aria-label="Dismiss">×</button><span>Curious what AI could do for your business? Ask me anything 👇</span>';
      n.querySelector(".chat-nudge-x").addEventListener("click", function (e) {
        e.stopPropagation();
        n.remove();
      });
      n.addEventListener("click", function () { n.remove(); open(); });
      wrap.appendChild(n);
      track("chat-demo-nudge");
    }, 30000);

    fab.addEventListener("click", function () { panel.hidden ? open() : close(); });
    wrap.querySelector(".chat-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (modalOpen) { closeBooking(); return; }
      if (!panel.hidden) close();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send(input.value);
    });
    panel.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("[data-chat-book]") : null;
      if (a) track("chat-demo-book");
    });
    document.querySelector(".sticky-book").addEventListener("click", function () { track("sticky-bar-book"); });
    document.querySelector(".sticky-call").addEventListener("click", function () { track("sticky-bar-call"); });

    /* Wire the modal's own close controls. */
    document.querySelector(".chat-book-x").addEventListener("click", closeBooking);
    document.querySelector(".chat-book-backdrop").addEventListener("click", closeBooking);

    /* Intercept EVERY booking link site-wide (chat panel, sticky bar, page
     * content): open the in-page modal instead of navigating away.
     * Capture phase, but we never stopPropagation — existing click listeners
     * (e.g. the chat-demo-book / sticky-bar-book trackers) still fire.
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
