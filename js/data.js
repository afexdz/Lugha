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

  return { langs, order, units, words, phrase, phrases, leagues, bots, ranks, avatars, praise, comfort };
})();
