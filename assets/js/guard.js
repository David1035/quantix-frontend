import { getToken, clearToken } from "./apiConfig.js";

export function requireAuth(){
  const t = getToken();
  if(!t){ window.location.href = "./login.html"; }
}

export function logout(){
  clearToken();
  window.location.href = "./login.html";
}
