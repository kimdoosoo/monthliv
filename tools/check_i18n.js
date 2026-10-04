/* Checks that every translation key used in the code exists in the 6 built-in languages.
   node tools/check_i18n.js */
const fs = require('fs'), path = require('path');
const S = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
const src = ['core.js','map.js','user.js','console.js','pms.js','admin.js','main.js'].map(S).join('\n');
eval(S('i18n_ko_en.js').replace('const I18N_VERSION','var I18N_VERSION').replace('const I18N =','global.I18N ='));
eval(S('i18n_more.js'));
const used = new Set();
for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) used.add(m[1]);
for (const m of src.matchAll(/'((?:cp|book|my)\.(?:ok|err)\.[A-Za-z]+)'/g)) used.add(m[1]);
const dyn = { 'am.': ['private_bath','aircon','wifi','desk','fridge','washer','kitchen','kitchenette','lounge','towels','luggage','elevator','smartlock','cctv'],
 'bk.': ['confirmed','staying','done','cancelled'], 'cp.st.': ['active','used','expired','ended','paused','notyet','void'], 'cp.via.': ['code','unique','direct','signup'],
 'hl.': ['flagship','near_station','long_stay','short_stay','business','university','hospital','family','foreigner','new_open','quiet','airport','nature'],
 'how.': ['1.h','1.p','2.h','2.p','3.h','3.p','4.h','4.p'], 'line.': ['GJ','SB','SL','SBD','AREX','UI'], 'opt.': ['window','kitchen','washer','deposit0','open'],
 'pay.': ['card','easy','intl','transfer'], 'per.': ['night','week','month'], 'qty.': ['night','week','month','guests'], 'rt.bath.': ['private','shared'],
 'rt.bed.': ['single','double','queen','bunk'], 'rt.win.': ['outer','inner','none'], 'sort.': ['rec','price','walk','new'], 'tour.st.': ['requested','confirmed','done','cancelled'],
 'type.': ['stay','hostel','residence','hotel','stay.unit','hostel.unit','residence.unit','hotel.unit','stay.desc','hostel.desc','residence.desc','hotel.desc'], 'unit.': ['night','week','month'] };
for (const [p, list] of Object.entries(dyn)) { used.delete(p); for (const x of list) used.add(p + x); }
for (const k of [...used]) if (/\.$/.test(k)) used.delete(k);
for (const L of ['ko','en','ja','zh-CN','zh-TW','vi']) {
  const d = I18N[L]; const miss = [...used].filter(k => !(k in d)); const extra = Object.keys(d).filter(k => !used.has(k) && !k.endsWith('_one'));
  console.log(L, Object.keys(d).length, 'missing:', miss.join(' ') || '-', '| unused:', extra.join(' ') || '-');
}
