/* Relevé : pose le thème choisi avant le premier rendu (script classique, synchrone, sans inline). */
(function () {
  try {
    var t = localStorage.getItem('releve.theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* stockage indisponible : thème automatique */ }
})();
