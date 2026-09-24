/* ============================================================
   LISSAN — banque de contenu (version locale)
   15 langues · 5 unités · 20 mots · 5 phrases par langue
   Sera remplacée plus tard par des tables Supabase.
   ============================================================ */
window.LISSAN_DATA = (() => {
  'use strict';

  // ---------- Langues ----------
  const langs = {
    en: { name: 'Anglais',    native: 'English',    voice: 'en-US', color: '#4F7CFF', latin: true,  abbr: 'EN' },
    fr: { name: 'Français',   native: 'Français',   voice: 'fr-FR', color: '#3B5BDB', latin: true,  abbr: 'FR' },
    es: { name: 'Espagnol',   native: 'Español',    voice: 'es-ES', color: '#F59F00', latin: true,  abbr: 'ES' },
    de: { name: 'Allemand',   native: 'Deutsch',    voice: 'de-DE', color: '#E8590C', latin: true,  abbr: 'DE' },
    it: { name: 'Italien',    native: 'Italiano',   voice: 'it-IT', color: '#2F9E44', latin: true,  abbr: 'IT' },
    pt: { name: 'Portugais',  native: 'Português',  voice: 'pt-BR', color: '#0CA678', latin: true,  abbr: 'PT' },
    tr: { name: 'Turc',       native: 'Türkçe',     voice: 'tr-TR', color: '#E03131', latin: true,  abbr: 'TR' },
    ko: { name: 'Coréen',     native: '한국어',      voice: 'ko-KR', color: '#D6336C', latin: false, abbr: 'KO' },
    zh: { name: 'Chinois',    native: '中文',        voice: 'zh-CN', color: '#C92A2A', latin: false, abbr: 'ZH', noSpace: true },
    ja: { name: 'Japonais',   native: '日本語',      voice: 'ja-JP', color: '#AE3EC9', latin: false, abbr: 'JA', noSpace: true },
    ru: { name: 'Russe',      native: 'Русский',    voice: 'ru-RU', color: '#1971C2', latin: false, abbr: 'RU' },
    ar: { name: 'Arabe',      native: 'العربية',     voice: 'ar-SA', color: '#087F5B', latin: false, abbr: 'AR', rtl: true },
    hi: { name: 'Hindi',      native: 'हिन्दी',       voice: 'hi-IN', color: '#F76707', latin: false, abbr: 'HI' },
    nl: { name: 'Néerlandais',native: 'Nederlands', voice: 'nl-NL', color: '#FD7E14', latin: true,  abbr: 'NL' },
    sv: { name: 'Suédois',    native: 'Svenska',    voice: 'sv-SE', color: '#1C7ED6', latin: true,  abbr: 'SV' }
  };
  const order = ['en', 'fr', 'es', 'de', 'it', 'pt', 'tr', 'ko', 'zh', 'ja', 'ru', 'ar', 'hi', 'nl', 'sv'];

  // ---------- Mots de base (id, sens FR, sens EN, emoji, unité) ----------
  const base = [
    ['hello', 'bonjour', 'hello', '👋', 0], ['thanks', 'merci', 'thank you', '🙏', 0],
    ['yes', 'oui', 'yes', '👍', 0], ['no', 'non', 'no', '🙅', 0],
    ['cat', 'chat', 'cat', '🐱', 1], ['dog', 'chien', 'dog', '🐶', 1],
    ['bird', 'oiseau', 'bird', '🐦', 1], ['fish', 'poisson', 'fish', '🐟', 1],
    ['apple', 'pomme', 'apple', '🍎', 2], ['bread', 'pain', 'bread', '🍞', 2],
    ['water', 'eau', 'water', '💧', 2], ['milk', 'lait', 'milk', '🥛', 2],
    ['mother', 'maman', 'mom', '👩', 3], ['father', 'papa', 'dad', '👨', 3],
    ['friend', 'ami', 'friend', '🤝', 3], ['house', 'maison', 'house', '🏠', 3],
    ['one', 'un', 'one', '1️⃣', 4], ['two', 'deux', 'two', '2️⃣', 4],
    ['red', 'rouge', 'red', '🟥', 4], ['blue', 'bleu', 'blue', '🟦', 4]
  ];

  // ---------- Traductions (même ordre que base) ----------
  const W = {
    en: 'hello|thank you|yes|no|cat|dog|bird|fish|apple|bread|water|milk|mom|dad|friend|house|one|two|red|blue',
    fr: 'bonjour|merci|oui|non|chat|chien|oiseau|poisson|pomme|pain|eau|lait|maman|papa|ami|maison|un|deux|rouge|bleu',
    es: 'hola|gracias|sí|no|gato|perro|pájaro|pez|manzana|pan|agua|leche|mamá|papá|amigo|casa|uno|dos|rojo|azul',
    de: 'hallo|danke|ja|nein|Katze|Hund|Vogel|Fisch|Apfel|Brot|Wasser|Milch|Mama|Papa|Freund|Haus|eins|zwei|rot|blau',
    it: 'ciao|grazie|sì|no|gatto|cane|uccello|pesce|mela|pane|acqua|latte|mamma|papà|amico|casa|uno|due|rosso|blu',
    pt: 'olá|obrigado|sim|não|gato|cachorro|pássaro|peixe|maçã|pão|água|leite|mamãe|papai|amigo|casa|um|dois|vermelho|azul',
    tr: 'merhaba|teşekkürler|evet|hayır|kedi|köpek|kuş|balık|elma|ekmek|su|süt|anne|baba|arkadaş|ev|bir|iki|kırmızı|mavi',
    ko: '안녕하세요|감사합니다|네|아니요|고양이|개|새|물고기|사과|빵|물|우유|엄마|아빠|친구|집|하나|둘|빨간색|파란색',
    zh: '你好|谢谢|是|不是|猫|狗|鸟|鱼|苹果|面包|水|牛奶|妈妈|爸爸|朋友|房子|一|二|红色|蓝色',
    ja: 'こんにちは|ありがとう|はい|いいえ|ねこ|いぬ|とり|さかな|りんご|パン|みず|ぎゅうにゅう|おかあさん|おとうさん|ともだち|いえ|いち|に|あか|あお',
    ru: 'привет|спасибо|да|нет|кошка|собака|птица|рыба|яблоко|хлеб|вода|молоко|мама|папа|друг|дом|один|два|красный|синий',
    ar: 'مرحبا|شكرا|نعم|لا|قطة|كلب|طائر|سمكة|تفاحة|خبز|ماء|حليب|ماما|بابا|صديق|بيت|واحد|اثنان|أحمر|أزرق',
    hi: 'नमस्ते|धन्यवाद|हाँ|नहीं|बिल्ली|कुत्ता|चिड़िया|मछली|सेब|रोटी|पानी|दूध|माँ|पापा|दोस्त|घर|एक|दो|लाल|नीला',
    nl: 'hallo|dank je|ja|nee|kat|hond|vogel|vis|appel|brood|water|melk|mama|papa|vriend|huis|een|twee|rood|blauw',
    sv: 'hej|tack|ja|nej|katt|hund|fågel|fisk|äpple|bröd|vatten|mjölk|mamma|pappa|vän|hus|ett|två|röd|blå'
  };

  // Prononciation (écritures non latines)
  const R = {
    ko: 'annyeonghaseyo|gamsahamnida|ne|aniyo|goyangi|gae|sae|mulgogi|sagwa|ppang|mul|uyu|eomma|appa|chingu|jip|hana|dul|ppalgansaek|paransaek',
    zh: 'nǐ hǎo|xièxie|shì|bú shì|māo|gǒu|niǎo|yú|píngguǒ|miànbāo|shuǐ|niúnǎi|māma|bàba|péngyou|fángzi|yī|èr|hóngsè|lánsè',
    ja: 'konnichiwa|arigatō|hai|iie|neko|inu|tori|sakana|ringo|pan|mizu|gyūnyū|okāsan|otōsan|tomodachi|ie|ichi|ni|aka|ao',
    ru: 'privet|spasibo|da|net|koshka|sobaka|ptitsa|ryba|yabloko|khleb|voda|moloko|mama|papa|drug|dom|odin|dva|krasnyy|siniy',
    ar: 'marḥaban|shukran|naʿam|lā|qiṭṭa|kalb|ṭāʾir|samaka|tuffāḥa|khubz|māʾ|ḥalīb|māmā|bābā|ṣadīq|bayt|wāḥid|ithnān|aḥmar|azraq',
    hi: 'namaste|dhanyavād|hā̃|nahī̃|billī|kuttā|ciṛiyā|machlī|seb|roṭī|pānī|dūdh|mā̃|pāpā|dost|ghar|ek|do|lāl|nīlā'
  };

  // ---------- Phrases (une par unité) ----------
  const PH_FR = ['Merci beaucoup', 'Le chien et le chat', "Je bois de l'eau", 'Bonjour maman', 'Deux chats'];
  const PH_EN = ['Thank you very much', 'The dog and the cat', 'I drink water', 'Hello mom', 'Two cats'];
  const P = {
    en: [['Thank', 'you', 'very', 'much'], ['The', 'dog', 'and', 'the', 'cat'], ['I', 'drink', 'water'], ['Hello', 'mom'], ['Two', 'cats']],
    fr: [['Merci', 'beaucoup'], ['Le', 'chien', 'et', 'le', 'chat'], ['Je', 'bois', 'de', "l'eau"], ['Bonjour', 'maman'], ['Deux', 'chats']],
    es: [['Muchas', 'gracias'], ['El', 'perro', 'y', 'el', 'gato'], ['Yo', 'bebo', 'agua'], ['Hola', 'mamá'], ['Dos', 'gatos']],
    de: [['Vielen', 'Dank'], ['Der', 'Hund', 'und', 'die', 'Katze'], ['Ich', 'trinke', 'Wasser'], ['Hallo', 'Mama'], ['Zwei', 'Katzen']],
    it: [['Grazie', 'mille'], ['Il', 'cane', 'e', 'il', 'gatto'], ['Io', 'bevo', 'acqua'], ['Ciao', 'mamma'], ['Due', 'gatti']],
    pt: [['Muito', 'obrigado'], ['O', 'cachorro', 'e', 'o', 'gato'], ['Eu', 'bebo', 'água'], ['Olá', 'mamãe'], ['Dois', 'gatos']],
    tr: [['Çok', 'teşekkürler'], ['Köpek', 've', 'kedi'], ['Ben', 'su', 'içiyorum'], ['Merhaba', 'anne'], ['İki', 'kedi']],
    ko: [['정말', '감사합니다'], ['개와', '고양이'], ['저는', '물을', '마셔요'], ['엄마', '안녕'], ['고양이', '두', '마리']],
    zh: [['非常', '感谢'], ['狗', '和', '猫'], ['我', '喝', '水'], ['妈妈', '你好'], ['两', '只', '猫']],
    ja: [['どうも', 'ありがとう'], ['いぬ', 'と', 'ねこ'], ['わたしは', 'みずを', 'のみます'], ['おかあさん', 'こんにちは'], ['ねこ', 'にひき']],
    ru: [['Большое', 'спасибо'], ['Собака', 'и', 'кошка'], ['Я', 'пью', 'воду'], ['Привет', 'мама'], ['Две', 'кошки']],
    ar: [['شكرا', 'جزيلا'], ['الكلب', 'والقطة'], ['أنا', 'أشرب', 'الماء'], ['مرحبا', 'ماما'], ['قطتان', 'اثنتان']],
    hi: [['बहुत', 'धन्यवाद'], ['कुत्ता', 'और', 'बिल्ली'], ['मैं', 'पानी', 'पीता', 'हूँ'], ['नमस्ते', 'माँ'], ['दो', 'बिल्लियाँ']],
    nl: [['Dank', 'je', 'wel'], ['De', 'hond', 'en', 'de', 'kat'], ['Ik', 'drink', 'water'], ['Hallo', 'mama'], ['Twee', 'katten']],
    sv: [['Tack', 'så', 'mycket'], ['Hunden', 'och', 'katten'], ['Jag', 'dricker', 'vatten'], ['Hej', 'mamma'], ['Två', 'katter']]
  };

  // ---------- Unités ----------
  const units = [
    { title: 'Premiers mots',       sub: 'Saluer, remercier, dire oui ou non', icon: '👋', color: '#6C4DFF' },
    { title: 'Les animaux',         sub: 'Chat, chien, oiseau, poisson',        icon: '🐾', color: '#14B8A6' },
    { title: 'À table',             sub: 'Pomme, pain, eau, lait',              icon: '🍎', color: '#F59F00' },
    { title: 'La famille',          sub: 'Maman, papa, les amis, la maison',    icon: '🏡', color: '#E64980' },
    { title: 'Nombres et couleurs', sub: 'Compter et nommer les couleurs',      icon: '🎨', color: '#1C7ED6' }
  ];

  function words(lang) {
    const t = W[lang].split('|');
    const r = R[lang] ? R[lang].split('|') : [];
    return base.map(([id, fr, en, e, u], i) => ({
      id, t: t[i], r: r[i] || '', m: lang === 'fr' ? en : fr, e, u
    }));
  }
  function phrase(lang, unit) {
    return { tokens: P[lang][unit], m: lang === 'fr' ? PH_EN[unit] : PH_FR[unit], unit };
  }
  function phrases(lang) { return P[lang]; }

  // ---------- Ligues ----------
  const leagues = [
    { name: 'Bronze', color: '#C98A55' }, { name: 'Argent', color: '#9AA7B8' },
    { name: 'Or', color: '#F2B92E' }, { name: 'Saphir', color: '#3E7BFA' },
    { name: 'Rubis', color: '#E5484D' }, { name: 'Émeraude', color: '#20B26B' },
    { name: 'Améthyste', color: '#9B6BFF' }, { name: 'Perle', color: '#D9B99B' },
    { name: 'Obsidienne', color: '#4A4468' }, { name: 'Diamant', color: '#38C6E8' }
  ];
  const bots = [
    ['Yasmine', '🦄'], ['Karim', '🐯'], ['Lina', '🐰'], ['Adam', '🦁'], ['Sofia', '🐼'],
    ['Rayan', '🐸'], ['Inès', '🦉'], ['Mehdi', '🐙'], ['Emma', '🐧'], ['Youcef', '🦊'],
    ['Nour', '🐨'], ['Lucas', '🐢'], ['Amira', '🐝'], ['Ilyes', '🐳']
  ];

  // ---------- Statuts (5 niveaux) ----------
  const ranks = [
    { min: 0,    name: 'Explorateur',    icon: '🧭', color: '#14B8A6' },
    { min: 200,  name: 'Voyageur',       icon: '🎒', color: '#4F7CFF' },
    { min: 600,  name: 'Aventurier',     icon: '⛰️', color: '#9B6BFF' },
    { min: 1500, name: 'Globe-trotteur', icon: '✈️', color: '#E64980' },
    { min: 3500, name: 'Polyglotte',     icon: '👑', color: '#F2B92E' }
  ];

  const avatars = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦄', '🐧', '🐨', '🐰', '🦉', '🐢', '🐝', '🐳', '🦖', '🐞'];
  const praise = ['Excellent !', 'Bravo !', 'Parfait !', 'Génial !', 'Super !', 'Bien joué !', 'Magnifique !', 'Tu assures !'];
  const comfort = ['Presque !', 'Pas grave, on continue.', 'Tu y es presque.', 'Chaque erreur fait apprendre.'];

  // ---------- Îles & autocollants (Le voyage de Bulle) ----------
  const islands = {
    en: { embleme: '🏰', nom: 'Île de la Tamise', stickers: [
      { e: '🫖', nom: 'Thé anglais' }, { e: '🚌', nom: 'Bus rouge' }, { e: '🏰', nom: 'Tour de Londres' },
      { e: '⚽', nom: 'Football' }, { e: '🎭', nom: 'Théâtre Shakespeare' }, { e: '☔', nom: 'Parapluie' },
      { e: '🐟', nom: 'Fish & chips' }, { e: '🎩', nom: 'Haut-de-forme' }, { e: '🦁', nom: 'Lion royal' },
      { e: '🐑', nom: 'Mouton anglais' }, { e: '🎡', nom: 'London Eye' }, { e: '📞', nom: 'Cabine rouge' },
      { e: '🍰', nom: 'Pudding' }, { e: '🦊', nom: 'Renard roux' }, { e: '🏉', nom: 'Rugby' },
      { e: '🌹', nom: 'Rose Tudor' }, { e: '🎸', nom: 'Rock music' }, { e: '🍺', nom: 'Pub anglais' },
      { e: '🎄', nom: 'Noël britannique' }, { e: '🐝', nom: 'Abeille royale' }
    ]},
    fr: { embleme: '🗼', nom: 'Île de la Seine', stickers: [
      { e: '🥐', nom: 'Croissant' }, { e: '🥖', nom: 'Baguette' }, { e: '🧀', nom: 'Fromage français' },
      { e: '🗼', nom: 'Tour Eiffel' }, { e: '🍷', nom: 'Vin rouge' }, { e: '🥂', nom: 'Champagne' },
      { e: '🎨', nom: 'Peinture Louvre' }, { e: '🪗', nom: 'Accordéon' }, { e: '💐', nom: 'Lavande' },
      { e: '🐓', nom: 'Coq gaulois' }, { e: '⚜️', nom: 'Fleur de lys' }, { e: '🍰', nom: 'Macaron' },
      { e: '🚴', nom: 'Tour de France' }, { e: '🌺', nom: 'Coquelicot' }, { e: '🥞', nom: 'Crêpe bretonne' },
      { e: '🏰', nom: 'Château Loire' }, { e: '🌊', nom: "Côte d'Azur" }, { e: '🎊', nom: 'Bastille' },
      { e: '🦔', nom: 'Hérisson' }, { e: '🎪', nom: 'Fête foraine' }
    ]},
    es: { embleme: '💃', nom: 'Île du Soleil', stickers: [
      { e: '🥘', nom: 'Paella' }, { e: '💃', nom: 'Flamenco' }, { e: '🐂', nom: 'Taureau' },
      { e: '🍊', nom: 'Orange Valence' }, { e: '⛪', nom: 'Sagrada Família' }, { e: '🎸', nom: 'Guitare' },
      { e: '🍷', nom: 'Rioja' }, { e: '🫒', nom: 'Olive' }, { e: '🏰', nom: 'Alhambra' },
      { e: '🧁', nom: 'Churro' }, { e: '🌞', nom: 'Soleil espagnol' }, { e: '🎊', nom: 'Feria' },
      { e: '🐟', nom: 'Anchois' }, { e: '🌹', nom: 'Rose' }, { e: '🦅', nom: 'Aigle royal' },
      { e: '⚽', nom: 'Fútbol' }, { e: '🎭', nom: 'Théâtre Siglo' }, { e: '🌶️', nom: 'Piment' },
      { e: '🎉', nom: 'Tomatina' }, { e: '🐙', nom: 'Pieuvre galice' }
    ]},
    de: { embleme: '🍺', nom: 'Île du Rhin', stickers: [
      { e: '🍺', nom: 'Bière bavaroise' }, { e: '🥨', nom: 'Bretzel' }, { e: '🌭', nom: 'Bratwurst' },
      { e: '🏰', nom: 'Neuschwanstein' }, { e: '🎄', nom: 'Marché de Noël' }, { e: '🚗', nom: 'Voiture allemande' },
      { e: '🎻', nom: 'Violon classique' }, { e: '🦅', nom: 'Aigle impérial' }, { e: '🥾', nom: 'Randonnée' },
      { e: '📚', nom: 'Gutenberg' }, { e: '🌲', nom: 'Forêt Noire' }, { e: '🍫', nom: 'Chocolat' },
      { e: '🐻', nom: 'Ours de Berlin' }, { e: '🎡', nom: 'Oktoberfest' }, { e: '🥮', nom: 'Pain épicé' },
      { e: '⛪', nom: 'Cathédrale Cologne' }, { e: '⚽', nom: 'Bundesliga' }, { e: '🌺', nom: 'Bruyère' },
      { e: '🎺', nom: 'Fanfare' }, { e: '🦌', nom: 'Cerf de forêt' }
    ]},
    it: { embleme: '🍕', nom: 'Île de la Botte', stickers: [
      { e: '🍕', nom: 'Pizza napolitaine' }, { e: '🍝', nom: 'Spaghetti' }, { e: '🏛️', nom: 'Colisée' },
      { e: '☕', nom: 'Espresso' }, { e: '🍦', nom: 'Gelato' }, { e: '🎭', nom: 'Carnaval Venise' },
      { e: '🚤', nom: 'Gondole' }, { e: '🏎️', nom: 'Ferrari' }, { e: '🍋', nom: 'Limoncello' },
      { e: '🌋', nom: 'Vésuve' }, { e: '🫒', nom: 'Olive toscane' }, { e: '🧀', nom: 'Parmesan' },
      { e: '🎵', nom: 'Opéra' }, { e: '🎨', nom: 'Renaissance' }, { e: '🦁', nom: 'Lion Saint-Marc' },
      { e: '🌹', nom: 'Rose italienne' }, { e: '🍇', nom: 'Raisin toscan' }, { e: '🏺', nom: 'Poterie antique' },
      { e: '🎊', nom: 'Carnaval' }, { e: '🐺', nom: 'Loup légendaire' }
    ]},
    pt: { embleme: '⛵', nom: 'Île des Caravelles', stickers: [
      { e: '🐟', nom: 'Bacalhau' }, { e: '⛵', nom: 'Caravelle' }, { e: '🎵', nom: 'Fado' },
      { e: '🏰', nom: 'Tour de Belém' }, { e: '🍊', nom: 'Orange Algarve' }, { e: '🌊', nom: 'Atlantique' },
      { e: '⚽', nom: 'Football' }, { e: '🐓', nom: 'Coq de Barcelos' }, { e: '🍷', nom: 'Porto' },
      { e: '🎨', nom: 'Azulejo' }, { e: '🌞', nom: 'Soleil Algarve' }, { e: '🥐', nom: 'Pastel de nata' },
      { e: '🐬', nom: 'Dauphin' }, { e: '🌳', nom: 'Chêne-liège' }, { e: '🎭', nom: 'São João' },
      { e: '🧂', nom: 'Fleur de sel' }, { e: '🦅', nom: 'Aigle ibérique' }, { e: '⚓', nom: 'Ancre Vasco' },
      { e: '🌺', nom: 'Azalée' }, { e: '🏄', nom: 'Surf Nazaré' }
    ]},
    tr: { embleme: '🕌', nom: 'Île du Bosphore', stickers: [
      { e: '🕌', nom: 'Mosquée Bleue' }, { e: '🫖', nom: 'Thé turc' }, { e: '🥙', nom: 'Kebab' },
      { e: '🍆', nom: 'Aubergine' }, { e: '🌷', nom: 'Tulipe ottomane' }, { e: '🏺', nom: 'Grand Bazar' },
      { e: '🛥️', nom: 'Bosphore' }, { e: '🌙', nom: 'Croissant de lune' }, { e: '🧿', nom: 'Œil Nazar' },
      { e: '🦅', nom: 'Aigle anatolien' }, { e: '🍦', nom: 'Dondurma' }, { e: '🐱', nom: 'Chat Istanbul' },
      { e: '🎊', nom: 'Hıdırellez' }, { e: '🌊', nom: 'Mer Égée' }, { e: '🥜', nom: 'Pistache' },
      { e: '🎭', nom: "Théâtre d'ombres" }, { e: '🏔️', nom: 'Mont Ararat' }, { e: '🪘', nom: 'Darbuka' },
      { e: '🍯', nom: 'Miel anatolien' }, { e: '🦋', nom: 'Papillon de printemps' }
    ]},
    ko: { embleme: '🏮', nom: 'Île du Matin Calme', stickers: [
      { e: '🌶️', nom: 'Kimchi' }, { e: '🍜', nom: 'Ramyeon' }, { e: '🎵', nom: 'K-pop' },
      { e: '🏮', nom: 'Lanterne Séoul' }, { e: '🏯', nom: 'Gyeongbokgung' }, { e: '🐯', nom: 'Tigre coréen' },
      { e: '🌸', nom: 'Cerisier' }, { e: '🥋', nom: 'Taekwondo' }, { e: '📱', nom: 'High-tech' },
      { e: '🌺', nom: 'Mugunghwa' }, { e: '🍵', nom: 'Thé vert' }, { e: '🎑', nom: 'Chuseok' },
      { e: '🏔️', nom: 'Hallasan' }, { e: '👘', nom: 'Hanbok' }, { e: '🌊', nom: "Mer de l'Est" },
      { e: '🎎', nom: 'Poupée coréenne' }, { e: '🍡', nom: 'Tteok' }, { e: '🎋', nom: 'Bambou' },
      { e: '🎭', nom: 'Nanta' }, { e: '🦅', nom: 'Aigle coréen' }
    ]},
    zh: { embleme: '🐉', nom: 'Île du Dragon', stickers: [
      { e: '🐉', nom: 'Dragon impérial' }, { e: '🥟', nom: 'Dumplings' }, { e: '🏮', nom: 'Lanterne rouge' },
      { e: '🐼', nom: 'Panda géant' }, { e: '🏯', nom: 'Grande Muraille' }, { e: '🍵', nom: 'Thé oolong' },
      { e: '🎆', nom: 'Feux artifice' }, { e: '🎋', nom: 'Bambou' }, { e: '🌸', nom: 'Prunier fleuri' },
      { e: '🎊', nom: 'Nouvel An lunaire' }, { e: '🌺', nom: 'Pivoine impériale' }, { e: '🦁', nom: 'Lion dansant' },
      { e: '🌙', nom: 'Fête de la lune' }, { e: '🎵', nom: 'Erhu' }, { e: '🐠', nom: 'Carpe koï' },
      { e: '🏔️', nom: 'Mont Huangshan' }, { e: '🐒', nom: 'Singe doré' }, { e: '🎨', nom: 'Calligraphie' },
      { e: '🥡', nom: 'Riz sauté' }, { e: '🦋', nom: 'Papillon de soie' }
    ]},
    ja: { embleme: '🗻', nom: 'Île du Soleil Levant', stickers: [
      { e: '🌸', nom: 'Hanami' }, { e: '🗻', nom: 'Mont Fuji' }, { e: '⛩️', nom: 'Torii' },
      { e: '🍱', nom: 'Bento' }, { e: '🥷', nom: 'Ninja' }, { e: '🍜', nom: 'Ramen' },
      { e: '🎎', nom: 'Poupée Daruma' }, { e: '🎋', nom: 'Tanabata' }, { e: '🏯', nom: 'Château Himeji' },
      { e: '🐟', nom: 'Sushi' }, { e: '🌺', nom: 'Chrysanthème' }, { e: '🎊', nom: 'Matsuri' },
      { e: '🦊', nom: 'Renard Kitsune' }, { e: '🌙', nom: 'O-tsukimi' }, { e: '🎮', nom: 'Jeux vidéo' },
      { e: '👘', nom: 'Kimono' }, { e: '🎍', nom: 'Kadomatsu' }, { e: '🎏', nom: 'Koinobori' },
      { e: '🐉', nom: 'Dragon japonais' }, { e: '🍡', nom: 'Dango' }
    ]},
    ru: { embleme: '🪆', nom: 'Île des Neiges', stickers: [
      { e: '🪆', nom: 'Matriochka' }, { e: '🏰', nom: 'Kremlin' }, { e: '🎭', nom: 'Ballet impérial' },
      { e: '🎻', nom: 'Violon classique' }, { e: '❄️', nom: 'Hiver sibérien' }, { e: '🐻', nom: 'Ours brun' },
      { e: '🌻', nom: 'Tournesol' }, { e: '🚂', nom: 'Transsibérien' }, { e: '🍵', nom: 'Samovar' },
      { e: '⭐', nom: 'Étoile rouge' }, { e: '🎊', nom: 'Maslenitsa' }, { e: '🌺', nom: 'Lilas de mai' },
      { e: '🦅', nom: 'Aigle bicéphale' }, { e: '🥞', nom: 'Blini' }, { e: '🐟', nom: 'Caviar beluga' },
      { e: '🏔️', nom: 'Mont Elbrouz' }, { e: '🎠', nom: 'Cirque de Moscou' }, { e: '🧣', nom: 'Châle Pavlovo' },
      { e: '🌙', nom: 'Nuit blanche' }, { e: '🎶', nom: 'Balalaïka' }
    ]},
    ar: { embleme: '🐪', nom: 'Île du Croissant', stickers: [
      { e: '🐪', nom: 'Chameau du désert' }, { e: '🌙', nom: 'Croissant sacré' }, { e: '🏺', nom: 'Grand Bazar' },
      { e: '🌴', nom: 'Palmier dattier' }, { e: '🎵', nom: 'Oud' }, { e: '☕', nom: 'Café arabe' },
      { e: '🐎', nom: 'Cheval arabe' }, { e: '🏜️', nom: 'Désert Sahara' }, { e: '🕌', nom: 'Mosquée' },
      { e: '🦅', nom: 'Aigle Quraysh' }, { e: '🌹', nom: 'Rose de Damas' }, { e: '🎊', nom: 'Aïd al-Fitr' },
      { e: '🍯', nom: 'Miel sidr' }, { e: '🪔', nom: 'Lampe Aladin' }, { e: '🌟', nom: "Étoile d'Orient" },
      { e: '🐆', nom: 'Guépard arabe' }, { e: '🌺', nom: "Fleur d'oranger" }, { e: '🎨', nom: 'Calligraphie' },
      { e: '🏔️', nom: 'Mont Sinaï' }, { e: '🎭', nom: 'Théâtre Khayal' }
    ]},
    hi: { embleme: '🪔', nom: 'Île du Lotus', stickers: [
      { e: '🪔', nom: 'Diwali' }, { e: '🐘', nom: 'Éléphant sacré' }, { e: '🏛️', nom: 'Taj Mahal' },
      { e: '🌺', nom: 'Lotus national' }, { e: '🦚', nom: 'Paon impérial' }, { e: '🎊', nom: 'Holi' },
      { e: '🍛', nom: 'Curry épicé' }, { e: '🥛', nom: 'Lassi' }, { e: '🎭', nom: 'Bharatanatyam' },
      { e: '🐅', nom: 'Tigre du Bengale' }, { e: '🌿', nom: 'Ayurveda' }, { e: '🎵', nom: 'Sitar' },
      { e: '🏔️', nom: 'Himalaya' }, { e: '🐒', nom: 'Singe langur' }, { e: '🌸', nom: 'Jasmin' },
      { e: '🐄', nom: 'Vache sacrée' }, { e: '🎪', nom: 'Bazar coloré' }, { e: '⭐', nom: 'Étoile Inde' },
      { e: '🌊', nom: "Mer d'Arabie" }, { e: '🎋', nom: 'Bambou indien' }
    ]},
    nl: { embleme: '🌷', nom: 'Île des Polders', stickers: [
      { e: '🌷', nom: 'Tulipe Keukenhof' }, { e: '🚲', nom: 'Vélo Amsterdam' }, { e: '⛵', nom: 'Canal Amsterdam' },
      { e: '🧀', nom: 'Gouda' }, { e: '🌼', nom: 'Champs fleuris' }, { e: '🌬️', nom: 'Moulin à vent' },
      { e: '🎨', nom: 'Vermeer' }, { e: '🐄', nom: 'Vache frisonne' }, { e: '🌊', nom: 'Polders' },
      { e: '🍻', nom: 'Bière Heineken' }, { e: '💎', nom: 'Diamant Anvers' }, { e: '🐟', nom: 'Hareng mariné' },
      { e: '🎁', nom: 'Sinterklaas' }, { e: '⛸️', nom: 'Patinage' }, { e: '📚', nom: 'Érasme' },
      { e: '🏠', nom: 'Maison en brique' }, { e: '🦆', nom: 'Canard' }, { e: '🍪', nom: 'Stroopwafel' },
      { e: '🌍', nom: 'Pays-Bas' }, { e: '🛶', nom: 'Péniche' }
    ]},
    sv: { embleme: '🦌', nom: 'Île du Soleil de Minuit', stickers: [
      { e: '🦌', nom: 'Renne Laponie' }, { e: '❄️', nom: 'Aurore boréale' }, { e: '🍖', nom: 'Köttbullar' },
      { e: '🎄', nom: 'Noël suédois' }, { e: '🌲', nom: 'Forêt de pins' }, { e: '⚓', nom: 'Vikings' },
      { e: '🎵', nom: 'ABBA' }, { e: '🪑', nom: 'Design suédois' }, { e: '🌊', nom: 'Archipel' },
      { e: '🦅', nom: 'Aigle doré' }, { e: '🏒', nom: 'Hockey sur glace' }, { e: '🌺', nom: 'Linnée boréale' },
      { e: '🎊', nom: 'Midsommar' }, { e: '🍓', nom: 'Fraises été' }, { e: '☀️', nom: 'Soleil de minuit' },
      { e: '🐻', nom: 'Ours de Suède' }, { e: '🏠', nom: 'Chalet rouge' }, { e: '🧸', nom: 'Pippi Långstrump' },
      { e: '🎭', nom: 'Bergman cinéma' }, { e: '🐳', nom: 'Baleine Arctique' }
    ]}
  };

  return { langs, order, units, words, phrase, phrases, leagues, bots, ranks, avatars, praise, comfort, islands };
})();
