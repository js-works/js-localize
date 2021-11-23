var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};

// src/main/internal/utils.ts
var defaultFirstDayOfWeek = 1;
var defaultWeekendDays = Object.freeze([0, 6]);
var DefaultDateFormat = Object.freeze({
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});
var localeInfoMap = new Map();
function getLocaleInfo(locale) {
  let info = localeInfoMap.get(locale);
  if (!info) {
    info = new Intl.Locale(locale);
    localeInfoMap.set(locale, info);
  }
  return info;
}
var firstDayOfWeekData = {
  0: "AG,AS,AU,BD,BR,BS,BT,BW,BZ,CA,CN,CO,DM,DO,ET,GT,GU,HK,HN,ID,IL,IN,JM,JP,KE,KH,KR,LA,MH,MM,MO,MT,MX,MZ,NI,NP,PA,PE,PH,PK,PR,PT,PY,SA,SG,SV,TH,TT,TW,UM,US,VE,VI,WS,YE,ZA,ZW",
  1: "AD,AI,AL,AM,AN,AR,AT,AX,AZ,BA,BE,BG,BM,BN,BY,CH,CL,CM,CR,CY,CZ,DE,DK,EC,EE,ES,FI,FJ,FO,FR,GB,GE,GF,GP,GR,HR,HU,IE,IS,IT,KG,KZ,LB,LI,LK,LT,LU,LV,MC,MD,ME,MK,MN,MQ,MY,NL,NO,NZ,PL,RE,RO,RS,RU,SE,SI,SK,SM,TJ,TM,TR,UA,UY,UZ,VA,VN,XK",
  5: "MV",
  6: "AE,AF,BH,DJ,DZ,EG,IQ,IR,JO,KW,LY,OM,QA,SD,SY"
};
var firstDayOfWeekByCountryCode;
function getFirstDayOfWeek(locale) {
  if (!firstDayOfWeekByCountryCode) {
    firstDayOfWeekByCountryCode = new Map();
    for (const firstDayOfWeek of Object.keys(firstDayOfWeekData)) {
      const firstDay = firstDayOfWeek;
      const countryCodes = firstDayOfWeekData[firstDay].split(",");
      countryCodes.forEach((countryCode) => {
        firstDayOfWeekByCountryCode.set(countryCode, firstDay);
      });
    }
  }
  const region = getLocaleInfo(locale).region;
  return region ? firstDayOfWeekByCountryCode.get(region) || defaultFirstDayOfWeek : defaultFirstDayOfWeek;
}
var weekendData = {
  "5+6": "AE,BH,DZ,EG,IL,IQ,JO,KW,LY,OM,QA,SA,SD,SY,YE",
  "4+5": "AF",
  "6": "IN,UG",
  "5": "IR"
};
var weekendDaysByCountryCode;
function getWeekendDays(locale) {
  if (!weekendDaysByCountryCode) {
    weekendDaysByCountryCode = new Map();
    for (const [key, value] of Object.entries(weekendData)) {
      const days = Object.freeze(key.split("+").map((it) => parseInt(it)));
      const countryCodes = value.split(",");
      countryCodes.forEach((countryCode) => {
        weekendDaysByCountryCode.set(countryCode, days);
      });
    }
  }
  const region = getLocaleInfo(locale).region;
  return region ? weekendDaysByCountryCode.get(region) || defaultWeekendDays : defaultWeekendDays;
}
var numberParserByLocale = new Map();
function parseNumber(locale, numberString) {
  let numberParser = numberParserByLocale.get(locale);
  if (!numberParser) {
    const example = Intl.NumberFormat(locale).format(3.4);
    if (example.indexOf("3") !== 0 || example.indexOf("4") !== 2 || example.length !== 3) {
      throw new Error("Unsupported locale for automatic number parser");
    }
    const separators = new Set(Intl.NumberFormat(locale).format(123456789).replace(/\d/g, "").split(""));
    if (separators.size > 1) {
      throw new Error("Unsupported locale for automatic number parser");
    }
    const decimalSeparator = example[1];
    const digitGroupSeparator = [...separators.values()][0] || "";
    const regExp = new RegExp(`^\\d(\\d|${escapeRegExp(digitGroupSeparator)})*(${escapeRegExp(decimalSeparator)}\\d+)?$`);
    numberParser = (s) => {
      if (!s.match(regExp)) {
        return null;
      }
      let numberString2 = s;
      if (digitGroupSeparator) {
        numberString2 = numberString2.replaceAll(digitGroupSeparator, "");
      }
      numberString2 = numberString2.replace(decimalSeparator, ".");
      let number = parseFloat(numberString2);
      if (numberString2 !== number.toString()) {
        return null;
      }
      return number;
    };
    numberParserByLocale.set(locale, numberParser);
  }
  return numberParser(numberString);
}
function parseDate(locale, dateString) {
  return getDateParser(locale)(dateString);
}
var dateParserByLocale = new Map();
function getDateParser(locale) {
  let dateParser = dateParserByLocale.get(locale);
  if (!dateParser) {
    const example = Intl.DateTimeFormat(locale).format(new Date("2100-11-23"));
    if (example.indexOf("2100") === -1 || example.indexOf("11") === -1 || example.indexOf("23") === -1) {
      dateParserByLocale.set(locale, parseIsoDateString);
      return parseIsoDateString;
    }
    const regExp = new RegExp("^" + escapeRegExp(example).replace("2100", "\\s*(?<year>\\d{1,4})\\s*").replace("11", "\\s*(?<month>\\d{1,2})\\s*").replace("23", "\\s*(?<day>\\d{1,2})\\s*") + "$");
    dateParser = (s) => {
      const match = regExp.exec(s);
      if (!match) {
        return null;
      }
      const { year, month, day } = match.groups;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };
    dateParserByLocale.set(locale, dateParser);
  }
  return dateParser;
}
function formatNumber(locale, value, format) {
  return new Intl.NumberFormat(locale, format).format(value);
}
function formatDate(locale, value, format) {
  if (!format) {
    if (getDateParser(locale) === parseIsoDateString) {
      return value.toISOString().substr(0, 10);
    }
    format = DefaultDateFormat;
  }
  return new Intl.DateTimeFormat(locale, format).format(value);
}
function parseIsoDateString(s) {
  return new Date(s);
}
function getCalendarWeek(locale, date) {
  const weekstart = getFirstDayOfWeek(locale);
  const target = new Date(date);
  const dayNum = (date.getDay() + 7 - weekstart) % 7;
  target.setDate(target.getDate() - dayNum + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + (4 - target.getDay() + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 6048e5);
}
function formatRelativeTime(locale, value, unit, format) {
  return new Intl.RelativeTimeFormat(locale, format).format(value, unit);
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/main/internal/dict.ts
var SEP = "|@:_:_:_:@|";
var _translations;
var Dictionary = class {
  constructor() {
    __privateAdd(this, _translations, new Map());
  }
  addTranslation(locale, category, key, translation) {
    __privateGet(this, _translations).set(`${locale}${SEP}${category}${SEP}${key}`, translation);
  }
  translate(locale, category, key, params) {
    const { baseName, language } = getLocaleInfo(locale);
    let ret = __privateGet(this, _translations).get(`${locale}${SEP}${category}${SEP}${key}`) || null;
    if (ret === null && locale) {
      if (baseName !== locale) {
        ret = __privateGet(this, _translations).get(`${baseName}${SEP}${category}${SEP}${key}`) || null;
      }
      if (ret === null) {
        if (language !== baseName) {
          ret = __privateGet(this, _translations).get(`${language}${SEP}${category}${SEP}${key}`) || null;
        }
      }
    }
    if (ret !== null && params) {
      if (typeof ret !== "function") {
        console.log(ret);
        throw new Error(`Invalid translation parameters for category ${category} key "${key}" in locale "${locale}"`);
      }
      ret = String(ret(params));
    }
    console.log("--->", locale, category, key, ":::", ret);
    return ret === null ? ret : String(ret);
  }
};
_translations = new WeakMap();

// src/main/js-localize.ts
function addToDict(translations) {
  for (const [language, data] of Object.entries(translations)) {
    for (const [category, terms] of Object.entries(data)) {
      for (const [key, value] of Object.entries(terms)) {
        dict.addTranslation(language, category, key, value);
      }
    }
  }
}
function init(params) {
  if (isFinal) {
    throw "Illegal invocation of `init(...)`- must only be used at start of the app before any other localization function has been used";
  }
  isFinal = true;
  if (params.defaultLocale) {
    defaultLocale = params.defaultLocale;
  }
  if (params.customize) {
    const self = { ...baseBehavior };
    behavior = Object.assign(self, params.customize(self, baseBehavior, defaultLocale));
  }
}
function localize(localeOrGetLocale) {
  const getLocale = typeof localeOrGetLocale === "function" ? () => localeOrGetLocale() || defaultLocale : () => localeOrGetLocale || defaultLocale;
  isFinal = true;
  return createLocalizer(getLocale, behavior);
}
function check(arg1, arg2) {
  return typeof arg1 === "string" ? arg2 : arg1;
}
var dict = new Dictionary();
var isFinal = false;
var defaultLocale = "en-US";
var baseBehavior = {
  translate: dict.translate.bind(dict),
  formatNumber,
  formatDate,
  parseNumber,
  parseDate,
  formatRelativeTime,
  getFirstDayOfWeek,
  getCalendarWeek,
  getWeekendDays
};
var behavior = {
  ...baseBehavior,
  translate(locale, category, key, replacements) {
    let translation = baseBehavior.translate(locale, category, key, replacements);
    if (translation === null && defaultLocale !== locale) {
      translation = baseBehavior.translate(defaultLocale, category, key, replacements);
    }
    return translation;
  }
};
function createLocalizer(getLocale, i18n) {
  const localizer = {
    getLocale,
    translate: (category, key, replacements) => i18n.translate(getLocale(), category, key, replacements) || "",
    parseNumber: (numberString) => i18n.parseNumber(getLocale(), numberString),
    parseDate: (dateString) => i18n.parseDate(getLocale(), dateString),
    formatNumber: (number, format) => i18n.formatNumber(getLocale(), number, format),
    formatDate: (date, format) => i18n.formatDate(getLocale(), date, format),
    formatRelativeTime: (number, unit, format) => i18n.formatRelativeTime(getLocale(), number, unit, format),
    getFirstDayOfWeek: () => i18n.getFirstDayOfWeek(getLocale()),
    getWeekendDays: () => i18n.getWeekendDays(getLocale()),
    getCalendarWeek: (date) => i18n.getCalendarWeek(getLocale(), date),
    getDayName(index, format = "long") {
      const date = new Date(1970, 0, 4 + index % 7);
      return new Intl.DateTimeFormat(getLocale(), { weekday: format }).format(date);
    },
    getDayNames(format = "long") {
      const arr = [];
      for (let i = 0; i < 7; ++i) {
        arr.push(localizer.getDayName(i, format));
      }
      return arr;
    },
    getMonthName(index, format = "long") {
      const date = new Date(1970, index % 12, 1);
      return new Intl.DateTimeFormat(getLocale(), { month: format }).format(date);
    },
    getMonthNames(format = "long") {
      const arr = [];
      for (let i = 0; i < 12; ++i) {
        arr.push(localizer.getMonthName(i, format));
      }
      return arr;
    }
  };
  return localizer;
}
export {
  addToDict,
  check,
  init,
  localize
};
//# sourceMappingURL=js-localize.esm.js.map
