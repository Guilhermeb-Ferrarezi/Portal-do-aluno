# ---------- deps (cache) ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# se você usa prisma, descomenta:
# RUN npx prisma generate

RUN npm run build


# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# instala só deps de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# copia build compilado
COPY --from=build /app/dist ./dist

# se seu backend usa arquivos extras em runtime, copie aqui (ex: views, public, etc)
# COPY --from=build /app/public ./public

# prisma runtime (se usar):
# COPY --from=build /app/prisma ./prisma

EXPOSE 3000

# ajuste se seu arquivo inicial for outro:
CMD ["node", "dist/index.js"]
