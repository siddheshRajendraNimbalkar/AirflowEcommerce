
# Stage 1: Build Go application
FROM golang:1.26.10-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o /api ./cmd/api

# Stage 2: Production image
FROM alpine:3.22

WORKDIR /app

COPY --from=builder /api ./api

EXPOSE 8081

CMD ["./api"]
