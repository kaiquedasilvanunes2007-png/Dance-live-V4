const express=require('express');const http=require('http');const path=require('path');const crypto=require('crypto');const helmet=require('helmet');const multer=require('multer');const {WebSocketServer}=require('ws');
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server});const PORT=process.env.PORT||10000;const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'troque-esta-senha';
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));app.use(express.json({limit:'1mb'}));app.use(express.urlencoded({extended:true}));app.use(express.static(path.join(__dirname,'public')));
const sessions=new Map(),attempts=new Map(),donors=new Map(),music=new Map();let musicId=0;
let state={paused:false,quality:'medium',maxCharacters:40,primary:'#7c3cff',secondary:'#00e5ff',lights:'#ff2bd6',volume:.65,music:null};
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),adminHash=hash(ADMIN_PASSWORD);
function cookies(req){const o={};(req.headers.cookie||'').split(';').forEach(x=>{const [k,...v]=x.trim().split('=');if(k)o[k]=decodeURIComponent(v.join('='))});return o}
function admin(req){const t=cookies(req).admin_session,s=sessions.get(t);if(!s||s.expires<Date.now()){if(t)sessions.delete(t);return false}return true}
function need(req,res,next){if(!admin(req))return res.status(401).json({error:'Não autorizado'});next()}
function ck(n,v,max){return `${n}=${v}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${max}`}
function send(type,p={}){const m=JSON.stringify({type,...p});for(const c of wss.clients)if(c.readyState===1)c.send(m)}
function list(){return [...donors.values()]}
app.post('/api/login',(req,res)=>{const ip=req.ip,now=Date.now(),a=attempts.get(ip)||{count:0,until:0};if(a.until>now)return res.status(429).json({error:'Tente novamente em alguns segundos.'});if(hash(String(req.body.password||''))!==adminHash){a.count++;if(a.count>=5){a.count=0;a.until=now+30000}attempts.set(ip,a);return res.status(401).json({error:'Senha incorreta.'})}attempts.delete(ip);const t=crypto.randomBytes(32).toString('hex');sessions.set(t,{expires:now+43200000});res.setHeader('Set-Cookie',ck('admin_session',t,43200));res.json({ok:true})});
app.post('/api/logout',need,(req,res)=>{const t=cookies(req).admin_session;sessions.delete(t);res.setHeader('Set-Cookie',ck('admin_session','',0));res.json({ok:true})});
app.get('/api/state',(req,res)=>res.json({state,donors:list()}));app.get('/api/admin/me',need,(req,res)=>res.json({ok:true}));
app.post('/api/settings',need,(req,res)=>{for(const k of ['paused','quality','maxCharacters','primary','secondary','lights','volume'])if(req.body[k]!==undefined)state[k]=req.body[k];send('settings',{state});res.json({ok:true,state})});
app.post('/api/donor/remove',need,(req,res)=>{const u=String(req.body.username||'');donors.delete(u);send('donor_remove',{username:u});res.json({ok:true})});
app.post('/api/donor/pin',need,(req,res)=>{const u=String(req.body.username||''),d=donors.get(u);if(!d)return res.status(404).json({error:'Doador não encontrado.'});for(const x of donors.values())x.pinned=false;d.pinned=true;send('donor_update',{donor:d});res.json({ok:true})});
app.post('/api/donor/unpin',need,(req,res)=>{const u=String(req.body.username||''),d=donors.get(u);if(d)d.pinned=false;send('donor_update',{donor:d});res.json({ok:true})});
app.post('/api/donor/clear',need,(req,res)=>{donors.clear();send('clear');res.json({ok:true})});
app.post('/api/test-gift',need,(req,res)=>{const username=String(req.body.username||'@teste'),gift=String(req.body.gift||'rose'),repeat=Math.max(1,Math.min(999,Number(req.body.repeatCount||1)));const points=({rose:1,heart:5,gift:10,rocket:100,lion:500,universe:1000}[gift]||1)*repeat;let d=donors.get(username),fresh=!d;if(!d){d={username,score:0,gifts:0,totalValue:0,character:Math.floor(Math.random()*24),x:12+Math.random()*76,z:8+Math.random()*78,pinned:false,joinedAt:Date.now()};donors.set(username,d)}d.score+=points;d.gifts+=repeat;d.totalValue+=points;send(fresh?'donor_add':'donor_update',{donor:d,gift,repeatCount:repeat,points});res.json({ok:true,donor:d})});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:20*1024*1024},fileFilter:(r,f,cb)=>cb(null,/^audio\//.test(f.mimetype))});
app.post('/api/music/upload',need,upload.single('music'),(req,res)=>{if(!req.file)return res.status(400).json({error:'Envie um arquivo de áudio.'});const id=String(++musicId);music.set(id,{buffer:req.file.buffer,type:req.file.mimetype,name:req.file.originalname});state.music={name:req.file.originalname,url:'/api/music/'+id};send('music',{music:state.music});res.json({ok:true,music:state.music})});
app.get('/api/music/:id',(req,res)=>{const m=music.get(req.params.id);if(!m)return res.status(404).end();res.type(m.type);res.set('Cache-Control','no-store');res.end(m.buffer)});app.post('/api/music/clear',need,(req,res)=>{state.music=null;send('music',{music:null});res.json({ok:true})});
wss.on('connection',ws=>ws.send(JSON.stringify({type:'snapshot',state,donors:list()})));
app.use((req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));setInterval(()=>{const n=Date.now();for(const [t,s] of sessions)if(s.expires<n)sessions.delete(t)},600000);
server.listen(PORT,()=>console.log('Dance Live na porta '+PORT));
