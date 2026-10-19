import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database.js';
import { genres } from './movies.js';
import { createMovieService } from './tmdb.js';
import { validateRegistration,emailValid } from './validation.js';
import { hashPassword,verifyPassword,tokenHash,sessionToken,userPublic,createSession } from './auth.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createApp({dbFile=path.join(root,'data/cinefinder.sqlite'),tmdbToken='',production=false,fetcher=fetch}={}){
 const app=express(),db=openDatabase(dbFile),movies=createMovieService(tmdbToken,fetcher),attempts=new Map();
 app.disable('x-powered-by');
 app.use((req,res,next)=>{
  res.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin',
   'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://image.tmdb.org data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"});
  if(production)res.set('Strict-Transport-Security','max-age=31536000');
  next();
 });
 app.use(express.json({limit:'12kb'}));
 app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');next();});
 // Rechaza escrituras iniciadas por otros sitios (CSRF). No se habilita CORS.
 app.use('/api',(req,res,next)=>{
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
   const expected=process.env.APP_ORIGIN||`${req.protocol}://${req.get('host')}`;
   if(req.get('origin')!==expected)return res.status(403).json({error:'Origen de solicitud no permitido.'});
   if(!req.is('application/json'))return res.status(415).json({error:'Se requiere JSON.'});
  }next();
 });
 app.use('/api',(req,res,next)=>{
  const token=sessionToken(req);req.user=null;
  if(/^[a-f0-9]{64}$/.test(token))req.user=db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(tokenHash(token),Date.now())||null;
  next();
 });
 function mustLogin(req,res,next){if(!req.user)return res.status(401).json({error:'Inicia sesión para usar tu lista.'});next();}
 function limitAuth(req,res,next){
  const now=Date.now();for(const [key,v]of attempts)if(v.until<now)attempts.delete(key);
  const key=req.ip;const entry=attempts.get(key)||{count:0,until:now+10*60*1000};entry.count++;attempts.set(key,entry);
  if(entry.count>30){res.set('Retry-After',String(Math.ceil((entry.until-now)/1000)));return res.status(429).json({error:'Demasiados intentos. Espera 10 minutos y vuelve a intentarlo.'});}next();
 }
 app.get('/api/config',(req,res)=>res.json({mode:movies.mode,genres}));
 app.get('/api/auth/me',(req,res)=>res.json({user:req.user?userPublic(req.user):null}));
 app.post('/api/auth/register',limitAuth,async(req,res)=>{
  const {errors,data}=validateRegistration(req.body);if(Object.keys(errors).length)return res.status(400).json({errors});
  if(db.prepare('SELECT id FROM users WHERE email=?').get(data.email))return res.status(409).json({errors:{email:'Este correo ya está registrado. Inicia sesión.'}});
  const passwordHash=await hashPassword(data.password);let result;
  try{result=db.prepare('INSERT INTO users(name,email,password_hash,genre,created_at) VALUES (?,?,?,?,?)').run(data.name,data.email,passwordHash,data.genre,Date.now());}
  catch(e){if(String(e.message).includes('UNIQUE'))return res.status(409).json({errors:{email:'Este correo ya está registrado.'}});throw e;}
  const user=db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);createSession(db,req,res,user.id,production);res.status(201).json({user:userPublic(user)});
 });
 app.post('/api/auth/login',limitAuth,async(req,res)=>{
  const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
  const password=typeof req.body?.password==='string'?req.body.password:'';
  if(!emailValid(email)||password.length<1||password.length>128)return res.status(400).json({error:'Revisa el correo y la contraseña.'});
  const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
  const dummy='00000000000000000000000000000000:'+ '00'.repeat(64);
  const valid=await verifyPassword(password,user?.password_hash||dummy);
  if(!user||!valid)return res.status(401).json({error:'Correo o contraseña incorrectos.'});
  createSession(db,req,res,user.id,production);res.json({user:userPublic(user)});
 });
 app.post('/api/auth/logout',(req,res)=>{db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(sessionToken(req)));res.clearCookie('cine_session',{httpOnly:true,sameSite:'lax',secure:production,path:'/'});res.json({ok:true});});
 app.get('/api/movies',async(req,res)=>{
  const query=String(req.query.q||'').trim().slice(0,100),genre=Number(req.query.genre||0),sort=req.query.sort==='rating'?'rating':'popular',page=Number(req.query.page||1);
  if(!Number.isInteger(page)||page<1||page>50||(genre&&!genres.some(g=>g.id===genre)))return res.status(400).json({error:'Filtros no válidos.'});
  try{res.json(await movies.list({query,genre,sort,page}));}catch(e){res.status(502).json({error:e.message});}
 });
 app.get('/api/movies/:id',async(req,res)=>{
  const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:'Película no válida.'});
  try{const movie=await movies.detail(id);if(!movie)return res.status(404).json({error:'Película no encontrada.'});res.json({movie,mode:movies.mode});}catch(e){res.status(502).json({error:e.message});}
 });
 app.get('/api/favorites',mustLogin,(req,res)=>{const rows=db.prepare('SELECT movie_json FROM favorites WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);res.json({movies:rows.map(r=>JSON.parse(r.movie_json))});});
 app.post('/api/favorites',mustLogin,async(req,res)=>{
  const {id,saved}=req.body||{};if(!Number.isSafeInteger(id)||id<=0||typeof saved!=='boolean')return res.status(400).json({error:'Datos no válidos.'});
  if(!saved){db.prepare('DELETE FROM favorites WHERE user_id=? AND movie_id=?').run(req.user.id,id);return res.json({saved:false});}
  try{const movie=await movies.detail(id);if(!movie)return res.status(404).json({error:'Película no encontrada.'});db.prepare('INSERT OR IGNORE INTO favorites VALUES (?,?,?,?)').run(req.user.id,id,JSON.stringify(movie),Date.now());res.json({saved:true,movie});}catch(e){res.status(502).json({error:e.message});}
 });
 app.use('/api',(req,res)=>res.status(404).json({error:'Ruta no encontrada.'}));
 app.use(express.static(path.join(root,'public'),{dotfiles:'deny',index:false}));
 for(const route of ['/','/catalogo','/registro','/login','/mi-lista','/pelicula/:id'])app.get(route,(req,res)=>res.sendFile(path.join(root,'public/index.html')));
 app.use((req,res)=>res.status(404).send('Página no encontrada. Regresa a http://localhost:3000/'));
 app.use((err,req,res,next)=>{if(err.type==='entity.too.large')return res.status(413).json({error:'Solicitud demasiado grande.'});if(err instanceof SyntaxError)return res.status(400).json({error:'JSON no válido.'});console.error('Error interno:',err.code||err.name);res.status(500).json({error:'Ocurrió un error interno. Intenta de nuevo.'});});
 return {app,db};
}
