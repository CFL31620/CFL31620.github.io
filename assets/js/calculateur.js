// assets/js/calculateur.js

window.addEventListener('DOMContentLoaded', () => {
  console.log('⚙️ calculateur.js chargé');

  // 1) Date automatique
  const dateInput = document.getElementById('date-choisie');
  if (dateInput) {
    dateInput.addEventListener('change', e => {
      document.getElementById('date-recap').innerText = e.target.value;
    });
  }

  // 2) Bouton Mettre à jour les prix
  const btnCalc = document.getElementById('btn-calcul');
  if (btnCalc) btnCalc.addEventListener('click', updatePrices);

  // 3) Bouton Générer PDF commande
  const btnPdf = document.getElementById('btn-pdf');
  if (btnPdf && typeof html2pdf === 'function') {
    btnPdf.addEventListener('click', () => {
      document.body.classList.add('pdf-mode');
      html2pdf()
        .set({
          margin:      0.5,
          filename:    'commande_CFL.pdf',
          html2canvas: { scale: 2 },
          jsPDF:       { unit: 'in', format: 'a4', orientation: 'portrait' }
        })
        .from(document.getElementById('pdf-summary'))
        .save()
        .finally(() => document.body.classList.remove('pdf-mode'));
    });
  }
});

function updatePrices() {
  // 0) Nom/Prénom
  const nom    = document.getElementById('nom')?.value || '';
  const prenom = document.getElementById('prenom')?.value || '';
  document.getElementById('nom-recap').innerText    = nom;
  document.getElementById('prenom-recap').innerText = prenom;

  // 1) Mode & Date
  const mode = document.getElementById('mode').value;
  document.getElementById('mode-recap').innerText =
    mode.charAt(0).toUpperCase() + mode.slice(1);
  document.getElementById('date-recap').innerText =
    document.getElementById('date-choisie').value;

  // 2) Récupérer les lignes du tableau
  const rows = Array.from(document.querySelectorAll('#order-table tbody tr'));

  // A) Poids total
  let totalWeight = 0;
  rows.forEach(tr => {
    const inp = tr.querySelector('input.qty');
    if (!inp) return;
    const qty = parseInt(inp.value, 10) || 0;
    let packText = tr.cells[2].textContent
      .trim()
      .replace(/\s*kg\s*$/i, '')
      .replace(',', '.');
    const pack = parseFloat(packText) || 0;
    const w = qty * pack;
    tr.cells[4].textContent = w.toFixed(2).replace('.', ',') + ' kg';
    tr.dataset.weight       = w;
    totalWeight           += w;
  });

  // B) Remise €/kg & port
  let discPerKg = 0;
  if (mode === 'retrait') discPerKg = 1.20;
  else if (totalWeight >= 100) discPerKg = 0.80;
  else if (totalWeight >= 60)  discPerKg = 0.55;
  else if (totalWeight >= 30)  discPerKg = 0.40;
  let port = mode === 'livraison' && totalWeight < 15 ? 6 : 0;

  // C) Montants lignes & cumuls
  let sumSansRemise = 0, sumWithRemise = 0;
  rows.forEach(tr => {
    const inp = tr.querySelector('input.qty');
    if (!inp) return;
    const w         = parseFloat(tr.dataset.weight) || 0;
    const prixAvant = parseFloat(
      tr.cells[1].textContent.replace('€','').replace(',','.')
    ) || 0;
    const prixApres = prixAvant - discPerKg;
    tr.cells[5].textContent = prixApres
      .toFixed(2).replace('.', ',') + ' €/kg';
    const sousSans = prixAvant * w;
    const sousAvec = prixApres * w;
    sumSansRemise += sousSans;
    sumWithRemise += sousAvec;
    tr.cells[6].textContent = sousAvec
      .toFixed(2).replace('.', ',') + ' €';
  });
  const totalNet = sumWithRemise + port;

  // D) Totaux tableau principal
  document.getElementById('totalWeight').innerText =
    totalWeight.toFixed(2).replace('.', ',') + ' kg';
  document.getElementById('totalAmount').innerText =
    totalNet.toFixed(2).replace('.', ',') + ' €';

  // E) Récap PDF
  const tb = document.querySelector('#summary-table tbody');
  tb.innerHTML = '';
  rows.forEach(tr => {
    const inp = tr.querySelector('input.qty');
    if (!inp || +inp.value === 0) return;
    const name     = tr.cells[0].textContent.trim();
    const qty      = +inp.value;
    const w        = parseFloat(tr.dataset.weight) || 0;
    const prixAvant = parseFloat(
      tr.cells[1].textContent.replace('€','').replace(',','.')
    ) || 0;
    const sousSans = prixAvant * w;
    const prixApres = parseFloat(
      tr.cells[5].textContent.replace(/[^\d,.-]/g,'').replace(',','.')
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

  // Totaux récap PDF
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
}  // ← bien fermer updatePrices()
