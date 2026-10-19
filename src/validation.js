import { genres } from './movies.js';
export const emailValid=s=>typeof s==='string'&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export function validateRegistration(body){
 const b=body&&typeof body==='object'?body:{};
 const name=typeof b.name==='string'?b.name.trim():'';
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
 const password=typeof b.password==='string'?b.password:'';
 const genre=String(b.genre||'');const errors={};
 if(name.length<2||name.length>60)errors.name='Escribe un nombre de entre 2 y 60 caracteres.';
 if(!emailValid(email))errors.email='Escribe un correo electrónico válido.';
 if(password.length<8||password.length>128)errors.password='Usa entre 8 y 128 caracteres.';
 if(password!==b.confirmPassword)errors.confirmPassword='Las contraseñas no coinciden.';
 if(!genres.some(g=>String(g.id)===genre))errors.genre='Selecciona tu género favorito.';
 if(b.accept!==true)errors.accept='Acepta el uso de tus datos para crear tu cuenta.';
 return {errors,data:{name,email,password,genre}};
}
