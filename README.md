# TP IASC 2019

## API Rest para DB Clave-Valor distribuida

### Instalación
```
npm install
```

```
npm run-script build
```

### Desarrollo
```
npm run-script dev
```

Utiliza nodemon para actualizar los cambios automáticamente al guardar.

### Producción
```
npm start
```

### Uso
```
localhost:4000/db/:key?value=123
```

### Métodos

* **GET:** devuelve el **_value_** de la **_key_** ingresada como parámetro de ruta.
* **POST:** agrega una nueva **_key_** con su respectivo **_value_**.
* **PUT:** modifica la **_key_** con su respectivo **_value_**.
* **DELETE:** borra la **_key_**.

#### Rutas

En el archivo __Insomnia.json__ se puede importar el workspace completo de la API para utilizar con el software [Insomnia REST Client](https://insomnia.rest/)