import {audioExtension,type DevotionalAudioType} from './devotional-audio';
export class TranscriptionServiceError extends Error{}

export async function transcribeDevotional(bytes:Uint8Array<ArrayBuffer>,mime:DevotionalAudioType,context:string,options:{key:string;model?:string;fetcher?:typeof fetch}){
 const form=new FormData();
 form.set('file',new Blob([bytes],{type:mime}),'devocional.'+audioExtension(mime));
 form.set('model',options.model||'gpt-transcribe');
 form.set('prompt',`Reflexión devocional en español sobre ${context}. Palabras bíblicas: Jesús, Jehová, Espíritu Santo, Shalom. Transcribir lo que dice la persona, sin completar ni inventar frases.`);
 const response=await (options.fetcher||fetch)('https://api.openai.com/v1/audio/transcriptions',{
  method:'POST',headers:{Authorization:'Bearer '+options.key},body:form,signal:AbortSignal.timeout(65000),
 });
 if(!response.ok)throw new TranscriptionServiceError(response.status===429?'El servicio de transcripción está ocupado. Inténtalo más tarde.':'No se pudo convertir el audio a texto. Conservamos tu grabación para que puedas reintentarlo.');
 const result=await response.json() as {text?:unknown};
 if(typeof result.text!=='string'||result.text.trim().length<2)throw new TranscriptionServiceError('No se entendió la grabación. Escúchala y vuelve a intentarlo.');
 if(result.text.length>10000)throw new TranscriptionServiceError('La reflexión es demasiado larga. Graba una versión más corta.');
 return result.text.trim();
}
