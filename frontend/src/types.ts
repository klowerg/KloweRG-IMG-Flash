export type ThemeMode='system'|'dark'|'light'
export type Locale='es'|'en'
export interface ModelDescriptor { id:string; name:string; kind:'image'|'vision'; available:boolean; description:string; options:Record<string,string[]> }
export interface Generation { id:string; status:string; model:string; prompt:string; revised_prompt?:string|null; images:{id:string;url:string;width?:number|null;height?:number|null}[]; options:Record<string,unknown>; created_at:string }
