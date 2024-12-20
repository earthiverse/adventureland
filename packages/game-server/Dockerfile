FROM node:23-alpine

ENV NODE_ENV production

# Install jq
RUN apk add --no-cache jq

# Setup the base directory
WORKDIR /app

# Copy code
COPY packages/game-server/src ./src
COPY packages/game-server/package.json .

# Remove dev dependencies
RUN jq 'del(.devDependencies)' package.json > package.json.tmp && mv package.json.tmp package.json

# Install dependencies
RUN npm install --omit=dev

# Start
USER node
ENTRYPOINT ["node", "--experimental-strip-types", "--experimental-transform-types", "src/index.ts"]