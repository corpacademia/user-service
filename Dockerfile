# use official node LTS
FROM node:18-alpine

# create app dir and non-root user
WORKDIR /usr/src/app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# copy package files first for better caching
COPY package*.json ./

# use npm ci for reproducible installs if package-lock.json exists
RUN if [ -f package-lock.json ]; then npm ci --production; else npm install --production; fi

# copy source files (includes templates directory)
COPY . .

# set an explicit env path to the template inside the image
ENV HTML_TEMPLATE_PATH=/usr/src/app/templates/email-verification-template.html
ENV NODE_ENV=production
ENV PORT=3001

# ensure correct ownership & permissions for the appuser
RUN chown -R appuser:appgroup /usr/src/app \
    && chmod -R 755 /usr/src/app

USER appuser

EXPOSE 3001

# small healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2 http://127.0.0.1:3001/health || exit 1

CMD ["node", "server.js"]
