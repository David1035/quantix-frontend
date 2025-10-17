import { getAllUsers, createUser } from "./modules/users/users.service.js";

async function  imprimirDatos() {
    try {
        const data = await getAllUsers();
        console.log(data)
    } catch (error) {
        console.error("Error", error)
    }
}

imprimirDatos()

// const usuarioNew = {
//     email: "lingotes2l85@gmail.com",
//     password: "Juanita51541563",
//     role: "admin2"
// }

// async function  crearUser(data) {
//     try {
//         const newUser = await createUser(data);
//         console.log(JSON.stringify(newUser))
//     } catch (error) {
//         console.error("Error", error)
//     }
// }

// crearUser(usuarioNew);