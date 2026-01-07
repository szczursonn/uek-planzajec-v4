FROM node:24.12-alpine3.22 AS web-client-builder
WORKDIR /app

RUN apk add git

COPY . ./
WORKDIR /app/web-client
RUN npm install
RUN npm run build

FROM golang:1.25.5-alpine AS server-builder
WORKDIR /app

COPY . ./
WORKDIR /app/server
RUN go mod download

COPY --from=web-client-builder /app/web-client/dist internal/server/static
RUN go build -o uekpz4 cmd/server/server.go

FROM scratch
WORKDIR /app

COPY --from=server-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=server-builder /app/server/uekpz4 ./

CMD [ "./uekpz4" ]