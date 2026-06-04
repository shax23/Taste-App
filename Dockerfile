FROM node:20-slim

# openssl is required by Prisma's query engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production

# start:railway = prisma migrate deploy → seed-if-empty → next start -p $PORT
CMD ["npm", "run", "start:railway"]
