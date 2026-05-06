FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm install -g nodemon
COPY . .
RUN npx prisma generate
CMD ["nodemon", "--legacy-watch", "--exec", "tsx", "src/index.ts", "--ext", "ts"]
