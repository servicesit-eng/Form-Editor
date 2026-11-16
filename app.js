'use strict';
/* ============================================================
   DONTUM e-FORM · ADMIN CONSOLE
   ============================================================ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,9);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
const MM=96/25.4, PW=210, PH=297;
const API_URL='https://script.google.com/macros/s/AKfycbwlBmF7UCDh1b-DlGy6uzT_Vot2J0Z02EoLoCRm5XFjtra1nDzCBD-cBHJ_8Yl6hX6oig/exec';
const KEY='dontum.console.v1';

/* ---------- icons ---------- */
const P={
forms:'M4 3h10l6 6v12H4z M14 3v6h6',inbox:'M3 12h5l2 3h4l2-3h5 M3 12l3-8h12l3 8v8H3z',
builder:'M12 2l3 6 6 1-4.5 4.3 1 6.2L12 16.6 6.5 19.5l1-6.2L3 9l6-1z',
mine:'M9 11l3 3 8-8 M20 12v7H4V5h9',users:'M16 20v-2a4 4 0 00-8 0v2 M12 11a4 4 0 100-8 4 4 0 000 8 M22 20v-2a4 4 0 00-3-3.9',
image:'M3 4h18v16H3z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3 M21 15l-5-5L5 20',
globe:'M12 21a9 9 0 100-18 9 9 0 000 18 M3 12h18 M12 3a15 15 0 010 18 15 15 0 010-18',
search:'M11 19a8 8 0 100-16 8 8 0 000 16 M21 21l-4.3-4.3',cmd:'M9 6a3 3 0 10-3 3h12a3 3 0 10-3-3v12a3 3 0 103-3H6a3 3 0 103 3z',
sun:'M12 17a5 5 0 100-10 5 5 0 000 10 M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4',
moon:'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8',bell:'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 01-3.4 0',
help:'M12 21a9 9 0 100-18 9 9 0 000 18 M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3 M12 17h.01',
rows:'M3 6h18 M3 12h18 M3 18h18',grid:'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
plus:'M12 5v14 M5 12h14',copy:'M9 9h11v11H9z M5 15H4V4h11v1',dl:'M21 15v4H3v-4 M7 10l5 5 5-5 M12 15V3',
print:'M6 9V2h12v7 M6 18H4v-6h16v6h-2 M6 14h12v8H6z',trash:'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6',
edit:'M11 4H4v16h16v-7 M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z',star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
check:'M20 6L9 17l-5-5',x:'M18 6L6 18 M6 6l12 12',eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8 M12 15a3 3 0 100-6 3 3 0 000 6',
undo:'M3 7v6h6 M3.5 13a9 9 0 102.6-6.4L3 9',redo:'M21 7v6h-6 M20.5 13a9 9 0 11-2.6-6.4L21 9',
save:'M19 21H5V3h11l3 3z M17 21v-8H7v8 M7 3v5h8',zoomin:'M11 19a8 8 0 100-16 8 8 0 000 16 M21 21l-4.3-4.3 M11 8v6 M8 11h6',
zoomout:'M11 19a8 8 0 100-16 8 8 0 000 16 M21 21l-4.3-4.3 M8 11h6',
grip:'M9 5h.01 M9 12h.01 M9 19h.01 M15 5h.01 M15 12h.01 M15 19h.01',
arch:'M3 3h18v5H3z M5 8v13h14V8 M10 12h4',filter:'M22 3H2l8 9.5V19l4 2v-8.5z',
sort:'M11 5h10 M11 9h7 M11 13h4 M3 17l3 3 3-3 M6 4v16',chev:'M9 18l6-6-6-6',
text:'M4 7V4h16v3 M9 20h6 M12 4v16',title:'M4 6h16 M4 12h10 M4 18h7',
input:'M3 5h18v14H3z M7 9v6',area:'M3 5h18v14H3z M7 9h10 M7 13h7',
date:'M3 5h18v16H3z M16 3v4 M8 3v4 M3 11h18',radio:'M12 21a9 9 0 100-18 9 9 0 000 18 M12 15a3 3 0 100-6 3 3 0 000 6',
cbx:'M3 3h18v18H3z M7 12l3 3 7-7',sel:'M3 5h18v14H3z M8 10l4 4 4-4',
sign:'M3 19c4-8 6 4 9-2s5-4 9-2 M3 21h18',agree:'M3 6h18v12H3z M7 12l2.5 2.5L16 8',
div:'M3 12h18',up:'M12 19V5 M5 12l7-7 7 7',down:'M12 5v14 M19 12l-7 7-7-7',
menu:'M3 6h18 M3 12h18 M3 18h18',clock:'M12 21a9 9 0 100-18 9 9 0 000 18 M12 7v5l3 2',
csv:'M14 2H6v20h12V6z M14 2v4h4 M9 13h6 M9 17h4',bolt:'M13 2L3 14h8l-1 8 10-12h-8z',
info:'M12 21a9 9 0 100-18 9 9 0 000 18 M12 16v-4 M12 8h.01',warn:'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0 M12 9v4 M12 17h.01',
lock:'M5 11h14v10H5z M8 11V7a4 4 0 018 0v4',refresh:'M21 12a9 9 0 11-3-6.7L21 8 M21 3v5h-5'
};
const ic=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${(P[n]||'').split(' M').map((d,i)=>`<path d="${i?'M'+d:d}"/>`).join('')}</svg>`;

/* ---------- seed ---------- */
const DEPTS=['งานเทคโนโลยีสารสนเทศ','งานพัสดุ','งานทรัพยากรบุคคล','งานสารบรรณ','งานช่างเทคนิค','งานพัฒนาคุณภาพ','งานยานพาหนะ','กลุ่มงานเวชศาสตร์ครอบครัว'];
const NAMES=[['นาย','สมชาย','ใจดี'],['นาง','สมหญิง','รักงาน'],['นางสาว','พรทิพย์','แสงทอง'],['นาย','อนุชา','มั่นคง'],['นางสาว','กัลยา','ศรีสุข'],['นาย','ธีรพงษ์','พัฒนกุล'],['นาง','วิไลพร','บุญมา'],['นาย','ปกรณ์','ชัยยะ'],['นางสาว','ชญานิศ','ทองใบ'],['นาย','ศุภกร','วงศ์สุวรรณ'],['นาง','รัตนา','พงษ์ศรี'],['นาย','จิรวัฒน์','อินทร์แก้ว'],['นางสาว','เบญจวรรณ','สุขใจ'],['นาย','ณัฐพล','แก้วมณี'],['นาง','สุภาพร','ดำรงค์'],['นาย','วิทยา','พูนผล'],['นางสาว','อารยา','จันทร์เพ็ญ'],['นาย','เอกชัย','ศรีเมือง']];
const POS=['นักวิชาการคอมพิวเตอร์','เจ้าพนักงานพัสดุ','นักทรัพยากรบุคคล','เจ้าพนักงานธุรการ','ช่างเทคนิค','พยาบาลวิชาชีพ','นายแพทย์ชำนาญการ','เจ้าพนักงานยานพาหนะ','นักวิเคราะห์นโยบายและแผน'];
const FT=['label','title','logo','text_input','textarea','date','radio','checkbox','select','signature','checkbox_agree','divider'];
const INP=['text_input','textarea','date','radio','checkbox','select','signature','checkbox_agree'];
const OPT=['radio','checkbox','select'];
const FTL={label:'ข้อความ',title:'หัวข้อ',logo:'โลโก้',text_input:'ช่องข้อความ',textarea:'ข้อความยาว',date:'วันที่',radio:'ตัวเลือกเดียว',checkbox:'หลายตัวเลือก',select:'รายการเลือก',signature:'ลายเซ็น',checkbox_agree:'ยอมรับข้อตกลง',divider:'เส้นคั่น'};
const FTI={label:'text',title:'title',logo:'image',text_input:'input',textarea:'area',date:'date',radio:'radio',checkbox:'cbx',select:'sel',signature:'sign',checkbox_agree:'agree',divider:'div'};
const ST={SUBMITTED:'รอตรวจสอบ',APPROVED:'อนุมัติแล้ว',REJECTED:'ไม่อนุมัติ'};

function mkF(t,o={}){return Object.assign({id:uid('f_'),field_type:t,name:t+'_'+Math.random().toString(36).slice(2,6),label:FTL[t],value:'',options:OPT.includes(t)?['ตัวเลือก 1','ตัวเลือก 2']:null,required:false,pos_x:15,pos_y:20,width:70,height:8,font_size:14,font_family:'Noto Sans Thai',font_weight:'normal',text_color:'#111111',bg_color:'transparent',border_style:'dotted',border_color:'#333333',text_align:'left'},o)}
function baseFields(title){
 return [
  mkF('title',{name:'doc_title',label:'หัวเรื่อง',value:title,pos_x:20,pos_y:22,width:170,height:11,font_size:17,font_weight:'bold',text_align:'center',border_style:'none'}),
  mkF('label',{name:'org',label:'หน่วยงาน',value:'โรงพยาบาลดอนตูม  จังหวัดนครปฐม',pos_x:20,pos_y:34,width:170,height:7,font_size:13,text_align:'center',border_style:'none'}),
  mkF('divider',{name:'ln1',pos_x:20,pos_y:44,width:170,height:2,border_style:'none',border_color:'#0E7C86'}),
  mkF('label',{name:'lb_name',label:'ชื่อ',value:'ข้าพเจ้า (นาย/นาง/นางสาว)',pos_x:20,pos_y:52,width:52,height:7,border_style:'none',font_size:13}),
  mkF('text_input',{name:'full_name',label:'ชื่อ-นามสกุล',required:true,pos_x:72,pos_y:52,width:118,height:8}),
  mkF('label',{name:'lb_pos',label:'ตำแหน่ง',value:'ตำแหน่ง',pos_x:20,pos_y:64,width:24,height:7,border_style:'none',font_size:13}),
  mkF('text_input',{name:'position',label:'ตำแหน่ง',required:true,pos_x:44,pos_y:64,width:70,height:8}),
  mkF('label',{name:'lb_dept',label:'หน่วยงาน',value:'หน่วยงาน',pos_x:118,pos_y:64,width:24,height:7,border_style:'none',font_size:13}),
  mkF('text_input',{name:'department',label:'หน่วยงาน',required:true,pos_x:142,pos_y:64,width:48,height:8}),
  mkF('date',{name:'req_date',label:'วันที่',required:true,pos_x:20,pos_y:78,width:52,height:8}),
  mkF('text_input',{name:'phone',label:'เบอร์โทรศัพท์',pos_x:80,pos_y:78,width:60,height:8}),
  mkF('textarea',{name:'detail',label:'รายละเอียด',required:true,pos_x:20,pos_y:94,width:170,height:38}),
  mkF('radio',{name:'urgency',label:'ระดับความเร่งด่วน',options:['ปกติ','เร่งด่วน','เร่งด่วนที่สุด'],required:true,pos_x:20,pos_y:138,width:170,height:9,border_style:'none'}),
  mkF('checkbox_agree',{name:'agree',label:'รับรอง',value:'ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ',required:true,pos_x:20,pos_y:152,width:170,height:9,border_style:'none',font_size:12.5}),
  mkF('signature',{name:'sig_req',label:'ผู้ยื่นคำขอ',required:true,pos_x:118,pos_y:172,width:72,height:20,border_style:'none'}),
  mkF('signature',{name:'sig_head',label:'หัวหน้าหน่วยงาน',pos_x:118,pos_y:198,width:72,height:20,border_style:'none'}),
  mkF('label',{name:'foot',label:'ท้ายเอกสาร',value:'เอกสารฉบับนี้สร้างจากระบบแบบฟอร์มอิเล็กทรอนิกส์ โรงพยาบาลดอนตูม',pos_x:20,pos_y:272,width:170,height:6,font_size:10,text_align:'center',border_style:'none',text_color:'#666666'})
 ];
}
const TPLS=[
 ['แบบฟอร์มขอใช้ระบบ HOSxP','คำขอเปิดบัญชีผู้ใช้ระบบสารสนเทศโรงพยาบาล','งานเทคโนโลยีสารสนเทศ',true],
 ['บันทึกข้อความ','บันทึกข้อความราชการภายในหน่วยงาน','งานสารบรรณ',true],
 ['แบบขออนุมัติจัดซื้อจัดจ้าง','ขออนุมัติดำเนินการจัดซื้อจัดจ้างตามระเบียบพัสดุ','งานพัสดุ',true],
 ['ใบขอเบิกวัสดุสำนักงาน','เบิกวัสดุสำนักงานและวัสดุสิ้นเปลือง','งานพัสดุ',true],
 ['แบบฟอร์มลาป่วย / ลากิจ','ขออนุมัติลาป่วย ลากิจ หรือลาพักผ่อน','งานทรัพยากรบุคคล',true],
 ['แบบแจ้งซ่อมครุภัณฑ์การแพทย์','แจ้งซ่อมบำรุงครุภัณฑ์การแพทย์และอุปกรณ์','งานช่างเทคนิค',false],
 ['แบบประเมินความพึงพอใจผู้รับบริการ','ประเมินความพึงพอใจผู้รับบริการรายไตรมาส','งานพัฒนาคุณภาพ',true],
 ['หนังสือขอใช้รถยนต์ราชการ','ขอใช้รถยนต์ราชการเพื่อปฏิบัติราชการนอกสถานที่','งานยานพาหนะ',false]
];
function seed(){
 const now=Date.now(),D=864e5;
 const templates=TPLS.map((t,i)=>({id:'tpl_'+(i+1),name:t[0],description:t[1],department:t[2],is_active:t[3],
   created_at:new Date(now-(40-i*3)*D).toISOString(),updated_at:new Date(now-(i*2+1)*D).toISOString(),
   fields:baseFields(t[0])}));
 const subs=[];
 for(let i=0;i<28;i++){
  const t=templates[i%templates.length], n=NAMES[i%NAMES.length];
  const st=i%7===0?'REJECTED':(i%3===0?'APPROVED':'SUBMITTED');
  const created=now-Math.floor(Math.random()*26)*D-Math.floor(Math.random()*20)*36e5;
  const data={};t.fields.forEach(f=>{if(!INP.includes(f.field_type))return;
   if(f.name==='full_name')data[f.name]=n[0]+n[1]+' '+n[2];
   else if(f.name==='position')data[f.name]=POS[i%POS.length];
   else if(f.name==='department')data[f.name]=DEPTS[i%DEPTS.length];
   else if(f.field_type==='date')data[f.name]=new Date(created).toISOString().slice(0,10);
   else if(f.name==='phone')data[f.name]='08'+String(10000000+i*137).slice(0,8);
   else if(f.field_type==='radio'||f.field_type==='select')data[f.name]=f.options[i%f.options.length];
   else if(f.field_type==='checkbox')data[f.name]=f.options.slice(0,1+i%2).join(', ');
   else if(f.field_type==='checkbox_agree')data[f.name]='ยอมรับ';
   else if(f.field_type==='signature')data[f.name]=n[1]+' '+n[2];
   else data[f.name]='ขอความอนุเคราะห์ดำเนินการตามรายละเอียดที่แนบมาพร้อมนี้ เพื่อสนับสนุนการปฏิบัติงานของหน่วยงานให้เกิดความต่อเนื่องและมีประสิทธิภาพ';
  });
  subs.push({id:'sub_'+(1000+i),template_id:t.id,template_name:t.name,submitted_by_name:n[0]+n[1]+' '+n[2],
   department:DEPTS[i%DEPTS.length],status:st,created_at:new Date(created).toISOString(),
   archived_at:i%11===0?new Date(created+3*D).toISOString():null,
   reviewed_at:st!=='SUBMITTED'?new Date(created+2*D).toISOString():null,
   reviewed_by:st!=='SUBMITTED'?'ผู้ดูแลระบบ':null,data});
 }
 const staff=NAMES.map((n,i)=>({id:'stf_'+(i+1),prefix:n[0],first_name:n[1],last_name:n[2],
  full_name:n[0]+n[1]+' '+n[2],position:POS[i%POS.length],department:DEPTS[i%DEPTS.length],
  employment_type:['ข้าราชการ','พนักงานราชการ','ลูกจ้างชั่วคราว'][i%3],is_active:i%9!==0,
  email:'user'+(i+1)+'@dontum.go.th',phone:'08'+String(20000000+i*211).slice(0,8)}));
 return {templates,submissions:subs,staff,logo:null,favorites:['tpl_1'],savedViews:[],activity:[],prefs:{theme:'light',density:'cozy',rail:'expanded'}};
}

/* ---------- state ---------- */
let DB;
try{DB=JSON.parse(localStorage.getItem(KEY))||seed()}catch(e){DB=seed()}
if(!DB.templates)DB=seed();
const persist=debounce(()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}},250);
const S={
 sec:'forms', live:false,
 forms:{q:'',status:'all',dept:'all',sort:'updated',view:'grid',fav:false},
 inbox:{tpl:'all',status:'ALL',q:'',sort:'newest',sel:new Set()},
 mine:{q:'',status:'all'},
 staff:{q:'',dept:'all',active:'all',sort:'name',sel:new Set()},
 pub:{tpl:null,fields:[],data:{}},
 b:{id:null,fields:[],sel:null,zoom:.72,grid:true,snap:true,dirty:false,undo:[],redo:[],saving:false},
 palette:{q:'',idx:0,items:[]}
};
const ref=id=>String(id).replace(/\D/g,'').slice(-6).padStart(6,'0');
const tpl=id=>DB.templates.find(t=>t.id===id);
const sub=id=>DB.submissions.find(s=>s.id===id);
const stf=id=>DB.staff.find(s=>s.id===id);
const ago=iso=>{const d=(Date.now()-new Date(iso))/1000;
 if(d<60)return'เมื่อครู่';if(d<3600)return Math.floor(d/60)+' นาทีที่แล้ว';
 if(d<86400)return Math.floor(d/3600)+' ชม.ที่แล้ว';if(d<2592000)return Math.floor(d/86400)+' วันที่แล้ว';
 return new Date(iso).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})};
const fdate=iso=>new Date(iso).toLocaleString('th-TH',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'});
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const avStyle=n=>`background:linear-gradient(145deg,hsl(${hue(n)} 62% 46%),hsl(${(hue(n)+42)%360} 68% 38%))`;

/* ---------- toast ---------- */
function toast(msg,opt={}){
 const t=document.createElement('div');
 t.className='toast '+(opt.type||'info');
 const icons={ok:'check',bad:'x',warn:'warn',info:'info'};
 t.innerHTML=`<span class="ti">${ic(icons[opt.type||'info'],15)}</span><b>${esc(msg)}</b>`+
  (opt.undo?`<button class="undo">เลิกทำ</button>`:'')+`<button class="tx">${ic('x',13)}</button><i class="life"></i>`;
 $('#toasts').appendChild(t);
 const life=opt.ms||(opt.undo?7000:3600);
 const bar=$('.life',t);bar.style.transition=`width ${life}ms linear`;requestAnimationFrame(()=>bar.style.width='0%');bar.style.width='100%';
 let done=false;const kill=()=>{if(done)return;done=true;t.classList.add('out');setTimeout(()=>t.remove(),220)};
 const timer=setTimeout(kill,life);
 $('.tx',t).onclick=()=>{clearTimeout(timer);kill()};
 if(opt.undo)$('.undo',t).onclick=()=>{clearTimeout(timer);kill();opt.undo()};
 return t;
}
function logAct(text,kind='info'){DB.activity.unshift({id:uid('a_'),text,kind,at:new Date().toISOString(),read:false});DB.activity=DB.activity.slice(0,40);persist();paintBell()}

/* ---------- api ---------- */
async function api(action,payload={}){
 const u=new URL(API_URL);u.searchParams.set('action',action);
 const r=await fetch(u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow'});
 if(!r.ok)throw new Error('HTTP '+r.status);
 const j=await r.json();if(!j.ok)throw new Error(j.error||'API error');return j.data;
}
function remote(action,payload){ if(!S.live)return; api(action,payload).catch(e=>toast('ซิงก์ไม่สำเร็จ: '+e.message,{type:'warn'})); }

/* ---------- prefs ---------- */
function applyPrefs(){
 document.documentElement.dataset.theme=DB.prefs.theme;
 document.documentElement.dataset.density=DB.prefs.density;
 document.body.classList.toggle('rail-mini',DB.prefs.rail==='mini');
 $('#themeBtn').innerHTML=ic(DB.prefs.theme==='dark'?'sun':'moon');
 $('#densityBtn').innerHTML=ic(DB.prefs.density==='compact'?'rows':'grid');
 $('#modeChip').textContent=S.live?'● LIVE API':'● ข้อมูลตัวอย่าง';
 $('#modeChip').classList.toggle('live',S.live);
 const l=DB.logo;
 $('#brandMark').innerHTML=l?`<img src="${l}" alt="ตรา">`:'ด';
}
function paintBell(){
 const un=DB.activity.filter(a=>!a.read).length;
 $('#bellDot').hidden=un===0;
}
function paintCounts(){
 const pend=DB.submissions.filter(s=>s.status==='SUBMITTED'&&!s.archived_at).length;
 const map={forms:DB.templates.length,builder:DB.templates.filter(t=>t.is_active).length,inbox:pend,
  mine:DB.submissions.filter(s=>s.submitted_by_name==='ผู้ดูแลระบบ').length,staff:DB.staff.filter(s=>s.is_active).length};
 $$('[data-cnt]').forEach(e=>{const v=map[e.dataset.cnt];e.textContent=v??'';e.hidden=v===undefined||v===0});
 const m=DB.submissions.filter(s=>Date.now()-new Date(s.created_at)<30*864e5).length;
 $('#quotaNum').textContent=m;
 $('#quotaBar').style.width=clamp(m/60*100,4,100)+'%';
 $('#quotaHint').textContent=`เป้าหมาย 60 ฉบับ · ${Math.round(m/60*100)}%`;
}

/* ---------- A4 render ---------- */
function norm(f){const n=(v,d)=>{const x=Number(v);return isFinite(x)?x:d};
 let o=f.options;if(typeof o==='string'){try{o=JSON.parse(o)}catch(e){o=o.split(',').map(s=>s.trim()).filter(Boolean)}}
 return Object.assign({},f,{options:Array.isArray(o)?o.map(String):[],pos_x:n(f.pos_x,15),pos_y:n(f.pos_y,20),width:n(f.width,70),height:n(f.height,8),font_size:n(f.font_size,14)});}
function fieldEl(f,mode,data,pfx){
 const el=document.createElement('div');
 el.className='cf ft-'+f.field_type+(mode==='fill'&&f.required?' req':'');
 el.dataset.fid=f.id;
 const s=el.style;
 s.left=f.pos_x+'mm';s.top=f.pos_y+'mm';s.width=f.width+'mm';s.height=f.height+'mm';
 s.fontSize=f.font_size+'px';s.fontFamily=`${f.font_family},'Noto Sans Thai',sans-serif`;
 s.fontWeight=f.font_weight;s.color=f.text_color;s.background=f.bg_color;s.textAlign=f.text_align;
 s.border=(f.border_style&&f.border_style!=='none'&&f.field_type!=='divider'&&f.field_type!=='logo')?`1px ${f.border_style} ${f.border_color}`:'none';
 el.appendChild(content(f,mode,data||{},pfx||''));
 return el;
}
function mk(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
function content(f,mode,data,pfx){
 const fc=mk('div','fc'),t=f.field_type,v=mode==='print'?String(data[f.name]??''):'';
 if(t==='logo'){fc.classList.add('cy');if(f.value&&/^data:image\//.test(f.value)){const i=document.createElement('img');i.src=f.value;i.className='lgi';fc.appendChild(i)}else if(mode==='design')fc.appendChild(mk('span','ph','โลโก้'));return fc}
 if(t==='label'||t==='title'){const x=f.value||f.label||'';if(x)fc.textContent=x;else if(mode==='design')fc.appendChild(mk('span','ph','ข้อความ'));return fc}
 if(t==='divider'){fc.classList.add('cy');const d=mk('div','dv');d.style.borderTopColor=f.border_color;fc.appendChild(d);return fc}
 if(t==='text_input'||t==='date'||t==='select'){
  fc.classList.add('cy');
  if(mode==='fill'){let c;
   if(t==='select'){c=document.createElement('select');c.appendChild(new Option('-- เลือก --',''));f.options.forEach(o=>c.appendChild(new Option(o,o)))}
   else{c=document.createElement('input');c.type=t==='date'?'date':'text';c.placeholder=t==='date'?'':f.label}
   c.className='fci';fc.appendChild(c)}
  else if(mode==='print')fc.textContent=t==='date'&&v?new Date(v).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'}):v;
  else fc.appendChild(mk('span','ph',t==='date'?'__/__/____':(f.value||f.label||'ช่องกรอก')));
  return fc}
 if(t==='textarea'){
  if(mode==='fill'){const c=document.createElement('textarea');c.className='fci';c.placeholder=f.label;fc.appendChild(c)}
  else if(mode==='print')fc.textContent=v;else fc.appendChild(mk('span','ph',f.value||f.label||'ข้อความยาว'));
  return fc}
 if(t==='radio'||t==='checkbox'){
  fc.classList.add('cy');const g=mk('div','og'+(f.height>15?' col':''));
  const chosen=mode==='print'?String(data[f.name]||'').split(', '):[];
  (f.options.length?f.options:['ตัวเลือก 1','ตัวเลือก 2']).forEach(o=>{
   const l=mk('label','ol');
   if(mode==='fill'){const i=document.createElement('input');i.type=t;i.name=pfx+f.id;i.value=o;l.appendChild(i)}
   else{const b=mk('span','ob'+(t==='radio'?' rd':''));if(mode==='print'&&chosen.includes(o))b.textContent=t==='radio'?'●':'✓';l.appendChild(b)}
   l.appendChild(document.createTextNode(o));g.appendChild(l)});
  fc.appendChild(g);return fc}
 if(t==='signature'){
  const sg=mk('div','sg'),ln=mk('div','sg-l');
  if(mode==='fill'){const c=document.createElement('input');c.type='text';c.className='fci';c.placeholder='พิมพ์ชื่อเพื่อลงนาม';ln.appendChild(c)}
  else if(mode==='print')ln.textContent=v;
  sg.appendChild(ln);sg.appendChild(mk('div','sg-c',f.label?'('+f.label+')':''));fc.appendChild(sg);return fc}
 if(t==='checkbox_agree'){
  const r=mk('div','ag');
  if(mode==='fill'){const c=document.createElement('input');c.type='checkbox';r.appendChild(c)}
  else r.appendChild(mk('span','ob',mode==='print'&&v?'✓':''));
  r.appendChild(mk('span','',f.value||f.label||''));fc.appendChild(r);return fc}
 return fc;
}
function paintCanvas(sel,fields,mode,data){
 const c=$(sel);if(!c)return null;c.innerHTML='';
 const pfx='r'+Math.random().toString(36).slice(2,7)+'_';
 fields.map(norm).forEach(f=>c.appendChild(fieldEl(f,mode,data,pfx)));
 return c;
}
function zoomTo(c,z){const b=c.parentElement;b.style.width=PW*MM*z+'px';b.style.height=PH*MM*z+'px';c.style.transform=z===1?'':`scale(${z})`}
function fitOf(w){return clamp((w.clientWidth-46)/(PW*MM),.25,1.4)}
function collect(c,fields){
 const data={},miss=[];
 fields.forEach(f=>{if(!INP.includes(f.field_type))return;
  const el=c.querySelector(`[data-fid="${f.id}"]`);if(!el)return;let v='';
  if(f.field_type==='radio'||f.field_type==='checkbox')v=[...el.querySelectorAll('input:checked')].map(i=>i.value).join(', ');
  else if(f.field_type==='checkbox_agree'){const b=el.querySelector('input');v=b&&b.checked?'ยอมรับ':''}
  else{const i=el.querySelector('input,textarea,select');v=i?i.value:''}
  data[f.name]=v;el.classList.remove('err');
  if(f.required&&!String(v).trim()){miss.push(f);el.classList.add('err')}});
 return {data,miss};
}
const EXPORT_CSS=`
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Noto Sans Thai',sans-serif;color:#111}
.wrap{margin:0 auto;position:relative}
.a4{width:210mm;height:297mm;background:#fff;position:relative;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 12px 34px rgba(4,25,30,.2)}
.cf{position:absolute;box-sizing:border-box;overflow:hidden;padding:1mm;line-height:1.35}
.fc{width:100%;height:100%;white-space:pre-wrap;overflow-wrap:anywhere}.fc.cy{display:grid;align-items:center}
.og{display:flex;flex-wrap:wrap;gap:1mm 4mm;align-items:center}.og.col{flex-direction:column;align-items:flex-start}
.ol{display:inline-flex;align-items:center;gap:1.2mm;font:inherit}
.ob{display:inline-flex;align-items:center;justify-content:center;width:3.4mm;height:3.4mm;border:1px solid #222;font-size:10px;line-height:1;background:#fff;flex:none}.ob.rd{border-radius:50%}
.sg{height:100%;display:flex;flex-direction:column;justify-content:flex-end}
.sg-l{border-bottom:1px dotted #333;min-height:58%;display:flex;align-items:flex-end;justify-content:center}
.sg-c{text-align:center;font-size:.85em;color:#555}.ag{display:flex;align-items:center;gap:2mm;height:100%}
.dv{border-top:1px solid #333;width:100%}.lgi{max-width:100%;max-height:100%;object-fit:contain;display:block}
.ft-logo .fc{display:flex;align-items:center;justify-content:center}
.bar{position:fixed;top:14px;right:14px;display:flex;gap:8px;z-index:99}
.bar button{border:0;border-radius:8px;padding:10px 17px;font:600 13px 'Noto Sans Thai',sans-serif;background:#0B4F55;color:#fff;cursor:pointer;box-shadow:0 6px 16px rgba(4,25,30,.3)}
.bar button:hover{background:#0E7C86}
@media screen{html,body{background:linear-gradient(135deg,#F4F1EC,#DCE7E9);min-height:100vh}body{padding:30px 0 54px}
.a4{transform:scale(var(--fit,1));transform-origin:0 0}}
@media print{html,body{width:210mm;height:297mm;background:#fff;overflow:hidden;padding:0}
.wrap{width:210mm;height:297mm}.a4{border:0;box-shadow:none;transform:none}
.bar{display:none}}`;
function sheetHTML(fields,data,title,autoPrint){
 const h=document.createElement('div');h.className='a4';
 fields.map(norm).forEach(f=>h.appendChild(fieldEl(f,'print',data)));
 return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap">
<style>${EXPORT_CSS}</style></head><body>
<div class="bar"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
<div class="wrap" id="w">${h.outerHTML}</div>
<script>(function(){var w=document.getElementById('w'),c=w.firstElementChild,W=210*96/25.4,H=297*96/25.4;
function f(){var s=Math.max(.2,Math.min(1,(document.documentElement.clientWidth-26)/W));w.style.width=W*s+'px';w.style.height=H*s+'px';c.style.setProperty('--fit',s)}
f();addEventListener('resize',f);${autoPrint?'addEventListener("load",function(){setTimeout(function(){window.print()},650)})':''}})();<\/script></body></html>`;
}
function download(content,name,mime){
 const b=new Blob([content],{type:mime||'text/html;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},900);
}
const fname=s=>String(s||'form').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').slice(0,70);
function printSheet(fields,data,title){
 const w=window.open('','_blank');
 if(!w){toast('เบราว์เซอร์บล็อกป๊อปอัป — กรุณาอนุญาตแล้วลองใหม่',{type:'warn'});return}
 w.document.write(sheetHTML(fields,data,title,true));w.document.close();
}
function csv(rows,name){
 const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
 download('\uFEFF'+rows.map(r=>r.map(q).join(',')).join('\r\n'),name,'text/csv;charset=utf-8');
 toast('ส่งออก '+name+' แล้ว',{type:'ok'});
}

/* ---------- modal ---------- */
function modal(title,body,foot){
 $('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modalFoot').innerHTML=foot||'';
 $('#modalScrim').hidden=false;
}
function closeModal(){$('#modalScrim').hidden=true}
$$('[data-close-modal]').forEach(b=>b.onclick=()=>{closeModal();$('#helpScrim').hidden=true});
$('#modalScrim').onclick=e=>{if(e.target.id==='modalScrim')closeModal()};
$('#helpScrim').onclick=e=>{if(e.target.id==='helpScrim')$('#helpScrim').hidden=true};

/* ---------- drawer ---------- */
let drawerCtx=null;
function openDrawer(kicker,title,body,foot,ctx){
 drawerCtx=ctx||null;
 $('#drawerKicker').textContent=kicker;$('#drawerTitle').textContent=title;
 $('#drawerBody').innerHTML=body;$('#drawerFoot').innerHTML=foot||'';
 $('#drawer').hidden=false;$('#drawerScrim').hidden=false;
}
function closeDrawer(){$('#drawer').hidden=true;$('#drawerScrim').hidden=true;drawerCtx=null}
$('#drawerClose').onclick=closeDrawer;$('#drawerScrim').onclick=closeDrawer;

/* ---------- router ---------- */
const SECS={forms:['คลังแบบฟอร์ม','จัดการแม่แบบทั้งหมดของโรงพยาบาล','forms'],
 builder:['ออกแบบฟอร์ม','วางฟิลด์บนกระดาษ A4 แล้วเผยแพร่ให้ผู้ใช้กรอก','builder'],
 inbox:['กล่องคำขอ','ตรวจพิจารณา อนุมัติ และจัดเก็บคำขอถาวร','inbox'],
 mine:['คำขอของฉัน','คำขอที่ส่งในนามบัญชีผู้ดูแลระบบ','mine'],
 staff:['บุคลากร','ทะเบียนผู้ใช้งานและสิทธิ์การเข้าถึง','users'],
 brand:['ตราสัญลักษณ์','โลโก้ที่แสดงบนหัวเว็บและเอกสาร','image'],
 public:['หน้ากรอกฟอร์ม','มุมมองที่ผู้ใช้ทั่วไปเห็น — ทดสอบกรอกจริงได้','globe']};
function go(sec){
 if(!SECS[sec])return;
 if(S.sec==='builder'&&S.b.dirty&&sec!=='builder'){
  if(!confirm('มีการแก้ไขแบบฟอร์มที่ยังไม่บันทึก ต้องการออกหรือไม่?'))return;
 }
 S.sec=sec;
 $$('.rail-item').forEach(b=>b.classList.toggle('on',b.dataset.go===sec));
 $('#crumbs').innerHTML=`<span>แผงจัดการ</span>${ic('chev',12)}<b>${esc(SECS[sec][0])}</b>`;
 $('#main').scrollTop=0;
 render();
}
$$('.rail-item').forEach(b=>b.onclick=()=>go(b.dataset.go));
function render(){
 const v=$('#view');
 ({forms:vForms,builder:vBuilder,inbox:vInbox,mine:vMine,staff:vStaff,brand:vBrand,public:vPublic}[S.sec])(v);
 paintCounts();
}
const head=(k,acts)=>`<div class="sec-head"><div class="sec-title"><h1>${esc(SECS[k][0])}</h1><p>${esc(SECS[k][1])}</p></div><div class="sec-actions">${acts||''}</div></div>`;
const emptyBox=(iconName,title,desc,btn)=>`<div class="empty"><div class="em-ico">${ic(iconName,26)}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p>${btn||''}</div>`;

/* ============ FORMS ============ */
function vForms(v){
 const f=S.forms;
 let list=DB.templates.filter(t=>{
  if(f.fav&&!DB.favorites.includes(t.id))return false;
  if(f.status==='active'&&!t.is_active)return false;
  if(f.status==='draft'&&t.is_active)return false;
  if(f.dept!=='all'&&t.department!==f.dept)return false;
  if(f.q){const q=f.q.toLowerCase();if(!(t.name+t.description+t.department).toLowerCase().includes(q))return false}
  return true});
 list.sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name,'th'):f.sort==='count'?
  DB.submissions.filter(s=>s.template_id===b.id).length-DB.submissions.filter(s=>s.template_id===a.id).length:
  new Date(b.updated_at)-new Date(a.updated_at));
 v.innerHTML=head('forms',
  `<button class="btn" data-a="csv">${ic('csv')}ส่งออก CSV</button>
   <button class="btn pri" data-a="new">${ic('plus')}สร้างฟอร์มใหม่</button>`)+
 `<div class="toolbar">
   <div class="search">${ic('search')}<input id="fq" value="${esc(f.q)}" placeholder="ค้นหาชื่อฟอร์ม / หน่วยงาน…"><kbd>/</kbd></div>
   <select class="sel" id="fstatus"><option value="all">ทุกสถานะ</option><option value="active"${f.status==='active'?' selected':''}>เปิดใช้งาน</option><option value="draft"${f.status==='draft'?' selected':''}>ฉบับร่าง</option></select>
   <select class="sel" id="fdept"><option value="all">ทุกหน่วยงาน</option>${DEPTS.map(d=>`<option${f.dept===d?' selected':''}>${esc(d)}</option>`).join('')}</select>
   <select class="sel" id="fsort"><option value="updated">ล่าสุดที่แก้ไข</option><option value="name"${f.sort==='name'?' selected':''}>ชื่อ ก–ฮ</option><option value="count"${f.sort==='count'?' selected':''}>คำขอมากสุด</option></select>
   <button class="chip${f.fav?' on':''}" data-a="fav">${ic('star',13)}รายการโปรด <b>${DB.favorites.length}</b></button>
   <div class="seg"><button data-a="grid" class="${f.view==='grid'?'on':''}">${ic('grid',14)}</button><button data-a="list" class="${f.view==='list'?'on':''}">${ic('rows',14)}</button></div>
 </div>
 <div id="flist">${list.length?(f.view==='grid'?formCards(list):formTable(list)):emptyBox('forms','ไม่พบแบบฟอร์ม','ลองเปลี่ยนคำค้นหรือตัวกรอง แล้วเริ่มสร้างฟอร์มใหม่ได้เลย','<button class="btn pri" data-a="new">'+ic('plus')+'สร้างฟอร์มใหม่</button>')}</div>`;
 $('#fq').oninput=debounce(e=>{f.q=e.target.value;render();$('#fq').focus()},220);
 $('#fstatus').onchange=e=>{f.status=e.target.value;render()};
 $('#fdept').onchange=e=>{f.dept=e.target.value;render()};
 $('#fsort').onchange=e=>{f.sort=e.target.value;render()};
 v.onclick=e=>{
  const a=e.target.closest('[data-a]'),row=e.target.closest('[data-id]');
  if(a){const k=a.dataset.a,id=a.dataset.id||row?.dataset.id;
   if(k==='new')return newForm();
   if(k==='csv')return csv([['ชื่อฟอร์ม','หน่วยงาน','สถานะ','ฟิลด์','คำขอ','แก้ไขล่าสุด'],...list.map(t=>[t.name,t.department,t.is_active?'เปิดใช้งาน':'ฉบับร่าง',t.fields.length,DB.submissions.filter(s=>s.template_id===t.id).length,fdate(t.updated_at)])],'dontum-forms.csv');
   if(k==='fav'){f.fav=!f.fav;return render()}
   if(k==='grid'||k==='list'){f.view=k;return render()}
   if(k==='star'){const i=DB.favorites.indexOf(id);i<0?DB.favorites.push(id):DB.favorites.splice(i,1);persist();return render()}
   if(k==='edit'){S.b.id=null;return openBuilder(id)}
   if(k==='fill'){S.pub.tpl=id;return go('public')}
   if(k==='dup')return dupForm(id);
   if(k==='dl')return dlForm(id);
   if(k==='pub')return togglePub(id);
   if(k==='del')return delForm(id);
   if(k==='info')return formDrawer(id);
  }
  if(row&&!e.target.closest('button'))formDrawer(row.dataset.id);
 };
 if(f.view==='grid')requestAnimationFrame(()=>$$('.thumb').forEach(t=>{
  const c=$('.thumb-c',t),t0=tpl(t.dataset.t);if(!c||!t0)return;
  t0.fields.map(norm).forEach(x=>c.appendChild(fieldEl(x,'print',{})));
  c.style.transform=`scale(${t.clientWidth/(PW*MM)})`;
 }));
}
function formCards(list){
 return `<div class="grid">${list.map((t,i)=>{
  const n=DB.submissions.filter(s=>s.template_id===t.id).length;
  return `<article class="card" data-id="${t.id}" style="animation-delay:${Math.min(i*35,320)}ms">
   <div class="card-top"><h3>${esc(t.name)}</h3><button class="star${DB.favorites.includes(t.id)?' on':''}" data-a="star" data-id="${t.id}" title="รายการโปรด">${ic('star',15)}</button></div>
   <p>${esc(t.description)}</p>
   <div class="thumb" data-t="${t.id}"><span class="thumb-tag">A4</span><div class="thumb-c"></div></div>
   <div class="card-meta"><span>${t.fields.length} ฟิลด์</span><span>${n} คำขอ</span><span>${ago(t.updated_at)}</span></div>
   <span class="pill ${t.is_active?'on':'off'}">${t.is_active?'เปิดใช้งาน':'ฉบับร่าง'}</span>
   <div class="card-acts">
     <button class="btn sm pri" data-a="fill" data-id="${t.id}">${ic('edit',13)}กรอก</button>
     <button class="btn sm" data-a="edit" data-id="${t.id}">${ic('builder',13)}ออกแบบ</button>
     <button class="btn sm icon" data-a="dup" data-id="${t.id}" title="คัดลอกฟอร์ม">${ic('copy',13)}</button>
     <button class="btn sm icon" data-a="dl" data-id="${t.id}" title="ดาวน์โหลด A4">${ic('dl',13)}</button>
     <button class="btn sm icon" data-a="del" data-id="${t.id}" title="ลบ">${ic('trash',13)}</button>
   </div></article>`}).join('')}</div>`;
}
function formTable(list){
 return `<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr>
  <th style="width:34px"></th><th>ชื่อฟอร์ม</th><th>หน่วยงาน</th><th class="num">ฟิลด์</th><th class="num">คำขอ</th><th>สถานะ</th><th>แก้ไขล่าสุด</th><th></th>
 </tr></thead><tbody>${list.map(t=>{
  const n=DB.submissions.filter(s=>s.template_id===t.id).length;
  return `<tr data-id="${t.id}">
   <td><button class="star${DB.favorites.includes(t.id)?' on':''}" data-a="star" data-id="${t.id}">${ic('star',14)}</button></td>
   <td><b>${esc(t.name)}</b><br><small style="color:var(--text3)">${esc(t.description)}</small></td>
   <td>${esc(t.department)}</td><td class="num">${t.fields.length}</td><td class="num">${n}</td>
   <td><span class="pill ${t.is_active?'on':'off'}">${t.is_active?'เปิดใช้งาน':'ฉบับร่าง'}</span></td>
   <td class="num">${ago(t.updated_at)}</td>
   <td class="acts">
    <button class="btn sm" data-a="fill" data-id="${t.id}">กรอก</button>
    <button class="btn sm" data-a="edit" data-id="${t.id}">ออกแบบ</button>
    <button class="btn sm icon" data-a="dup" data-id="${t.id}" title="คัดลอก">${ic('copy',13)}</button>
    <button class="btn sm icon" data-a="dl" data-id="${t.id}" title="ดาวน์โหลด">${ic('dl',13)}</button>
    <button class="btn sm icon" data-a="pub" data-id="${t.id}" title="เปิด/ปิดใช้งาน">${ic(t.is_active?'lock':'check',13)}</button>
    <button class="btn sm icon" data-a="del" data-id="${t.id}" title="ลบ">${ic('trash',13)}</button>
   </td></tr>`}).join('')}</tbody></table></div></div>`;
}
function newForm(){
 modal('สร้างฟอร์มใหม่',
  `<div class="fld"><label>ชื่อฟอร์ม *</label><input id="nfName" placeholder="เช่น แบบฟอร์มขอใช้ห้องประชุม" maxlength="120"></div>
   <div class="fld"><label>คำอธิบาย</label><textarea id="nfDesc" placeholder="อธิบายวัตถุประสงค์ของแบบฟอร์มนี้"></textarea></div>
   <div class="fld"><label>หน่วยงานเจ้าของ</label><select id="nfDept">${DEPTS.map(d=>`<option>${esc(d)}</option>`).join('')}</select></div>
   <div class="fld"><label>เริ่มจาก</label><select id="nfBase"><option value="blank">กระดาษเปล่า</option><option value="std">โครงร่างมาตรฐาน (หัวเรื่อง / ผู้ยื่น / รายละเอียด / ลายเซ็น)</option>${DB.templates.map(t=>`<option value="${t.id}">คัดลอกจาก: ${esc(t.name)}</option>`).join('')}</select></div>`,
  `<button class="btn" data-close-modal>ยกเลิก</button><button class="btn pri" id="nfGo">${ic('plus')}สร้างและออกแบบ</button>`);
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#nfName').focus();
 $('#nfGo').onclick=()=>{
  const name=$('#nfName').value.trim();if(!name){toast('กรุณากรอกชื่อฟอร์ม',{type:'warn'});return}
  const base=$('#nfBase').value;
  let fields=[];
  if(base==='std')fields=baseFields(name);
  else if(base!=='blank'){const s=tpl(base);if(s)fields=JSON.parse(JSON.stringify(s.fields)).map(f=>(f.id=uid('f_'),f))}
  const t={id:uid('tpl_'),name,description:$('#nfDesc').value.trim(),department:$('#nfDept').value,
   is_active:false,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),fields};
  DB.templates.unshift(t);persist();closeModal();logAct('สร้างฟอร์ม “'+name+'”','ok');
  toast('สร้างฟอร์มแล้ว — เริ่มออกแบบได้เลย',{type:'ok'});
  remote('createFormTemplate',{data:{name,description:t.description}});
  openBuilder(t.id);
 };
}
function dupForm(id){
 const s=tpl(id);if(!s)return;
 const t=JSON.parse(JSON.stringify(s));
 t.id=uid('tpl_');t.name=s.name+' (สำเนา)';t.is_active=false;
 t.created_at=t.updated_at=new Date().toISOString();
 t.fields=t.fields.map(f=>(f.id=uid('f_'),f));
 DB.templates.unshift(t);persist();render();
 logAct('คัดลอกฟอร์ม “'+s.name+'”','ok');
 remote('duplicateFormTemplate',{id,newName:t.name});
 toast('คัดลอก “'+t.name+'” พร้อม '+t.fields.length+' ฟิลด์',{type:'ok',undo:()=>{DB.templates=DB.templates.filter(x=>x.id!==t.id);persist();render();toast('ยกเลิกการคัดลอกแล้ว')}});
}
function delForm(id){
 const i=DB.templates.findIndex(t=>t.id===id);if(i<0)return;
 const t=DB.templates[i],n=DB.submissions.filter(s=>s.template_id===id).length;
 DB.templates.splice(i,1);persist();render();logAct('ลบฟอร์ม “'+t.name+'”','bad');
 toast('ลบ “'+t.name+'” แล้ว'+(n?' (คำขอ '+n+' รายการยังอยู่)':''),{type:'bad',undo:()=>{DB.templates.splice(i,0,t);persist();render();toast('กู้คืนฟอร์มแล้ว',{type:'ok'})}});
}
function togglePub(id){
 const t=tpl(id);if(!t)return;t.is_active=!t.is_active;t.updated_at=new Date().toISOString();persist();render();
 remote('publishFormTemplate',{id});
 toast(t.is_active?'เผยแพร่ “'+t.name+'” ให้ผู้ใช้กรอกแล้ว':'ปิดรับคำขอ “'+t.name+'”',{type:t.is_active?'ok':'warn'});
}
function dlForm(id){
 const t=tpl(id);if(!t)return;
 modal('ดาวน์โหลดแบบฟอร์ม',
  `<p style="font-size:13px;color:var(--text2);margin-bottom:14px">แบบฟอร์มเปล่าขนาด A4 (210 × 297 มม.) พร้อมพิมพ์หรือส่งต่อให้ผู้อื่นกรอกด้วยมือ</p>
   <div class="fld"><label>ชื่อไฟล์</label><input id="dlName" value="${esc(fname(t.name))}_blank"></div>`,
  `<button class="btn" data-close-modal>ยกเลิก</button>
   <button class="btn" id="dlPdf">${ic('print')}บันทึกเป็น PDF</button>
   <button class="btn pri" id="dlHtml">${ic('dl')}ดาวน์โหลด HTML</button>`);
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#dlHtml').onclick=()=>{download(sheetHTML(t.fields,{},t.name,false),($('#dlName').value||'form')+'.html');closeModal();toast('ดาวน์โหลดไฟล์แล้ว',{type:'ok'})};
 $('#dlPdf').onclick=()=>{printSheet(t.fields,{},t.name);closeModal()};
}
function formDrawer(id){
 const t=tpl(id);if(!t)return;
 const subs=DB.submissions.filter(s=>s.template_id===id);
 const body=`<dl class="kv">
  <dt>หน่วยงาน</dt><dd>${esc(t.department)}</dd>
  <dt>สถานะ</dt><dd><span class="pill ${t.is_active?'on':'off'}">${t.is_active?'เปิดรับคำขอ':'ฉบับร่าง'}</span></dd>
  <dt>จำนวนฟิลด์</dt><dd>${t.fields.length} ฟิลด์ (${t.fields.filter(f=>f.required).length} จำเป็น)</dd>
  <dt>คำขอทั้งหมด</dt><dd>${subs.length} รายการ</dd>
  <dt>สร้างเมื่อ</dt><dd>${fdate(t.created_at)}</dd>
  <dt>แก้ไขล่าสุด</dt><dd>${fdate(t.updated_at)}</dd></dl>
  <div class="d-sec">ตัวอย่างเอกสาร A4</div><div class="mini-a4" id="dThumb" style="aspect-ratio:210/297"><div class="sc"></div></div>
  <div class="d-sec">รายการฟิลด์</div>
  ${t.fields.map(f=>`<div class="fval"><span>${esc(f.label||FTL[f.field_type])}</span><b>${esc(FTL[f.field_type])}${f.required?' · จำเป็น':''}</b></div>`).join('')}`;
 openDrawer('แบบฟอร์ม',t.name,body,
  `<button class="btn pri" data-d="fill">${ic('edit')}กรอกฟอร์ม</button>
   <button class="btn" data-d="edit">${ic('builder')}ออกแบบ</button>
   <button class="btn" data-d="dup">${ic('copy')}คัดลอก</button>
   <button class="btn" data-d="dl">${ic('dl')}ดาวน์โหลด</button>
   <button class="btn ${t.is_active?'':'ok'}" data-d="pub">${ic(t.is_active?'lock':'check')}${t.is_active?'ปิดรับ':'เผยแพร่'}</button>`,{kind:'form',id});
 requestAnimationFrame(()=>{const w=$('#dThumb');if(!w)return;const c=$('.sc',w);
  t.fields.map(norm).forEach(f=>c.appendChild(fieldEl(f,'print',{})));
  c.style.transform=`scale(${w.clientWidth/(PW*MM)})`});
 $('#drawerFoot').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;closeDrawer();
  ({fill:()=>{S.pub.tpl=id;go('public')},edit:()=>openBuilder(id),dup:()=>dupForm(id),dl:()=>dlForm(id),pub:()=>togglePub(id)})[b.dataset.d]()};
}

/* ============ BUILDER ============ */
function openBuilder(id){
 const t=tpl(id);if(!t)return;
 S.b={id,fields:JSON.parse(JSON.stringify(t.fields)).map(norm),sel:null,zoom:S.b.zoom||.72,grid:S.b.grid,snap:S.b.snap,dirty:false,undo:[],redo:[],saving:false};
 go('builder');
}
function vBuilder(v){
 if(!S.b.id){
  v.innerHTML=head('builder',`<button class="btn pri" data-a="new">${ic('plus')}สร้างฟอร์มใหม่</button>`)+
   `<div class="grid">${DB.templates.map((t,i)=>`<article class="card" data-open="${t.id}" style="animation-delay:${i*35}ms">
    <div class="card-top"><h3>${esc(t.name)}</h3><span class="pill ${t.is_active?'on':'off'}">${t.is_active?'ใช้งาน':'ร่าง'}</span></div>
    <p>${esc(t.description)}</p><div class="card-meta"><span>${t.fields.length} ฟิลด์</span><span>${ago(t.updated_at)}</span></div>
    <div class="card-acts"><button class="btn sm pri" data-open="${t.id}">${ic('builder',13)}เปิดออกแบบ</button>
    <button class="btn sm" data-a="dup" data-id="${t.id}">${ic('copy',13)}คัดลอก</button></div></article>`).join('')}</div>`;
  v.onclick=e=>{const o=e.target.closest('[data-open]'),a=e.target.closest('[data-a]');
   if(a?.dataset.a==='new')return newForm();
   if(a?.dataset.a==='dup')return dupForm(a.dataset.id);
   if(o)openBuilder(o.dataset.open)};
  return;
 }
 const t=tpl(S.b.id),b=S.b;
 v.innerHTML=`<div class="sec-head"><div class="sec-title"><h1>${esc(t.name)}</h1><p>ลากฟิลด์จากซ้ายมาวาง · ดับเบิลคลิกแก้ข้อความ · Ctrl+S บันทึก</p></div>
  <div class="sec-actions">
   <span class="save-state ${b.dirty?'dirty':'saved'}" id="saveState">${ic(b.dirty?'clock':'check',13)}${b.dirty?'ยังไม่บันทึก':'บันทึกแล้ว'}</span>
   <button class="btn" data-b="preview">${ic('eye')}ดูตัวอย่าง</button>
   <button class="btn" data-b="dl">${ic('dl')}ดาวน์โหลด</button>
   <button class="btn pri" data-b="save">${ic('save')}บันทึก</button>
  </div></div>
 <div class="bld">
  <div class="bld-col">
   <div class="panel" style="flex:none"><div class="panel-h">${ic('plus',14)}<b>เพิ่มฟิลด์</b></div>
    <div class="panel-b"><div class="tools">${FT.map(f=>`<div class="tool" draggable="true" data-ft="${f}" title="${FTL[f]}">${ic(FTI[f],16)}<span>${FTL[f]}</span></div>`).join('')}</div></div></div>
   <div class="panel" style="flex:1"><div class="panel-h">${ic('rows',14)}<b>ลำดับชั้น (${b.fields.length})</b></div>
    <div class="panel-b"><div class="layers" id="layers">${b.fields.map((f,i)=>layerRow(f,i)).join('')||'<p style="font-size:12px;color:var(--text3);padding:8px">ยังไม่มีฟิลด์ — ลากจากกล่องด้านบน</p>'}</div></div></div>
  </div>
  <div class="bld-mid">
   <div class="bld-bar">
    <input class="bld-name" id="bName" value="${esc(t.name)}">
    <label class="tgl"><input type="checkbox" id="bPub"${t.is_active?' checked':''}>เปิดรับคำขอ</label>
    <label class="tgl"><input type="checkbox" id="bGrid"${b.grid?' checked':''}>เส้นตาราง</label>
    <label class="tgl"><input type="checkbox" id="bSnap"${b.snap?' checked':''}>.snap 0.5 มม.</label>
    <span class="sp"></span>
    <button class="btn sm icon" data-b="undo" title="เลิกทำ (Ctrl+Z)"${b.undo.length?'':' disabled'}>${ic('undo',14)}</button>
    <button class="btn sm icon" data-b="redo" title="ทำซ้ำ (Ctrl+Shift+Z)"${b.redo.length?'':' disabled'}>${ic('redo',14)}</button>
    <button class="btn sm icon" data-b="zo">${ic('zoomout',14)}</button>
    <button class="btn sm" data-b="fit" id="zLbl">${Math.round(b.zoom*100)}%</button>
    <button class="btn sm icon" data-b="zi">${ic('zoomin',14)}</button>
    <button class="btn sm" data-b="close">${ic('x',14)}ปิด</button>
   </div>
   <div class="canvas-wrap" id="cwrap"><div class="zoom-box"><div class="a4${b.grid?' grid-on':''}" id="canvas"></div></div></div>
  </div>
  <div class="bld-col">
   <div class="panel" style="flex:1"><div class="panel-h">${ic('edit',14)}<b>คุณสมบัติฟิลด์</b></div>
    <div class="panel-b" id="props">${b.sel?propHTML(b.fields.find(f=>f.id===b.sel)):'<p style="font-size:12.5px;color:var(--text3);padding:6px">เลือกฟิลด์บนกระดาษหรือจากรายการลำดับชั้นเพื่อแก้ไขคุณสมบัติ</p>'}</div>
    ${b.sel?`<div class="pacts">
      <button class="btn sm" data-b="dupf">${ic('copy',13)}ทำสำเนา</button>
      <button class="btn sm bad" data-b="delf">${ic('trash',13)}ลบฟิลด์</button>
      <button class="btn sm" data-b="front">${ic('up',13)}ขึ้นหน้า</button>
      <button class="btn sm" data-b="back">${ic('down',13)}ลงหลัง</button></div>`:''}
   </div>
  </div>
 </div>`;
 paintCanvas('#canvas',b.fields,'design');
 $$('#canvas .cf').forEach(el=>{el.classList.add('bf');
  if(el.dataset.fid===b.sel)el.classList.add('on');
  const g=mk('div','grip-r');el.appendChild(g);
  el.addEventListener('pointerdown',dragStart);
  el.addEventListener('dblclick',inlineEdit);
  g.addEventListener('pointerdown',resizeStart);
 });
 zoomTo($('#canvas'),b.zoom);
 bindBuilder();
}
function layerRow(f,i){
 return `<div class="layer${S.b.sel===f.id?' on':''}" draggable="true" data-lid="${f.id}" data-i="${i}">
  <span class="grip">${ic('grip',13)}</span>${ic(FTI[f.field_type],13)}
  <span class="lt">${esc(f.label||FTL[f.field_type])}</span>
  <button class="lx" data-lx="${f.id}" title="ลบ">${ic('x',12)}</button></div>`;
}
function bindBuilder(){
 const b=S.b,v=$('#view');
 $('#bName').oninput=e=>{tpl(b.id).name=e.target.value;markDirty()};
 $('#bPub').onchange=e=>{tpl(b.id).is_active=e.target.checked;markDirty()};
 $('#bGrid').onchange=e=>{b.grid=e.target.checked;$('#canvas').classList.toggle('grid-on',b.grid)};
 $('#bSnap').onchange=e=>{b.snap=e.target.checked};
 v.onclick=e=>{
  const bt=e.target.closest('[data-b]'),tl=e.target.closest('.tool'),lx=e.target.closest('[data-lx]'),ly=e.target.closest('[data-lid]');
  if(lx){e.stopPropagation();return removeField(lx.dataset.lx)}
  if(tl)return addField(tl.dataset.ft);
  if(ly)return selectField(ly.dataset.lid);
  if(!bt)return;
  const k=bt.dataset.b;
  if(k==='save')saveBuilder();
  else if(k==='close'){if(b.dirty&&!confirm('ยังไม่ได้บันทึก ต้องการปิดหรือไม่?'))return;S.b.id=null;render()}
  else if(k==='undo')doUndo();
  else if(k==='redo')doRedo();
  else if(k==='zi'){b.zoom=clamp(b.zoom+.1,.25,1.6);zoomTo($('#canvas'),b.zoom);$('#zLbl').textContent=Math.round(b.zoom*100)+'%'}
  else if(k==='zo'){b.zoom=clamp(b.zoom-.1,.25,1.6);zoomTo($('#canvas'),b.zoom);$('#zLbl').textContent=Math.round(b.zoom*100)+'%'}
  else if(k==='fit'){b.zoom=fitOf($('#cwrap'));zoomTo($('#canvas'),b.zoom);$('#zLbl').textContent=Math.round(b.zoom*100)+'%'}
  else if(k==='preview'){const c=paintCanvas('#pvCanvas',b.fields,'fill');$('#previewScrim').hidden=false;zoomTo(c,fitOf($('#pvWrap')))}
  else if(k==='dl')dlForm(b.id);
  else if(k==='dupf')dupField(b.sel);
  else if(k==='delf')removeField(b.sel);
  else if(k==='front')reorder(b.sel,-1);
  else if(k==='back')reorder(b.sel,1);
 };
 $$('.tool').forEach(t=>t.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain','ft:'+t.dataset.ft)));
 const cv=$('#canvas');
 cv.addEventListener('dragover',e=>{e.preventDefault();cv.classList.add('drop')});
 cv.addEventListener('dragleave',()=>cv.classList.remove('drop'));
 cv.addEventListener('drop',e=>{e.preventDefault();cv.classList.remove('drop');
  const d=e.dataTransfer.getData('text/plain');if(!d.startsWith('ft:'))return;
  const r=cv.getBoundingClientRect(),s=PW/r.width;
  addField(d.slice(3),(e.clientX-r.left)*s,(e.clientY-r.top)*s,true)});
 cv.addEventListener('pointerdown',e=>{if(e.target===cv){b.sel=null;refreshProps();paintSel()}});
 let dragI=null;
 $$('.layer').forEach(l=>{
  l.addEventListener('dragstart',()=>{dragI=+l.dataset.i;l.classList.add('drag')});
  l.addEventListener('dragend',()=>{l.classList.remove('drag');$$('.layer').forEach(x=>x.classList.remove('over'))});
  l.addEventListener('dragover',e=>{e.preventDefault();l.classList.add('over')});
  l.addEventListener('dragleave',()=>l.classList.remove('over'));
  l.addEventListener('drop',e=>{e.preventDefault();const to=+l.dataset.i;
   if(dragI===null||dragI===to)return;pushUndo();
   const [m]=b.fields.splice(dragI,1);b.fields.splice(to,0,m);markDirty();render()});
 });
 $('#props').oninput=$('#props').onchange=propChange;
}
function pushUndo(){const b=S.b;b.undo.push(JSON.stringify(b.fields));if(b.undo.length>60)b.undo.shift();b.redo=[]}
function doUndo(){const b=S.b;if(!b.undo.length)return;b.redo.push(JSON.stringify(b.fields));b.fields=JSON.parse(b.undo.pop());markDirty();render()}
function doRedo(){const b=S.b;if(!b.redo.length)return;b.undo.push(JSON.stringify(b.fields));b.fields=JSON.parse(b.redo.pop());markDirty();render()}
function markDirty(){S.b.dirty=true;const s=$('#saveState');if(s){s.className='save-state dirty';s.innerHTML=ic('clock',13)+'ยังไม่บันทึก'}autoSave()}
const autoSave=debounce(()=>{if(S.b.dirty&&S.b.id)saveBuilder(true)},1600);
function saveBuilder(auto){
 const b=S.b,t=tpl(b.id);if(!t)return;
 const seen={};
 for(const f of b.fields){
  if(!f.name){toast('มีฟิลด์ที่ยังไม่มีชื่อ (name)',{type:'warn'});return}
  if(seen[f.name]){toast('ชื่อฟิลด์ซ้ำ: '+f.name,{type:'warn'});selectField(f.id);return}
  seen[f.name]=1;
  if(OPT.includes(f.field_type)&&!f.options.length){toast('ฟิลด์ “'+f.label+'” ต้องมีตัวเลือกอย่างน้อย 1 ข้อ',{type:'warn'});selectField(f.id);return}
 }
 t.fields=JSON.parse(JSON.stringify(b.fields));t.updated_at=new Date().toISOString();
 b.dirty=false;b.undo=[];b.redo=[];persist();
 const s=$('#saveState');if(s){s.className='save-state saved';s.innerHTML=ic('check',13)+'บันทึกแล้ว'}
 const u=$('[data-b="undo"]'),r=$('[data-b="redo"]');if(u)u.disabled=true;if(r)r.disabled=true;
 paintCounts();
 remote('saveFormLayout',{templateId:t.id,meta:{name:t.name,description:t.description,is_active:t.is_active},fields:t.fields,deletedIds:[]});
 if(!auto)toast('บันทึก “'+t.name+'” แล้ว',{type:'ok'});
}
function addField(type,x,y,center){
 const b=S.b;if(!b.id)return;
 const base={label:FTL[type],name:type+'_'+(b.fields.length+1)};
 const d={title:{width:150,height:11,font_size:18,font_weight:'bold',text_align:'center',border_style:'none',value:'หัวข้อเรื่อง'},
  label:{width:60,height:7,border_style:'none',value:'ข้อความบรรยาย'},
  logo:{width:26,height:26,border_style:'none',value:DB.logo||''},
  textarea:{width:170,height:32},date:{width:52},select:{width:70},
  radio:{width:150,height:9,border_style:'none',options:['ตัวเลือก 1','ตัวเลือก 2','ตัวเลือก 3']},
  checkbox:{width:150,height:9,border_style:'none',options:['ตัวเลือก 1','ตัวเลือก 2']},
  signature:{width:72,height:20,border_style:'none'},
  checkbox_agree:{width:170,height:9,border_style:'none',font_size:12.5,value:'ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริง'},
  divider:{width:170,height:2,border_style:'none',border_color:'#0E7C86'}}[type]||{};
 const f=mkF(type,Object.assign(base,d));
 while(b.fields.some(x=>x.name===f.name))f.name=f.name.replace(/(\d*)$/,m=>(+(m||1)+1));
 if(x===undefined){x=20;y=b.fields.reduce((m,q)=>Math.max(m,q.pos_y+q.height),48)+4}
 if(center){x-=f.width/2;y-=f.height/2}
 f.pos_x=clamp(Math.round(x*2)/2,0,PW-f.width);f.pos_y=clamp(Math.round(y*2)/2,0,PH-f.height);
 pushUndo();b.fields.push(f);b.sel=f.id;markDirty();render();
}
function selectField(id){S.b.sel=id;refreshProps();paintSel();$$('.layer').forEach(l=>l.classList.toggle('on',l.dataset.lid===id))}
function paintSel(){$$('#canvas .cf').forEach(e=>e.classList.toggle('on',e.dataset.fid===S.b.sel))}
function refreshProps(){
 const b=S.b,f=b.fields.find(x=>x.id===b.sel);
 $('#props').innerHTML=f?propHTML(f):'<p style="font-size:12.5px;color:var(--text3);padding:6px">เลือกฟิลด์เพื่อแก้ไขคุณสมบัติ</p>';
 const p=$('.pacts');if(p)p.style.display=f?'grid':'none';
 $('#props').oninput=$('#props').onchange=propChange;
}
function propHTML(f){
 if(!f)return'';
 const t=f.field_type,isTxt=t==='label'||t==='title',isIn=INP.includes(t);
 const g=(l,h,n)=>`<div class="prop"><label>${l}</label>${h}${n?`<div class="pnote">${n}</div>`:''}</div>`;
 const num=(k,v,mn,mx,st)=>`<input type="number" data-p="${k}" value="${v}" min="${mn}" max="${mx}" step="${st}">`;
 const selt=(k,v,ps)=>`<select data-p="${k}">${ps.map(p=>`<option value="${p[0]}"${v===p[0]?' selected':''}>${p[1]}</option>`).join('')}</select>`;
 let h=`<div class="prop"><label>ชนิดฟิลด์</label><div style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px">${ic(FTI[t],14)}${FTL[t]}</div></div>`;
 if(t==='logo')h+=g('รูปโลโก้',`<button class="btn sm" style="width:100%" data-p="picklogo">${ic('image',13)}เลือกรูป…</button>`+(f.value?`<img src="${f.value}" style="max-width:100%;margin-top:6px;border:1px solid var(--line);border-radius:6px;background:#fff">`:''));
 if(isTxt)h+=g('ข้อความ',`<textarea data-p="value" rows="3">${esc(f.value||f.label)}</textarea>`);
 if(isIn)h+=g(t==='signature'?'ข้อความใต้ลายเซ็น':'ป้ายชื่อช่อง',`<input type="text" data-p="label" value="${esc(f.label)}">`);
 if(t==='text_input'||t==='textarea'||t==='date')h+=g('ค่าเริ่มต้น',`<input type="text" data-p="value" value="${esc(f.value)}">`);
 if(t==='checkbox_agree')h+=g('ข้อความรับรอง',`<textarea data-p="value" rows="2">${esc(f.value)}</textarea>`);
 if(OPT.includes(t))h+=g('ตัวเลือก (1 บรรทัด = 1 ตัวเลือก)',`<textarea data-p="options" rows="4">${esc(f.options.join('\n'))}</textarea>`);
 if(isIn)h+=g('ชื่อฟิลด์ (name)',`<input type="text" data-p="name" value="${esc(f.name)}">`,'อังกฤษ ตัวเลข _ เท่านั้น')+
  `<label class="pchk"><input type="checkbox" data-p="required"${f.required?' checked':''}>จำเป็นต้องกรอก</label>`;
 h+=`<div class="pr2">${g('X (มม.)',num('pos_x',f.pos_x,0,PW,.5))}${g('Y (มม.)',num('pos_y',f.pos_y,0,PH,.5))}</div>
     <div class="pr2">${g('กว้าง',num('width',f.width,3,PW,.5))}${g('สูง',num('height',f.height,1,PH,.5))}</div>`;
 if(t!=='divider'&&t!=='logo'){
  h+=`<div class="pr2">${g('ขนาดอักษร',num('font_size',f.font_size,6,72,1))}${g('น้ำหนัก',selt('font_weight',f.font_weight,[['normal','ปกติ'],['bold','หนา']]))}</div>`;
  h+=g('จัดแนว',selt('text_align',f.text_align,[['left','ชิดซ้าย'],['center','กึ่งกลาง'],['right','ชิดขวา']]));
  h+=`<div class="pr2">${g('สีอักษร',`<input type="color" data-p="text_color" value="${/^#[0-9a-f]{6}$/i.test(f.text_color)?f.text_color:'#111111'}">`)}${g('สีพื้น',`<input type="color" data-p="bg_color" value="${/^#[0-9a-f]{6}$/i.test(f.bg_color)?f.bg_color:'#ffffff'}">`)}</div>
      <label class="pchk"><input type="checkbox" data-p="bg_transparent"${f.bg_color==='transparent'?' checked':''}>พื้นหลังโปร่งใส</label>`;
  h+=g('เส้นขอบ',selt('border_style',f.border_style,[['none','ไม่มี'],['dotted','จุด'],['dashed','ประ'],['solid','ทึบ']]));
 }
 if(t!=='logo')h+=g(t==='divider'?'สีเส้น':'สีเส้นขอบ',`<input type="color" data-p="border_color" value="${/^#[0-9a-f]{6}$/i.test(f.border_color)?f.border_color:'#333333'}">`);
 return h;
}
function propChange(e){
 const key=e.target.dataset.p;if(!key)return;
 const b=S.b,f=b.fields.find(x=>x.id===b.sel);if(!f)return;
 if(key==='picklogo'){$('#logoFile').dataset.target='field';$('#logoFile').click();return}
 if(!b._armed){pushUndo();b._armed=true;setTimeout(()=>b._armed=false,900)}
 const t=e.target;
 if(key==='required')f.required=t.checked;
 else if(key==='bg_transparent')f.bg_color=t.checked?'transparent':'#ffffff';
 else if(key==='options')f.options=t.value.split('\n').map(s=>s.trim()).filter(Boolean);
 else if(key==='name')f.name=t.value.toLowerCase().replace(/[^a-z0-9_]/g,'_');
 else if(['pos_x','pos_y','width','height','font_size'].includes(key)){const n=parseFloat(t.value);if(isFinite(n))f[key]=n;
  f.width=clamp(f.width,3,PW);f.height=clamp(f.height,1,PH);
  f.pos_x=clamp(f.pos_x,0,PW-f.width);f.pos_y=clamp(f.pos_y,0,PH-f.height)}
 else if(key==='value'){f.value=t.value;if(f.field_type==='label'||f.field_type==='title')f.label=t.value}
 else f[key]=t.value;
 const el=$(`#canvas [data-fid="${f.id}"]`);
 if(el){const nu=fieldEl(f,'design',{});nu.classList.add('bf','on');
  const g=mk('div','grip-r');nu.appendChild(g);
  nu.addEventListener('pointerdown',dragStart);nu.addEventListener('dblclick',inlineEdit);g.addEventListener('pointerdown',resizeStart);
  el.replaceWith(nu)}
 markDirty();
}
function removeField(id){
 const b=S.b,i=b.fields.findIndex(f=>f.id===id);if(i<0)return;
 const [f]=b.fields.splice(i,1);if(b.sel===id)b.sel=null;pushUndo();markDirty();render();
 toast('ลบฟิลด์ “'+(f.label||FTL[f.field_type])+'”',{type:'bad',undo:()=>{b.fields.splice(i,0,f);markDirty();render()}});
}
function dupField(id){
 const b=S.b,f=b.fields.find(x=>x.id===id);if(!f)return;
 const c=JSON.parse(JSON.stringify(f));c.id=uid('f_');c.name=f.name+'_copy';
 let n=2;while(b.fields.some(x=>x.name===c.name))c.name=f.name+'_copy'+n++;
 c.pos_x=clamp(f.pos_x+4,0,PW-c.width);c.pos_y=clamp(f.pos_y+4,0,PH-c.height);
 pushUndo();b.fields.push(c);b.sel=c.id;markDirty();render();
}
function reorder(id,dir){
 const b=S.b,i=b.fields.findIndex(f=>f.id===id);if(i<0)return;
 const j=clamp(i+dir,0,b.fields.length-1);if(i===j)return;
 pushUndo();const [m]=b.fields.splice(i,1);b.fields.splice(j,0,m);markDirty();render();
}
let DR=null;
const mmScale=()=>{const r=$('#canvas').getBoundingClientRect();return PW/r.width};
function dragStart(e){
 if(e.button)return;
 const el=e.currentTarget;if($('.fc[contenteditable=true]',el))return;
 e.stopPropagation();
 const f=S.b.fields.find(x=>x.id===el.dataset.fid);if(!f)return;
 selectField(f.id);
 DR={m:'move',f,el,x:e.clientX,y:e.clientY,ox:f.pos_x,oy:f.pos_y,s:mmScale(),moved:false};
 el.setPointerCapture(e.pointerId);
 el.addEventListener('pointermove',dragMove);el.addEventListener('pointerup',dragEnd);el.addEventListener('pointercancel',dragEnd);
}
function dragMove(e){
 if(!DR||DR.m!=='move')return;
 const dx=(e.clientX-DR.x)*DR.s,dy=(e.clientY-DR.y)*DR.s;
 if(!DR.moved){if(Math.abs(dx)+Math.abs(dy)<.4)return;pushUndo();DR.moved=true}
 const sn=v=>S.b.snap?Math.round(v*2)/2:Math.round(v*100)/100;
 DR.f.pos_x=clamp(sn(DR.ox+dx),0,PW-DR.f.width);DR.f.pos_y=clamp(sn(DR.oy+dy),0,PH-DR.f.height);
 DR.el.style.left=DR.f.pos_x+'mm';DR.el.style.top=DR.f.pos_y+'mm';syncGeom(DR.f);
}
function dragEnd(){if(!DR)return;const el=DR.el;
 el.removeEventListener('pointermove',dragMove);el.removeEventListener('pointerup',dragEnd);el.removeEventListener('pointercancel',dragEnd);
 if(DR.moved)markDirty();DR=null}
function resizeStart(e){
 if(e.button)return;e.stopPropagation();e.preventDefault();
 const g=e.currentTarget,el=g.parentElement,f=S.b.fields.find(x=>x.id===el.dataset.fid);if(!f)return;
 selectField(f.id);
 DR={m:'size',f,el,g,x:e.clientX,y:e.clientY,ow:f.width,oh:f.height,s:mmScale(),moved:false};
 g.setPointerCapture(e.pointerId);
 g.addEventListener('pointermove',sizeMove);g.addEventListener('pointerup',sizeEnd);g.addEventListener('pointercancel',sizeEnd);
}
function sizeMove(e){
 if(!DR||DR.m!=='size')return;
 const dx=(e.clientX-DR.x)*DR.s,dy=(e.clientY-DR.y)*DR.s;
 if(!DR.moved){if(Math.abs(dx)+Math.abs(dy)<.4)return;pushUndo();DR.moved=true}
 const sn=v=>S.b.snap?Math.round(v*2)/2:Math.round(v*100)/100;
 DR.f.width=clamp(sn(DR.ow+dx),3,PW-DR.f.pos_x);DR.f.height=clamp(sn(DR.oh+dy),1,PH-DR.f.pos_y);
 DR.el.style.width=DR.f.width+'mm';DR.el.style.height=DR.f.height+'mm';syncGeom(DR.f);
}
function sizeEnd(){if(!DR)return;const g=DR.g,f=DR.f,mv=DR.moved;
 g.removeEventListener('pointermove',sizeMove);g.removeEventListener('pointerup',sizeEnd);g.removeEventListener('pointercancel',sizeEnd);
 DR=null;if(mv){markDirty();refreshProps()}}
function syncGeom(f){['pos_x','pos_y','width','height'].forEach(k=>{
 const i=$(`#props [data-p="${k}"]`);if(i&&document.activeElement!==i)i.value=f[k]})}
function inlineEdit(e){
 const el=e.currentTarget,f=S.b.fields.find(x=>x.id===el.dataset.fid);
 if(!f||(f.field_type!=='label'&&f.field_type!=='title'))return;
 const fc=$('.fc',el);if(!fc||fc.isContentEditable)return;
 pushUndo();fc.textContent=f.value||'';fc.contentEditable='true';fc.focus();
 const r=document.createRange();r.selectNodeContents(fc);const s=getSelection();s.removeAllRanges();s.addRange(r);
 const inp=()=>{f.value=fc.textContent;f.label=fc.textContent;markDirty()};
 const key=ev=>{ev.stopPropagation();if(ev.key==='Enter'||ev.key==='Escape'){ev.preventDefault();fc.blur()}};
 const done=()=>{fc.removeEventListener('input',inp);fc.removeEventListener('keydown',key);fc.removeEventListener('blur',done);
  fc.contentEditable='false';f.value=fc.textContent;f.label=fc.textContent;refreshProps();markDirty()};
 fc.addEventListener('input',inp);fc.addEventListener('keydown',key);fc.addEventListener('blur',done);
}

/* ============ INBOX ============ */
function inboxList(){
 const f=S.inbox;
 return DB.submissions.filter(s=>{
  if(f.tpl!=='all'&&s.template_id!==f.tpl)return false;
  if(f.status==='ARCHIVED'){if(!s.archived_at)return false}
  else{if(s.archived_at)return false;if(f.status!=='ALL'&&s.status!==f.status)return false}
  if(f.q){const q=f.q.toLowerCase();
   if(!(s.submitted_by_name+s.template_name+ref(s.id)+(s.department||'')).toLowerCase().includes(q))return false}
  return true}).sort((a,b)=>f.sort==='oldest'?new Date(a.created_at)-new Date(b.created_at):
   f.sort==='name'?a.submitted_by_name.localeCompare(b.submitted_by_name,'th'):
   new Date(b.created_at)-new Date(a.created_at));
}
function vInbox(v){
 const f=S.inbox,list=inboxList();
 const live=DB.submissions.filter(s=>!s.archived_at);
 const cnt=k=>k==='ALL'?live.length:k==='ARCHIVED'?DB.submissions.filter(s=>s.archived_at).length:live.filter(s=>s.status===k).length;
 v.innerHTML=head('inbox',
  `<button class="btn" data-i="csv">${ic('csv')}ส่งออก CSV</button>
   <button class="btn" data-i="saveview">${ic('bolt')}บันทึกมุมมอง</button>`)+
 `<div class="stats">
   <div class="stat s1"><span>รอตรวจสอบ</span><b>${cnt('SUBMITTED')}</b><i>ต้องดำเนินการ</i></div>
   <div class="stat s2"><span>อนุมัติแล้ว</span><b>${cnt('APPROVED')}</b><i>เดือนนี้</i></div>
   <div class="stat s3"><span>ไม่อนุมัติ</span><b>${cnt('REJECTED')}</b><i>ส่งกลับแก้ไข</i></div>
   <div class="stat s4"><span>เก็บถาวร</span><b>${cnt('ARCHIVED')}</b><i>ซ่อนจากกล่องหลัก</i></div>
   <div class="stat s5"><span>ทั้งหมด</span><b>${DB.submissions.length}</b><i>ทุกสถานะ</i></div>
 </div>
 <div class="toolbar">
  <div class="search">${ic('search')}<input id="iq" value="${esc(f.q)}" placeholder="ค้นหาชื่อผู้ยื่น / เลขอ้างอิง / ฟอร์ม…"><kbd>/</kbd></div>
  <select class="sel" id="itpl"><option value="all">ทุกแบบฟอร์ม</option>${DB.templates.map(t=>`<option value="${t.id}"${f.tpl===t.id?' selected':''}>${esc(t.name)}</option>`).join('')}</select>
  <select class="sel" id="isort"><option value="newest">ใหม่สุดก่อน</option><option value="oldest"${f.sort==='oldest'?' selected':''}>เก่าสุดก่อน</option><option value="name"${f.sort==='name'?' selected':''}>ชื่อผู้ยื่น ก–ฮ</option></select>
 </div>
 <div class="chipbar" style="margin-bottom:12px">
  ${[['ALL','ทั้งหมด'],['SUBMITTED','รอตรวจสอบ'],['APPROVED','อนุมัติ'],['REJECTED','ไม่อนุมัติ'],['ARCHIVED','คลังถาวร']].map(c=>
   `<button class="chip${f.status===c[0]?' on':''}" data-st="${c[0]}">${c[1]} <b>${cnt(c[0])}</b></button>`).join('')}
  ${DB.savedViews.map(sv=>`<button class="chip saved" data-sv="${sv.id}">${ic('bolt',12)}${esc(sv.name)}<span class="x" data-svx="${sv.id}">×</span></button>`).join('')}
 </div>
 ${list.length?`<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr>
   <th style="width:36px"><input type="checkbox" class="cbx" id="selAll"></th>
   <th class="sortable" data-sort="newest">เลขอ้างอิง</th><th>ผู้ยื่น</th><th>แบบฟอร์ม</th>
   <th>สถานะ</th><th class="sortable" data-sort="newest">ส่งเมื่อ</th><th></th></tr></thead>
   <tbody>${list.map(s=>`<tr data-sid="${s.id}" class="${f.sel.has(s.id)?'sel':''}">
    <td><input type="checkbox" class="cbx rowcb" data-cb="${s.id}"${f.sel.has(s.id)?' checked':''}></td>
    <td><span class="ref" data-copy="${ref(s.id)}" title="คลิกเพื่อคัดลอก">#${ref(s.id)}</span></td>
    <td><div class="who"><span class="av" style="${avStyle(s.submitted_by_name)}">${esc(s.submitted_by_name.replace(/^(นาย|นาง|นางสาว)/,'').trim()[0]||'?')}</span>
      <div><b>${esc(s.submitted_by_name)}</b><small>${esc(s.department||'')}</small></div></div></td>
    <td style="max-width:230px"><b style="font-weight:600">${esc(s.template_name)}</b></td>
    <td><span class="pill ${s.archived_at?'arch':s.status}">${s.archived_at?'คลังถาวร':ST[s.status]}</span></td>
    <td class="num" title="${fdate(s.created_at)}">${ago(s.created_at)}</td>
    <td class="acts">
     <button class="btn sm" data-ia="view" data-id="${s.id}">${ic('eye',13)}ดู</button>
     ${s.status==='SUBMITTED'&&!s.archived_at?`<button class="btn sm ok" data-ia="ok" data-id="${s.id}">${ic('check',13)}</button>
      <button class="btn sm bad" data-ia="no" data-id="${s.id}">${ic('x',13)}</button>`:''}
     <button class="btn sm icon" data-ia="print" data-id="${s.id}" title="พิมพ์ A4">${ic('print',13)}</button>
     <button class="btn sm icon" data-ia="${s.archived_at?'unarch':'arch'}" data-id="${s.id}" title="${s.archived_at?'คืนจากคลัง':'เก็บถาวร'}">${ic(s.archived_at?'undo':'arch',13)}</button>
    </td></tr>`).join('')}</tbody></table></div></div>`
  :emptyBox('inbox','ไม่มีคำขอในตัวกรองนี้','ลองเลือกสถานะอื่น ล้างคำค้น หรือให้ผู้ใช้ทดลองกรอกฟอร์มจากหน้ากรอกฟอร์ม','<button class="btn pri" data-i="gopub">'+ic('globe')+'ไปหน้ากรอกฟอร์ม</button>')}
 ${f.sel.size?`<div class="bulk"><b>${f.sel.size}</b><span>รายการที่เลือก</span><span class="sp"></span>
   <button class="btn sm" data-bulk="ok">${ic('check',13)}อนุมัติทั้งหมด</button>
   <button class="btn sm" data-bulk="no">${ic('x',13)}ไม่อนุมัติ</button>
   <button class="btn sm" data-bulk="arch">${ic('arch',13)}เก็บถาวร</button>
   <button class="btn sm" data-bulk="csv">${ic('csv',13)}ส่งออก</button>
   <button class="btn sm" data-bulk="clear">ล้างเลือก</button></div>`:''}`;
 $('#iq').oninput=debounce(e=>{f.q=e.target.value;render();$('#iq').focus()},220);
 $('#itpl').onchange=e=>{f.tpl=e.target.value;render()};
 $('#isort').onchange=e=>{f.sort=e.target.value;render()};
 const sa=$('#selAll');if(sa)sa.onchange=e=>{list.forEach(s=>e.target.checked?f.sel.add(s.id):f.sel.delete(s.id));render()};
 v.onclick=e=>{
  const st=e.target.closest('[data-st]'),cp=e.target.closest('[data-copy]'),ia=e.target.closest('[data-ia]'),
        bk=e.target.closest('[data-bulk]'),gi=e.target.closest('[data-i]'),sv=e.target.closest('[data-sv]'),svx=e.target.closest('[data-svx]'),
        cb=e.target.closest('[data-cb]'),row=e.target.closest('[data-sid]');
  if(svx){DB.savedViews=DB.savedViews.filter(x=>x.id!==svx.dataset.svx);persist();return render()}
  if(sv){const x=DB.savedViews.find(y=>y.id===sv.dataset.sv);Object.assign(f,x.state,{sel:new Set()});return render()}
  if(cb){cb.dataset.cb&&(f.sel.has(cb.dataset.cb)?f.sel.delete(cb.dataset.cb):f.sel.add(cb.dataset.cb));return render()}
  if(cp){navigator.clipboard?.writeText(cp.dataset.copy);return toast('คัดลอกเลขอ้างอิง #'+cp.dataset.copy,{type:'ok'})}
  if(st){f.status=st.dataset.st;f.sel.clear();return render()}
  if(gi){const k=gi.dataset.i;
   if(k==='csv')return csv([['เลขอ้างอิง','ผู้ยื่น','หน่วยงาน','แบบฟอร์ม','สถานะ','ส่งเมื่อ','เก็บถาวร'],
    ...list.map(s=>['#'+ref(s.id),s.submitted_by_name,s.department||'',s.template_name,s.archived_at?'คลังถาวร':ST[s.status],fdate(s.created_at),s.archived_at?fdate(s.archived_at):''])],'dontum-submissions.csv');
   if(k==='saveview')return saveView();
   if(k==='gopub')return go('public');
  }
  if(bk)return bulk(bk.dataset.bulk,list);
  if(ia){const id=ia.dataset.id,k=ia.dataset.ia;
   if(k==='view')return subDrawer(id);
   if(k==='ok')return setStatus([id],'APPROVED');
   if(k==='no')return setStatus([id],'REJECTED');
   if(k==='print')return printSub(id);
   if(k==='arch')return setArch([id],true);
   if(k==='unarch')return setArch([id],false);
  }
  if(row&&!e.target.closest('button,input'))subDrawer(row.dataset.sid);
 };
}
function saveView(){
 modal('บันทึกมุมมองปัจจุบัน',
  `<p style="font-size:13px;color:var(--text2);margin-bottom:12px">บันทึกชุดตัวกรอง (แบบฟอร์ม · สถานะ · คำค้น · การเรียง) ไว้เรียกใช้ซ้ำด้วยคลิกเดียว</p>
   <div class="fld"><label>ชื่อมุมมอง</label><input id="svName" placeholder="เช่น รอตรวจ — งานพัสดุ"></div>`,
  `<button class="btn" data-close-modal>ยกเลิก</button><button class="btn pri" id="svGo">${ic('bolt')}บันทึก</button>`);
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#svName').focus();
 $('#svGo').onclick=()=>{const n=$('#svName').value.trim();if(!n)return toast('กรุณาตั้งชื่อมุมมอง',{type:'warn'});
  DB.savedViews.push({id:uid('sv_'),name:n,state:{tpl:S.inbox.tpl,status:S.inbox.status,q:S.inbox.q,sort:S.inbox.sort}});
  persist();closeModal();render();toast('บันทึกมุมมอง “'+n+'” แล้ว',{type:'ok'})};
}
function bulk(k,list){
 const ids=[...S.inbox.sel];if(!ids.length)return;
 if(k==='clear'){S.inbox.sel.clear();return render()}
 if(k==='ok')return setStatus(ids,'APPROVED');
 if(k==='no')return setStatus(ids,'REJECTED');
 if(k==='arch')return setArch(ids,true);
 if(k==='csv'){const rows=list.filter(s=>S.inbox.sel.has(s.id));
  return csv([['เลขอ้างอิง','ผู้ยื่น','แบบฟอร์ม','สถานะ','ส่งเมื่อ'],...rows.map(s=>['#'+ref(s.id),s.submitted_by_name,s.template_name,ST[s.status],fdate(s.created_at)])],'dontum-selected.csv')}
}
function setStatus(ids,st){
 const before=ids.map(id=>({id,prev:sub(id)?.status,at:sub(id)?.reviewed_at}));
 ids.forEach(id=>{const s=sub(id);if(!s)return;s.status=st;s.reviewed_at=new Date().toISOString();s.reviewed_by='ผู้ดูแลระบบ'});
 S.inbox.sel.clear();persist();render();
 logAct((st==='APPROVED'?'อนุมัติ':'ไม่อนุมัติ')+' '+ids.length+' คำขอ',st==='APPROVED'?'ok':'bad');
 remote('updateSubmissionStatus',{id:ids[0],status:st});
 toast((st==='APPROVED'?'อนุมัติ':'ไม่อนุมัติ')+'แล้ว '+ids.length+' รายการ',{type:st==='APPROVED'?'ok':'bad',
  undo:()=>{before.forEach(b=>{const s=sub(b.id);if(s){s.status=b.prev;s.reviewed_at=b.at}});persist();render();toast('ย้อนสถานะกลับแล้ว')}});
}
function setArch(ids,on){
 const before=ids.map(id=>({id,prev:sub(id)?.archived_at}));
 ids.forEach(id=>{const s=sub(id);if(s)s.archived_at=on?new Date().toISOString():null});
 S.inbox.sel.clear();persist();render();
 logAct((on?'เก็บถาวร':'คืนจากคลัง')+' '+ids.length+' คำขอ','info');
 remote(on?'archiveSubmission':'unarchiveSubmission',{id:ids[0]});
 toast((on?'เก็บเข้าคลังถาวร':'คืนจากคลัง')+'แล้ว '+ids.length+' รายการ',{type:'info',
  undo:()=>{before.forEach(b=>{const s=sub(b.id);if(s)s.archived_at=b.prev});persist();render();toast('ย้อนกลับแล้ว')}});
}
function printSub(id){
 const s=sub(id),t=tpl(s?.template_id);if(!s||!t)return toast('ไม่พบแบบฟอร์มต้นฉบับ',{type:'warn'});
 printSheet(t.fields,s.data,t.name+' · #'+ref(s.id));
}
function subDrawer(id){
 const s=sub(id);if(!s)return;const t=tpl(s.template_id);
 const tl=[{c:'',t:'ยื่นคำขอเข้าระบบ',at:s.created_at}];
 if(s.reviewed_at)tl.push({c:s.status==='APPROVED'?'ok':'bad',t:s.status==='APPROVED'?'อนุมัติโดย '+s.reviewed_by:'ไม่อนุมัติโดย '+s.reviewed_by,at:s.reviewed_at});
 if(s.archived_at)tl.push({c:'arch',t:'เก็บเข้าคลังถาวร',at:s.archived_at});
 const vals=t?Object.entries(s.data).filter(([k])=>!k.startsWith('_')).map(([k,v])=>{
  const f=t.fields.find(x=>x.name===k);return `<div class="fval"><span>${esc(f?.label||k)}</span><b>${esc(v||'—')}</b></div>`}).join(''):'';
 openDrawer('คำขอ #'+ref(id),s.template_name,
  `<dl class="kv">
   <dt>ผู้ยื่น</dt><dd>${esc(s.submitted_by_name)}</dd>
   <dt>หน่วยงาน</dt><dd>${esc(s.department||'—')}</dd>
   <dt>สถานะ</dt><dd><span class="pill ${s.archived_at?'arch':s.status}">${s.archived_at?'คลังถาวร':ST[s.status]}</span></dd>
   <dt>เลขอ้างอิง</dt><dd><span class="ref" data-copy="${ref(id)}">#${ref(id)}</span></dd>
   <dt>ส่งเมื่อ</dt><dd>${fdate(s.created_at)}</dd></dl>
   <div class="d-sec">ลำดับเหตุการณ์</div><div class="tline">${tl.map(x=>`<div class="tl ${x.c}"><b>${esc(x.t)}</b><small>${fdate(x.at)}</small></div>`).join('')}</div>
   <div class="d-sec">ข้อมูลที่กรอก</div>${vals||'<p style="font-size:12.5px;color:var(--text3)">ไม่มีข้อมูล</p>'}
   ${t?`<div class="d-sec">เอกสาร A4</div><div class="mini-a4" id="dA4" style="aspect-ratio:210/297"><div class="sc"></div></div>`:''}`,
  `${s.status==='SUBMITTED'&&!s.archived_at?`<button class="btn ok" data-s="ok">${ic('check')}อนุมัติ</button><button class="btn bad" data-s="no">${ic('x')}ไม่อนุมัติ</button>`:''}
   <button class="btn pri" data-s="print">${ic('print')}พิมพ์ A4</button>
   <button class="btn" data-s="dl">${ic('dl')}ดาวน์โหลด</button>
   <button class="btn arch" data-s="arch">${ic(s.archived_at?'undo':'arch')}${s.archived_at?'คืนจากคลัง':'เก็บถาวร'}</button>`,{kind:'sub',id});
 requestAnimationFrame(()=>{const w=$('#dA4');if(!w||!t)return;const c=$('.sc',w);
  t.fields.map(norm).forEach(f=>c.appendChild(fieldEl(f,'print',s.data)));
  c.style.transform=`scale(${w.clientWidth/(PW*MM)})`});
 $('#drawerBody').onclick=e=>{const c=e.target.closest('[data-copy]');if(c){navigator.clipboard?.writeText(c.dataset.copy);toast('คัดลอกแล้ว',{type:'ok'})}};
 $('#drawerFoot').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;const k=b.dataset.s;
  if(k==='ok'||k==='no'){setStatus([id],k==='ok'?'APPROVED':'REJECTED');closeDrawer()}
  else if(k==='print'){printSub(id)}
  else if(k==='dl'){if(!t)return;download(sheetHTML(t.fields,s.data,t.name+' #'+ref(id),false),fname(t.name)+'_'+ref(id)+'.html');toast('ดาวน์โหลดเอกสารแล้ว',{type:'ok'})}
  else if(k==='arch'){setArch([id],!s.archived_at);closeDrawer()}};
}

/* ============ MINE ============ */
function vMine(v){
 const f=S.mine;
 const list=DB.submissions.filter(s=>{
  if(f.status!=='all'&&s.status!==f.status)return false;
  if(f.q&&!(s.template_name+ref(s.id)+s.submitted_by_name).toLowerCase().includes(f.q.toLowerCase()))return false;
  return true}).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,40);
 v.innerHTML=head('mine',`<button class="btn pri" data-m="new">${ic('plus')}ยื่นคำขอใหม่</button>`)+
 `<div class="toolbar"><div class="search">${ic('search')}<input id="mq" value="${esc(f.q)}" placeholder="ค้นหาคำขอของฉัน…"></div>
  <select class="sel" id="mst"><option value="all">ทุกสถานะ</option>${Object.entries(ST).map(([k,t])=>`<option value="${k}"${f.status===k?' selected':''}>${t}</option>`).join('')}</select></div>
 ${list.length?`<div class="grid">${list.map((s,i)=>`<article class="card" data-mid="${s.id}" style="animation-delay:${i*30}ms">
   <div class="card-top"><h3>${esc(s.template_name)}</h3></div>
   <div class="card-meta"><span class="ref" data-copy="${ref(s.id)}">#${ref(s.id)}</span><span>${ago(s.created_at)}</span></div>
   <span class="pill ${s.archived_at?'arch':s.status}">${s.archived_at?'คลังถาวร':ST[s.status]}</span>
   <p style="margin-top:9px">${esc(s.submitted_by_name)}</p>
   <div class="card-acts"><button class="btn sm" data-m="view" data-id="${s.id}">${ic('eye',13)}รายละเอียด</button>
   <button class="btn sm" data-m="print" data-id="${s.id}">${ic('print',13)}พิมพ์</button></div></article>`).join('')}</div>`
  :emptyBox('mine','ยังไม่มีคำขอในมุมมองนี้','ยื่นคำขอใหม่เพื่อทดสอบวงจรการทำงานตั้งแต่กรอกจนถึงอนุมัติ','<button class="btn pri" data-m="new">'+ic('plus')+'ยื่นคำขอใหม่</button>')}`;
 $('#mq').oninput=debounce(e=>{f.q=e.target.value;render();$('#mq').focus()},220);
 $('#mst').onchange=e=>{f.status=e.target.value;render()};
 v.onclick=e=>{const m=e.target.closest('[data-m]'),c=e.target.closest('[data-copy]'),card=e.target.closest('[data-mid]');
  if(c){navigator.clipboard?.writeText(c.dataset.copy);return toast('คัดลอกแล้ว',{type:'ok'})}
  if(m){const k=m.dataset.m,id=m.dataset.id;
   if(k==='new')return go('public');if(k==='view')return subDrawer(id);if(k==='print')return printSub(id)}
  if(card&&!e.target.closest('button'))subDrawer(card.dataset.mid)};
}

/* ============ STAFF ============ */
function vStaff(v){
 const f=S.staff;
 let list=DB.staff.filter(s=>{
  if(f.dept!=='all'&&s.department!==f.dept)return false;
  if(f.active==='on'&&!s.is_active)return false;
  if(f.active==='off'&&s.is_active)return false;
  if(f.q&&!(s.full_name+s.position+s.department+s.email).toLowerCase().includes(f.q.toLowerCase()))return false;
  return true});
 list.sort((a,b)=>f.sort==='dept'?a.department.localeCompare(b.department,'th'):
  f.sort==='pos'?a.position.localeCompare(b.position,'th'):a.full_name.localeCompare(b.full_name,'th'));
 v.innerHTML=head('staff',`<button class="btn" data-t="csv">${ic('csv')}ส่งออก CSV</button>
   <button class="btn pri" data-t="add">${ic('plus')}เพิ่มบุคลากร</button>`)+
 `<div class="toolbar">
   <div class="search">${ic('search')}<input id="tq" value="${esc(f.q)}" placeholder="ค้นหาชื่อ / ตำแหน่ง / อีเมล…"><kbd>/</kbd></div>
   <select class="sel" id="tdept"><option value="all">ทุกหน่วยงาน</option>${DEPTS.map(d=>`<option${f.dept===d?' selected':''}>${esc(d)}</option>`).join('')}</select>
   <select class="sel" id="tact"><option value="all">ทุกสถานะ</option><option value="on"${f.active==='on'?' selected':''}>ปฏิบัติงาน</option><option value="off"${f.active==='off'?' selected':''}>ระงับสิทธิ์</option></select>
   <select class="sel" id="tsort"><option value="name">ชื่อ ก–ฮ</option><option value="dept"${f.sort==='dept'?' selected':''}>หน่วยงาน</option><option value="pos"${f.sort==='pos'?' selected':''}>ตำแหน่ง</option></select>
   <span style="font-size:12px;color:var(--text3);margin-left:auto">${list.length} จาก ${DB.staff.length} คน</span>
 </div>
 ${list.length?`<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr>
   <th style="width:36px"><input type="checkbox" class="cbx" id="tAll"></th>
   <th>ชื่อ-นามสกุล</th><th>ตำแหน่ง</th><th>หน่วยงาน</th><th>ประเภท</th><th>สถานะ</th><th></th></tr></thead>
   <tbody>${list.map(s=>`<tr data-tid="${s.id}" class="${f.sel.has(s.id)?'sel':''}">
    <td><input type="checkbox" class="cbx" data-tcb="${s.id}"${f.sel.has(s.id)?' checked':''}></td>
    <td><div class="who"><span class="av" style="${avStyle(s.full_name)}">${esc(s.first_name[0])}</span>
      <div><b>${esc(s.full_name)}</b><small>${esc(s.email)}</small></div></div></td>
    <td>${esc(s.position)}</td><td>${esc(s.department)}</td>
    <td><span class="pill info">${esc(s.employment_type)}</span></td>
    <td><span class="pill ${s.is_active?'on':'off'}">${s.is_active?'ปฏิบัติงาน':'ระงับสิทธิ์'}</span></td>
    <td class="acts"><button class="btn sm" data-t="view" data-id="${s.id}">${ic('eye',13)}ดู</button>
     <button class="btn sm ${s.is_active?'bad':'ok'}" data-t="toggle" data-id="${s.id}">${ic(s.is_active?'lock':'check',13)}${s.is_active?'ระงับ':'เปิดใช้'}</button>
     <button class="btn sm icon bad" data-t="del" data-id="${s.id}" title="ลบออกจากทะเบียน">${ic('trash',13)}</button></td>
   </tr>`).join('')}</tbody></table></div></div>`
  :emptyBox('users','ไม่พบบุคลากร','ลองเปลี่ยนคำค้นหรือตัวกรองหน่วยงาน หรือเพิ่มบุคลากรใหม่','<button class="btn pri" data-t="add">'+ic('plus')+'เพิ่มบุคลากร</button>')}
 ${f.sel.size?`<div class="bulk"><b>${f.sel.size}</b><span>คนที่เลือก</span><span class="sp"></span>
   <button class="btn sm" data-tb="on">${ic('check',13)}เปิดสิทธิ์</button>
   <button class="btn sm" data-tb="off">${ic('lock',13)}ระงับสิทธิ์</button>
   <button class="btn sm" data-tb="del">${ic('trash',13)}ลบที่เลือก</button>
   <button class="btn sm" data-tb="csv">${ic('csv',13)}ส่งออก</button>
   <button class="btn sm" data-tb="clear">ล้างเลือก</button></div>`:''}`;
 $('#tq').oninput=debounce(e=>{f.q=e.target.value;render();$('#tq').focus()},220);
 $('#tdept').onchange=e=>{f.dept=e.target.value;render()};
 $('#tact').onchange=e=>{f.active=e.target.value;render()};
 $('#tsort').onchange=e=>{f.sort=e.target.value;render()};
 const ta=$('#tAll');if(ta)ta.onchange=e=>{list.forEach(s=>e.target.checked?f.sel.add(s.id):f.sel.delete(s.id));render()};
 v.onclick=e=>{
  const cb=e.target.closest('[data-tcb]'),t=e.target.closest('[data-t]'),tb=e.target.closest('[data-tb]'),row=e.target.closest('[data-tid]');
  if(cb){const id=cb.dataset.tcb;f.sel.has(id)?f.sel.delete(id):f.sel.add(id);return render()}
  if(tb){const k=tb.dataset.tb,ids=[...f.sel];
   if(k==='clear'){f.sel.clear();return render()}
   if(k==='csv')return csv([['ชื่อ','ตำแหน่ง','หน่วยงาน','ประเภท','สถานะ'],...DB.staff.filter(s=>f.sel.has(s.id)).map(s=>[s.full_name,s.position,s.department,s.employment_type,s.is_active?'ปฏิบัติงาน':'ระงับสิทธิ์'])],'dontum-staff-selected.csv');
   if(k==='del')return delStaff(ids);
   return setStaffActive(ids,k==='on')}
  if(t){const k=t.dataset.t,id=t.dataset.id;
   if(k==='add')return addStaff();
   if(k==='csv')return csv([['ชื่อ','ตำแหน่ง','หน่วยงาน','ประเภท','อีเมล','โทรศัพท์','สถานะ'],...list.map(s=>[s.full_name,s.position,s.department,s.employment_type,s.email,s.phone,s.is_active?'ปฏิบัติงาน':'ระงับสิทธิ์'])],'dontum-staff.csv');
   if(k==='view')return staffDrawer(id);
   if(k==='toggle')return setStaffActive([id],!stf(id).is_active);
   if(k==='del')return delStaff([id])}
  if(row&&!e.target.closest('button,input'))staffDrawer(row.dataset.tid);
 };
}
function setStaffActive(ids,on){
 const before=ids.map(id=>({id,prev:stf(id)?.is_active}));
 ids.forEach(id=>{const s=stf(id);if(s)s.is_active=on});
 S.staff.sel.clear();persist();render();
 logAct((on?'เปิดสิทธิ์':'ระงับสิทธิ์')+'บุคลากร '+ids.length+' คน',on?'ok':'warn');
 toast((on?'เปิดสิทธิ์ให้ ':'ระงับสิทธิ์ ')+ids.length+' คนแล้ว',{type:on?'ok':'warn',
  undo:()=>{before.forEach(b=>{const s=stf(b.id);if(s)s.is_active=b.prev});persist();render();toast('ย้อนกลับแล้ว')}});
}
/* ---------- ลบบุคลากร (ยืนยัน + กู้คืนได้) ---------- */
function delStaff(ids){
 const targets=ids.map(id=>stf(id)).filter(Boolean);
 if(!targets.length)return;
 const names=targets.map(t=>t.full_name);
 modal('ลบบุคลากรออกจากทะเบียน',
  `<p style="font-size:13.5px">ต้องการลบ <b>${targets.length}</b> รายชื่อออกจากทะเบียนบุคลากรใช่หรือไม่</p>
   <div style="max-height:170px;overflow:auto;margin:11px 0;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface2)">
     ${names.map(n=>`<div style="font-size:12.5px;padding:3px 0;display:flex;gap:7px;align-items:center">${ic('users',13)}<span>${esc(n)}</span></div>`).join('')}
   </div>
   <p style="font-size:11.5px;color:var(--text3)">${S.live?'โหมด LIVE: API ปัจจุบันยังไม่มีคำสั่งลบบุคลากร การลบนี้จึงมีผลกับข้อมูลในเครื่องนี้เท่านั้น · ':''}กด “เลิกทำ” จากแถบแจ้งเพื่อกู้คืนได้ทันที</p>`,
  `<button class="btn" data-close-modal>ยกเลิก</button><button class="btn bad" id="delGo">${ic('trash',14)}ลบออกจากทะเบียน</button>`);
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#delGo').onclick=()=>{
  const snap=targets.map(t=>({item:t,idx:DB.staff.indexOf(t)}));
  DB.staff=DB.staff.filter(s=>!ids.includes(s.id));
  S.staff.sel.clear();persist();closeModal();render();
  logAct('ลบบุคลากร '+targets.length+' คน: '+names.slice(0,3).join(', ')+(names.length>3?' และอื่น ๆ':''),'bad');
  toast('ลบ '+targets.length+' รายชื่อออกจากทะเบียนแล้ว',{type:'bad',undo:()=>{
   snap.sort((a,b)=>a.idx-b.idx).forEach(o=>DB.staff.splice(Math.min(o.idx,DB.staff.length),0,o.item));
   persist();render();toast('กู้คืนรายชื่อแล้ว',{type:'ok'});
  }});
 };
}
function addStaff(){
 modal('เพิ่มบุคลากร',
  `<div class="pr2"><div class="fld"><label>คำนำหน้า</label><select id="sfP"><option>นาย</option><option>นาง</option><option>นางสาว</option></select></div>
   <div class="fld"><label>ชื่อ *</label><input id="sfF"></div></div>
   <div class="fld"><label>นามสกุล *</label><input id="sfL"></div>
   <div class="fld"><label>ตำแหน่ง</label><select id="sfPos">${POS.map(p=>`<option>${esc(p)}</option>`).join('')}</select></div>
   <div class="fld"><label>หน่วยงาน</label><select id="sfD">${DEPTS.map(d=>`<option>${esc(d)}</option>`).join('')}</select></div>
   <div class="fld"><label>ประเภทการจ้าง</label><select id="sfE"><option>ข้าราชการ</option><option>พนักงานราชการ</option><option>ลูกจ้างชั่วคราว</option></select></div>
   <div class="fld"><label>อีเมลราชการ</label><input id="sfM" type="email" placeholder="name@dontum.go.th"></div>`,
  `<button class="btn" data-close-modal>ยกเลิก</button><button class="btn pri" id="sfGo">${ic('plus')}เพิ่มบุคลากร</button>`);
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#sfF').focus();
 $('#sfGo').onclick=()=>{
  const f=$('#sfF').value.trim(),l=$('#sfL').value.trim();
  if(!f||!l)return toast('กรุณากรอกชื่อและนามสกุล',{type:'warn'});
  const p=$('#sfP').value;
  DB.staff.unshift({id:uid('stf_'),prefix:p,first_name:f,last_name:l,full_name:p+f+' '+l,
   position:$('#sfPos').value,department:$('#sfD').value,employment_type:$('#sfE').value,
   email:$('#sfM').value.trim()||'—',phone:'—',is_active:true});
  persist();closeModal();render();logAct('เพิ่มบุคลากร '+p+f+' '+l,'ok');toast('เพิ่มบุคลากรแล้ว',{type:'ok'});
 };
}
function staffDrawer(id){
 const s=stf(id);if(!s)return;
 const rel=DB.submissions.filter(x=>x.submitted_by_name===s.full_name);
 openDrawer('บุคลากร',s.full_name,
  `<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
    <span class="av" style="${avStyle(s.full_name)};width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font-size:20px;font-weight:700;color:#fff">${esc(s.first_name[0])}</span>
    <div><b style="font-size:16px">${esc(s.full_name)}</b><div style="font-size:12.5px;color:var(--text2)">${esc(s.position)}</div>
    <span class="pill ${s.is_active?'on':'off'}" style="margin-top:5px">${s.is_active?'ปฏิบัติงาน':'ระงับสิทธิ์'}</span></div></div>
   <dl class="kv"><dt>หน่วยงาน</dt><dd>${esc(s.department)}</dd>
   <dt>ประเภทการจ้าง</dt><dd>${esc(s.employment_type)}</dd>
   <dt>อีเมล</dt><dd>${esc(s.email)}</dd><dt>โทรศัพท์</dt><dd>${esc(s.phone)}</dd>
   <dt>คำขอที่ยื่น</dt><dd>${rel.length} รายการ</dd></dl>
   <div class="d-sec">คำขอล่าสุด</div>
   ${rel.length?rel.slice(0,6).map(x=>`<div class="fval"><span>${esc(x.template_name)}</span><b><span class="pill ${x.status}">${ST[x.status]}</span></b></div>`).join(''):'<p style="font-size:12.5px;color:var(--text3)">ยังไม่มีคำขอ</p>'}`,
  `<button class="btn ${s.is_active?'bad':'ok'}" data-t2="toggle">${ic(s.is_active?'lock':'check')}${s.is_active?'ระงับสิทธิ์':'เปิดสิทธิ์'}</button>
   <button class="btn" data-t2="copy">${ic('copy')}คัดลอกข้อมูล</button>
   <button class="btn bad" data-t2="del">${ic('trash')}ลบออกจากทะเบียน</button>`,{kind:'staff',id});
 $('#drawerFoot').onclick=e=>{const b=e.target.closest('[data-t2]');if(!b)return;
  if(b.dataset.t2==='toggle'){setStaffActive([id],!s.is_active);closeDrawer()}
  else if(b.dataset.t2==='del'){closeDrawer();delStaff([id])}
  else{navigator.clipboard?.writeText(`${s.full_name}\t${s.position}\t${s.department}\t${s.email}`);toast('คัดลอกข้อมูลแล้ว',{type:'ok'})}};
}

/* ============ BRAND ============ */
function vBrand(v){
 const l=DB.logo;
 v.innerHTML=head('brand')+
 `<div class="brand-grid">
   <div>
    <div class="logo-stage">${l?`<img src="${l}" alt="ตราสัญลักษณ์">`:`<span class="logo-ph">ด</span>`}</div>
    <div class="drop" id="drop" style="margin-top:12px">
      <div style="color:var(--accent);margin-bottom:8px">${ic('image',26)}</div>
      <b style="font-size:13.5px">ลากรูปมาวางที่นี่</b>
      <p style="font-size:12px;color:var(--text2);margin:5px 0 11px">PNG · JPG · SVG · WebP — ไม่เกิน 40 KB<br>แนะนำภาพสี่เหลี่ยมจัตุรัสพื้นโปร่งใส</p>
      <button class="btn pri sm" id="pick">${ic('image',13)}เลือกไฟล์จากเครื่อง</button>
    </div>
    ${l?`<button class="btn bad" style="width:100%;margin-top:10px" id="rmLogo">${ic('trash',13)}ลบตราสัญลักษณ์</button>`:''}
   </div>
   <div>
    <div class="panel"><div class="panel-h">${ic('eye',14)}<b>ตัวอย่างการใช้งาน</b></div><div class="panel-b">
     ${[[56,'หัวเว็บ (Topbar)','แสดงมุมซ้ายบนทุกหน้า'],[40,'ปุ่มย่อเมนู','ขนาดกลาง'],[28,'หัวเอกสาร A4','แทรกในแบบฟอร์ม'],[16,'Favicon','แท็บเบราว์เซอร์']].map(([s,t,d])=>
      `<div class="size-row"><div class="box" style="width:${s}px;height:${s}px">${l?`<img src="${l}">`:`<span style="font-size:${s*.5}px;font-weight:800;color:var(--text3)">ด</span>`}</div>
       <div><b>${t}</b><small>${d} · ${s}×${s} px</small></div></div>`).join('')}
    </div></div>
    <div class="panel" style="margin-top:12px"><div class="panel-h">${ic('info',14)}<b>ข้อมูลไฟล์</b></div><div class="panel-b">
     ${l?`<dl class="kv" style="margin:0"><dt>ชนิด</dt><dd>${esc((l.match(/^data:([^;]+)/)||[])[1]||'image')}</dd>
      <dt>ขนาดโดยประมาณ</dt><dd>${(l.length*.75/1024).toFixed(1)} KB</dd>
      <dt>สถานะ</dt><dd><span class="pill on">ใช้งานอยู่</span></dd></dl>`
      :'<p style="font-size:12.5px;color:var(--text3)">ยังไม่มีตราสัญลักษณ์ — ระบบใช้ตัวอักษร “ด” แทนชั่วคราว</p>'}
    </div></div>
   </div>
 </div>`;
 $('#pick').onclick=()=>{$('#logoFile').dataset.target='brand';$('#logoFile').click()};
 const d=$('#drop');
 d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('over')});
 d.addEventListener('dragleave',()=>d.classList.remove('over'));
 d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('over');
  const f=e.dataTransfer.files[0];if(f)readLogo(f)});
 const rm=$('#rmLogo');if(rm)rm.onclick=()=>{const old=DB.logo;DB.logo=null;persist();applyPrefs();render();
  toast('ลบตราสัญลักษณ์แล้ว',{type:'bad',undo:()=>{DB.logo=old;persist();applyPrefs();render()}})};
}
function readLogo(file){
 if(!/^image\//.test(file.type))return toast('กรุณาเลือกไฟล์รูปภาพ',{type:'warn'});
 if(file.size>40*1024)return toast('ไฟล์ใหญ่เกิน 40 KB — กรุณาย่อขนาดก่อน',{type:'warn'});
 const r=new FileReader();
 r.onload=e=>{
  const target=$('#logoFile').dataset.target;
  if(target==='field'){const f=S.b.fields.find(x=>x.id===S.b.sel);if(f){pushUndo();f.value=e.target.result;markDirty();render();toast('ใส่โลโก้ในฟิลด์แล้ว',{type:'ok'})}}
  else{const old=DB.logo;DB.logo=e.target.result;persist();applyPrefs();render();logAct('เปลี่ยนตราสัญลักษณ์โรงพยาบาล','ok');
   toast('อัปเดตตราสัญลักษณ์แล้ว',{type:'ok',undo:()=>{DB.logo=old;persist();applyPrefs();render()}});remote('uploadHeaderLogo',{base64Data:e.target.result})}
 };
 r.readAsDataURL(file);
}
$('#logoFile').onchange=e=>{const f=e.target.files[0];if(f)readLogo(f);e.target.value=''};

/* ============ PUBLIC ============ */
function vPublic(v){
 const active=DB.templates.filter(t=>t.is_active);
 if(!S.pub.tpl){
  v.innerHTML=head('public')+
   (active.length?`<div class="pub-grid">${active.map((t,i)=>`<article class="card" data-p="${t.id}" style="animation-delay:${i*35}ms">
     <div class="card-top"><h3>${esc(t.name)}</h3></div><p>${esc(t.description)}</p>
     <div class="thumb" data-t="${t.id}"><span class="thumb-tag">A4</span><div class="thumb-c"></div></div>
     <div class="card-meta"><span>${esc(t.department)}</span><span>${t.fields.filter(f=>INP.includes(f.field_type)).length} ช่องกรอก</span></div>
     <div class="card-acts"><button class="btn pri" data-p="${t.id}">${ic('edit',13)}กรอกฟอร์มนี้</button></div></article>`).join('')}</div>`
    :emptyBox('globe','ยังไม่มีฟอร์มที่เปิดรับ','ไปที่คลังแบบฟอร์มแล้วกดเผยแพร่เพื่อให้ผู้ใช้กรอกได้','<button class="btn pri" data-go2="forms">'+ic('forms')+'ไปคลังแบบฟอร์ม</button>'));
  v.onclick=e=>{const p=e.target.closest('[data-p]'),g=e.target.closest('[data-go2]');
   if(g)return go(g.dataset.go2);
   if(p){S.pub.tpl=p.dataset.p;render()}};
  requestAnimationFrame(()=>$$('.thumb').forEach(t=>{const c=$('.thumb-c',t),t0=tpl(t.dataset.t);if(!c||!t0)return;
   t0.fields.map(norm).forEach(f=>c.appendChild(fieldEl(f,'print',{})));
   c.style.transform=`scale(${t.clientWidth/(PW*MM)})`}));
  return;
 }
 const t=tpl(S.pub.tpl);
 if(!t){S.pub.tpl=null;return render()}
 S.pub.fields=t.fields.map(norm);
 v.innerHTML=`<div class="sec-head"><div class="sec-title"><h1>${esc(t.name)}</h1><p>${esc(t.description)}</p></div>
   <div class="sec-actions"><button class="btn" data-pub="back">${ic('chev')}เลือกฟอร์มอื่น</button></div></div>
  <div class="submitter"><h3>${ic('users',15)} ข้อมูลผู้ยื่นคำขอ (จำเป็น)</h3>
   <div class="sub-grid">
    <div class="fld" style="margin:0"><label>ชื่อ-นามสกุล</label><input id="pName" placeholder="เช่น นายสมชาย ใจดี" value="ผู้ดูแลระบบ"></div>
    <div class="fld" style="margin:0"><label>เลขบัตรประชาชน 13 หลัก</label><input id="pCid" inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
   </div>
   <p style="font-size:11.5px;color:var(--text2);margin-top:9px">${ic('lock',12)} เลขบัตรถูกแปลงเป็นค่าแฮชก่อนจัดเก็บ ใช้สำหรับตรวจสอบคำขอภายหลังเท่านั้น</p>
  </div>
  <div class="fill-wrap" id="fillWrap"><div class="zoom-box"><div class="a4" id="fillCanvas"></div></div></div>
  <div style="display:flex;gap:9px;justify-content:center;margin-top:15px">
   <button class="btn pri" data-pub="send">${ic('check')}ส่งคำขอ</button>
   <button class="btn" data-pub="clear">ล้างฟอร์ม</button>
   <button class="btn" data-pub="back">ยกเลิก</button></div>`;
 const c=paintCanvas('#fillCanvas',S.pub.fields,'fill');
 requestAnimationFrame(()=>zoomTo(c,fitOf($('#fillWrap'))));
 v.onclick=e=>{const b=e.target.closest('[data-pub]');if(!b)return;const k=b.dataset.pub;
  if(k==='back'){S.pub.tpl=null;render()}
  else if(k==='clear'){paintCanvas('#fillCanvas',S.pub.fields,'fill');zoomTo($('#fillCanvas'),fitOf($('#fillWrap')));toast('ล้างข้อมูลในฟอร์มแล้ว')}
  else if(k==='send')submitPublic(t)};
}
function submitPublic(t){
 const name=$('#pName').value.trim(),cid=$('#pCid').value.trim();
 if(!name)return toast('กรุณากรอกชื่อ-นามสกุลผู้ยื่น',{type:'warn'});
 if(!/^\d{13}$/.test(cid)){toast('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',{type:'warn'});$('#pCid').focus();return}
 const {data,miss}=collect($('#fillCanvas'),S.pub.fields);
 if(miss.length){
  const el=$(`#fillCanvas [data-fid="${miss[0].id}"]`);el?.scrollIntoView({block:'center',behavior:'smooth'});
  return toast('กรุณากรอก “'+(miss[0].label||miss[0].name)+'”'+(miss.length>1?' และอีก '+(miss.length-1)+' ช่อง':''),{type:'warn'});
 }
 const s={id:uid('sub_'),template_id:t.id,template_name:t.name,submitted_by_name:name,
  department:data.department||'—',status:'SUBMITTED',created_at:new Date().toISOString(),
  archived_at:null,reviewed_at:null,reviewed_by:null,data};
 DB.submissions.unshift(s);persist();paintCounts();logAct('คำขอใหม่ #'+ref(s.id)+' — '+t.name,'info');
 remote('submitFormAnonymous',{templateId:t.id,formData:data,citizenId:cid,fullName:name});
 $('#view').innerHTML=`<div class="ok-hero"><div class="oi">${ic('check',34)}</div>
  <h2>ส่งคำขอเรียบร้อยแล้ว</h2><p style="color:var(--text2)">ระบบบันทึกคำขอของท่านเข้าสู่กล่องพิจารณาของเจ้าหน้าที่</p>
  <div class="refbox">#${ref(s.id)}<button class="btn sm icon" id="cpRef" title="คัดลอก">${ic('copy',13)}</button></div>
  <p style="font-size:12.5px;color:var(--text3)">เก็บเลขอ้างอิงนี้ไว้ใช้ตรวจสอบสถานะคำขอ</p>
  <div style="display:flex;gap:9px;justify-content:center;margin-top:20px;flex-wrap:wrap">
   <button class="btn pri" data-ok="print">${ic('print')}พิมพ์เอกสาร</button>
   <button class="btn" data-ok="dl">${ic('dl')}ดาวน์โหลด HTML</button>
   <button class="btn" data-ok="inbox">${ic('inbox')}ไปกล่องคำขอ</button>
   <button class="btn" data-ok="more">${ic('plus')}ยื่นคำขออื่น</button></div></div>`;
 $('#cpRef').onclick=()=>{navigator.clipboard?.writeText(ref(s.id));toast('คัดลอกเลขอ้างอิงแล้ว',{type:'ok'})};
 $('#view').onclick=e=>{const b=e.target.closest('[data-ok]');if(!b)return;const k=b.dataset.ok;
  if(k==='print')printSheet(t.fields,s.data,t.name+' #'+ref(s.id));
  else if(k==='dl'){download(sheetHTML(t.fields,s.data,t.name,false),fname(t.name)+'_'+ref(s.id)+'.html');toast('ดาวน์โหลดแล้ว',{type:'ok'})}
  else if(k==='inbox'){S.pub.tpl=null;go('inbox')}
  else{S.pub.tpl=null;render()}};
}

/* ============ PALETTE ============ */
function commands(){
 const c=[];
 Object.entries(SECS).forEach(([k,x])=>c.push({g:'ไปยังหน้า',t:x[0],s:x[1],i:x[2],run:()=>go(k)}));
 c.push({g:'สร้าง',t:'สร้างฟอร์มใหม่',s:'เริ่มจากกระดาษเปล่าหรือโครงมาตรฐาน',i:'plus',run:newForm});
 c.push({g:'สร้าง',t:'เพิ่มบุคลากร',s:'ลงทะเบียนผู้ใช้ใหม่',i:'users',run:addStaff});
 c.push({g:'สร้าง',t:'บันทึกมุมมองกล่องคำขอ',s:'เก็บชุดตัวกรองไว้ใช้ซ้ำ',i:'bolt',run:()=>{go('inbox');saveView()}});
 c.push({g:'มุมมอง',t:'คำขอรอตรวจสอบทั้งหมด',s:'กรองเฉพาะสถานะรอตรวจ',i:'clock',run:()=>{S.inbox.status='SUBMITTED';S.inbox.sel.clear();go('inbox')}});
 c.push({g:'มุมมอง',t:'คลังคำขอถาวร',s:'รายการที่เก็บถาวรแล้ว',i:'arch',run:()=>{S.inbox.status='ARCHIVED';go('inbox')}});
 c.push({g:'มุมมอง',t:'ฟอร์มที่ยังไม่เผยแพร่',s:'ฉบับร่างทั้งหมด',i:'lock',run:()=>{S.forms.status='draft';go('forms')}});
 c.push({g:'ส่งออก',t:'ส่งออกคำขอเป็น CSV',s:'ตามตัวกรองปัจจุบัน',i:'csv',run:()=>csv([['เลขอ้างอิง','ผู้ยื่น','แบบฟอร์ม','สถานะ','ส่งเมื่อ'],...inboxList().map(s=>['#'+ref(s.id),s.submitted_by_name,s.template_name,ST[s.status],fdate(s.created_at)])],'dontum-submissions.csv')});
 c.push({g:'ส่งออก',t:'ส่งออกบุคลากรเป็น CSV',s:'ทะเบียนทั้งหมด',i:'csv',run:()=>csv([['ชื่อ','ตำแหน่ง','หน่วยงาน','สถานะ'],...DB.staff.map(s=>[s.full_name,s.position,s.department,s.is_active?'ปฏิบัติงาน':'ระงับสิทธิ์'])],'dontum-staff.csv')});
 c.push({g:'ตั้งค่า',t:'สลับธีมมืด/สว่าง',s:'Ctrl+J',i:'moon',run:toggleTheme});
 c.push({g:'ตั้งค่า',t:'สลับความหนาแน่นตาราง',s:'สบายตา / กระชับ',i:'rows',run:toggleDensity});
 c.push({g:'ตั้งค่า',t:S.live?'ตัดการเชื่อมต่อ API':'เชื่อมต่อ API จริง',s:S.live?'กลับไปใช้ข้อมูลตัวอย่าง':'ซิงก์กับ Apps Script + Supabase',i:'bolt',run:toggleLive});
 c.push({g:'ตั้งค่า',t:'รีเซ็ตข้อมูลตัวอย่าง',s:'ล้างการแก้ไขทั้งหมดกลับค่าเริ่มต้น',i:'refresh',run:resetData});
 c.push({g:'ช่วยเหลือ',t:'ดูคีย์ลัดทั้งหมด',s:'ปุ่ม ?',i:'help',run:showHelp});
 DB.templates.forEach(t=>c.push({g:'แบบฟอร์ม',t:t.name,s:(t.is_active?'เปิดใช้งาน':'ฉบับร่าง')+' · '+t.department,i:'forms',run:()=>{go('forms');formDrawer(t.id)}}));
 DB.staff.slice(0,30).forEach(s=>c.push({g:'บุคลากร',t:s.full_name,s:s.position+' · '+s.department,i:'users',run:()=>{go('staff');staffDrawer(s.id)}}));
 DB.submissions.slice(0,30).forEach(s=>c.push({g:'คำขอ',t:'#'+ref(s.id)+' · '+s.submitted_by_name,s:s.template_name,i:'inbox',run:()=>{go('inbox');subDrawer(s.id)}}));
 return c;
}
function openPalette(){
 $('#paletteScrim').hidden=false;$('#paletteInput').value='';S.palette.q='';S.palette.idx=0;
 paintPalette();setTimeout(()=>$('#paletteInput').focus(),30);
}
function closePalette(){$('#paletteScrim').hidden=true}
function paintPalette(){
 const q=S.palette.q.toLowerCase().trim();
 let items=commands();
 if(q)items=items.filter(c=>(c.t+' '+c.s+' '+c.g).toLowerCase().includes(q));
 items=items.slice(0,40);S.palette.items=items;
 if(S.palette.idx>=items.length)S.palette.idx=0;
 let html='',g='';
 items.forEach((c,i)=>{if(c.g!==g){g=c.g;html+=`<div class="pgroup">${esc(g)}</div>`}
  html+=`<div class="pitem${i===S.palette.idx?' cur':''}" data-pi="${i}"><span class="pi">${ic(c.i,15)}</span><b>${esc(c.t)}</b><small>${esc(c.s)}</small></div>`});
 $('#paletteList').innerHTML=html||'<div class="empty" style="margin:12px;padding:26px"><h3>ไม่พบคำสั่ง</h3><p>ลองคำอื่น เช่น “อนุมัติ”, “ส่งออก”, “บุคลากร”</p></div>';
 $$('.pitem').forEach(e=>e.onclick=()=>{const c=S.palette.items[+e.dataset.pi];closePalette();c?.run()});
 $('.pitem.cur')?.scrollIntoView({block:'nearest'});
}
$('#paletteInput').oninput=e=>{S.palette.q=e.target.value;S.palette.idx=0;paintPalette()};
$('#paletteInput').onkeydown=e=>{
 if(e.key==='ArrowDown'){e.preventDefault();S.palette.idx=Math.min(S.palette.idx+1,S.palette.items.length-1);paintPalette()}
 else if(e.key==='ArrowUp'){e.preventDefault();S.palette.idx=Math.max(S.palette.idx-1,0);paintPalette()}
 else if(e.key==='Enter'){e.preventDefault();const c=S.palette.items[S.palette.idx];closePalette();c?.run()}
};
$('#paletteScrim').onclick=e=>{if(e.target.id==='paletteScrim')closePalette()};
$('#omniBtn').onclick=openPalette;

/* ============ HELP / NOTIF / PREFS ============ */
const SHORTCUTS=[['Ctrl + K','เปิดคำสั่งด่วน'],['/','โฟกัสช่องค้นหา'],['?','คีย์ลัดทั้งหมด'],
 ['Ctrl + J','สลับธีมมืด/สว่าง'],['Ctrl + B','ย่อ/ขยายเมนู'],['Alt + 1…7','สลับหน้าตามลำดับเมนู'],
 ['Ctrl + S','บันทึกแบบฟอร์ม (หน้าออกแบบ)'],['Ctrl + Z','เลิกทำ'],['Ctrl + Shift + Z','ทำซ้ำ'],
 ['Delete','ลบฟิลด์ที่เลือก'],['ลูกศร','เลื่อนฟิลด์ 0.5 มม.'],['Shift + ลูกศร','เลื่อนฟิลด์ 5 มม.'],
 ['Ctrl + D','ทำสำเนาฟิลด์'],['Esc','ปิดหน้าต่าง/ลิ้นชัก'],['ดับเบิลคลิก','แก้ข้อความบนกระดาษ']];
function showHelp(){
 $('#helpBody').innerHTML=`<div class="help-grid">${SHORTCUTS.map(([k,d])=>
  `<div class="help-row"><span>${esc(d)}</span><span>${k.split(' + ').map(x=>`<kbd>${esc(x)}</kbd>`).join(' + ')}</span></div>`).join('')}</div>`;
 $('#helpScrim').hidden=false;
}
$('#helpBtn').onclick=showHelp;
function paintNotif(){
 const l=DB.activity;
 $('#notifList').innerHTML=l.length?l.map(a=>{
  const col={ok:'var(--ok-bg)',bad:'var(--bad-bg)',warn:'var(--warn-bg)',info:'var(--info-bg)'}[a.kind]||'var(--info-bg)';
  const icn={ok:'check',bad:'trash',warn:'warn',info:'info'}[a.kind]||'info';
  return `<div class="nrow"><span class="ni" style="background:${col}">${ic(icn,14)}</span><div><b>${esc(a.text)}</b><small>${ago(a.at)}</small></div></div>`}).join('')
  :'<p style="padding:22px;text-align:center;font-size:12.5px;color:var(--text3)">ยังไม่มีความเคลื่อนไหว</p>';
}
$('#bellBtn').onclick=()=>{const n=$('#notif');n.hidden=!n.hidden;if(!n.hidden){paintNotif();DB.activity.forEach(a=>a.read=true);persist();paintBell()}};
$('#notifClear').onclick=()=>{DB.activity=[];persist();paintNotif();paintBell()};
function toggleTheme(){DB.prefs.theme=DB.prefs.theme==='dark'?'light':'dark';persist();applyPrefs()}
function toggleDensity(){DB.prefs.density=DB.prefs.density==='compact'?'cozy':'compact';persist();applyPrefs();toast('ความหนาแน่น: '+(DB.prefs.density==='compact'?'กระชับ':'สบายตา'))}
function toggleLive(){
 S.live=!S.live;applyPrefs();
 if(S.live){toast('กำลังเชื่อมต่อ API จริง…');
  api('getPublicFormTemplates').then(d=>{
   if(Array.isArray(d)&&d.length){
    d.forEach(t=>{const ex=tpl(t.id);if(ex){ex.name=t.name;ex.description=t.description;ex.is_active=true;if(t.fields?.length)ex.fields=t.fields.map(norm)}
     else DB.templates.push({id:t.id,name:t.name,description:t.description||'',department:'—',is_active:true,
      created_at:t.created_at||new Date().toISOString(),updated_at:new Date().toISOString(),fields:(t.fields||[]).map(norm)})});
    persist();render();toast('ซิงก์แบบฟอร์มจาก API แล้ว '+d.length+' รายการ',{type:'ok'});
   } else toast('เชื่อมต่อสำเร็จ แต่ยังไม่เผยแพร่ฟอร์มใน API',{type:'warn'});
  }).catch(e=>{S.live=false;applyPrefs();toast('เชื่อมต่อไม่สำเร็จ: '+e.message+' — ใช้ข้อมูลตัวอย่างต่อ',{type:'bad'})});
 } else toast('กลับไปใช้ข้อมูลตัวอย่างในเครื่อง',{type:'info'});
}
function resetData(){
 modal('รีเซ็ตข้อมูลตัวอย่าง','<p style="font-size:13.5px">การกระทำนี้จะลบแบบฟอร์ม คำขอ และบุคลากรที่แก้ไขไว้ในเครื่องทั้งหมด แล้วกลับเป็นชุดข้อมูลตัวอย่างเริ่มต้น</p><p style="font-size:12.5px;color:var(--text3);margin-top:8px">ข้อมูลบนเซิร์ฟจริง (Supabase) ไม่ได้รับผลกระทบ</p>',
  '<button class="btn" data-close-modal>ยกเลิก</button><button class="btn bad" id="rsGo">'+ic('refresh')+'รีเซ็ตทั้งหมด</button>');
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#rsGo').onclick=()=>{const p=DB.prefs;DB=seed();DB.prefs=p;persist();closeModal();applyPrefs();go('forms');toast('รีเซ็ตข้อมูลตัวอย่างแล้ว',{type:'ok'})};
}
$('#themeBtn').onclick=toggleTheme;
$('#densityBtn').onclick=toggleDensity;
$('#modeChip').onclick=toggleLive;
$('#railToggle').innerHTML=ic('menu');
$('#railToggle').onclick=()=>{DB.prefs.rail=DB.prefs.rail==='mini'?'expanded':'mini';persist();applyPrefs()};
$$('.rail-item').forEach(b=>{const i=ic(SECS[b.dataset.go][2],18);$('i',b).innerHTML=i});
$('#omniBtn').querySelector('.omni-ico').innerHTML=ic('search',15);
$('.palette-input .omni-ico').innerHTML=ic('cmd',17);
$('#bellBtn').insertAdjacentHTML('afterbegin',ic('bell'));
$('#helpBtn').innerHTML=ic('help');
$('#drawerClose').innerHTML=ic('x');
$$('.modal header .ico-btn').forEach(b=>b.innerHTML=ic('x'));

/* preview modal for builder */
const pv=document.createElement('div');
pv.className='modal-scrim';pv.id='previewScrim';pv.hidden=true;
pv.innerHTML=`<div class="modal" style="width:min(940px,96vw)"><header><h3>ตัวอย่างการกรอกจริง</h3><button class="ico-btn" id="pvClose">${ic('x')}</button></header>
 <div class="modal-body" style="background:var(--surface3)"><div id="pvWrap" style="overflow:auto;max-height:66vh;display:flex;justify-content:center"><div class="zoom-box"><div class="a4" id="pvCanvas"></div></div></div></div>
 <footer><button class="btn" id="pvClose2">ปิด</button></footer></div>`;
document.body.appendChild(pv);
$('#pvClose').onclick=$('#pvClose2').onclick=()=>pv.hidden=true;
pv.onclick=e=>{if(e.target===pv)pv.hidden=true};

/* ============ KEYBOARD ============ */
const ORDER=['forms','builder','inbox','mine','staff','brand','public'];
document.addEventListener('keydown',e=>{
 const tag=(e.target.tagName||'').toLowerCase();
 const typing=tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable;
 const mod=e.ctrlKey||e.metaKey,k=(e.key||'').toLowerCase();
 if(mod&&k==='k'){e.preventDefault();return $('#paletteScrim').hidden?openPalette():closePalette()}
 if(k==='escape'){
  if(!$('#paletteScrim').hidden)return closePalette();
  if(!pv.hidden)return pv.hidden=true;
  if(!$('#modalScrim').hidden)return closeModal();
  if(!$('#helpScrim').hidden)return $('#helpScrim').hidden=true;
  if(!$('#notif').hidden)return $('#notif').hidden=true;
  if(!$('#drawer').hidden)return closeDrawer();
  return;
 }
 if(mod&&k==='j'){e.preventDefault();return toggleTheme()}
 if(mod&&k==='b'){e.preventDefault();return $('#railToggle').click()}
 if(e.altKey&&/^[1-7]$/.test(e.key)){e.preventDefault();return go(ORDER[+e.key-1])}
 if(!typing&&k==='/'){e.preventDefault();const s=$('.search input');if(s){s.focus();s.select()}else openPalette();return}
 if(!typing&&(e.key==='?'||(e.shiftKey&&k==='/'))){e.preventDefault();return showHelp()}
 if(S.sec!=='builder'||!S.b.id)return;
 if(mod&&k==='s'){e.preventDefault();return saveBuilder()}
 if(typing)return;
 if(mod&&k==='z'){e.preventDefault();return e.shiftKey?doRedo():doUndo()}
 if(!S.b.sel)return;
 if(mod&&k==='d'){e.preventDefault();return dupField(S.b.sel)}
 if(k==='delete'||k==='backspace'){e.preventDefault();return removeField(S.b.sel)}
 const dir={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[k];
 if(dir){e.preventDefault();const f=S.b.fields.find(x=>x.id===S.b.sel);if(!f)return;
  pushUndo();const st=e.shiftKey?5:(S.b.snap?.5:.1);
  f.pos_x=clamp(+(f.pos_x+dir[0]*st).toFixed(2),0,PW-f.width);
  f.pos_y=clamp(+(f.pos_y+dir[1]*st).toFixed(2),0,PH-f.height);
  const el=$(`#canvas [data-fid="${f.id}"]`);if(el){el.style.left=f.pos_x+'mm';el.style.top=f.pos_y+'mm'}
  syncGeom(f);markDirty()}
});
window.addEventListener('beforeunload',e=>{if(S.b.dirty){e.preventDefault();e.returnValue=''}});
window.addEventListener('resize',debounce(()=>{
 if(S.sec==='builder'&&S.b.id&&$('#canvas'))zoomTo($('#canvas'),S.b.zoom);
 if(S.sec==='public'&&S.pub.tpl&&$('#fillCanvas'))zoomTo($('#fillCanvas'),fitOf($('#fillWrap')));
},180));
document.addEventListener('click',e=>{
 if(!$('#notif').hidden&&!e.target.closest('#notif')&&!e.target.closest('#bellBtn'))$('#notif').hidden=true;
});

/* ============ INIT ============ */
applyPrefs();paintBell();paintCounts();
if(!DB.activity.length){
 logAct('ยินดีต้อนรับสู่แผงจัดการรุ่นใหม่ — กด Ctrl+K เพื่อเริ่ม','info');
 logAct('มีคำขอรอตรวจสอบ '+DB.submissions.filter(s=>s.status==='SUBMITTED'&&!s.archived_at).length+' รายการ','warn');
}
go('forms');

/* ============================================================
   POLISH PATCH — override + รายละเอียดเล็ก ๆ
   ============================================================ */
let _lastSec = null, _lastRender = 0, _lastFocus = null;

/* --- toast: จำกัด stack สูงสุด 4 ใบ --- */
function toast(message, opt = {}) {
  const wrap = $('#toasts');
  while (wrap.children.length >= 4) wrap.firstElementChild.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + (opt.type || 'info');
  const icons = { ok: 'check', bad: 'x', warn: 'warn', info: 'info' };
  t.innerHTML = `<span class="ti">${ic(icons[opt.type || 'info'], 15)}</span><b>${esc(message)}</b>` +
    (opt.undo ? `<button class="undo">เลิกทำ</button>` : '') +
    `<button class="tx">${ic('x', 13)}</button><i class="life"></i>`;
  wrap.appendChild(t);
  const life = opt.ms || (opt.undo ? 7000 : 3600);
  const bar = $('.life', t);
  bar.style.transition = `width ${life}ms linear`;
  requestAnimationFrame(() => { bar.style.width = '0%'; });
  bar.style.width = '100%';
  let done = false;
  const kill = () => { if (done) return; done = true; t.classList.add('out'); setTimeout(() => t.remove(), 220); };
  const timer = setTimeout(kill, life);
  $('.tx', t).onclick = () => { clearTimeout(timer); kill(); };
  if (opt.undo) $('.undo', t).onclick = () => { clearTimeout(timer); kill(); opt.undo(); };
  return t;
}

/* --- prefs: ปลด pre-mini + tooltip rail --- */
function applyPrefs() {
  document.documentElement.dataset.theme = DB.prefs.theme;
  document.documentElement.dataset.density = DB.prefs.density;
  document.body.classList.toggle('rail-mini', DB.prefs.rail === 'mini');
  document.documentElement.classList.remove('pre-mini');
  $('#themeBtn').innerHTML = ic(DB.prefs.theme === 'dark' ? 'sun' : 'moon');
  $('#densityBtn').innerHTML = ic(DB.prefs.density === 'compact' ? 'rows' : 'grid');
  $('#modeChip').textContent = S.live ? '● LIVE API' : '● ข้อมูลตัวอย่าง';
  $('#modeChip').classList.toggle('live', S.live);
  const l = DB.logo;
  $('#brandMark').innerHTML = l ? `<img src="${l}" alt="ตรา">` : 'ด';
  $$('.rail-item').forEach(b => { b.title = (SECS[b.dataset.go] || [''])[0]; });
}

/* --- counts: builder แสดงจำนวนฟอร์มทั้งหมด + กัน quota ว่าง --- */
function paintCounts() {
  const pend = DB.submissions.filter(s => s.status === 'SUBMITTED' && !s.archived_at).length;
  const map = {
    forms: DB.templates.length,
    builder: DB.templates.length,
    inbox: pend,
    mine: DB.submissions.filter(s => s.submitted_by_name === 'ผู้ดูแลระบบ').length,
    staff: DB.staff.filter(s => s.is_active).length
  };
  $$('[data-cnt]').forEach(e => {
    const v = map[e.dataset.cnt];
    e.textContent = v ?? '';
    e.hidden = v === undefined || v === 0;
  });
  const m = DB.submissions.filter(s => Date.now() - new Date(s.created_at) < 30 * 864e5).length;
  $('#quotaNum').textContent = m;
  $('#quotaBar').style.width = clamp(m / 60 * 100, 4, 100) + '%';
  $('#quotaHint').textContent = m ? `เป้าหมาย 60 ฉบับ · ${Math.round(m / 60 * 100)}%` : 'ยังไม่มีคำขอใน 30 วัน';
}

/* --- router: ไม่เลื่อน smooth + aria-current --- */
function go(sec) {
  if (!SECS[sec]) return;
  if (S.sec === 'builder' && S.b.dirty && sec !== 'builder') {
    if (!confirm('มีการแก้ไขแบบฟอร์มที่ยังไม่บันทึก ต้องการออกหรือไม่?')) return;
  }
  S.sec = sec;
  $$('.rail-item').forEach(b => {
    const on = b.dataset.go === sec;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('#crumbs').innerHTML = `<span>แผงจัดการ</span>${ic('chev', 12)}<b>${esc(SECS[sec][0])}</b>`;
  $('#main').scrollTop = 0;
  render();
}

/* --- render: กดตัวกรองรัว ๆ ไม่ให้การ์ดกระพริบซ้ำ --- */
function render() {
  const v = $('#view');
  const fast = (S.sec === _lastSec && Date.now() - _lastRender < 700);
  _lastSec = S.sec; _lastRender = Date.now();
  ({ forms: vForms, builder: vBuilder, inbox: vInbox, mine: vMine,
     staff: vStaff, brand: vBrand, public: vPublic }[S.sec])(v);
  if (fast) {
    v.classList.add('no-anim');
    requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove('no-anim')));
  }
  paintCounts();
  const h = $('.sec-head', v);
  if (h) h.classList.toggle('scrolled', $('#main').scrollTop > 8);
}

/* --- builder: วัด zoom หลัง layout นิ่งแล้ว --- */
function openBuilder(id) {
  const t = tpl(id); if (!t) return;
  S.b = { id, fields: JSON.parse(JSON.stringify(t.fields)).map(norm), sel: null,
          zoom: S.b.zoom || .72, grid: S.b.grid, snap: S.b.snap,
          dirty: false, undo: [], redo: [], saving: false };
  go('builder');
  requestAnimationFrame(() => {
    const w = $('#cwrap'), c = $('#canvas');
    if (w && c && w.clientWidth > 0) {
      S.b.zoom = fitOf(w);
      zoomTo(c, S.b.zoom);
      const z = $('#zLbl'); if (z) z.textContent = Math.round(S.b.zoom * 100) + '%';
    }
  });
}

/* --- drawer: จับโฟกัสเข้า / คืนโฟกัสเดิม --- */
function openDrawer(kicker, title, body, foot, ctx) {
  _lastFocus = document.activeElement;
  drawerCtx = ctx || null;
  $('#drawerKicker').textContent = kicker;
  $('#drawerTitle').textContent = title;
  $('#drawerBody').innerHTML = body;
  $('#drawerFoot').innerHTML = foot || '';
  $('#drawer').hidden = false;
  $('#drawerScrim').hidden = false;
  setTimeout(() => $('#drawerClose').focus(), 40);
}
function closeDrawer() {
  $('#drawer').hidden = true;
  $('#drawerScrim').hidden = true;
  drawerCtx = null;
  if (_lastFocus && document.contains(_lastFocus)) _lastFocus.focus();
  _lastFocus = null;
}

/* --- head shadow ตามการเลื่อน --- */
$('#main').addEventListener('scroll', () => {
  const h = $('#view .sec-head');
  if (h) h.classList.toggle('scrolled', $('#main').scrollTop > 8);
}, { passive: true });

/* --- Esc ล้างช่องค้นหา --- */
['fq', 'iq', 'mq', 'tq'].forEach(id => {
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const el = document.getElementById(id);
    if (el && document.activeElement === el && el.value) {
      e.stopPropagation();
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, true;
});

/* --- boot: ปลด class หลัง paint แรก + tooltip rail --- */
document.addEventListener('DOMContentLoaded', () => {
  $$('.rail-item').forEach(b => { b.title = (SECS[b.dataset.go] || [''])[0]; });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('boot')));
});
