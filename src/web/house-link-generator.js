import {buildHousingLink,buildJumpScript} from '../utils/eso.js';
import {escape} from './render.js';
import {input,linkButton} from './workspace-render.js';

export function houseLinkGeneratorPage({houses=[],selectedId='',owner='',error=''}){
 const selected=String(selectedId||''),account=String(owner||'').trim(),house=houses.find(h=>String(h.house_id)===selected)||null;
 const options=houses.map(h=>`<option value="${Number(h.house_id)}" ${String(h.house_id)===selected?'selected':''}>${escape(h.name)}${h.zone?` · ${escape(h.zone)}`:''}</option>`).join('');
 const result=house&&account?`<section class="panel" id="house-links-result"><h2>Travel links for ${escape(house.name)}</h2><p class="note">Copy either value below and paste it into ESO chat. The owner must be the ESO account name without the @ symbol; HearthBound adds it for you.</p><div class="visit-grid"><section class="visit-command"><h3>Jump script</h3><pre><code>${escape(buildJumpScript(account,house.house_id))}</code></pre></section><section class="visit-command"><h3>Housing link</h3><pre><code>${escape(buildHousingLink(account,house.house_id))}</code></pre></section></div><div class="actions">${linkButton('Generate another link','/app/tools/house-links')}</div></section>`:'';
 const hint=error?`<div class="notice error" role="alert">${escape(error)}</div>`:house&&!account?'<div class="notice" role="status">Enter the ESO account owner to generate links for this house.</div>':'';
 return `<p>Choose an official ESO house, enter its owner’s ESO account name, and copy a ready-to-use jump script or housing link.</p><section class="panel"><h2>House link generator</h2>${hint}<form method="get"><div class="filters"><label>House<select name="houseId" required ${options?'':'disabled'}><option value="">Choose a house</option>${options}</select></label>${input('ESO account owner','owner',account,'text',true)}<button ${options?'':'disabled'}>Generate links</button></div></form>${options?'':'<p class="note">The official catalog is empty. A bot owner can add houses from House Catalog.</p>'}</section>${result}`;
}
