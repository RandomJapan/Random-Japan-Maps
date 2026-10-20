// ================================================================
//  Les dessins d'Halloween (halloween.js), à l'encre et à l'aquarelle comme les légendes cachées : ils reprennent
//  leurs couleurs (classes « .lg … » de legendes.css) et ajoutent les leurs (halloween.css, préfixe hw-).
//  - DEFILE : les yōkai du Hyakki Yagyō, de profil, tournés vers la droite (64 × 64, pieds en y ≈ 60). Leurs jambes,
//    bras, queues et langues sont des groupes à part, que halloween.css fait marcher.
//  - YOKAI : les sept yōkai de la chasse, de face, posés comme les légendes (64 × 60, pied en y ≈ 56).
//  - CHAUVE_SOURIS (les vols qui remplacent les grues, oiseaux.js), CHAT (sur le cartouche), toileAraignee().
// ================================================================

// Une lanterne de papier (chōchin) : ses côtes, ses deux couvercles laqués
const cotes = (x0, x1, ys) => ys.map(([y, c]) => `M${x0 + c} ${y}Q32 ${y + 2.4} ${x1 - c} ${y}`).join('');

export const DEFILE = {
  // La lanterne-fantôme en tête du cortège : elle flotte, cligne de son œil unique et laisse pendre sa langue
  chochin: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-flotte">
    <path class="hw-anse" d="M27 7C27 2.6 37 2.6 37 7"/>
    <path class="hw-papier" d="M22.6 11C15 17 14.6 41 22.6 47.4H41.4C49.4 41 49 17 41.4 11Z"/>
    <ellipse class="hw-lueur" cx="32" cy="30" rx="10.6" ry="13.6"/>
    <path class="hw-cote" d="${cotes(16, 48, [[16, 2.6], [21.6, 1], [27.4, .4], [33.2, .4], [39, 1], [44.2, 2.6]])}"/>
    <path class="hw-bouche" d="M23 36.2 26.4 34.4 29.6 37.4 33 34 36.2 37 40.2 34.6Q33.4 41.6 23 36.2Z"/>
    <g class="hw-langue" style="transform-origin:32.4px 38.6px"><path class="hw-langue-c" d="M30.4 38.4C29.6 44 30.6 50 34.6 56.4 35.8 58.2 38.2 57.6 37.4 55.2 35.4 50 34.6 44 34.8 38.8Z"/></g>
    <g class="hw-oeil" style="transform-origin:33px 24.4px"><ellipse class="c-blanc" cx="33" cy="24.4" rx="7.2" ry="6"/><circle class="noir" cx="34.4" cy="25" r="3"/><circle class="hw-reflet" cx="35.4" cy="24" r=".9"/></g>
    <path class="hw-sourcil" d="M25.4 17.4Q32 14.8 39.6 17.8"/>
    <rect class="hw-laque" x="23" y="7" width="18" height="5.2" rx="1.6"/>
    <rect class="hw-laque" x="23" y="46.2" width="18" height="5" rx="1.6"/>
  </g></svg>`,

  // Un renard debout, en kimono, qui porte une lanterne au bout d'une perche (le « mariage du renard »)
  renard: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-corps">
    <g class="hw-queue" style="transform-origin:25px 41px"><path class="hw-renard" d="M25.6 39.4C19.6 39 13.6 35.4 10.6 29.2 9 25.8 10.4 23.4 13 24 15.4 30 19.6 34 26.4 35.6Z"/><path class="c-blanc" d="M13 24C10.4 23.4 9 25.8 10.6 29.2 11 27 11.8 25.2 13.6 24.6Z"/><path class="hw-poil" d="M14.4 28.4C17 31.8 20.4 34 24 35"/></g>
    <g class="hw-jambe ar" style="transform-origin:31px 45px"><path class="hw-renard-sombre" d="M29.6 44.4 27.6 56.6 24.6 58.6 25 59.8H30.2L31.6 57 33.2 44.8Z"/><path class="noir" d="M24.6 58.6 25 59.8H30.2L30.8 58.2C28.8 58 26.6 58 24.6 58.6Z"/></g>
    <g class="hw-jambe av" style="transform-origin:34px 45px"><path class="hw-renard" d="M32.6 44.8 33.8 56.6 32.6 58.6 33 59.8H38.6L38.8 58.4 37.2 56.4 36.4 44.4Z"/><path class="noir" d="M32.6 58.6 33 59.8H38.6L38.8 58.4C36.8 58 34.6 58 32.6 58.6Z"/></g>
    <g class="hw-bras ar" style="transform-origin:31px 27px"><path class="hw-manche-sombre" d="M30.6 25.8C28 28.6 26.6 32.4 26.6 36.4L29.8 37C29.8 33.6 30.8 30.6 32.6 28.4Z"/></g>
    <path class="c-indigo" d="M28.4 24C25.6 30 24.6 40 24 50.4 30 51.6 37 51.6 42.4 50.2 41.6 40 40.6 30 38.4 24 35 22.6 31.4 22.6 28.4 24Z"/>
    <path class="hw-motif" d="M27.6 30.4h.1M30.2 44.6h.1M36.6 41.4h.1M38.8 28.6h.1M33.4 34.2h.1M26.8 46.8h.1"/>
    <path class="c-or" d="M25.2 35.4C30 36.6 36 36.6 41.2 35.2L41.6 38.8C36 40.2 30 40.2 24.9 39Z"/>
    <path class="hw-col" d="M30 24 33.4 29 36.6 23.8"/>
    <path class="hw-renard" d="M28.6 17.4C28.6 12 32 8.6 36.4 8.8 39.6 9 41.4 11.4 42.6 13.6L49.6 17.6C50.2 18.2 49.8 19.2 49 19.4L42.8 21.4C40.4 23.4 36.8 23.8 33.6 23 30.4 22.2 28.6 20 28.6 17.4Z"/>
    <path class="c-blanc" d="M38.4 19.4C41 20 44 20.4 49.2 19.2 46 21.6 42 22.8 38.8 22Z"/>
    <path class="hw-renard" d="M31.4 11.6 30.8 3.4 36.4 9.2ZM35 9.6 37.2 2.4 39.8 10.4Z"/>
    <path class="noir" d="M32.2 9.6 32 5.4 34.8 8.4ZM36.4 8.6 37.4 5 38.6 9.4Z"/>
    <circle class="noir" cx="49.4" cy="18.2" r=".9"/>
    <path class="trait" d="M38 14 41.4 14.8"/><path class="hw-fard" d="M37.4 12.6 40.8 13.2"/>
    <g class="hw-bras av" style="transform-origin:35px 27px">
      <path class="c-indigo" d="M35.4 25.6C38.6 27 42 29.6 44.4 33.4L41.6 35.8C39.4 33 36.6 30.8 33.6 29.6Z"/>
      <circle class="hw-renard" cx="43.6" cy="34.4" r="1.9"/>
      <path class="hw-perche" d="M43 36.6 51.8 10.6"/>
      <g class="hw-balance" style="transform-origin:51.8px 10.6px"><path class="trait" d="M51.8 10.6V13.2"/>
        <path class="hw-papier" d="M49 14.2C47 16 47 21.6 49 23.4H54.6C56.6 21.6 56.6 16 54.6 14.2Z"/><ellipse class="hw-lueur" cx="51.8" cy="18.8" rx="2.6" ry="3.4"/>
        <path class="hw-laque" d="M49.4 12.8H54.2V14.4H49.4ZM49.4 23.2H54.2V24.6H49.4Z"/></g>
    </g>
  </g></svg>`,

  // L'ombrelle-fantôme : une vieille ombrelle de papier huilé, un œil, une langue, une jambe dans un geta
  kasa: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-saute" style="transform-origin:32px 60px">
    <path class="hw-pointe" d="M32 0V4"/>
    <path class="hw-ombrelle" d="M32 3.4 46.6 37.4Q32 42 17.4 37.4Z"/>
    <path class="hw-baleine" d="M32 4.4 22 38.4M32 4.4 27 39.6M32 4.4 37 39.6M32 4.4 42 38.4"/>
    <path class="hw-bande" d="M20.2 32.4Q32 35.6 43.8 32.4"/>
    <g class="hw-oeil" style="transform-origin:32px 20px"><ellipse class="c-blanc" cx="32" cy="20" rx="5.4" ry="4.6"/><circle class="noir" cx="32.9" cy="20.6" r="2.2"/><circle class="hw-reflet" cx="33.6" cy="19.8" r=".6"/></g>
    <g class="hw-langue" style="transform-origin:32px 27.4px"><path class="hw-langue-c" d="M30.4 27.2C29.8 31.6 30.8 35.2 33.2 37.8 34.4 38.8 35.6 37.8 34.8 36.4 33.4 34 33 30.6 33.6 27.2Z"/></g>
    <path class="hw-manche" d="M32 39.6V54.4"/>
    <path class="c-peau" d="M28.6 54.8C29.4 53 31.6 52.6 33.2 53.4 35 53.8 36.8 54.2 37.4 55.4H28.2Z"/>
    <path class="hw-geta" d="M25.6 55.4H39.4V57.4H25.6Z"/><path class="hw-dent" d="M28 57.4V60.2M37 57.4V60.2"/>
  </g></svg>`,

  // Le tanuki qui marche, son chapeau de paille et sa bouteille de saké ; il se tape le ventre comme un tambour
  tanuki: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-corps">
    <g class="hw-queue" style="transform-origin:23px 46px"><path class="tn-queue" d="M23.4 43.6C17 44 12.2 47.6 11.4 52.8 15.2 54.6 20.2 53.4 23.4 49.4Z"/><path class="tn-rayure" d="M16.6 46.4 18.2 51.8M13.6 49.2 15.4 53.4"/></g>
    <g class="hw-jambe ar" style="transform-origin:30px 49px"><path class="tn-pied" d="M27.4 49 26 57.6 24.2 59.8H30L31 57.2 32.2 49.4Z"/></g>
    <g class="hw-jambe av" style="transform-origin:37px 49px"><path class="tn-pied" d="M35.2 49.4 35.6 57.6 34.8 59.8H40.6L40.4 57 40.2 49Z"/></g>
    <g class="hw-tambour" style="transform-origin:28px 32px"><path class="tn-pelage" d="M28.4 31.6C25.8 34.4 25.4 38 27 41.2L29.6 40.2C28.8 37.8 29.2 35.4 30.6 33.6Z"/></g>
    <g class="hw-ventre" style="transform-origin:34px 52px">
      <path class="tn-pelage" d="M23 41C22 32.4 27.6 26.4 34 26.4 41 26.4 46 32.6 45.2 41.4 44.6 48.4 40 52.4 33.6 52.4 27.6 52.4 23.6 48 23 41Z"/>
      <path class="tn-ventre" d="M35.6 31C41.2 32.4 44 37 43.6 42.4 43.2 47.4 40 50.6 36 50.8 37.6 44.6 37.6 37.4 35.6 31Z"/>
    </g>
    <path class="tn-pelage" d="M29 19.4C29 14.4 32.4 11.4 36.6 11.6 40.4 11.8 42.4 14 43.4 16.4L48.4 18.6C49.2 19 49 20.2 48.2 20.6L43.4 22.4C41.6 25.2 38.6 26.4 35.4 26 31.8 25.6 29 23.2 29 19.4Z"/>
    <path class="tn-ventre" d="M41.4 19.8C44 20.4 46 20.4 48.6 19.8 46.6 22 43.6 22.8 41.4 22.2Z"/>
    <circle class="noir" cx="48.6" cy="19.2" r=".9"/>
    <path class="tn-masque" d="M35.4 16.6C37.6 15.2 40.4 15.8 41.4 17.8 40 19.6 37.2 19.8 35.6 18.4Z"/><circle class="c-blanc" cx="38.8" cy="17.4" r=".55"/>
    <path class="tn-pelage" d="M32.2 13.2C31.4 10.6 32.6 8.8 34.6 9.4 35.4 10.6 35 12.2 33.8 13.4Z"/>
    <path class="c-paille" d="M26.2 13.6C30 8.8 34 5 38.2 4.4 42.2 7.4 45.6 10.6 47.6 13.6 40.6 15.2 33 15.2 26.2 13.6Z"/>
    <path class="hw-paille" d="M38.2 4.8 33.4 14.4M38.2 4.8 41 14.8M38.2 4.8 29.6 13.8M38.2 4.8 44.6 13.8"/>
    <g class="hw-bras av" style="transform-origin:38px 31px">
      <path class="tn-pelage" d="M37.8 30.4C41.6 32.4 44.6 35.6 46.4 39.4L43.6 41.2C42 38.4 39.6 35.8 36.6 34Z"/>
      <path class="hw-tokkuri" d="M45.6 40.6C44.2 42 43.6 44.4 44.4 47.6 45.4 50.2 48.6 50.6 50.2 48.4 51.2 45.6 50.4 42.6 48.4 40.8 48.6 39.4 48.4 38.6 47.6 38.6 46.6 38.6 46 39.4 45.6 40.6Z"/>
      <path class="c-indigo" d="M45 43.8C46.4 43.4 48 43.4 49.8 43.8L50 46.4C48.4 46.8 46.6 46.8 45 46.4Z"/>
    </g>
  </g></svg>`,

  // Le kappa : carapace sur le dos, assiette d'eau sur la tête, un concombre à la main en guise de sabre
  kappa: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-corps">
    <g class="hw-jambe ar" style="transform-origin:30px 47px"><path class="c-vert" d="M28.4 46.6 27 56.6 23.4 58.6 24.6 59.8H30.4L31.4 57 32.6 46.8Z"/></g>
    <g class="hw-jambe av" style="transform-origin:36px 47px"><path class="c-vert" d="M34 46.8 35.2 56.6 33.8 59.8H40.6L40.8 58.4 38.6 56.6 38.4 46.6Z"/></g>
    <path class="c-bois" d="M20.4 30C16.8 34.4 16.6 42.6 20.4 47.4 23 49 26.4 48.2 27.4 45 28.4 39.6 28 33.6 25.6 29.6 23.8 28.4 21.6 28.6 20.4 30Z"/>
    <path class="hw-ecaille" d="M18.8 36.6 27.4 37.4M18.6 41.8 27.6 42.4M22.6 29.4 22.6 47.8"/>
    <path class="c-vert" d="M26 30.6C24.6 36.6 25.4 43.6 27.6 48.6 31 50 35.6 50 39 48.4 40.4 43 40.2 36.6 38.4 30.6 34.4 28.6 29.6 28.6 26 30.6Z"/>
    <path class="hw-plastron" d="M34.4 31.4C37.6 34.4 38.8 40.2 37.6 46.6 36.4 47.8 35.2 48 34.2 47.6 35.2 42.2 35.4 36.2 34.4 31.4Z"/>
    <path class="c-vert" d="M27.6 21.4C27.6 16 31.4 12.6 35.8 12.8 40 13 42.6 15.8 43.2 19L49.4 20.6C50.4 21 50.4 22.2 49.6 22.6L43 24.4C41.2 27.4 38 29.2 34.6 29 30.4 28.8 27.6 25.6 27.6 21.4Z"/>
    <path class="c-or" d="M42.6 19.2 50 20.8C50.6 21.2 50.4 22.2 49.6 22.4L42.8 24Z"/>
    <ellipse class="c-blanc" cx="38" cy="19.4" rx="1.9" ry="1.6"/><circle class="noir" cx="38.6" cy="19.6" r=".9"/>
    <path class="noir" d="M27.4 20.4C27.2 17 28.6 14.6 30.6 13.4L30 16.2 32.2 14.2 32 16.8 34.4 15 34.2 17.4 36.6 15.8 36.4 17.8 38.8 16.6 38.4 18.2C35.6 17.6 31 17.8 27.4 20.4Z"/>
    <ellipse class="c-blanc" cx="33.6" cy="12.6" rx="5" ry="1.7"/><path class="eau" d="M30.6 12.6Q33.6 13.4 36.6 12.6"/>
    <g class="hw-bras av" style="transform-origin:37px 32px">
      <path class="c-vert" d="M36.8 31.6C40.4 33.2 43.4 36 45 39.2L42.6 41C41 38.6 38.6 36.4 35.8 35Z"/>
      <path class="hw-concombre" d="M41.6 41.4C44.6 37.2 48.6 33.4 52.8 31.2 54.2 30.6 55 31.6 54.2 32.8 51.2 36.8 47.4 40.6 43.4 43.4 42.2 44 41.2 42.6 41.6 41.4Z"/>
      <path class="hw-graines" d="M45.2 39.2h.1M48 36.4h.1M50.8 34h.1"/>
    </g>
  </g></svg>`,

  // L'oni : peau rouge, cornes, pagne en peau de tigre, la massue de fer (kanabō) sur l'épaule
  oni: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-corps">
    <g class="hw-jambe ar" style="transform-origin:31px 42px"><path class="hw-oni" d="M28.6 41 26 52.4 22.4 58.2 24 59.8H29.6L29.8 57.6 32.2 52 33.8 41.4Z"/></g>
    <g class="hw-jambe av" style="transform-origin:37px 42px"><path class="hw-oni" d="M34.6 41.6 37.2 52 36.2 58.2 37.6 59.8H43.6L42.8 58 40.6 51.6 40 41.2Z"/></g>
    <g class="hw-bras ar" style="transform-origin:29px 26px">
      <path class="hw-kanabo" d="M31.6 21.4 12 7.6 9.4 11.2 29 25.4Z"/>
      <path class="hw-clous" d="M14.6 10.6h.1M18.4 13.2h.1M22.2 15.8h.1M26 18.6h.1M16.6 8.6h.1M20.4 11.4h.1M24.2 14.2h.1"/>
      <path class="hw-oni" d="M27.6 26.6C25.6 23.4 26.2 20.2 28.4 18.2L31 19.6C29.8 21.4 30 23.6 31.6 25.6Z"/>
      <circle class="hw-oni" cx="29.8" cy="19.4" r="2.2"/>
    </g>
    <path class="hw-oni" d="M25.6 26C24 30.6 24.4 36.6 26.4 42 30.4 43.6 36.2 43.6 40.6 41.8 42.4 36 42 30 40 25.6 35.6 23 30 23.2 25.6 26Z"/>
    <path class="hw-muscle" d="M33 28.4C35 29.4 37.6 29.4 39.4 28.2M31.6 33.8C33.6 34.6 36.4 34.4 38.2 33.4"/>
    <path class="hw-tigre" d="M25.4 38.6C30 40.4 36 40.4 41.2 38.4L42 45C38.6 47.6 30 47.8 25.2 45.6Z"/>
    <path class="hw-rayures" d="M28 40.2 29.4 46.6M32.4 40.8 33.2 47M36.8 40.4 37 46.8M40.4 39.4 40.2 45.6"/>
    <path class="hw-criniere" d="M28.6 14.4C25.6 13.2 23.4 15.2 22.6 18.4 22 21.4 23.4 24.4 25.8 25.6 25.2 22.6 26.6 20 29 19.4ZM29.4 10.8C27 8.6 27.2 5.6 30 4.6 30.8 7.2 31.8 8.8 33 9.2Z"/>
    <path class="hw-oni" d="M28.4 15C28.4 9.6 32 6.4 36.6 6.6 41.4 6.8 44.4 10.6 44.6 15 44.8 17.6 46.6 18.6 46.2 20.6 45.6 22.6 43.2 23.4 40 23.6 35.8 24.6 30.6 23 29 19.6 28.6 18.2 28.4 16.6 28.4 15Z"/>
    <path class="hw-corne" d="M33.4 7.6C33.2 4.2 34.2 1.6 36.2 .4 36 3 36.4 5.4 37.4 7.4ZM39.6 8.4C40.4 5.4 42.2 3.4 44.4 2.8 43.4 5 43 7.4 43.4 9.6Z"/>
    <ellipse class="c-or" cx="41.8" cy="13.8" rx="1.7" ry="1.2"/><circle class="noir" cx="42.3" cy="13.9" r=".6"/>
    <path class="hw-sourcil-epais" d="M38.8 11.2 44.6 12.4"/>
    <path class="trait" d="M40.6 20C42.6 20.8 44.4 20.8 45.8 19.8"/>
    <path class="c-blanc" d="M43 20.4 43.8 17.8 44.6 20.4Z"/>
    <g class="hw-bras av" style="transform-origin:38px 28px"><path class="hw-oni" d="M38.6 27C41.6 29.6 43.4 33.4 43.8 37.2L41 38C40.4 34.8 38.8 31.8 36.4 29.8Z"/><circle class="hw-oni" cx="42.6" cy="38.2" r="2.2"/></g>
  </g></svg>`,

  // Le tengu : visage rouge au long nez, habit de moine des montagnes, éventail de plumes, ailes repliées, geta à une dent
  tengu: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-corps">
    <g class="hw-aile-dos" style="transform-origin:28px 26px"><path class="hw-plumes" d="M28.4 25C21.4 21 13.4 21.2 8.2 25.4 12.6 26 15.2 28 16 30.8 19 29 22 29.8 23.6 32.2 25 30 26.4 28.8 28.6 28.4Z"/><path class="hw-plume-trait" d="M10.8 25.4C15 24.2 20.2 24.6 25 26.4M16 30.8C18.6 28.6 22.2 27.6 26 28"/></g>
    <g class="hw-jambe ar" style="transform-origin:31px 42px"><path class="c-indigo" d="M28.6 40.4 26.2 54.4 31.2 54.8 33 41Z"/><path class="hw-geta" d="M24.6 55H32.4V56.8H24.6Z"/><path class="hw-dent" d="M28.4 56.8V60"/></g>
    <g class="hw-jambe av" style="transform-origin:36px 42px"><path class="c-indigo" d="M33.6 41 36.4 54.6 41.4 54 38.6 40.2Z"/><path class="hw-geta" d="M34.8 55H42.6V56.8H34.8Z"/><path class="hw-dent" d="M38.6 56.8V60"/></g>
    <path class="c-blanc" d="M27 26.4C25.6 31 26 36.6 27.6 41.6 31.2 42.8 35.8 42.6 39.2 41 40.4 36 40.2 30.6 38.6 26.4 35 24.6 30.6 24.6 27 26.4Z"/>
    <circle class="hw-bonbori" cx="34" cy="29.6" r="1.3"/><circle class="hw-bonbori" cx="35" cy="33" r="1.3"/><circle class="hw-bonbori" cx="36.2" cy="36.4" r="1.3"/>
    <path class="c-blanc" d="M30.4 20.4C30.8 24.6 33.4 27.4 37.4 27.6 38.6 26.2 38.8 24.6 38.2 23.6Z"/>
    <path class="c-blanc" d="M29.8 16C27.6 17 26.8 20.4 27.6 23.4 28.6 22.2 29.4 21.2 30.4 20.8Z"/>
    <path class="c-rouge" d="M29.4 17.6C29.4 12.8 32.6 9.8 36.6 10 40.4 10.2 42.6 13 43 16.2L53.2 15.6C54.2 15.6 54.4 16.8 53.6 17.2L43.2 19.4C42 22.6 39.4 24.4 36 24.4 32.2 24.4 29.4 21.6 29.4 17.6Z"/>
    <path class="hw-sourcil-epais" d="M36.4 13.8 41.6 13.2"/><path class="trait" d="M38 15.6 41 15.2"/>
    <path class="noir" d="M34.2 9.6 36.6 6.6 39.2 10Z"/>
    <g class="hw-bras av" style="transform-origin:37px 29px">
      <path class="c-blanc" d="M37 28.2C40.6 30 43.2 33 44.4 36.4L41.6 37.6C40.4 34.8 38.4 32.6 35.8 31.4Z"/>
      <path class="hw-manche-eventail" d="M44.6 37.4 47.4 25.6"/>
      <path class="hw-eventail" d="M47.4 25.6C44.6 22 44.8 16.6 48.8 14.6 52.6 16.4 53 21.8 50.2 25.4Z"/>
      <path class="hw-nervure" d="M48.8 15.4 48.6 25M48.8 19 46.6 17.6M48.8 19 51 17.6M48.7 22.2 46.4 21M48.7 22.2 51.2 21"/>
    </g>
  </g></svg>`,

  // La rokurokubi : une femme en kimono dont le cou s'allonge et ondule au-dessus du cortège
  rokurokubi: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-corps">
    <g class="hw-pied ar"><path class="c-blanc" d="M29.6 56.4H35V58.6H29.6Z"/><path class="c-bois" d="M29 58.6H35.6V59.8H29Z"/></g>
    <g class="hw-pied av"><path class="c-blanc" d="M36 56.4H41.4V58.6H36Z"/><path class="c-bois" d="M35.4 58.6H42V59.8H35.4Z"/></g>
    <path class="hw-kimono" d="M30.6 32C28.8 38 28 46 27.6 57.2 32 58.4 38.6 58.4 42.6 57 42 46 41 38 39.4 32 36.6 30.6 33.4 30.6 30.6 32Z"/>
    <path class="hw-fleurs" d="M31 49.4h.1M34.6 53.4h.1M38.8 50.6h.1M32.4 36.2h.1M37.6 47.6h.1"/>
    <path class="c-or" d="M28.8 40.4C32.6 41.4 37.6 41.4 41.2 40.2L41.6 44C37.6 45.2 32.4 45.2 28.4 44.2Z"/>
    <path class="hw-col" d="M32.4 31.6 35 35.6 37.6 31.4"/>
    <g class="hw-cou" style="transform-origin:35px 32px">
      <path class="hw-cou-encre" d="M35 31.6C35.6 26 31.4 22.6 31.8 17.4 32.2 12.6 37.6 11.2 39.4 8.4"/>
      <path class="hw-cou-peau" d="M35 31.6C35.6 26 31.4 22.6 31.8 17.4 32.2 12.6 37.6 11.2 39.4 8.4"/>
      <path class="c-peau" d="M36.4 7.6C36.4 4 38.6 1.8 41.2 1.8 43.8 1.8 45.4 4 45.2 7 45 10 43 11.8 40.6 11.8 38.2 11.8 36.4 10.4 36.4 7.6Z"/>
      <path class="noir" d="M36.2 6.8C35.4 3.4 37.4 0 41 -.4 44.6 -.6 46.4 2 46 5 44.4 3 41.6 2.6 39.4 3.6 38.2 4.6 37.4 5.8 36.2 6.8ZM37.6 .4C37 -2.2 39 -3.8 41.2 -3.2 42.8 -2.6 43 -.8 42 .4Z"/>
      <path class="c-rouge" d="M42.6 -1.6 46 -3.4"/>
      <path class="trait" d="M41.6 6.2 43.6 5.8"/><circle class="c-rouge" cx="43.6" cy="9" r=".65"/>
    </g>
    <g class="hw-bras av" style="transform-origin:37px 34px"><path class="hw-kimono-sombre" d="M37 34C40.4 36.4 42.4 40 42.8 44.4 41 45.4 39 45.2 37.6 44 37.2 40.6 36.4 37.4 35.2 35.4Z"/></g>
  </g></svg>`,

  // Une sandale de paille (bake-zōri) devenue yōkai à force d'être vieille : un œil, deux petites jambes
  zori: `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="hw-saute" style="transform-origin:32px 60px">
    <path class="trait" d="M28.4 46.6 27.4 56.8 24.8 58.2M35.6 46.6 36.6 56.8 39.4 58.2"/>
    <path class="c-paille" d="M23.4 30C23.4 20 27 14 32 14 37 14 40.6 20 40.6 30 40.6 41 37.4 48 32 48 26.6 48 23.4 41 23.4 30Z"/>
    <path class="hw-paille" d="M25.6 21Q32 23 38.4 21M24 27.4Q32 29.4 40 27.4M23.8 34Q32 36 40.2 34M24.6 40.6Q32 42.6 39.4 40.6"/>
    <path class="hw-hanao" d="M32 34.4 25.6 20.4M32 34.4 38.4 20.4"/>
    <g class="hw-oeil" style="transform-origin:32px 27px"><ellipse class="c-blanc" cx="32" cy="27" rx="3.6" ry="3.2"/><circle class="noir" cx="32.6" cy="27.4" r="1.6"/></g>
    <path class="hw-langue-c" d="M30.6 37.4C30.4 40.6 31 42.6 32.6 43.8 33.6 44.2 34.2 43.4 33.8 42.6 33 41 32.8 39.4 33.2 37.4Z"/>
  </g></svg>`,
};

export const YOKAI = {
  // Osorezan : une âme errante (yūrei), kimono blanc, bandeau triangulaire, sans pieds ; les moulins à vent du temple
  yurei: `<svg viewBox="0 0 64 60" aria-hidden="true">
    <path class="sol" d="M6 57.6H58"/>
    <path class="pierre" d="M38.4 57.6C39 54.4 41.4 52.6 44.2 53 46.4 53.2 48 55 48.4 57.6Z"/><path class="pierre" d="M8.6 57.6C9 55.4 10.8 54.2 12.6 54.6 14.2 55 15 56.2 15.2 57.6Z"/>
    <path class="hw-tige" d="M51 57.6 51.6 40.6M13.4 57.6 13 46.4"/>
    <g class="hw-moulin" style="transform-origin:51.6px 40.4px"><path class="hw-aile-rouge" d="M51.6 40.4V35.2L55.4 38.2Z"/><path class="hw-aile-jaune" d="M51.6 40.4H56.8L53.8 44.2Z"/><path class="hw-aile-bleue" d="M51.6 40.4V45.6L47.8 42.6Z"/><path class="hw-aile-verte" d="M51.6 40.4H46.4L49.4 36.6Z"/></g>
    <g class="hw-moulin lent" style="transform-origin:13px 46.2px"><path class="hw-aile-jaune" d="M13 46.2V42.2L15.9 44.5Z"/><path class="hw-aile-rouge" d="M13 46.2H17L14.7 49.1Z"/><path class="hw-aile-verte" d="M13 46.2V50.2L10.1 47.9Z"/><path class="hw-aile-bleue" d="M13 46.2H9L11.3 43.3Z"/></g>
    <g class="hw-fantome">
      <path class="noir" d="M26.4 14.8C24.6 20 24.2 28 25.6 36 26.6 31.6 27.4 26 29 22ZM37.6 14.8C39.4 20 39.8 28 38.4 36 37.4 31.6 36.6 26 35 22Z"/>
      <path class="hw-shiro" d="M26 22.4C24.4 28 23.4 36 23.8 44 24.6 47.6 23 50 20.6 52.6 24.6 52 26.8 50.4 28.2 48.6 29 51.6 31.4 53.6 33.8 54.6 33.2 51.6 34 49.4 35.6 48 37.4 50.4 40.2 51.4 43.4 51.2 40.8 49 39.8 46 40.2 43 40.8 35.4 39.8 28 38 22.4 34.6 20.6 29.4 20.6 26 22.4Z"/>
      <path class="hw-pli-fantome" d="M32.4 26.4 33.2 32 30 47.2M36.6 36 37.4 46"/>
      <path class="hw-col-fantome" d="M29.2 21.8 32.4 27.6 35.6 21.6"/>
      <path class="hw-shiro" d="M27 25.6C24.8 27.6 23.8 30.2 24.2 32.8L28.6 31.4ZM37 25.6C39.2 27.6 40.2 30.2 39.8 32.8L35.4 31.4Z"/>
      <path class="hw-peau-fantome" d="M24.4 32.4C24.4 34.8 25.4 36.8 26.6 37.2 27 35.6 27.6 34 28.4 32.8ZM39.6 32.4C39.6 34.8 38.6 36.8 37.4 37.2 37 35.6 36.4 34 35.6 32.8Z"/>
      <path class="hw-peau-fantome" d="M28.6 15.6C28.6 12.2 30.2 10.2 32 10.2 33.8 10.2 35.4 12.2 35.4 15.6 35.4 18.8 33.8 20.8 32 20.8 30.2 20.8 28.6 18.8 28.6 15.6Z"/>
      <path class="noir" d="M28.2 14.4C28.2 10.6 29.8 8.4 32 8.4 34.2 8.4 35.8 10.6 35.8 14.4 34.6 12.4 33.4 11.6 32 11.6 30.6 11.6 29.4 12.4 28.2 14.4Z"/>
      <path class="hw-meche" d="M29.4 13.6C29 16.8 29.2 19.6 30 22.2M34.6 13.6C35 16.8 34.8 19.6 34 22.2"/>
      <path class="hw-triangle" d="M30.2 11.6 32 8.6 33.8 11.6Z"/>
      <path class="trait" d="M30.2 15.8 31.2 16.2M32.8 16.2 33.8 15.8"/><path class="trait-doux" d="M31.4 18.6Q32 18.9 32.6 18.6"/>
    </g>
    <path class="hw-feu-ame" d="M46 24.6C43.6 24.6 42.8 22.6 43.4 21 44 19.4 45 18.4 45.2 16 46 18 47.8 19.6 48 21.8 48.2 23.6 47.4 24.6 46 24.6Z"/>
  </svg>`,

  // Himeji : Okiku sort du puits où on l'a jetée, une assiette à la main ; à côté, la pile de neuf assiettes
  okiku: `<svg viewBox="0 0 64 60" aria-hidden="true">
    <path class="sol" d="M6 57.6H58"/>
    <path class="hw-trou-puits" d="M18 42.4C18 41.2 24 40.6 32 40.6 40 40.6 46 41.2 46 42.4 46 43.6 40 44.2 32 44.2 24 44.2 18 43.6 18 42.4Z"/>
    <g class="hw-sort">
      <path class="noir" d="M26.6 18.8C24.8 24 24.4 32 25.4 42 26.6 36 27.4 30 29 26ZM37.4 18.8C39.2 24 39.6 32 38.6 42 37.4 36 36.6 30 35 26Z"/>
      <path class="hw-shiro" d="M26.4 26C25 30 24.6 36 24.8 43.4H39.2C39.4 36 39 30 37.6 26 34.6 24.4 29.4 24.4 26.4 26Z"/>
      <path class="hw-col-fantome" d="M29.4 25.4 32.4 30.6 35.4 25.2"/>
      <path class="hw-peau-fantome" d="M28.6 19.4C28.6 16 30.2 14 32 14 33.8 14 35.4 16 35.4 19.4 35.4 22.6 33.8 24.6 32 24.6 30.2 24.6 28.6 22.6 28.6 19.4Z"/>
      <path class="noir" d="M28.2 18.2C28.2 14.4 29.8 12.2 32 12.2 34.2 12.2 35.8 14.4 35.8 18.2 34.6 16.2 33.4 15.4 32 15.4 30.6 15.4 29.4 16.2 28.2 18.2Z"/>
      <path class="hw-triangle" d="M30.2 15.4 32 12.4 33.8 15.4Z"/>
      <path class="trait" d="M30.2 19.6 31.2 20M32.8 20 33.8 19.6"/><path class="hw-larme-trait" d="M30.6 20.6 30.4 22.4"/>
      <path class="hw-peau-fantome" d="M26.2 34.6C28 33.4 30.4 33.2 32 33.6 33.6 33.2 36 33.4 37.8 34.6L37.4 36.4H26.6Z"/>
      <ellipse class="hw-assiette" cx="32" cy="32.8" rx="6.2" ry="2.1"/><ellipse class="hw-assiette-bord" cx="32" cy="32.8" rx="3.6" ry="1.1"/>
    </g>
    <path class="pierre" d="M16 57.6V43.4C20 45 26 45.6 32 45.6 38 45.6 44 45 48 43.4V57.6Z"/>
    <path class="trait-doux" d="M16 50.6C22 52 42 52 48 50.6M22 45.2V50.8M30 45.6V51.6M38 45.4V51.4M45 44.4V50.4M19 51.4V57.6M27 52.2V57.6M35 52.2V57.6M42 51.6V57.6"/>
    <path class="pierre" d="M14.6 42.6C14.6 44.4 23 45.2 32 45.2 41 45.2 49.4 44.4 49.4 42.6 49.4 41.8 47.6 41.2 46 40.8 46 41.4 40 42 32 42 24 42 18 41.4 18 40.8 16.4 41.2 14.6 41.8 14.6 42.6Z"/>
    <g class="hw-pile">
      <ellipse class="hw-assiette" cx="45.4" cy="40.4" rx="4.6" ry="1.4"/><ellipse class="hw-assiette" cx="45.4" cy="39.2" rx="4.6" ry="1.4"/>
      <ellipse class="hw-assiette" cx="45.4" cy="38" rx="4.6" ry="1.4"/><ellipse class="hw-assiette" cx="45.4" cy="36.8" rx="4.6" ry="1.4"/>
      <ellipse class="hw-assiette-bord" cx="45.4" cy="36.8" rx="2.6" ry=".7"/>
    </g>
    <path class="c-bois" d="M15.8 37.4H22.6L21.8 41.4H16.6Z"/><path class="trait" d="M16.4 38.8H22.2"/>
  </svg>`,

  // Yotsuya : la lanterne déchirée d'où sort le visage d'Oiwa (comme dans l'estampe de Hokusai)
  oiwa: `<svg viewBox="0 0 64 60" aria-hidden="true">
    <path class="sol" d="M10 57.6H54"/>
    <path class="hw-tige" d="M32 57.6V48.6"/>
    <g class="hw-balance-lente" style="transform-origin:32px 2px">
      <path class="trait" d="M32 1.6V6"/>
      <path class="hw-papier-vieux" d="M22 9C15.2 15 14.8 39 22 45.6H42C49.2 39 48.8 15 42 9Z"/>
      <path class="hw-cote" d="${cotes(16, 48, [[14.6, 2.4], [40.6, 1.2]])}"/>
      <path class="hw-trou" d="M19.6 19.4C23 17 26 18.6 28.6 16.8 31.6 19 34.6 17 37.6 19.2 40.6 18.2 43 20 44.8 22.4 44.4 30 43.6 36 41 40.6 37 39.2 34 41.6 30.8 39.6 27.6 41.6 24.4 39.4 21.6 40.2 19.6 34 19 26 19.6 19.4Z"/>
      <path class="hw-peau-fantome" d="M24.8 28.4C24.8 23.6 28 20.8 32 20.8 36 20.8 39.2 23.6 39.2 28.4 39.2 33.6 36 37.6 32 37.6 28 37.6 24.8 33.6 24.8 28.4Z"/>
      <path class="hw-blessure" d="M25.8 27.6C26.6 25 29.6 24.4 31 26.8 30.6 30.2 28.6 31.8 26.8 30.8 26 30 25.6 28.8 25.8 27.6Z"/>
      <path class="trait" d="M26.8 28.6C27.8 29.6 29.4 29.6 30.2 28.4M33.8 26.8C35 26 36.4 26 37.4 26.8"/><circle class="noir" cx="35.6" cy="27.4" r=".7"/><circle class="noir" cx="28.4" cy="29.4" r=".6"/>
      <path class="trait" d="M30 33.8C31.4 34.8 33.2 34.8 34.4 33.6"/>
      <path class="hw-cheveux" d="M26 21.6C24 25 23.2 30 23.8 36 21.6 40 21 44 22.4 48.8M38 21.6C40 25 41 30 40.4 35.6M30.4 21C28.6 23.6 27.6 26 27.4 28.8"/>
      <rect class="hw-laque" x="23" y="5.6" width="18" height="4.4" rx="1.4"/><rect class="hw-laque" x="23" y="44.6" width="18" height="4" rx="1.4"/>
      <path class="hw-cheveux" d="M27 48.6C26.6 51.4 27.4 53.4 26.6 56M30.4 48.6C30.6 51.6 29.8 53.6 30.6 56.4M35 48.6C35.4 51.6 34.6 53.4 35.4 55.4"/>
    </g>
  </svg>`,

  // Rokudō Chinnō-ji : Enma, le roi des enfers, juge des morts, sa couronne au caractère 王 et sa tablette
  enma: `<svg viewBox="0 0 64 60" aria-hidden="true">
    <path class="sol" d="M8 57.6H56"/>
    <path class="hw-robe-enma" d="M14 57.6C14.4 46 17.6 37.6 24 33.6 27.6 31.6 36.4 31.6 40 33.6 46.4 37.6 49.6 46 50 57.6Z"/>
    <path class="hw-pli-robe" d="M20.6 44 19.4 56.6M43.4 44 44.6 56.6M26 48.4 25.4 57M38 48.4 38.6 57"/>
    <path class="hw-col-enma" d="M26.6 32.8 32 44 37.4 32.8"/>
    <path class="hw-ceinture" d="M18.6 46.4C26 48 38 48 45.4 46.4"/>
    <path class="c-bois" d="M30.6 36.4H33.4L33.8 50H30.2Z"/>
    <path class="hw-enma" d="M27.6 44.4C28.2 42.6 30.4 42 31.8 42.8 32.4 44.4 31.6 46 30 46.4 28.6 46.4 27.6 45.6 27.6 44.4ZM36.4 44.4C35.8 42.6 33.6 42 32.2 42.8 31.6 44.4 32.4 46 34 46.4 35.4 46.4 36.4 45.6 36.4 44.4Z"/>
    <path class="hw-enma" d="M24.4 21.6C24.4 15.6 27.8 12.4 32 12.4 36.2 12.4 39.6 15.6 39.6 21.6 39.6 26 37 29 32 29 27 29 24.4 26 24.4 21.6Z"/>
    <path class="noir" d="M24.6 22.6C23.4 28.6 26 34.6 32 36.4 38 34.6 40.6 28.6 39.4 22.6 38.6 25.8 36.4 27.6 34.4 27.8 33 26.4 31 26.4 29.6 27.8 27.6 27.6 25.4 25.8 24.6 22.6Z"/>
    <g class="hw-crie" style="transform-origin:32px 27px"><path class="hw-gorge" d="M29.6 27.2C30.6 29.6 33.4 29.6 34.4 27.2Z"/></g>
    <ellipse class="c-blanc" cx="28.8" cy="19.6" rx="2.3" ry="1.7"/><ellipse class="c-blanc" cx="35.2" cy="19.6" rx="2.3" ry="1.7"/>
    <circle class="noir" cx="29" cy="19.7" r=".75"/><circle class="noir" cx="35" cy="19.7" r=".75"/>
    <path class="hw-sourcil-epais" d="M25.8 16.6 30.6 18.2M38.2 16.6 33.4 18.2"/>
    <path class="noir" d="M23.4 13.6H40.6L39.4 7.4H24.6ZM30 7.6 32 3.6 34 7.6Z"/>
    <path class="c-or" d="M28.4 8.4H35.6V12.8H28.4Z"/>
    <path class="hw-kanji" d="M29.6 9.4H34.4M30.2 10.6H33.8M29.4 11.8H34.6M32 9.4V11.8"/>
  </svg>`,

  // Sakaiminato : un hitotsume-kozō, le petit moine à un œil qui tire la langue
  hitotsume: `<svg viewBox="0 0 64 60" aria-hidden="true">
    <path class="sol" d="M10 57.6H54"/><path class="herbe" d="M14 57.4q.6-3 2.4-4.8M50 57.4q-.6-3-2.4-4.8"/>
    <path class="c-peau" d="M26.6 53.4H31V56.6H26.6ZM33 53.4H37.4V56.6H33Z"/>
    <path class="c-paille" d="M25.8 56.4H31.8V57.8H25.8ZM32.2 56.4H38.2V57.8H32.2Z"/>
    <path class="c-indigo" d="M24.6 33C23 39 22.6 47 22.8 53.8 27 55 37 55 41.2 53.8 41.4 47 41 39 39.4 33 36.4 31.4 27.6 31.4 24.6 33Z"/>
    <path class="hw-col" d="M29.2 32.4 32 36.6 34.8 32.4"/>
    <path class="c-or" d="M23.6 41.6C28.6 42.8 35.4 42.8 40.4 41.6L40.6 44.6C35.4 45.8 28.6 45.8 23.4 44.6Z"/>
    <path class="c-indigo" d="M24.8 34.4C22 37.4 20.8 41.6 21.2 45.6 23.2 46.2 25.2 45.8 26.4 44.6 26.2 41.4 26.6 38.2 27.6 35.6ZM39.2 34.4C42 37.4 43.2 41.6 42.8 45.6 40.8 46.2 38.8 45.8 37.6 44.6 37.8 41.4 37.4 38.2 36.4 35.6Z"/>
    <path class="c-peau" d="M21.6 20.8C21.6 13.6 26.2 9 32 9 37.8 9 42.4 13.6 42.4 20.8 42.4 27.4 37.8 31.6 32 31.6 26.2 31.6 21.6 27.4 21.6 20.8Z"/>
    <path class="hw-joue" d="M24.6 24.6h.1M39.4 24.6h.1"/>
    <path class="trait" d="M27 13.6Q32 11.6 37 13.6"/>
    <g class="hw-oeil" style="transform-origin:32px 19.6px"><ellipse class="c-blanc" cx="32" cy="19.6" rx="5.4" ry="4.6"/><circle class="hw-iris" cx="32.6" cy="20" r="2.9"/><circle class="noir" cx="32.6" cy="20" r="1.4"/><circle class="hw-reflet" cx="33.6" cy="19" r=".8"/></g>
    <path class="trait" d="M28.8 26.4Q32 28.6 35.2 26.4"/>
    <g class="hw-langue" style="transform-origin:32.2px 27.4px"><path class="hw-langue-c" d="M31 27.2C30.4 31 30.8 33.8 32.8 36 34 36.8 35.2 36 34.6 34.6 33.6 32.6 33.4 30 33.6 27.4Z"/></g>
  </svg>`,

  // Ōboke : le konaki-jijii, le vieux qui pleure comme un bébé (et devient lourd comme une pierre si on le prend)
  konaki: `<svg viewBox="0 0 64 60" aria-hidden="true">
    <path class="sol" d="M8 57.6H56"/><path class="herbe" d="M11 57.4q.6-3 2.4-4.8M53 57.4q-.6-3-2.4-4.8"/>
    <path class="hw-baton" d="M45.6 57.4 42.4 31"/>
    <path class="c-paille" d="M18.6 56C19 46 21.4 36.6 26 31.6 29.6 30 34.4 30 38 31.6 42.6 36.6 45 46 45.4 56Z"/>
    <path class="hw-paille" d="M22 54 24.6 40M27 55 28.4 38M32 55.4V36M37 55 35.6 38M42 54 39.4 40M20.6 48.4 24.6 46M43.4 48.4 39.4 46"/>
    <circle class="c-peau" cx="42.4" cy="33.4" r="1.8"/>
    <path class="c-rouge" d="M26.4 30.4C28 35.4 36 35.4 37.6 30.4 36 29.6 28 29.6 26.4 30.4Z"/>
    <path class="hw-motif-clair" d="M29.4 31.6h.1M32 32.6h.1M34.6 31.6h.1"/>
    <path class="c-peau" d="M23.6 21C23.6 15 27.4 11.4 32 11.4 36.6 11.4 40.4 15 40.4 21 40.4 26.4 36.8 30 32 30 27.2 30 23.6 26.4 23.6 21Z"/>
    <path class="c-blanc" d="M23.8 19.4C21.6 19.2 20.6 21.4 21.6 23.2 22.6 22.2 23.4 22 24.2 22.2ZM40.2 19.4C42.4 19.2 43.4 21.4 42.4 23.2 41.4 22.2 40.6 22 39.8 22.2Z"/>
    <path class="trait-doux" d="M28 14.6Q32 13.6 36 14.6M28.6 16Q32 15.2 35.4 16"/>
    <path class="trait" d="M27.2 19.4 29 20.2 30.4 19.2M33.6 19.2 35 20.2 36.8 19.4M27 16.8 30 17.6M37 16.8 34 17.6"/>
    <g class="hw-pleure" style="transform-origin:32px 22px"><path class="noir" d="M29 24C29 22.6 30.4 21.8 32 21.8 33.6 21.8 35 22.6 35 24 35 25.8 33.6 27 32 27 30.4 27 29 25.8 29 24Z"/><path class="c-rouge" d="M30.4 25.6Q32 24.6 33.6 25.6 32.8 26.6 32 26.6 31.2 26.6 30.4 25.6Z"/></g>
    <path class="hw-larme" d="M27 21.4C26.4 22.8 26.4 23.8 27.2 24 27.8 23.8 27.8 22.8 27 21.4Z"/>
    <path class="hw-larme deux" d="M37 21.4C36.4 22.8 36.4 23.8 37.2 24 37.8 23.8 37.8 22.8 37 21.4Z"/>
  </svg>`,

  // Kimotsuki : l'ittan-momen, une longue bande de coton blanc qui vole la nuit
  ittan: `<svg viewBox="0 0 64 60" aria-hidden="true">
    <path class="sol" d="M10 57.6H54"/><ellipse class="hw-ombre-sol" cx="32" cy="56.4" rx="15" ry="1.6"/>
    <g class="hw-ondule" style="transform-origin:32px 26px">
      <path class="hw-coton" d="M5.6 17.4C12 9.6 22.6 8.4 29.6 15.6 35.6 21.8 41 28.6 49.4 28.4 52.8 28.2 55.8 26.6 58.4 24.4 57.4 29.8 53.6 34.6 48 35.2 39.6 36 34.4 29.6 28.8 23.2 23 16.6 14.2 15.4 8.4 21Z"/>
      <path class="hw-coton-ombre" d="M28.8 23.2C34.4 29.6 39.6 36 48 35.2 53.6 34.6 57.4 29.8 58.4 24.4 55 30 50.6 32.6 46.2 32.2 39.4 31.6 35.4 26.6 31 21.6Z"/>
      <path class="hw-tissage" d="M10 18.6C16 13.6 24 13.4 29.4 19.4M33 24.6C38.6 31.2 44 33.4 51.6 31.6"/>
      <ellipse class="noir" cx="12.4" cy="15.6" rx="1.3" ry="1.6"/><ellipse class="noir" cx="16.8" cy="13.8" rx="1.3" ry="1.6"/>
      <circle class="hw-reflet" cx="12.8" cy="15" r=".4"/><circle class="hw-reflet" cx="17.2" cy="13.2" r=".4"/>
    </g>
  </svg>`,
};

// Une chauve-souris vue de face, ailes ouvertes : la membrane tendue sur les doigts, les oreilles pointues.
// Ses ailes battent (.cs-aile) ; le reste du vol est réglé par oiseaux.js.
const AILE = 'M37.2 14.6 22.8 8.6 21.2 6.2 22.4 9.2C15 6.6 8.6 6.2 2.4 7.4 5 9.8 6.2 13 6.2 17 8.2 15.2 10.4 14.6 11.8 15 12.8 17.6 14 19.8 15.6 22 17 19.8 18.8 18.6 20.6 18.6 21.8 21 23 23.4 24.8 25.2 25.8 22.6 27.2 21 28.8 20.6 30.4 22.6 32.2 23.6 34.2 24 34.6 22 35.8 20.4 37.6 19.8Z';
const OS = 'M22.6 9.2 6.2 17M22.6 9.2 15.6 22M22.6 9.2 24.8 25.2M22.6 9.2 34.2 24';
export const CHAUVE_SOURIS = `<svg viewBox="0 0 80 40" aria-hidden="true">
  <g class="cs-aile g"><path class="cs-membrane" d="${AILE}"/><path class="cs-os" d="${OS}"/></g>
  <g class="cs-aile d"><g transform="matrix(-1 0 0 1 80 0)"><path class="cs-membrane" d="${AILE}"/><path class="cs-os" d="${OS}"/></g></g>
  <path class="cs-poil" d="M40 8.6C43 8.6 44.4 11.4 44.4 15.6 44.4 21 42.6 25.4 40 25.4 37.4 25.4 35.6 21 35.6 15.6 35.6 11.4 37 8.6 40 8.6Z"/>
  <path class="cs-fourrure" d="M38.4 14.6 39 16.4M41.6 14.6 41 16.4M38.8 19 39.4 20.8M41.2 19 40.6 20.8"/>
  <path class="cs-poil" d="M37.2 7.6 36.2 2.2 39.4 6.2ZM42.8 7.6 43.8 2.2 40.6 6.2Z"/>
  <circle class="cs-poil" cx="40" cy="9.4" r="3.9"/>
  <circle class="cs-oeil" cx="38.6" cy="9.2" r=".8"/><circle class="cs-oeil" cx="41.4" cy="9.2" r=".8"/>
  <path class="cs-croc" d="M39.1 11.9 39.5 13.1 39.9 11.9ZM40.1 11.9 40.5 13.1 40.9 11.9Z"/>
  <path class="cs-patte" d="M38.6 25 38 27.4M41.4 25 42 27.4"/>
</svg>`;

// Le chat noir assis sur le cartouche « Japan 日本 Japon » ; sa queue pend sur le rouleau
export const CHAT = `<svg viewBox="0 0 44 56" aria-hidden="true">
  <g class="chat-queue" style="transform-origin:31px 41px"><path class="chat-poil" d="M30.6 40.4C34.4 41.4 36 44.6 35.6 48.6 35.2 52 36.6 54.4 38.8 55 37.6 55.8 35.4 55.6 34 54.2 32.6 52.6 32.8 49.6 33 47 33.2 44.6 32.2 43 30 42.2Z"/></g>
  <path class="chat-poil" d="M13.4 42.4C11.2 35.4 12.2 27.4 16.8 23.4H27.2C31.8 27.4 32.8 35.4 30.6 42.4 26.4 43.8 17.6 43.8 13.4 42.4Z"/>
  <path class="chat-poil" d="M17.4 42.6C17.2 40.4 18.4 39.2 19.8 39.4 21 39.6 21.4 41 21.2 42.8ZM22.8 42.8C22.6 41 23 39.6 24.2 39.4 25.6 39.2 26.8 40.4 26.6 42.6Z"/>
  <path class="chat-reflet" d="M19.6 28.6C21 31 23 31 24.4 28.6M15.6 33C15.2 36 15.4 38.6 16 40.6"/>
  <path class="chat-collier" d="M17 23.2Q22 25.4 27 23.2"/><circle class="chat-grelot" cx="22" cy="25.2" r="1.3"/>
  <g class="chat-tete" style="transform-origin:22px 22px">
    <path class="chat-poil" d="M13.6 16.4C13.6 11.6 17.4 8.6 22 8.6 26.6 8.6 30.4 11.6 30.4 16.4 30.4 21.2 26.8 24.2 22 24.2 17.2 24.2 13.6 21.2 13.6 16.4Z"/>
    <path class="chat-poil" d="M14.4 12.6 13.8 4.4 19.6 9.4Z"/>
    <g class="chat-oreille" style="transform-origin:26px 10px"><path class="chat-poil" d="M29.6 12.6 30.2 4.4 24.4 9.4Z"/><path class="chat-rose" d="M28.8 11.2 29 6.6 25.8 9.4Z"/></g>
    <path class="chat-rose" d="M15.2 11.2 15 6.6 18.2 9.4Z"/>
    <g class="chat-yeux" style="transform-origin:22px 15.6px"><ellipse class="chat-oeil" cx="18.6" cy="15.6" rx="2.2" ry="2.5"/><ellipse class="chat-oeil" cx="25.4" cy="15.6" rx="2.2" ry="2.5"/>
      <ellipse class="chat-pupille" cx="18.6" cy="15.6" rx=".55" ry="2"/><ellipse class="chat-pupille" cx="25.4" cy="15.6" rx=".55" ry="2"/></g>
    <path class="chat-nez" d="M21.2 19 22 20 22.8 19Z"/>
    <path class="chat-moustaches" d="M13.4 18.4 17.6 19M13.4 20.4 17.6 19.8M30.6 18.4 26.4 19M30.6 20.4 26.4 19.8"/>
  </g>
</svg>`;

/**
 * La toile d'araignée du coin de la carte : des rayons depuis le coin (en haut à droite), des fils qui pendent un peu
 * entre eux, et l'araignée au bout de son fil (.araignee, qui descend et remonte).
 */
export function toileAraignee() {
  const R = 230, cx = R, cy = 0, n = 8;
  const angles = Array.from({ length: n }, (_, i) => ((96 + (i * 78) / (n - 1)) * Math.PI) / 180);
  const longs = angles.map((_, i) => 168 + ((i * 53) % 58));
  const f = (v) => v.toFixed(1);
  let rayons = '';
  for (let i = 0; i < n; i++) rayons += `M${cx} ${cy}L${f(cx + longs[i] * Math.cos(angles[i]))} ${f(cy + longs[i] * Math.sin(angles[i]))}`;
  let anneaux = '';
  for (let k = 1; k <= 9; k++) {
    const r = 15 * k + 1.15 * k * k;
    const pts = angles.map((a, i) => [cx + Math.min(r, longs[i]) * Math.cos(a), cy + Math.min(r, longs[i]) * Math.sin(a)]);
    anneaux += `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < n; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const mx = (x0 + x1) / 2 + (cx - (x0 + x1) / 2) * 0.1, my = (y0 + y1) / 2 + (cy - (y0 + y1) / 2) * 0.1;
      anneaux += `Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}`;
    }
  }
  const ax = f(cx + 120 * Math.cos(angles[3])), ay = f(cy + 120 * Math.sin(angles[3]));
  // l'araignée pend au bout de son fil, qui s'allonge quand elle descend (même rythme : halloween.css)
  return `<svg viewBox="0 0 ${R} ${R}" aria-hidden="true"><path class="toile-rayons" d="${rayons}"/><path class="toile-fils" d="${anneaux}"/>`
    + `<path class="toile-rayons fil-araignee" style="transform-origin:${ax}px ${ay}px" d="M${ax} ${ay}V${f(+ay + 66)}"/>`
    + `<g class="araignee-bete"><g transform="translate(${f(ax - 7)} ${f(+ay + 62)})"><path class="araignee-pattes" d="M7 6 2 2.6 0 5.4M7 6 1.4 7.2 0 10.6M7 7.6 2.4 10.6 1.6 14M7 6 12 2.6 14 5.4M7 6 12.6 7.2 14 10.6M7 7.6 11.6 10.6 12.4 14"/>`
    + '<ellipse class="araignee-corps" cx="7" cy="9.4" rx="2.8" ry="3.4"/><circle class="araignee-corps" cx="7" cy="5.4" r="1.9"/></g></g></svg>';
}

// Pour la planche de l'atelier (essais) : tous les dessins par leur nom
export const DESSINS_HALLOWEEN = { ...DEFILE, ...YOKAI, chauve: CHAUVE_SOURIS, chat: CHAT, toile: toileAraignee() };
