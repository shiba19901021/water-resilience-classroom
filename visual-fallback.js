// Presentation for the untouched V2.1 backup document; no access to its engine.
(()=>{const names={'🏠':'residential','🏪':'commercial','🏭':'industrial','🏥':'publicService','🌱':'agriculture','🌳':'park','🌲':'forest','🌿':'sunken','🌾':'wetland','💧':'reservoir','🚰':'intake','♻️':'treatment','🌉':'bridge'};
function paint(){for(const icon of document.querySelectorAll('.tile .facility-icon')){const name=names[icon.textContent];if(name&&!icon.parentElement.classList.contains('visual-'+name))icon.parentElement.classList.add('visual-'+name);}}
const map=document.querySelector('#map');if(map)new MutationObserver(paint).observe(map,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});paint();})();
