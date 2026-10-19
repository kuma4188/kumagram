# [Stage 1] Node.js 환경에서 React 코드를 초고속 정적 파일(dist)로 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# [Stage 2] 가벼운 Nginx 웹 서버에 빌드된 결과물만 쏙 옮겨 담기
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]