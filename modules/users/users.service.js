import { endpoints } from "../../assets/js/apiConfig.js";

export async function getAllUsers(){
    const res = await fetch(endpoints.users);
    if(!res.ok) throw new Error("Error al consultar usuarios");
    return await res.json();
}

export async function createUser(data) {
    const res = await fetch(endpoints.users, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if(!res.ok) throw new Error("Error al crear usuario");
    return await res.json();
}