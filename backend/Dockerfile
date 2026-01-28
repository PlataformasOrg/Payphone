FROM node:20-alpine

WORKDIR /app

# Copiamos package para instalar dependencias primero (cache)
COPY package*.json ./
RUN npm install --omit=dev

# Copiamos el resto del backend
COPY . .

# Puerto del backend (tu server debe escuchar en 3001)
EXPOSE 3001

# Arranque
CMD ["npm", "start"]
