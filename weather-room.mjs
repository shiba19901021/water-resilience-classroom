import{ProductionRooms}from'./runtime/production-rooms.mjs';import{generateStory,modes,weatherAt}from'./weather.mjs';
// Only classroom weather settings adapt; transport and lifecycle are inherited.
export class WeatherRooms extends ProductionRooms{
 create(...args){const data=super.create(...args),r=this.room(data.room.roomCode);r.duration=300;r.weatherMode='normal';return{...data,room:this.view(r)};}
 validateSettings(p){if(p.duration!==300||!Object.hasOwn(modes,p.weatherMode))throw Object.assign(Error('請選擇5分鐘正式劇本'),{status:400});super.validateSettings({...p,weatherMode:'auto',weatherSchedule:Array.from({length:10},(_,i)=>({startSeconds:i*30,endSeconds:(i+1)*30,phase:'validated',target:0,points:[[0,0],[30,0]]}))});}
 teacherAction(code,key,action,p={}){if(action==='start'){const r=this.room(code);if(this.identity(r,key).role!=='teacher')throw Object.assign(Error('只有講師能控制'),{status:403});this.validateSettings(p);p={...p,weatherSchedule:generateStory(300,p.weatherMode)};}return super.teacherAction(code,key,action,p);}
 view(r){const v=super.view(r);if(v.weatherSchedule.length)v.weatherNow=weatherAt(v.weatherSchedule,this.elapsed(r)/1000);return v;}
}

