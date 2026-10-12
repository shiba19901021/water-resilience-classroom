import http from 'node:http';import {readFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {WeatherRooms as ClassroomRooms} from './weather-room.mjs';
const {version}=JSON.parse(await readFile(new URL('./package.json',import.meta.url),'utf8'));
export function createClassroomServer({rooms=new ClassroomRooms()}={}){
 const studentViews=new Map();
 const server=http.createServer(async(req,res)=>{
  const base='http://'+(req.headers.host||'localhost'),url=new URL(req.url,base);
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   const visualAssets=new Map([['/qr.css',['./qr.css','text/css']],['/assets/vendor/qrcodegen.js',['./assets/vendor/qrcodegen.js','text/javascript']],['/visual.css',['./visual.css','text/css']],['/visual-fallback.js',['./visual-fallback.js','text/javascript']],['/assets/icons.css',['./assets/icons.css','text/css']],['/assets/water-lab-icons.woff',['./assets/water-lab-icons.woff','font/woff']]]);
   if(req.method==='GET'&&visualAssets.has(url.pathname)){const [file,type]=visualAssets.get(url.pathname);res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(await readFile(new URL(file,import.meta.url)));return;}
   if(req.method==='GET'&&url.pathname==='/api/student-view'){
    const room=rooms.room(url.searchParams.get('room')),who=rooms.identity(room,url.searchParams.get('token'));
    if(who.role!=='teacher'){json(403,{error:'只有講師能查看'});return;}
    const groupId=Number(url.searchParams.get('group'));if(!room.groups.some(g=>g.groupId===groupId&&g.joined)){json(404,{error:'組別尚未加入'});return;}
    json(200,studentViews.get(room.roomCode)?.get(groupId)||{groupId,snapshot:null});return;
   }
   if(req.method==='GET'&&url.pathname==='/api/room'){const r=rooms.room(url.searchParams.get('room'));json(200,{phase:r.phase,groups:r.groups.map(g=>({groupId:g.groupId,joined:g.joined}))});return;}
   if(req.method==='GET'&&['/terrain.mjs','/production.css','/weather.css','/service.css'].includes(url.pathname)){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.css')?'text/css':'text/javascript','Cache-Control':'no-store'});res.end(await readFile(new URL(url.pathname==='/service.css'?'./service.css':url.pathname==='/weather.css'?'./weather.css':url.pathname.endsWith('.css')?'./production.css':'./runtime/terrain.mjs',import.meta.url)));return;}
   if(req.method==='GET'&&url.pathname==='/health'){json(200,{ok:true,version});return;}
   if(req.method==='GET'&&['/','/water-resilience-p0.html','/single'].includes(url.pathname)){const file=url.pathname==='/single'?'./single.html':'./index.html';let page=await readFile(new URL(file,import.meta.url),'utf8');if(url.pathname==='/single')page=page.replace('</head>','<link rel="stylesheet" href="/visual.css"></head>').replace('</body>','<script src="/visual-fallback.js"></script></body>');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(page);return;}
   if(req.method==='GET'&&url.pathname==='/api/events'){const room=rooms.room(url.searchParams.get('room'));rooms.identity(room,url.searchParams.get('token'));res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();res.setTimeout(0);res.write(': classroom stream\n\n');rooms.connect(room.roomCode,url.searchParams.get('token'),res);return;}
   if(req.method!=='POST'||!url.pathname.startsWith('/api/')){json(404,{error:'找不到頁面'});return;}
   // Reject cross-origin writes; no third party service or credentials needed.
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){json(403,{error:'來源不符'});return;}
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>(url.pathname==='/api/student-view'?524288:65536)){json(413,{error:'資料過大'});return;}}let p;try{p=JSON.parse(raw||'{}');}catch{json(400,{error:'資料格式無效'});return;}
   if(url.pathname==='/api/student-view'){
    const room=rooms.room(p.roomCode),who=rooms.identity(room,p.token);
    if(who.role!=='player'){json(403,{error:'只有學員能提供畫面'});return;}
    if(p.roundNumber!==room.roundNumber||p.phase!==room.phase||typeof p.snapshot!=='string'||p.snapshot.length>400000){json(409,{error:'畫面階段不符'});return;}
    let views=studentViews.get(room.roomCode);if(!views){views=new Map();studentViews.set(room.roomCode,views);}
    const data={groupId:who.group.groupId,roundNumber:room.roundNumber,phase:room.phase,receivedAt:Date.now(),snapshot:p.snapshot};views.set(data.groupId,data);
    room.streams.get(room.teacherToken)?.write('event: student-view\ndata: '+JSON.stringify(data)+'\n\n');json(200,{ok:true});return;
   }
   let result;if(url.pathname==='/api/create')result=rooms.create(p.groupCount);else if(url.pathname==='/api/join')result=rooms.join(p.roomCode,p.groupName,p.groupId);else if(url.pathname==='/api/group')result=rooms.groupAction(p.roomCode,p.token,p.action,p.payload);else if(url.pathname==='/api/teacher'){rooms.releaseTeacherStream(p.roomCode,p.token);result=rooms.teacherAction(p.roomCode,p.token,p.action,p.payload);}else{json(404,{error:'未知指令'});return;}json(200,result);
  }catch(error){if(!res.headersSent)json(error.status||500,{error:error.status?error.message:'課堂服務發生錯誤'});else res.end();}
 });const heartbeat=setInterval(()=>rooms.heartbeat(),1000);heartbeat.unref();server.on('close',()=>{clearInterval(heartbeat);rooms.close();});server.rooms=rooms;return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const host=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1'),port=Number(process.env.PORT||4203);createClassroomServer().listen(port,host,()=>console.log('V'+version+' classroom: http://'+host+':'+port));}

