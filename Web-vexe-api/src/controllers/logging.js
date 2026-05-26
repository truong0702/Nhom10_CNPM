export const log = (tag, obj) => {
  try {
    const payload = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    console.info(`[bookingController] ${tag}`, payload);
  } catch (e) {
    console.info(`[bookingController] ${tag}`, obj);
  }
};
