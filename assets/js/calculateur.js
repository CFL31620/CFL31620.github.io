// assets/js/calculateur.js

window.addEventListener('DOMContentLoaded', () => {
  console.log('⚙️ calculateur.js chargé');

  // 1) Mettre à jour la date du récap lorsqu’on change la date choisie
  const dateInput = document.getElementById('date-choisie');
  if (dateInput) {
    dateInput.addEventListener('change', e => {
      document.getElementById('date-recap').innerText = e.target.value;
    });
  }

  // 2) Lier le bouton Mettre à jour les prix à updatePrices()
  const btnCalc = document.getElementById('btn-calcul');
  console.log('btn-calcul trouvé :', btnCalc);
  if (btnCalc) {
    btnCalc.addEventListener('click', updatePrices);
  }
  // 3) Lier le bouton “Générer PDF”
  const btnPdf = document.getElementById('btn-pdf');
  console.log('btn-pdf trouvé :', btnPdf, 'html2pdf ?', typeof html2pdf);
  if (btnPdf && typeof html2pdf === 'function') {
    btnPdf.addEventListener('click', () => {
      // Ajout d'une classe sur le body pour masquer .actions
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
          // Retrait de la classe après export
          document.body.classList.remove('pdf-mode');
        });
    });
  }
});
function updatePrices() {
  // 1) Récupérer et afficher le mode (livraison / retrait)
  const mode      = document.getElementById('mode').value;
  const modeRecap = document.getElementById('mode-recap');
  if (modeRecap) {
    modeRecap.innerText = mode.charAt(0).toUpperCase() + mode.slice(1);
  }

  // 2) Récupérer toutes les lignes produits (ignore les lignes de titre)
  const rows = Array.from(
    document.querySelectorAll('#order-table tbody tr')
  );

  // ─── Étape A : calculer le poids total de la commande ─────────────────
  let totalWeight = 0;
  rows.forEach(tr => {
    const inp = tr.querySelector('input.qty');
    if (!inp) return;

    const qty  = parseInt(inp.value) || 0;
    const pack = parseFloat(tr.cells[2].textContent) || 0; // poids/poche
    const w    = qty * pack;

    tr.cells[4].textContent = w.toFixed(2).replace('.', ',') + ' kg';
    tr.dataset.weight       = w;
    totalWeight           += w;
  });

  // ─── Étape B : déterminer la remise €/kg et les frais de port ───────
  let discPerKg = 0;
  if (mode === 'retrait') {
    discPerKg = 1.20;
  } else {
    if      (totalWeight >= 100) discPerKg = 0.80;
    else if (totalWeight >=  60) discPerKg = 0.55;
    else if (totalWeight >=  30) discPerKg = 0.40;
    else                          discPerKg = 0;
  }

  // ─── Étape B modifiée : frais de port ───────────────────────────
  let port = 0;
  if (mode === 'livraison') {
    // 6 € pour toute livraison sous 15 kg, offert au-delà
    port = totalWeight < 15 ? 6 : 0;
  }

  // ─── Étape C : calculer les montants et remplir les colonnes ────────
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

    // Montant total (€)
    tr.cells[6].textContent = sousAvec
      .toFixed(2).replace('.', ',') + ' €';
  });

  const totalNet = sumWithRemise + port;

  // ─── Étape D : mettre à jour le pied du tableau principal ────────────
  document.getElementById('totalWeight').innerText = 
    totalWeight.toFixed(2).replace('.', ',') + ' kg';
  document.getElementById('totalAmount').innerText = 
    totalNet.toFixed(2).replace('.', ',') + ' €';

  // ─── Étape E : remplir le récapitulatif PDF ────────────────────────
function updatePrices() {
  // ─── NOUVELLE PARTIE : nom & prénom ──────────────────────────────
  const nom     = document.getElementById('nom').value;
  const prenom  = document.getElementById('prenom').value;
  document.getElementById('nom-recap').innerText    = nom;
  document.getElementById('prenom-recap').innerText = prenom;
  // ────────────────────────────────────────────────────────────────

 // ─── Étape E : remplir le récapitulatif PDF ────────────────────────
  const tb = document.querySelector('#summary-table tbody');
  tb.innerHTML = '';

  document.getElementById('mode-recap').innerText    =
    document.getElementById('mode').value;
  document.getElementById('date-recap').innerText    =
    document.getElementById('date-choisie').value;

  document.getElementById('sumWithRemise').innerText =
    sumWithRemise.toFixed(2).replace('.', ',') + ' €';
  document.getElementById('sumRemise').innerText    =
    (sumSansRemise - sumWithRemise).toFixed(2).replace('.', ',') + ' €';
  document.getElementById('sumPort').innerText      =
    port > 0
      ? port.toFixed(2).replace('.', ',') + ' €'
      : 'OFFERT';
  document.getElementById('sumNet').innerText       =
    totalNet.toFixed(2).replace('.', ',') + ' €';

  rows.forEach(tr => {
    const inp = tr.querySelector('input.qty');
    if (!inp || (+inp.value === 0)) return;

    const name     = tr.cells[0].textContent;
    const qty      = +inp.value;
    const w        = parseFloat(tr.dataset.weight) || 0;
    const sousSans = parseFloat(
      tr.cells[1].textContent.replace('€','').replace(',','.')
    ) * w;
    const sousAvec = parseFloat(
      tr.cells[6].textContent.replace('€','').replace(',','.')
    );

    const r = document.createElement('tr');
    r.innerHTML =
      `<td>${name}</td>` +
      `<td>${qty}</td>` +
      `<td>${w.toFixed(2).replace('.', ',')}</td>` +
      `<td>${sousSans.toFixed(2).replace('.', ',')} €</td>` +
      `<td>${sousAvec.toFixed(2).replace('.', ',')} €</td>`;
    tb.appendChild(r);
  });
}
