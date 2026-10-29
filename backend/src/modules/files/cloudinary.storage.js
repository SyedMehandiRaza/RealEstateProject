import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const assertInPrefix = (publicId) => {
  if (!publicId.startsWith(env.cloudinaryPrefix)) {
    throw new Error(`Refusing to touch a Cloudinary file outside ${env.cloudinaryPrefix}`);
  }
};

// Cloudinary adapter. Every file is an 'authenticated' (non-public) asset under realestate/<env>/ (DEC-016).
export const cloudinaryStorage = {
  prefix: env.cloudinaryPrefix,

  // Server-generated id, never derived from the user's filename. Raw files keep their extension.
  newPublicId(folder, resourceType, extension = 'pdf') {
    const id = `${env.cloudinaryPrefix}${folder}/${crypto.randomUUID()}`;
    return resourceType === 'raw' ? `${id}.${extension}` : id;
  },

  upload(buffer, { publicId, resourceType }) {
    assertInPrefix(publicId);
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: resourceType, type: 'authenticated', overwrite: false },
        (error, result) =>
          error
            ? reject(error)
            : resolve({
                publicId: result.public_id,
                resourceType: result.resource_type,
                deliveryType: result.type,
              }),
      );
      stream.end(buffer);
    });
  },

  // Idempotent: a file that is already gone counts as deleted.
  async destroy({ publicId, resourceType, deliveryType }) {
    assertInPrefix(publicId);
    const { result } = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: deliveryType,
      invalidate: true,
    });
    if (result !== 'ok' && result !== 'not found') {
      throw new Error(`Cloudinary destroy returned "${result}"`);
    }
  },

  // Every asset of one kind under the app prefix, following pagination (Admin API, rate limited).
  async *list({ resourceType, deliveryType }) {
    let nextCursor;
    do {
      const page = await cloudinary.api.resources({
        resource_type: resourceType,
        type: deliveryType,
        prefix: env.cloudinaryPrefix,
        max_results: 500,
        next_cursor: nextCursor,
      });
      for (const resource of page.resources) {
        yield {
          publicId: resource.public_id,
          resourceType: resource.resource_type,
          deliveryType: resource.type,
          createdAt: new Date(resource.created_at),
        };
      }
      nextCursor = page.next_cursor;
    } while (nextCursor);
  },
};
