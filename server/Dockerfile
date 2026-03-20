FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY index.js ./
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3005
CMD ["node", "index.js"]
