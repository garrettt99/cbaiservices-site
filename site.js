/* Cape Breton AI Services — site behaviour (no dependencies) */
(function(){
'use strict';
var CFG={
  // Paste a form endpoint here (a URL that accepts a JSON POST) to receive leads directly.
  // While it is empty, forms open the visitor's email app with everything filled in.
  endpoint:'',
  email:'CapeBretonAIServices@gmail.com',
  booking:'https://api.leadconnectorhq.com/widget/booking/DgGSXap9g3fHGGPrjPCV'
};
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var TICK='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function onView(el,fn){if(!('IntersectionObserver' in window)){fn();return}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn()}})},{threshold:.3});io.observe(el)}
function money(n){return '$'+Math.round(n).toLocaleString('en-CA')}

/* header */
var head=$('.site-head');
if(head){var st=function(){head.classList.toggle('is-stuck',window.scrollY>12)};st();window.addEventListener('scroll',st,{passive:true});
  var mb=$('.menu-btn'),mn=$('#mobileNav');
  if(mb&&mn)mb.addEventListener('click',function(){var o=mn.hidden;mn.hidden=!o;mb.setAttribute('aria-expanded',String(o));mb.setAttribute('aria-label',o?'Close menu':'Open menu')});}

/* hero run */
$$('[data-run]').forEach(function(run){
  var steps=$$('.rstep',run),timer=null,i=0;
  function paint(n){steps.forEach(function(s,k){s.classList.toggle('done',k<n);s.classList.toggle('active',k===n)})}
  function play(){clearTimeout(timer);i=0;run.classList.add('is-running');paint(0);(function next(){timer=setTimeout(function(){i++;paint(i);if(i<steps.length)next();else{run.classList.remove('is-running');timer=setTimeout(play,5200)}},1500)})()}
  if(REDUCED){paint(steps.length);return}
  paint(-1);onView(run,play);
  var rp=$('[data-replay]',run);if(rp)rp.addEventListener('click',play);
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearTimeout(timer);else if(!REDUCED)play()});
});

/* chat (AI employee) */
$$('[data-chat]').forEach(function(box){
  var msgs=$$('.msg',box),checks=$$('.checks li',box.closest('section')||document),t=[];
  function reset(){t.forEach(clearTimeout);t=[];msgs.forEach(function(m){m.classList.remove('show')});checks.forEach(function(c){c.classList.remove('on')})}
  function play(){reset();msgs.forEach(function(m,k){t.push(setTimeout(function(){m.classList.add('show')},600+k*1300))});var base=600+msgs.length*1300;checks.forEach(function(c,k){t.push(setTimeout(function(){c.classList.add('on')},base+k*420))})}
  if(REDUCED){msgs.forEach(function(m){m.classList.add('show')});checks.forEach(function(c){c.classList.add('on')});return}
  onView(box,play);
  var rp=$('[data-chat-replay]',box.closest('section')||document);if(rp)rp.addEventListener('click',play);
});

/* industry demo */
var IND={
 hvac:{name:'HVAC',lead:'Facebook lead',steps:[['Facebook lead comes in','Someone taps your ad at 8:40 pm.'],['AI replies by text','Within seconds, in your business name.'],['Asks what service they need','Cleaning, repair or a new install.'],['Collects the address','And how many units are in the home.'],['Qualifies the lead','Checks the service area and urgency.'],['Offers an appointment','Two open times from your calendar.'],['Updates your CRM','Contact, notes and the booked time.'],['Sends follow-up','Confirmation now, reminder the day before.']],chat:[['them','Saw your ad. How much is a heat pump cleaning?'],['ai','Happy to help. Is it one indoor unit or more? And what town are you in?'],['them','Two units, Glace Bay.'],['ai','Thanks. I have Tuesday at 9 or Thursday at 1 open. Which works better?']]},
 contractor:{name:'Contractor',lead:'Missed call',steps:[['Call comes in while you are on site','It rings out.'],['Text goes out right away','"Sorry we missed you. What are you looking to get done?"'],['AI asks about the job','Type of work, rough size and timeline.'],['Collects photos and address','So you can quote without a wasted trip.'],['Flags the good ones','Bigger jobs and ready-to-go customers first.'],['Books a site visit','On a day you are already in that area.'],['Adds it to your job list','With everything the customer said.']],chat:[['ai','Sorry we missed your call. What are you looking to get done?'],['them','Need a deck replaced before winter.'],['ai','Got it. Roughly what size, and can you send a photo? What is the address?'],['them','12x16, 44 King St. Photo attached.']]},
 realestate:{name:'Real estate',lead:'Listing inquiry',steps:[['Inquiry on a listing','From your site or a portal, any hour.'],['AI answers in seconds','Confirms the listing is available.'],['Asks the basics','Buying timeline, pre-approval, must-haves.'],['Offers showing times','From your real calendar.'],['Books the showing','And sends the address and details.'],['Adds the buyer to your CRM','Tagged by budget and area.'],['Follows up after','"What did you think of the place?"']],chat:[['them','Is 18 Harbour Rd still available?'],['ai','It is. Are you hoping to see it this week? And are you already pre-approved?'],['them','Yes, pre-approved. Saturday if possible.'],['ai','I can do Saturday at 11 or 2. Which is better?']]},
 dental:{name:'Dental',lead:'After-hours call',steps:[['Call after closing','The office is closed for the day.'],['AI receptionist answers','Greets them with your clinic name.'],['Finds out what they need','Cleaning, pain, or a new patient visit.'],['Handles common questions','Hours, location, insurance you accept.'],['Requests an appointment','Sends your team the preferred times.'],['Urgent cases get flagged','Your on-call number or next-morning priority.'],['Reminder texts go out','Before the visit, with a confirm link.']],chat:[['them','Do you take new patients? I need a cleaning.'],['ai','We do. I can get a request in for you. Mornings or afternoons?'],['them','Mornings, any day next week.'],['ai','Done. The office will confirm your time first thing tomorrow.']]},
 automotive:{name:'Automotive',lead:'Website chat',steps:[['Visitor opens chat on your site','Looking at winter tires at 9 pm.'],['AI answers the question','Using your prices and services.'],['Gets the vehicle details','Year, make, model and tire size.'],['Offers a drop-off time','From your shop calendar.'],['Books the bay','And texts a confirmation.'],['Creates the work order note','So the car is expected.'],['Asks for a review after pickup','A short text with your link.']],chat:[['them','How much to swap winter tires on rims?'],['ai','On rims it is a quick job. What vehicle is it, and do you want them stored too?'],['them','2021 RAV4, no storage.'],['ai','Easy. I have Wednesday at 8 or Friday at 3. Which do you want?']]},
 home:{name:'Home services',lead:'Estimate sent',steps:[['You send an estimate','Then get busy with the next job.'],['Day 2: a friendly check-in','"Any questions on the quote?"'],['AI answers replies','Scope, timing and what is included.'],['Day 5: a second nudge','Only if they have not answered.'],['They say yes','You get a text right away.'],['Job gets booked','Straight into your schedule.'],['Review request after the job','So good work turns into more work.']],chat:[['ai','Hi Sam, just checking in on the estimate we sent Tuesday. Any questions?'],['them','Does that price include hauling away the old one?'],['ai','It does. Removal and disposal are included. Want me to hold a spot for next week?'],['them','Yes please.']]},
 other:{name:'Other',lead:'Any new inquiry',steps:[['A new inquiry arrives','Call, text, form, Facebook or email.'],['It gets an answer right away','In your voice, with your information.'],['AI asks your questions','The same ones you ask every time.'],['Details are captured once','No retyping between systems.'],['The next step is offered','A booking, a quote or a call back.'],['Your team is notified','With the full conversation.'],['Follow-up runs on its own','Until they answer or opt out.']],chat:[['them','Hi, do you have availability this month?'],['ai','We do. Can I ask a couple of quick questions so I point you the right way?'],['them','Sure.'],['ai','Great. What are you looking for, and when do you need it by?']]}
};
function flowHTML(steps,anim){return '<ol class="flow'+(anim&&!REDUCED?' anim':'')+'">'+steps.map(function(s,k){return '<li class="fstep" style="--i:'+k+'"><i class="fdot">'+TICK+'</i><div><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div></li>'}).join('')+'</ol>'}
$$('[data-industry]').forEach(function(root){
  var out=$('[data-industry-out]',root),btns=$$('[role=tab]',root);
  function show(k){var d=IND[k];btns.forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.k===k));b.tabIndex=b.dataset.k===k?0:-1});
    out.innerHTML='<div><p class="kicker">Starts with: '+esc(d.lead)+'</p>'+flowHTML(d.steps,true)+'</div><div class="sample" aria-label="Example conversation">'+d.chat.map(function(m){return '<p class="msg '+m[0]+'"><small>'+(m[0]==='ai'?'AI assistant':'Customer')+'</small>'+esc(m[1])+'</p>'}).join('')+'<p class="small">An example conversation. Yours uses your services, prices and tone.</p></div>'}
  btns.forEach(function(b,ix){b.addEventListener('click',function(){show(b.dataset.k)});b.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){var n=btns[(ix+d+btns.length)%btns.length];n.focus();show(n.dataset.k)}})});
  show('hvac');
});

/* automation examples */
var AUTO={
 missed:{t:'Missed call',r:'Instant text response',s:[['Call rings out','You are on a job or on another line.'],['Text sent in seconds','From your business number.'],['Conversation starts','The caller says what they need.'],['You get the details','Or it books them directly.']],m:'Hi, this is Harbour Plumbing. Sorry we missed your call. What can we help with?'},
 facebook:{t:'Facebook lead',r:'AI qualification',s:[['Lead form submitted','From your ad, day or night.'],['AI texts them right away','While they still have their phone out.'],['Asks your qualifying questions','Service, location, timeline.'],['Good leads get booked','The rest are tagged for later.']],m:'Thanks for reaching out about a quote. Which service are you after, and what town are you in?'},
 website:{t:'Website lead',r:'Instant conversation',s:[['Form or chat on your site','A visitor asks a question.'],['Answer appears immediately','Based on your real information.'],['Contact details captured','Name, number and what they want.'],['Handed to your team','With the whole conversation attached.']],m:'Good question. Yes, we service that area. Want me to check the next opening for you?'},
 estimate:{t:'Estimate sent',r:'Automatic follow-up',s:[['Estimate goes out','From your quoting tool.'],['Check-in two days later','Short and friendly.'],['Questions get answered','So the quote does not stall.'],['Stops when they reply','No awkward extra messages.']],m:'Hi Dana, just checking in on the estimate we sent Monday. Any questions I can answer?'},
 old:{t:'Old customer',r:'Reactivation campaign',s:[['Past customers are listed','From your CRM or invoices.'],['A useful message goes out','A seasonal reminder, not spam.'],['Replies are handled','Questions answered, times offered.'],['Bookings land in your calendar','From customers you already earned.']],m:'Hi Pat, it has been about a year since your last service. Want us to get you booked before the busy season?'},
 appt:{t:'Appointment',r:'Automatic reminders',s:[['Appointment is booked','By your team or by the AI.'],['Confirmation sent','With date, time and what to expect.'],['Reminder the day before','With a one-tap confirm.'],['Reschedules are handled','Before they turn into no-shows.']],m:'Reminder: we will see you tomorrow at 9:00 am. Reply C to confirm or R to reschedule.'},
 done:{t:'Completed job',r:'Review request',s:[['Job is marked complete','In the software you already use.'],['Thank-you text goes out','A few hours later.'],['Review link included','One tap to your Google page.'],['Unhappy replies come to you','Privately, so you can fix it.']],m:'Thanks for choosing us today. If you were happy with the work, a quick review would mean a lot: [your link]'},
 newcust:{t:'New customer',r:'CRM entry',s:[['A new customer appears','From a call, form or booking.'],['Contact is created','No one types it in.'],['Notes and source are saved','Where they came from and what they asked.'],['Next step is scheduled','So nothing depends on memory.']],m:'New contact added: Jamie R. · Source: website form · Wants: duct cleaning quote · Next: call back today.'},
 question:{t:'Incoming question',r:'AI response',s:[['A question comes in','Text, chat, Facebook or email.'],['AI answers from your info','Hours, prices, service area, process.'],['Anything unusual is handed off','To a person, with context.'],['Every conversation is saved','So you can review and improve.']],m:'We are open Monday to Friday, 8 to 5. I can book you in or have someone call you. Which would you like?'}
};
$$('[data-auto]').forEach(function(root){
  var out=$('[data-auto-out]',root),btns=$$('[data-k]',root);
  function show(k,scroll){var d=AUTO[k];btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.k===k))});
    out.innerHTML='<p class="kicker">'+esc(d.t)+'</p><h3>'+esc(d.r)+'</h3>'+flowHTML(d.s,true)+'<p class="bubble"><small>'+(k==='newcust'?'What your team sees':'Example message')+'</small>'+esc(d.m)+'</p>';
    if(scroll&&window.innerWidth<=860)out.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'nearest'})}
  btns.forEach(function(b){b.addEventListener('click',function(){show(b.dataset.k,true)})});
  show('missed');
});

/* calculator */
$$('[data-calc]').forEach(function(c){
  var L=$('#cLeads',c),V=$('#cValue',c),M=$('#cMissed',c),out=$('#cOut',c),yr=$('#cYear',c),note=$('#cNote',c);
  function n(el){var v=parseFloat(String(el.value).replace(/[^0-9.]/g,''));return isFinite(v)&&v>0?v:0}
  function calc(){var leads=n(L),val=n(V),miss=n(M);
    if(miss>leads&&leads>0){note.textContent='Missed leads is higher than your total leads, so we used '+leads+'.';miss=leads}else note.textContent='';
    out.textContent=money(miss*val);yr.textContent=money(miss*val*12)}
  [L,V,M].forEach(function(el){el.addEventListener('input',calc)});calc();
});

/* lead submit */
function submitLead(data){
  data.page=location.pathname;data.source=(new URLSearchParams(location.search).get('utm_source'))||document.referrer||'direct';data.sent=new Date().toISOString();
  if(CFG.endpoint){return fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){if(!r.ok)throw new Error('bad');return 'sent'})}
  var body=Object.keys(data).map(function(k){return k+': '+data[k]}).join('\n');
  location.href='mailto:'+CFG.email+'?subject='+encodeURIComponent((data.form||'Website')+' request from '+(data.business||data.name||'website'))+'&body='+encodeURIComponent(body);
  return Promise.resolve('mail');
}
function validate(form){
  var ok=true,first=null;
  $$('.field',form).forEach(function(f){var el=$('input,select,textarea',f),e=$('.err',f);if(!el)return;var v=el.value.trim(),msg='';
    if(el.required&&!v)msg='Please fill this in.';
    else if(el.type==='email'&&v&&!/^\S+@\S+\.\S+$/.test(v))msg='That email address does not look right.';
    else if(el.dataset.contact&&v&&!/^\S+@\S+\.\S+$/.test(v)&&v.replace(/\D/g,'').length<10)msg='Enter a phone number with area code, or an email address.';
    f.classList.toggle('bad',!!msg);if(e){e.textContent=msg;e.hidden=!msg}el.setAttribute('aria-invalid',String(!!msg));if(msg&&!first)first=el;if(msg)ok=false});
  if(first)first.focus();return ok;
}
$$('form[data-lead]').forEach(function(form){
  form.setAttribute('novalidate','');
  form.addEventListener('submit',function(e){e.preventDefault();if(!validate(form))return;
    var btn=$('button[type=submit]',form),label=btn.textContent,data={form:form.dataset.lead};
    $$('input,select,textarea',form).forEach(function(el){if(el.name&&el.type!=='checkbox'&&el.type!=='radio')data[el.name]=el.value.trim()});
    if(form._extra)Object.keys(form._extra).forEach(function(k){data[k]=form._extra[k]});
    if(data.website){return} // honeypot
    btn.disabled=true;btn.textContent='Sending…';var errBox=$('[data-form-error]',form);if(errBox)errBox.hidden=true;
    submitLead(data).then(function(how){var ok=$('[data-ok]',form.parentNode);form.hidden=true;if(ok){ok.hidden=false;var m=$('[data-ok-mail]',ok);if(m)m.hidden=how!=='mail';ok.setAttribute('tabindex','-1');ok.focus()}})
    .catch(function(){btn.disabled=false;btn.textContent=label;if(errBox){errBox.hidden=false;errBox.focus()}});
  });
});

/* audit */
var audit=$('[data-audit]');
if(audit){
  var Q=[
   {id:'type',q:'What type of business do you operate?',type:'radio',o:['Trades or home services','HVAC or heat pumps','Construction or contracting','Real estate','Dental or health clinic','Automotive','Retail or restaurant','Professional services','Something else']},
   {id:'size',q:'How many people work in the business?',type:'radio',o:['Just me','2 to 5','6 to 15','16 to 50','More than 50']},
   {id:'sources',q:'Where do your leads come from?',hint:'Pick all that apply.',type:'check',o:['Phone calls','Website forms or chat','Facebook or Instagram','Google search or ads','Referrals and repeat customers','Walk-ins']},
   {id:'speed',q:'How quickly do you normally respond to a new lead?',type:'radio',o:['Within a few minutes','Within an hour','Same day','Next day or longer','It depends who is free']},
   {id:'crm',q:'What do you use to track customers and jobs?',type:'radio',o:['A CRM or job software','Spreadsheets','Paper, texts and memory','A mix of things','Nothing yet']},
   {id:'tasks',q:'What takes your team the most time?',hint:'Pick up to three.',type:'check',max:3,o:['Answering the phone','Replying to messages and emails','Following up on quotes','Scheduling and rescheduling','Entering the same info in more than one place','Asking for reviews','Chasing payments and paperwork']},
   {id:'want',q:'What would you most like to automate?',type:'radio',o:['Responding to new leads','Answering calls I cannot get to','Following up on quotes','Booking appointments','Keeping my customer list organized','Getting more reviews','Not sure yet']}
  ];
  var A={},step=0,body=$('[data-audit-body]',audit),bar=$('.progress i',audit),count=$('[data-audit-count]',audit);
  function has(id,v){var a=A[id];return Array.isArray(a)?a.indexOf(v)>-1:a===v}
  function recs(){
    var R=[
     {k:'lead',t:'Instant lead response',d:'New inquiries get a reply in seconds, with your qualifying questions asked for you.',s:0,why:[]},
     {k:'call',t:'Missed-call text-back or AI receptionist',d:'Calls you cannot answer start a text conversation or get picked up by an AI receptionist.',s:0,why:[]},
     {k:'quote',t:'Estimate follow-up',d:'Every quote gets a check-in and a second nudge without anyone remembering to send it.',s:0,why:[]},
     {k:'book',t:'Appointment booking and reminders',d:'Customers pick a time, get confirmed and reminded, and reschedule without phone tag.',s:0,why:[]},
     {k:'crm',t:'CRM and workflow automation',d:'One place for contacts, with details moving between your tools automatically.',s:0,why:[]},
     {k:'review',t:'Review requests',d:'A review request goes out after every finished job.',s:0,why:[]},
     {k:'react',t:'Customer reactivation',d:'Past customers hear from you at the right time with a reason to book again.',s:0,why:[]},
     {k:'chat',t:'Website chatbot',d:'Visitors get answers right away and leave their details instead of leaving your site.',s:0,why:[]}
    ],by={};R.forEach(function(r){by[r.k]=r});
    function add(k,n,w){by[k].s+=n;if(w)by[k].why.push(w)}
    var sp=A.speed;
    if(sp==='Next day or longer')add('lead',5,'you said replies usually take until the next day or longer');
    else if(sp==='Same day')add('lead',4,'you said replies usually go out the same day, not right away');
    else if(sp==='It depends who is free')add('lead',4,'you said response time depends on who is free');
    else if(sp==='Within an hour')add('lead',2,'you said replies take up to an hour');
    if(has('sources','Phone calls')){add('call',3,'phone calls are one of your lead sources')}
    if(has('sources','Facebook or Instagram')){add('lead',2,'you get leads from Facebook or Instagram, where people expect a fast reply')}
    if(has('sources','Google search or ads')){add('lead',1);add('call',1)}
    if(has('sources','Website forms or chat')){add('chat',3,'your website already brings in inquiries');add('lead',1)}
    if(has('sources','Referrals and repeat customers')){add('react',3,'referrals and repeat customers are a lead source for you');add('review',2)}
    if(has('tasks','Answering the phone'))add('call',3,'answering the phone is one of your biggest time costs');
    if(has('tasks','Replying to messages and emails'))add('lead',2,'replying to messages takes up your team\'s time');
    if(has('tasks','Following up on quotes'))add('quote',4,'following up on quotes takes up your team\'s time');
    if(has('tasks','Scheduling and rescheduling'))add('book',4,'scheduling and rescheduling takes up your team\'s time');
    if(has('tasks','Entering the same info in more than one place'))add('crm',4,'your team enters the same information in more than one place');
    if(has('tasks','Asking for reviews'))add('review',3,'asking for reviews is manual right now');
    if(has('tasks','Chasing payments and paperwork'))add('crm',2,'paperwork and payment follow-up is manual right now');
    var c=A.crm;
    if(c==='Paper, texts and memory'||c==='Nothing yet')add('crm',4,'customers are tracked on paper or from memory');
    else if(c==='Spreadsheets'||c==='A mix of things')add('crm',2,'customer details live in '+(c==='Spreadsheets'?'spreadsheets':'several places'));
    else if(c==='A CRM or job software'){add('react',2,'you already have a customer list in your software to work from');add('quote',1)}
    var w={'Responding to new leads':'lead','Answering calls I cannot get to':'call','Following up on quotes':'quote','Booking appointments':'book','Keeping my customer list organized':'crm','Getting more reviews':'review'}[A.want];
    if(w)add(w,5,'it is the thing you most want to automate');
    if(A.size==='Just me'||A.size==='2 to 5'){add('call',1);add('book',1)}
    R.sort(function(a,b){return b.s-a.s});
    var top=R.filter(function(r){return r.s>0}).slice(0,3);
    if(top.length<3){['lead','quote','react'].forEach(function(k){if(top.length<3&&top.indexOf(by[k])<0){by[k].why=by[k].why.length?by[k].why:['it is a common gap for businesses like yours'];top.push(by[k])}})}
    return top;
  }
  function render(){
    var q=Q[step];bar.style.width=Math.round(step/Q.length*100)+'%';count.textContent='Question '+(step+1)+' of '+Q.length;
    var cur=A[q.id]||(q.type==='check'?[]:'');
    body.innerHTML='<fieldset class="q" style="border:0;padding:0;margin:0"><legend style="padding:0"><h2 tabindex="-1">'+esc(q.q)+'</h2></legend>'+(q.hint?'<p class="small" style="font-size:16px">'+q.hint+'</p>':'')+'<div class="opts">'+q.o.map(function(o,k){var ch=q.type==='check'?cur.indexOf(o)>-1:cur===o;return '<label><input type="'+(q.type==='check'?'checkbox':'radio')+'" name="a" value="'+esc(o)+'"'+(ch?' checked':'')+'>'+esc(o)+'</label>'}).join('')+'</div><p class="err" data-q-err hidden></p><div class="q-nav">'+(step?'<button type="button" class="btn btn-line" data-back>Back</button>':'<span></span>')+'<button type="button" class="btn btn-go" data-next>'+(step===Q.length-1?'See my opportunities':'Next')+'</button></div></fieldset>';
    var ins=$$('input',body),err=$('[data-q-err]',body);
    ins.forEach(function(inp){inp.addEventListener('change',function(){err.hidden=true;
      if(q.type==='check'&&q.max&&ins.filter(function(x){return x.checked}).length>q.max){inp.checked=false;err.textContent='Pick up to '+q.max+'.';err.hidden=false}
      if(q.type==='radio'){A[q.id]=inp.value}})});
    $('[data-next]',body).addEventListener('click',function(){var sel=ins.filter(function(x){return x.checked}).map(function(x){return x.value});
      if(!sel.length){err.textContent='Pick an answer to continue.';err.hidden=false;return}
      A[q.id]=q.type==='check'?sel:sel[0];step++;if(step<Q.length){render();focusQ()}else results()});
    var b=$('[data-back]',body);if(b)b.addEventListener('click',function(){step--;render();focusQ()});
  }
  function focusQ(){var h=$('h2',body);if(h)h.focus({preventScroll:true});audit.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'start'})}
  function results(){
    bar.style.width='100%';count.textContent='Your results';
    var top=recs(),lv=[['high','High impact'],['med','Medium impact'],['opp','Opportunity']];
    body.innerHTML='<div class="q"><h2 tabindex="-1">Your automation opportunities</h2><p class="lead">Based on your seven answers, these are the three places we would look first. This is a starting point from a short questionnaire, not a full review of your business.</p><div>'+top.map(function(r,k){return '<div class="rec"><span class="lvl '+lv[k][0]+'">'+lv[k][1]+'</span><h3>'+esc(r.t)+'</h3><p>'+esc(r.d)+(r.why.length?' <strong style="color:var(--ink);font-weight:600">Why: '+esc(r.why[0])+'.</strong>':'')+'</p></div>'}).join('')+'</div><button type="button" class="btn btn-line btn-sm" data-restart style="justify-self:start">Change my answers</button></div>';
    $('[data-restart]',body).addEventListener('click',function(){step=0;render();focusQ();$('[data-audit-form]').hidden=true});
    var wrap=$('[data-audit-form]'),form=$('form',wrap);wrap.hidden=false;
    form._extra={recommendations:top.map(function(r){return r.t}).join(' | ')};Q.forEach(function(q){form._extra['q_'+q.id]=Array.isArray(A[q.id])?A[q.id].join(', '):A[q.id]});
    focusQ();
  }
  render();
}
})();

/* CBAIS Assistant chat widget (GHL Conversation AI) — injected once. */
(function(){
  var WIDGET_ID = "6ab99a2208a179ce3804a912";
  if (document.querySelector('script[data-widget-id="' + WIDGET_ID + '"]')) return;
  var s = document.createElement("script");
  s.src = "https://widgets.leadconnectorhq.com/loader.js";
  s.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
  s.setAttribute("data-widget-id", WIDGET_ID);
  document.body.appendChild(s);
})();
