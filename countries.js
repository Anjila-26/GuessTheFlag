// Country data: [ISO 3166-1 alpha-2 code, display name]

// Easy pool — widely recognizable flags.
const EASY = [
  ["ar","Argentina"],["au","Australia"],["at","Austria"],["be","Belgium"],["br","Brazil"],
  ["bg","Bulgaria"],["ca","Canada"],["cl","Chile"],["cn","China"],["co","Colombia"],
  ["hr","Croatia"],["cu","Cuba"],["cz","Czechia"],["dk","Denmark"],["eg","Egypt"],
  ["fi","Finland"],["fr","France"],["de","Germany"],["gr","Greece"],["hu","Hungary"],
  ["is","Iceland"],["in","India"],["id","Indonesia"],["ie","Ireland"],["il","Israel"],
  ["it","Italy"],["jm","Jamaica"],["jp","Japan"],["ke","Kenya"],["kr","South Korea"],
  ["lv","Latvia"],["lt","Lithuania"],["lu","Luxembourg"],["my","Malaysia"],["mx","Mexico"],
  ["ma","Morocco"],["nl","Netherlands"],["nz","New Zealand"],["ng","Nigeria"],["no","Norway"],
  ["pk","Pakistan"],["pe","Peru"],["ph","Philippines"],["pl","Poland"],["pt","Portugal"],
  ["ro","Romania"],["ru","Russia"],["sa","Saudi Arabia"],["rs","Serbia"],["sg","Singapore"],
  ["sk","Slovakia"],["si","Slovenia"],["za","South Africa"],["es","Spain"],["se","Sweden"],
  ["ch","Switzerland"],["th","Thailand"],["tr","Türkiye"],["ua","Ukraine"],["ae","UAE"],
  ["gb","United Kingdom"],["us","United States"],["uy","Uruguay"],["ve","Venezuela"],["vn","Vietnam"],
  ["dz","Algeria"],["bd","Bangladesh"],["bo","Bolivia"],["kh","Cambodia"],["cr","Costa Rica"],
  ["do","Dominican Rep."],["ec","Ecuador"],["ee","Estonia"],["et","Ethiopia"],["gh","Ghana"],
  ["gt","Guatemala"],["hn","Honduras"],["iq","Iraq"],["ir","Iran"],["jo","Jordan"],
  ["kz","Kazakhstan"],["kw","Kuwait"],["lb","Lebanon"],["np","Nepal"],["pa","Panama"],
  ["py","Paraguay"],["qa","Qatar"],["lk","Sri Lanka"],["tn","Tunisia"],["uz","Uzbekistan"],
  ["mc","Monaco"],["mt","Malta"],["cy","Cyprus"],["ge","Georgia"],["am","Armenia"],
  ["az","Azerbaijan"],["by","Belarus"],["fj","Fiji"],["mn","Mongolia"],["mm","Myanmar"]
];

// Less common countries — added on top of EASY to form the Hard pool.
const HARD_EXTRA = [
  // Africa
  ["ao","Angola"],["bj","Benin"],["bw","Botswana"],["bf","Burkina Faso"],["bi","Burundi"],
  ["cm","Cameroon"],["cv","Cape Verde"],["cf","Central African Rep."],["td","Chad"],["km","Comoros"],
  ["cg","Congo"],["cd","DR Congo"],["ci","Côte d'Ivoire"],["dj","Djibouti"],["gq","Equatorial Guinea"],
  ["er","Eritrea"],["sz","Eswatini"],["ga","Gabon"],["gm","Gambia"],["gn","Guinea"],
  ["gw","Guinea-Bissau"],["ls","Lesotho"],["lr","Liberia"],["ly","Libya"],["mg","Madagascar"],
  ["mw","Malawi"],["ml","Mali"],["mr","Mauritania"],["mu","Mauritius"],["mz","Mozambique"],
  ["na","Namibia"],["ne","Niger"],["rw","Rwanda"],["st","São Tomé & Príncipe"],["sn","Senegal"],
  ["sc","Seychelles"],["sl","Sierra Leone"],["so","Somalia"],["ss","South Sudan"],["sd","Sudan"],
  ["tz","Tanzania"],["tg","Togo"],["ug","Uganda"],["zm","Zambia"],["zw","Zimbabwe"],
  // Americas
  ["ag","Antigua & Barbuda"],["bs","Bahamas"],["bb","Barbados"],["bz","Belize"],["dm","Dominica"],
  ["gd","Grenada"],["gy","Guyana"],["ht","Haiti"],["ni","Nicaragua"],["kn","St. Kitts & Nevis"],
  ["lc","St. Lucia"],["vc","St. Vincent"],["sr","Suriname"],["tt","Trinidad & Tobago"],
  // Asia & Middle East
  ["af","Afghanistan"],["bh","Bahrain"],["bt","Bhutan"],["bn","Brunei"],["kg","Kyrgyzstan"],
  ["la","Laos"],["mv","Maldives"],["om","Oman"],["ps","Palestine"],["sy","Syria"],
  ["tj","Tajikistan"],["tl","Timor-Leste"],["tm","Turkmenistan"],["ye","Yemen"],
  // Europe
  ["ad","Andorra"],["al","Albania"],["ba","Bosnia & Herzegovina"],["li","Liechtenstein"],["md","Moldova"],
  ["me","Montenegro"],["mk","North Macedonia"],["sm","San Marino"],["va","Vatican City"],["xk","Kosovo"],
  // Oceania
  ["ki","Kiribati"],["mh","Marshall Islands"],["fm","Micronesia"],["nr","Nauru"],["pw","Palau"],
  ["pg","Papua New Guinea"],["ws","Samoa"],["sb","Solomon Islands"],["to","Tonga"],["tv","Tuvalu"],
  ["vu","Vanuatu"]
];

// Difficulty tiers — mutually exclusive pools.
// Easy = recognizable flags; Hard = the less-common ones only.
const COUNTRY_TIERS = {
  easy: EASY,
  hard: HARD_EXTRA
};
