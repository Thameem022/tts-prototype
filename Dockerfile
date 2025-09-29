FROM python:3.11-slim AS backend
WORKDIR /app
ENV PIP_NO_CACHE_DIR=1
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend .

FROM node:20 AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --silent
COPY frontend .
RUN npm run build

FROM nginx:alpine
COPY --from=frontend /app/dist /usr/share/nginx/html
COPY --from=backend /app /backend
COPY nginx.conf /etc/nginx/nginx.conf

RUN apk add --no-cache python3 py3-pip && \
	python3 -m venv /venv && \
	/venv/bin/pip install --no-cache-dir fastapi==0.112.0 uvicorn[standard]==0.30.3 httpx==0.27.0 python-dotenv==1.0.1

RUN printf '#!/bin/sh\n\n/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --app-dir /backend &\nnginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
