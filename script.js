const typeLabel={film:'Film',serie:'Série',cartoon:'Animé'};

// JR Media: catalogue chargé depuis Supabase.
const fallbackMedia=[
 {id:1,title:'Voyage des étoiles',type:'film',year:2026,genre:'Science-fiction',desc:'Un contenu de démonstration pour la première version de JR Media.',featured:true},
 {id:2,title:'Mystère à Minuit',type:'film',year:2025,genre:'Mystère',desc:'Exemple de fiche média destinée à tester l’interface.',featured:true},
 {id:3,title:'Les Explorateurs',type:'serie',year:2026,genre:'Aventure',desc:'Une série de démonstration pour tester les catégories et la recherche.',featured:true},
 {id:4,title:'Planète Junior',type:'cartoon',year:2025,genre:'Animation',desc:'Contenu de démonstration destiné à la section dessins animés.'},
 {id:5,title:'Code Secret',type:'serie',year:2024,genre:'Thriller',desc:'Exemple de série dans le catalogue JR Media.'},
 {id:6,title:'Le Petit Nuage',type:'cartoon',year:2026,genre:'Famille',desc:'Exemple de contenu familial de démonstration.'}
];
let media=[...fallbackMedia];
let favorites=JSON.parse(localStorage.getItem('jrMediaFavorites')||'[]');
let current=null;
let authMode='login';
let supabaseClient=null;
const $=s=>document.querySelector(s);

function posterStyle(id){const gradients=['linear-gradient(145deg,#283c5b,#11131a)','linear-gradient(145deg,#5a344d,#11131a)','linear-gradient(145deg,#315947,#11131a)','linear-gradient(145deg,#6a5430,#11131a)','linear-gradient(145deg,#43356c,#11131a)','linear-gradient(145deg,#245e67,#11131a)'];return gradients[(Number(id)-1)%gradients.length]||gradients[0]}
function card(item){const fav=favorites.includes(item.id);return `<article class="card" data-id="${item.id}"><div class="poster" style="background:${item.poster_url?`url('${item.poster_url}') center/cover`:posterStyle(item.id)}"><button class="card-fav" data-fav="${item.id}" aria-label="Favori">${fav?'♥':'♡'}</button><span class="poster-label">${typeLabel[item.type]||item.type}</span></div><div class="card-body"><div class="card-title">${item.title}</div><div class="card-meta">${item.year||''}${item.genre?' • '+item.genre:''}</div></div></article>`}
function render(list,target){$(target).innerHTML=list.map(card).join('');bindCards($(target))}
function bindCards(container){container.querySelectorAll('.card').forEach(c=>c.addEventListener('click',e=>{if(e.target.dataset.fav)return;openDetail(Number(c.dataset.id))}));container.querySelectorAll('[data-fav]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();toggleFav(Number(b.dataset.fav))}))}
function toggleFav(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem('jrMediaFavorites',JSON.stringify(favorites));renderAll();toast(favorites.includes(id)?'Ajouté aux favoris':'Retiré des favoris')}
function renderAll(){render(media.filter(x=>x.featured),'#featuredCards');render(media.filter(x=>x.type==='film'),'#filmCards');render(media.filter(x=>x.type==='serie'),'#seriesCards');render(media.filter(x=>x.type==='cartoon'),'#cartoonCards')}
function openDetail(id){current=media.find(x=>Number(x.id)===Number(id));if(!current)return;$('#detailPoster').style.background=current.poster_url?`url('${current.poster_url}') center/cover`:posterStyle(id);$('#detailType').textContent=typeLabel[current.type]||current.type;$('#detailTitle').textContent=current.title;$('#detailMeta').textContent=`${current.year||''}${current.genre?' • '+current.genre:''}`;$('#detailDescription').textContent=current.description||current.desc||'';$('#detailModal').classList.remove('hidden')}
function closeDetail(){$('#detailModal').classList.add('hidden')}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}

async function loadMediaFromSupabase(){
  try{
    if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_PUBLISHABLE_KEY)return;
    supabaseClient=supabaseClient||window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
    const {data,error}=await supabaseClient.from('media').select('*').order('created_at',{ascending:false});
    if(error)throw error;
    if(Array.isArray(data)&&data.length){media=data.map(x=>({...x,desc:x.description||''}));renderAll();toast(`${media.length} contenus chargés`)}
  }catch(error){console.error('JR Media / Supabase:',error)}
}

function setAuthMessage(message,isError=true){const el=$('#authMessage');el.textContent=message;el.className=`auth-message ${isError?'error':'success'}`}
function openAuth(){updateAuthUI();$('#authModal').classList.remove('hidden')}
function closeAuth(){$('#authModal').classList.add('hidden')}
function updateAuthUI(){const loggedIn=!!window.currentJRUser;$('#authLoggedOut').classList.toggle('hidden',loggedIn);$('#authLoggedIn').classList.toggle('hidden',!loggedIn);$('#accountBtn').textContent=loggedIn?'Mon compte':'Connexion';if(loggedIn)$('#accountEmail').textContent=window.currentJRUser.email||'Compte JR Media'}
async function initAuth(){
  if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_PUBLISHABLE_KEY)return;
  supabaseClient=supabaseClient||window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
  const {data}=await supabaseClient.auth.getSession();
  window.currentJRUser=data?.session?.user||null;
  updateAuthUI();
  supabaseClient.auth.onAuthStateChange((_event,session)=>{window.currentJRUser=session?.user||null;updateAuthUI()});
}
async function submitAuth(){
  if(!supabaseClient){setAuthMessage('Connexion Supabase indisponible.');return}
  const email=$('#authEmail').value.trim();const password=$('#authPassword').value;
  if(!email||!password){setAuthMessage('Entre ton e-mail et ton mot de passe.');return}
  $('#authSubmit').disabled=true;setAuthMessage('Connexion en cours...',false);
  try{
    if(authMode==='signup'){
      const {data,error}=await supabaseClient.auth.signUp({email,password});if(error)throw error;
      if(data.session){window.currentJRUser=data.user;setAuthMessage('Compte créé et connecté.',false);updateAuthUI();toast('Bienvenue sur JR Media')}
      else setAuthMessage('Compte créé. Vérifie ton e-mail pour confirmer le compte.',false);
    }else{
      const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)throw error;
      window.currentJRUser=data.user;updateAuthUI();setAuthMessage('Connexion réussie.',false);toast('Connexion réussie');
    }
  }catch(error){setAuthMessage(error.message||'Une erreur est survenue.')}
  finally{$('#authSubmit').disabled=false}
}
function switchAuthMode(){authMode=authMode==='login'?'signup':'login';$('#authTitle').textContent=authMode==='login'?'Connexion':'Créer un compte';$('#authSubmit').textContent=authMode==='login'?'Se connecter':'Créer mon compte';$('#authSwitch').textContent=authMode==='login'?'Créer un compte':'J’ai déjà un compte';$('#authPassword').autocomplete=authMode==='login'?'current-password':'new-password';setAuthMessage('')}
async function signOut(){if(!supabaseClient)return;await supabaseClient.auth.signOut();window.currentJRUser=null;updateAuthUI();closeAuth();toast('Déconnexion réussie')}

$('#closeModal').addEventListener('click',closeDetail);$('#detailModal').addEventListener('click',e=>{if(e.target.id==='detailModal')closeDetail()});
$('#watchBtn').addEventListener('click',()=>{if(current?.video_url)window.open(current.video_url,'_blank','noopener');else toast('Lecteur vidéo à connecter pour ce contenu.')});
$('#downloadBtn').addEventListener('click',()=>{if(current?.download_url)window.open(current.download_url,'_blank','noopener');else toast('Téléchargement disponible uniquement pour les contenus autorisés.')});
$('#searchToggle').addEventListener('click',()=>{$('#searchPanel').classList.toggle('hidden');if(!$('#searchPanel').classList.contains('hidden'))$('#searchInput').focus()});
$('#searchInput').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();const section=$('#resultsSection');if(!q){section.classList.add('hidden');return}const results=media.filter(x=>(x.title+' '+(x.genre||'')+' '+(typeLabel[x.type]||x.type)).toLowerCase().includes(q));section.classList.remove('hidden');render(results,'#resultsCards')});
$('[data-action="explore"]').addEventListener('click',()=>$('#featured').scrollIntoView({behavior:'smooth'}));
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.filter;if(f==='all'){$('#featured').scrollIntoView({behavior:'smooth'});return}document.getElementById(f==='film'?'films':f==='serie'?'series':'cartoons').scrollIntoView({behavior:'smooth'})}));
$('#favoritesBtn').addEventListener('click',()=>{const results=media.filter(x=>favorites.includes(Number(x.id)));$('#resultsSection').classList.remove('hidden');render(results,'#resultsCards');$('#resultsSection').scrollIntoView({behavior:'smooth'});if(!results.length)toast('Aucun favori pour le moment.')});
$('#accountBtn').addEventListener('click',openAuth);$('#closeAuth').addEventListener('click',closeAuth);$('#authModal').addEventListener('click',e=>{if(e.target.id==='authModal')closeAuth()});$('#authSubmit').addEventListener('click',submitAuth);$('#authSwitch').addEventListener('click',switchAuthMode);$('#signOutBtn').addEventListener('click',signOut);

renderAll();
loadMediaFromSupabase();
initAuth();