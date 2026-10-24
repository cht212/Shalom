export const MAX_DEVOTIONAL_AUDIO_BYTES=2_500_000;
export const MAX_DEVOTIONAL_AUDIO_SECONDS=180;
export const devotionalAudioTypes=['audio/webm','audio/mp4','audio/mpeg','audio/wav'] as const;
export type DevotionalAudioType=typeof devotionalAudioTypes[number];
export class AudioValidationError extends Error{}
export function normalizeAudioType(type:string):DevotionalAudioType|null{
 const mime=type.split(';')[0].trim().toLowerCase();
 if(mime==='audio/x-m4a'||mime==='video/mp4')return 'audio/mp4';
 if(mime==='audio/x-wav')return 'audio/wav';
 return devotionalAudioTypes.includes(mime as DevotionalAudioType)?mime as DevotionalAudioType:null;
}
export function audioExtension(type:DevotionalAudioType){return {'audio/webm':'webm','audio/mp4':'m4a','audio/mpeg':'mp3','audio/wav':'wav'}[type]}
export function validateDevotionalAudio(bytes:Uint8Array,type:string):DevotionalAudioType{
 const mime=normalizeAudioType(type);
 if(!mime)throw new AudioValidationError('Este formato de audio no es compatible. Vuelve a grabar desde Shalom.');
 if(bytes.length<12)throw new AudioValidationError('La grabación está vacía o incompleta. Vuelve a grabar.');
 if(bytes.length>MAX_DEVOTIONAL_AUDIO_BYTES)throw new AudioValidationError('El audio es demasiado grande. Graba una reflexión más corta.');
 const text=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
 const valid=mime==='audio/webm'?bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3:
  mime==='audio/mp4'?text(4,8)==='ftyp':
  mime==='audio/wav'?text(0,4)==='RIFF'&&text(8,12)==='WAVE':
  text(0,3)==='ID3'||bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0;
 if(!valid)throw new AudioValidationError('El archivo no corresponde a una grabación válida. Vuelve a grabar.');
 return mime;
}
