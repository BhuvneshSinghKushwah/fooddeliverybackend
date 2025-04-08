
FROM node:23

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3010

CMD ["npm", "start"]
