FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# FORCE build log show
RUN npm run build

# VERIFY dist exists
RUN ls -la dist

EXPOSE 5004

CMD ["node", "dist/main.js"]