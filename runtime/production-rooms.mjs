import {randomBytes} from 'node:crypto';
import {ClassroomRooms} from './base-rooms.mjs';
import {plans,terrain} from './terrain.mjs';
const fixed=terrain(plans[2]),copy=x=>structuredClone(x),fail=(message,status=409)=>{throw Object.assign(Error(message),{status});};
const allowed=new Set(['empty','residential','commercial','industrial','agriculture','publicService','park','sunken','wetland','forest','reservoir','intake','treatment']);
export class ProductionRooms extends ClassroomRooms{
 create(groupCount=6){if(!Number.isInteger(groupCount)||groupCount<1||groupCount>10)fail('組數須為 1～10',400);const initial=super.create(),r=this.room(initial.room.roomCode),template=r.groups[0];r.groupCount=groupCount;r.groups=Array.from({length:groupCount},(_,i)=>({...copy(template),groupId:i+1}));return {...initial,room:this.view(r)};}
 view(r){return {...super.view(r),groupCount:r.groups.length,mapId:'C-13x20'};}
 playerView(r,who){const view=this.view(r);if(who.role==='player'&&['running','paused','results'].includes(r.phase))view.groups.find(g=>g.groupId===who.group.groupId).layout=copy(who.group.layout);return view;}
 join(code,name,id){const r=this.room(code);if(!Number.isInteger(id)||id<1||id>r.groups.length)fail('請選擇目前開放的組別',400);if(id<=6)return super.join(code,name,id);name=String(name||'').trim();if(!name||name.length>24)fail('請填寫 1～24 字組名',400);if(r.phase!=='build')fail('本輪已開始');const g=r.groups[id-1];if(g.joined)fail('此組已有裝置加入');Object.assign(g,{groupName:name,joined:true,token:randomBytes(24).toString('hex'),currentPhase:'建設中',connectionState:'連線中'});this.broadcast(r);return {room:this.view(r),token:g.token,role:'player',groupId:id};}
 validateLayout(layout){if(!Array.isArray(layout)||layout.length!==260)fail('C 地圖須為 260 格',400);for(const [i,c]of layout.entries()){const t=fixed[i];if(c?.id!==i||(!t.buildable?c.facility!==t.facility:!allowed.has(c.facility)))fail('固定河川、道路與橋梁不可修改',400);if(c.facility==='intake'&&!fixed.some(r=>r.type==='river'&&r.banks.includes(i)))fail('取水站須鄰接河川',400);}return copy(layout);}
 // Process the intentional teacher socket release before the command. Otherwise
 // its delayed close event can pause a newly started/resumed round afterwards.
 releaseTeacherStream(code,key){const r=this.room(code);if(this.identity(r,key).role!=='teacher')fail('只有講師能控制',403);const stream=r.streams.get(key);if(!stream)return;r.streams.delete(key);r.teacherConnected=false;if(r.phase==='running')super.teacherAction(code,key,'pause');stream.end();}
 groupAction(code,key,action,payload={}){const r=this.room(code),who=this.identity(r,key);if(who.role==='player'){const g=who.group;if(action==='layout'&&g.submitted&&r.phase==='build')fail('設計已完成，請先繼續修改');if(action==='started'&&JSON.stringify(payload.layout)!==JSON.stringify(g.layout))fail('模擬配置須與已確認配置相同');}super.groupAction(code,key,action,payload);return this.playerView(r,who);}
 teacherAction(code,key,action,p={}){const r=this.room(code);if(this.identity(r,key).role!=='teacher')fail('只有講師能控制',403);if(action==='forceSubmit'){if(r.phase!=='build')fail('目前不能強制完成');for(const g of r.groups.filter(g=>g.joined)){g.layout??=fixed.map(c=>({id:c.id,facility:c.facility}));g.submitted=true;g.currentPhase='已提交';}this.broadcast(r);return this.view(r);}if(action==='start')for(const g of r.groups.filter(g=>g.joined))if(!g.layout)fail('仍有組別的城市尚未同步');return super.teacherAction(code,key,action,p);}
 broadcast(r){r.revision++;for(const [key,res]of r.streams)res.write('data: '+JSON.stringify(this.playerView(r,this.identity(r,key)))+'\n\n');}
}

