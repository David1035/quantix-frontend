function consultarProducto() {
    fetch('http://localhost:3000/api/v1/users')
        .then(r => r.json())
        .then(data => console.log(data))
        .catch(error => concole.error('Error', error))
}

consultarProducto()