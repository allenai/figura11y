# NOTE: This Dockerfile is only used in development (see prod.Dockerfile for production)
FROM node:18-alpine

# Setup a spot for our code
WORKDIR /ui

# Install dependencies
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile

# Copy in the source code
RUN rm -rf .next
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

ENV NODE_ENV development
ENV PORT 3000

ENTRYPOINT [ "yarn" ]
CMD [ "dev" ]