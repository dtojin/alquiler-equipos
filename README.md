Cómo descargar el proyecto

**Opción A: archivo ZIP**
1. En esta página pulse el botón verde **Code** y luego **Download ZIP**.
2. Descomprima el archivo.
3. Entre a la carpeta que contiene `backend` y `frontend`

4. Cómo ejecutarlo

El sistema tiene **dos partes y cada una necesita su propia terminal abierta al mismo tiempo**. Puede abrir ambas desde Visual Studio Code con **File → Open Folder** y **Terminal → New Terminal**.

### Terminal 1: Backend (puerto 3001)

```
cd backend
npm install
npm start

Debe aparecer el mensaje:

API lista en http://localhost:3001
Deje esta terminal abierta.

### Terminal 2: Frontend (puerto 5173)

cd frontend
npm install
npm run dev


Abra en el navegador: **http://localhost:5173**

> La dirección `http://localhost:3001` es solo la API. Al abrirla en el navegador puede mostrar "Cannot GET /": es normal. El sistema se usa desde **http://localhost:5173**.
