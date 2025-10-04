FROM node:18-slim
WORKDIR /app
COPY prisma ./prisma/
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
