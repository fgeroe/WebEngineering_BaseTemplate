export interface Bear {
  id: string;
  name: string;
  binomial: string;
  file: string | null;
  range: string;
}

export type ImageResult =
  { ok: true; url: string } | { ok: false; reason: string };

export interface BearWithImage extends Bear {
  imageResult: ImageResult;
}
