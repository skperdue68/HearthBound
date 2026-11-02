import {withTourCover} from './tour-cover.js';
import {unifiedMessagePayload} from './message-layout.js';
export async function tourPassWithCover(covers,context,channel,bot,tour,payload){
 if(!covers)return payload;
 const covered=await withTourCover(covers,context,{appPermissions:channel.permissionsFor?.(bot)},tour,payload);
 return unifiedMessagePayload(covered);
}
