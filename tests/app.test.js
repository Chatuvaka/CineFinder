import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
async function start(options={}){const {app,db}=createApp({dbFile:':memory:',...options});const server=app.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${server.address().port}`;return {db,origin,async close(){server.closeAllConnections();await new Promise(r=>server.close(r));db.close();},async req(route,{body,cookie,originOverride,method}={}){const r=await fetch(origin+route,{method:method||(body?'POST':'GET'),headers:{...(body?{'Content-Type':'application/json',Origin:originOverride||origin}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});const text=await r.text();return {status:r.status,data:r.headers.get('content-type')?.includes('json')?JSON.parse(text):text,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};}};}
const account=(email='cine@example.com')=>({name:'Cinéfilo de prueba',email,password:'ClavePrueba123!',confirmPassword:'ClavePrueba123!',genre:'878',accept:true});
test('Registro, validación, sesiones, favoritos privados y cierre de sesión',async t=>{
 const s=await start();t.after(()=>s.close());
 for(const url of ['/','/catalogo','/registro','/login','/mi-lista','/pelicula/693134'])assert.equal((await s.req(url)).status,200);
 assert.equal((await s.req('/.env')).status,404);assert.equal((await s.req('/data/cinefinder.sqlite')).status,404);
 let r=await s.req('/api/auth/register',{body:{name:'a',email:'invalido',password:'a',confirmPassword:'b'}});assert.equal(r.status,400);assert.ok(r.data.errors.name&&r.data.errors.email&&r.data.errors.password&&r.data.errors.confirmPassword);
 r=await s.req('/api/auth/register',{body:account(),originOverride:'https://sitio-ajeno.example'});assert.equal(r.status,403);
 r=await s.req('/api/auth/register',{body:account()});assert.equal(r.status,201);const a=r.cookie;assert.ok(r.headers.get('set-cookie').includes('HttpOnly'));assert.ok(!JSON.stringify(r.data).includes('password'));
 const row=s.db.prepare('SELECT password_hash FROM users').get();assert.notEqual(row.password_hash,account().password);assert.ok(!row.password_hash.includes(account().password));
 assert.equal((await s.req('/api/auth/register',{body:account()})).status,409);
 assert.equal((await s.req('/api/auth/login',{body:{email:account().email,password:'incorrecta'}})).status,401);
 assert.equal((await s.req('/api/favorites')).status,401);
 r=await s.req('/api/movies?q=interestelar');assert.equal(r.data.mode,'demo');assert.equal(r.data.results[0].id,157336);
 r=await s.req('/api/favorites',{cookie:a,body:{id:157336,saved:true}});assert.equal(r.status,200);
 assert.equal((await s.req('/api/favorites',{cookie:a})).data.movies.length,1);
 const b=(await s.req('/api/auth/register',{body:account('otra@example.com')})).cookie;
 assert.equal((await s.req('/api/favorites',{cookie:b})).data.movies.length,0);
 await s.req('/api/favorites',{cookie:b,body:{id:157336,saved:false}});assert.equal((await s.req('/api/favorites',{cookie:a})).data.movies.length,1);
 await s.req('/api/auth/logout',{cookie:a,body:{}});assert.equal((await s.req('/api/auth/me',{cookie:a})).data.user,null);
 r=await s.req('/api/auth/login',{body:{email:account().email,password:account().password}});assert.equal(r.status,200);
 const newCookie=r.cookie;assert.notEqual(newCookie,a);assert.equal((await s.req('/api/favorites',{cookie:newCookie})).data.movies.length,1);
 await s.req('/api/favorites',{cookie:newCookie,body:{id:157336,saved:false}});assert.equal((await s.req('/api/favorites',{cookie:newCookie})).data.movies.length,0);
 assert.equal((await s.req('/api/movies?page=1.5')).status,400);
});
test('Usuarios, sesiones y favoritos sobreviven a un reinicio',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'cinefinder-'));let s;try{s=await start({dbFile:path.join(dir,'test.sqlite')});const c=(await s.req('/api/auth/register',{body:account()})).cookie;await s.req('/api/favorites',{cookie:c,body:{id:693134,saved:true}});await s.close();s=await start({dbFile:path.join(dir,'test.sqlite')});assert.equal((await s.req('/api/auth/me',{cookie:c})).data.user.email,account().email);assert.equal((await s.req('/api/favorites',{cookie:c})).data.movies[0].id,693134);}finally{if(s)await s.close();rmSync(dir,{recursive:true,force:true});}
});
test('TMDB se consulta desde el servidor; un fallo no se disfraza como muestra',async t=>{
 let calls=0;const s=await start({tmdbToken:'token-ficticio-de-prueba',fetcher:async(url,opts)=>{calls++;assert.equal(url.hostname,'api.themoviedb.org');assert.equal(opts.headers.Authorization,'Bearer token-ficticio-de-prueba');return new Response(JSON.stringify({page:1,total_pages:1,total_results:1,results:[{id:1,title:'Prueba API',overview:'Prueba',genre_ids:[28],vote_average:7,adult:false}]}),{status:200});}});t.after(()=>s.close());
 const r=await s.req('/api/movies');assert.equal(r.data.mode,'live');assert.equal(r.data.results[0].title,'Prueba API');assert.ok(!JSON.stringify(r.data).includes('token-ficticio'));await s.req('/api/movies');assert.equal(calls,1);
 const bad=await start({tmdbToken:'invalid-test-token',fetcher:async()=>new Response('{}',{status:401})});t.after(()=>bad.close());assert.equal((await bad.req('/api/movies')).status,502);
});
