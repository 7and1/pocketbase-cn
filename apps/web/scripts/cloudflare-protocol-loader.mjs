// Node.js loader to handle cloudflare: protocol
export function load(url, context, nextLoad) {
  if (url.startsWith("cloudflare:")) {
    // Return an empty module for cloudflare: imports during build-time validation
    return {
      format: "module",
      source: "export default {};",
    };
  }
  return nextLoad(url, context);
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("cloudflare:")) {
    return {
      format: "module",
      url: specifier,
    };
  }
  return nextResolve(specifier, context, nextResolve);
}
