import { endpoints } from "../../assets/js/apiConfig.js";

export async function authLogin(data) {
    const res = await fetch(endpoints.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if(!res.ok) throw new Error("Error al crear usuario");
    return await res.json();
}