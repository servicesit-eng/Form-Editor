'use strict';
/* ============================================================
   DONTUM e-FORM · UNIFIED APP  ·  PRODUCTION EDITION
   แก้หลัก: แผงคุณสมบัติผูกกับฟิลด์ที่_render_ไว้ (ไม่ใช้ selection ปัจจุบัน)
   → แก้บั๊กแก้กล่อง A แล้วคลิกกล่อง B ค่า/พิกัดของ A ไปทับ B
   ============================================================ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,9);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
const idle=fn=>('requestIdleCallback'in window)?requestIdleCallback(fn,{timeout:900}):setTimeout(fn,60);
const MM=96/25.4, PW=210, PH=297;
const API_URL='https://script.google.com/macros/s/AKfycbwlBmF7UCDh1b-DlGy6uzT_Vot2J0Z02EoLoCRm5XFjtra1nDzCBD-cBHJ_8Yl6hX6oig/exec';
const KEY='dontum.console.v1', OUTBOX_KEY='dontum.outbox.v1', CACHE_KEY='dontum.cache.v1';

const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid=v=>UUID_RE.test(String(v||''));
const isServerId=isUuid;
const isLocalId=v=>/^(tmp_|tpl_|sub_|stf_|f_|sv_|a_|job_)/.test(String(v||''));
function repairUuid(v){
 const s=String(v||'').trim();
 if(isUuid(s))return s.toLowerCase();
 const h=s.replace(/[^0-9a-f]/gi,'').toLowerCase();
 if(h.length===32)return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
 return null;
}
const tmpId=p=>'tmp_'+uid(p||'f_');

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
lock:'M5 11h14v10H5z M8 11V7a4 4 0 018 0v4',refresh:'M21 12a9 9 0 11-3-6.7L21 8 M21 3v5h-5',
home:'M3 10l9-7 9 7v10h-6v-6H9v6H3z',logout:'M9 21H5V3h4 M16 17l5-5-5-5 M21 12H9',
broom:'M19 4l-9 9 M4 20l6-6 4 4-6 6z M14 14l6-6',list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
cloud:'M18 18H7a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0118 18z',
layers:'M12 2l9 5-9 5-9-5z M3 12l9 5 9-5 M3 17l9 5 9-5',target:'M12 21a9 9 0 100-18 9 9 0 000 18 M12 16a4 4 0 100-8 4 4 0 000 8 M12 12h.01'
};
const ic=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${(P[n]||'').split(' M').map((d,i)=>`<path d="${i?'M'+d:d}"/>`).join('')}</svg>`;

const DEPTS=['งานเทคโนโลยีสารสนเทศ','งานพัสดุ','งานทรัพยากรบุคคล','งานสารบรรณ','งานช่างเทคนิค','งานพัฒนาคุณภาพ','งานยานพาหนะ','กลุ่มงานเวชศาสตร์ครอบครัว'];
const NAMES=[['นาย','สมชาย','ใจดี'],['นาง','สมหญิง','รักงาน'],['นางสาว','พรทิพย์','แสงทอง'],['นาย','อนุชา','มั่นคง'],['นางสาว','กัลยา','ศรีสุข'],['นาย','ธีรพงษ์','พัฒนกุล'],['นาง','วิไลพร','บุญมา'],['นาย','ปกรณ์','ชัยยะ'],['นางสาว','ชญานิศ','ทองใบ'],['นาย','ศุภกร','วงศ์สุวรรณ'],['นาง','รัตนา','พงษ์ศรี'],['นาย','จิรวัฒน์','อินทร์แก้ว'],['นางสาว','เบญจวรรณ','สุขใจ'],['นาย','ณัฐพล','แก้วมณี'],['นาง','สุภาพร','ดำรงค์'],['นาย','วิทยา','พูนผล'],['นางสาว','อารยา','จันทร์เพ็ญ'],['นาย','เอกชัย','ศรีเมือง']];
const POS=['นักวิชาการคอมพิวเตอร์','เจ้าพนักงานพัสดุ','นักทรัพยากรบุคคล','เจ้าพนักงานธุรการ','ช่างเทคนิค','พยาบาลวิชาชีพ','นายแพทย์ชำนาญการ','เจ้าพนักงานยานพาหนะ','นักวิเคราะห์นโยบายและแผน'];
const FT=['label','title','logo','text_input','textarea','date','radio','checkbox','select','signature','checkbox_agree','divider'];
const INP=['text_input','textarea','date','radio','checkbox','select','signature','checkbox_agree'];
const OPT=['radio','checkbox','select'];
const FTL={label:'ข้อความ',title:'หัวข้อ',logo:'โลโก้',text_input:'ช่องข้อความ',textarea:'ข้อความยาว',date:'วันที่',radio:'ตัวเลือกเดียว',checkbox:'หลายตัวเลือก',select:'รายการเลือก',signature:'ลายเซ็น',checkbox_agree:'ยอมรับข้อตกลง',divider:'เส้นคั่น'};
const FTI={label:'text',title:'title',logo:'image',text_input:'input',textarea:'area',date:'date',radio:'radio',checkbox:'cbx',select:'sel',signature:'sign',checkbox_agree:'agree',divider:'div'};
const ST={SUBMITTED:'รอตรวจสอบ',APPROVED:'อนุมัติแล้ว',REJECTED:'ไม่อนุมัติ'};

function mkF(t,o={}){return Object.assign({id:tmpId('f_'),field_type:t,name:t+'_'+Math.random().toString(36).slice(2,6),label:FTL[t],value:'',options:OPT.includes(t)?['ตัวเลือก 1','ตัวเลือก 2']:null,required:false,pos_x:15,pos_y:20,width:70,height:8,font_size:14,font_family:'Noto Sans Thai',font_weight:'normal',text_color:'#111111',bg_color:'transparent',border_style:'dotted',border_color:'#333333',text_align:'left'},o)}
function baseFields(title){
 return [
  mkF('title',{name:'doc_title',label:'หัวเรื่อง',value:title,pos_x:20,pos_y:22,width:170,height:11,font_size:17,font_weight:'bold',text_align:'center',border_style:'none'}),
  mkF('label',{name:'org',label:'หน่วยงาน',value:'โรงพยาบาลดอนตูม  จังหวัดนครปฐม',pos_x:20,pos_y:34,width:170,height:7,font_size:13,text_align:'center',border_style:'none'}),
  mkF('divider',{name:'ln1',pos_x:20,pos_y:44,width:170,height:2,border_style:'none',border_color:'#0E7C86'}),
  mkF('label',{name:'lb_name',label:'ชื่อ',value:'ข้าพเจ้า (นาย/นาง/นางสาว)',pos_x:20,pos_y:52,width:52,height:7,border_style:'none',font_size:13}),
  mkF('text_input',{name:'full_name',label:'ชื่อ-นามสกุล',required:true,pos_x:72,pos_y:52,width:118,height:8}),
  mkF('label',{name:'lb_pos',label:'ตำแหน่ง',value:'ตำแหน่ง',pos_x:20,pos_y:64,width:24,height:7,border_style:'none',font_size:13}),
  mkF('text_input',{name:'position',label:'ตำแหน่ง',required:true,pos_x:44,pos_y:64,width:70,height:8}),
  mkF('select',{name:'department',label:'หน่วยงาน',required:true,pos_x:118,pos_y:64,width:72,height:8,options:DEPTS.slice()}),
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
  created_at:new Date(now-(40-i*3)*D).toISOString(),updated_at:new Date(now-(i*2+1)*D).toISOString(),fields:baseFields(t[0])}));
 const subs=[];
 for(let i=0;i<24;i++){
  const t=templates[i%templates.length],n=NAMES[i%NAMES.length];
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
   else data[f.name]='ขอความอนุเคราะห์ดำเนินการตามรายละเอียดที่แนบมาพร้อมนี้ เพื่อสนับสนุนการปฏิบัติงานของหน่วยงาน';
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
 return {templates,submissions:subs,staff,logo:null,favorites:[],savedViews:[],activity:[],deptMap:{},
  prefs:{theme:'light',density:'cozy',rail:'expanded',shell:'public'}};
}

/* ---------- store ---------- */
let DB;
try{DB=JSON.parse(localStorage.getItem(KEY))||seed()}catch(e){DB=seed()}
if(!DB||!Array.isArray(DB.templates)||!DB.templates.length)DB=seed();
DB.prefs=Object.assign({theme:'light',density:'cozy',rail:'expanded',shell:'public'},DB.prefs||{});
['favorites','savedViews','activity','submissions','staff'].forEach(k=>{if(!Array.isArray(DB[k]))DB[k]=[]});
DB.deptMap=DB.deptMap&&typeof DB.deptMap==='object'?DB.deptMap:{};
let PURGED=0;
(function sanitize(){
 const fix=(arr,pfx)=>{const out=[];(arr||[]).forEach(it=>{
  if(!it||!it.id){PURGED++;return}
  const r=repairUuid(it.id);
  if(r){it.id=r;out.push(it);return}
  if(String(it.id).indexOf(pfx)===0){out.push(it);return}
  PURGED++});return out};
 DB.templates=fix(DB.templates,'tpl_');
 DB.submissions=fix(DB.submissions,'sub_');
 DB.staff=fix(DB.staff,'stf_');
 DB.templates.forEach(t=>{t.fields=(Array.isArray(t.fields)?t.fields:[]).map(f=>{
  const r=repairUuid(f.id);if(r)f.id=r;else if(!isLocalId(f.id))f.id=tmpId('f_');return f})});
 const ids=new Set(DB.templates.map(t=>t.id));
 const b=DB.submissions.length;
 DB.submissions=DB.submissions.filter(s=>ids.has(s.template_id)||String(s.id).indexOf('sub_')===0);
 PURGED+=b-DB.submissions.length;
 DB.favorites=DB.favorites.filter(i=>ids.has(i));
})();
const persist=debounce(()=>idle(()=>{try{
 localStorage.setItem(KEY,JSON.stringify(Object.assign({},DB,{submissions:DB.submissions.slice(0,400),activity:DB.activity.slice(0,30)})));
}catch(e){}}),600);

let accessToken=null;try{accessToken=localStorage.getItem('access_token')}catch(e){}
const S={
 shell:'public',live:true,meName:'',meRole:'',
 pubView:'home',pubQ:'',
 fill:{tpl:null,fields:[],data:{},mode:'paper',zoom:0,errors:{}},
 lastSub:null,
 forms:{q:'',status:'all',dept:'all',sort:'updated',view:'grid',fav:false},
 inbox:{tpl:'all',status:'ALL',q:'',sort:'newest',sel:new Set()},
 mine:{q:'',status:'all'},
 staff:{q:'',dept:'all',active:'all',sort:'name',sel:new Set()},
 b:{id:null,fields:[],deleted:[],sel:null,propFid:null,zoom:.72,grid:true,snap:true,dirty:false,undo:[],redo:[],saving:false,showOverlap:true},
 palette:{q:'',idx:0,items:[]},
 loadedSubTpl:new Set()
};
const ref=id=>{const d=String(id).replace(/\D/g,'');
 return (d.length>=4?d.slice(-6):String(id).replace(/[^a-zA-Z0-9]/g,'').slice(0,6).toUpperCase()).padStart(6,'0')};
const refOf=s=>s.referenceId||ref(s.id);
const tpl=id=>DB.templates.find(t=>t.id===id);
const sub=id=>DB.submissions.find(s=>s.id===id);
const stf=id=>DB.staff.find(s=>s.id===id);
const ago=iso=>{const d=(Date.now()-new Date(iso))/1000;if(!isFinite(d))return'—';
 if(d<60)return'เมื่อครู่';if(d<3600)return Math.floor(d/60)+' นาทีที่แล้ว';
 if(d<86400)return Math.floor(d/3600)+' ชม.ที่แล้ว';if(d<2592000)return Math.floor(d/86400)+' วันที่แล้ว';
 return new Date(iso).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})};
const fdate=iso=>{const d=new Date(iso);return isNaN(d)?'—':d.toLocaleString('th-TH',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'})};
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const avStyle=n=>`background:linear-gradient(145deg,hsl(${hue(n)} 62% 46%),hsl(${(hue(n)+42)%360} 68% 38%))`;
const err=e=>e&&e.message?e.message:'เกิดข้อผิดพลาด';

/* ---------- injected UI css ---------- */
const APP_CSS=`
.fill-toolbar{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;border-radius:14px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-1)}
.fill-toolbar .sp{flex:1}
.fill-progress{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--text2)}
.fill-progress .pb{width:92px;height:7px;border-radius:99px;background:var(--surface3);overflow:hidden;border:1px solid var(--line)}
.fill-progress .pb i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,var(--petrol-500),var(--emerald));transition:width .3s var(--ease)}
.fill-progress.done{color:var(--ok-ink)}
.fill-zoom{display:flex;gap:4px;align-items:center}
.fill-simple{display:flex;flex-direction:column;gap:12px}
.fs-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 17px;box-shadow:var(--shadow-1)}
.fs-card.err{border-color:var(--crimson);box-shadow:0 0 0 3px rgba(244,63,94,.12)}
.fs-q{display:flex;align-items:baseline;gap:8px;font-size:14px;font-weight:700;margin-bottom:9px}
.fs-q .n{font-family:var(--mono);font-size:11px;color:var(--text3)}
.fs-q .rq{color:var(--crimson)}
.fs-hint{font-size:11.5px;color:var(--text3);margin-top:7px}
.fs-err{font-size:12px;color:var(--bad-ink);background:var(--bad-bg);border-radius:8px;padding:6px 10px;margin-top:8px;font-weight:600}
.fs-in{width:100%;padding:11px 13px;border-radius:10px;border:1px solid var(--line2);background:var(--surface2);font-size:15px;font-family:inherit;outline:0}
.fs-in:focus{border-color:var(--petrol-400);box-shadow:0 0 0 3px rgba(14,124,134,.16);background:#fff}
textarea.fs-in{min-height:110px;resize:vertical;line-height:1.6}
.fs-opts{display:flex;flex-direction:column;gap:8px}
.fs-opt{display:flex;align-items:flex-start;gap:10px;padding:11px 13px;border-radius:10px;border:1px solid var(--line2);background:var(--surface2);cursor:pointer;font-size:14.5px;line-height:1.5}
.fs-opt.on{border-color:var(--petrol-500);background:color-mix(in srgb,var(--cyan) 12%,#fff);font-weight:600}
.fs-opt input{margin-top:3px;width:18px;height:18px;accent-color:var(--petrol-500);flex:none}
.fill-acts{position:sticky;bottom:0;z-index:20;padding:12px 0 6px;margin-top:14px;background:linear-gradient(180deg,transparent,var(--bg) 34%);display:flex;gap:9px;justify-content:center;flex-wrap:wrap}
.a4.fill-live{height:auto;min-height:297mm}
.a4.fill-live .cf{overflow:visible}
.a4.fill-live .fci,.a4.fill-live .cf .fc{pointer-events:auto}
.a4.fill-live .cf.ferr{outline:2px solid var(--crimson);background:#FFF1F2!important;border-radius:3px}
.a4.fill-live input[type=radio],.a4.fill-live input[type=checkbox]{width:15px;height:15px;accent-color:var(--petrol-500);flex:none}
.a4.fill-live select.fci{background:#fff;border:1px solid var(--line2);border-radius:4px;padding:0 4px}
.fill-note{font-size:12px;color:var(--text2);background:var(--info-bg);border:1px solid color-mix(in srgb,var(--blue) 26%,var(--line));border-radius:10px;padding:9px 12px;margin-bottom:12px;display:flex;gap:8px}
#netChip{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;padding:5px 10px;border-radius:99px;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.45);color:#7FF0C4;cursor:pointer;white-space:nowrap}
#netChip.busy{background:rgba(34,211,238,.18);border-color:rgba(34,211,238,.5);color:#9BEBF5}
#netChip.warn{background:rgba(245,158,11,.2);border-color:rgba(245,158,11,.5);color:#FCD34D}
/* ===== production builder additions ===== */
.prop-head{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--line);background:linear-gradient(100deg,color-mix(in srgb,var(--cyan) 12%,var(--surface2)),var(--surface2))}
.prop-head .tg{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;background:linear-gradient(145deg,var(--petrol-500),var(--petrol-400));color:#fff;flex:none}
.prop-head .nm{flex:1;min-width:0}
.prop-head .nm b{display:block;font-size:12.5px;font-weight:800;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prop-head .nm small{display:block;font-family:var(--mono);font-size:9.5px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prop-head .lk{font-size:9.5px;font-weight:800;letter-spacing:.06em;padding:3px 7px;border-radius:99px;background:var(--ok-bg);color:var(--ok-ink);white-space:nowrap}
.cf.ovl{box-shadow:0 0 0 2px var(--amber),0 0 0 6px rgba(245,158,11,.2)!important}
.cf.ovl::before{content:'ซ้อนทับ';position:absolute;top:-7px;left:0;font-size:8px;font-weight:800;padding:1px 5px;border-radius:99px;background:var(--amber);color:#3A2400;z-index:30;pointer-events:none}
.ovl-chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:99px;font-size:11.5px;font-weight:800;border:1px solid var(--line2);background:var(--surface);color:var(--text2);cursor:pointer}
.ovl-chip.on{background:var(--warn-bg);border-color:var(--amber);color:var(--warn-ink)}
.ovl-chip.clean{background:var(--ok-bg);border-color:color-mix(in srgb,var(--emerald) 40%,var(--line));color:var(--ok-ink);cursor:default}
.layer .ov{color:var(--amber);flex:none;display:grid;place-items:center}
.prop-lock{font-size:10.5px;color:var(--text3);padding:6px 10px;border-radius:8px;background:var(--surface3);border:1px dashed var(--line2);margin-bottom:10px;display:flex;gap:6px;align-items:flex-start;line-height:1.45}
`;
function injectCss(){if(document.getElementById('appInjectCss'))return;
 const s=document.createElement('style');s.id='appInjectCss';s.textContent=APP_CSS;document.head.appendChild(s)}

/* ---------- toast ---------- */
function toast(msg,opt={}){
 const wrap=$('#toasts');if(!wrap)return;
 while(wrap.children.length>=3){const o=wrap.firstElementChild;if(o&&o._timer)clearTimeout(o._timer);o.remove()}
 const t=document.createElement('div');
 t.className='toast '+(opt.type||'info');
 const icons={ok:'check',bad:'x',warn:'warn',info:'info'};
 t.innerHTML=`<span class="ti">${ic(icons[opt.type||'info'],15)}</span><b>${esc(msg)}</b>`+
  (opt.undo?`<button class="undo">เลิกทำ</button>`:'')+`<button class="tx">${ic('x',13)}</button><i class="life"></i>`;
 wrap.appendChild(t);
 const life=opt.ms||(opt.undo?6500:3200);
 const bar=$('.life',t);bar.style.transition=`width ${life}ms linear`;bar.style.width='100%';
 requestAnimationFrame(()=>bar.style.width='0%');
 let done=false;const kill=()=>{if(done)return;done=true;t.classList.add('out');setTimeout(()=>t.remove(),200)};
 t._timer=setTimeout(kill,life);
 $('.tx',t).onclick=()=>{clearTimeout(t._timer);kill()};
 if(opt.undo)$('.undo',t).onclick=()=>{clearTimeout(t._timer);kill();opt.undo()};
 return t;
}
function logAct(text,kind='info'){DB.activity.unshift({id:uid('a_'),text,kind,at:new Date().toISOString(),read:false});DB.activity=DB.activity.slice(0,30);persist();paintBell()}

/* ---------- network ---------- */
const TTL={getPublicFormTemplates:90e3,getFormTemplates:90e3,getHeaderLogo:600e3,getStaffDirectory:180e3,getFormTemplate:120e3,getFormSubmissions:45e3,getMySubmissions:45e3};
const NET={cache:new Map(),inflight:new Map(),active:0,max:2};
try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}');Object.keys(c).forEach(k=>NET.cache.set(k,c[k]))}catch(e){}
const cacheSave=debounce(()=>idle(()=>{try{const o={};let n=0;for(const[k,v]of NET.cache){if(n++>40)break;o[k]=v}localStorage.setItem(CACHE_KEY,JSON.stringify(o))}catch(e){}}),1200);
let OUTBOX=[];try{OUTBOX=JSON.parse(localStorage.getItem(OUTBOX_KEY))||[]}catch(e){OUTBOX=[]}
const outboxSave=debounce(()=>{try{localStorage.setItem(OUTBOX_KEY,JSON.stringify(OUTBOX.slice(-40)))}catch(e){}},300);
function rawApi(action,payload,withToken){
 const u=new URL(API_URL);u.searchParams.set('action',action);
 const body=Object.assign({},payload);
 if(withToken&&accessToken)body.token=accessToken;
 return fetch(u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'})
  .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
  .then(j=>{if(!j.ok)throw new Error(j.error||'API error');return j.data});
}
function guardIds(p){
 for(const k of ['id','templateId','staffId','submissionId']){
  const v=p[k];if(v===undefined||v===null||v==='')continue;
  if(isUuid(v))continue;
  const r=repairUuid(v);if(r){p[k]=r;continue}
  if(isLocalId(v))throw new Error('รายการนี้ยังเป็นข้อมูลในเครื่อง');
  throw new Error('รหัสไม่ถูกต้อง (ไม่ใช่ UUID)');
 }
}
function get(action,payload={},opt={}){
 if(!S.live)return Promise.resolve(null);
 const withToken=opt.token!==false;
 try{guardIds(payload)}catch(e){return Promise.reject(e)}
 const key=action+'|'+JSON.stringify(payload)+'|'+(withToken?'t':'p');
 const hit=NET.cache.get(key),ttl=opt.ttl??TTL[action]??60e3;
 if(hit&&!opt.force&&Date.now()-hit.t<ttl)return Promise.resolve(hit.d);
 if(NET.inflight.has(key))return NET.inflight.get(key);
 const p=rawApi(action,payload,withToken).then(d=>{NET.cache.set(key,{t:Date.now(),d});cacheSave();NET.inflight.delete(key);return d})
  .catch(e=>{NET.inflight.delete(key);throw e});
 NET.inflight.set(key,p);
 return hit?Promise.resolve(hit.d):p;
}
function invalidate(prefix){[...NET.cache.keys()].forEach(k=>{if(!prefix||k.startsWith(prefix))NET.cache.delete(k)});cacheSave()}
function enqueue(action,payload,label){
 if(!S.live||!accessToken)return;
 try{guardIds(payload)}catch(e){return}
 OUTBOX.push({id:uid('job_'),action,payload,label:label||action,tries:0,next:0});
 outboxSave();paintNet();pump();
}
function pump(){
 while(NET.active<NET.max){
  const job=OUTBOX.find(j=>j.next<=Date.now());if(!job)break;
  NET.active++;job.next=Date.now()+30e3;paintNet();
  rawApi(job.action,job.payload,true).then(()=>{
   OUTBOX=OUTBOX.filter(j=>j.id!==job.id);
   invalidate(job.action==='saveFormLayout'?'getFormTemplate':null);
  }).catch(e=>{
   job.tries++;
   if(job.tries>=4){OUTBOX=OUTBOX.filter(j=>j.id!==job.id);toast('ส่ง “'+job.label+'” ไม่สำเร็จ: '+e.message,{type:'bad',ms:6000})}
   else job.next=Date.now()+Math.min(30e3,2000*Math.pow(2,job.tries));
  }).finally(()=>{NET.active--;outboxSave();paintNet();setTimeout(pump,120)});
 }
 if(OUTBOX.some(j=>j.next>Date.now()))setTimeout(pump,1200);
}
function paintNet(){
 const el=document.getElementById('netChip');if(!el)return;
 const pend=OUTBOX.length;
 el.classList.toggle('busy',NET.active>0);
 el.classList.toggle('warn',pend>0&&NET.active===0);
 el.innerHTML=NET.active>0?(ic('cloud',13)+' กำลังส่ง '+NET.active):pend>0?(ic('clock',13)+' คิว '+pend):(ic('check',13)+' ซิงก์แล้ว');
 el.title=pend>0?'รอส่ง '+pend+' รายการ — คลิกเพื่อส่งทันที':'ซิงก์กับเซิร์ฟเวอร์แล้ว';
}
function flushOutbox(){OUTBOX.forEach(j=>j.next=0);pump();toast('กำลังส่งคิวทั้งหมด…',{type:'info',ms:1500})}

/* ---------- sync ---------- */
function applyTemplates(list,activeOnly){
 if(!Array.isArray(list)||!list.length)return;
 const keep=DB.templates.filter(t=>isLocalId(t.id));
 const server=list.filter(t=>isUuid(t.id)).map(t=>{
  const ex=tpl(t.id);
  if(ex&&ex.department&&ex.department!=='—')DB.deptMap[t.id]=ex.department;
  return {id:String(t.id).toLowerCase(),name:t.name,description:t.description||'',
   department:DB.deptMap[t.id]||(ex&&ex.department)||'—',is_active:activeOnly?true:t.is_active===true,
   created_at:t.created_at||new Date().toISOString(),updated_at:t.updated_at||t.created_at||new Date().toISOString(),
   fields:(t.fields&&t.fields.length)?t.fields.map(norm):((ex&&ex.fields)||[])};
 });
 DB.templates=keep.concat(server);persist();
}
function syncPublic(){
 if(!S.live)return Promise.resolve();
 return Promise.all([get('getPublicFormTemplates',{},{token:false}).catch(()=>null),get('getHeaderLogo',{},{token:false}).catch(()=>null)])
  .then(([tps,logo])=>{if(tps)applyTemplates(tps,true);if(logo&&logo.logo)DB.logo=logo.logo;persist();applyPrefs();
   if(S.shell==='public'&&S.pubView!=='fill')routePublic()});
}
function syncAdminCore(){
 if(!S.live||!accessToken)return Promise.resolve();
 return Promise.all([get('getFormTemplates').catch(()=>null),get('getStaffDirectory').catch(()=>null),get('getHeaderLogo',{},{token:false}).catch(()=>null)])
  .then(([tps,staff,logo])=>{
   if(tps)applyTemplates(tps,false);
   if(Array.isArray(staff)&&staff.length)DB.staff=staff.filter(s=>isUuid(s.id)).map(s=>({
    id:String(s.id).toLowerCase(),prefix:s.prefix||'',first_name:s.first_name||'',last_name:s.last_name||'',
    full_name:s.full_name||((s.prefix||'')+s.first_name+' '+s.last_name).trim(),position:s.position||'—',
    department:s.department||'—',employment_type:s.employment_type||'—',is_active:s.is_active!==false,
    email:s.email||'—',phone:s.phone||'—'}));
   if(logo&&logo.logo)DB.logo=logo.logo;
   persist();paintCounts();applyPrefs();
   if(S.shell==='admin'&&S.sec!=='builder')render();
   loadSubmissionsBg();
  });
}
let subsLoading=false;
function loadSubmissionsBg(force){
 if(!S.live||!accessToken||subsLoading)return;
 subsLoading=true;
 const list=DB.templates.filter(t=>isUuid(t.id)&&(force||!S.loadedSubTpl.has(t.id)));
 let i=0;
 const next=()=>{
  if(i>=list.length){subsLoading=false;paintCounts();if(S.shell==='admin'&&(S.sec==='inbox'||S.sec==='mine'))render();return}
  const t=list[i++];
  get('getFormSubmissions',{templateId:t.id},{force:!!force}).then(subs=>{
   if(Array.isArray(subs)){
    const rows=subs.filter(s=>isUuid(s.id)).map(s=>({
     id:String(s.id).toLowerCase(),template_id:t.id,template_name:t.name,
     submitted_by_name:s.submitted_by_name||(s.data&&s.data._submitter_name)||'ไม่ระบุชื่อ',
     department:(s.data&&s.data.department)||'',status:s.status,created_at:s.created_at,
     archived_at:s.archived_at||null,reviewed_at:s.reviewed_at||null,reviewed_by:s.reviewed_by||null,
     referenceId:s.referenceId,data:s.data||{}}));
    DB.submissions=DB.submissions.filter(s=>s.template_id!==t.id||isLocalId(s.id)).concat(rows);
    S.loadedSubTpl.add(t.id);persist();paintCounts();
    if(S.shell==='admin'&&S.sec==='inbox'&&(S.inbox.tpl==='all'||S.inbox.tpl===t.id))render();
   }
  }).catch(()=>{}).finally(()=>setTimeout(next,40));
 };
 next();
}
function ensureFields(id){
 const t=tpl(id);if(!t)return Promise.resolve(null);
 if((t.fields||[]).length)return Promise.resolve(t);
 if(!isUuid(id))return Promise.resolve(t);
 const act=S.shell==='admin'?'getFormTemplate':'getPublicFormTemplate';
 return get(act,{id},{token:S.shell==='admin'}).then(r=>{if(r&&r.fields){t.fields=r.fields.map(norm);persist()}return t}).catch(()=>t);
}
function hardResync(){
 modal('ล้างแคชและซิงก์ใหม่',
  '<p style="font-size:13.5px">ล้างแคชและข้อมูลค้างในเครื่อง แล้วดึงข้อมูลจริงใหม่</p>'+
  '<p style="font-size:12.5px;color:var(--text3);margin-top:8px">ข้อมูลบน Supabase ไม่ถูกลบ · ฟอร์มร่างที่ยังไม่บันทึกจะหาย</p>',
  '<button class="btn" data-close-modal>ยกเลิก</button><button class="btn pri" id="hrGo">'+ic('broom')+'ล้างและซิงก์</button>');
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#hrGo').onclick=()=>{
  closeModal();invalidate();
  DB.templates=[];DB.submissions=[];DB.deptMap={};DB.favorites=[];S.loadedSubTpl.clear();
  S.fill={tpl:null,fields:[],data:{},mode:'paper',zoom:0,errors:{}};
  S.b.id=null;S.b.fields=[];S.b.deleted=[];S.b.propFid=null;S.sec=null;persist();
  if(S.shell==='admin')render();else routePublic();
  toast('กำลังดึงข้อมูลใหม่…',{type:'info',ms:1800});
  syncPublic().then(()=>{if(accessToken)syncAdminCore()});
 };
}

/* ---------- prefs ---------- */
function applyPrefs(){
 document.documentElement.dataset.theme=DB.prefs.theme;
 document.documentElement.dataset.density=DB.prefs.density;
 document.body.classList.toggle('rail-mini',DB.prefs.rail==='mini');
 document.body.dataset.shell=S.shell;
 document.documentElement.dataset.shell=S.shell;
 $('#themeBtn').innerHTML=ic(DB.prefs.theme==='dark'?'sun':'moon');
 $('#densityBtn').innerHTML=ic(DB.prefs.density==='compact'?'rows':'grid');
 $('#modeChip').textContent=S.live?'● LIVE':'● ตัวอย่าง';
 $('#modeChip').classList.toggle('live',S.live);
 $('#brandMark').innerHTML=DB.logo?`<img src="${DB.logo}" alt="ตรา">`:'ด';
 $('#brandSub').textContent=S.shell==='admin'?'DONTUM e-FORM · ADMIN CONSOLE':'DONTUM e-FORM · บริการประชาชน';
 paintNet();
}
function setShell(sh){
 S.shell=sh;DB.prefs.shell=sh;persist();applyPrefs();
 if(sh==='admin'){history.replaceState(null,'','#/admin');S.sec=null;go(S._lastAdminSec||'forms');syncAdminCore()}
 else{history.replaceState(null,'','#/');showPubView('home');renderPubHome()}
}
function paintBell(){$('#bellDot').hidden=DB.activity.filter(a=>!a.read).length===0}
function paintCounts(){
 const pend=DB.submissions.filter(s=>s.status==='SUBMITTED'&&!s.archived_at).length;
 const map={forms:DB.templates.length,builder:DB.templates.length,inbox:pend,
  mine:DB.submissions.filter(s=>s.submitted_by_name===(S.meName||'ผู้ดูแลระบบ')).length,
  staff:DB.staff.filter(s=>s.is_active).length};
 $$('[data-cnt]').forEach(e=>{const v=map[e.dataset.cnt];e.textContent=v??'';e.hidden=v===undefined||v===0});
 const m=DB.submissions.filter(s=>Date.now()-new Date(s.created_at)<30*864e5).length;
 $('#quotaNum').textContent=m;
 $('#quotaBar').style.width=clamp(m/60*100,4,100)+'%';
 $('#quotaHint').textContent=m?`เป้าหมาย 60 ฉบับ · ${Math.round(m/60*100)}%`:'ยังไม่มีคำขอใน 30 วัน';
}

/* ---------- A4 engine ---------- */
function norm(f){const n=(v,d)=>{const x=Number(v);return isFinite(x)?x:d};
 let o=f.options;if(typeof o==='string'){try{o=JSON.parse(o)}catch(e){o=o.split(',').map(s=>s.trim()).filter(Boolean)}}
 return Object.assign({},f,{options:Array.isArray(o)?o.map(String).filter(Boolean):[],
  pos_x:n(f.pos_x,15),pos_y:n(f.pos_y,20),width:n(f.width,70),height:n(f.height,8),font_size:n(f.font_size,14)})}
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
   if(t==='select'){c=document.createElement('select');c.appendChild(new Option('-- เลือก --',''));
    (f.options.length?f.options:['ตัวเลือก 1','ตัวเลือก 2']).forEach(o=>c.appendChild(new Option(o,o)));c.value=data[f.name]||''}
   else{c=document.createElement('input');c.type=t==='date'?'date':'text';c.placeholder=t==='date'?'':(f.label||'');c.value=data[f.name]??(f.value||'')}
   c.className='fci';c.dataset.fname=f.name;fc.appendChild(c)}
  else if(mode==='print')fc.textContent=t==='date'&&v?new Date(v).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'}):v;
  else fc.appendChild(mk('span','ph',t==='date'?'__/__/____':(f.value||f.label||'ช่องกรอก')));
  return fc}
 if(t==='textarea'){
  if(mode==='fill'){const c=document.createElement('textarea');c.className='fci';c.dataset.fname=f.name;c.placeholder=f.label||'';c.value=data[f.name]??(f.value||'');fc.appendChild(c)}
  else if(mode==='print')fc.textContent=v;else fc.appendChild(mk('span','ph',f.value||f.label||'ข้อความยาว'));
  return fc}
 if(t==='radio'||t==='checkbox'){
  fc.classList.add('cy');const g=mk('div','og'+(f.height>15?' col':''));
  const opts=f.options.length?f.options:['ตัวเลือก 1','ตัวเลือก 2'];
  const chosen=String(data[f.name]||'').split(', ').filter(Boolean);
  opts.forEach(o=>{
   const l=mk('label','ol');
   if(mode==='fill'){const i=document.createElement('input');i.type=t;i.name=pfx+f.id;i.value=o;i.dataset.fname=f.name;i.checked=chosen.includes(o);l.appendChild(i)}
   else{const b=mk('span','ob'+(t==='radio'?' rd':''));if(mode==='print'&&chosen.includes(o))b.textContent=t==='radio'?'●':'✓';l.appendChild(b)}
   l.appendChild(document.createTextNode(o));g.appendChild(l)});
  fc.appendChild(g);return fc}
 if(t==='signature'){
  const sg=mk('div','sg'),ln=mk('div','sg-l');
  if(mode==='fill'){const c=document.createElement('input');c.type='text';c.className='fci';c.dataset.fname=f.name;c.placeholder='พิมพ์ชื่อเพื่อลงนาม';c.value=data[f.name]||'';ln.appendChild(c)}
  else if(mode==='print')ln.textContent=v;
  sg.appendChild(ln);sg.appendChild(mk('div','sg-c',f.label?'('+f.label+')':''));fc.appendChild(sg);return fc}
 if(t==='checkbox_agree'){
  const r=mk('div','ag');
  if(mode==='fill'){const c=document.createElement('input');c.type='checkbox';c.dataset.fname=f.name;c.checked=!!data[f.name];c.id='ag_'+f.id;r.appendChild(c);
   const lb=mk('label','',f.value||f.label||'ยอมรับข้อตกลง');lb.htmlFor='ag_'+f.id;lb.style.cursor='pointer';r.appendChild(lb)}
  else{r.appendChild(mk('span','ob',mode==='print'&&v?'✓':''));r.appendChild(mk('span','',f.value||f.label||''))}
  fc.appendChild(r);return fc}
 return fc;
}
function paintCanvas(sel,fields,mode,data){
 const c=$(sel);if(!c)return null;
 const frag=document.createDocumentFragment();
 const pfx='r'+Math.random().toString(36).slice(2,7)+'_';
 fields.map(norm).forEach(f=>frag.appendChild(fieldEl(f,mode,data,pfx)));
 c.innerHTML='';c.appendChild(frag);
 return c;
}
function zoomTo(c,z){if(!c)return;const b=c.parentElement;
 b.style.width=PW*MM*z+'px';
 b.style.height=(c.dataset.autoH?parseFloat(c.dataset.autoH):PH)*MM*z+'px';
 c.style.transform=z===1?'':`scale(${z})`}
function fitOf(w){return clamp((w.clientWidth-46)/(PW*MM),.25,1.6)}
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
.bar button{border:0;border-radius:8px;padding:10px 17px;font:600 13px 'Noto Sans Thai',sans-serif;background:#0B4F55;color:#fff;cursor:pointer}
@media screen{html,body{background:linear-gradient(135deg,#EDF5F2,#DCE7E9);min-height:100vh}body{padding:30px 0 54px}
.a4{transform:scale(var(--fit,1));transform-origin:0 0}}
@media print{html,body{width:210mm;height:297mm;background:#fff;overflow:hidden;padding:0}
.wrap{width:210mm;height:297mm}.a4{border:0;box-shadow:none;transform:none}.bar{display:none}}`;
function sheetHTML(fields,data,title,autoPrint){
 const h=document.createElement('div');h.className='a4';
 (fields||[]).map(norm).forEach(f=>h.appendChild(fieldEl(f,'print',data)));
 return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap">
<style>${EXPORT_CSS}</style></head><body>
<div class="bar"><button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>
<div class="wrap" id="w">${h.outerHTML}</div>
<script>(function(){var w=document.getElementById('w'),c=w.firstElementChild,W=210*96/25.4,H=297*96/25.4;
function f(){var s=Math.max(.2,Math.min(1,(document.documentElement.clientWidth-26)/W));w.style.width=W*s+'px';w.style.height=H*s+'px';c.style.setProperty('--fit',s)}
f();addEventListener('resize',f);${autoPrint?'addEventListener("load",function(){setTimeout(function(){window.print()},600)})':''}})();<\/script></body></html>`;
}
function download(content,name,mime){
 const b=new Blob([content],{type:mime||'text/html;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},800);
}
const fname=s=>String(s||'form').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').slice(0,70);
function printSheet(fields,data,title){
 if(!(fields||[]).length)return toast('ไม่มีฟิลด์ให้พิมพ์',{type:'warn'});
 const w=window.open('','_blank');
 if(!w){toast('เบราว์เซอร์บล็อกป๊อปอัป',{type:'warn'});return}
 w.document.write(sheetHTML(fields,data,title,true));w.document.close();
}
function csv(rows,name){
 const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
 download('\uFEFF'+rows.map(r=>r.map(q).join(',')).join('\r\n'),name,'text/csv;charset=utf-8');
 toast('ส่งออก '+name+' แล้ว',{type:'ok'});
}

/* ---------- modal / drawer ---------- */
function modal(title,body,foot){
 $('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modalFoot').innerHTML=foot||'';
 $('#modalScrim').hidden=false;
}
function closeModal(){$('#modalScrim').hidden=true}
$$('[data-close-modal]').forEach(b=>b.onclick=()=>{closeModal();$('#helpScrim').hidden=true});
$('#modalScrim').onclick=e=>{if(e.target.id==='modalScrim')closeModal()};
$('#helpScrim').onclick=e=>{if(e.target.id==='helpScrim')$('#helpScrim').hidden=true};
let _lastFocus=null;
function openDrawer(kicker,title,body,foot){
 _lastFocus=document.activeElement;
 $('#drawerKicker').textContent=kicker;$('#drawerTitle').textContent=title;
 $('#drawerBody').innerHTML=body;$('#drawerFoot').innerHTML=foot||'';
 $('#drawer').hidden=false;$('#drawerScrim').hidden=false;
}
function closeDrawer(){$('#drawer').hidden=true;$('#drawerScrim').hidden=true;
 if(_lastFocus&&document.contains(_lastFocus))_lastFocus.focus();_lastFocus=null}
$('#drawerClose').onclick=closeDrawer;$('#drawerScrim').onclick=closeDrawer;

/* ============================================================
   PUBLIC · FILL
   ============================================================ */
function ensureFillUI(){
 if(document.getElementById('fillToolbar'))return;
 const chip=document.createElement('div');chip.id='netChip';chip.onclick=flushOutbox;
 $('#adminActions').insertBefore(chip,$('#densityBtn'));
 const wrap=$('#fillWrap');if(!wrap)return;
 const bar=document.createElement('div');bar.id='fillToolbar';bar.className='fill-toolbar';
 bar.innerHTML='<div class="seg" id="fillModeSeg">'+
  '<button type="button" data-fm="paper">'+ic('forms',14)+'กระดาษ A4</button>'+
  '<button type="button" data-fm="simple">'+ic('list',14)+'ฟอร์มง่าย</button></div>'+
  '<div class="fill-zoom" id="fillZoom">'+
  '<button type="button" class="btn sm icon" data-fz="out">'+ic('zoomout',14)+'</button>'+
  '<button type="button" class="btn sm" data-fz="fit" id="fillZoomLbl">100%</button>'+
  '<button type="button" class="btn sm icon" data-fz="in">'+ic('zoomin',14)+'</button></div>'+
  '<span class="sp"></span><span class="fill-progress" id="fillProgress"><span class="pb"><i></i></span><b>0/0</b></span>';
 wrap.parentNode.insertBefore(bar,wrap);
 const note=document.createElement('div');note.className='fill-note';
 note.innerHTML=ic('info',15)+'<span>กรอกได้ 2 โหมด: <b>กระดาษ A4</b> ตรงตามแบบจริง หรือ <b>ฟอร์มง่าย</b> สะดวกบนมือถือ — ข้อมูลใช้ร่วมกัน สลับได้ตลอด</span>';
 wrap.parentNode.insertBefore(note,wrap);
 const simple=document.createElement('div');simple.id='fillSimple';simple.className='fill-simple';simple.hidden=true;
 wrap.parentNode.insertBefore(simple,wrap.nextSibling);
 bar.addEventListener('click',e=>{
  const m=e.target.closest('[data-fm]'),z=e.target.closest('[data-fz]');
  if(m)return setFillMode(m.dataset.fm);
  if(z){const k=z.dataset.fz;
   S.fill.zoom=k==='fit'?fitOf($('#fillWrap')):clamp((S.fill.zoom||1)+(k==='in'?.15:-.15),.3,1.8);
   applyFillZoom()}
 });
 simple.addEventListener('input',onSimpleInput);
 simple.addEventListener('change',onSimpleInput);
 $('#fillCanvas').addEventListener('input',onPaperInput);
 $('#fillCanvas').addEventListener('change',onPaperInput);
 paintNet();
}
function setFillMode(m){
 S.fill.mode=m;
 $$('#fillModeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.fm===m));
 const paper=m==='paper';
 $('#fillWrap').hidden=!paper;$('#fillZoom').style.display=paper?'flex':'none';$('#fillSimple').hidden=paper;
 paper?renderFillPaper():renderFillSimple();
 updateFillProgress();
}
function uniqueFillFields(fields){
 const seen={},out=[];
 (fields||[]).map(norm).forEach((f,i)=>{
  if(!INP.includes(f.field_type)){out.push(f);return}
  let n=String(f.name||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'_')||('field_'+(i+1));
  if(seen[n]){let k=2;while(seen[n+'_'+k])k++;n=n+'_'+k}
  seen[n]=1;out.push(Object.assign({},f,{name:n}));
 });
 return out;
}
function initFillData(){
 const d={};
 S.fill.fields.forEach(f=>{if(INP.includes(f.field_type))d[f.name]=(f.field_type==='checkbox'||f.field_type==='radio'||f.field_type==='checkbox_agree')?'':(f.value||'')});
 S.fill.data=d;S.fill.errors={};
}
function renderFillPaper(){
 const c=paintCanvas('#fillCanvas',S.fill.fields,'fill',S.fill.data);
 if(!c)return;c.classList.add('fill-live');
 reflowFill();
 if(!S.fill.zoom)S.fill.zoom=fitOf($('#fillWrap'));
 applyFillZoom();markFillErrors();
}
function reflowFill(){
 const c=$('#fillCanvas');if(!c)return;
 const items=S.fill.fields.map(f=>({f,el:c.querySelector('[data-fid="'+f.id+'"]')})).filter(x=>x.el);
 items.sort((a,b)=>a.f.pos_y-b.f.pos_y||a.f.pos_x-b.f.pos_x);
 let shift=0,maxB=PH;
 items.forEach(({f,el})=>{
  el.style.top=(f.pos_y+shift)+'mm';el.style.height='auto';el.style.minHeight=f.height+'mm';
  const used=Math.max(f.height,el.scrollHeight/MM+.6);
  el.style.height=used+'mm';
  if(used>f.height)shift+=used-f.height;
  maxB=Math.max(maxB,f.pos_y+shift+used+8);
 });
 c.style.height=maxB+'mm';c.dataset.autoH=String(maxB);
}
function applyFillZoom(){const c=$('#fillCanvas');if(!c)return;zoomTo(c,S.fill.zoom||1);
 const l=$('#fillZoomLbl');if(l)l.textContent=Math.round((S.fill.zoom||1)*100)+'%'}
function renderFillSimple(){
 const box=$('#fillSimple');if(!box)return;
 const inputs=S.fill.fields.filter(f=>INP.includes(f.field_type));
 if(!inputs.length){box.innerHTML='<div class="empty"><div class="em-ico">'+ic('inbox',26)+'</div><h3>ฟอร์มนี้ยังไม่มีช่องให้กรอก</h3></div>';return}
 box.innerHTML=inputs.map((f,i)=>{
  const v=S.fill.data[f.name]??'';
  const label=esc(f.label||FTL[f.field_type]||f.name);
  const rq=f.required?'<span class="rq">*</span>':'';
  let ctl;
  if(f.field_type==='textarea')ctl='<textarea class="fs-in" data-fn="'+esc(f.name)+'" placeholder="'+label+'">'+esc(v)+'</textarea>';
  else if(f.field_type==='date')ctl='<input class="fs-in" type="date" data-fn="'+esc(f.name)+'" value="'+esc(v)+'">';
  else if(f.field_type==='select'){
   const o=f.options.length?f.options:['ตัวเลือก 1','ตัวเลือก 2'];
   ctl='<select class="fs-in" data-fn="'+esc(f.name)+'"><option value="">-- เลือก --</option>'+o.map(x=>'<option value="'+esc(x)+'"'+(v===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';
  }else if(f.field_type==='radio'||f.field_type==='checkbox'){
   const o=f.options.length?f.options:['ตัวเลือก 1','ตัวเลือก 2'];
   const sel=String(v||'').split(', ').filter(Boolean);
   ctl='<div class="fs-opts" data-fn="'+esc(f.name)+'" data-ft="'+f.field_type+'">'+o.map(x=>
    '<label class="fs-opt'+(sel.includes(x)?' on':'')+'"><input type="'+f.field_type+'" name="fs_'+f.id+'" value="'+esc(x)+'"'+(sel.includes(x)?' checked':'')+'><span>'+esc(x)+'</span></label>').join('')+'</div>';
  }else if(f.field_type==='checkbox_agree'){
   ctl='<label class="fs-opt'+(v?' on':'')+'" data-fn="'+esc(f.name)+'" data-ft="checkbox_agree"><input type="checkbox"'+(v?' checked':'')+'><span>'+esc(f.value||f.label||'ยอมรับข้อตกลง')+'</span></label>';
  }else if(f.field_type==='signature'){
   ctl='<input class="fs-in" type="text" data-fn="'+esc(f.name)+'" placeholder="พิมพ์ชื่อ-นามสกุลเพื่อลงนาม" value="'+esc(v)+'"><div class="fs-hint">การพิมพ์ชื่อถือเป็นการลงนามอิเล็กทรอนิกส์</div>';
  }else ctl='<input class="fs-in" type="text" data-fn="'+esc(f.name)+'" placeholder="'+label+'" value="'+esc(v)+'">';
  return '<div class="fs-card" data-card="'+esc(f.name)+'"><div class="fs-q"><span class="n">'+String(i+1).padStart(2,'0')+'</span><span>'+label+'</span>'+rq+'</div>'+ctl+
   (f.field_type==='checkbox'?'<div class="fs-hint">เลือกได้มากกว่า 1 ข้อ</div>':'')+'<div class="fs-err" hidden></div></div>';
 }).join('');
}
function onSimpleInput(e){
 const t=e.target,w=t.closest('[data-fn]');
 if(w&&w.dataset.ft){
  const n=w.dataset.fn;
  if(w.dataset.ft==='checkbox_agree'){S.fill.data[n]=t.checked?'ยอมรับ':'';w.classList.toggle('on',t.checked)}
  else{const vals=[...w.querySelectorAll('input:checked')].map(i=>i.value);
   S.fill.data[n]=vals.join(', ');
   w.querySelectorAll('.fs-opt').forEach(l=>l.classList.toggle('on',l.querySelector('input').checked))}
  clearFieldError(n);updateFillProgress();return;
 }
 const n=t.dataset&&t.dataset.fn;if(!n)return;
 S.fill.data[n]=t.value;clearFieldError(n);updateFillProgress();
}
function onPaperInput(e){
 const t=e.target,n=t.dataset&&t.dataset.fname;if(!n)return;
 const f=S.fill.fields.find(x=>x.name===n);if(!f)return;
 if(f.field_type==='radio'||f.field_type==='checkbox'){
  const box=$('#fillCanvas').querySelector('[data-fid="'+f.id+'"]');
  S.fill.data[n]=[...box.querySelectorAll('input:checked')].map(i=>i.value).join(', ');
 }else if(f.field_type==='checkbox_agree')S.fill.data[n]=t.checked?'ยอมรับ':'';
 else S.fill.data[n]=t.value;
 clearFieldError(n);updateFillProgress();
}
function clearFieldError(n){
 if(!S.fill.errors[n])return;delete S.fill.errors[n];
 const c=$('#fillSimple').querySelector('[data-card="'+CSS.escape(n)+'"]');
 if(c){c.classList.remove('err');const e=$('.fs-err',c);if(e)e.hidden=true}
 const f=S.fill.fields.find(x=>x.name===n);
 const el=f&&$('#fillCanvas').querySelector('[data-fid="'+f.id+'"]');
 if(el)el.classList.remove('ferr');
}
function markFillErrors(){
 Object.keys(S.fill.errors).forEach(n=>{
  const f=S.fill.fields.find(x=>x.name===n);if(!f)return;
  const el=$('#fillCanvas').querySelector('[data-fid="'+f.id+'"]');if(el)el.classList.add('ferr');
  const c=$('#fillSimple').querySelector('[data-card="'+CSS.escape(n)+'"]');
  if(c){c.classList.add('err');const e=$('.fs-err',c);if(e){e.hidden=false;e.textContent=S.fill.errors[n]}}
 });
}
function updateFillProgress(){
 const req=S.fill.fields.filter(f=>f.required&&INP.includes(f.field_type));
 const done=req.filter(f=>String(S.fill.data[f.name]||'').trim()).length;
 const p=$('#fillProgress');if(!p)return;
 $('i',p).style.width=(req.length?Math.round(done/req.length*100):100)+'%';
 $('b',p).textContent=done+'/'+req.length+' ช่องบังคับ';
 p.classList.toggle('done',done===req.length);
}
function validateFill(){
 const e={};
 S.fill.fields.forEach(f=>{
  if(!INP.includes(f.field_type))return;
  const v=String(S.fill.data[f.name]||'').trim();
  if(f.required&&!v)e[f.name]='กรุณากรอก “'+(f.label||FTL[f.field_type])+'”';
  else if(f.field_type==='date'&&v&&!/^\d{4}-\d{2}-\d{2}$/.test(v))e[f.name]='รูปแบบวันที่ไม่ถูกต้อง';
  else if(v.length>5000)e[f.name]='ข้อความยาวเกินไป';
 });
 S.fill.errors=e;return e;
}
function focusFirstError(){
 const n=Object.keys(S.fill.errors)[0];if(!n)return;
 const f=S.fill.fields.find(x=>x.name===n);if(!f)return;
 const target=S.fill.mode==='simple'
  ?$('#fillSimple').querySelector('[data-card="'+CSS.escape(n)+'"]')
  :$('#fillCanvas').querySelector('[data-fid="'+f.id+'"]');
 if(target){target.scrollIntoView({block:'center',behavior:'smooth'});
  const i=target.querySelector('input,textarea,select');if(i)setTimeout(()=>i.focus(),300)}
}
function showPubView(v){
 S.pubView=v;
 const map={home:'pvHome',forms:'pvForms',fill:'pvFill',ok:'pvOk',status:'pvStatus'};
 $$('.pub-view').forEach(s=>s.classList.toggle('active',s.id===map[v]));
 $$('#pubNav .pnav').forEach(b=>b.classList.toggle('on',b.dataset.pnav===v||(v==='ok'&&b.dataset.pnav==='status')));
 $('#pubMain').scrollTop=0;
}
const THUMB_CACHE=new Map();let thumbIO=null;
function paintThumbs(scope){
 const nodes=$$('.thumb',scope||document);if(!nodes.length)return;
 if(!thumbIO&&'IntersectionObserver'in window)
  thumbIO=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){drawThumb(en.target);thumbIO.unobserve(en.target)}})},{rootMargin:'220px'});
 nodes.forEach(n=>{thumbIO?thumbIO.observe(n):drawThumb(n)});
}
function drawThumb(node){
 const c=$('.thumb-c',node),t=tpl(node.dataset.t);if(!c||!t)return;
 const sig=(t.fields||[]).length+':'+(t.updated_at||'');
 if(c.dataset.done===sig)return;
 const key=t.id+'|'+sig;let html=THUMB_CACHE.get(key);
 if(!html){const tmp=document.createElement('div');
  (t.fields||[]).map(norm).forEach(f=>tmp.appendChild(fieldEl(f,'print',{})));
  html=tmp.innerHTML;if(THUMB_CACHE.size>60)THUMB_CACHE.clear();THUMB_CACHE.set(key,html)}
 c.innerHTML=html;c.dataset.done=sig;
 c.style.transform='scale('+(node.clientWidth/(PW*MM))+')';
}
function pubCard(t,i){
 const n=(t.fields||[]).filter(f=>INP.includes(f.field_type)).length;
 return `<article class="card" style="animation-delay:${Math.min(i*30,240)}ms">
 <div class="card-top"><h3>${esc(t.name)}</h3><span class="pill on">เปิดรับ</span></div>
 <p>${esc(t.description||'')}</p>
 <div class="thumb" data-t="${esc(t.id)}"><span class="thumb-tag">A4</span><div class="thumb-c"></div></div>
 <div class="card-meta"><span>${esc(t.department||'—')}</span><span>${n} ช่องกรอก</span></div>
 <div class="card-acts"><button class="btn pri" data-fill="${esc(t.id)}">${ic('edit',13)}กรอกออนไลน์</button>
 <button class="btn" data-pview="${esc(t.id)}">${ic('eye',13)}ดูตัวอย่าง</button></div></article>`;
}
function renderPubHome(){
 const act=DB.templates.filter(t=>t.is_active);
 $('#pubCount').textContent=act.length+' ฟอร์ม';
 $('#pubFormGrid').innerHTML=act.length?act.slice(0,4).map(pubCard).join(''):
  `<div class="empty"><div class="em-ico">${ic('globe',26)}</div><h3>ยังไม่มีฟอร์มที่เปิดรับ</h3><p>กรุณาติดต่อเจ้าหน้าที่หรือลองใหม่ภายหลัง</p></div>`;
 paintThumbs($('#pvHome'));
}
function renderPubForms(){
 const q=S.pubQ.toLowerCase();
 const act=DB.templates.filter(t=>t.is_active&&(!q||(t.name+t.description+(t.department||'')).toLowerCase().includes(q)));
 $('#pfCount').textContent=act.length+' ฟอร์ม';
 $('#pfGrid').innerHTML=act.length?act.map(pubCard).join(''):
  `<div class="empty"><div class="em-ico">${ic('search',26)}</div><h3>ไม่พบฟอร์มที่ค้น</h3></div>`;
 paintThumbs($('#pvForms'));
}
let _fillBusy=false;
async function openPubFill(rawId){
 const id=repairUuid(rawId)||String(rawId||'');
 if(!id||(!isUuid(id)&&!isLocalId(id))){toast('ลิงก์ฟอร์มไม่ถูกต้อง',{type:'warn'});pubGo('forms');return}
 if(_fillBusy)return;_fillBusy=true;
 try{
  ensureFillUI();
  if(S.shell!=='public'){S.shell='public';DB.prefs.shell='public';applyPrefs()}
  const t=await ensureFields(id);
  if(!t){toast('ไม่พบแบบฟอร์มนี้',{type:'warn'});pubGo('forms');return}
  const fields=uniqueFillFields(t.fields||[]);
  if(!fields.some(f=>INP.includes(f.field_type))){toast('ฟอร์มนี้ยังไม่มีช่องให้กรอก',{type:'warn'});pubGo('forms');return}
  S.fill={tpl:t.id,fields,data:{},mode:(window.innerWidth<820?'simple':'paper'),zoom:0,errors:{}};
  initFillData();
  $('#fillTitle').textContent=t.name;$('#fillDesc').textContent=t.description||'';
  $('#fillName').value='';$('#fillCid').value='';
  showPubView('fill');history.replaceState(null,'','#/fill/'+t.id);
  setFillMode(S.fill.mode);
  requestAnimationFrame(()=>{if(S.fill.mode==='paper'){reflowFill();S.fill.zoom=fitOf($('#fillWrap'));applyFillZoom()}});
 }finally{_fillBusy=false}
}
function previewPub(id){
 ensureFields(id).then(t=>{
  if(!t||!(t.fields||[]).length)return toast('ยังไม่มีฟิลด์ให้แสดงตัวอย่าง',{type:'warn'});
  openDrawer('ตัวอย่างฟอร์ม',t.name,'<div class="mini-a4" id="pvA4" style="aspect-ratio:210/297"><div class="sc"></div></div>',
   '<button class="btn pri" data-pv="1">'+ic('edit')+'กรอกออนไลน์</button>');
  requestAnimationFrame(()=>{const w=$('#pvA4');if(!w)return;const c=$('.sc',w);
   t.fields.map(norm).forEach(f=>c.appendChild(fieldEl(f,'print',{})));
   c.style.transform='scale('+(w.clientWidth/(PW*MM))+')'});
  $('#drawerFoot').onclick=e=>{if(e.target.closest('[data-pv]')){closeDrawer();openPubFill(id)}};
 });
}
function submitFill(){
 const name=$('#fillName').value.trim(),cid=$('#fillCid').value.trim();
 if(!name){toast('กรุณากรอกชื่อ-นามสกุลผู้ยื่น',{type:'warn'});$('#fillName').focus();return}
 if(!/^\d{13}$/.test(cid)){toast('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',{type:'warn'});$('#fillCid').focus();return}
 const e=validateFill();
 if(Object.keys(e).length){markFillErrors();focusFirstError();return toast(e[Object.keys(e)[0]],{type:'warn'})}
 if(S.live&&!isUuid(S.fill.tpl))return toast('ฟอร์มร่างยังส่งจริงไม่ได้ — ให้ผู้ดูแลบันทึกก่อน',{type:'warn'});
 const t=tpl(S.fill.tpl),data=Object.assign({},S.fill.data);
 const localId=uid('sub_'),rid=ref(localId);
 S.lastSub={id:localId,referenceId:rid,cid,templateId:S.fill.tpl,templateName:t?t.name:'',fields:S.fill.fields,data};
 DB.submissions.unshift({id:localId,_cid:cid,template_id:S.fill.tpl,template_name:t?t.name:'',
  submitted_by_name:name,department:data.department||'',status:'SUBMITTED',created_at:new Date().toISOString(),
  archived_at:null,reviewed_at:null,reviewed_by:null,referenceId:rid,data,_pending:true});
 persist();paintCounts();
 $('#okTplName').textContent=(t?t.name:'')+' · ส่งเมื่อ '+fdate(new Date().toISOString());
 $('#okRef').textContent=rid;
 showPubView('ok');history.replaceState(null,'','#/');
 logAct('คำขอใหม่ #'+rid+' — '+(t?t.name:''),'info');
 if(S.live){
  rawApi('submitFormAnonymous',{templateId:S.fill.tpl,formData:data,citizenId:cid,fullName:name},false)
   .then(res=>{
    const row=DB.submissions.find(x=>x.id===localId);
    if(row&&res){row.id=String(res.id||localId).toLowerCase();row.referenceId=res.referenceId||rid;delete row._pending;
     S.lastSub.id=row.id;S.lastSub.referenceId=row.referenceId;$('#okRef').textContent=row.referenceId;persist();paintCounts()}
    invalidate('getFormSubmissions');toast('ส่งคำขอเข้าเซิร์ฟเวอร์แล้ว',{type:'ok'});
   })
   .catch(er=>{toast('ส่งไม่สำเร็จ: '+er.message+' — จะลองใหม่อัตโนมัติ',{type:'bad',ms:6000});
    OUTBOX.push({id:uid('job_'),action:'submitFormAnonymous',payload:{templateId:S.fill.tpl,formData:data,citizenId:cid,fullName:name},label:'ส่งคำขอ #'+rid,tries:0,next:Date.now()+3000});
    outboxSave();paintNet();pump()});
 }
}
function lookupStatus(cid){
 if(!/^\d{13}$/.test(cid)){toast('กรุณากรอกเลขบัตรประชาชน 13 หลัก',{type:'warn'});return}
 const box=$('#stList');
 const paint=rows=>{
  box.innerHTML=rows.length?rows.map((s,i)=>`<article class="card" style="animation-delay:${i*30}ms">
   <div class="card-top"><h3>${esc(s.template_name)}</h3></div>
   <div class="card-meta"><span class="ref">#${esc(refOf(s))}</span><span>${ago(s.created_at)}</span></div>
   <span class="pill ${s.status}">${ST[s.status]||s.status}</span>
   <div class="card-acts"><button class="btn sm" data-st-view="${esc(s.id)}" data-cid="${esc(cid)}">${ic('eye',13)}ดูเอกสาร</button>
   <button class="btn sm" data-st-print="${esc(s.id)}" data-cid="${esc(cid)}">${ic('print',13)}พิมพ์</button></div></article>`).join('')
   :`<div class="empty"><div class="em-ico">${ic('inbox',26)}</div><h3>ไม่พบคำขอของเลขบัตรนี้</h3></div>`;
 };
 paint(DB.submissions.filter(s=>s._cid===cid));
 if(S.live)rawApi('lookupSubmissionsByCitizenId',{citizenId:cid},false).then(rows=>paint((rows||[]).filter(s=>isUuid(s.id)))).catch(()=>{});
}
function openStatusDoc(id,cid){
 const render=r=>{
  openDrawer('คำขอ #'+(r.referenceId||ref(id)),(r.template&&r.template.name)||'แบบฟอร์ม',
   '<dl class="kv"><dt>สถานะ</dt><dd><span class="pill '+r.status+'">'+(ST[r.status]||r.status)+'</span></dd>'+
   '<dt>ส่งเมื่อ</dt><dd>'+fdate(r.created_at||new Date().toISOString())+'</dd></dl>'+
   '<div class="d-sec">เอกสาร A4</div><div class="mini-a4" id="stA4" style="aspect-ratio:210/297"><div class="sc"></div></div>',
   '<button class="btn pri" data-stp="print">'+ic('print')+'พิมพ์ / PDF</button>'+
   '<button class="btn" data-stp="dl">'+ic('dl')+'ดาวน์โหลด HTML</button>');
  requestAnimationFrame(()=>{const w=$('#stA4');if(!w)return;const c=$('.sc',w);
   (r.fields||[]).map(norm).forEach(f=>c.appendChild(fieldEl(f,'print',r.data||{})));
   c.style.transform='scale('+(w.clientWidth/(PW*MM))+')'});
  $('#drawerFoot').onclick=e=>{const b=e.target.closest('[data-stp]');if(!b)return;
   const ttl=(r.template&&r.template.name)||'คำขอ';
   if(b.dataset.stp==='print')printSheet(r.fields,r.data,ttl+' #'+(r.referenceId||ref(id)));
   else download(sheetHTML(r.fields,r.data,ttl,false),fname(ttl)+'_'+(r.referenceId||ref(id))+'.html')};
 };
 const local=sub(id);
 if(local){const t=tpl(local.template_id);render({fields:(t&&t.fields)||[],data:local.data,template:t,referenceId:refOf(local),status:local.status,created_at:local.created_at})}
 if(S.live&&isUuid(id))rawApi('getPublicFormSubmission',{id,citizenId:cid},false).then(render).catch(()=>{});
}
function routePublic(){
 const h=location.hash||'#/';
 if(h.startsWith('#/fill/'))return openPubFill(h.slice(6));
 if(h.startsWith('#/forms')){showPubView('forms');return renderPubForms()}
 if(h.startsWith('#/status'))return showPubView('status');
 showPubView('home');renderPubHome();
}
function pubGo(v){showPubView(v);history.replaceState(null,'','#/'+(v==='home'?'':v));
 if(v==='home')renderPubHome();if(v==='forms')renderPubForms()}
$('#pubNav').onclick=e=>{const b=e.target.closest('[data-pnav]');if(b)pubGo(b.dataset.pnav)};
$('#pubMain').onclick=e=>{
 const nav=e.target.closest('[data-pnav]');if(nav)return pubGo(nav.dataset.pnav);
 const f=e.target.closest('[data-fill]'),p=e.target.closest('[data-pview]'),
       sv=e.target.closest('[data-st-view]'),sp=e.target.closest('[data-st-print]');
 if(f)return openPubFill(f.dataset.fill);
 if(p)return previewPub(p.dataset.pview);
 if(sv)return openStatusDoc(sv.dataset.stView,sv.dataset.cid);
 if(sp)return openStatusDoc(sp.dataset.stPrint,sp.dataset.cid);
};
$('#pubMain').addEventListener('pointerover',e=>{const b=e.target.closest('[data-fill]');if(!b||b._pf)return;b._pf=1;ensureFields(b.dataset.fill)},{passive:true});
$('#pfSearch').oninput=debounce(e=>{S.pubQ=e.target.value;renderPubForms()},160);
$('#fillBack').onclick=()=>pubGo('forms');
$('#fillClear').onclick=()=>{if(!confirm('ล้างข้อมูลที่กรอกไว้ทั้งหมด?'))return;initFillData();setFillMode(S.fill.mode)};
$('#fillSend').onclick=submitFill;
$('#okCopy').onclick=()=>{navigator.clipboard?.writeText($('#okRef').textContent);toast('คัดลอกเลขอ้างอิงแล้ว',{type:'ok'})};
$('#okPrint').onclick=()=>{if(S.lastSub)printSheet(S.lastSub.fields,S.lastSub.data,S.lastSub.templateName+' #'+S.lastSub.referenceId)};
$('#okDl').onclick=()=>{if(S.lastSub)download(sheetHTML(S.lastSub.fields,S.lastSub.data,S.lastSub.templateName,false),fname(S.lastSub.templateName)+'_'+S.lastSub.referenceId+'.html')};
$('#okStatus').onclick=()=>{showPubView('status');$('#stCid').value=S.lastSub?S.lastSub.cid:'';if(S.lastSub)lookupStatus(S.lastSub.cid)};
$('#okHome').onclick=()=>pubGo('home');
$('#stSearch').onclick=()=>lookupStatus($('#stCid').value.trim());
$('#stCid').onkeydown=e=>{if(e.key==='Enter')lookupStatus($('#stCid').value.trim())};

/* ---------- login ---------- */
function openLogin(){$('#loginScrim').hidden=false;setTimeout(()=>$('#lgEmail').focus(),30)}
function closeLogin(){$('#loginScrim').hidden=true}
$$('[data-close-login]').forEach(b=>b.onclick=closeLogin);
$('#loginScrim').onclick=e=>{if(e.target.id==='loginScrim')closeLogin()};
$('#loginBtn').onclick=openLogin;
$('#lgGo').onclick=doLogin;
$('#lgPass').onkeydown=e=>{if(e.key==='Enter')doLogin()};
function doLogin(){
 const email=$('#lgEmail').value.trim(),pass=$('#lgPass').value;
 if(!email||!pass)return toast('กรุณากรอกอีเมลและรหัสผ่าน',{type:'warn'});
 const b=$('#lgGo');b.disabled=true;const old=b.textContent;b.textContent='กำลังเข้าสู่ระบบ…';
 rawApi('loginWithPassword',{email,password:pass},false).then(r=>{
  accessToken=r.accessToken;try{localStorage.setItem('access_token',accessToken)}catch(e){}
  S.meName=r.fullName||'ผู้ดูแลระบบ';S.meRole=r.role||'ADMIN';
  $('#userName').textContent=S.meName;
  closeLogin();$('#lgPass').value='';
  toast('ยินดีต้อนรับ '+S.meName,{type:'ok'});logAct('เข้าสู่ระบบผู้ดูแล '+S.meName,'ok');
  enterAdmin();
 }).catch(e=>toast('เข้าสู่ระบบไม่สำเร็จ: '+err(e),{type:'bad'}))
 .finally(()=>{b.disabled=false;b.textContent=old});
}
function restoreSession(){
 if(!accessToken)return Promise.resolve(false);
 return rawApi('getSession',{},true).then(s=>{
  S.meName=s.fullName||'ผู้ดูแลระบบ';S.meRole=s.role||'ADMIN';
  $('#userName').textContent=S.meName;return true;
 }).catch(()=>false);
}
function enterAdmin(){if(!accessToken)return openLogin();S._lastAdminSec=S._lastAdminSec||'forms';setShell('admin')}
$('#logoutBtn').onclick=()=>{
 if(!confirm('ออกจากระบบผู้ดูแล?'))return;
 accessToken=null;try{localStorage.removeItem('access_token')}catch(e){}
 S.meName='';S.meRole='';S.sec=null;setShell('public');toast('ออกจากระบบแล้ว',{type:'info'});
};
$('#goPublicBtn').onclick=()=>setShell('public');

/* ============================================================
   ADMIN
   ============================================================ */
const SECS={forms:['คลังแบบฟอร์ม','จัดการแม่แบบทั้งหมดของโรงพยาบาล','forms'],
 builder:['ออกแบบฟอร์ม','วางฟิลด์บนกระดาษ A4 แล้วเผยแพร่ให้ผู้ใช้กรอก','builder'],
 inbox:['กล่องคำขอ','ตรวจพิจารณา อนุมัติ และจัดเก็บคำขอถาวร','inbox'],
 mine:['คำขอของฉัน','คำขอที่ส่งในนามบัญชีผู้ดูแลระบบ','mine'],
 staff:['บุคลากร','ทะเบียนผู้ใช้งานและสิทธิ์การเข้าถึง','users'],
 brand:['ตราสัญลักษณ์','โลโก้ที่แสดงบนหัวเว็บและเอกสาร','image']};
function go(sec){
 if(!SECS[sec])return;
 if(S.shell!=='admin')return enterAdmin();
 if(S.sec===sec&&$('#view').dataset.sec===sec)return;
 if(S.sec==='builder'&&S.b.dirty&&sec!=='builder'&&!confirm('มีการแก้ไขที่ยังไม่บันทึก ต้องการออก?'))return;
 S.sec=sec;S._lastAdminSec=sec;
 $$('.rail-item').forEach(b=>{const on=b.dataset.go===sec;b.classList.toggle('on',on);
  on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
 $('#crumbs').innerHTML='<span>แผงจัดการ</span>'+ic('chev',12)+'<b>'+esc(SECS[sec][0])+'</b>';
 $('#main').scrollTop=0;render();
 if(sec==='inbox'||sec==='mine')loadSubmissionsBg();
}
$$('.rail-item').forEach(b=>b.onclick=()=>{if(b.dataset.go==='public')return setShell('public');S.sec=null;go(b.dataset.go)});
function render(){
 const v=$('#view');v.dataset.sec=S.sec;
 ({forms:vForms,builder:vBuilder,inbox:vInbox,mine:vMine,staff:vStaff,brand:vBrand}[S.sec]||vForms)(v);
 paintCounts();
}
const head=(k,a)=>'<div class="sec-head"><div class="sec-title"><h1>'+esc(SECS[k][0])+'</h1><p>'+esc(SECS[k][1])+'</p></div><div class="sec-actions">'+(a||'')+'</div></div>';
const emptyBox=(i,t,d,b)=>'<div class="empty"><div class="em-ico">'+ic(i,26)+'</div><h3>'+esc(t)+'</h3><p>'+esc(d)+'</p>'+(b||'')+'</div>';
const resyncBtn='<button class="btn" data-a="resync">'+ic('broom')+'ล้างแคชและซิงก์</button>';

function vForms(v){
 const f=S.forms;
 let list=DB.templates.filter(t=>{
  if(f.fav&&!DB.favorites.includes(t.id))return false;
  if(f.status==='active'&&!t.is_active)return false;
  if(f.status==='draft'&&t.is_active)return false;
  if(f.dept!=='all'&&t.department!==f.dept)return false;
  if(f.q&&!(t.name+t.description+t.department).toLowerCase().includes(f.q.toLowerCase()))return false;
  return true});
 list.sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name,'th'):new Date(b.updated_at)-new Date(a.updated_at));
 v.innerHTML=head('forms',resyncBtn+'<button class="btn" data-a="csv">'+ic('csv')+'CSV</button><button class="btn pri" data-a="new">'+ic('plus')+'สร้างฟอร์มใหม่</button>')+
 '<div class="toolbar"><div class="search">'+ic('search')+'<input id="fq" value="'+esc(f.q)+'" placeholder="ค้นหาชื่อฟอร์ม / หน่วยงาน…"><kbd>/</kbd></div>'+
 '<select class="sel" id="fstatus"><option value="all">ทุกสถานะ</option><option value="active"'+(f.status==='active'?' selected':'')+'>เปิดใช้งาน</option><option value="draft"'+(f.status==='draft'?' selected':'')+'>ฉบับร่าง</option></select>'+
 '<select class="sel" id="fdept"><option value="all">ทุกหน่วยงาน</option>'+DEPTS.map(d=>'<option'+(f.dept===d?' selected':'')+'>'+esc(d)+'</option>').join('')+'</select>'+
 '<select class="sel" id="fsort"><option value="updated">ล่าสุดที่แก้ไข</option><option value="name"'+(f.sort==='name'?' selected':'')+'>ชื่อ ก–ฮ</option></select>'+
 '<button class="chip'+(f.fav?' on':'')+'" data-a="fav">'+ic('star',13)+'รายการโปรด <b>'+DB.favorites.length+'</b></button>'+
 '<div class="seg"><button data-a="grid" class="'+(f.view==='grid'?'on':'')+'">'+ic('grid',14)+'</button><button data-a="list" class="'+(f.view==='list'?'on':'')+'">'+ic('rows',14)+'</button></div></div>'+
 '<div id="flist">'+(list.length?(f.view==='grid'?formCards(list):formTable(list)):emptyBox('forms','ไม่พบแบบฟอร์ม','ลองเปลี่ยนคำค้นหรือซิงก์ใหม่','<button class="btn pri" data-a="resync">'+ic('broom')+'ล้างแคชและซิงก์</button>'))+'</div>';
 $('#fq').oninput=debounce(e=>{f.q=e.target.value;const p=e.target.selectionStart;render();const n=$('#fq');n.focus();n.setSelectionRange(p,p)},180);
 $('#fstatus').onchange=e=>{f.status=e.target.value;render()};
 $('#fdept').onchange=e=>{f.dept=e.target.value;render()};
 $('#fsort').onchange=e=>{f.sort=e.target.value;render()};
 v.onclick=e=>{
  const a=e.target.closest('[data-a]'),row=e.target.closest('[data-id]');
  if(a){const k=a.dataset.a,id=a.dataset.id||(row&&row.dataset.id);
   if(k==='resync')return hardResync();
   if(k==='new')return newForm();
   if(k==='csv')return csv([['ชื่อฟอร์ม','หน่วยงาน','สถานะ','ฟิลด์','แก้ไขล่าสุด'],...list.map(t=>[t.name,t.department,t.is_active?'เปิดใช้งาน':'ฉบับร่าง',(t.fields||[]).length,fdate(t.updated_at)])],'dontum-forms.csv');
   if(k==='fav'){f.fav=!f.fav;return render()}
   if(k==='grid'||k==='list'){f.view=k;return render()}
   if(k==='star'){const i=DB.favorites.indexOf(id);i<0?DB.favorites.push(id):DB.favorites.splice(i,1);persist();return render()}
   if(k==='edit'){S.b.id=null;return openBuilder(id)}
   if(k==='fill')return openPubFill(id);
   if(k==='dup')return dupForm(id);
   if(k==='dl')return dlForm(id);
   if(k==='pub')return togglePub(id);
   if(k==='del')return delForm(id);
  }
  if(row&&!e.target.closest('button'))formDrawer(row.dataset.id);
 };
 paintThumbs(v);
}
function formCards(list){
 return '<div class="grid">'+list.map((t,i)=>{
  const n=DB.submissions.filter(s=>s.template_id===t.id).length;
  return '<article class="card" data-id="'+esc(t.id)+'" style="animation-delay:'+Math.min(i*28,220)+'ms">'+
  '<div class="card-top"><h3>'+esc(t.name)+'</h3><button class="star'+(DB.favorites.includes(t.id)?' on':'')+'" data-a="star" data-id="'+esc(t.id)+'">'+ic('star',15)+'</button></div>'+
  '<p>'+esc(t.description)+'</p><div class="thumb" data-t="'+esc(t.id)+'"><span class="thumb-tag">A4</span><div class="thumb-c"></div></div>'+
  '<div class="card-meta"><span>'+(t.fields||[]).length+' ฟิลด์</span><span>'+n+' คำขอ</span><span>'+ago(t.updated_at)+'</span></div>'+
  '<span class="pill '+(t.is_active?'on':'off')+'">'+(t.is_active?'เปิดใช้งาน':'ฉบับร่าง')+'</span>'+
  '<div class="card-acts"><button class="btn sm pri" data-a="fill" data-id="'+esc(t.id)+'">'+ic('edit',13)+'กรอก</button>'+
  '<button class="btn sm" data-a="edit" data-id="'+esc(t.id)+'">'+ic('builder',13)+'ออกแบบ</button>'+
  '<button class="btn sm icon" data-a="dup" data-id="'+esc(t.id)+'">'+ic('copy',13)+'</button>'+
  '<button class="btn sm icon" data-a="dl" data-id="'+esc(t.id)+'">'+ic('dl',13)+'</button>'+
  '<button class="btn sm icon" data-a="del" data-id="'+esc(t.id)+'">'+ic('trash',13)+'</button></div></article>'}).join('')+'</div>';
}
function formTable(list){
 return '<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th style="width:34px"></th><th>ชื่อฟอร์ม</th><th>หน่วยงาน</th><th class="num">ฟิลด์</th><th class="num">คำขอ</th><th>สถานะ</th><th>แก้ไข</th><th></th></tr></thead><tbody>'+
 list.map(t=>{const n=DB.submissions.filter(s=>s.template_id===t.id).length;
  return '<tr data-id="'+esc(t.id)+'"><td><button class="star'+(DB.favorites.includes(t.id)?' on':'')+'" data-a="star" data-id="'+esc(t.id)+'">'+ic('star',14)+'</button></td>'+
  '<td><b>'+esc(t.name)+'</b></td><td>'+esc(t.department)+'</td><td class="num">'+(t.fields||[]).length+'</td><td class="num">'+n+'</td>'+
  '<td><span class="pill '+(t.is_active?'on':'off')+'">'+(t.is_active?'เปิด':'ร่าง')+'</span></td><td class="num">'+ago(t.updated_at)+'</td>'+
  '<td class="acts"><button class="btn sm" data-a="edit" data-id="'+esc(t.id)+'">ออกแบบ</button>'+
  '<button class="btn sm icon" data-a="dup" data-id="'+esc(t.id)+'">'+ic('copy',13)+'</button>'+
  '<button class="btn sm icon" data-a="pub" data-id="'+esc(t.id)+'">'+ic(t.is_active?'lock':'check',13)+'</button>'+
  '<button class="btn sm icon" data-a="del" data-id="'+esc(t.id)+'">'+ic('trash',13)+'</button></td></tr>'}).join('')+
 '</tbody></table></div></div>';
}
function newForm(){
 modal('สร้างฟอร์มใหม่',
  '<div class="fld"><label>ชื่อฟอร์ม *</label><input id="nfName" maxlength="120" placeholder="เช่น แบบฟอร์มขอใช้ห้องประชุม"></div>'+
  '<div class="fld"><label>คำอธิบาย</label><textarea id="nfDesc"></textarea></div>'+
  '<div class="fld"><label>หน่วยงาน</label><select id="nfDept">'+DEPTS.map(d=>'<option>'+esc(d)+'</option>').join('')+'</select></div>'+
  '<div class="fld"><label>เริ่มจาก</label><select id="nfBase"><option value="std">โครงร่างมาตรฐาน</option><option value="blank">กระดาษเปล่า</option>'+
  DB.templates.map(t=>'<option value="'+esc(t.id)+'">คัดลอกจาก: '+esc(t.name)+'</option>').join('')+'</select></div>',
  '<button class="btn" data-close-modal>ยกเลิก</button><button class="btn pri" id="nfGo">'+ic('plus')+'สร้างและออกแบบ</button>');
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#nfName').focus();
 $('#nfGo').onclick=()=>{
  const name=$('#nfName').value.trim();if(!name)return toast('กรุณากรอกชื่อฟอร์ม',{type:'warn'});
  const base=$('#nfBase').value;let fields=[];
  if(base==='std')fields=baseFields(name);
  else if(base!=='blank'){const s=tpl(base);if(s)fields=JSON.parse(JSON.stringify(s.fields||[])).map(f=>{f.id=tmpId('f_');return f})}
  const t={id:uid('tpl_'),name,description:$('#nfDesc').value.trim(),department:$('#nfDept').value,
   is_active:false,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),fields};
  DB.deptMap[t.id]=t.department;DB.templates.unshift(t);persist();closeModal();
  toast('สร้างฟอร์มแล้ว — กดบันทึกเพื่อขึ้นเซิร์ฟเวอร์',{type:'ok'});openBuilder(t.id);
 };
}
function dupForm(id){
 const s=tpl(id);if(!s)return;
 const t=JSON.parse(JSON.stringify(s));
 t.id=uid('tpl_');t.name=s.name+' (สำเนา)';t.is_active=false;
 t.created_at=t.updated_at=new Date().toISOString();
 t.fields=(t.fields||[]).map(f=>{f.id=tmpId('f_');return f});
 DB.deptMap[t.id]=t.department;DB.templates.unshift(t);persist();render();
 toast('คัดลอก “'+t.name+'” แล้ว',{type:'ok',undo:()=>{DB.templates=DB.templates.filter(x=>x.id!==t.id);persist();render()}});
}
function delForm(id){
 const i=DB.templates.findIndex(t=>t.id===id);if(i<0)return;
 const t=DB.templates[i];DB.templates.splice(i,1);persist();render();
 enqueue('deleteFormTemplate',{id},'ลบฟอร์ม');
 toast('ลบ “'+t.name+'” แล้ว',{type:'bad',undo:()=>{DB.templates.splice(i,0,t);persist();render()}});
}
function togglePub(id){
 const t=tpl(id);if(!t)return;
 if(S.live&&!isUuid(id))return toast('ฟอร์มร่างต้องบันทึกก่อนเผยแพร่',{type:'warn'});
 t.is_active=!t.is_active;t.updated_at=new Date().toISOString();persist();render();
 enqueue('publishFormTemplate',{id},'เปิด/ปิดฟอร์ม');
 toast(t.is_active?'เผยแพร่ “'+t.name+'” แล้ว':'ปิดรับ “'+t.name+'”',{type:t.is_active?'ok':'warn'});
}
function dlForm(id){
 ensureFields(id).then(t=>{
  if(!t||!(t.fields||[]).length)return toast('ยังไม่มีฟิลด์ให้ดาวน์โหลด',{type:'warn'});
  modal('ดาวน์โหลดแบบฟอร์ม','<div class="fld"><label>ชื่อไฟล์</label><input id="dlName" value="'+esc(fname(t.name))+'_blank"></div>',
   '<button class="btn" data-close-modal>ยกเลิก</button><button class="btn" id="dlPdf">'+ic('print')+'PDF</button><button class="btn pri" id="dlHtml">'+ic('dl')+'HTML</button>');
  $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
  $('#dlHtml').onclick=()=>{download(sheetHTML(t.fields,{},t.name,false),($('#dlName').value||'form')+'.html');closeModal()};
  $('#dlPdf').onclick=()=>{printSheet(t.fields,{},t.name);closeModal()};
 });
}
function formDrawer(id){
 const t=tpl(id);if(!t)return;
 const n=DB.submissions.filter(s=>s.template_id===id).length;
 openDrawer('แบบฟอร์ม',t.name,
  '<dl class="kv"><dt>หน่วยงาน</dt><dd>'+esc(t.department)+'</dd><dt>สถานะ</dt><dd><span class="pill '+(t.is_active?'on':'off')+'">'+(t.is_active?'เปิดรับ':'ฉบับร่าง')+'</span></dd>'+
  '<dt>ฟิลด์</dt><dd>'+(t.fields||[]).length+'</dd><dt>คำขอ</dt><dd>'+n+'</dd><dt>แก้ไข</dt><dd>'+fdate(t.updated_at)+'</dd></dl>'+
  '<div class="d-sec">ตัวอย่าง A4</div><div class="mini-a4" id="dThumb" style="aspect-ratio:210/297"><div class="sc"></div></div>',
  '<button class="btn pri" data-d="fill">'+ic('edit')+'กรอก</button><button class="btn" data-d="edit">'+ic('builder')+'ออกแบบ</button>'+
  '<button class="btn" data-d="dup">'+ic('copy')+'คัดลอก</button><button class="btn" data-d="dl">'+ic('dl')+'ดาวน์โหลด</button>'+
  '<button class="btn '+(t.is_active?'':'ok')+'" data-d="pub">'+ic(t.is_active?'lock':'check')+(t.is_active?'ปิดรับ':'เผยแพร่')+'</button>');
 ensureFields(id).then(tt=>{requestAnimationFrame(()=>{const w=$('#dThumb');if(!w||!tt)return;const c=$('.sc',w);
  (tt.fields||[]).map(norm).forEach(f=>c.appendChild(fieldEl(f,'print',{})));
  c.style.transform='scale('+(w.clientWidth/(PW*MM))+')'})});
 $('#drawerFoot').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;closeDrawer();
  ({fill:()=>openPubFill(id),edit:()=>openBuilder(id),dup:()=>dupForm(id),dl:()=>dlForm(id),pub:()=>togglePub(id)})[b.dataset.d]()};
}

/* ============================================================
   BUILDER  ·  production-grade field editing
   ============================================================ */
function openBuilder(id){
 if(S.shell!=='admin')return enterAdmin();
 ensureFields(id).then(t=>{
  if(!t)return;
  S.b={id,fields:JSON.parse(JSON.stringify(t.fields||[])).map(norm),deleted:[],sel:null,propFid:null,
   zoom:S.b.zoom||.72,grid:S.b.grid,snap:S.b.snap,dirty:false,undo:[],redo:[],saving:false,showOverlap:S.b.showOverlap!==false};
  S.sec=null;go('builder');
 });
}
function vBuilder(v){
 if(!S.b.id){
  v.innerHTML=head('builder','<button class="btn pri" data-a="new">'+ic('plus')+'สร้างฟอร์มใหม่</button>')+
   '<div class="grid">'+DB.templates.map((t,i)=>'<article class="card" data-open="'+esc(t.id)+'" style="animation-delay:'+Math.min(i*28,220)+'ms">'+
   '<div class="card-top"><h3>'+esc(t.name)+'</h3><span class="pill '+(t.is_active?'on':'off')+'">'+(t.is_active?'ใช้งาน':'ร่าง')+'</span></div>'+
   '<p>'+esc(t.description)+'</p><div class="card-meta"><span>'+(t.fields||[]).length+' ฟิลด์</span><span>'+ago(t.updated_at)+'</span></div>'+
   '<div class="card-acts"><button class="btn sm pri" data-open="'+esc(t.id)+'">'+ic('builder',13)+'เปิดออกแบบ</button>'+
   '<button class="btn sm" data-a="dup" data-id="'+esc(t.id)+'">'+ic('copy',13)+'คัดลอก</button></div></article>').join('')+'</div>';
  v.onclick=e=>{const o=e.target.closest('[data-open]'),a=e.target.closest('[data-a]');
   if(a&&a.dataset.a==='new')return newForm();
   if(a&&a.dataset.a==='dup')return dupForm(a.dataset.id);
   if(o)openBuilder(o.dataset.open)};
  return;
 }
 const t=tpl(S.b.id),b=S.b;
 v.innerHTML='<div class="sec-head"><div class="sec-title"><h1>'+esc(t.name)+'</h1><p>คลิกฟิลด์เพื่อเลือก · ดับเบิลคลิกแก้ข้อความ · Ctrl+S บันทึก · Ctrl+Z ย้อน</p></div>'+
  '<div class="sec-actions"><span class="save-state '+(b.dirty?'dirty':'saved')+'" id="saveState">'+ic(b.dirty?'clock':'check',13)+(b.dirty?'ยังไม่บันทึก':'บันทึกแล้ว')+'</span>'+
  '<button class="btn" data-b="preview">'+ic('eye')+'ตัวอย่าง</button><button class="btn" data-b="dl">'+ic('dl')+'ดาวน์โหลด</button>'+
  '<button class="btn pri" data-b="save">'+ic('save')+'บันทึก</button></div></div>'+
 '<div class="bld"><div class="bld-col">'+
  '<div class="panel" style="flex:none"><div class="panel-h">'+ic('plus',14)+'<b>เพิ่มฟิลด์</b></div><div class="panel-b"><div class="tools">'+
   FT.map(f=>'<div class="tool" draggable="true" data-ft="'+f+'" title="'+FTL[f]+'">'+ic(FTI[f],16)+'<span>'+FTL[f]+'</span></div>').join('')+
  '</div></div></div>'+
  '<div class="panel" style="flex:1"><div class="panel-h">'+ic('rows',14)+'<b>ลำดับชั้น ('+b.fields.length+')</b></div>'+
  '<div class="panel-b"><div class="layers" id="layers"></div></div></div></div>'+
 '<div class="bld-mid"><div class="bld-bar"><input class="bld-name" id="bName" value="'+esc(t.name)+'">'+
  '<label class="tgl"><input type="checkbox" id="bPub"'+(t.is_active?' checked':'')+'>เปิดรับ</label>'+
  '<label class="tgl"><input type="checkbox" id="bGrid"'+(b.grid?' checked':'')+'>ตาราง</label>'+
  '<label class="tgl"><input type="checkbox" id="bSnap"'+(b.snap?' checked':'')+'>snap</label>'+
  '<button class="ovl-chip" id="ovlChip" data-b="ovl" title="ตรวจ/แก้ฟิลด์ซ้อนทับ">'+ic('layers',13)+'<span>—</span></button>'+
  '<span class="sp"></span>'+
  '<button class="btn sm icon" data-b="undo" title="ย้อนกลับ (Ctrl+Z)">'+ic('undo',14)+'</button>'+
  '<button class="btn sm icon" data-b="redo" title="ทำซ้ำ (Ctrl+Shift+Z)">'+ic('redo',14)+'</button>'+
  '<button class="btn sm icon" data-b="zo">'+ic('zoomout',14)+'</button>'+
  '<button class="btn sm" data-b="fit" id="zLbl">'+Math.round(b.zoom*100)+'%</button>'+
  '<button class="btn sm icon" data-b="zi">'+ic('zoomin',14)+'</button>'+
  '<button class="btn sm" data-b="close">'+ic('x',14)+'ปิด</button></div>'+
  '<div class="canvas-wrap" id="cwrap"><div class="zoom-box"><div class="a4'+(b.grid?' grid-on':'')+'" id="canvas"></div></div></div></div>'+
 '<div class="bld-col"><div class="panel" style="flex:1">'+
  '<div class="prop-head" id="propHead"></div>'+
  '<div class="panel-b" id="props" data-fid=""></div>'+
  '<div class="pacts" id="pacts" hidden>'+
   '<button class="btn sm" data-b="undo">'+ic('undo',13)+'ย้อน</button>'+
   '<button class="btn sm" data-b="redo">'+ic('redo',13)+'ทำซ้ำ</button>'+
   '<button class="btn sm" data-b="dupf">'+ic('copy',13)+'สำเนา</button>'+
   '<button class="btn sm bad" data-b="delf">'+ic('trash',13)+'ลบ</button>'+
   '<button class="btn sm" data-b="front">'+ic('up',13)+'ขึ้นหน้า</button>'+
   '<button class="btn sm" data-b="back">'+ic('down',13)+'ลงหลัง</button>'+
   '<button class="btn sm" data-b="align">'+ic('target',13)+'จัดไม่ทับ</button>'+
   '<button class="btn sm" data-b="center">'+ic('rows',13)+'กลางแนวนอน</button>'+
  '</div></div></div></div>';
 paintCanvas('#canvas',b.fields,'design');
 const cv=$('#canvas');cv.classList.remove('fill-live');cv.style.height='';delete cv.dataset.autoH;
 decorateCanvas();zoomTo(cv,b.zoom);
 renderLayers();refreshProps(true);updateUndoUI();paintOverlap();
 bindBuilder();
}
/* ---- canvas decoration (idempotent) ---- */
function decorateCanvas(){
 $$('#canvas .cf').forEach(el=>{
  el.classList.add('bf');
  el.classList.toggle('on',el.dataset.fid===S.b.sel);
  if(!el.querySelector(':scope > .grip-r')){
   const g=mk('div','grip-r');el.appendChild(g);
   g.addEventListener('pointerdown',resizeStart);
  }
  if(!el._bound){el._bound=true;
   el.addEventListener('pointerdown',dragStart);
   el.addEventListener('dblclick',inlineEdit);
  }
 });
}
/* ---- replace only the target field element, coalesced per frame ---- */
const _patchQ=new Map();let _patchRaf=0;
function patchFieldEl(f){
 _patchQ.set(f.id,f);
 if(_patchRaf)return;
 _patchRaf=requestAnimationFrame(()=>{
  _patchRaf=0;
  _patchQ.forEach(ff=>{
   const old=$('#canvas [data-fid="'+CSS.escape(ff.id)+'"]');
   if(!old)return;
   const nu=fieldEl(ff,'design',{});
   old.replaceWith(nu);
  });
  _patchQ.clear();
  decorateCanvas();paintOverlap();
 });
}
function repaintCanvas(){
 paintCanvas('#canvas',S.b.fields,'design');
 const cv=$('#canvas');if(cv){cv.classList.remove('fill-live');cv.style.height='';delete cv.dataset.autoH;zoomTo(cv,S.b.zoom)}
 decorateCanvas();renderLayers();paintOverlap();
}
function renderLayers(){
 const L=$('#layers');if(!L)return;
 const ov=overlapSet();
 L.innerHTML=S.b.fields.map((f,i)=>
  '<div class="layer'+(S.b.sel===f.id?' on':'')+'" draggable="true" data-lid="'+esc(f.id)+'" data-i="'+i+'">'+
  '<span class="grip">'+ic('grip',13)+'</span>'+ic(FTI[f.field_type],13)+
  '<span class="lt">'+esc(f.label||FTL[f.field_type])+'</span>'+
  (ov.has(f.id)?'<span class="ov" title="ซ้อนทับกับฟิลด์อื่น">'+ic('warn',12)+'</span>':'')+
  '<button class="lx" data-lx="'+esc(f.id)+'">'+ic('x',12)+'</button></div>').join('')
  ||'<p style="font-size:12px;color:var(--text3);padding:8px">ยังไม่มีฟิลด์ — ลากจากกล่องด้านบน</p>';
 bindLayers();
}
function bindLayers(){
 let di=null;
 $$('.layer').forEach(l=>{
  l.addEventListener('dragstart',()=>{di=+l.dataset.i;l.classList.add('drag')});
  l.addEventListener('dragend',()=>{l.classList.remove('drag');$$('.layer').forEach(x=>x.classList.remove('over'))});
  l.addEventListener('dragover',e=>{e.preventDefault();l.classList.add('over')});
  l.addEventListener('dragleave',()=>l.classList.remove('over'));
  l.addEventListener('drop',e=>{e.preventDefault();const to=+l.dataset.i;if(di===null||di===to)return;
   pushUndo();const [m]=S.b.fields.splice(di,1);S.b.fields.splice(to,0,m);markDirty();renderLayers()});
  l.addEventListener('click',e=>{if(e.target.closest('[data-lx]'))return;selectField(l.dataset.lid)});
  const x=l.querySelector('[data-lx]');
  if(x)x.addEventListener('click',e=>{e.stopPropagation();removeField(x.dataset.lx)});
 });
}
/* ---- overlap detection ---- */
function rectOf(f){return {x:f.pos_y,y:f.pos_x,l:f.pos_x,t:f.pos_y,r:f.pos_x+f.width,b:f.pos_y+f.height}}
function overlapSet(){
 const set=new Set(),fs=S.b.fields;
 for(let i=0;i<fs.length;i++)for(let j=i+1;j<fs.length;j++){
  const a=fs[i],b=fs[j];
  const w=Math.min(a.pos_x+a.width,b.pos_x+b.width)-Math.max(a.pos_x,b.pos_x);
  const h=Math.min(a.pos_y+a.height,b.pos_y+b.height)-Math.max(a.pos_y,b.pos_y);
  if(w<=0||h<=0)continue;
  const inter=w*h,small=Math.min(a.width*a.height,b.width*b.height);
  if(small>0&&inter/small>=.6){set.add(a.id);set.add(b.id)}
 }
 return set;
}
function paintOverlap(){
 const chip=$('#ovlChip');if(!chip)return;
 const set=S.b.showOverlap?overlapSet():new Set();
 $$('#canvas .cf').forEach(el=>el.classList.toggle('ovl',set.has(el.dataset.fid)));
 const n=set.size;
 chip.classList.toggle('on',n>0);chip.classList.toggle('clean',n===0);
 chip.innerHTML=ic(n?'warn':'check',13)+'<span>'+(n?('ซ้อนทับ '+n):'ไม่ซ้อนทับ')+'</span>';
 chip.title=n?'คลิกเพื่อแยกฟิลด์ที่ซ้อนทับกันอัตโนมัติ':'ไม่มีฟิลด์ซ้อนทับกัน';
}
function resolveOverlaps(){
 const fs=S.b.fields.slice().sort((a,b)=>a.pos_y-b.pos_y||a.pos_x-b.pos_x);
 const placed=[];let moved=0;
 fs.forEach(f=>{
  let guard=0;
  while(guard++<60){
   const hit=placed.find(p=>{
    const w=Math.min(p.pos_x+p.width,f.pos_x+f.width)-Math.max(p.pos_x,f.pos_x);
    const h=Math.min(p.pos_y+p.height,f.pos_y+f.height)-Math.max(p.pos_y,f.pos_y);
    if(w<=0||h<=0)return false;
    const small=Math.min(p.width*p.height,f.width*f.height);
    return small>0&&(w*h)/small>=.6;
   });
   if(!hit)break;
   const ny=Math.round((hit.pos_y+hit.height+3)*2)/2;
   if(ny+f.height>PH-2){f.pos_x=clamp(f.pos_x+6,0,PW-f.width);f.pos_y=2}
   else f.pos_y=ny;
   moved++;
  }
  placed.push(f);
 });
 return moved;
}
/* ---- selection + properties binding (THE FIX) ---- */
function selectField(id){
 if(S.b.sel===id){paintSel();return}
 flushPropEdit();            // commit ค่าที่ค้างอยู่ ให้ "ฟิลด์เดิม" ก่อนเปลี่ยน
 S.b.sel=id;
 refreshProps(true);         // ผูกแผงกับฟิลด์ใหม่แบบเต็ม
 paintSel();
 $$('.layer').forEach(l=>l.classList.toggle('on',l.dataset.lid===id));
}
function paintSel(){$$('#canvas .cf').forEach(e=>e.classList.toggle('on',e.dataset.fid===S.b.sel))}
function flushPropEdit(){
 const p=$('#props');if(!p)return;
 const ae=document.activeElement;
 if(ae&&p.contains(ae)&&ae.dataset&&ae.dataset.p){
  applyProp(p.dataset.fid,ae.dataset.p,ae);   // ใช้ fid ของแผง ไม่ใช่ selection
 }
}
function refreshProps(force){
 const p=$('#props'),hd=$('#propHead'),pa=$('#pacts');if(!p)return;
 const id=S.b.sel,f=id?S.b.fields.find(x=>x.id===id):null;
 if(!f){
  p.dataset.fid='';S.b.propFid=null;
  if(hd)hd.innerHTML='<span class="tg">'+ic('edit',13)+'</span><span class="nm"><b>คุณสมบัติฟิลด์</b><small>ยังไม่ได้เลือกฟิลด์</small></span>';
  p.innerHTML='<p style="font-size:12.5px;color:var(--text3);padding:6px">คลิกฟิลด์บนกระดาษ หรือเลือกจากรายการลำดับชั้น เพื่อแก้ไขคุณสมบัติ</p>';
  if(pa)pa.hidden=true;
  return;
 }
 // ถ้าเป็นฟิลด์เดิมและกำลังพิมพ์อยู่ → ไม่ re-render (กัน caret หาย)
 if(!force&&p.dataset.fid===f.id&&p.contains(document.activeElement))return;
 p.dataset.fid=f.id;S.b.propFid=f.id;
 if(hd)hd.innerHTML='<span class="tg">'+ic(FTI[f.field_type],13)+'</span>'+
  '<span class="nm"><b>'+esc(f.label||FTL[f.field_type])+'</b><small>'+esc(f.name)+' · '+FTL[f.field_type]+'</small></span>'+
  '<span class="lk">กำลังแก้กล่องนี้</span>';
 p.innerHTML='<div class="prop-lock">'+ic('lock',12)+'<span>ค่าที่แก้ในแผงนี้มีผลกับ <b>'+esc(f.label||f.name)+'</b> เท่านั้น การเลือกฟิลด์อื่นจะไม่ย้ายค่าข้ามกล่อง</span></div>'+propHTML(f);
 if(pa)pa.hidden=false;
 p.oninput=p.onchange=propChange;
}
/* ---- apply one property to a SPECIFIC field id ---- */
function applyProp(fid,key,el){
 const f=S.b.fields.find(x=>x.id===fid);   // ←.Bind กับฟิลด์ที่แผง render ไว้
 if(!f||!key)return false;
 let changed=false;
 if(key==='required'){if(f.required!==el.checked){f.required=el.checked;changed=true}}
 else if(key==='bg_transparent'){const v=el.checked?'transparent':'#ffffff';if(f.bg_color!==v){f.bg_color=v;changed=true}}
 else if(key==='options'){const v=el.value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(JSON.stringify(v)!==JSON.stringify(f.options||[])){f.options=v;changed=true}}
 else if(key==='name'){const v=el.value.toLowerCase().replace(/[^a-z0-9_]/g,'_');
  if(v!==el.value)el.value=v;if(f.name!==v){f.name=v;changed=true}}
 else if(['pos_x','pos_y','width','height','font_size'].includes(key)){
  const n=parseFloat(el.value);if(!isFinite(n))return false;
  if(f[key]!==n){f[key]=n;changed=true}
  f.width=clamp(f.width,3,PW);f.height=clamp(f.height,1,PH);
  f.pos_x=clamp(f.pos_x,0,PW-f.width);f.pos_y=clamp(f.pos_y,0,PH-f.height);
 }
 else if(key==='value'){if(f.value!==el.value){f.value=el.value;if(f.field_type==='label'||f.field_type==='title')f.label=el.value;changed=true}}
 else {if(f[key]!==el.value){f[key]=el.value;changed=true}}
 if(changed){patchFieldEl(f);markDirty();renderLayers();
  const hd=$('#propHead');
  if(hd&&S.b.propFid===f.id){const b=hd.querySelector('.nm b'),s=hd.querySelector('.nm small');
   if(b)b.textContent=f.label||FTL[f.field_type];
   if(s)s.textContent=f.name+' · '+FTL[f.field_type]}}
 return changed;
}
function propChange(e){
 const p=$('#props'),el=e.target,key=el.dataset&&el.dataset.p;
 if(!p||!key)return;
 const fid=p.dataset.fid;                  // ← ไม่ใช้ S.b.sel
 if(!fid)return;
 if(key==='picklogo'){$('#logoFile').dataset.target='field';$('#logoFile').dataset.fid=fid;$('#logoFile').click();return}
 if(!p._armed){pushUndo();p._armed=true;setTimeout(()=>{p._armed=false},900)}
 applyProp(fid,key,el);
}
function propHTML(f){
 const t=f.field_type,isTxt=t==='label'||t==='title',isIn=INP.includes(t);
 const g=(l,h,n)=>'<div class="prop"><label>'+l+'</label>'+h+(n?'<div class="pnote">'+n+'</div>':'')+'</div>';
 const num=(k,v,mn,mx,s)=>'<input type="number" data-p="'+k+'" value="'+v+'" min="'+mn+'" max="'+mx+'" step="'+s+'">';
 const sel=(k,v,ps)=>'<select data-p="'+k+'">'+ps.map(p=>'<option value="'+p[0]+'"'+(v===p[0]?' selected':'')+'>'+p[1]+'</option>').join('')+'</select>';
 let h='<div class="prop"><label>ชนิดฟิลด์</label><div style="font-size:13px;font-weight:700;display:flex;gap:6px;align-items:center">'+ic(FTI[t],14)+FTL[t]+'</div></div>';
 if(t==='logo')h+=g('รูปโลโก้','<button class="btn sm" style="width:100%" data-p="picklogo">'+ic('image',13)+'เลือกรูป…</button>'+(f.value?'<img src="'+f.value+'" style="max-width:100%;margin-top:6px;border:1px solid var(--line);border-radius:6px;background:#fff">':''));
 if(isTxt)h+=g('ข้อความ','<textarea data-p="value" rows="3">'+esc(f.value||f.label)+'</textarea>');
 if(isIn)h+=g(t==='signature'?'ข้อความใต้ลายเซ็น':'ป้ายชื่อช่อง','<input type="text" data-p="label" value="'+esc(f.label)+'">');
 if(t==='text_input'||t==='textarea'||t==='date')h+=g('ค่าเริ่มต้น','<input type="text" data-p="value" value="'+esc(f.value)+'">');
 if(t==='checkbox_agree')h+=g('ข้อความรับรอง','<textarea data-p="value" rows="2">'+esc(f.value)+'</textarea>');
 if(OPT.includes(t))h+=g('ตัวเลือก (1 บรรทัด = 1 ข้อ)','<textarea data-p="options" rows="4">'+esc((f.options||[]).join('\n'))+'</textarea>');
 if(isIn)h+=g('ชื่อฟิลด์ (name)','<input type="text" data-p="name" value="'+esc(f.name)+'">','อังกฤษ ตัวเลข _')+
  '<label class="pchk"><input type="checkbox" data-p="required"'+(f.required?' checked':'')+'>จำเป็นต้องกรอก</label>';
 h+='<div class="pr2">'+g('X (มม.)',num('pos_x',f.pos_x,0,PW,.5))+g('Y (มม.)',num('pos_y',f.pos_y,0,PH,.5))+'</div>'+
    '<div class="pr2">'+g('กว้าง',num('width',f.width,3,PW,.5))+g('สูง',num('height',f.height,1,PH,.5))+'</div>';
 if(t!=='divider'&&t!=='logo'){
  h+='<div class="pr2">'+g('ขนาดอักษร',num('font_size',f.font_size,6,72,1))+g('น้ำหนัก',sel('font_weight',f.font_weight,[['normal','ปกติ'],['bold','หนา']]))+'</div>';
  h+=g('จัดแนว',sel('text_align',f.text_align,[['left','ซ้าย'],['center','กลาง'],['right','ขวา']]));
  h+='<div class="pr2">'+g('สีอักษร','<input type="color" data-p="text_color" value="'+(/^#[0-9a-f]{6}$/i.test(f.text_color)?f.text_color:'#111111')+'">')+
     g('สีพื้น','<input type="color" data-p="bg_color" value="'+(/^#[0-9a-f]{6}$/i.test(f.bg_color)?f.bg_color:'#ffffff')+'">')+'</div>'+
     '<label class="pchk"><input type="checkbox" data-p="bg_transparent"'+(f.bg_color==='transparent'?' checked':'')+'>พื้นหลังโปร่งใส</label>';
  h+=g('เส้นขอบ',sel('border_style',f.border_style,[['none','ไม่มี'],['dotted','จุด'],['dashed','ประ'],['solid','ทึบ']]));
 }
 if(t!=='logo')h+=g(t==='divider'?'สีเส้น':'สีเส้นขอบ','<input type="color" data-p="border_color" value="'+(/^#[0-9a-f]{6}$/i.test(f.border_color)?f.border_color:'#333333')+'">');
 return h;
}
function bindBuilder(){
 const b=S.b,v=$('#view');
 $('#bName').oninput=e=>{const t=tpl(b.id);if(t){t.name=e.target.value;markDirty()}};
 $('#bPub').onchange=e=>{const t=tpl(b.id);if(t){t.is_active=e.target.checked;markDirty()}};
 $('#bGrid').onchange=e=>{b.grid=e.target.checked;$('#canvas').classList.toggle('grid-on',b.grid)};
 $('#bSnap').onchange=e=>{b.snap=e.target.checked};
 v.onclick=e=>{
  const bt=e.target.closest('[data-b]'),tl=e.target.closest('.tool');
  if(tl)return addField(tl.dataset.ft);
  if(!bt)return;
  const k=bt.dataset.b;
  if(k==='save')saveBuilder();
  else if(k==='close'){if(b.dirty&&!confirm('ยังไม่ได้บันทึก ปิดเลย?'))return;S.b.id=null;S.b.propFid=null;S.sec=null;go('builder')}
  else if(k==='undo')doUndo();else if(k==='redo')doRedo();
  else if(k==='ovl'){const n=overlapSet().size;
   if(!n)return toast('ไม่มีฟิลด์ซ้อนทับกันอยู่แล้ว',{type:'ok'});
   pushUndo();const moved=resolveOverlaps();markDirty();repaintCanvas();refreshProps(true);
   toast('แยกฟิลด์ที่ซ้อนทับ '+moved+' ตำแหน่งแล้ว',{type:'ok',undo:doUndo})}
  else if(k==='zi'||k==='zo'||k==='fit'){
   b.zoom=k==='fit'?fitOf($('#cwrap')):clamp(b.zoom+(k==='zi'?.1:-.1),.25,1.6);
   zoomTo($('#canvas'),b.zoom);$('#zLbl').textContent=Math.round(b.zoom*100)+'%'}
  else if(k==='preview'){const c=paintCanvas('#pvCanvas',b.fields,'fill',{});$('#previewScrim').hidden=false;requestAnimationFrame(()=>zoomTo(c,fitOf($('#pvWrap'))))}
  else if(k==='dl')dlForm(b.id);
  else if(k==='dupf')dupField(b.sel);
  else if(k==='delf')removeField(b.sel);
  else if(k==='front')reorder(b.sel,-1);
  else if(k==='back')reorder(b.sel,1);
  else if(k==='align'){const f=b.fields.find(x=>x.id===b.sel);if(!f)return;
   pushUndo();const others=b.fields.filter(x=>x.id!==f.id);
   let guard=0;while(guard++<60){
    const hit=others.find(p=>{const w=Math.min(p.pos_x+p.width,f.pos_x+f.width)-Math.max(p.pos_x,f.pos_x);
     const h=Math.min(p.pos_y+p.height,f.pos_y+f.height)-Math.max(p.pos_y,f.pos_y);
     if(w<=0||h<=0)return false;const sm=Math.min(p.width*p.height,f.width*f.height);
     return sm>0&&(w*h)/sm>=.6});
    if(!hit)break;f.pos_y=Math.round((hit.pos_y+hit.height+3)*2)/2;
    if(f.pos_y+f.height>PH-2){f.pos_y=2;f.pos_x=clamp(f.pos_x+6,0,PW-f.width)}}
   markDirty();patchFieldEl(f);refreshProps(true);renderLayers();toast('จัดตำแหน่งไม่ให้ทับแล้ว',{type:'ok'})}
  else if(k==='center'){const f=b.fields.find(x=>x.id===b.sel);if(!f)return;
   pushUndo();f.pos_x=Math.round((PW-f.width)/2*2)/2;markDirty();patchFieldEl(f);refreshProps(true);toast('จัดกึ่งกลางแนวนอนแล้ว',{type:'ok'})}
 };
 $$('.tool').forEach(t=>t.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain','ft:'+t.dataset.ft)));
 const cv=$('#canvas');
 cv.addEventListener('dragover',e=>{if(!S.b.id)return;e.preventDefault();cv.classList.add('drop')});
 cv.addEventListener('dragleave',()=>cv.classList.remove('drop'));
 cv.addEventListener('drop',e=>{e.preventDefault();cv.classList.remove('drop');
  const d=e.dataTransfer.getData('text/plain');if(!d.startsWith('ft:'))return;
  const r=cv.getBoundingClientRect(),s=PW/r.width;
  addField(d.slice(3),(e.clientX-r.left)*s,(e.clientY-r.top)*s,true)});
 cv.addEventListener('pointerdown',e=>{
  if(e.target===cv){flushPropEdit();S.b.sel=null;refreshProps(true);paintSel();
   $$('.layer').forEach(l=>l.classList.remove('on'))}
 });
}
function pushUndo(){const b=S.b;b.undo.push(JSON.stringify({f:b.fields,d:b.deleted,s:b.sel}));if(b.undo.length>60)b.undo.shift();b.redo=[];updateUndoUI()}
function restoreSnap(s){
 const b=S.b;b.fields=s.f;b.deleted=s.d;
 b.sel=s.s&&s.f.some(f=>f.id===s.s)?s.s:null;
 markDirty();repaintCanvas();refreshProps(true);updateUndoUI();
}
function doUndo(){const b=S.b;if(!b.undo.length)return;flushPropEdit();
 b.redo.push(JSON.stringify({f:b.fields,d:b.deleted,s:b.sel}));restoreSnap(JSON.parse(b.undo.pop()))}
function doRedo(){const b=S.b;if(!b.redo.length)return;flushPropEdit();
 b.undo.push(JSON.stringify({f:b.fields,d:b.deleted,s:b.sel}));restoreSnap(JSON.parse(b.redo.pop()))}
function updateUndoUI(){$$('[data-b="undo"]').forEach(u=>u.disabled=!S.b.undo.length);$$('[data-b="redo"]').forEach(r=>r.disabled=!S.b.redo.length)}
function markDirty(){S.b.dirty=true;const s=$('#saveState');if(s){s.className='save-state dirty';s.innerHTML=ic('clock',13)+'ยังไม่บันทึก'}autoSave()}
const autoSave=debounce(()=>{
 if(!S.b.dirty||!S.b.id||S.b.saving)return;
 const a=document.activeElement;
 if(a&&(a.id==='bName'||(a.closest&&a.closest('#props,.bld-bar'))))return;
 saveBuilder(true);
},2500);
function saveBuilder(auto){
 const b=S.b,t=tpl(b.id);if(!t||b.saving)return;
 flushPropEdit();
 const seen={};
 for(const f of b.fields){
  if(!f.name)return toast('มีฟิลด์ที่ยังไม่มีชื่อ',{type:'warn'});
  if(seen[f.name]){selectField(f.id);return toast('ชื่อฟิลด์ซ้ำ: '+f.name,{type:'warn'})}
  seen[f.name]=1;
  if(OPT.includes(f.field_type)&&!(f.options||[]).length){selectField(f.id);return toast('ฟิลด์ “'+f.label+'” ต้องมีตัวเลือก',{type:'warn'})}
 }
 t.fields=JSON.parse(JSON.stringify(b.fields));t.updated_at=new Date().toISOString();
 b.dirty=false;persist();
 const st=$('#saveState');if(st){st.className='save-state saved';st.innerHTML=ic('check',13)+'บันทึกแล้ว'}
 b.undo=[];b.redo=[];updateUndoUI();
 if(!auto)toast('บันทึก “'+t.name+'” แล้ว',{type:'ok'});
 if(!S.live||!accessToken)return;
 b.saving=true;
 (async()=>{
  let tid=t.id;
  if(!isUuid(tid)){
   const c=await rawApi('createFormTemplate',{data:{name:t.name,description:t.description}},true);
   const nid=repairUuid(c&&c.id);if(!nid)throw new Error('รหัสฟอร์มกลับไม่ถูกต้อง');
   const i=DB.templates.findIndex(x=>x.id===t.id);
   if(DB.deptMap[t.id])DB.deptMap[nid]=DB.deptMap[t.id];
   delete DB.deptMap[t.id];
   t.id=nid;if(i>=0)DB.templates[i]=t;b.id=nid;tid=nid;persist();
  }
  const ids=[],send=b.fields.map((f,i)=>{
   const c=Object.assign({},f);
   if(isUuid(f.id)){ids[i]=f.id;c.id=f.id}
   else{const s='tmp_'+Math.random().toString(36).slice(2,10)+'i'+i;ids[i]=s;c.id=s}
   return c});
  const res=await rawApi('saveFormLayout',{templateId:tid,meta:{name:t.name,description:t.description,is_active:t.is_active},
   fields:send,deletedIds:b.deleted.filter(isUuid)},true);
  const map=(res&&res.idMap)||{};
  b.fields.forEach((f,i)=>{const n=repairUuid(map[ids[i]]);
   if(n){if(b.sel===f.id)b.sel=n;if(b.propFid===f.id)b.propFid=n;f.id=n}});
  t.fields=JSON.parse(JSON.stringify(b.fields));b.deleted=[];persist();
  invalidate('getFormTemplate');invalidate('getFormTemplates');
  if(S.sec==='builder'&&S.b.id===t.id){repaintCanvas();refreshProps(true)}
 })().catch(e=>{
  b.dirty=true;
  if(st){st.className='save-state dirty';st.innerHTML=ic('warn',13)+'ส่งไม่สำเร็จ'}
  toast('บันทึกขึ้นเซิร์ฟเวอร์ไม่สำเร็จ: '+e.message,{type:'bad'});
 }).finally(()=>{b.saving=false});
}
function addField(type,x,y,center){
 const b=S.b;if(!b.id)return;
 const d={title:{width:150,height:11,font_size:18,font_weight:'bold',text_align:'center',border_style:'none',value:'หัวข้อเรื่อง'},
  label:{width:60,height:7,border_style:'none',value:'ข้อความบรรยาย'},
  logo:{width:26,height:26,border_style:'none',value:DB.logo||''},
  textarea:{width:170,height:32},date:{width:52},select:{width:70,options:DEPTS.slice(0,4)},
  radio:{width:150,height:9,border_style:'none',options:['ตัวเลือก 1','ตัวเลือก 2','ตัวเลือก 3']},
  checkbox:{width:150,height:9,border_style:'none',options:['ตัวเลือก 1','ตัวเลือก 2']},
  signature:{width:72,height:20,border_style:'none'},
  checkbox_agree:{width:170,height:9,border_style:'none',font_size:12.5,value:'ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริง'},
  divider:{width:170,height:2,border_style:'none',border_color:'#0E7C86'}}[type]||{};
 const f=mkF(type,Object.assign({label:FTL[type],name:type+'_'+(b.fields.length+1)},d));
 while(b.fields.some(x=>x.name===f.name))f.name=f.name.replace(/(\d*)$/,m=>(+(m||1)+1));
 if(x===undefined){x=20;y=b.fields.reduce((m,q)=>Math.max(m,q.pos_y+q.height),48)+4}
 if(center){x-=f.width/2;y-=f.height/2}
 f.pos_x=clamp(Math.round(x*2)/2,0,PW-f.width);f.pos_y=clamp(Math.round(y*2)/2,0,PH-f.height);
 pushUndo();b.fields.push(f);b.sel=f.id;b.propFid=null;
 markDirty();repaintCanvas();refreshProps(true);
}
function removeField(id){
 const b=S.b,i=b.fields.findIndex(f=>f.id===id);if(i<0)return;
 const [f]=b.fields.splice(i,1);
 if(isUuid(id))b.deleted.push(id);
 if(b.sel===id){b.sel=null;b.propFid=null}
 pushUndo();markDirty();repaintCanvas();refreshProps(true);
 toast('ลบฟิลด์ “'+(f.label||FTL[f.field_type])+'”',{type:'bad',
  undo:()=>{b.fields.splice(i,0,f);b.deleted=b.deleted.filter(x=>x!==id);markDirty();repaintCanvas()}});
}
function dupField(id){
 const b=S.b,f=b.fields.find(x=>x.id===id);if(!f)return;
 const c=JSON.parse(JSON.stringify(f));c.id=tmpId('f_');c.name=f.name+'_copy';
 let n=2;while(b.fields.some(x=>x.name===c.name))c.name=f.name+'_copy'+n++;
 c.pos_y=clamp(f.pos_y+f.height+3,0,PH-c.height);
 if(c.pos_y===f.pos_y)c.pos_x=clamp(f.pos_x+6,0,PW-c.width);
 pushUndo();b.fields.push(c);b.sel=c.id;b.propFid=null;
 markDirty();repaintCanvas();refreshProps(true);
}
function reorder(id,dir){
 const b=S.b,i=b.fields.findIndex(f=>f.id===id);if(i<0)return;
 const j=clamp(i+dir,0,b.fields.length-1);if(i===j)return;
 pushUndo();const [m]=b.fields.splice(i,1);b.fields.splice(j,0,m);markDirty();renderLayers();
}
let DR=null;
const mmScale=()=>{const c=$('#canvas');if(!c)return 1;const r=c.getBoundingClientRect();return r.width?PW/r.width:1};
function dragStart(e){
 if(e.button)return;
 const el=e.currentTarget;
 if(el.querySelector('.fc[contenteditable="true"]'))return;
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
function dragEnd(){if(!DR)return;const el=DR.el,f=DR.f,mv=DR.moved;
 el.removeEventListener('pointermove',dragMove);el.removeEventListener('pointerup',dragEnd);el.removeEventListener('pointercancel',dragEnd);
 DR=null;if(mv){markDirty();paintOverlap();renderLayers();refreshProps(false)}}
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
 DR=null;if(mv){markDirty();patchFieldEl(f);paintOverlap();refreshProps(false)}}
function syncGeom(f){
 const p=$('#props');if(!p||p.dataset.fid!==f.id)return;
 ['pos_x','pos_y','width','height'].forEach(k=>{
  const i=p.querySelector('[data-p="'+k+'"]');if(i&&document.activeElement!==i)i.value=f[k]});
}
function inlineEdit(e){
 const el=e.currentTarget,f=S.b.fields.find(x=>x.id===el.dataset.fid);
 if(!f||(f.field_type!=='label'&&f.field_type!=='title'))return;
 const fc=$('.fc',el);if(!fc||fc.isContentEditable)return;
 selectField(f.id);
 pushUndo();fc.textContent=f.value||'';fc.contentEditable='true';fc.focus();
 const r=document.createRange();r.selectNodeContents(fc);const s=getSelection();s.removeAllRanges();s.addRange(r);
 const inp=()=>{f.value=fc.textContent;f.label=fc.textContent;markDirty();
  const p=$('#props');if(p&&p.dataset.fid===f.id){const t=p.querySelector('[data-p="value"]');if(t&&document.activeElement!==t)t.value=f.value}};
 const key=ev=>{ev.stopPropagation();if(ev.key==='Enter'||ev.key==='Escape'){ev.preventDefault();fc.blur()}};
 const done=()=>{
  fc.removeEventListener('input',inp);fc.removeEventListener('keydown',key);fc.removeEventListener('blur',done);
  fc.contentEditable='false';f.value=fc.textContent;f.label=fc.textContent;
  patchFieldEl(f);markDirty();renderLayers();
  const p=$('#props');if(p&&p.dataset.fid===f.id)refreshProps(true);
 };
 fc.addEventListener('input',inp);fc.addEventListener('keydown',key);fc.addEventListener('blur',done);
}

/* ============================================================
   INBOX / MINE / STAFF / BRAND
   ============================================================ */
function inboxList(){
 const f=S.inbox;
 return DB.submissions.filter(s=>{
  if(f.tpl!=='all'&&s.template_id!==f.tpl)return false;
  if(f.status==='ARCHIVED'){if(!s.archived_at)return false}
  else{if(s.archived_at)return false;if(f.status!=='ALL'&&s.status!==f.status)return false}
  if(f.q&&!(s.submitted_by_name+s.template_name+refOf(s)+(s.department||'')).toLowerCase().includes(f.q.toLowerCase()))return false;
  return true}).sort((a,b)=>f.sort==='oldest'?new Date(a.created_at)-new Date(b.created_at):
   f.sort==='name'?String(a.submitted_by_name).localeCompare(String(b.submitted_by_name),'th'):
   new Date(b.created_at)-new Date(a.created_at));
}
function vInbox(v){
 const f=S.inbox,list=inboxList();
 const live=DB.submissions.filter(s=>!s.archived_at);
 const cnt=k=>k==='ALL'?live.length:k==='ARCHIVED'?DB.submissions.filter(s=>s.archived_at).length:live.filter(s=>s.status===k).length;
 v.innerHTML=head('inbox',resyncBtn+'<button class="btn" data-i="csv">'+ic('csv')+'CSV</button>'+
  '<button class="btn" data-i="sync">'+ic('refresh')+'ดึงคำขอใหม่</button>'+
  '<button class="btn" data-i="saveview">'+ic('bolt')+'บันทึกมุมมอง</button>')+
 '<div class="stats"><div class="stat s1"><span>รอตรวจสอบ</span><b>'+cnt('SUBMITTED')+'</b></div>'+
 '<div class="stat s2"><span>อนุมัติ</span><b>'+cnt('APPROVED')+'</b></div>'+
 '<div class="stat s3"><span>ไม่อนุมัติ</span><b>'+cnt('REJECTED')+'</b></div>'+
 '<div class="stat s4"><span>ถาวร</span><b>'+cnt('ARCHIVED')+'</b></div>'+
 '<div class="stat s5"><span>ทั้งหมด</span><b>'+DB.submissions.length+'</b></div></div>'+
 '<div class="toolbar"><div class="search">'+ic('search')+'<input id="iq" value="'+esc(f.q)+'" placeholder="ค้นหา…"><kbd>/</kbd></div>'+
 '<select class="sel" id="itpl"><option value="all">ทุกแบบฟอร์ม</option>'+DB.templates.map(t=>'<option value="'+esc(t.id)+'"'+(f.tpl===t.id?' selected':'')+'>'+esc(t.name)+'</option>').join('')+'</select>'+
 '<select class="sel" id="isort"><option value="newest">ใหม่สุด</option><option value="oldest"'+(f.sort==='oldest'?' selected':'')+'>เก่าสุด</option><option value="name"'+(f.sort==='name'?' selected':'')+'>ชื่อ ก–ฮ</option></select></div>'+
 '<div class="chipbar" style="margin-bottom:12px">'+
  [['ALL','ทั้งหมด'],['SUBMITTED','รอตรวจ'],['APPROVED','อนุมัติ'],['REJECTED','ไม่อนุมัติ'],['ARCHIVED','ถาวร']].map(c=>
   '<button class="chip'+(f.status===c[0]?' on':'')+'" data-st="'+c[0]+'">'+c[1]+' <b>'+cnt(c[0])+'</b></button>').join('')+
  DB.savedViews.map(s=>'<button class="chip saved" data-sv="'+esc(s.id)+'">'+ic('bolt',12)+esc(s.name)+'<span class="x" data-svx="'+esc(s.id)+'">×</span></button>').join('')+'</div>'+
 (list.length?'<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th style="width:36px"><input type="checkbox" class="cbx" id="selAll"></th>'+
  '<th>อ้างอิง</th><th>ผู้ยื่น</th><th>ฟอร์ม</th><th>สถานะ</th><th>ส่งเมื่อ</th><th></th></tr></thead><tbody>'+
  list.map(s=>'<tr data-sid="'+esc(s.id)+'" class="'+(f.sel.has(s.id)?'sel':'')+'">'+
   '<td><input type="checkbox" class="cbx" data-cb="'+esc(s.id)+'"'+(f.sel.has(s.id)?' checked':'')+'></td>'+
   '<td><span class="ref" data-copy="'+esc(refOf(s))+'">#'+esc(refOf(s))+'</span>'+(s._pending?' <small style="color:var(--warn-ink)">⟳</small>':'')+'</td>'+
   '<td><div class="who"><span class="av" style="'+avStyle(s.submitted_by_name)+'">'+esc(String(s.submitted_by_name).replace(/^(นาย|นาง|นางสาว)/,'').trim()[0]||'?')+'</span>'+
   '<div><b>'+esc(s.submitted_by_name)+'</b><small>'+esc(s.department||'')+'</small></div></div></td>'+
   '<td style="max-width:220px"><b style="font-weight:600">'+esc(s.template_name)+'</b></td>'+
   '<td><span class="pill '+(s.archived_at?'arch':s.status)+'">'+(s.archived_at?'ถาวร':(ST[s.status]||s.status))+'</span></td>'+
   '<td class="num">'+ago(s.created_at)+'</td><td class="acts">'+
   '<button class="btn sm" data-ia="view" data-id="'+esc(s.id)+'">'+ic('eye',13)+'</button>'+
   (s.status==='SUBMITTED'&&!s.archived_at?'<button class="btn sm ok" data-ia="ok" data-id="'+esc(s.id)+'">'+ic('check',13)+'</button><button class="btn sm bad" data-ia="no" data-id="'+esc(s.id)+'">'+ic('x',13)+'</button>':'')+
   '<button class="btn sm icon" data-ia="print" data-id="'+esc(s.id)+'">'+ic('print',13)+'</button>'+
   '<button class="btn sm icon" data-ia="'+(s.archived_at?'unarch':'arch')+'" data-id="'+esc(s.id)+'">'+ic(s.archived_at?'undo':'arch',13)+'</button>'+
   '</td></tr>').join('')+'</tbody></table></div></div>'
  :emptyBox('inbox','ไม่มีคำขอในตัวกรองนี้','กด “ดึงคำขอใหม่” เพื่อโหลดจากเซิร์ฟเวอร์','<button class="btn pri" data-i="sync">'+ic('refresh')+'ดึงคำขอใหม่</button>'))+
 (f.sel.size?'<div class="bulk"><b>'+f.sel.size+'</b><span>ที่เลือก</span><span class="sp"></span>'+
  '<button class="btn sm" data-bulk="ok">'+ic('check',13)+'อนุมัติ</button><button class="btn sm" data-bulk="no">'+ic('x',13)+'ไม่อนุมัติ</button>'+
  '<button class="btn sm" data-bulk="arch">'+ic('arch',13)+'ถาวร</button><button class="btn sm" data-bulk="csv">'+ic('csv',13)+'CSV</button>'+
  '<button class="btn sm" data-bulk="clear">ล้าง</button></div>':'');
 $('#iq').oninput=debounce(e=>{f.q=e.target.value;const p=e.target.selectionStart;render();const n=$('#iq');n.focus();n.setSelectionRange(p,p)},170);
 $('#itpl').onchange=e=>{f.tpl=e.target.value;render();if(f.tpl!=='all'&&!S.loadedSubTpl.has(f.tpl))loadSubmissionsBg()};
 $('#isort').onchange=e=>{f.sort=e.target.value;render()};
 const sa=$('#selAll');if(sa)sa.onchange=e=>{list.forEach(s=>e.target.checked?f.sel.add(s.id):f.sel.delete(s.id));render()};
 v.onclick=e=>{
  const st=e.target.closest('[data-st]'),cp=e.target.closest('[data-copy]'),ia=e.target.closest('[data-ia]'),
   bk=e.target.closest('[data-bulk]'),gi=e.target.closest('[data-i]'),sv=e.target.closest('[data-sv]'),
   svx=e.target.closest('[data-svx]'),cb=e.target.closest('[data-cb]'),row=e.target.closest('[data-sid]');
  if(svx){DB.savedViews=DB.savedViews.filter(x=>x.id!==svx.dataset.svx);persist();return render()}
  if(sv){const x=DB.savedViews.find(y=>y.id===sv.dataset.sv);if(x)Object.assign(f,x.state,{sel:new Set()});return render()}
  if(cb){const id=cb.dataset.cb;f.sel.has(id)?f.sel.delete(id):f.sel.add(id);return render()}
  if(cp){navigator.clipboard?.writeText(cp.dataset.copy);return toast('คัดลอก #'+cp.dataset.copy,{type:'ok'})}
  if(st){f.status=st.dataset.st;f.sel.clear();return render()}
  if(gi){const k=gi.dataset.i;
   if(k==='resync')return hardResync();
   if(k==='sync'){invalidate('getFormSubmissions');S.loadedSubTpl.clear();loadSubmissionsBg(true);return toast('กำลังดึงคำขอใหม่…',{type:'info',ms:1600})}
   if(k==='csv')return csv([['อ้างอิง','ผู้ยื่น','หน่วยงาน','ฟอร์ม','สถานะ','ส่งเมื่อ'],...list.map(s=>['#'+refOf(s),s.submitted_by_name,s.department||'',s.template_name,s.archived_at?'ถาวร':(ST[s.status]||s.status),fdate(s.created_at)])],'dontum-submissions.csv');
   if(k==='saveview')return saveView()}
  if(bk)return bulk(bk.dataset.bulk,list);
  if(ia){const id=ia.dataset.id,k=ia.dataset.ia;
   if(k==='view')return subDrawer(id);
   if(k==='ok')return setStatus([id],'APPROVED');
   if(k==='no')return setStatus([id],'REJECTED');
   if(k==='print')return printSub(id);
   if(k==='arch')return setArch([id],true);
   if(k==='unarch')return setArch([id],false)}
  if(row&&!e.target.closest('button,input'))subDrawer(row.dataset.sid);
 };
}
function saveView(){
 modal('บันทึกมุมมอง','<div class="fld"><label>ชื่อมุมมอง</label><input id="svName" placeholder="เช่น รอตรวจ — งานพัสดุ"></div>',
  '<button class="btn" data-close-modal>ยกเลิก</button><button class="btn pri" id="svGo">'+ic('bolt')+'บันทึก</button>');
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#svName').focus();
 $('#svGo').onclick=()=>{const n=$('#svName').value.trim();if(!n)return toast('กรุณาตั้งชื่อ',{type:'warn'});
  DB.savedViews.push({id:uid('sv_'),name:n,state:{tpl:S.inbox.tpl,status:S.inbox.status,q:S.inbox.q,sort:S.inbox.sort}});
  persist();closeModal();render();toast('บันทึกมุมมองแล้ว',{type:'ok'})};
}
function bulk(k,list){
 const ids=[...S.inbox.sel];if(!ids.length)return;
 if(k==='clear'){S.inbox.sel.clear();return render()}
 if(k==='ok')return setStatus(ids,'APPROVED');
 if(k==='no')return setStatus(ids,'REJECTED');
 if(k==='arch')return setArch(ids,true);
 if(k==='csv'){const r=list.filter(s=>S.inbox.sel.has(s.id));
  return csv([['อ้างอิง','ผู้ยื่น','ฟอร์ม','สถานะ'],...r.map(s=>['#'+refOf(s),s.submitted_by_name,s.template_name,ST[s.status]||s.status])],'selected.csv')}
}
function setStatus(ids,st){
 const before=ids.map(id=>({id,prev:(sub(id)||{}).status,at:(sub(id)||{}).reviewed_at}));
 ids.forEach(id=>{const s=sub(id);if(!s)return;s.status=st;s.reviewed_at=new Date().toISOString();s.reviewed_by=S.meName||'ผู้ดูแลระบบ';
  enqueue('updateSubmissionStatus',{id,status:st},'เปลี่ยนสถานะคำขอ')});
 S.inbox.sel.clear();persist();render();
 logAct((st==='APPROVED'?'อนุมัติ':'ไม่อนุมัติ')+' '+ids.length+' คำขอ',st==='APPROVED'?'ok':'bad');
 toast((st==='APPROVED'?'อนุมัติ':'ไม่อนุมัติ')+'แล้ว '+ids.length+' รายการ',{type:st==='APPROVED'?'ok':'bad',
  undo:()=>{before.forEach(b=>{const s=sub(b.id);if(s){s.status=b.prev;s.reviewed_at=b.at;enqueue('updateSubmissionStatus',{id:b.id,status:b.prev},'ย้อนสถานะ')}});persist();render()}});
}
function setArch(ids,on){
 const before=ids.map(id=>({id,prev:(sub(id)||{}).archived_at}));
 ids.forEach(id=>{const s=sub(id);if(s)s.archived_at=on?new Date().toISOString():null;
  enqueue(on?'archiveSubmission':'unarchiveSubmission',{id},'เก็บถาวรคำขอ')});
 S.inbox.sel.clear();persist();render();
 toast((on?'เก็บถาวร':'คืนจากคลัง')+'แล้ว '+ids.length+' รายการ',{type:'info',
  undo:()=>{before.forEach(b=>{const s=sub(b.id);if(s)s.archived_at=b.prev;enqueue(b.prev?'archiveSubmission':'unarchiveSubmission',{id:b.id},'ย้อนถาวร')});persist();render()}});
}
function printSub(id){
 const s=sub(id);if(!s)return;
 ensureFields(s.template_id).then(t=>{
  if(!t||!(t.fields||[]).length)return toast('ไม่พบฟิลด์ต้นฉบับ',{type:'warn'});
  printSheet(t.fields,s.data,t.name+' · #'+refOf(s));
 });
}
function subDrawer(id){
 const s=sub(id);if(!s)return;const t=tpl(s.template_id);
 const tl=[{c:'',t:'ยื่นคำขอเข้าระบบ',at:s.created_at}];
 if(s.reviewed_at)tl.push({c:s.status==='APPROVED'?'ok':'bad',t:(s.status==='APPROVED'?'อนุมัติโดย ':'ไม่อนุมัติโดย ')+(s.reviewed_by||'ผู้ดูแล'),at:s.reviewed_at});
 if(s.archived_at)tl.push({c:'arch',t:'เก็บถาวร',at:s.archived_at});
 const vals=t?Object.entries(s.data||{}).filter(([k])=>!k.startsWith('_')).map(([k,v])=>{
  const f=(t.fields||[]).find(x=>x.name===k);
  return '<div class="fval"><span>'+esc((f&&f.label)||k)+'</span><b>'+esc(v||'—')+'</b></div>'}).join(''):'';
 openDrawer('คำขอ #'+refOf(s),s.template_name,
  '<dl class="kv"><dt>ผู้ยื่น</dt><dd>'+esc(s.submitted_by_name)+'</dd><dt>หน่วยงาน</dt><dd>'+esc(s.department||'—')+'</dd>'+
  '<dt>สถานะ</dt><dd><span class="pill '+(s.archived_at?'arch':s.status)+'">'+(s.archived_at?'ถาวร':(ST[s.status]||s.status))+'</span></dd>'+
  '<dt>อ้างอิง</dt><dd><span class="ref" data-copy="'+esc(refOf(s))+'">#'+esc(refOf(s))+'</span></dd>'+
  '<dt>ส่งเมื่อ</dt><dd>'+fdate(s.created_at)+'</dd></dl>'+
  '<div class="d-sec">ลำดับเหตุการณ์</div><div class="tline">'+tl.map(x=>'<div class="tl '+x.c+'"><b>'+esc(x.t)+'</b><small>'+fdate(x.at)+'</small></div>').join('')+'</div>'+
  '<div class="d-sec">ข้อมูลที่กรอก</div>'+(vals||'<p style="font-size:12.5px;color:var(--text3)">ไม่มีข้อมูล</p>')+
  '<div class="d-sec">เอกสาร A4</div><div class="mini-a4" id="dA4" style="aspect-ratio:210/297"><div class="sc"></div></div>',
  (s.status==='SUBMITTED'&&!s.archived_at?'<button class="btn ok" data-s="ok">'+ic('check')+'อนุมัติ</button><button class="btn bad" data-s="no">'+ic('x')+'ไม่อนุมัติ</button>':'')+
  '<button class="btn pri" data-s="print">'+ic('print')+'พิมพ์</button><button class="btn" data-s="dl">'+ic('dl')+'ดาวน์โหลด</button>'+
  '<button class="btn arch" data-s="arch">'+ic(s.archived_at?'undo':'arch')+(s.archived_at?'คืนคลัง':'ถาวร')+'</button>');
 ensureFields(s.template_id).then(tt=>{requestAnimationFrame(()=>{const w=$('#dA4');if(!w||!tt)return;const c=$('.sc',w);
  (tt.fields||[]).map(norm).forEach(f=>c.appendChild(fieldEl(f,'print',s.data)));
  c.style.transform='scale('+(w.clientWidth/(PW*MM))+')'})});
 $('#drawerBody').onclick=e=>{const c=e.target.closest('[data-copy]');if(c){navigator.clipboard?.writeText(c.dataset.copy);toast('คัดลอกแล้ว',{type:'ok'})}};
 $('#drawerFoot').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;const k=b.dataset.s;
  if(k==='ok'||k==='no'){setStatus([id],k==='ok'?'APPROVED':'REJECTED');closeDrawer()}
  else if(k==='print')printSub(id);
  else if(k==='dl'){const tt=tpl(s.template_id);if(!tt||!(tt.fields||[]).length)return toast('ไม่มีฟิลด์',{type:'warn'});
   download(sheetHTML(tt.fields,s.data,tt.name+' #'+refOf(s),false),fname(tt.name)+'_'+refOf(s)+'.html')}
  else if(k==='arch'){setArch([id],!s.archived_at);closeDrawer()}};
}
function vMine(v){
 const f=S.mine,me=S.meName||'ผู้ดูแลระบบ';
 const list=DB.submissions.filter(s=>s.submitted_by_name===me&&(f.status==='all'||s.status===f.status)&&
  (!f.q||(s.template_name+refOf(s)).toLowerCase().includes(f.q.toLowerCase())))
  .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,40);
 v.innerHTML=head('mine','<button class="btn pri" data-m="new">'+ic('plus')+'ยื่นคำขอใหม่</button>')+
  '<div class="toolbar"><div class="search">'+ic('search')+'<input id="mq" value="'+esc(f.q)+'" placeholder="ค้นหา…"></div>'+
  '<select class="sel" id="mst"><option value="all">ทุกสถานะ</option>'+Object.entries(ST).map(([k,t])=>'<option value="'+k+'"'+(f.status===k?' selected':'')+'>'+t+'</option>').join('')+'</select></div>'+
  (list.length?'<div class="grid">'+list.map((s,i)=>'<article class="card" data-mid="'+esc(s.id)+'" style="animation-delay:'+i*25+'ms">'+
   '<div class="card-top"><h3>'+esc(s.template_name)+'</h3></div><div class="card-meta"><span class="ref">#'+esc(refOf(s))+'</span><span>'+ago(s.created_at)+'</span></div>'+
   '<span class="pill '+(s.archived_at?'arch':s.status)+'">'+(s.archived_at?'ถาวร':(ST[s.status]||s.status))+'</span>'+
   '<div class="card-acts"><button class="btn sm" data-m="view" data-id="'+esc(s.id)+'">'+ic('eye',13)+'รายละเอียด</button>'+
   '<button class="btn sm" data-m="print" data-id="'+esc(s.id)+'">'+ic('print',13)+'พิมพ์</button></div></article>').join('')+'</div>'
   :emptyBox('mine','ยังไม่มีคำขอในนามบัญชีนี้','ยื่นคำขอใหม่หรือดูที่กล่องคำขอ','<button class="btn pri" data-m="new">'+ic('plus')+'ยื่นคำขอใหม่</button>'));
 $('#mq').oninput=debounce(e=>{f.q=e.target.value;render();$('#mq').focus()},170);
 $('#mst').onchange=e=>{f.status=e.target.value;render()};
 v.onclick=e=>{const m=e.target.closest('[data-m]'),c=e.target.closest('[data-mid]');
  if(m){const k=m.dataset.m,id=m.dataset.id;
   if(k==='new'){setShell('public');pubGo('forms');return}
   if(k==='view')return subDrawer(id);if(k==='print')return printSub(id)}
  if(c&&!e.target.closest('button'))subDrawer(c.dataset.mid)};
}
function vStaff(v){
 const f=S.staff;
 let list=DB.staff.filter(s=>(f.dept==='all'||s.department===f.dept)&&(f.active==='all'||(f.active==='on')===!!s.is_active)&&
  (!f.q||(s.full_name+s.position+s.department+s.email).toLowerCase().includes(f.q.toLowerCase())));
 list.sort((a,b)=>f.sort==='dept'?a.department.localeCompare(b.department,'th'):a.full_name.localeCompare(b.full_name,'th'));
 v.innerHTML=head('staff','<button class="btn" data-t="csv">'+ic('csv')+'CSV</button><button class="btn pri" data-t="add">'+ic('plus')+'เพิ่มบุคลากร</button>')+
 '<div class="toolbar"><div class="search">'+ic('search')+'<input id="tq" value="'+esc(f.q)+'" placeholder="ค้นหาชื่อ / ตำแหน่ง…"><kbd>/</kbd></div>'+
 '<select class="sel" id="tdept"><option value="all">ทุกหน่วยงาน</option>'+DEPTS.map(d=>'<option'+(f.dept===d?' selected':'')+'>'+esc(d)+'</option>').join('')+'</select>'+
 '<select class="sel" id="tact"><option value="all">ทุกสถานะ</option><option value="on"'+(f.active==='on'?' selected':'')+'>ปฏิบัติงาน</option><option value="off"'+(f.active==='off'?' selected':'')+'>ระงับ</option></select>'+
 '<span style="font-size:12px;color:var(--text3);margin-left:auto">'+list.length+' / '+DB.staff.length+' คน</span></div>'+
 (list.length?'<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th style="width:36px"><input type="checkbox" class="cbx" id="tAll"></th>'+
  '<th>ชื่อ</th><th>ตำแหน่ง</th><th>หน่วยงาน</th><th>ประเภท</th><th>สถานะ</th><th></th></tr></thead><tbody>'+
  list.map(s=>'<tr data-tid="'+esc(s.id)+'" class="'+(f.sel.has(s.id)?'sel':'')+'"><td><input type="checkbox" class="cbx" data-tcb="'+esc(s.id)+'"'+(f.sel.has(s.id)?' checked':'')+'></td>'+
   '<td><div class="who"><span class="av" style="'+avStyle(s.full_name)+'">'+esc(s.first_name[0]||'?')+'</span><div><b>'+esc(s.full_name)+'</b><small>'+esc(s.email)+'</small></div></div></td>'+
   '<td>'+esc(s.position)+'</td><td>'+esc(s.department)+'</td><td><span class="pill info">'+esc(s.employment_type)+'</span></td>'+
   '<td><span class="pill '+(s.is_active?'on':'off')+'">'+(s.is_active?'ปฏิบัติงาน':'ระงับ')+'</span></td>'+
   '<td class="acts"><button class="btn sm" data-t="view" data-id="'+esc(s.id)+'">'+ic('eye',13)+'</button>'+
   '<button class="btn sm '+(s.is_active?'bad':'ok')+'" data-t="toggle" data-id="'+esc(s.id)+'">'+ic(s.is_active?'lock':'check',13)+'</button>'+
   '<button class="btn sm icon bad" data-t="del" data-id="'+esc(s.id)+'">'+ic('trash',13)+'</button></td></tr>').join('')+
  '</tbody></table></div></div>':emptyBox('users','ไม่พบบุคลากร','ลองเปลี่ยนคำค้น'))+
 (f.sel.size?'<div class="bulk"><b>'+f.sel.size+'</b><span>คนที่เลือก</span><span class="sp"></span>'+
  '<button class="btn sm" data-tb="on">'+ic('check',13)+'เปิดสิทธิ์</button><button class="btn sm" data-tb="off">'+ic('lock',13)+'ระงับ</button>'+
  '<button class="btn sm" data-tb="del">'+ic('trash',13)+'ลบ</button><button class="btn sm" data-tb="clear">ล้าง</button></div>':'');
 $('#tq').oninput=debounce(e=>{f.q=e.target.value;const p=e.target.selectionStart;render();const n=$('#tq');n.focus();n.setSelectionRange(p,p)},170);
 $('#tdept').onchange=e=>{f.dept=e.target.value;render()};
 $('#tact').onchange=e=>{f.active=e.target.value;render()};
 const ta=$('#tAll');if(ta)ta.onchange=e=>{list.forEach(s=>e.target.checked?f.sel.add(s.id):f.sel.delete(s.id));render()};
 v.onclick=e=>{
  const cb=e.target.closest('[data-tcb]'),t=e.target.closest('[data-t]'),tb=e.target.closest('[data-tb]'),row=e.target.closest('[data-tid]');
  if(cb){const id=cb.dataset.tcb;f.sel.has(id)?f.sel.delete(id):f.sel.add(id);return render()}
  if(tb){const k=tb.dataset.tb,ids=[...f.sel];
   if(k==='clear'){f.sel.clear();return render()}
   if(k==='del')return delStaff(ids);
   return setStaffActive(ids,k==='on')}
  if(t){const k=t.dataset.t,id=t.dataset.id;
   if(k==='add')return addStaff();
   if(k==='csv')return csv([['ชื่อ','ตำแหน่ง','หน่วยงาน','ประเภท','อีเมล','สถานะ'],...list.map(s=>[s.full_name,s.position,s.department,s.employment_type,s.email,s.is_active?'ปฏิบัติงาน':'ระงับ'])],'staff.csv');
   if(k==='view')return staffDrawer(id);
   if(k==='toggle')return setStaffActive([id],!stf(id).is_active);
   if(k==='del')return delStaff([id])}
  if(row&&!e.target.closest('button,input'))staffDrawer(row.dataset.tid);
 };
}
function setStaffActive(ids,on){
 const before=ids.map(id=>({id,prev:(stf(id)||{}).is_active}));
 ids.forEach(id=>{const s=stf(id);if(s)s.is_active=on;enqueue('updateStaffStatus',{staffId:id,isActive:on},'ปรับสิทธิ์บุคลากร')});
 S.staff.sel.clear();persist();render();
 toast((on?'เปิดสิทธิ์ ':'ระงับสิทธิ์ ')+ids.length+' คน',{type:on?'ok':'warn',
  undo:()=>{before.forEach(b=>{const s=stf(b.id);if(s)s.is_active=b.prev;enqueue('updateStaffStatus',{staffId:b.id,isActive:b.prev},'ย้อนสิทธิ์')});persist();render()}});
}
function delStaff(ids){
 const tg=ids.map(stf).filter(Boolean);if(!tg.length)return;
 modal('ลบบุคลากร','<p style="font-size:13.5px">ลบ <b>'+tg.length+'</b> รายชื่อออกจากทะเบียนในคอนโซล?</p>'+
  '<p style="font-size:11.5px;color:var(--text3);margin-top:8px">API ยังไม่มีคำสั่งลบบุคลากร · กู้คืนได้ด้วยปุ่มเลิกทำ</p>',
  '<button class="btn" data-close-modal>ยกเลิก</button><button class="btn bad" id="delGo">'+ic('trash',14)+'ลบ</button>');
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#delGo').onclick=()=>{
  const snap=tg.map(t=>({t,i:DB.staff.indexOf(t)}));
  DB.staff=DB.staff.filter(s=>!ids.includes(s.id));S.staff.sel.clear();persist();closeModal();render();
  toast('ลบ '+tg.length+' รายชื่อแล้ว',{type:'bad',undo:()=>{snap.sort((a,b)=>a.i-b.i).forEach(o=>DB.staff.splice(o.i,0,o.t));persist();render()}});
 };
}
function addStaff(){
 modal('เพิ่มบุคลากร',
  '<div class="pr2"><div class="fld"><label>คำนำหน้า</label><select id="sfP"><option>นาย</option><option>นาง</option><option>นางสาว</option></select></div>'+
  '<div class="fld"><label>ชื่อ *</label><input id="sfF"></div></div><div class="fld"><label>นามสกุล *</label><input id="sfL"></div>'+
  '<div class="fld"><label>ตำแหน่ง</label><select id="sfPos">'+POS.map(p=>'<option>'+esc(p)+'</option>').join('')+'</select></div>'+
  '<div class="fld"><label>หน่วยงาน</label><select id="sfD">'+DEPTS.map(d=>'<option>'+esc(d)+'</option>').join('')+'</select></div>'+
  '<div class="fld"><label>ประเภทการจ้าง</label><select id="sfE"><option>ข้าราชการ</option><option>พนักงานราชการ</option><option>ลูกจ้างชั่วคราว</option></select></div>'+
  '<div class="fld"><label>อีเมล</label><input id="sfM" type="email"></div>',
  '<button class="btn" data-close-modal>ยกเลิก</button><button class="btn pri" id="sfGo">'+ic('plus')+'เพิ่ม</button>');
 $$('[data-close-modal]',$('#modalScrim')).forEach(b=>b.onclick=closeModal);
 $('#sfF').focus();
 $('#sfGo').onclick=()=>{
  const f=$('#sfF').value.trim(),l=$('#sfL').value.trim();
  if(!f||!l)return toast('กรุณากรอกชื่อ-นามสกุล',{type:'warn'});
  const p=$('#sfP').value;
  DB.staff.unshift({id:uid('stf_'),prefix:p,first_name:f,last_name:l,full_name:p+f+' '+l,
   position:$('#sfPos').value,department:$('#sfD').value,employment_type:$('#sfE').value,
   email:$('#sfM').value.trim()||'—',phone:'—',is_active:true});
  persist();closeModal();render();toast('เพิ่มบุคลากรแล้ว (ในเครื่อง)',{type:'ok'});
 };
}
function staffDrawer(id){
 const s=stf(id);if(!s)return;
 const rel=DB.submissions.filter(x=>x.submitted_by_name===s.full_name);
 openDrawer('บุคลากร',s.full_name,
  '<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px"><span class="av" style="'+avStyle(s.full_name)+';width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font-size:20px;font-weight:700;color:#fff">'+esc(s.first_name[0]||'?')+'</span>'+
  '<div><b style="font-size:16px">'+esc(s.full_name)+'</b><div style="font-size:12.5px;color:var(--text2)">'+esc(s.position)+'</div>'+
  '<span class="pill '+(s.is_active?'on':'off')+'" style="margin-top:5px">'+(s.is_active?'ปฏิบัติงาน':'ระงับ')+'</span></div></div>'+
  '<dl class="kv"><dt>หน่วยงาน</dt><dd>'+esc(s.department)+'</dd><dt>ประเภท</dt><dd>'+esc(s.employment_type)+'</dd>'+
  '<dt>อีเมล</dt><dd>'+esc(s.email)+'</dd><dt>โทร</dt><dd>'+esc(s.phone)+'</dd><dt>คำขอ</dt><dd>'+rel.length+'</dd></dl>',
  '<button class="btn '+(s.is_active?'bad':'ok')+'" data-t2="toggle">'+ic(s.is_active?'lock':'check')+(s.is_active?'ระงับสิทธิ์':'เปิดสิทธิ์')+'</button>'+
  '<button class="btn" data-t2="copy">'+ic('copy')+'คัดลอก</button><button class="btn bad" data-t2="del">'+ic('trash')+'ลบ</button>');
 $('#drawerFoot').onclick=e=>{const b=e.target.closest('[data-t2]');if(!b)return;
  if(b.dataset.t2==='toggle'){setStaffActive([id],!s.is_active);closeDrawer()}
  else if(b.dataset.t2==='del'){closeDrawer();delStaff([id])}
  else{navigator.clipboard?.writeText(s.full_name+'\t'+s.position+'\t'+s.department+'\t'+s.email);toast('คัดลอกแล้ว',{type:'ok'})}};
}
function vBrand(v){
 const l=DB.logo;
 v.innerHTML=head('brand')+'<div class="brand-grid"><div><div class="logo-stage">'+(l?'<img src="'+l+'">':'<span class="logo-ph">ด</span>')+'</div>'+
  '<div class="drop" id="drop" style="margin-top:12px"><div style="color:var(--accent);margin-bottom:8px">'+ic('image',26)+'</div>'+
  '<b style="font-size:13.5px">ลากรูปมาวางที่นี่</b><p style="font-size:12px;color:var(--text2);margin:5px 0 11px">PNG · JPG · SVG · WebP ≤ 40 KB</p>'+
  '<button class="btn pri sm" id="pick">'+ic('image',13)+'เลือกไฟล์</button></div>'+
  (l?'<button class="btn bad" style="width:100%;margin-top:10px" id="rmLogo">'+ic('trash',13)+'ลบตราสัญลักษณ์</button>':'')+'</div>'+
  '<div><div class="panel"><div class="panel-h">'+ic('eye',14)+'<b>ตัวอย่างการใช้งาน</b></div><div class="panel-b">'+
  [[56,'หัวเว็บ'],[40,'เมนู'],[28,'หัวเอกสาร A4'],[16,'Favicon']].map(([s,t])=>
   '<div class="size-row"><div class="box" style="width:'+s+'px;height:'+s+'px">'+(l?'<img src="'+l+'">':'<span style="font-size:'+s*.5+'px;font-weight:800;color:var(--text3)">ด</span>')+'</div><div><b>'+t+'</b><small>'+s+'×'+s+' px</small></div></div>').join('')+
  '</div></div></div></div>';
 $('#pick').onclick=()=>{$('#logoFile').dataset.target='brand';$('#logoFile').click()};
 const d=$('#drop');
 d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('over')});
 d.addEventListener('dragleave',()=>d.classList.remove('over'));
 d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('over');const f=e.dataTransfer.files[0];if(f)readLogo(f)});
 const rm=$('#rmLogo');if(rm)rm.onclick=()=>{const o=DB.logo;DB.logo=null;persist();applyPrefs();render();
  enqueue('deleteHeaderLogo',{},'ลบโลโก้');toast('ลบตราสัญลักษณ์แล้ว',{type:'bad',undo:()=>{DB.logo=o;persist();applyPrefs();render()}})};
}
function readLogo(file){
 if(!/^image\//.test(file.type))return toast('กรุณาเลือกไฟล์รูป',{type:'warn'});
 if(file.size>40*1024)return toast('ไฟล์ใหญ่เกิน 40 KB',{type:'warn'});
 const inp=$('#logoFile'),target=inp.dataset.target,fid=inp.dataset.fid;
 const r=new FileReader();
 r.onload=e=>{
  if(target==='field'){
   const f=S.b.fields.find(x=>x.id===fid);
   if(f){pushUndo();f.value=e.target.result;markDirty();patchFieldEl(f);
    const p=$('#props');if(p&&p.dataset.fid===f.id)refreshProps(true);
    toast('ใส่โลโก้ในฟิลด์แล้ว',{type:'ok'})}
  }else{
   const o=DB.logo;DB.logo=e.target.result;persist();applyPrefs();render();
   enqueue('uploadHeaderLogo',{base64Data:e.target.result},'อัปโหลดโลโก้');
   toast('อัปเดตตราสัญลักษณ์แล้ว',{type:'ok',undo:()=>{DB.logo=o;persist();applyPrefs();render()}});
  }
 };
 r.readAsDataURL(file);
}
$('#logoFile').onchange=e=>{const f=e.target.files[0];if(f)readLogo(f);e.target.value=''};

/* ---------- palette / help ---------- */
function commands(){
 const c=[];
 if(S.shell==='admin'){
  Object.entries(SECS).forEach(([k,x])=>c.push({g:'ไปยังหน้า',t:x[0],s:x[1],i:x[2],run:()=>{S.sec=null;go(k)}}));
  c.push({g:'สร้าง',t:'สร้างฟอร์มใหม่',s:'โครงมาตรฐาน',i:'plus',run:newForm});
  c.push({g:'สร้าง',t:'เพิ่มบุคลากร',s:'ทะเบียนในเครื่อง',i:'users',run:addStaff});
  c.push({g:'เครื่องมือ',t:'ตรวจ/แก้ฟิลด์ซ้อนทับ',s:'จัดตำแหน่งอัตโนมัติ',i:'layers',run:()=>{S.sec=null;go('builder');setTimeout(()=>{const b=$('#ovlChip');b&&b.click()},260)}});
  c.push({g:'ข้อมูล',t:'ดึงคำขอใหม่ทั้งหมด',s:'บังคับโหลดจากเซิร์ฟเวอร์',i:'refresh',run:()=>{invalidate('getFormSubmissions');S.loadedSubTpl.clear();loadSubmissionsBg(true);toast('กำลังดึง…',{type:'info',ms:1500})}});
  c.push({g:'ข้อมูล',t:'ล้างแคชและซิงก์ใหม่',s:'แก้ข้อมูลค้าง/รหัสผิดรูป',i:'broom',run:hardResync});
  c.push({g:'ข้อมูล',t:'ส่งคิวที่ค้างทันที',s:OUTBOX.length+' รายการ',i:'cloud',run:flushOutbox});
  c.push({g:'ส่งออก',t:'ส่งออกคำขอ CSV',s:'ตามตัวกรอง',i:'csv',run:()=>csv([['อ้างอิง','ผู้ยื่น','ฟอร์ม','สถานะ'],...inboxList().map(s=>['#'+refOf(s),s.submitted_by_name,s.template_name,ST[s.status]||s.status])],'submissions.csv')});
 }
 c.push({g:'มุมมอง',t:'ไปหน้าสาธารณะ',s:'ประชาชน',i:'globe',run:()=>setShell('public')});
 if(S.shell==='public')c.push({g:'มุมมอง',t:'เข้าคอนโซลผู้ดูแล',s:'ต้องเข้าสู่ระบบ',i:'lock',run:enterAdmin});
 c.push({g:'ตั้งค่า',t:'สลับธีม',s:'Ctrl+J',i:'moon',run:toggleTheme});
 c.push({g:'ตั้งค่า',t:'สลับความหนาแน่น',s:'ตาราง',i:'rows',run:toggleDensity});
 c.push({g:'ตั้งค่า',t:S.live?'ใช้ข้อมูลตัวอย่าง':'ต่อ API จริง',s:'สลับแหล่งข้อมูล',i:'bolt',run:toggleLive});
 c.push({g:'ช่วยเหลือ',t:'คีย์ลัดทั้งหมด',s:'?',i:'help',run:showHelp});
 DB.templates.slice(0,15).forEach(t=>c.push({g:'แบบฟอร์ม',t:t.name,s:t.department,i:'forms',run:()=>{S.shell==='admin'?formDrawer(t.id):openPubFill(t.id)}}));
 return c;
}
function openPalette(){
 if(S.shell!=='admin')return toast('คำสั่งด่วนใช้เฉพาะคอนโซลผู้ดูแล',{type:'info'});
 $('#paletteScrim').hidden=false;$('#paletteInput').value='';S.palette.q='';S.palette.idx=0;
 paintPalette();setTimeout(()=>$('#paletteInput').focus(),20);
}
function closePalette(){$('#paletteScrim').hidden=true}
function paintPalette(){
 const q=S.palette.q.toLowerCase().trim();
 let it=commands();
 if(q)it=it.filter(c=>(c.t+c.s+c.g).toLowerCase().includes(q));
 it=it.slice(0,36);S.palette.items=it;
 if(S.palette.idx>=it.length)S.palette.idx=0;
 let h='',g='';
 it.forEach((c,i)=>{if(c.g!==g){g=c.g;h+='<div class="pgroup">'+esc(g)+'</div>'}
  h+='<div class="pitem'+(i===S.palette.idx?' cur':'')+'" data-pi="'+i+'"><span class="pi">'+ic(c.i,15)+'</span><b>'+esc(c.t)+'</b><small>'+esc(c.s)+'</small></div>'});
 $('#paletteList').innerHTML=h||'<div class="empty" style="margin:12px;padding:24px"><h3>ไม่พบคำสั่ง</h3></div>';
 $$('.pitem').forEach(e=>e.onclick=()=>{const c=S.palette.items[+e.dataset.pi];closePalette();c&&c.run()});
}
$('#paletteInput').oninput=e=>{S.palette.q=e.target.value;S.palette.idx=0;paintPalette()};
$('#paletteInput').onkeydown=e=>{
 if(e.key==='ArrowDown'){e.preventDefault();S.palette.idx=Math.min(S.palette.idx+1,S.palette.items.length-1);paintPalette()}
 else if(e.key==='ArrowUp'){e.preventDefault();S.palette.idx=Math.max(S.palette.idx-1,0);paintPalette()}
 else if(e.key==='Enter'){e.preventDefault();const c=S.palette.items[S.palette.idx];closePalette();c&&c.run()}
};
$('#paletteScrim').onclick=e=>{if(e.target.id==='paletteScrim')closePalette()};
$('#omniBtn').onclick=openPalette;
const SHORTCUTS=[['Ctrl + K','คำสั่งด่วน'],['/','ค้นหา'],['?','คีย์ลัด'],['Ctrl + J','ธีม'],['Ctrl + B','ย่อเมนู'],
 ['Alt + 1…6','สลับหน้า'],['Ctrl + S','บันทึกฟอร์ม'],['Ctrl + Z','ย้อน'],['Ctrl + Shift + Z','ทำซ้ำ'],
 ['Delete','ลบฟิลด์ (เมื่อไม่พิมพ์)'],['ลูกศร','เลื่อน 0.5 มม.'],['Shift + ลูกศร','เลื่อน 5 มม.'],
 ['Ctrl + D','สำเนาฟิลด์'],['Esc','ปิด/ยกเลิกเลือก'],['ดับเบิลคลิก','แก้ข้อความบนกระดาษ']];
function showHelp(){
 $('#helpBody').innerHTML='<div class="help-grid">'+SHORTCUTS.map(([k,d])=>
  '<div class="help-row"><span>'+esc(d)+'</span><span>'+k.split(' + ').map(x=>'<kbd>'+esc(x)+'</kbd>').join(' + ')+'</span></div>').join('')+'</div>';
 $('#helpScrim').hidden=false;
}
$('#helpBtn').onclick=showHelp;
function paintNotif(){
 const l=DB.activity;
 $('#notifList').innerHTML=l.length?l.map(a=>{
  const col={ok:'var(--ok-bg)',bad:'var(--bad-bg)',warn:'var(--warn-bg)',info:'var(--info-bg)'}[a.kind]||'var(--info-bg)';
  const n={ok:'check',bad:'trash',warn:'warn',info:'info'}[a.kind]||'info';
  return '<div class="nrow"><span class="ni" style="background:'+col+'">'+ic(n,14)+'</span><div><b>'+esc(a.text)+'</b><small>'+ago(a.at)+'</small></div></div>'}).join('')
  :'<p style="padding:22px;text-align:center;font-size:12.5px;color:var(--text3)">ยังไม่มีความเคลื่อนไหว</p>';
}
$('#bellBtn').onclick=()=>{const n=$('#notif');n.hidden=!n.hidden;if(!n.hidden){paintNotif();DB.activity.forEach(a=>a.read=true);persist();paintBell()}};
$('#notifClear').onclick=()=>{DB.activity=[];persist();paintNotif();paintBell()};
function toggleTheme(){DB.prefs.theme=DB.prefs.theme==='dark'?'light':'dark';persist();applyPrefs()}
function toggleDensity(){DB.prefs.density=DB.prefs.density==='compact'?'cozy':'compact';persist();applyPrefs()}
function toggleLive(){
 S.live=!S.live;applyPrefs();
 if(S.live){toast('กำลังต่อ API…',{type:'info',ms:1400});syncPublic().then(()=>{if(accessToken&&S.shell==='admin')syncAdminCore()})}
 else toast('ใช้ข้อมูลตัวอย่างในเครื่อง',{type:'info'});
}
$('#themeBtn').onclick=toggleTheme;
$('#densityBtn').onclick=toggleDensity;
$('#modeChip').onclick=toggleLive;
$('#railToggle').innerHTML=ic('menu');
$('#railToggle').onclick=()=>{DB.prefs.rail=DB.prefs.rail==='mini'?'expanded':'mini';persist();applyPrefs()};
$$('.rail-item').forEach(b=>{$('i',b).innerHTML=ic((SECS[b.dataset.go]||['','','globe'])[2],18)});
$('#omniBtn').querySelector('.omni-ico').innerHTML=ic('search',15);
$('.palette-input .omni-ico').innerHTML=ic('cmd',17);
$('#bellBtn').insertAdjacentHTML('afterbegin',ic('bell'));
$('#helpBtn').innerHTML=ic('help');
$('#drawerClose').innerHTML=ic('x');
$$('.modal header .ico-btn').forEach(b=>b.innerHTML=ic('x'));
$('#okIco').innerHTML=ic('check',34);
$('#okCopy').innerHTML=ic('copy',13);
$('#pfSearchIco').innerHTML=ic('search',15);
$('#logoutBtn').insertAdjacentHTML('afterbegin',ic('logout',14));
const pv=document.createElement('div');
pv.className='modal-scrim';pv.id='previewScrim';pv.hidden=true;
pv.innerHTML='<div class="modal" style="width:min(940px,96vw)"><header><h3>ตัวอย่างการกรอกจริง</h3><button class="ico-btn" id="pvClose">'+ic('x')+'</button></header>'+
 '<div class="modal-body" style="background:var(--surface3)"><div id="pvWrap" style="overflow:auto;max-height:66vh;display:flex;justify-content:center"><div class="zoom-box"><div class="a4" id="pvCanvas"></div></div></div></div>'+
 '<footer><button class="btn" id="pvClose2">ปิด</button></footer></div>';
document.body.appendChild(pv);
$('#pvClose').onclick=$('#pvClose2').onclick=()=>pv.hidden=true;
pv.onclick=e=>{if(e.target===pv)pv.hidden=true};

/* ---------- keyboard ---------- */
const ORDER=['forms','builder','inbox','mine','staff','brand'];
document.addEventListener('keydown',e=>{
 const tag=(e.target.tagName||'').toLowerCase();
 const typing=tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable;
 const mod=e.ctrlKey||e.metaKey,k=(e.key||'').toLowerCase();
 if(mod&&k==='k'){e.preventDefault();return openPalette()}
 if(k==='escape'){
  if(!$('#paletteScrim').hidden)return closePalette();
  if(!pv.hidden)return pv.hidden=true;
  if(!$('#modalScrim').hidden)return closeModal();
  if(!$('#loginScrim').hidden)return closeLogin();
  if(!$('#helpScrim').hidden)return $('#helpScrim').hidden=true;
  if(!$('#notif').hidden)return $('#notif').hidden=true;
  if(!$('#drawer').hidden)return closeDrawer();
  if(S.shell==='admin'&&S.sec==='builder'&&S.b.sel){flushPropEdit();S.b.sel=null;refreshProps(true);paintSel()}
  return;
 }
 if(mod&&k==='j'){e.preventDefault();return toggleTheme()}
 if(mod&&k==='b'&&S.shell==='admin'){e.preventDefault();return $('#railToggle').click()}
 if(S.shell==='admin'&&e.altKey&&/^[1-6]$/.test(e.key)){e.preventDefault();S.sec=null;return go(ORDER[+e.key-1])}
 if(!typing&&k==='/'){e.preventDefault();
  if(S.shell==='public'&&S.pubView!=='forms')pubGo('forms');
  const s=S.shell==='admin'?$('.search input',$('#view')):$('#pfSearch');
  if(s){s.focus();s.select()}return}
 if(!typing&&(e.key==='?'||(e.shiftKey&&k==='/'))){e.preventDefault();return showHelp()}
 if(S.shell!=='admin'||S.sec!=='builder'||!S.b.id)return;
 if(mod&&k==='s'){e.preventDefault();return saveBuilder()}
 if(typing)return;
 if(mod&&k==='z'){e.preventDefault();return e.shiftKey?doRedo():doUndo()}
 if(!S.b.sel)return;
 if(mod&&k==='d'){e.preventDefault();return dupField(S.b.sel)}
 if(k==='delete'||k==='backspace'){
  const a=document.activeElement;
  if(a&&a!==document.body&&a.tagName!=='DIV')return;
  e.preventDefault();return removeField(S.b.sel)}
 const dir={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[k];
 if(dir){e.preventDefault();const f=S.b.fields.find(x=>x.id===S.b.sel);if(!f)return;
  pushUndo();const st=e.shiftKey?5:(S.b.snap?.5:.1);
  f.pos_x=clamp(+(f.pos_x+dir[0]*st).toFixed(2),0,PW-f.width);
  f.pos_y=clamp(+(f.pos_y+dir[1]*st).toFixed(2),0,PH-f.height);
  const el=$('#canvas [data-fid="'+CSS.escape(f.id)+'"]');
  if(el){el.style.left=f.pos_x+'mm';el.style.top=f.pos_y+'mm'}
  syncGeom(f);markDirty();paintOverlap()}
});
window.addEventListener('beforeunload',e=>{if(S.b.dirty||OUTBOX.length){e.preventDefault();e.returnValue=''}});
window.addEventListener('resize',debounce(()=>{
 if(S.shell==='admin'&&S.sec==='builder'&&S.b.id&&$('#canvas'))zoomTo($('#canvas'),S.b.zoom);
 if(S.shell==='public'&&S.pubView==='fill'&&S.fill.mode==='paper'){reflowFill();S.fill.zoom=fitOf($('#fillWrap'));applyFillZoom()}
 $$('.thumb').forEach(n=>{const c=$('.thumb-c',n);if(c&&c.dataset.done)c.style.transform='scale('+(n.clientWidth/(PW*MM))+')'});
},200));
window.addEventListener('hashchange',()=>{if(S.shell==='public')routePublic()});
document.addEventListener('click',e=>{
 if(!$('#notif').hidden&&!e.target.closest('#notif')&&!e.target.closest('#bellBtn'))$('#notif').hidden=true;
});
$('#main').addEventListener('scroll',()=>{
 const h=$('#view .sec-head');if(h)h.classList.toggle('scrolled',$('#main').scrollTop>8);
},{passive:true});
['fq','iq','mq','tq','pfSearch'].forEach(id=>{
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const el=document.getElementById(id);
  if(el&&document.activeElement===el&&el.value){e.stopPropagation();el.value='';el.dispatchEvent(new Event('input',{bubbles:true}))}
 },true);
});
window.addEventListener('online',()=>{pump();toast('กลับมาออนไลน์ — ส่งคิวต่อ',{type:'ok',ms:1800})});

/* ---------- INIT ---------- */
(function init(){
 injectCss();applyPrefs();paintBell();paintCounts();ensureFillUI();
 if(PURGED>0){persist();toast('ล้างข้อมูลรหัสผิดรูป '+PURGED+' รายการ',{type:'warn',ms:4000})}
 const wantAdmin=location.hash==='#/admin';
 if(wantAdmin&&accessToken){S.shell='admin';DB.prefs.shell='admin';applyPrefs();S.sec=null;go('forms')}
 else{S.shell='public';DB.prefs.shell='public';applyPrefs();routePublic()}
 restoreSession().then(ok=>{
  if(ok){$('#userName').textContent=S.meName;
   if(wantAdmin&&S.shell!=='admin'){S.shell='admin';applyPrefs();S.sec=null;go('forms')}
   if(S.shell==='admin')syncAdminCore();else syncPublic();
  }else{
   if(wantAdmin){history.replaceState(null,'','#/');S.shell='public';applyPrefs();routePublic();openLogin()}
   syncPublic();
  }
  pump();
 });
 if(!DB.activity.length)logAct('ยินดีต้อนรับ — ระบบทำงานแบบ local-first ตอบสนองทันที','info');
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('boot')));
})();
