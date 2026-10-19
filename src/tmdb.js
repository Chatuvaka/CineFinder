import { demoMovies } from './movies.js';
// Todas las solicitudes autenticadas a TMDB se realizan en el servidor.
export function createMovieService(token='',fetcher=fetch){
 const cache=new Map(); const mode=token.trim()?'live':'demo';
 async function request(endpoint,params={}){
  const url=new URL(`https://api.themoviedb.org/3/${endpoint}`);
  url.searchParams.set('language','es-MX');for(const [key,value] of Object.entries(params))url.searchParams.set(key,String(value));
  const key=url.toString(),hit=cache.get(key);if(hit&&hit.until>Date.now())return hit.value;
  const response=await fetcher(url,{headers:{Authorization:`Bearer ${token.trim()}`,Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(response.status===401?'TMDB rechazó el token. Revisa TMDB_READ_TOKEN en .env.':'TMDB no está disponible. Intenta de nuevo en unos momentos.');
  const value=await response.json();if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,{value,until:Date.now()+60000});return value;
 }
 function safe(m){return {id:m.id,title:m.title,overview:m.overview,poster_path:m.poster_path,backdrop_path:m.backdrop_path,release_date:m.release_date,vote_average:Number(m.vote_average)||0,genre_ids:m.genre_ids||m.genres?.map(g=>g.id)||[],genres:m.genres||[],runtime:m.runtime||0,tagline:m.tagline||''};}
 return {mode,
  async list({query='',genre=0,sort='popular',page=1}){
   if(mode==='demo'){
    const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    let results=demoMovies.filter(m=>(!query||norm(m.title).includes(norm(query)))&&(!genre||m.genre_ids.includes(genre)));
    if(sort==='rating')results=[...results].sort((a,b)=>b.vote_average-a.vote_average);
    return {mode,results:page===1?results:[],page,total_pages:1,total_results:results.length};
   }
   const d=await request(query?'search/movie':'discover/movie',{include_adult:false,page,...(query?{query}:{sort_by:sort==='rating'?'vote_average.desc':'popularity.desc','vote_count.gte':sort==='rating'?300:30,...(genre?{with_genres:genre}:{})})});
   // TMDB no ofrece un filtro de género en search/movie: se filtra la página recibida.
   return {mode,results:(d.results||[]).filter(m=>!m.adult&&(!genre||m.genre_ids.includes(genre))).map(safe),page:d.page,total_pages:Math.min(50,d.total_pages||1),total_results:d.total_results};
  },
  async detail(id){const m=mode==='demo'?demoMovies.find(m=>m.id===id):await request(`movie/${id}`);if(!m||m.adult)return null;return safe(m);}
 };
}
