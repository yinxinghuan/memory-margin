import type {Locale} from './story'

export function detectLocale(override:string|null, languages:readonly string[]):Locale {
 if(override==='zh'||override==='en')return override
 return (languages[0]??'en').toLowerCase().startsWith('zh')?'zh':'en'
}
