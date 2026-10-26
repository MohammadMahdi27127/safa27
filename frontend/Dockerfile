# مرحله اول: بیلد پروژه فرانت
FROM node:20-alpine AS builder
WORKDIR /app

# کپی فایل‌های پکیج از پوشه frontend
COPY frontend/package*.json ./
RUN npm install

# کپی کل سورس فرانت‌اند
COPY frontend/ .
RUN npm run build

# مرحله دوم: اجرا با Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
