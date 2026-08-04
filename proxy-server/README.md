# TTS Scryfall Image Proxy

A small HTTP proxy that resolves Scryfall card images and serves them back to the caller, with optional filesystem caching.

## What it does

- Accepts requests like `/v1/card/:cardId`
- Resolves card metadata from the Scryfall API
- Selects the front or back face image
- Optionally downloads and caches the image locally
- Serves the cached file, or streams it directly when filesystem caching is disabled

## Requirements

- Node.js 20+
- npm

## Configuration

The server reads its configuration from environment variables.

Available variables:

- `HOST`: bind address. Defaults to `0.0.0.0`.
- `PORT`: listening port. Defaults to `8787`.
- `CACHE_DIR`: cache directory path. Defaults to `./cache` relative to the compiled server output. Set it to an empty value to disable filesystem caching.

## Setup

```bash
cd proxy-server
npm install
```

## Run

Development mode:

```bash
HOST=0.0.0.0 PORT=8787 npm run dev
```


Production build:

```bash
npm run build
node --env-file=.env dist/server.js
```

## API

### Health

Returns process liveness.

```bash
curl http://127.0.0.1:8787/health
```


### Service info

Lists the supported proxy route.

```bash
curl http://127.0.0.1:8787/v1
```

### Card image

```bash
curl http://127.0.0.1:8787/v1/card/<card-id>
```

For the back face of a double-faced card:

```bash
curl "http://127.0.0.1:8787/v1/card/<card-id>?back=true"
```
