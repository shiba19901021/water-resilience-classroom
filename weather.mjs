export const modes={normal:'一般天氣',dry:'長時間少雨',storm:'強降雨',extreme:'極端氣候'};
export const patterns=modes;
export const weatherNames={sunny:'晴天',cloudy:'多雲',light:'小雨',medium:'中雨',heavy:'大雨',storm:'豪雨',extreme:'極端強降雨',dry:'持續少雨'};
export const weatherIcons={sunny:'☀️',cloudy:'☁️',light:'🌦️',medium:'🌧️',heavy:'🌧️',storm:'⛈️',extreme:'⚠️',dry:'☀️'};
export const weatherBriefs={sunny:'目前天氣穩定，城市持續消耗可用水。',cloudy:'雲量增加，目前降雨補注有限。',light:'弱降雨正在補充土地與水體。',medium:'降雨增加，低窪地區開始累積水量。',heavy:'強降雨持續，河道與低窪區壓力升高。',storm:'豪雨持續，部分區域可能出現淹水。',extreme:'極端降雨正在考驗城市的蓄水與排水能力。',dry:'降雨不足，可用水量正在逐步下降。'};
// [end second, state, rain/tick]. No random or city-dependent input.
export const scripts={
 normal:[[50,'sunny',0],[85,'cloudy',.015],[125,'light',.07],[170,'cloudy',.015],[200,'medium',.14],[235,'light',.07],[300,'cloudy',.015]],
 dry:[[25,'cloudy',.015],[95,'dry',0],[155,'dry',0],[180,'light',.07],[245,'dry',0],[300,'light',.05]],
 storm:[[35,'cloudy',.01],[70,'light',.07],[110,'medium',.14],[135,'heavy',.29],[147,'storm',.35],[165,'heavy',.29],[200,'medium',.14],[240,'light',.07],[300,'cloudy',.01]],
 extreme:[[55,'dry',0],[105,'dry',0],[130,'light',.07],[155,'medium',.15],[180,'heavy',.24],[195,'storm',.32],[205,'extreme',.38],[225,'storm',.32],[255,'heavy',.24],[275,'medium',.14],[300,'light',.07]]
};
export function generateStory(duration=300,mode='normal',_seed){
 if(duration!==300||!Object.hasOwn(scripts,mode))throw Error('正式天氣劇本固定為5分鐘');
 let start=0;return scripts[mode].map(([end,key,target],i)=>{const seconds=end-start,b={pattern:mode,key,phase:weatherNames[key],target,startSeconds:start,endSeconds:end,points:[[0,target],[seconds,target]],news:{id:mode+'-'+i,type:key,title:'即時天氣｜'+weatherNames[key],text:weatherBriefs[key],seconds:start}};start=end;return b;});
}
export function weatherAt(story,seconds){
 if(!story?.length)throw Error('缺少天氣劇本');
 const b=story.find(b=>seconds<b.endSeconds)||story.at(-1);
 return {intensity:b.target,key:b.key,phase:b.phase,block:story.indexOf(b)+1,pattern:b.pattern,phaseTime:Math.max(0,Math.min(seconds-b.startSeconds,b.endSeconds-b.startSeconds)),news:b.news};
}
export function animationScale(rain){const n=Math.max(0,Math.min(1,rain/.40));return{density:rain<.04?0:Math.round(6+30*n),speed:1.7-1.2*n,cloudOpacity:.08+.17*n,dimming:.04*n};}


