/* Baridi transfer: declarations stay pending until the owner verifies receipt. */
(() => {
 'use strict';
 const RIP='00799999002038493812', BENEFICIARY='Lugha Pro';
 let access=null;
 async function api(path,body) {
  const session=await LZ.sb?.auth.getSession();const token=session?.data?.session?.access_token;
  if(!token)throw new Error('Connecte-toi à ton compte pour gérer ton abonnement.');
  const r=await fetch('/api/'+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  const data=await r.json();if(!r.ok)throw new Error(data.error || (data.reason==='free_language'?'La version gratuite est limitée à ta première langue.':data.reason==='suspended'?'L’accès aux leçons de ce compte est suspendu. Contacte le support.':data.reason==='single_profile'?'L’abonnement couvre un seul profil. Reviens au profil utilisé pour ton essai.':'La version gratuite comprend les trois premières leçons. Passe à Lugha Pro pour continuer.'));return data;
 }
 async function refresh(){access=await api('membership');return access;}
 async function startLesson(language,lessonIndex){
  const response=await fetch('/api/billing-config',{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Impossible de vérifier l’accès. Réessaie dans un instant.');
  const config=await response.json();
  if(typeof config.enabled!=='boolean')throw new Error('Impossible de vérifier l’accès.');
  const session=await LZ.sb?.auth.getSession();
  if(!session?.data?.session){if(!config.enabled)return {allowed:true,status:'preview'};if(LZ.me?.()?.email==='demo@lugha.academy'&&language==='en'&&lessonIndex>=0&&lessonIndex<3)return {allowed:true,status:'demo'};throw new Error('Crée un compte gratuit pour choisir ta langue ou gérer ton abonnement. La démo comprend les trois premières leçons d’anglais.');}
  return api('lesson-access',{language,sessionId:crypto.randomUUID(),profileId:LZ.prof().id,lessonIndex});
 }
 async function uploadReceipt(file){
  if(!file||file.size<1||file.size>5*1024*1024)throw new Error('Choisis un reçu de 5 Mo maximum.');
  const b=new Uint8Array(await file.slice(0,12).arrayBuffer());let type,ext;
  if(b[0]===255&&b[1]===216&&b[2]===255){type='image/jpeg';ext='jpg';}
  else if([137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n)){type='image/png';ext='png';}
  else if(String.fromCharCode(...b.slice(0,5))==='%PDF-'){type='application/pdf';ext='pdf';}
  else if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP'){type='image/webp';ext='webp';}
  else throw new Error('Le reçu doit être une photo JPG, PNG, WebP ou un PDF valide.');
  const {data:{session}}=await LZ.sb.auth.getSession();if(!session)throw new Error('Reconnecte-toi avant d’envoyer ton reçu.');
  const path=session.user.id+'/'+crypto.randomUUID()+'.'+ext;
  const {error}=await LZ.sb.storage.from('lugha-receipts').upload(path,file,{contentType:type,upsert:false});
  if(error)throw new Error('Le reçu n’a pas pu être envoyé. Vérifie ta connexion ou réessaie demain si tu as déjà envoyé cinq fichiers.');
  return path;
 }
 function offer(el) {
  const {esc,$}=LZ;
  el.innerHTML=`<div class="page narrow subscription"><p class="pill">Lugha Pro</p><h1>Un objectif. Une langue aujourd’hui, d’autres demain.</h1><p class="page-sub">10 minutes par jour pour un adolescent ou un adulte. Les parents suivent les progrès de leur enfant.</p><section class="card"><h2>2 000 DA / 3 mois</h2><p>Un seul paiement, un seul profil. Sans renouvellement automatique.</p><ul><li>Les quinze langues disponibles, à explorer à ton rythme</li><li>Jeux, images, lecture et questions variées</li><li>Objectifs quotidiens, séries et récompenses</li><li>Suivi parental et réglage du temps d’écran</li><li>Ta progression reste conservée à la fin de l’accès</li></ul><p class="small">Anglais A1 : 2 999 activités. A2–C2 restent en préparation ; les autres langues ont des banques plus courtes. Le classement actuel est une ligue d’entraînement simulée.</p><p id="billingStatus" role="status">Vérification de la disponibilité du paiement…</p></section><section class="card"><h2>Gratuit, sans limite de jours</h2><p>Les trois premières leçons A1 et leurs révisions, dans une seule langue et avec un seul profil. Rejoue ces leçons autant que tu veux. La suite du parcours est réservée à Lugha Pro.</p></section><section class="card" id="transfer" hidden><h2>Payer par virement Baridi</h2><p>Montant : <strong>2 000 DA</strong><br>Bénéficiaire : <strong>${BENEFICIARY}</strong></p><label for="rip">RIP du bénéficiaire</label><input id="rip" class="payment-rip" readonly value="${RIP}" aria-label="RIP du bénéficiaire"><p>Vérifie le bénéficiaire et le RIP dans ton application avant de confirmer le virement.</p><button class="btn btn-ghost" id="copyRip">Copier le RIP</button><p>Après le virement, envoie une photo ou un PDF du reçu, avec sa référence et sa date. L’accès démarre après vérification du montant réellement reçu, pas après cette déclaration.</p><form id="paymentForm"><label for="transferReference">Référence du virement</label><input id="transferReference" name="reference" required minlength="4" maxlength="80" autocomplete="off"><label for="transferDate">Date du virement</label><input id="transferDate" name="date" type="date" required max="${new Date().toLocaleDateString('en-CA')}"><label for="paymentReceipt">Reçu du virement</label><input id="paymentReceipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required><p class="small">Photo JPG, PNG, WebP ou PDF · 5 Mo maximum. Visible uniquement par toi et la gestion de Lugha.</p><label class="payment-confirm"><input id="transferConfirmed" type="checkbox" required> J’ai effectué le virement de 2 000 DA.</label><button class="btn btn-primary" type="submit">Envoyer mon reçu</button><p id="paymentMessage" role="status"></p></form></section><section class="card" id="paymentState" hidden><h2>Suivi de ton paiement</h2><p id="paymentStateText" role="status"></p><button class="btn btn-ghost" id="refreshPayment">Actualiser</button></section><a class="btn btn-ghost" id="paymentAdminLink" href="/wbx#payments" hidden>Vérifier les virements reçus</a><a class="btn btn-ghost" href="#/apprendre">Retour à mon parcours</a></div>`;
  const status=$('#billingStatus',el),transfer=$('#transfer',el),form=$('#paymentForm',el),message=$('#paymentMessage',el);
  function showPayment(p){if(!p.status)return;$('#paymentState',el).hidden=false;$('#paymentStateText',el).textContent=p.status==='pending'?'Reçu envoyé. Vérification en cours. Ton accès gratuit reste disponible pendant l’attente.':p.status==='approved'?'Paiement validé. Consulte la date de fin de ton accès ci-dessus.':`Paiement non validé. ${p.reason || 'Vérifie la référence et le montant du virement.'}`;form.hidden=p.status==='pending'&&!!p.receiptPath;}
  async function update(){const a=await refresh();$('#paymentAdminLink',el).hidden=!a.isAdmin;if(a.status==='paid'){status.textContent=`Ton accès est actif jusqu’au ${new Date(a.paidUntil).toLocaleDateString('fr-FR')}.`;transfer.hidden=true;}else if(a.paymentEnabled){status.textContent='Accès gratuit : les trois premières leçons, rejouables sans limite de jours.';transfer.hidden=false;}else status.textContent='Le paiement et les limites d’essai ne sont pas encore activés. Aucun virement n’est demandé pour le moment.';showPayment(await api('payment-status'));}
  update().catch(e=>{status.textContent=e.message;if(LZ.me?.()?.email==='demo@lugha.academy'){const b=document.createElement('button');b.className='btn btn-primary';b.textContent='Créer mon compte gratuit';b.addEventListener('click',()=>{LZ.db.session=null;LZ.save();location.hash='#/inscription';});status.after(b);}});
  $('#copyRip',el).addEventListener('click',async()=>{try{await navigator.clipboard.writeText(RIP);LZ.toast('RIP copié.');}catch{$('#rip',el).select();LZ.toast('Sélectionne le RIP puis copie-le.');}});
  $('#refreshPayment',el).addEventListener('click',()=>update().catch(e=>{status.textContent=e.message;}));
  form.addEventListener('submit',async e=>{e.preventDefault();const b=form.querySelector('button[type=submit]');b.disabled=true;message.textContent='Envoi de ton reçu…';try{const receiptPath=await uploadReceipt($('#paymentReceipt',el).files[0]);const result=await api('payment-request',{receiptPath,reference:$('#transferReference',el).value.trim(),transferDate:$('#transferDate',el).value});message.textContent='Reçu envoyé à la gestion de Lugha.';showPayment(result);}catch(error){message.textContent=error.message;}finally{b.disabled=false;}});
 }
 function admin(el){
  const {esc,$}=LZ;
  el.innerHTML='<div class="page narrow"><h1>Vérifier les virements</h1><p>Compare chaque demande à ton relevé Baridi. Une référence saisie par un utilisateur ne prouve pas le paiement.</p><div id="paymentList" role="status">Chargement…</div></div>';
  const list=$('#paymentList',el);
  async function load(){const rows=await api('payment-admin');list.innerHTML=rows.length?rows.map(p=>`<section class="card" data-payment="${esc(p.id)}"><h2>${esc(p.email)}</h2><p>2 000 DA · ${esc(p.transferDate)}<br>Référence : <strong>${esc(p.reference)}</strong></p><label><input type="checkbox" data-verified> J’ai vérifié le virement de 2 000 DA réellement reçu et son expéditeur.</label><label>Motif / note<input data-reason maxlength="300"></label><button class="btn btn-primary" data-action="approve">Valider les trois mois</button><button class="btn btn-ghost" data-action="reject">Refuser</button><p role="status" data-message></p></section>`).join(''):'Aucun paiement en attente.';list.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',async()=>{const card=b.closest('[data-payment]'),msg=card.querySelector('[data-message]');const verified=card.querySelector('[data-verified]').checked;if(b.dataset.action==='approve'&&!verified){msg.textContent='Vérifie d’abord le virement reçu.';return;}card.querySelectorAll('button').forEach(x=>x.disabled=true);try{await api('payment-admin',{paymentId:card.dataset.payment,action:b.dataset.action,receivedVerified:verified,reason:card.querySelector('[data-reason]').value});await load();}catch(e){msg.textContent=e.message;card.querySelectorAll('button').forEach(x=>x.disabled=false);}}));}
  load().catch(e=>{list.textContent=e.message;});
 }
 LZ.billing={refresh,startLesson,offer,admin,get access(){return access;}};
})();
