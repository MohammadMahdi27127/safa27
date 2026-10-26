FROM node:20-alpine

WORKDIR /app

# کپی فایل‌های پکیج از پوشه فرانت‌اند
COPY frontend/package*.json ./
RUN npm install

# کپی سورس‌کد فرانت‌اند
COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
