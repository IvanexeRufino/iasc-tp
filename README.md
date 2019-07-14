## TP IASC 2019

### API Rest para DB Clave-Valor distribuida

#### Instalación
* Es necesario tener instalado [Node.js](https://nodejs.org/) en el sistema.

```
npm install
```

```
npm run-script build
```

#### Desarrollo
##### Nodos Orquestadores
```
npm run-script orquestador port
```

##### Nodos de Datos
```
npm run-script datos port
```

* En el archivo _config.hjson_ se encuentra la configuración de los puertos.

* Se utiliza nodemon para actualizar los cambios automáticamente al guardar.

#### Producción
```
npm index.js
```

* Correr los _index.js_ de cada modulo luego del build.

### Uso
#### Insertar una Key
* **PUT**
```
localhost:4000/db/:key?value=123
```

* Inserta la **_key_** con su respectivo **_value_**.
* De existir la **_key_** se sobrescribe su **_value_**.

#### Leer una Key
* **GET**
```
localhost:4000/db/:key
```

* Devuelve el **_value_** de la **_key_** ingresada como parámetro de ruta.

#### Leer todas las Key o un rango
* **GET**
```
localhost:4000/db?gt=x&lt=y
```

* Sin parámetros devuelve todas las **_key_** de todos los nodos de datos.
* Con el parámetro **gt** devuelve todas las **_key_** con sus **_value_** mayores a **x**.
* Con el parámetro **lt** devuelve todas las **_key_** con sus **_value_** menores a **y**.
* Se pueden combinar ambos operadores.


#### Eliminar una Key
**DELETE** 
```
localhost:4000/db/:key
```

* Borra la **_key_**.

#### Rutas

En el archivo __Insomnia.json__ se puede importar el workspace completo de la API para utilizar con el software [Insomnia REST Client](https://insomnia.rest/)