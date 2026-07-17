// JEEVAMITHRAN — App Config

export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const STATES_CONFIG = {
  tn:  {name:'Tamil Nadu',       emoji:'ðŸ›ï¸', available:true,  cuisine:'Dravidian South Indian', count:500, capital:'Chennai',          lang:{name:'Tamil',   code:'ta', script:'à®¤à®®à®¿à®´à¯',   recipeField:'tamil'}},
  kl:  {name:'Kerala',           emoji:'ðŸŒ´', available:false, cuisine:'Malabar & Coastal',        capital:'Thiruvananthapuram', lang:{name:'Malayalam',code:'ml', script:'à´®à´²à´¯à´¾à´³à´‚',  recipeField:'malayalam'}},
  ka:  {name:'Karnataka',        emoji:'ðŸŒº', available:false, cuisine:'Udupi & North Karnataka',  capital:'Bengaluru',          lang:{name:'Kannada',  code:'kn', script:'à²•à²¨à³à²¨à²¡',   recipeField:'kannada'}},
  ap:  {name:'Andhra Pradesh',   emoji:'ðŸŒ¶ï¸', available:false, cuisine:'Andhra Spicy & Coastal',   capital:'Amaravati',          lang:{name:'Telugu',   code:'te', script:'à°¤à±†à°²à±à°—à±',  recipeField:'telugu'}},
  ts:  {name:'Telangana',        emoji:'ðŸ›', available:false, cuisine:'Hyderabadi Nawabi',         capital:'Hyderabad',          lang:{name:'Telugu',   code:'te', script:'à°¤à±†à°²à±à°—à±',  recipeField:'telugu'}},
  mh:  {name:'Maharashtra',      emoji:'ðŸ¥˜', available:false, cuisine:'Maharashtrian Thali',       capital:'Mumbai',             lang:{name:'Marathi',  code:'mr', script:'à¤®à¤°à¤¾à¤ à¥€',   recipeField:'marathi'}},
  rj:  {name:'Rajasthan',        emoji:'ðŸœï¸', available:false, cuisine:'Desert Royal Cuisine',      capital:'Jaipur',             lang:{name:'Hindi',    code:'hi', script:'à¤¹à¤¿à¤¨à¥à¤¦à¥€',  recipeField:'hindi'}},
  gj:  {name:'Gujarat',          emoji:'ðŸ¥—', available:false, cuisine:'Pure Veg Thali',            capital:'Gandhinagar',        lang:{name:'Gujarati', code:'gu', script:'àª—à«àªœàª°àª¾àª¤à«€', recipeField:'gujarati'}},
  up:  {name:'Uttar Pradesh',    emoji:'ðŸ²', available:false, cuisine:'Awadhi & Mughlai',          capital:'Lucknow',            lang:{name:'Hindi',    code:'hi', script:'à¤¹à¤¿à¤¨à¥à¤¦à¥€',  recipeField:'hindi'}},
  wb:  {name:'West Bengal',      emoji:'ðŸŸ', available:false, cuisine:'Bengali River Delta',        capital:'Kolkata',            lang:{name:'Bengali',  code:'bn', script:'à¦¬à¦¾à¦‚à¦²à¦¾',   recipeField:'bengali'}},
  pb:  {name:'Punjab',           emoji:'ðŸ«“', available:false, cuisine:'Punjabi Dhaba',              capital:'Chandigarh',         lang:{name:'Punjabi',  code:'pa', script:'à¨ªà©°à¨œà¨¾à¨¬à©€',  recipeField:'punjabi'}},
  goa: {name:'Goa',              emoji:'ðŸ¦€', available:false, cuisine:'Coastal Konkani',            capital:'Panaji',             lang:{name:'Konkani',  code:'kok',script:'à¤•à¥‹à¤‚à¤•à¤£à¥€',  recipeField:'konkani'}},
  od:  {name:'Odisha',           emoji:'ðŸŒ¾', available:false, cuisine:'Odia Temple Cuisine',        capital:'Bhubaneswar',        lang:{name:'Odia',     code:'or', script:'à¬“à¬¡à¬¼à¬¿à¬†',   recipeField:'odia'}},
  mp:  {name:'Madhya Pradesh',   emoji:'ðŸŒ¿', available:false, cuisine:'Bhopal & Indori',           capital:'Bhopal',             lang:{name:'Hindi',    code:'hi', script:'à¤¹à¤¿à¤¨à¥à¤¦à¥€',  recipeField:'hindi'}},
  bi:  {name:'Bihar',            emoji:'ðŸŒ½', available:false, cuisine:'Bihari Home Cooking',        capital:'Patna',              lang:{name:'Hindi',    code:'hi', script:'à¤¹à¤¿à¤¨à¥à¤¦à¥€',  recipeField:'hindi'}},
  as:  {name:'Assam',            emoji:'ðŸµ', available:false, cuisine:'Assamese River Cuisine',     capital:'Dispur',             lang:{name:'Assamese', code:'as', script:'à¦…à¦¸à¦®à§€à¦¯à¦¼à¦¾', recipeField:'assamese'}},
};

// â”€â”€ Per-state ingredient translations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INGREDIENT_TRANSLATIONS = {
  ta: { // Tamil
    'rice':'à®…à®°à®¿à®šà®¿','raw rice':'à®ªà®šà¯à®šà¯ˆ à®…à®°à®¿à®šà®¿','idli rice':'à®‡à®Ÿà¯à®²à®¿ à®…à®°à®¿à®šà®¿','dosa rice':'à®¤à¯‹à®šà¯ˆ à®…à®°à®¿à®šà®¿',
    'basmati rice':'à®ªà®¾à®¸à¯à®®à®¤à®¿ à®…à®°à®¿à®šà®¿','seeraga samba rice':'à®šà¯€à®°à®• à®šà®®à¯à®ªà®¾ à®…à®°à®¿à®šà®¿','black rice':'à®•à®µà¯à®©à®¿ à®…à®°à®¿à®šà®¿',
    'broken wheat':'à®•à¯‹à®¤à¯à®®à¯ˆ à®°à®µà¯ˆ','wheat flour':'à®•à¯‹à®¤à¯à®®à¯ˆ à®®à®¾à®µà¯','maida':'à®®à¯ˆà®¤à®¾','semolina':'à®°à®µà¯ˆ',
    'semolina (rava)':'à®°à®µà¯ˆ','rava':'à®°à®µà¯ˆ','rice flour':'à®…à®°à®¿à®šà®¿ à®®à®¾à®µà¯','ragi flour':'à®•à¯‡à®´à¯à®µà®°à®•à¯ à®®à®¾à®µà¯',
    'finger millet (ragi) flour':'à®•à¯‡à®´à¯à®µà®°à®•à¯ à®®à®¾à®µà¯','finger millet (ragi)':'à®•à¯‡à®´à¯à®µà®°à®•à¯',
    'pearl millet (kambu)':'à®•à®®à¯à®ªà¯','pearl millet (kambu) flour':'à®•à®®à¯à®ªà¯ à®®à®¾à®µà¯',
    'foxtail millet':'à®¤à®¿à®©à¯ˆ','foxtail millet flour':'à®¤à®¿à®©à¯ˆ à®®à®¾à®µà¯',
    'little millet':'à®šà®¾à®®à¯ˆ','little millet flour':'à®šà®¾à®®à¯ˆ à®®à®¾à®µà¯',
    'kodo millet':'à®µà®°à®•à¯','barnyard millet':'à®•à¯à®¤à®¿à®°à¯ˆà®µà®¾à®²à®¿',
    'sorghum (cholam)':'à®šà¯‹à®³à®®à¯','sorghum (cholam) flour':'à®šà¯‹à®³à®®à¯ à®®à®¾à®µà¯',
    'jowar (sorghum) flour':'à®šà¯‹à®³à®®à¯ à®®à®¾à®µà¯','horse gram (kollu)':'à®•à¯Šà®³à¯à®³à¯','horse gram flour':'à®•à¯Šà®³à¯à®³à¯ à®®à®¾à®µà¯',
    'urad dal':'à®‰à®³à¯à®¤à¯à®¤à®®à¯ à®ªà®°à¯à®ªà¯à®ªà¯','toor dal':'à®¤à¯à®µà®°à®®à¯ à®ªà®°à¯à®ªà¯à®ªà¯','chana dal':'à®•à®Ÿà®²à¯ˆà®ªà¯à®ªà®°à¯à®ªà¯à®ªà¯',
    'moong dal':'à®ªà®¾à®šà®¿à®ªà¯à®ªà®°à¯à®ªà¯à®ªà¯','yellow moong dal':'à®ªà¯Šà®©à¯à®©à®¿ à®ªà®°à¯à®ªà¯à®ªà¯','rajma':'à®°à®¾à®œà¯à®®à®¾',
    'black urad dal':'à®•à®°à¯à®ªà¯à®ªà¯ à®‰à®³à¯à®¤à¯à®¤à®®à¯','chickpeas':'à®•à¯Šà®£à¯à®Ÿà¯ˆà®•à¯à®•à®Ÿà®²à¯ˆ',
    'black chickpeas':'à®•à®°à¯à®ªà¯à®ªà¯ à®•à¯Šà®£à¯à®Ÿà¯ˆà®•à¯à®•à®Ÿà®²à¯ˆ','black-eyed peas':'à®¤à®Ÿà¯à®Ÿà¯ˆà®ªà¯à®ªà®¯à®¿à®±à¯',
    'field beans (mochai)':'à®®à¯Šà®šà¯à®šà¯ˆ','green peas':'à®ªà®Ÿà¯à®Ÿà®¾à®£à®¿','sprouted black chickpeas':'à®®à¯à®³à¯ˆà®•à®Ÿà¯à®Ÿà®¿à®¯ à®•à¯Šà®£à¯à®Ÿà¯ˆà®•à¯à®•à®Ÿà®²à¯ˆ',
    'onion':'à®µà¯†à®™à¯à®•à®¾à®¯à®®à¯','shallots':'à®šà®¿à®©à¯à®© à®µà¯†à®™à¯à®•à®¾à®¯à®®à¯','pearl onions':'à®šà®¿à®©à¯à®© à®µà¯†à®™à¯à®•à®¾à®¯à®®à¯',
    'pearl onions (vengayam)':'à®šà®¿à®©à¯à®© à®µà¯†à®™à¯à®•à®¾à®¯à®®à¯','garlic':'à®ªà¯‚à®£à¯à®Ÿà¯','ginger':'à®‡à®žà¯à®šà®¿',
    'green chilies':'à®ªà®šà¯à®šà¯ˆ à®®à®¿à®³à®•à®¾à®¯à¯','red chilies':'à®šà®¿à®µà®ªà¯à®ªà¯ à®®à®¿à®³à®•à®¾à®¯à¯',
    'dry red chilies':'à®•à®¾à®¯à¯à®¨à¯à®¤ à®®à®¿à®³à®•à®¾à®¯à¯','kashmiri chili powder':'à®•à®¾à®·à¯à®®à¯€à®°à®¿ à®®à®¿à®³à®•à®¾à®¯à¯ à®¤à¯‚à®³à¯',
    'tomato':'à®¤à®•à¯à®•à®¾à®³à®¿','tomatoes':'à®¤à®•à¯à®•à®¾à®³à®¿','carrot':'à®•à¯‡à®°à®Ÿà¯','potato':'à®‰à®°à¯à®³à¯ˆà®•à¯à®•à®¿à®´à®™à¯à®•à¯',
    'potatoes':'à®‰à®°à¯à®³à¯ˆà®•à¯à®•à®¿à®´à®™à¯à®•à¯','capsicum':'à®•à¯à®Ÿà¯ˆ à®®à®¿à®³à®•à®¾à®¯à¯','cabbage':'à®®à¯à®Ÿà¯à®Ÿà¯ˆà®•à¯‹à®¸à¯',
    'spinach':'à®ªà®¾à®²à®•à¯ à®•à¯€à®°à¯ˆ','spinach (keerai)':'à®•à¯€à®°à¯ˆ','drumstick':'à®®à¯à®°à¯à®™à¯à®•à¯ˆà®•à¯à®•à®¾à®¯à¯',
    'drumstick leaves':'à®®à¯à®°à¯à®™à¯à®•à¯ˆ à®•à¯€à®°à¯ˆ','ladies finger (vendakkai)':'à®µà¯†à®£à¯à®Ÿà¯ˆà®•à¯à®•à®¾à®¯à¯',
    'ladies finger':'à®µà¯†à®£à¯à®Ÿà¯ˆà®•à¯à®•à®¾à®¯à¯','brinjal':'à®•à®¤à¯à®¤à®¿à®°à®¿à®•à¯à®•à®¾à®¯à¯',
    'bitter gourd':'à®ªà®¾à®µà®•à¯à®•à®¾à®¯à¯','snake gourd':'à®ªà¯à®Ÿà®²à®™à¯à®•à®¾à®¯à¯','ridge gourd (peerkangai)':'à®ªà¯€à®°à¯à®•à¯à®•à®™à¯à®•à®¾à®¯à¯',
    'ivy gourd (kovakai)':'à®•à¯‹à®µà¯ˆà®•à¯à®•à®¾à®¯à¯','raw banana':'à®µà®¾à®´à¯ˆà®•à¯à®•à®¾à®¯à¯','banana flower':'à®µà®¾à®´à¯ˆà®ªà¯à®ªà¯‚',
    'banana stem':'à®µà®¾à®´à¯ˆà®¤à¯à®¤à®£à¯à®Ÿà¯','raw jackfruit':'à®ªà®²à®¾à®•à¯à®•à®¾à®¯à¯','jackfruit (chakkai)':'à®ªà®²à®¾à®ªà¯à®ªà®´à®®à¯',
    'ripe jackfruit':'à®ªà®²à®¾à®ªà¯à®ªà®´à®®à¯','ripe banana':'à®µà®¾à®´à¯ˆà®ªà¯à®ªà®´à®®à¯','mango':'à®®à®¾à®®à¯à®ªà®´à®®à¯','raw mango':'à®®à®¾à®™à¯à®•à®¾à®¯à¯',
    'pineapple':'à®…à®©à¯à®©à®¾à®šà®¿','white pumpkin':'à®µà¯†à®³à¯à®³à¯ˆ à®ªà¯‚à®šà®£à®¿','yellow pumpkin':'à®®à®žà¯à®šà®³à¯ à®ªà¯‚à®šà®£à®¿',
    'elephant foot yam':'à®šà¯‡à®©à¯ˆà®•à¯à®•à®¿à®´à®™à¯à®•à¯','taro root (arbi)':'à®šà¯‡à®ªà¯à®ªà®™à¯à®•à®¿à®´à®™à¯à®•à¯',
    'tapioca (maravalli)':'à®®à®°à®µà®³à¯à®³à®¿à®•à¯à®•à®¿à®´à®™à¯à®•à¯','yam (karunai kizhangu)':'à®•à®°à¯à®£à¯ˆà®•à¯à®•à®¿à®´à®™à¯à®•à¯',
    'cluster beans (gawar)':'à®•à¯Šà®¤à¯à®¤à®µà®°à¯ˆ','cluster beans':'à®•à¯Šà®¤à¯à®¤à®µà®°à¯ˆ',
    'broad beans (avarakkai)':'à®…à®µà®°à¯ˆà®•à¯à®•à®¾à®¯à¯','french beans':'à®ªà¯€à®©à¯à®¸à¯','mushrooms':'à®•à®¾à®³à®¾à®©à¯',
    'agathi leaves':'à®…à®•à®¤à¯à®¤à®¿à®•à¯à®•à¯€à®°à¯ˆ','brahmi leaves (vallarai)':'à®µà®²à¯à®²à®¾à®°à¯ˆ à®•à¯€à®°à¯ˆ',
    'gongura (sorrel leaves)':'à®ªà¯à®³à®¿à®šà¯à®š à®•à¯€à®°à¯ˆ','drumstick (3 pieces)':'à®®à¯à®°à¯à®™à¯à®•à¯ˆà®•à¯à®•à®¾à®¯à¯',
    'mixed greens':'à®•à®²à®¨à¯à®¤ à®•à¯€à®°à¯ˆ','mixed vegetables':'à®•à®²à®¨à¯à®¤ à®•à®¾à®¯à¯à®•à®±à®¿',
    'mustard seeds':'à®•à®Ÿà¯à®•à¯','cumin seeds':'à®šà¯€à®°à®•à®®à¯','cumin':'à®šà¯€à®°à®•à®®à¯','fenugreek seeds':'à®µà¯†à®¨à¯à®¤à®¯à®®à¯',
    'pepper':'à®®à®¿à®³à®•à¯','black pepper':'à®®à®¿à®³à®•à¯','fennel seeds':'à®šà¯‹à®®à¯à®ªà¯','asafoetida':'à®ªà¯†à®°à¯à®™à¯à®•à®¾à®¯à®®à¯',
    'turmeric':'à®®à®žà¯à®šà®³à¯','chili powder':'à®®à®¿à®³à®•à®¾à®¯à¯ à®¤à¯‚à®³à¯','coriander powder':'à®¤à®©à®¿à®¯à®¾ à®¤à¯‚à®³à¯',
    'coriander seeds':'à®¤à®©à®¿à®¯à®¾','sambar powder':'à®šà®¾à®®à¯à®ªà®¾à®°à¯ à®ªà¯Šà®Ÿà®¿','kuzhambu powder':'à®•à¯à®´à®®à¯à®ªà¯ à®ªà¯Šà®Ÿà®¿',
    'garam masala':'à®•à®°à®®à¯ à®®à®šà®¾à®²à®¾','biryani masala':'à®ªà®¿à®°à®¿à®¯à®¾à®£à®¿ à®®à®šà®¾à®²à®¾','chettinad masala':'à®šà¯†à®Ÿà¯à®Ÿà®¿à®¨à®¾à®Ÿà¯ à®®à®šà®¾à®²à®¾',
    'ginger-garlic paste':'à®‡à®žà¯à®šà®¿-à®ªà¯‚à®£à¯à®Ÿà¯ à®µà®¿à®´à¯à®¤à¯','cardamom':'à®à®²à®•à¯à®•à®¾à®¯à¯','cinnamon':'à®ªà®Ÿà¯à®Ÿà¯ˆ',
    'cloves':'à®•à®¿à®°à®¾à®®à¯à®ªà¯','bay leaf':'à®ªà®Ÿà¯à®Ÿà¯ˆ à®‡à®²à¯ˆ','star anise':'à®…à®£à¯à®£à®¾à®šà®¿à®ªà¯à®ªà¯‚',
    'kalpasi (stone flower)':'à®•à®²à¯à®ªà®¾à®šà®¿','kalpasi':'à®•à®²à¯à®ªà®¾à®šà®¿','marathi mokku':'à®®à®°à®¾à®Ÿà¯à®Ÿà®¿ à®®à¯Šà®•à¯à®•à¯',
    'carom seeds (omam)':'à®“à®®à®®à¯','whole spices':'à®®à¯à®´à¯ à®®à®šà®¾à®²à®¾','kadai masala':'à®•à®Ÿà®¾à®¯à¯ à®®à®šà®¾à®²à®¾',
    'curry leaves':'à®•à®±à®¿à®µà¯‡à®ªà¯à®ªà®¿à®²à¯ˆ','coriander':'à®•à¯Šà®¤à¯à®¤à®®à®²à¯à®²à®¿','mint leaves':'à®ªà¯à®¤à®¿à®©à®¾',
    'mint':'à®ªà¯à®¤à®¿à®©à®¾','saffron':'à®•à¯à®™à¯à®•à¯à®®à®ªà¯à®ªà¯‚','edible camphor':'à®ªà®šà¯à®šà¯ˆà®•à¯ à®•à®°à¯à®ªà¯‚à®°à®®à¯',
    'oil':'à®Žà®£à¯à®£à¯†à®¯à¯','gingelly oil':'à®¨à®²à¯à®²à¯†à®£à¯à®£à¯†à®¯à¯','coconut oil':'à®¤à¯‡à®™à¯à®•à®¾à®¯à¯ à®Žà®£à¯à®£à¯†à®¯à¯',
    'ghee':'à®¨à¯†à®¯à¯','butter':'à®µà¯†à®£à¯à®£à¯†à®¯à¯','cream':'à®•à®¿à®°à¯€à®®à¯',
    'salt':'à®‰à®ªà¯à®ªà¯','sugar':'à®šà®°à¯à®•à¯à®•à®°à¯ˆ','jaggery':'à®µà¯†à®²à¯à®²à®®à¯','rock candy (kalkandu)':'à®•à®²à¯à®•à®£à¯à®Ÿà¯',
    'honey':'à®¤à¯‡à®©à¯','condensed milk':'à®ªà®¾à®¤à®¾à®®à¯ à®ªà®¾à®²à¯','milk':'à®ªà®¾à®²à¯','curd':'à®¤à®¯à®¿à®°à¯',
    'buttermilk':'à®®à¯‹à®°à¯','coconut milk':'à®¤à¯‡à®™à¯à®•à®¾à®¯à¯ à®ªà®¾à®²à¯','coconut':'à®¤à¯‡à®™à¯à®•à®¾à®¯à¯',
    'grated coconut':'à®¤à¯à®°à¯à®µà®¿à®¯ à®¤à¯‡à®™à¯à®•à®¾à®¯à¯','dry coconut':'à®‰à®²à®°à¯ à®¤à¯‡à®™à¯à®•à®¾à®¯à¯',
    'tamarind':'à®ªà¯à®³à®¿','lemon':'à®Žà®²à¯à®®à®¿à®šà¯à®šà¯ˆ','lemon juice':'à®Žà®²à¯à®®à®¿à®šà¯à®šà¯ˆ à®šà®¾à®±à¯',
    'sago (sabudana)':'à®œà®µà¯à®µà®°à®¿à®šà®¿','sago (javvarisi)':'à®œà®µà¯à®µà®°à®¿à®šà®¿','sago':'à®œà®µà¯à®µà®°à®¿à®šà®¿',
    'flattened rice (aval)':'à®…à®µà®²à¯','flattened rice (aval/poha)':'à®…à®µà®²à¯','poha':'à®…à®µà®²à¯',
    'puffed rice (pori)':'à®ªà¯Šà®°à®¿','cashews':'à®®à¯à®¨à¯à®¤à®¿à®°à®¿','peanuts':'à®µà¯‡à®°à¯à®•à¯à®•à®Ÿà®²à¯ˆ',
    'raisins':'à®¤à®¿à®°à®¾à®Ÿà¯à®šà¯ˆ','almonds':'à®ªà®¾à®¤à®¾à®®à¯','pistachio':'à®ªà®¿à®¸à¯à®¤à®¾',
    'sesame seeds':'à®Žà®³à¯à®³à¯','white sesame seeds':'à®µà¯†à®³à¯à®³à¯ˆ à®Žà®³à¯à®³à¯',
    'poppy seeds':'à®•à®šà®•à®šà®¾','dry ginger powder':'à®šà¯à®•à¯à®•à¯ à®¤à¯‚à®³à¯','baking soda':'à®šà®®à¯ˆà®¯à®²à¯ à®šà¯‹à®Ÿà®¾',
    'yeast':'à®ˆà®¸à¯à®Ÿà¯','corn flour':'à®•à®¾à®°à¯à®©à¯ à®ƒà®ªà¯à®³à¯‹à®°à¯','besan (chickpea flour)':'à®•à®Ÿà®²à¯ˆ à®®à®¾à®µà¯',
    'besan flour':'à®•à®Ÿà®²à¯ˆ à®®à®¾à®µà¯','rice noodles (sevai)':'à®šà¯‡à®µà¯ˆ','vermicelli':'à®šà¯‡à®®à®¿à®¯à®¾',
    'roasted vermicelli':'à®µà®±à¯à®¤à¯à®¤ à®šà¯‡à®®à®¿à®¯à®¾','noodles':'à®¨à¯‚à®Ÿà¯à®²à¯à®¸à¯',
    'bread slices':'à®ªà®¿à®°à®Ÿà¯','bread':'à®ªà®¿à®°à®Ÿà¯','dinner rolls':'à®Ÿà®¿à®©à¯à®©à®°à¯ à®°à¯‹à®²à¯',
    'parotta (layered flatbread)':'à®ªà®°à¯‹à®Ÿà¯à®Ÿà®¾','parotta':'à®ªà®°à¯‹à®Ÿà¯à®Ÿà®¾','appam batter':'à®†à®ªà¯à®ªà®®à¯ à®®à®¾à®µà¯',
    'idli batter':'à®‡à®Ÿà¯à®²à®¿ à®®à®¾à®µà¯','dosa batter':'à®¤à¯‹à®šà¯ˆ à®®à®¾à®µà¯',
    'chicken':'à®•à¯‹à®´à®¿ à®‡à®±à¯ˆà®šà¯à®šà®¿','country chicken':'à®¨à®¾à®Ÿà¯à®Ÿà¯ à®•à¯‹à®´à®¿','minced chicken':'à®•à¯‹à®´à®¿ à®•à¯€à®®à®¾',
    'chicken breast':'à®•à¯‹à®´à®¿ à®®à®¾à®°à¯à®ªà¯ à®‡à®±à¯ˆà®šà¯à®šà®¿','chicken bones/pieces':'à®•à¯‹à®´à®¿ à®Žà®²à¯à®®à¯à®ªà¯',
    'chicken liver':'à®•à¯‹à®´à®¿ à®•à®²à¯à®²à¯€à®°à®²à¯','mutton':'à®†à®Ÿà¯à®Ÿà®¿à®±à¯ˆà®šà¯à®šà®¿','minced mutton':'à®†à®Ÿà¯à®Ÿà¯ à®•à¯€à®®à®¾',
    'mutton liver':'à®†à®Ÿà¯à®Ÿà¯ à®•à®²à¯à®²à¯€à®°à®²à¯','mutton brain':'à®†à®Ÿà¯à®Ÿà¯ à®®à¯‚à®³à¯ˆ','lamb trotters':'à®†à®Ÿà¯à®Ÿà¯ à®•à®¾à®²à¯',
    'lamb knuckles':'à®†à®Ÿà¯à®Ÿà¯ à®®à¯à®Ÿà¯à®Ÿà®¿','goat head meat':'à®¤à®²à¯ˆ à®‡à®±à¯ˆà®šà¯à®šà®¿',
    'lamb/goat meat':'à®†à®Ÿà¯à®Ÿà®¿à®±à¯ˆà®šà¯à®šà®¿','fish (any firm)':'à®®à¯€à®©à¯','fish steaks':'à®®à¯€à®©à¯ à®¤à¯à®£à¯à®Ÿà¯à®•à®³à¯',
    'fish slices':'à®®à¯€à®©à¯ à®¤à¯à®£à¯à®Ÿà¯à®•à®³à¯','fish fillets':'à®®à¯€à®©à¯ à®ƒà®ªà®¿à®²à¯‡','fish':'à®®à¯€à®©à¯',
    'tuna or mackerel':'à®šà¯‚à®°à¯ˆ à®®à¯€à®©à¯','canned tuna':'à®•à¯‡à®©à¯ à®šà¯‚à®°à¯ˆ à®®à¯€à®©à¯',
    'shark (sura)':'à®šà¯à®°à®¾ à®®à¯€à®©à¯','prawns':'à®‡à®±à®¾à®²à¯','large prawns':'à®ªà¯†à®°à®¿à®¯ à®‡à®±à®¾à®²à¯',
    'tiger prawns':'à®µà¯‡à®™à¯à®•à¯ˆ à®‡à®±à®¾à®²à¯','shrimps':'à®šà®¿à®±à®¿à®¯ à®‡à®±à®¾à®²à¯','crab':'à®¨à®£à¯à®Ÿà¯',
    'squid':'à®•à®£à®µà®¾à®¯à¯','quail (kaadai)':'à®•à®¾à®Ÿà¯ˆ','eggs':'à®®à¯à®Ÿà¯à®Ÿà¯ˆ','egg':'à®®à¯à®Ÿà¯à®Ÿà¯ˆ',
    'paneer':'à®ªà®©à¯à®©à¯€à®°à¯','khoya':'à®•à¯‹à®µà®¾',
    'soy sauce':'à®šà¯‹à®¯à®¾ à®šà®¾à®¸à¯','oyster sauce':'à®†à®¯à®¿à®¸à¯à®Ÿà®°à¯ à®šà®¾à®¸à¯','chaat masala':'à®šà®¾à®Ÿà¯ à®®à®šà®¾à®²à®¾',
    'green chutney':'à®ªà®šà¯à®šà¯ˆ à®šà®Ÿà¯à®©à®¿','coconut chutney':'à®¤à¯‡à®™à¯à®•à®¾à®¯à¯ à®šà®Ÿà¯à®©à®¿','sambar':'à®šà®¾à®®à¯à®ªà®¾à®°à¯',
    'idli podi (gun powder)':'à®‡à®Ÿà¯à®²à®¿ à®ªà¯Šà®Ÿà®¿','idli podi':'à®‡à®Ÿà¯à®²à®¿ à®ªà¯Šà®Ÿà®¿',
    'nine grains mix':'à®¨à®µ à®¤à®¾à®©à®¿à®¯à®®à¯','mixed grain flour':'à®•à®²à®¨à¯à®¤ à®¤à®¾à®©à®¿à®¯ à®®à®¾à®µà¯',
    'manathakkali vathal':'à®®à®£à®¤à¯à®¤à®•à¯à®•à®¾à®³à®¿ à®µà®¤à¯à®¤à®²à¯','sundakkai vathal (turkey berry)':'à®šà¯à®£à¯à®Ÿà¯ˆà®•à¯à®•à®¾à®¯à¯ à®µà®¤à¯à®¤à®²à¯',
    'turkey berry (sundakkai)':'à®šà¯à®£à¯à®Ÿà¯ˆà®•à¯à®•à®¾à®¯à¯','vathal (any sundried)':'à®µà®¤à¯à®¤à®²à¯',
    'water':'à®¤à®£à¯à®£à¯€à®°à¯','pomegranate seeds':'à®®à®¾à®¤à¯à®³à¯ˆ à®µà®¿à®¤à¯ˆ','spring onions':'à®µà¯†à®™à¯à®•à®¾à®¯à®¤à¯à®¤à®¾à®³à¯',
    'lettuce':'à®²à¯†à®Ÿà¯à®Ÿà¯‚à®¸à¯','cucumber':'à®µà¯†à®³à¯à®³à®°à®¿à®•à¯à®•à®¾à®¯à¯','mayonnaise':'à®®à®¯à¯‹à®©à¯ˆà®¸à¯',
    'ketchup':'à®•à¯†à®Ÿà¯à®šà®ªà¯','green chutney':'à®ªà®šà¯à®šà¯ˆ à®šà®Ÿà¯à®©à®¿','salna':'à®šà®¾à®²à¯à®©à®¾',
    'salna (curry gravy)':'à®šà®¾à®²à¯à®©à®¾','leftover kuzhambu':'à®®à¯€à®¤à®®à®¾à®© à®•à¯à®´à®®à¯à®ªà¯',
    'tamarind kuzhambu':'à®ªà¯à®³à®¿ à®•à¯à®´à®®à¯à®ªà¯','food colour (optional)':'à®‰à®£à®µà¯ à®µà®£à¯à®£à®®à¯',
  }
};

// Helper: get mother tongue name of an ingredient for current state
function getIngredientMTName(item){
  var cfg = STATES_CONFIG[state.selectedState||'tn'];
  if(!cfg) return '';
  var langCode = cfg.lang ? cfg.lang.code : 'ta';
  var dict = INGREDIENT_TRANSLATIONS[langCode];
  if(!dict) return '';
  return dict[item.toLowerCase()] || '';
}

// Helper: get mother tongue recipe name for current state
function getRecipeMTName(meal){
  var cfg = STATES_CONFIG[state.selectedState||'tn'];
  if(!cfg || !cfg.lang) return meal.tamil || '';
  var field = cfg.lang.recipeField;
  return meal[field] || meal.tamil || '';
}

// Helper: get language label text (e.g. "à®¤à®®à®¿à®´à¯") for current state
function getCurrentLangScript(){
  var cfg = STATES_CONFIG[state.selectedState||'tn'];
  return (cfg && cfg.lang) ? cfg.lang.script : 'à®¤à®®à®¿à®´à¯';
}


export var GROCERY_CATS_CFG = {
  nonveg: {
    label:'Non-Veg (Meat, Fish & Eggs)', emoji:'ðŸ—', color:'#B71C1C', bg:'#FFEBEE', border:'#FFCDD2',
    keys:['chicken','mutton','fish','prawn','crab','egg','liver','brain','vanjaram','king fish',
          'tuna','salmon','mackerel','sardine','tilapia','snapper','shark','mince','minced',
          'country chicken','nattu kozhi','sura','mud crab','fish fillet','fish steak',
          'fish piece','egg white','shrimp','seafood','meat']
  },
  vegetables: {
    label:'Vegetables, Fruits & Herbs', emoji:'ðŸ¥¬', color:'#1B5E20', bg:'#E8F5E9', border:'#C8E6C9',
    keys:['onion','shallot','tomato','potato','carrot','cabbage','brinjal','eggplant',
          'ladies finger','okra','beetroot','pumpkin','bottle gourd','ridge gourd',
          'chow chow','chayote','drumstick','spinach','keerai','cucumber','ash gourd',
          'white pumpkin','capsicum','peas','beans','french beans','mint','coriander',
          'curry leaves','ginger','garlic','green chili','green chil','red chili','lemon',
          'lime','coconut','tender coconut','banana','apple','papaya','grapes',
          'pomegranate','mixed fruit','fruit','lettuce','radish','yam','plantain',
          'raw banana','bitter gourd','spring onion','raw mango','tamarind','mixed vegetables',
          'mixed sprouts','sprout','mushroom','paneer salad']
  }
};

export function getDefaultPrice(item){
  const prices={rice:60,'raw rice':65,'idli rice':60,'basmati rice':120,chicken:300,mutton:700,fish:400,prawns:600,eggs:7,onion:40,tomato:30,'green chilies':60,garlic:120,ginger:80,coconut:25,'coconut milk':45,curd:50,ghee:600,oil:150,'gingelly oil':200,tamarind:80,'sambar powder':90,'chili powder':80,turmeric:60,'mustard seeds':70,'curry leaves':20,coriander:30,wheat:40,'wheat flour':50,maida:45,rava:50,'rice flour':60,vermicelli:70,noodles:60,potatoes:30,'mixed vegetables':50,carrot:40,spinach:30,peanuts:100,cashews:800,raisins:300,jaggery:60,sugar:45,milk:55,butter:500};
  const lower=item.toLowerCase();
  for(const[k,v]of Object.entries(prices))if(lower.includes(k))return v;
  return 50;
}

function buildGroceryList(){
  const groc={};
  state.mealPlan.forEach(({breakfast,lunch,dinner})=>{
    [breakfast,lunch,dinner].forEach(meal=>{
      if(!meal)return;
      scaleIng(meal.ingredients,meal.baseServing,getEffectivePeople()).forEach(function({item,qty,unit}){
        const k=item.toLowerCase();
        if(!groc[k])groc[k]={item,qty:0,unit,basePrice:getDefaultPrice(item)};
        groc[k].qty+=qty;
      });
    });
  });
  return Object.values(groc).sort((a,b)=>a.item.localeCompare(b.item));
}

function getDietMembersForGrocery(){
  var result=[];
  try{
    var prof=getMyProfile();
    var savedDietMembers=loadDietMembers();
    (prof.familyMembers||[]).forEach(function(m){
      if(m.menuType==='diet'&&(m.name||'').trim()){
        var dm=savedDietMembers.find(function(d){return d.name.toLowerCase()===m.name.trim().toLowerCase();});
        var dailyCost=0;
        if(dm&&typeof DIET_DB!=='undefined'){
          // Use average price across all meals in each slot for better accuracy
          ['breakfast','lunch','dinner','snacks'].forEach(function(slot){
            var meals=DIET_DB[slot]||[];
            if(!meals.length) return;
            var slotAvg=meals.reduce(function(s,ml){return s+(ml.price||0);},0)/meals.length;
            dailyCost+=slotAvg;
          });
        }
        result.push({name:m.name.trim(),cat:dm?dm.cat:'',cal:dm?dm.cal:0,dailyCost:Math.round(dailyCost),monthlyCost:Math.round(dailyCost*30)});
      }
    });
  }catch(e){}
  return result;
}

function getPrice(item,basePrice){
  const k=item.toLowerCase();
  return state.priceMode==='manual'&&state.customPrices[k]!=null?state.customPrices[k]:basePrice;
}


export function getGroceryCat(item){
  var k = item.toLowerCase();
  var nv = GROCERY_CATS_CFG.nonveg.keys;
  var veg = GROCERY_CATS_CFG.vegetables.keys;
  for(var i=0;i<nv.length;i++){ if(k.indexOf(nv[i])>=0) return 'nonveg'; }
  for(var i=0;i<veg.length;i++){ if(k.indexOf(veg[i])>=0) return 'vegetables'; }
  return 'grocery';
}
