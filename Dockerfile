FROM node:8 as build

WORKDIR /app
COPY package.json app.js ./
COPY . .
RUN npm install --production

FROM gcr.io/distroless/nodejs

COPY --from=build /app /
EXPOSE 3000
CMD ["app.js"]
