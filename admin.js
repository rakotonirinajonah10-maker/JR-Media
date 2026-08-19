const ADMIN_EMAIL='rakotonirinajonah10@gmail.com';
let client=null, items=[], editingId=null;
const $=s=>document.querySelector(s);
function msg(t,ok=false){$('#message').textContent=t;$('#message').style.color=ok?'#9ee6b0':'#ff9b9b'}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
async function start(){
 try{
  if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_PUBLISHABLE_KEY)throw Error('Configuration Supabase introuvable.');
  client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
  const {data:{session}}=await client.auth.getSession();
  if(!session){location.href='index.html';return}
  const email=(session.user.email||'').toLowerCase();
  if(email!==ADMIN_EMAIL.toLowerCase()){
   $('#loading').innerHTML='<h2>Accès refusé</h2><p>Ce compte n’a pas les droits administrateur.</p><p><a href="index.html">Retour à JR Media</a></p>';
   return;
  }
  $('#adminEmail').textContent=session.user.email||'';
  $('#loading').classList.add('hidden');$('#app').classList.remove('hidden');
  await load();
 }catch(e){$('#loading').textContent='Erreur : '+e.message}
}
async function load(){
 const {data,error}=await client.from('media').select('*').order('created_at',{ascending:false});
 if(error){msg(error.message);return} items=data||[];render();
}
function render(){
 $('#total').textContent=items.length;$('#films').textContent=items.filter(x=>x.type==='film').length;$('#series').textContent=items.filter(x=>x.type==='serie').length;$('#cartoons').textContent=items.filter(x=>x.type==='cartoon').length;
 const q=$('#filter').value.toLowerCase();const list=items.filter(x=>(x.title+' '+(x.genre||'')).toLowerCase().includes(q));
 $('#list').innerHTML=list.map(x=>`<div class="media-row"><div class="thumb" style="background-image:${x.poster_url?`url('${x.poster_url}')`:''}"></div><div class="media-info"><b>${esc(x.title)}</b><span>${esc(x.type)} • ${x.year||'—'}${x.featured?' • À découvrir':''}</span></div><div class="row-actions"><button data-edit="${x.id}">Modifier</button><button class="danger" data-delete="${x.id}">Supprimer</button></div></div>`).join('')||'<p style="color:#858c99">Aucun contenu.</p>';
 $('#list').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(Number(b.dataset.edit)));$('#list').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>remove(Number(b.dataset.delete)));
}
function reset(){editingId=null;$('#mediaForm').reset();$('#mediaId').value='';$('#formTitle').textContent='Ajouter un contenu';$('#saveBtn').textContent='Ajouter le contenu';$('#cancelEdit').classList.add('hidden');msg('')}
function edit(id){const x=items.find(i=>Number(i.id)===id);if(!x)return;editingId=id;$('#mediaId').value=id;$('#title').value=x.title||'';$('#type').value=x.type||'film';$('#year').value=x.year||'';$('#genre').value=x.genre||'';$('#description').value=x.description||'';$('#posterUrl').value=x.poster_url||'';$('#videoUrl').value=x.video_url||'';$('#downloadUrl').value=x.download_url||'';$('#featured').checked=!!x.featured;$('#formTitle').textContent='Modifier le contenu';$('#saveBtn').textContent='Enregistrer les modifications';$('#cancelEdit').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})}
async function save(e){e.preventDefault();msg('Enregistrement…',true);const payload={title:$('#title').value.trim(),type:$('#type').value,year:$('#year').value?Number($('#year').value):null,genre:$('#genre').value.trim()||null,description:$('#description').value.trim()||null,poster_url:$('#posterUrl').value.trim()||null,video_url:$('#videoUrl').value.trim()||null,download_url:$('#downloadUrl').value.trim()||null,featured:$('#featured').checked};let res; if(editingId)res=await client.from('media').update(payload).eq('id',editingId);else res=await client.from('media').insert(payload);if(res.error){msg(res.error.message);return}msg(editingId?'Contenu modifié.':'Contenu ajouté.',true);reset();await load()}
async function remove(id){const x=items.find(i=>Number(i.id)===id);if(!x)return;if(!confirm(`Supprimer « ${x.title} » ?`))return;const {error}=await client.from('media').delete().eq('id',id);if(error){msg(error.message);return}msg('Contenu supprimé.',true);await load()}
$('#mediaForm').addEventListener('submit',save);$('#cancelEdit').addEventListener('click',reset);$('#filter').addEventListener('input',render);$('#logout').addEventListener('click',async()=>{await client.auth.signOut();location.href='index.html'});start();