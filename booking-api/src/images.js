// Checks for uploaded pictures (campaign and before & after). The staff page shrinks
// pictures before upload; D1 rows can hold 2 MB, so 1.5 MB leaves room.
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 1500000;

/** Returns null if the bytes are a real JPEG/PNG/WebP of the claimed type, otherwise an error code. */
export function checkImage(type, bytes) {
  if (!IMAGE_TYPES.includes(type)) return "image_type";
  if (!bytes.length) return "image_empty";
  if (bytes.length > MAX_IMAGE_BYTES) return "image_too_large";
  // Check the file really starts like the type it claims to be.
  const startsWith = (...b) => b.every((v, i) => bytes[i] === v);
  const real = type === "image/jpeg" ? startsWith(0xff, 0xd8, 0xff)
    : type === "image/png" ? startsWith(0x89, 0x50, 0x4e, 0x47)
    : startsWith(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return real ? null : "image_type";
}

/** A stored picture as a response browsers may cache for a year (its address changes with every upload). */
export function imageResponse(image) {
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(image.bytes, {
    headers: { "Content-Type": image.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
