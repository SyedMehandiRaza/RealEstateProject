import request from 'supertest';
import { fileBytes } from './documentFiles.js';

// Staged wizard uploads for property tests (PROP-007): real POST /api/properties/uploads requests, so the
// tokens are the ones the API issues.

const FILE_BY_PURPOSE = {
  image: ['image/jpeg', 'photo.jpg'],
  video: ['video/mp4', 'walkthrough.mp4'],
  tour_360: ['video/mp4', 'tour.mp4'],
  floor_plan: ['application/pdf', 'floor-plan.pdf'],
  document: ['application/pdf', 'document.pdf'],
};

// Stages one file for `purpose` and returns its upload token.
export async function stageToken(app, accessToken, purpose) {
  const [mimeType, fileName] = FILE_BY_PURPOSE[purpose];
  const res = await request(app)
    .post('/api/properties/uploads')
    .set('Authorization', `Bearer ${accessToken}`)
    .field('purpose', purpose)
    .attach('file', fileBytes(mimeType), fileName);
  if (res.status !== 201) throw new Error(`stageToken: upload failed with ${res.status}`);
  return res.body.data.upload.uploadToken;
}

// A valid Add Property Submit body (shared parity `valid` case) with real tokens: 1 configuration with
// `floorPlans` floor plans, `images` images, `videos` videos, `tours` tours, the 4 required documents and
// an Other document when `other` is true. `overrides` replace top-level fields.
export async function createBody(
  app,
  accessToken,
  base,
  { floorPlans = 1, images = 2, videos = 1, tours = 1, other = true, overrides = {} } = {},
) {
  // One at a time, so the storage receives the files in body order.
  const stage = async (purpose, count) => {
    const tokens = [];
    for (let i = 0; i < count; i += 1) tokens.push(await stageToken(app, accessToken, purpose));
    return tokens;
  };
  const document = () => stageToken(app, accessToken, 'document');
  return {
    ...base,
    configurations: [{ ...base.configurations[0], floorPlans: await stage('floor_plan', floorPlans) }],
    media: {
      images: await stage('image', images),
      videos: await stage('video', videos),
      tours: await stage('tour_360', tours),
    },
    documents: {
      reraCertificate: await document(),
      floorPlan: await document(),
      legalNoc: await document(),
      ownershipProof: await document(),
      ...(other && { other: await document() }),
    },
    ...overrides,
  };
}
