import {BookOpen,CheckCircle2,Clock3,LibraryBig,ShieldCheck} from 'lucide-react';

export default function DiscipleshipWorkspace(){
 return <div className="discipleship-workspace">
  <div className="notice neutral"><ShieldCheck size={19}/><span>La estructura de formación está preparada. Todavía no se guardan respuestas ni avances hasta cargar el contenido oficial de los libros.</span></div>
  <section className="panel discipleship-catalog">
   <div className="panelheading"><div><span className="eyebrow">BIBLIOTECA DE FORMACIÓN</span><h2>Libros disponibles</h2><p>Ordena aquí las etapas que verá cada discípulo.</p></div><LibraryBig size={20}/></div>
   <div className="discipleship-book-row"><span className="discipleship-book-icon"><BookOpen size={21}/></span><div><b>Discipulado 1</b><small>Contenido y actividades pendientes de carga</small></div><span className="status pending"><Clock3 size={13}/>Preparación</span></div>
  </section>
  <section className="panel discipleship-review">
   <div className="panelheading"><div><span className="eyebrow">SEGUIMIENTO</span><h2>Avance de discípulos</h2><p>Los líderes verán libros iniciados, pendientes y completados dentro de su alcance.</p></div><CheckCircle2 size={20}/></div>
   <div className="empty"><Clock3 size={28}/><h3>Aún no hay avances para revisar</h3><p>Cuando se publique el primer libro, aquí aparecerá el progreso real de cada persona.</p></div>
  </section>
 </div>;
}
