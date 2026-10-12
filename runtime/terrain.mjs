// Independent map data prototype. No changes to production engine or room protocol.
export const plans=[
 {id:'compact',name:'A｜精簡橫向',width:18,height:11,axis:'horizontal',crossings:[4,9,14],parallel:[2,8]},
 {id:'recommended',name:'B｜橫向沿河',width:20,height:13,axis:'horizontal',crossings:[4,10,16],parallel:[2,10]},
 {id:'portrait',name:'C｜課堂直向',width:13,height:20,axis:'vertical',crossings:[4,10,16],parallel:[2,10]},
];
export function terrain(plan){
 const horizontal=plan.axis==='horizontal',length=horizontal?plan.width:plan.height,center=Math.floor((horizontal?plan.height:plan.width)/2);
 return Array.from({length:plan.width*plan.height},(_,id)=>{
  const x=id%plan.width,y=Math.floor(id/plan.width),along=horizontal?x:y,across=horizontal?y:x,distance=Math.abs(across-center),river=across===center;
  const road=!river&&(plan.parallel.includes(across)||plan.crossings.includes(along));
  const kind=river?'river':distance===1?'riverbank':distance<=2&&along>=Math.floor(length*2/3)?'lowland':distance>=3?'highland':'general';
  return {id,x,y,type:river?'river':road?'road':'land',facility:road?'road':'empty',buildable:!river&&!road,terrain:kind,lowland:kind==='lowland',
   elevation:length-along+distance*.7,flowTo:river?(along===length-1?null:id+(horizontal?1:plan.width)):id+(across<center?1:-1)*(horizontal?plan.width:1),
   banks:river?[id-(horizontal?plan.width:1),id+(horizontal?plan.width:1)]:[],roadCrossing:river&&plan.crossings.includes(along),
   reach:along<length/3?'上游':along<length*2/3?'中游':'下游',bank:river?'河道':horizontal?(across<center?'左岸':'右岸'):(across<center?'右岸':'左岸')};
 });
}
export function summary(plan){const cells=terrain(plan);return {cells:cells.length,river:cells.filter(c=>c.type==='river').length,roads:cells.filter(c=>c.type==='road').length,bridges:cells.filter(c=>c.roadCrossing).length,buildable:cells.filter(c=>c.buildable).length,left:cells.filter(c=>c.buildable&&c.bank==='左岸').length,right:cells.filter(c=>c.buildable&&c.bank==='右岸').length};}
export function simulation(engine,plan,facilities={}){
 const s=engine.createSimulation('ordinary',{initialState:'empty',targetHouseholds:12,pollutionEnabled:true,cityResilienceEnabled:true}),template=s.cells[0];
 s.cells=terrain(plan).map(c=>({...template,...c,facility:c.buildable?(facilities[c.id]||'empty'):c.facility}));
 engine.initializeNormalWater(s);return s;
}
