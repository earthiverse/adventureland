FROM node:23-alpine

ENV NODE_ENV=production

# Install jq
RUN apk add --no-cache jq

# Setup the base directory
WORKDIR /app

# Copy code
COPY packages/game-server/config ./config
COPY packages/game-server/src ./src
COPY packages/game-server/package.json .

# Remove dev dependencies
RUN jq 'del(.devDependencies)' package.json > package.json.tmp && mv package.json.tmp package.json

# Install dependencies
RUN npm install --omit=dev

# Start
USER node
ENTRYPOINT ["node", "--experimental-transform-types", "src/index.ts"]

HEALTHCHECK --interval=60s --timeout=5s --start-period=30s --start-interval=5s --retries=2 \
    CMD wget -q -O - http://127.0.0.1/api/status | grep -q '"status":"OK"' || exit 1
