const PLAYLIST_SOURCE = 'https://iptv-org.github.io/iptv/index.m3u';
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 12_000;

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
  json: (body: unknown) => void;
  end: () => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(PLAYLIST_SOURCE, {
      signal: controller.signal,
      headers: {
        Accept: 'application/x-mpegURL, text/plain, */*',
        'User-Agent': 'OpenTV/1.0 (+https://github.com/iptv-org/iptv)',
      },
    });

    if (!upstream.ok) {
      res.status(502).json({
        error: `Playlist source responded with ${upstream.status}`,
      });
      return;
    }

    const contentLength = Number(upstream.headers.get('content-length') ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      res.status(502).json({ error: 'Playlist source response is too large' });
      return;
    }

    const body = await upstream.text();

    if (body.length > MAX_RESPONSE_BYTES) {
      res.status(502).json({ error: 'Playlist source response is too large' });
      return;
    }

    res.setHeader('Content-Type', 'application/x-mpegURL; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600',
    );
    res.status(200).send(body);
  } catch {
    res.status(504).json({ error: 'Playlist source timed out' });
  } finally {
    clearTimeout(timeout);
  }
}
