// assets/js/calculateur.js

// ─────────────────────────────────────────────────────────────────────────────
// 1) INITIALISATION AU CHARGEMENT DU DOM
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  console.log('⚙️ calculateur.js chargé');

  // Mettre à jour la date dans le récap quand on change la date choisie
  const dateInput = document.getElementById('date-choisie');
  if (dateInput) {
    dateInput.addEventListener('change', e => {
      document.getElementById('date-recap').innerText = e.target.value;
    });
  }

  // Lier le bouton “Mettre à jour les prix”
  const btnCalc = document.getElementById('btn-calcul');
  console.log('btn-calcul trouvé :', btnCalc);
  if (btnCalc) {
    btnCalc.addEventListener('click', updatePrices);
  }

  // Lier le bouton “Générer PDF” (html2pdf)
  const btnPdf = document.getElementById('btn-pdf');
  console.log('btn-pdf trouvé :', btnPdf, 'html2pdf ?', typeof html2pdf);
  if (btnPdf && typeof html2pdf === 'function') {
    btnPdf.addEventListener('click', () => {
      document.body.classList.add('pdf-mode');
      const options = {
        margin:      0.5,
        filename:    'commande_CFL.pdf',
        html2canvas: { scale: 2 },
        jsPDF:       { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf()
        .set(options)
        .from(document.getElementById('pdf-summary'))
        .save()
        .finally(() => {
          document.body.classList.remove('pdf-mode');
        });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) FONCTION PRINCIPALE : mise à jour des prix & récap
// ─────────────────────────────────────────────────────────────────────────────
function updatePrices() {
  // ─── Étape 0 : Nom & Prénom ───────────────────────────────────────────────
  const nom     = document.getElementById('nom')?.value || '';
  const prenom  = document.getElementById('prenom')?.value || '';
  document.getElementById('nom-recap').innerText    = nom;
  document.getElementById('prenom-recap').innerText = prenom;

  // ─── Étape 1 : Mode & Date ────────────────────────────────────────────────
  const mode = document.getElementById('mode').value;
  document.getElementById('mode-recap').innerText =
    mode.charAt(0).toUpperCase() + mode.slice(1);
  document.getElementById('date-recap').innerText =
    document.getElementById('date-choisie').value;

  // ─── Étape 2 : Collecte des lignes du tableau ─────────────────────────────
  const rows = Array.from(
    document.querySelectorAll('#order-table tbody tr')
  );

// ─── Étape A : Calcul du poids total ───────────────────────────────────────
let totalWeight = 0;
rows.forEach(tr => {
  const inp = tr.querySelector('input.qty');
  if (!inp) return;

  const qty = parseInt(inp.value, 10) || 0;

  // 1) On nettoie le texte pour récupérer un nombre au format JS  
  let packText = tr.cells[2].textContent
    .trim()                 // retire espaces autour
    .replace(/\s*kg\s*$/i, '') // supprime "kg" à la fin (avec ou sans espace, insensible à la casse)
    .replace(',', '.');     // remplace la virgule par un point

  // 2) parseFloat lit bien 0.05, 4.5, etc.
  const pack = parseFloat(packText) || 0;

  // 3) calcul du poids pour cette ligne
  const w = qty * pack;

  tr.cells[4].textContent = w.toFixed(2).replace('.', ',') + ' kg';
  tr.dataset.weight       = w;
  totalWeight           += w;
});

  // ─── Étape B : Remise €/kg et frais de port ───────────────────────────────
  let discPerKg = 0;
  if (mode === 'retrait') {
    discPerKg = 1.20;
  } else {
    if      (totalWeight >= 100) discPerKg = 0.80;
    else if (totalWeight >=  60) discPerKg = 0.55;
    else if (totalWeight >=  30) discPerKg = 0.40;
    else                          discPerKg = 0;
  }
  let port = 0;
  if (mode === 'livraison') {
    port = totalWeight < 15 ? 6 : 0;
  }

  // ─── Étape C : Calcul des montants lignes & totaux ───────────────────────
  let sumSansRemise = 0;
  let sumWithRemise = 0;
  rows.forEach(tr => {
    const inp = tr.querySelector('input.qty');
    if (!inp) return;
    const w         = parseFloat(tr.dataset.weight) || 0;
    const prixAvant = parseFloat(
      tr.cells[1].textContent.replace('€','').replace(',','.')
    ) || 0;
    const prixApres = prixAvant - discPerKg;

    // Prix €/kg après remise
    tr.cells[5].textContent = prixApres
      .toFixed(2).replace('.', ',') + ' €/kg';

    // Montants ligne
    const sousSans = prixAvant * w;
    const sousAvec = prixApres * w;
    sumSansRemise += sousSans;
    sumWithRemise += sousAvec;

    tr.cells[6].textContent = sousAvec
      .toFixed(2).replace('.', ',') + ' €';
  });
  const totalNet = sumWithRemise + port;

  // ─── Étape D : Mise à jour des totaux sous le tableau principal ─────────
  document.getElementById('totalWeight').innerText =
    totalWeight.toFixed(2).replace('.', ',') + ' kg';
  document.getElementById('totalAmount').innerText =
    totalNet.toFixed(2).replace('.', ',') + ' €';

// ─── Étape E : remplir le récapitulatif PDF ──────────────────────────────
const tb = document.querySelector('#summary-table tbody');
tb.innerHTML = '';

// Génération des lignes de détail avec colonne “Prix €/kg après remise”
rows.forEach(tr => {
  const inp = tr.querySelector('input.qty');
  if (!inp || (+inp.value === 0)) return;

  const name     = tr.cells[0].textContent.trim();
  const qty      = +inp.value;
  const w        = parseFloat(tr.dataset.weight) || 0;

  // Sous-total sans remise
  const prixAvant = parseFloat(
    tr.cells[1].textContent.replace('€', '').replace(',', '.')
  ) || 0;
  const sousSans = prixAvant * w;

  // Prix €/kg après remise (colonne 5 de votre tableau principal)
  const prixApres = parseFloat(
    tr.cells[5].textContent
      .replace('€/kg', '')
      .replace('€', '')
      .replace(',', '.')
      .trim()
  ) || 0;
  const sousAvec = prixApres * w;

  const r = document.createElement('tr');
  r.innerHTML =
    `<td>${name}</td>` +
    `<td>${qty}</td>` +
    `<td>${w.toFixed(2).replace('.', ',')} kg</td>` +
    `<td>${prixApres.toFixed(2).replace('.', ',')} €/kg</td>` +
    `<td>${sousSans.toFixed(2).replace('.', ',')} €</td>` +
    `<td>${sousAvec.toFixed(2).replace('.', ',')} €</td>`;
  tb.appendChild(r);
});

// Mise à jour des totaux (une seule fois, hors de la boucle)
document.getElementById('sumWithRemise').innerText =
  sumWithRemise.toFixed(2).replace('.', ',') + ' €';
document.getElementById('sumRemise').innerText =
  (sumSansRemise - sumWithRemise).toFixed(2).replace('.', ',') + ' €';
document.getElementById('sumPort').innerText =
  port > 0
    ? port.toFixed(2).replace('.', ',') + ' €'
    : 'OFFERT';
document.getElementById('sumNet').innerText =
  totalNet.toFixed(2).replace('.', ',') + ' €';