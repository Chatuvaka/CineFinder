import { randomBytes,scrypt,timingSafeEqual,createHash } from 'node:crypto';
import { promisify } from 'node:util';
const derive=promisify(scrypt);
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');const hash=await derive(password,salt,64);return `${salt}:${hash.toString('hex')}`;}
export async function verifyPassword(password,stored){const [salt,key]=stored.split(':');const calculated=await derive(password,salt,64);const expected=Buffer.from(key,'hex');return expected.length===calculated.length&&timingSafeEqual(expected,calculated);}
export function tokenHash(token){return createHash('sha256').update(token).digest('hex');}
export function sessionToken(req){return (req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('cine_session='))?.slice('cine_session='.length)||'';}
export function userPublic(u){return {id:u.id,name:u.name,email:u.email,genre:u.genre};}
export function createSession(db,req,res,userId,secure){
 const old=sessionToken(req);if(old)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(old));
 db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
 const token=randomBytes(32).toString('hex'),maxAge=7*24*60*60*1000;
 db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(tokenHash(token),userId,Date.now()+maxAge);
 res.cookie('cine_session',token,{httpOnly:true,sameSite:'lax',secure,path:'/',maxAge});
}
