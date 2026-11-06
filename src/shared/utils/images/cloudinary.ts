/** Derivatives keep the original asset intact and avoid loading large PNGs. */
export function cloudinaryImage(source: string, width = 800): string {
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com")
      return source;
    const marker = "/image/upload/";
    const [prefix, tail] = source.split(marker);
    if (!tail) return source;
    const version = tail.match(/(?:^|\/)(v\d+\/.*)$/)?.[1];
    return version
      ? `${prefix}${marker}f_auto,q_auto,c_limit,w_${width}/${version}`
      : source;
  } catch {
    return source;
  }
}
