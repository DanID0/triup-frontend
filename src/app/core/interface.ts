export enum Language {
    LATVIAN = 'LATVIAN',
    ENGLISH = 'ENGLISH',
    RUSSIAN = 'RUSSIAN'
  }
export interface User {
    id: string;
    username: string;
    email: string;
    interfaceLanguage: Language;
}