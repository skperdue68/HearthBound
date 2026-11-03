export const TOUR_COLLAGE_LIMIT=6;
function shuffled(values,random){const copy=[...values];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
export function* randomizedPhotoRounds(houses,random=Math.random){
 const groups=shuffled(houses.filter(h=>h.photos?.length),random).map(h=>({house:h,photos:shuffled(h.photos,random)}));
 for(let round=0;groups.some(g=>round<g.photos.length);round++)for(const group of groups)if(group.photos[round])yield {house:group.house,image:group.photos[round]};
}
