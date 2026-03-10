(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/actions/data:0d258f [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateOtpForSession",
    ()=>$$RSC_SERVER_ACTION_2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"40773b80055c2741001e9e06d3f511c7379145f412":"generateOtpForSession"},"lib/actions/otp.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("40773b80055c2741001e9e06d3f511c7379145f412", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "generateOtpForSession");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vb3RwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHNlcnZlclwiO1xuXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tIFwiQC9saWIvZGJcIjtcbmltcG9ydCB7IGdldFNlc3Npb24gfSBmcm9tIFwiQC9saWIvYXV0aFwiO1xuaW1wb3J0IHsgc2VuZFNpbmdsZVNtcyB9IGZyb20gXCJAL2xpYi9zbXMtZ2F0ZXdheVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUGhvbmUsIHNlbmRPdHBTY2hlbWEsIHZlcmlmeU90cFNjaGVtYSB9IGZyb20gXCJAL2xpYi92YWxpZGF0aW9uc1wiO1xuaW1wb3J0IGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgeyBQcmlzbWEgfSBmcm9tIFwiQHByaXNtYS9jbGllbnRcIjtcblxuY29uc3QgT1RQX0VYUElSWV9NUyA9IDUgKiA2MCAqIDEwMDA7IC8vIDUgbWludXRlc1xuY29uc3QgTUFYX0FUVEVNUFRTID0gNTtcbmNvbnN0IE1BWF9PVFBfUEVSX1BIT05FX1BFUl9XSU5ET1cgPSAzOyAvLyAzIHBlciA1IG1pbiAoYXJjaGl0ZWN0IHNwZWMgIzEwMClcbmNvbnN0IE9UUF9SQVRFX1dJTkRPV19NUyA9IDUgKiA2MCAqIDEwMDA7IC8vIDUgbWludXRlc1xuY29uc3QgT1RQX0NSRURJVF9DT1NUID0gMTtcblxudHlwZSBHZW5lcmF0ZU90cE9wdGlvbnMgPSB7XG4gIGRlYnVnPzogYm9vbGVhbjtcbn07XG5cbmZ1bmN0aW9uIGdldE90cEhhc2hTZWNyZXQoKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwbGljaXRTZWNyZXQgPSBwcm9jZXNzLmVudi5PVFBfSEFTSF9TRUNSRVQ/LnRyaW0oKTtcbiAgaWYgKGV4cGxpY2l0U2VjcmV0KSByZXR1cm4gZXhwbGljaXRTZWNyZXQ7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk9UUF9IQVNIX1NFQ1JFVCBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgfVxuXG4gIHJldHVybiBwcm9jZXNzLmVudi5KV1RfU0VDUkVUIHx8IFwic21zb2stb3RwLWRldi1zZWNyZXRcIjtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVPdHAoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNyeXB0by5yYW5kb21JbnQoMTAwMDAwLCA5OTk5OTkpLnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUmVmQ29kZSgpOiBzdHJpbmcge1xuICByZXR1cm4gY3J5cHRvLnJhbmRvbUJ5dGVzKDQpLnRvU3RyaW5nKFwiaGV4XCIpLnRvVXBwZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIGhhc2hPdHAoY29kZTogc3RyaW5nLCByZWZDb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY3J5cHRvXG4gICAgLmNyZWF0ZUhtYWMoXCJzaGEyNTZcIiwgZ2V0T3RwSGFzaFNlY3JldCgpKVxuICAgIC51cGRhdGUoYCR7cmVmQ29kZX06JHtjb2RlfWApXG4gICAgLmRpZ2VzdChcImhleFwiKTtcbn1cblxuZnVuY3Rpb24gdGltaW5nU2FmZU1hdGNoKGxlZnQ6IHN0cmluZywgcmlnaHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBhID0gQnVmZmVyLmZyb20obGVmdCk7XG4gIGNvbnN0IGIgPSBCdWZmZXIuZnJvbShyaWdodCk7XG4gIHJldHVybiBhLmxlbmd0aCA9PT0gYi5sZW5ndGggJiYgY3J5cHRvLnRpbWluZ1NhZmVFcXVhbChhLCBiKTtcbn1cblxuZnVuY3Rpb24gaGFzU21zR2F0ZXdheUNyZWRlbnRpYWxzKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gQm9vbGVhbihcbiAgICBwcm9jZXNzLmVudi5TTVNfQVBJX1VTRVJOQU1FPy50cmltKCkgJiZcbiAgICBwcm9jZXNzLmVudi5TTVNfQVBJX1BBU1NXT1JEPy50cmltKClcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVxdWlyZVNlc3Npb25Vc2VySWQoKSB7XG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBnZXRTZXNzaW9uKCk7XG4gIGlmICghdXNlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVuYXV0aG9yaXplZFwiKTtcbiAgfVxuICByZXR1cm4gdXNlci5pZDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlT3RwXyhcbiAgdXNlcklkOiBzdHJpbmcsXG4gIHBob25lOiBzdHJpbmcsXG4gIHB1cnBvc2U6IHN0cmluZyA9IFwidmVyaWZ5XCIsXG4gIG9wdGlvbnM6IEdlbmVyYXRlT3RwT3B0aW9ucyA9IHt9XG4pIHtcbiAgY29uc3QgaW5wdXQgPSBzZW5kT3RwU2NoZW1hLnBhcnNlKHsgcGhvbmUsIHB1cnBvc2UgfSk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRQaG9uZSA9IG5vcm1hbGl6ZVBob25lKGlucHV0LnBob25lKTtcbiAgY29uc3QgZGVidWdNb2RlID0gb3B0aW9ucy5kZWJ1ZyA9PT0gdHJ1ZSAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCI7XG5cbiAgLy8gUmF0ZSBsaW1pdDogbWF4IDMgT1RQcyBwZXIgcGhvbmUgcGVyIDUgbWluIChhcmNoaXRlY3Qgc3BlYyAjMTAwKVxuICBjb25zdCB3aW5kb3dTdGFydCA9IG5ldyBEYXRlKERhdGUubm93KCkgLSBPVFBfUkFURV9XSU5ET1dfTVMpO1xuICBjb25zdCByZWNlbnRDb3VudCA9IGF3YWl0IHByaXNtYS5vdHBSZXF1ZXN0LmNvdW50KHtcbiAgICB3aGVyZTogeyBwaG9uZTogbm9ybWFsaXplZFBob25lLCBjcmVhdGVkQXQ6IHsgZ3RlOiB3aW5kb3dTdGFydCB9IH0sXG4gIH0pO1xuXG4gIGlmIChyZWNlbnRDb3VudCA+PSBNQVhfT1RQX1BFUl9QSE9ORV9QRVJfV0lORE9XKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwi4Liq4LmI4LiHIE9UUCDguKHguLLguIHguYDguIHguLTguJnguYTguJsg4LiB4Lij4Li44LiT4Liy4Lij4LitIDUg4LiZ4Liy4LiX4Li1XCIpO1xuICB9XG5cbiAgLy8gQ2hlY2sgdXNlciBjcmVkaXRzXG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICB3aGVyZTogeyBpZDogdXNlcklkIH0sXG4gICAgc2VsZWN0OiB7IGNyZWRpdHM6IHRydWUgfSxcbiAgfSk7XG5cbiAgaWYgKCF1c2VyIHx8IHVzZXIuY3JlZGl0cyA8IE9UUF9DUkVESVRfQ09TVCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIuC5gOC4hOC4o+C4lOC4tOC4leC5hOC4oeC5iOC5gOC4nuC4teC4ouC4h+C4nuC4rVwiKTtcbiAgfVxuXG4gIGNvbnN0IGNvZGUgPSBnZW5lcmF0ZU90cCgpO1xuICBjb25zdCByZWZDb2RlID0gZ2VuZXJhdGVSZWZDb2RlKCk7XG4gIGNvbnN0IGV4cGlyZXNBdCA9IG5ldyBEYXRlKERhdGUubm93KCkgKyBPVFBfRVhQSVJZX01TKTtcbiAgY29uc3QgY29kZUhhc2ggPSBoYXNoT3RwKGNvZGUsIHJlZkNvZGUpO1xuXG4gIC8vIENyZWF0ZSBPVFAgcmVjb3JkICsgZGVkdWN0IGNyZWRpdCBpbiB0cmFuc2FjdGlvblxuICBsZXQgb3RwUmVjb3JkOiB7IGlkOiBzdHJpbmc7IHJlZkNvZGU6IHN0cmluZzsgcGhvbmU6IHN0cmluZzsgcHVycG9zZTogc3RyaW5nOyBleHBpcmVzQXQ6IERhdGUgfTtcbiAgbGV0IHVwZGF0ZWRVc2VyOiB7IGNyZWRpdHM6IG51bWJlciB9O1xuXG4gIHRyeSB7XG4gICAgW290cFJlY29yZCwgdXBkYXRlZFVzZXJdID0gYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihbXG4gICAgICBwcmlzbWEub3RwUmVxdWVzdC5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIHJlZkNvZGUsXG4gICAgICAgICAgcGhvbmU6IG5vcm1hbGl6ZWRQaG9uZSxcbiAgICAgICAgICBjb2RlOiBjb2RlSGFzaCxcbiAgICAgICAgICBwdXJwb3NlOiBpbnB1dC5wdXJwb3NlLFxuICAgICAgICAgIGV4cGlyZXNBdCxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgaWQ6IHRydWUsXG4gICAgICAgICAgcmVmQ29kZTogdHJ1ZSxcbiAgICAgICAgICBwaG9uZTogdHJ1ZSxcbiAgICAgICAgICBwdXJwb3NlOiB0cnVlLFxuICAgICAgICAgIGV4cGlyZXNBdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgcHJpc21hLnVzZXIudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IHVzZXJJZCB9LFxuICAgICAgICBkYXRhOiB7IGNyZWRpdHM6IHsgZGVjcmVtZW50OiBPVFBfQ1JFRElUX0NPU1QgfSB9LFxuICAgICAgICBzZWxlY3Q6IHsgY3JlZGl0czogdHJ1ZSB9LFxuICAgICAgfSksXG4gICAgXSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKFxuICAgICAgZXJyb3IgaW5zdGFuY2VvZiBQcmlzbWEuUHJpc21hQ2xpZW50S25vd25SZXF1ZXN0RXJyb3IgJiZcbiAgICAgIGVycm9yLmNvZGUgPT09IFwiUDIwMDJcIlxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwi4Liq4Lij4LmJ4Liy4LiHIE9UUCDguYTguKHguYjguKrguLPguYDguKPguYfguIgg4LiB4Lij4Li44LiT4Liy4Lil4Lit4LiH4LmD4Lir4Lih4LmIXCIpO1xuICAgIH1cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIC8vIFNlbmQgT1RQIHZpYSBTTVNcbiAgY29uc3QgbWVzc2FnZSA9IGDguKPguKvguLHguKogT1RQIOC4guC4reC4h+C4hOC4uOC4k+C4hOC4t+C4rSAke2NvZGV9ICjguKvguKHguJTguK3guLLguKLguLjguYPguJkgNSDguJnguLLguJfguLUpYDtcbiAgbGV0IGRlbGl2ZXJ5OiBcInNtc1wiIHwgXCJkZWJ1Z1wiID0gXCJzbXNcIjtcbiAgaWYgKGRlYnVnTW9kZSAmJiAhaGFzU21zR2F0ZXdheUNyZWRlbnRpYWxzKCkpIHtcbiAgICAvLyBMb2NhbGhvc3QgdGVzdGluZyBwYXRoOiBrZWVwIFByaXNtYSBmbG93IHJlYWwsIGV4cG9zZSB0aGUgT1RQIGluc3RlYWQgb2YgcmVxdWlyaW5nIFNNUyBpbmZyYS5cbiAgICBkZWxpdmVyeSA9IFwiZGVidWdcIjtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VuZFNpbmdsZVNtcyhpbnB1dC5waG9uZSwgbWVzc2FnZSwgXCJFYXN5U2xpcFwiKTtcbiAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvciB8fCBcIuC4quC5iOC4hyBPVFAg4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOC4geC4o+C4uOC4k+C4suC4peC4reC4h+C5g+C4q+C4oeC5iFwiKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFJlZnVuZCBjcmVkaXQgb24gc2VuZCBmYWlsdXJlXG4gICAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKFtcbiAgICAgICAgcHJpc21hLm90cFJlcXVlc3QuZGVsZXRlKHsgd2hlcmU6IHsgaWQ6IG90cFJlY29yZC5pZCB9IH0pLFxuICAgICAgICBwcmlzbWEudXNlci51cGRhdGUoe1xuICAgICAgICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfSxcbiAgICAgICAgICBkYXRhOiB7IGNyZWRpdHM6IHsgaW5jcmVtZW50OiBPVFBfQ1JFRElUX0NPU1QgfSB9LFxuICAgICAgICB9KSxcbiAgICAgIF0pO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwi4Liq4LmI4LiHIE9UUCDguYTguKHguYjguKrguLPguYDguKPguYfguIgg4LiB4Lij4Li44LiT4Liy4Lil4Lit4LiH4LmD4Lir4Lih4LmIXCIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaWQ6IG90cFJlY29yZC5pZCxcbiAgICByZWY6IG90cFJlY29yZC5yZWZDb2RlLFxuICAgIHBob25lOiBvdHBSZWNvcmQucGhvbmUsXG4gICAgcHVycG9zZTogb3RwUmVjb3JkLnB1cnBvc2UsXG4gICAgZXhwaXJlc0F0OiBvdHBSZWNvcmQuZXhwaXJlc0F0LnRvSVNPU3RyaW5nKCksXG4gICAgZXhwaXJlc0luOiBNYXRoLmZsb29yKE9UUF9FWFBJUllfTVMgLyAxMDAwKSxcbiAgICBjcmVkaXRVc2VkOiBPVFBfQ1JFRElUX0NPU1QsXG4gICAgY3JlZGl0c1JlbWFpbmluZzogdXBkYXRlZFVzZXIuY3JlZGl0cyxcbiAgICBkZWxpdmVyeSxcbiAgICAuLi4oZGVidWdNb2RlICYmIHsgZGVidWdDb2RlOiBjb2RlIH0pLFxuICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZ5T3RwXyhcbiAgdXNlcklkOiBzdHJpbmcsXG4gIHJlZjogc3RyaW5nLFxuICBjb2RlOiBzdHJpbmdcbikge1xuICBjb25zdCBpbnB1dCA9IHZlcmlmeU90cFNjaGVtYS5wYXJzZSh7IHJlZiwgY29kZSB9KTtcblxuICBjb25zdCBvdHAgPSBhd2FpdCBwcmlzbWEub3RwUmVxdWVzdC5maW5kRmlyc3Qoe1xuICAgIHdoZXJlOiB7XG4gICAgICB1c2VySWQsXG4gICAgICByZWZDb2RlOiBpbnB1dC5yZWYsXG4gICAgfSxcbiAgICBzZWxlY3Q6IHtcbiAgICAgIGlkOiB0cnVlLFxuICAgICAgcmVmQ29kZTogdHJ1ZSxcbiAgICAgIHBob25lOiB0cnVlLFxuICAgICAgY29kZTogdHJ1ZSxcbiAgICAgIHB1cnBvc2U6IHRydWUsXG4gICAgICBhdHRlbXB0czogdHJ1ZSxcbiAgICAgIHZlcmlmaWVkOiB0cnVlLFxuICAgICAgZXhwaXJlc0F0OiB0cnVlLFxuICAgIH0sXG4gIH0pO1xuXG4gIGlmICghb3RwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwi4LmE4Lih4LmI4Lie4LiaIE9UUCDguJnguLXguYlcIik7XG4gIH1cblxuICBpZiAob3RwLnZlcmlmaWVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiT1RQIOC4meC4teC5ieC4luC4ueC4geC5g+C4iuC5ieC4h+C4suC4meC5geC4peC5ieC4p1wiKTtcbiAgfVxuXG4gIGlmIChvdHAuZXhwaXJlc0F0LmdldFRpbWUoKSA8IERhdGUubm93KCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPVFAg4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinXCIpO1xuICB9XG5cbiAgaWYgKG90cC5hdHRlbXB0cyA+PSBNQVhfQVRURU1QVFMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPVFAg4LiW4Li54LiB4Lil4LmH4Lit4LiE4LmB4Lil4LmJ4LinIOC4geC4o+C4uOC4k+C4suC4guC4reC4o+C4q+C4seC4quC5g+C4q+C4oeC5iFwiKTtcbiAgfVxuXG4gIGNvbnN0IGlzVmFsaWQgPSB0aW1pbmdTYWZlTWF0Y2goaGFzaE90cChpbnB1dC5jb2RlLCBvdHAucmVmQ29kZSksIG90cC5jb2RlKTtcblxuICBpZiAoIWlzVmFsaWQpIHtcbiAgICBjb25zdCB1cGRhdGVkID0gYXdhaXQgcHJpc21hLm90cFJlcXVlc3QudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBvdHAuaWQgfSxcbiAgICAgIGRhdGE6IHsgYXR0ZW1wdHM6IHsgaW5jcmVtZW50OiAxIH0gfSxcbiAgICAgIHNlbGVjdDogeyBhdHRlbXB0czogdHJ1ZSB9LFxuICAgIH0pO1xuICAgIGNvbnN0IHJlbWFpbmluZyA9IE1hdGgubWF4KDAsIE1BWF9BVFRFTVBUUyAtIHVwZGF0ZWQuYXR0ZW1wdHMpO1xuICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9UUCDguYTguKHguYjguJbguLnguIHguJXguYnguK3guIcg4LmB4Lil4Liw4LiW4Li54LiB4Lil4LmH4Lit4LiE4LmB4Lil4LmJ4LinIOC4geC4o+C4uOC4k+C4suC4guC4reC4o+C4q+C4seC4quC5g+C4q+C4oeC5iFwiKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBPVFAg4LmE4Lih4LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHICjguYDguKvguKXguLfguK0gJHtyZW1haW5pbmd9IOC4hOC4o+C4seC5ieC4hylgKTtcbiAgfVxuXG4gIGF3YWl0IHByaXNtYS5vdHBSZXF1ZXN0LnVwZGF0ZSh7XG4gICAgd2hlcmU6IHsgaWQ6IG90cC5pZCB9LFxuICAgIGRhdGE6IHsgdmVyaWZpZWQ6IHRydWUgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICB2YWxpZDogdHJ1ZSxcbiAgICB2ZXJpZmllZDogdHJ1ZSxcbiAgICByZWY6IG90cC5yZWZDb2RlLFxuICAgIHBob25lOiBvdHAucGhvbmUsXG4gICAgcHVycG9zZTogb3RwLnB1cnBvc2UsXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZU90cEZvclNlc3Npb24oZGF0YTogdW5rbm93bikge1xuICBjb25zdCB1c2VySWQgPSBhd2FpdCByZXF1aXJlU2Vzc2lvblVzZXJJZCgpO1xuICBjb25zdCBpbnB1dCA9IHNlbmRPdHBTY2hlbWEucGFyc2UoZGF0YSk7XG4gIHJldHVybiBnZW5lcmF0ZU90cF8odXNlcklkLCBpbnB1dC5waG9uZSwgaW5wdXQucHVycG9zZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZnlPdHBGb3JTZXNzaW9uKGRhdGE6IHVua25vd24pIHtcbiAgY29uc3QgdXNlcklkID0gYXdhaXQgcmVxdWlyZVNlc3Npb25Vc2VySWQoKTtcbiAgY29uc3QgaW5wdXQgPSB2ZXJpZnlPdHBTY2hlbWEucGFyc2UoZGF0YSk7XG4gIHJldHVybiB2ZXJpZnlPdHBfKHVzZXJJZCwgaW5wdXQucmVmLCBpbnB1dC5jb2RlKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiNFJBd1BzQixrTUFBQSJ9
}),
"[project]/lib/actions/data:f0e8c6 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "verifyOtpForSession",
    ()=>$$RSC_SERVER_ACTION_3
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"4029ad19c7db630658f9398e99ba1cab0353d3867f":"verifyOtpForSession"},"lib/actions/otp.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("4029ad19c7db630658f9398e99ba1cab0353d3867f", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "verifyOtpForSession");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vb3RwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHNlcnZlclwiO1xuXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tIFwiQC9saWIvZGJcIjtcbmltcG9ydCB7IGdldFNlc3Npb24gfSBmcm9tIFwiQC9saWIvYXV0aFwiO1xuaW1wb3J0IHsgc2VuZFNpbmdsZVNtcyB9IGZyb20gXCJAL2xpYi9zbXMtZ2F0ZXdheVwiO1xuaW1wb3J0IHsgbm9ybWFsaXplUGhvbmUsIHNlbmRPdHBTY2hlbWEsIHZlcmlmeU90cFNjaGVtYSB9IGZyb20gXCJAL2xpYi92YWxpZGF0aW9uc1wiO1xuaW1wb3J0IGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgeyBQcmlzbWEgfSBmcm9tIFwiQHByaXNtYS9jbGllbnRcIjtcblxuY29uc3QgT1RQX0VYUElSWV9NUyA9IDUgKiA2MCAqIDEwMDA7IC8vIDUgbWludXRlc1xuY29uc3QgTUFYX0FUVEVNUFRTID0gNTtcbmNvbnN0IE1BWF9PVFBfUEVSX1BIT05FX1BFUl9XSU5ET1cgPSAzOyAvLyAzIHBlciA1IG1pbiAoYXJjaGl0ZWN0IHNwZWMgIzEwMClcbmNvbnN0IE9UUF9SQVRFX1dJTkRPV19NUyA9IDUgKiA2MCAqIDEwMDA7IC8vIDUgbWludXRlc1xuY29uc3QgT1RQX0NSRURJVF9DT1NUID0gMTtcblxudHlwZSBHZW5lcmF0ZU90cE9wdGlvbnMgPSB7XG4gIGRlYnVnPzogYm9vbGVhbjtcbn07XG5cbmZ1bmN0aW9uIGdldE90cEhhc2hTZWNyZXQoKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwbGljaXRTZWNyZXQgPSBwcm9jZXNzLmVudi5PVFBfSEFTSF9TRUNSRVQ/LnRyaW0oKTtcbiAgaWYgKGV4cGxpY2l0U2VjcmV0KSByZXR1cm4gZXhwbGljaXRTZWNyZXQ7XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk9UUF9IQVNIX1NFQ1JFVCBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgfVxuXG4gIHJldHVybiBwcm9jZXNzLmVudi5KV1RfU0VDUkVUIHx8IFwic21zb2stb3RwLWRldi1zZWNyZXRcIjtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVPdHAoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNyeXB0by5yYW5kb21JbnQoMTAwMDAwLCA5OTk5OTkpLnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUmVmQ29kZSgpOiBzdHJpbmcge1xuICByZXR1cm4gY3J5cHRvLnJhbmRvbUJ5dGVzKDQpLnRvU3RyaW5nKFwiaGV4XCIpLnRvVXBwZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIGhhc2hPdHAoY29kZTogc3RyaW5nLCByZWZDb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY3J5cHRvXG4gICAgLmNyZWF0ZUhtYWMoXCJzaGEyNTZcIiwgZ2V0T3RwSGFzaFNlY3JldCgpKVxuICAgIC51cGRhdGUoYCR7cmVmQ29kZX06JHtjb2RlfWApXG4gICAgLmRpZ2VzdChcImhleFwiKTtcbn1cblxuZnVuY3Rpb24gdGltaW5nU2FmZU1hdGNoKGxlZnQ6IHN0cmluZywgcmlnaHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBhID0gQnVmZmVyLmZyb20obGVmdCk7XG4gIGNvbnN0IGIgPSBCdWZmZXIuZnJvbShyaWdodCk7XG4gIHJldHVybiBhLmxlbmd0aCA9PT0gYi5sZW5ndGggJiYgY3J5cHRvLnRpbWluZ1NhZmVFcXVhbChhLCBiKTtcbn1cblxuZnVuY3Rpb24gaGFzU21zR2F0ZXdheUNyZWRlbnRpYWxzKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gQm9vbGVhbihcbiAgICBwcm9jZXNzLmVudi5TTVNfQVBJX1VTRVJOQU1FPy50cmltKCkgJiZcbiAgICBwcm9jZXNzLmVudi5TTVNfQVBJX1BBU1NXT1JEPy50cmltKClcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVxdWlyZVNlc3Npb25Vc2VySWQoKSB7XG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBnZXRTZXNzaW9uKCk7XG4gIGlmICghdXNlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVuYXV0aG9yaXplZFwiKTtcbiAgfVxuICByZXR1cm4gdXNlci5pZDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlT3RwXyhcbiAgdXNlcklkOiBzdHJpbmcsXG4gIHBob25lOiBzdHJpbmcsXG4gIHB1cnBvc2U6IHN0cmluZyA9IFwidmVyaWZ5XCIsXG4gIG9wdGlvbnM6IEdlbmVyYXRlT3RwT3B0aW9ucyA9IHt9XG4pIHtcbiAgY29uc3QgaW5wdXQgPSBzZW5kT3RwU2NoZW1hLnBhcnNlKHsgcGhvbmUsIHB1cnBvc2UgfSk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRQaG9uZSA9IG5vcm1hbGl6ZVBob25lKGlucHV0LnBob25lKTtcbiAgY29uc3QgZGVidWdNb2RlID0gb3B0aW9ucy5kZWJ1ZyA9PT0gdHJ1ZSAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCI7XG5cbiAgLy8gUmF0ZSBsaW1pdDogbWF4IDMgT1RQcyBwZXIgcGhvbmUgcGVyIDUgbWluIChhcmNoaXRlY3Qgc3BlYyAjMTAwKVxuICBjb25zdCB3aW5kb3dTdGFydCA9IG5ldyBEYXRlKERhdGUubm93KCkgLSBPVFBfUkFURV9XSU5ET1dfTVMpO1xuICBjb25zdCByZWNlbnRDb3VudCA9IGF3YWl0IHByaXNtYS5vdHBSZXF1ZXN0LmNvdW50KHtcbiAgICB3aGVyZTogeyBwaG9uZTogbm9ybWFsaXplZFBob25lLCBjcmVhdGVkQXQ6IHsgZ3RlOiB3aW5kb3dTdGFydCB9IH0sXG4gIH0pO1xuXG4gIGlmIChyZWNlbnRDb3VudCA+PSBNQVhfT1RQX1BFUl9QSE9ORV9QRVJfV0lORE9XKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwi4Liq4LmI4LiHIE9UUCDguKHguLLguIHguYDguIHguLTguJnguYTguJsg4LiB4Lij4Li44LiT4Liy4Lij4LitIDUg4LiZ4Liy4LiX4Li1XCIpO1xuICB9XG5cbiAgLy8gQ2hlY2sgdXNlciBjcmVkaXRzXG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICB3aGVyZTogeyBpZDogdXNlcklkIH0sXG4gICAgc2VsZWN0OiB7IGNyZWRpdHM6IHRydWUgfSxcbiAgfSk7XG5cbiAgaWYgKCF1c2VyIHx8IHVzZXIuY3JlZGl0cyA8IE9UUF9DUkVESVRfQ09TVCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIuC5gOC4hOC4o+C4lOC4tOC4leC5hOC4oeC5iOC5gOC4nuC4teC4ouC4h+C4nuC4rVwiKTtcbiAgfVxuXG4gIGNvbnN0IGNvZGUgPSBnZW5lcmF0ZU90cCgpO1xuICBjb25zdCByZWZDb2RlID0gZ2VuZXJhdGVSZWZDb2RlKCk7XG4gIGNvbnN0IGV4cGlyZXNBdCA9IG5ldyBEYXRlKERhdGUubm93KCkgKyBPVFBfRVhQSVJZX01TKTtcbiAgY29uc3QgY29kZUhhc2ggPSBoYXNoT3RwKGNvZGUsIHJlZkNvZGUpO1xuXG4gIC8vIENyZWF0ZSBPVFAgcmVjb3JkICsgZGVkdWN0IGNyZWRpdCBpbiB0cmFuc2FjdGlvblxuICBsZXQgb3RwUmVjb3JkOiB7IGlkOiBzdHJpbmc7IHJlZkNvZGU6IHN0cmluZzsgcGhvbmU6IHN0cmluZzsgcHVycG9zZTogc3RyaW5nOyBleHBpcmVzQXQ6IERhdGUgfTtcbiAgbGV0IHVwZGF0ZWRVc2VyOiB7IGNyZWRpdHM6IG51bWJlciB9O1xuXG4gIHRyeSB7XG4gICAgW290cFJlY29yZCwgdXBkYXRlZFVzZXJdID0gYXdhaXQgcHJpc21hLiR0cmFuc2FjdGlvbihbXG4gICAgICBwcmlzbWEub3RwUmVxdWVzdC5jcmVhdGUoe1xuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIHJlZkNvZGUsXG4gICAgICAgICAgcGhvbmU6IG5vcm1hbGl6ZWRQaG9uZSxcbiAgICAgICAgICBjb2RlOiBjb2RlSGFzaCxcbiAgICAgICAgICBwdXJwb3NlOiBpbnB1dC5wdXJwb3NlLFxuICAgICAgICAgIGV4cGlyZXNBdCxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgaWQ6IHRydWUsXG4gICAgICAgICAgcmVmQ29kZTogdHJ1ZSxcbiAgICAgICAgICBwaG9uZTogdHJ1ZSxcbiAgICAgICAgICBwdXJwb3NlOiB0cnVlLFxuICAgICAgICAgIGV4cGlyZXNBdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgcHJpc21hLnVzZXIudXBkYXRlKHtcbiAgICAgICAgd2hlcmU6IHsgaWQ6IHVzZXJJZCB9LFxuICAgICAgICBkYXRhOiB7IGNyZWRpdHM6IHsgZGVjcmVtZW50OiBPVFBfQ1JFRElUX0NPU1QgfSB9LFxuICAgICAgICBzZWxlY3Q6IHsgY3JlZGl0czogdHJ1ZSB9LFxuICAgICAgfSksXG4gICAgXSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKFxuICAgICAgZXJyb3IgaW5zdGFuY2VvZiBQcmlzbWEuUHJpc21hQ2xpZW50S25vd25SZXF1ZXN0RXJyb3IgJiZcbiAgICAgIGVycm9yLmNvZGUgPT09IFwiUDIwMDJcIlxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwi4Liq4Lij4LmJ4Liy4LiHIE9UUCDguYTguKHguYjguKrguLPguYDguKPguYfguIgg4LiB4Lij4Li44LiT4Liy4Lil4Lit4LiH4LmD4Lir4Lih4LmIXCIpO1xuICAgIH1cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIC8vIFNlbmQgT1RQIHZpYSBTTVNcbiAgY29uc3QgbWVzc2FnZSA9IGDguKPguKvguLHguKogT1RQIOC4guC4reC4h+C4hOC4uOC4k+C4hOC4t+C4rSAke2NvZGV9ICjguKvguKHguJTguK3guLLguKLguLjguYPguJkgNSDguJnguLLguJfguLUpYDtcbiAgbGV0IGRlbGl2ZXJ5OiBcInNtc1wiIHwgXCJkZWJ1Z1wiID0gXCJzbXNcIjtcbiAgaWYgKGRlYnVnTW9kZSAmJiAhaGFzU21zR2F0ZXdheUNyZWRlbnRpYWxzKCkpIHtcbiAgICAvLyBMb2NhbGhvc3QgdGVzdGluZyBwYXRoOiBrZWVwIFByaXNtYSBmbG93IHJlYWwsIGV4cG9zZSB0aGUgT1RQIGluc3RlYWQgb2YgcmVxdWlyaW5nIFNNUyBpbmZyYS5cbiAgICBkZWxpdmVyeSA9IFwiZGVidWdcIjtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VuZFNpbmdsZVNtcyhpbnB1dC5waG9uZSwgbWVzc2FnZSwgXCJFYXN5U2xpcFwiKTtcbiAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvciB8fCBcIuC4quC5iOC4hyBPVFAg4LmE4Lih4LmI4Liq4Liz4LmA4Lij4LmH4LiIIOC4geC4o+C4uOC4k+C4suC4peC4reC4h+C5g+C4q+C4oeC5iFwiKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFJlZnVuZCBjcmVkaXQgb24gc2VuZCBmYWlsdXJlXG4gICAgICBhd2FpdCBwcmlzbWEuJHRyYW5zYWN0aW9uKFtcbiAgICAgICAgcHJpc21hLm90cFJlcXVlc3QuZGVsZXRlKHsgd2hlcmU6IHsgaWQ6IG90cFJlY29yZC5pZCB9IH0pLFxuICAgICAgICBwcmlzbWEudXNlci51cGRhdGUoe1xuICAgICAgICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfSxcbiAgICAgICAgICBkYXRhOiB7IGNyZWRpdHM6IHsgaW5jcmVtZW50OiBPVFBfQ1JFRElUX0NPU1QgfSB9LFxuICAgICAgICB9KSxcbiAgICAgIF0pO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwi4Liq4LmI4LiHIE9UUCDguYTguKHguYjguKrguLPguYDguKPguYfguIgg4LiB4Lij4Li44LiT4Liy4Lil4Lit4LiH4LmD4Lir4Lih4LmIXCIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaWQ6IG90cFJlY29yZC5pZCxcbiAgICByZWY6IG90cFJlY29yZC5yZWZDb2RlLFxuICAgIHBob25lOiBvdHBSZWNvcmQucGhvbmUsXG4gICAgcHVycG9zZTogb3RwUmVjb3JkLnB1cnBvc2UsXG4gICAgZXhwaXJlc0F0OiBvdHBSZWNvcmQuZXhwaXJlc0F0LnRvSVNPU3RyaW5nKCksXG4gICAgZXhwaXJlc0luOiBNYXRoLmZsb29yKE9UUF9FWFBJUllfTVMgLyAxMDAwKSxcbiAgICBjcmVkaXRVc2VkOiBPVFBfQ1JFRElUX0NPU1QsXG4gICAgY3JlZGl0c1JlbWFpbmluZzogdXBkYXRlZFVzZXIuY3JlZGl0cyxcbiAgICBkZWxpdmVyeSxcbiAgICAuLi4oZGVidWdNb2RlICYmIHsgZGVidWdDb2RlOiBjb2RlIH0pLFxuICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZ5T3RwXyhcbiAgdXNlcklkOiBzdHJpbmcsXG4gIHJlZjogc3RyaW5nLFxuICBjb2RlOiBzdHJpbmdcbikge1xuICBjb25zdCBpbnB1dCA9IHZlcmlmeU90cFNjaGVtYS5wYXJzZSh7IHJlZiwgY29kZSB9KTtcblxuICBjb25zdCBvdHAgPSBhd2FpdCBwcmlzbWEub3RwUmVxdWVzdC5maW5kRmlyc3Qoe1xuICAgIHdoZXJlOiB7XG4gICAgICB1c2VySWQsXG4gICAgICByZWZDb2RlOiBpbnB1dC5yZWYsXG4gICAgfSxcbiAgICBzZWxlY3Q6IHtcbiAgICAgIGlkOiB0cnVlLFxuICAgICAgcmVmQ29kZTogdHJ1ZSxcbiAgICAgIHBob25lOiB0cnVlLFxuICAgICAgY29kZTogdHJ1ZSxcbiAgICAgIHB1cnBvc2U6IHRydWUsXG4gICAgICBhdHRlbXB0czogdHJ1ZSxcbiAgICAgIHZlcmlmaWVkOiB0cnVlLFxuICAgICAgZXhwaXJlc0F0OiB0cnVlLFxuICAgIH0sXG4gIH0pO1xuXG4gIGlmICghb3RwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwi4LmE4Lih4LmI4Lie4LiaIE9UUCDguJnguLXguYlcIik7XG4gIH1cblxuICBpZiAob3RwLnZlcmlmaWVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiT1RQIOC4meC4teC5ieC4luC4ueC4geC5g+C4iuC5ieC4h+C4suC4meC5geC4peC5ieC4p1wiKTtcbiAgfVxuXG4gIGlmIChvdHAuZXhwaXJlc0F0LmdldFRpbWUoKSA8IERhdGUubm93KCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPVFAg4Lir4Lih4LiU4Lit4Liy4Lii4Li44LmB4Lil4LmJ4LinXCIpO1xuICB9XG5cbiAgaWYgKG90cC5hdHRlbXB0cyA+PSBNQVhfQVRURU1QVFMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPVFAg4LiW4Li54LiB4Lil4LmH4Lit4LiE4LmB4Lil4LmJ4LinIOC4geC4o+C4uOC4k+C4suC4guC4reC4o+C4q+C4seC4quC5g+C4q+C4oeC5iFwiKTtcbiAgfVxuXG4gIGNvbnN0IGlzVmFsaWQgPSB0aW1pbmdTYWZlTWF0Y2goaGFzaE90cChpbnB1dC5jb2RlLCBvdHAucmVmQ29kZSksIG90cC5jb2RlKTtcblxuICBpZiAoIWlzVmFsaWQpIHtcbiAgICBjb25zdCB1cGRhdGVkID0gYXdhaXQgcHJpc21hLm90cFJlcXVlc3QudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBvdHAuaWQgfSxcbiAgICAgIGRhdGE6IHsgYXR0ZW1wdHM6IHsgaW5jcmVtZW50OiAxIH0gfSxcbiAgICAgIHNlbGVjdDogeyBhdHRlbXB0czogdHJ1ZSB9LFxuICAgIH0pO1xuICAgIGNvbnN0IHJlbWFpbmluZyA9IE1hdGgubWF4KDAsIE1BWF9BVFRFTVBUUyAtIHVwZGF0ZWQuYXR0ZW1wdHMpO1xuICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9UUCDguYTguKHguYjguJbguLnguIHguJXguYnguK3guIcg4LmB4Lil4Liw4LiW4Li54LiB4Lil4LmH4Lit4LiE4LmB4Lil4LmJ4LinIOC4geC4o+C4uOC4k+C4suC4guC4reC4o+C4q+C4seC4quC5g+C4q+C4oeC5iFwiKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBPVFAg4LmE4Lih4LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHICjguYDguKvguKXguLfguK0gJHtyZW1haW5pbmd9IOC4hOC4o+C4seC5ieC4hylgKTtcbiAgfVxuXG4gIGF3YWl0IHByaXNtYS5vdHBSZXF1ZXN0LnVwZGF0ZSh7XG4gICAgd2hlcmU6IHsgaWQ6IG90cC5pZCB9LFxuICAgIGRhdGE6IHsgdmVyaWZpZWQ6IHRydWUgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICB2YWxpZDogdHJ1ZSxcbiAgICB2ZXJpZmllZDogdHJ1ZSxcbiAgICByZWY6IG90cC5yZWZDb2RlLFxuICAgIHBob25lOiBvdHAucGhvbmUsXG4gICAgcHVycG9zZTogb3RwLnB1cnBvc2UsXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZU90cEZvclNlc3Npb24oZGF0YTogdW5rbm93bikge1xuICBjb25zdCB1c2VySWQgPSBhd2FpdCByZXF1aXJlU2Vzc2lvblVzZXJJZCgpO1xuICBjb25zdCBpbnB1dCA9IHNlbmRPdHBTY2hlbWEucGFyc2UoZGF0YSk7XG4gIHJldHVybiBnZW5lcmF0ZU90cF8odXNlcklkLCBpbnB1dC5waG9uZSwgaW5wdXQucHVycG9zZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZnlPdHBGb3JTZXNzaW9uKGRhdGE6IHVua25vd24pIHtcbiAgY29uc3QgdXNlcklkID0gYXdhaXQgcmVxdWlyZVNlc3Npb25Vc2VySWQoKTtcbiAgY29uc3QgaW5wdXQgPSB2ZXJpZnlPdHBTY2hlbWEucGFyc2UoZGF0YSk7XG4gIHJldHVybiB2ZXJpZnlPdHBfKHVzZXJJZCwgaW5wdXQucmVmLCBpbnB1dC5jb2RlKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiMFJBOFBzQixnTUFBQSJ9
}),
"[project]/app/(dashboard)/dashboard/otp/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OtpPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$data$3a$0d258f__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/lib/actions/data:0d258f [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$data$3a$f0e8c6__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/lib/actions/data:f0e8c6 [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
;
;
const features = [
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "11",
                    width: "18",
                    height: "11",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                    lineNumber: 11,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M7 11V7a5 5 0 0110 0v4"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                    lineNumber: 11,
                    columnNumber: 60
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
            lineNumber: 10,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0)),
        title: "ปลอดภัยสูงสุด",
        desc: "รหัส 6 หลัก สุ่มด้วย crypto-safe algorithm",
        color: "text-violet-400",
        bg: "bg-violet-500/10 border-violet-500/20"
    },
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "12",
                    r: "10"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                    lineNumber: 22,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                    points: "12 6 12 12 16 14"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                    lineNumber: 22,
                    columnNumber: 42
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
            lineNumber: 21,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0)),
        title: "หมดอายุ 5 นาที",
        desc: "TTL 300 วินาที ป้องกันการใช้ซ้ำ",
        color: "text-cyan-400",
        bg: "bg-cyan-500/10 border-cyan-500/20"
    },
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 33,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
            lineNumber: 32,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0)),
        title: "Rate Limited",
        desc: "3 req/5min per phone + IP dual-key protection",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: "12",
                    y1: "9",
                    x2: "12",
                    y2: "13"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                    lineNumber: 44,
                    columnNumber: 105
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: "12",
                    y1: "17",
                    x2: "12.01",
                    y2: "17"
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                    lineNumber: 44,
                    columnNumber: 144
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
            lineNumber: 43,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0)),
        title: "ล็อกเอาท์อัตโนมัติ",
        desc: "ลองผิด 5 ครั้ง = ต้องขอรหัสใหม่",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20"
    }
];
const purposes = [
    {
        value: "verify",
        label: "ยืนยันตัวตน",
        desc: "สมัครสมาชิก, ยืนยันเบอร์โทร"
    },
    {
        value: "login",
        label: "เข้าสู่ระบบ",
        desc: "2FA login, passwordless auth"
    },
    {
        value: "transaction",
        label: "ยืนยันธุรกรรม",
        desc: "โอนเงิน, เปลี่ยนรหัสผ่าน"
    }
];
function CodeBlock({ title, code, lang }) {
    _s();
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-4 py-2 rounded-t-xl border-b",
                style: {
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            navigator.clipboard.writeText(code);
                            setCopied(true);
                            setTimeout(()=>setCopied(false), 1500);
                        },
                        className: "p-1 rounded-md hover:bg-white/5 transition-colors",
                        children: copied ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "12",
                            height: "12",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            className: "text-emerald-400",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                points: "20 6 9 17 4 12"
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 71,
                                columnNumber: 140
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                            lineNumber: 71,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "12",
                            height: "12",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            className: "text-[var(--text-muted)]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                    x: "9",
                                    y: "9",
                                    width: "13",
                                    height: "13",
                                    rx: "2"
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 73,
                                    columnNumber: 148
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 73,
                                    columnNumber: 198
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                            lineNumber: 73,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                className: `rounded-b-xl p-4 overflow-x-auto text-[12px] font-mono ${lang === "response" ? "text-emerald-300/80" : "text-cyan-300/80"}`,
                style: {
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderTop: "none"
                },
                children: code
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
_s(CodeBlock, "NE86rL3vg4NVcTTWDavsT0hUBJs=");
_c = CodeBlock;
function OtpTestPanel() {
    _s1();
    const [phone, setPhone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [purpose, setPurpose] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("verify");
    const [code, setCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [ref, setRef] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("generate");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [countdown, setCountdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [isPending, startTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"])();
    // Countdown timer for OTP expiry
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OtpTestPanel.useEffect": ()=>{
            if (countdown <= 0) return;
            const t = setInterval({
                "OtpTestPanel.useEffect.t": ()=>setCountdown({
                        "OtpTestPanel.useEffect.t": (c)=>Math.max(c - 1, 0)
                    }["OtpTestPanel.useEffect.t"])
            }["OtpTestPanel.useEffect.t"], 1000);
            return ({
                "OtpTestPanel.useEffect": ()=>clearInterval(t)
            })["OtpTestPanel.useEffect"];
        }
    }["OtpTestPanel.useEffect"], [
        countdown
    ]);
    const handleGenerate = async ()=>{
        if (!phone) return;
        setResult(null);
        setLoading(true);
        startTransition(async ()=>{
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$data$3a$0d258f__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["generateOtpForSession"])({
                    phone,
                    purpose
                });
                setRef(data.ref || "");
                setStep("verify");
                setCountdown(data.expiresIn ?? 300);
                setResult({
                    ok: true,
                    msg: `OTP sent! Ref: ${data.ref || "N/A"}`
                });
            } catch (error) {
                setResult({
                    ok: false,
                    msg: error instanceof Error ? error.message : "Failed to send OTP"
                });
            } finally{
                setLoading(false);
            }
        });
    };
    const handleVerify = async ()=>{
        if (!code) return;
        setResult(null);
        setLoading(true);
        startTransition(async ()=>{
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$data$3a$f0e8c6__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["verifyOtpForSession"])({
                    ref,
                    code
                });
                if (data.verified) {
                    setResult({
                        ok: true,
                        msg: "OTP verified successfully!"
                    });
                    setStep("generate");
                    setCode("");
                    setRef("");
                    setCountdown(0);
                } else {
                    setResult({
                        ok: false,
                        msg: "Invalid OTP"
                    });
                }
            } catch (error) {
                setResult({
                    ok: false,
                    msg: error instanceof Error ? error.message : "Failed to verify OTP"
                });
            } finally{
                setLoading(false);
            }
        });
    };
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "glass p-6 mb-8 relative overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-violet-500/5 blur-[60px]"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-base font-semibold flex items-center gap-2.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "14",
                                            height: "14",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "1.5",
                                            className: "text-amber-400",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M22 12h-4l-3 9L9 3l-3 9H2"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 165,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 164,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 163,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "gradient-text-mixed",
                                        children: "ทดสอบ OTP"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 168,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 162,
                                columnNumber: 11
                            }, this),
                            countdown > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20",
                                children: [
                                    "หมดอายุใน ",
                                    mins,
                                    ":",
                                    secs.toString().padStart(2, "0")
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 171,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 mb-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${step === "generate" ? "bg-violet-500/15 text-violet-400 border border-violet-500/20" : "text-[var(--text-muted)]"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold",
                                        children: "1"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 180,
                                        columnNumber: 13
                                    }, this),
                                    "Generate"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "16",
                                height: "16",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2",
                                className: "text-[var(--text-muted)]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M5 12h14M12 5l7 7-7 7"
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 183,
                                    columnNumber: 146
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 183,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${step === "verify" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "text-[var(--text-muted)]"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold",
                                        children: "2"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 185,
                                        columnNumber: 13
                                    }, this),
                                    "Verify"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 184,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    step === "generate" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium",
                                        children: "เบอร์โทร"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 193,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "tel",
                                        className: "input-glass",
                                        placeholder: "0891234567",
                                        value: phone,
                                        onChange: (e)=>setPhone(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 194,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 192,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium",
                                        children: "Purpose"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 203,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "input-glass appearance-none cursor-pointer",
                                        value: purpose,
                                        onChange: (e)=>setPurpose(e.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "verify",
                                                className: "bg-[var(--bg-elevated)]",
                                                children: "verify"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 209,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "login",
                                                className: "bg-[var(--bg-elevated)]",
                                                children: "login"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 210,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "transaction",
                                                className: "bg-[var(--bg-elevated)]",
                                                children: "transaction"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 211,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 204,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 202,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-end",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleGenerate,
                                    disabled: loading || isPending || !phone,
                                    className: "btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2",
                                    children: [
                                        loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "animate-spin h-4 w-4",
                                            viewBox: "0 0 24 24",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    className: "opacity-25",
                                                    cx: "12",
                                                    cy: "12",
                                                    r: "10",
                                                    stroke: "currentColor",
                                                    strokeWidth: "4",
                                                    fill: "none"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 221,
                                                    columnNumber: 77
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    className: "opacity-75",
                                                    fill: "currentColor",
                                                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 221,
                                                    columnNumber: 183
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 221,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "14",
                                            height: "14",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 223,
                                                columnNumber: 117
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 223,
                                            columnNumber: 19
                                        }, this),
                                        "Send OTP"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 215,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 214,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 191,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium",
                                        children: "Ref Code"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 232,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "input-glass bg-[var(--bg-surface)] cursor-default text-violet-400 font-mono text-sm",
                                        children: ref || "—"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 233,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 231,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium",
                                        children: "OTP Code"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 236,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        className: "input-glass font-mono text-center text-lg tracking-[0.3em]",
                                        placeholder: "000000",
                                        maxLength: 6,
                                        value: code,
                                        onChange: (e)=>setCode(e.target.value.replace(/\D/g, ""))
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 237,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 235,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-end gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleVerify,
                                        disabled: loading || isPending || code.length !== 6,
                                        className: "btn-primary flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2",
                                        children: [
                                            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "animate-spin h-4 w-4",
                                                viewBox: "0 0 24 24",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        className: "opacity-25",
                                                        cx: "12",
                                                        cy: "12",
                                                        r: "10",
                                                        stroke: "currentColor",
                                                        strokeWidth: "4",
                                                        fill: "none"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                        lineNumber: 253,
                                                        columnNumber: 77
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        className: "opacity-75",
                                                        fill: "currentColor",
                                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                        lineNumber: 253,
                                                        columnNumber: 183
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 253,
                                                columnNumber: 19
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "14",
                                                height: "14",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "20 6 9 17 4 12"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 255,
                                                    columnNumber: 117
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 255,
                                                columnNumber: 19
                                            }, this),
                                            "Verify"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 247,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            setStep("generate");
                                            setCode("");
                                            setRef("");
                                            setCountdown(0);
                                            setResult(null);
                                        },
                                        className: "btn-glass px-3 py-2.5 rounded-xl text-sm",
                                        title: "Reset",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "14",
                                            height: "14",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M1 4v6h6M23 20v-6h-6"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 264,
                                                    columnNumber: 115
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 264,
                                                    columnNumber: 148
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 264,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 259,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 246,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 230,
                        columnNumber: 11
                    }, this),
                    result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `mt-4 px-4 py-3 rounded-xl text-sm font-medium border ${result.ok ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`,
                        children: result.msg
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 271,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 160,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
        lineNumber: 157,
        columnNumber: 5
    }, this);
}
_s1(OtpTestPanel, "BVo9tI6+tBaSE4/Fc4Okg5oXhwI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"]
    ];
});
_c1 = OtpTestPanel;
function OtpPage() {
    _s2();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("generate");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6 md:p-8 max-w-6xl animate-fade-in-up",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "20",
                                            height: "20",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "1.5",
                                            className: "text-violet-400",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                    x: "3",
                                                    y: "11",
                                                    width: "18",
                                                    height: "11",
                                                    rx: "2"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 291,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M7 11V7a5 5 0 0110 0v4"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 291,
                                                    columnNumber: 68
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 290,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 289,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold gradient-text-mixed",
                                        children: "OTP API"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 294,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 288,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[var(--text-secondary)] text-sm",
                                children: "สร้างและยืนยันรหัส OTP 6 หลักผ่าน REST API — ใช้ 1 เครดิต/OTP"
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 296,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 287,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/dashboard/api-keys",
                                className: "btn-primary px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "14",
                                        height: "14",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 302,
                                            columnNumber: 111
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 302,
                                        columnNumber: 13
                                    }, this),
                                    "API Key"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 301,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/dashboard/api-docs",
                                className: "btn-glass px-4 py-2.5 text-sm font-medium rounded-xl",
                                children: "API Docs"
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 305,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 300,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 286,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8",
                children: features.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "glass p-4 card-hover",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `w-9 h-9 rounded-lg ${f.bg} border flex items-center justify-center mb-3 ${f.color}`,
                                children: f.icon
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 315,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-semibold text-[var(--text-primary)] mb-1",
                                children: f.title
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 318,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] text-[var(--text-muted)] leading-relaxed",
                                children: f.desc
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 319,
                                columnNumber: 13
                            }, this)
                        ]
                    }, f.title, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 314,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 312,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "glass p-6 mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-base font-semibold text-[var(--text-primary)] mb-5",
                        children: "ขั้นตอนการใช้งาน"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 326,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0",
                        children: [
                            {
                                step: "1",
                                label: "สร้าง API Key",
                                desc: "จากหน้า API Keys"
                            },
                            {
                                step: "2",
                                label: "Generate OTP",
                                desc: "POST /otp/send"
                            },
                            {
                                step: "3",
                                label: "ผู้ใช้รับ SMS",
                                desc: "รหัส 6 หลัก"
                            },
                            {
                                step: "4",
                                label: "Verify OTP",
                                desc: "POST /otp/verify"
                            }
                        ].map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 sm:flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3 flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs font-bold text-violet-400",
                                                    children: s.step
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 337,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 336,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-semibold text-[var(--text-primary)]",
                                                        children: s.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                        lineNumber: 340,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[10px] text-[var(--text-muted)]",
                                                        children: s.desc
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                        lineNumber: 341,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                lineNumber: 339,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 335,
                                        columnNumber: 15
                                    }, this),
                                    i < 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "16",
                                        height: "16",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        className: "text-[var(--text-muted)] hidden sm:block flex-shrink-0 mx-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M5 12h14M12 5l7 7-7 7"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 346,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 345,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, s.step, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 334,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 327,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 325,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "glass p-6 mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-base font-semibold text-[var(--text-primary)] mb-4",
                        children: "ประเภท OTP (purpose)"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 356,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
                        children: purposes.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-xl p-4 border border-[var(--border-subtle)]",
                                style: {
                                    background: "var(--bg-surface)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        className: "text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded",
                                        children: p.value
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 360,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm font-medium text-[var(--text-primary)] mt-2",
                                        children: p.label
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 361,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] text-[var(--text-muted)] mt-1",
                                        children: p.desc
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 362,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, p.value, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 359,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 357,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 355,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "glass overflow-hidden mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex border-b border-[var(--border-subtle)]",
                        children: [
                            "generate",
                            "verify"
                        ].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveTab(tab),
                                className: `flex-1 py-3.5 text-sm font-medium transition-all relative ${activeTab === tab ? "text-violet-400" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`,
                                children: [
                                    tab === "generate" ? "Generate OTP" : "Verify OTP",
                                    activeTab === tab && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-cyan-500"
                                    }, void 0, false, {
                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                        lineNumber: 383,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, tab, true, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 372,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 370,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6",
                        children: activeTab === "generate" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-violet-400 bg-violet-500/15 border border-violet-500/20",
                                            children: "POST"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 393,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                            className: "text-sm font-mono text-[var(--text-primary)]",
                                            children: "/api/v1/otp/send"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 394,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-md ml-auto",
                                            children: "3 req/5min"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 395,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 392,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CodeBlock, {
                                            title: "Request",
                                            lang: "request",
                                            code: `curl -X POST https://api.smsok.com/api/v1/otp/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "0891234567",
    "purpose": "verify"
  }'`
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 399,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CodeBlock, {
                                            title: "Response 201",
                                            lang: "response",
                                            code: `{
  "ref": "ABC123EF",
  "phone": "+66891234567",
  "purpose": "verify",
  "expiresAt": "2026-03-09T10:35:00Z",
  "creditUsed": 1
}`
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 410,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 398,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "rounded-xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2",
                                            children: "Parameters"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 424,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "w-full text-xs",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "text-[var(--text-muted)]",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left pb-2 font-medium",
                                                                children: "Field"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                lineNumber: 428,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left pb-2 font-medium",
                                                                children: "Type"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                lineNumber: 429,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left pb-2 font-medium",
                                                                children: "Required"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                lineNumber: 430,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left pb-2 font-medium",
                                                                children: "Description"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                lineNumber: 431,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                        lineNumber: 427,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 426,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    className: "text-[var(--text-secondary)]",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            className: "border-t border-[var(--border-subtle)]",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2 font-mono text-cyan-400",
                                                                    children: "phone"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 436,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2",
                                                                    children: "string"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 437,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-emerald-400",
                                                                        children: "Yes"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                        lineNumber: 438,
                                                                        columnNumber: 44
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 438,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2",
                                                                    children: "เบอร์โทร (08x/09x/06x)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 439,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 435,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            className: "border-t border-[var(--border-subtle)]",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2 font-mono text-cyan-400",
                                                                    children: "purpose"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 442,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2",
                                                                    children: "string"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 443,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-[var(--text-muted)]",
                                                                        children: "No"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                        lineNumber: 444,
                                                                        columnNumber: 44
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 444,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2",
                                                                    children: "verify | login | transaction"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                                    lineNumber: 445,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 441,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 434,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 425,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 423,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                            lineNumber: 391,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-violet-400 bg-violet-500/15 border border-violet-500/20",
                                            children: "POST"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 454,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                            className: "text-sm font-mono text-[var(--text-primary)]",
                                            children: "/api/v1/otp/verify"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 455,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-md ml-auto",
                                            children: "5 attempts max"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 456,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 453,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CodeBlock, {
                                            title: "Request",
                                            lang: "request",
                                            code: `curl -X POST https://api.smsok.com/api/v1/otp/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ref": "ABC123EF",
    "code": "123456"
  }'`
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 460,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CodeBlock, {
                                            title: "Response 200",
                                            lang: "response",
                                            code: `{
  "valid": true,
  "verified": true,
  "ref": "ABC123EF",
  "phone": "+66891234567",
  "purpose": "verify"
}`
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 471,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 459,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "rounded-xl p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2",
                                            children: "Error Responses"
                                        }, void 0, false, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 485,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2 text-xs",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 py-2 border-b border-[var(--border-subtle)]",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-400 font-mono font-bold",
                                                            children: "400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 488,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[var(--text-secondary)]",
                                                            children: "OTP ไม่ถูกต้อง (เหลือ N ครั้ง)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 489,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 487,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 py-2 border-b border-[var(--border-subtle)]",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-400 font-mono font-bold",
                                                            children: "400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 492,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[var(--text-secondary)]",
                                                            children: "ไม่พบ OTP นี้ หรือ OTP หมดอายุแล้ว"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 493,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 491,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 py-2 border-b border-[var(--border-subtle)]",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-400 font-mono font-bold",
                                                            children: "400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 496,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[var(--text-secondary)]",
                                                            children: "OTP ถูกล็อคแล้ว กรุณาขอรหัสใหม่"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 497,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 495,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 py-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-orange-400 font-mono font-bold",
                                                            children: "429"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 500,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[var(--text-secondary)]",
                                                            children: "Too many requests (rate limited)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                            lineNumber: 501,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                                    lineNumber: 499,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                            lineNumber: 486,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 484,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                            lineNumber: 452,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 389,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 369,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OtpTestPanel, {}, void 0, false, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 511,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "glass p-6 mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-base font-semibold gradient-text-cyan mb-4",
                        children: "Quick Start — Node.js"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 515,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CodeBlock, {
                        title: "JavaScript / Node.js",
                        lang: "request",
                        code: `const API_KEY = "sk_live_your_key";
const BASE = "https://api.smsok.com/api/v1";

// 1. Generate OTP
const gen = await fetch(BASE + "/otp/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ phone: "0891234567", purpose: "verify" })
});
const { ref, expiresAt } = await gen.json();

// 2. User enters code from SMS...
const userCode = "123456";

// 3. Verify OTP
const verify = await fetch(BASE + "/otp/verify", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ ref, code: userCode })
});
const { valid } = await verify.json();
console.log(valid ? "OTP correct!" : "Invalid OTP");`
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 516,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 514,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/dashboard/api-keys",
                        className: "btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2",
                        children: [
                            "สร้าง API Key เลย",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M5 12h14M12 5l7 7-7 7"
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                    lineNumber: 554,
                                    columnNumber: 109
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                                lineNumber: 554,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 552,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/dashboard/api-docs",
                        className: "btn-glass px-5 py-2.5 text-sm font-medium rounded-xl",
                        children: "ดู API Docs ทั้งหมด"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                        lineNumber: 556,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
                lineNumber: 551,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/dashboard/otp/page.tsx",
        lineNumber: 284,
        columnNumber: 5
    }, this);
}
_s2(OtpPage, "YnUVnGZePWdlgfOSSRzYtV1JtU0=");
_c2 = OtpPage;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "CodeBlock");
__turbopack_context__.k.register(_c1, "OtpTestPanel");
__turbopack_context__.k.register(_c2, "OtpPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_1138439d._.js.map