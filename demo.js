/* Mini service demos. One demo plays at a time, with typing indicators,
   timestamps and realistic pacing. Next visible demo starts when one finishes. */
(function(){
var D={
'ai-receptionist':{title:'Incoming call',sub:'(902) 555-0187 · Glace Bay',kind:'call',start:'7:42 PM',steps:[
 ['sys','Call answered by AI receptionist · 0:02'],
 ['in','Hi, yeah, do you guys do furnace duct cleaning?'],
 ['out','Hi, thanks for calling! Yes, we do. Furnace ductwork cleaning is $499 before tax. Would you like to book a time?'],
 ['in','Yeah, sometime next week if you can.'],
 ['out','Sure. I have Tuesday at 10 AM or Thursday at 1 PM. Which works better?'],
 ['in','Tuesday\u2019s good.'],
 ['out','Great. Can I get your name and address?'],
 ['in','Mike Ross, 22 Maple St, Glace Bay.'],
 ['out','Thanks, Mike. You\u2019re booked for Tuesday at 10 AM. I\u2019ll text you a confirmation now.'],
 ['sys','Call ended · 1:48'],
 ['card','New booking: Mike Ross · Duct cleaning · Tue 10:00 AM · added to your calendar']]},
'missed-call-text-back':{title:'Business line',sub:'Text messages',kind:'sms',start:'2:14 PM',steps:[
 ['miss','Missed call from (902) 555-0142'],
 ['out','Hi! Sorry we missed your call, we\u2019re on a job right now. How can we help?'],
 ['in','Hey, looking for a quote on a heat pump install'],
 ['out','Happy to help! What town are you in, and when\u2019s a good time to call you back?'],
 ['in','Sydney River. Anytime after 4'],
 ['out','Perfect, we\u2019ll call you after 4 today.'],
 ['card','Lead saved: Heat pump install quote · Sydney River · call back after 4 PM']]},
'automated-lead-follow-up':{title:'Jenna (quote request)',sub:'Automatic follow-up',kind:'sms',start:'Mon 9:05 AM',steps:[
 ['sys','Monday'],
 ['out','Hi Jenna, thanks for your quote request! Your quote for 3 heat pump cleanings is attached. Any questions, just reply here.'],
 ['sys','Wednesday'],
 ['out','Hi Jenna, just checking in on your quote. We still have openings next week if you\u2019d like to get it booked.'],
 ['sys','Friday'],
 ['in','Sorry, been crazy busy! Is the 14th open?'],
 ['sys','Follow-up stopped: customer replied'],
 ['card','Jenna replied · ready to book for the 14th']]},
'appointment-booking-automation':{title:'Book online',sub:'Customer booking',kind:'sms',start:'8:31 PM',steps:[
 ['in','Hi, can I book a heat pump cleaning?'],
 ['out','Absolutely! Here are the next open times:'],
 ['slots',''],
 ['in','Wed 1:00 works'],
 ['out','You\u2019re booked for Wednesday at 1:00 PM. We\u2019ll send you a reminder the day before.'],
 ['card','Booked: Wed 1:00 PM · added to calendar · reminder scheduled']]},
'ai-chatbots':{title:'Website chat',sub:'Visitor on your site',kind:'chat',start:'11:20 PM',steps:[
 ['in','Do you guys work in Baddeck?'],
 ['out','Yes, we work with businesses across Cape Breton, including Baddeck.'],
 ['in','What does it cost to get started?'],
 ['out','Focused systems start at $697 setup. The best way to get an exact price is a free 20-minute consultation. Want to book one?'],
 ['in','Sure'],
 ['out','Great! Here\u2019s the calendar. Pick any time that suits you.'],
 ['card','Consultation booked at 11:23 PM · details sent to your inbox']]},
'crm-automation':{title:'Your pipeline',sub:'Updates automatically',kind:'pipe',start:'',steps:[]},
'email-sms-automation':{title:'Customer texts',sub:'Sent automatically',kind:'sms',start:'Tue 4:10 PM',steps:[
 ['sys','Booking made'],
 ['out','Hi Dave, you\u2019re booked for Thursday at 9 AM. Reply C to confirm.'],
 ['in','C'],
 ['sys','Wednesday, 5:00 PM'],
 ['out','Reminder: we\u2019ll see you tomorrow at 9 AM. Reply R to reschedule.'],
 ['sys','Thursday, job complete'],
 ['out','Thanks for choosing us, Dave! Your receipt is in your email.'],
 ['card','3 messages sent · 0 typed by you']]},
'review-generation':{title:'After the job',sub:'Review request',kind:'sms',start:'3:45 PM',steps:[
 ['sys','Job marked complete'],
 ['out','Hi Linda, thanks for having us today! If you were happy with the work, would you mind leaving a quick Google review? It really helps a local business.'],
 ['in','Of course! You guys were great'],
 ['stars',''],
 ['card','New 5-star Google review from Linda']]}
};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.textContent=h;return e;}
function clock(start,i){if(!start||!/\d:\d\d/.test(start))return '';var m=start.match(/(\d+):(\d\d)\s*(AM|PM)/);if(!m)return '';var h=+m[1],mi=+m[2]+i;h+=Math.floor(mi/60);mi%=60;return h+':'+(mi<10?'0':'')+mi+' '+m[3];}
var current=null,visible=new Set(),played=new Set();
function stopCurrent(){if(current){current.cancelled=true;current.box.classList.remove('playing');current=null;}}
function run(box,force){
  var d=D[box.dataset.demo];if(!d)return;
  if(current&&!force)return;stopCurrent();
  var job={box:box,cancelled:false};current=job;played.add(box);box.classList.add('playing');
  var chat=box.querySelector('.md-chat');chat.innerHTML='';
  var wait=function(ms,fn){setTimeout(function(){if(!job.cancelled)fn();},reduce?0:ms);};
  var done=function(){box.classList.remove('playing');if(current===job)current=null;wait(900,next);};
  if(d.kind==='pipe'){pipe(chat,wait,done);return;}
  var i=0,mins=0;
  (function step(){
    if(i>=d.steps.length){done();return;}
    var s=d.steps[i++],k=s[0],t=s[1];
    var add=function(n){chat.appendChild(n);chat.scrollTop=chat.scrollHeight;};
    if(k==='in'||k==='out'){
      var typing=el('div','md-typing '+k);typing.innerHTML='<i></i><i></i><i></i>';
      var think=k==='in'?900:600, typeMs=Math.min(2600,500+t.length*22);
      wait(think,function(){add(typing);wait(typeMs,function(){typing.remove();
        var m=el('div','md-msg '+k);m.appendChild(document.createTextNode(t));
        mins+=1;var ts=el('span','md-ts',clock(d.start,mins)+(k==='out'&&d.kind==='sms'?' · Delivered':''));m.appendChild(ts);
        add(m);wait(500,step);});});
    }else{
      var n;
      if(k==='card')n=el('div','md-card',t);
      else if(k==='miss'){n=el('div','md-miss');n.innerHTML='<b>\u260E</b> '+t.replace(/</g,'&lt;')+'<span>'+d.start+'</span>';}
      else if(k==='slots'){n=el('div','md-slots');['Tue 10:00','Wed 1:00','Thu 3:00'].forEach(function(x){n.appendChild(el('span','md-slot',x));});
        wait(2600,function(){var b=n.children[1];if(b)b.classList.add('on');});}
      else if(k==='stars'){n=el('div','md-review');n.innerHTML='<div class="md-stars">\u2605\u2605\u2605\u2605\u2605</div><p>\u201cFriendly, on time and did a great job. Highly recommend!\u201d</p><span>Linda M. \u00b7 Google review</span>';}
      else n=el('div','md-msg sys',t);
      wait(k==='sys'?500:700,function(){add(n);wait(k==='slots'?3400:(k==='card'?300:900),step);});
    }
  })();
}
function pipe(chat,wait,done){
  var cols=['New lead','Quoted','Booked','Done'];var wrap=el('div','md-pipe');
  var cs=cols.map(function(c){var col=el('div','md-col');col.appendChild(el('strong',null,c));wrap.appendChild(col);return col;});
  chat.appendChild(wrap);
  var log=el('div','md-log');chat.appendChild(log);
  var card=el('div','md-lead');card.innerHTML='<b>Sarah M.</b><span>Heat pump install</span>';
  var notes=['New lead from website form · contact created','Quote sent · follow-up scheduled for Thursday','Customer booked · crew assigned · reminder set','Job done · invoice sent · review request queued'];
  var s=0;
  var mv=function(){cs[s].appendChild(card);card.classList.remove('flash');void card.offsetWidth;card.classList.add('flash');
    var n=el('div','md-note',notes[s]);log.appendChild(n);
    if(s>=3){wait(700,done);return;}s++;wait(2200,mv);};
  wait(600,mv);
}
function next(){if(current)return;var boxes=[].slice.call(document.querySelectorAll('.mini-demo'));
  for(var i=0;i<boxes.length;i++){var b=boxes[i];if(visible.has(b)&&!played.has(b)){run(b);return;}}}
document.querySelectorAll('.mini-demo').forEach(function(box){var d=D[box.dataset.demo];if(!d)return;
  box.querySelector('.md-title').textContent=d.title;var ch=box.querySelector('.md-chat');if(!ch.children.length){var w=el('button','md-wait','▶  Watch this demo');w.type='button';w.addEventListener('click',function(){run(box,true);});ch.appendChild(w);}box.querySelector('.md-sub').textContent=d.sub;
  box.querySelector('.md-replay').addEventListener('click',function(){run(box,true);});
});
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&e.intersectionRatio>=.55)visible.add(e.target);else{visible.delete(e.target);
    if(current&&current.box===e.target&&e.intersectionRatio<.15){stopCurrent();played.delete(e.target);}}});next();},{threshold:[0,.15,.55,.8]});
  document.querySelectorAll('.mini-demo').forEach(function(b){io.observe(b);});
}else{var f=document.querySelector('.mini-demo');if(f)run(f);}
})();
