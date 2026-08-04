import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Router } from 'express';
import { validate as isUuid } from 'uuid';

type RouteOptions = {
  cacheDir: string | null;
};

type ImageResolution = {
  url: string;
  contentType: string;
};

function parseCardId(value: unknown) {
  if (typeof value !== 'string' || !isUuid(value)) {
    return { ok: false as const, error: 'cardId must be a valid UUID string' };
  }
  return { ok: true as const, value };
}

function parseBack(value: unknown) {
  if (value == null) return { ok: true as const, value: false };
  if (value === 'true') return { ok: true as const, value: true };
  if (value === 'false') return { ok: true as const, value: false };
  return { ok: false as const, error: "back must be 'true' or 'false' when provided" };
}

function chooseImageUrl(card: any, back: boolean): ImageResolution | null {
  if (card?.card_faces?.length) {
    const face = back ? card.card_faces[1] : card.card_faces[0];
    const imageUris = face?.image_uris;
    if (imageUris?.large) return { url: imageUris.large, contentType: 'image/jpeg' };
    if (imageUris?.normal) return { url: imageUris.normal, contentType: 'image/jpeg' };
    if (imageUris?.png) return { url: imageUris.png, contentType: 'image/png' };
    if (imageUris?.small) return { url: imageUris.small, contentType: 'image/jpeg' };
  }

  const imageUris = card?.image_uris;
  if (imageUris?.large) return { url: imageUris.large, contentType: 'image/jpeg' };
  if (imageUris?.normal) return { url: imageUris.normal, contentType: 'image/jpeg' };
  if (imageUris?.png) return { url: imageUris.png, contentType: 'image/png' };
  if (imageUris?.small) return { url: imageUris.small, contentType: 'image/jpeg' };

  return null;
}

async function fetchCardMetadata(cardId: string) {
  const response = await fetch(`https://api.scryfall.com/cards/${cardId}`, {
    headers: {
      'User-Agent': 'tts-scryfall-image-proxy/0.1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Scryfall lookup failed with ${response.status}`);
  }

  return response.json();
}

function extensionFromUrl(url: string, fallbackContentType: string) {
  const lower = url.toLowerCase();
  if (lower.endsWith('.png')) return '.png';
  if (lower.endsWith('.webp')) return '.webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return '.jpg';
  if (fallbackContentType.includes('png')) return '.png';
  if (fallbackContentType.includes('webp')) return '.webp';
  return '.bin';
}

async function cacheImage(url: string, cacheDir: string, fallbackContentType: string) {
  const hash = createHash('sha256').update(url).digest('hex');
  const extension = extensionFromUrl(url, fallbackContentType);
  const filePath = path.join(cacheDir, `${hash}${extension}`);

  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    // continue to download
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'tts-scryfall-image-proxy/0.1.0',
      Accept: 'image/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function fetchImageBuffer(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'tts-scryfall-image-proxy/0.1.0',
      Accept: 'image/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed with ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export function createImageRoutes({ cacheDir }: RouteOptions) {
  const router = Router();

  router.get('/card/:cardId', async (req, res) => {
    const cardIdResult = parseCardId(req.params.cardId);
    const backResult = parseBack(req.query.back);

    if (!cardIdResult.ok || !backResult.ok) {
      return res.status(400).json({
        error: 'invalid_request',
        details: {
          cardId: cardIdResult.ok ? undefined : cardIdResult.error,
          back: backResult.ok ? undefined : backResult.error,
        },
      });
    }

    try {
      const card = await fetchCardMetadata(cardIdResult.value);
      const imageResolution = chooseImageUrl(card, backResult.value);
      if (!imageResolution) {
        return res.status(404).json({ error: 'not_found', message: 'No image available for this card' });
      }

      if (!cacheDir) {
        const buffer = await fetchImageBuffer(imageResolution.url);
        res.type(imageResolution.contentType);
        return res.send(buffer);
      }

      const filePath = await cacheImage(imageResolution.url, cacheDir, imageResolution.contentType);
      return res.sendFile(filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(502).json({ error: 'upstream_error', message });
    }
  });

  return router;
}
