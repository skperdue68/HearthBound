const names=new Intl.Collator('en',{sensitivity:'base',numeric:true});
export function orderTours(rows){return [...rows].sort((a,b)=>Number(Boolean(a.automatic_owner))-Number(Boolean(b.automatic_owner))||names.compare(String(a.name).trim(),String(b.name).trim())||Number(a.id)-Number(b.id));}
export function tourSections(rows){return [{title:'Community tours',rows:rows.filter(t=>!t.automatic_owner)},{title:'Automatic owner tours',rows:rows.filter(t=>t.automatic_owner)}].filter(g=>g.rows.length);}
