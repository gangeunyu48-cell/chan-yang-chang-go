FROM node:22-slim

# PPT/PPTX -> PDF -> PNG conversion used by the slideshow pipeline.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libreoffice-impress \
    poppler-utils \
    fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install -g corepack@latest \
  && corepack pnpm install \
  && corepack pnpm run build

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
