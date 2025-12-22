# Use Node.js 20 (Bookworm for GLIBC 2.36 support, required by c2patool v0.25.0)
FROM node:20-bookworm

# 1. Install System Dependencies
# ffmpeg: Video processing
# qpdf: PDF processing
# libreoffice: Document conversion
# ca-certificates: For HTTPS
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Install c2patool (CLI)
# Downloading an OLDER release (v0.19.2) to ensure GLIBC compatibility.
ENV C2PA_TOOL_VERSION=0.19.2
RUN curl -L https://github.com/contentauth/c2pa-rs/releases/download/c2patool-v${C2PA_TOOL_VERSION}/c2patool-v${C2PA_TOOL_VERSION}-x86_64-unknown-linux-gnu.tar.gz -o c2pa.tar.gz \
    && tar -xzf c2pa.tar.gz \
    && find . -type f -name c2patool -exec mv {} /usr/local/bin/c2patool \; \
    && chmod +x /usr/local/bin/c2patool \
    && rm -rf c2pa.tar.gz c2patool*

# 3. Setup App Directory
WORKDIR /app

# 4. Install Node Dependencies
COPY package.json package-lock.json* ./
RUN npm install

# 5. Copy Source Code
COPY tsconfig.json ./
COPY src ./src

# 6. Build (if using TS)
RUN npm run build

# 7. Start the Worker
# We'll use the compiled JS
CMD ["node", "dist/worker.js"]
