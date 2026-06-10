var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-bxzGDF/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-bxzGDF/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// .wrangler/tmp/pages-kYtZHB/functionsWorker-0.7622226114961816.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
function stripCfConnectingIPHeader2(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
__name2(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader2.apply(null, argArray)
    ]);
  }
});
function verifyToken(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken, "verifyToken");
__name2(verifyToken, "verifyToken");
function getAuthenticatedAdmin(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);
  if (!user || user.role !== "admin")
    return null;
  return user;
}
__name(getAuthenticatedAdmin, "getAuthenticatedAdmin");
__name2(getAuthenticatedAdmin, "getAuthenticatedAdmin");
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse, "createResponse");
__name2(createResponse, "createResponse");
async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions, "onRequestOptions");
__name2(onRequestOptions, "onRequestOptions");
async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const adminUser = getAuthenticatedAdmin(request);
  if (!adminUser) {
    return createResponse({ error: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 403);
  }
  if (action === "stats") {
    try {
      const uCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM profiles").first("count");
      const dCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM dogs").first("count");
      const appCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM business_applications WHERE status = "pending"').first("count");
      const rCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM reports").first("count");
      return createResponse({
        userCount: uCount || 0,
        dogCount: dCount || 0,
        pendingApplications: appCount || 0,
        reportCount: rCount || 0
      });
    } catch (err) {
      return createResponse({ error: `\uD1B5\uACC4 \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "users") {
    try {
      const { results: users } = await env.DB.prepare(
        "SELECT id, email, nickname, phone, address, role, grade, completed_adoption_count, created_at FROM profiles ORDER BY created_at DESC"
      ).all();
      return createResponse(users);
    } catch (err) {
      return createResponse({ error: `\uC720\uC800 \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "dogs") {
    try {
      const { results: dogs } = await env.DB.prepare("SELECT * FROM dogs ORDER BY created_at DESC").all();
      return createResponse(dogs);
    } catch (err) {
      return createResponse({ error: `\uB9E4\uBB3C \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "coupons") {
    try {
      const { results: coupons } = await env.DB.prepare("SELECT * FROM coupons ORDER BY created_at DESC").all();
      return createResponse(coupons);
    } catch (err) {
      return createResponse({ error: `\uCFE0\uD3F0 \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "applications") {
    try {
      const { results: apps } = await env.DB.prepare(
        "SELECT a.*, p.nickname, p.email FROM business_applications a JOIN profiles p ON a.user_id = p.id ORDER BY a.created_at DESC"
      ).all();
      return createResponse(apps);
    } catch (err) {
      return createResponse({ error: `\uC2E0\uCCAD \uB0B4\uC5ED \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "reports") {
    try {
      const { results: reports } = await env.DB.prepare(
        "SELECT r.*, p.nickname AS reporter_nickname, d.nickname AS target_dog_name FROM reports r JOIN profiles p ON r.user_id = p.id JOIN dogs d ON r.target_id = d.id ORDER BY r.created_at DESC"
      ).all();
      return createResponse(reports);
    } catch (err) {
      return createResponse({ error: `\uC2E0\uACE0 \uB0B4\uC5ED \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAD00\uB9AC\uC790 \uC870\uD68C \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const adminUser = getAuthenticatedAdmin(request);
  if (!adminUser) {
    return createResponse({ error: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 403);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "approve_app") {
    const { id, user_id } = body;
    if (!id || !user_id) {
      return createResponse({ error: "\uC2E0\uCCAD\uC11C ID\uC640 \uC720\uC800 ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      await env.DB.prepare('UPDATE business_applications SET status = "approved" WHERE id = ?').bind(id).run();
      await env.DB.prepare('UPDATE profiles SET role = "seller" WHERE id = ?').bind(user_id).run();
      await env.DB.prepare(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, "system", "\uCD95\uD558\uD569\uB2C8\uB2E4! \uD310\uB9E4\uC790 \uC790\uACA9 \uC2E0\uCCAD\uC774 \uCD5C\uC885 \uC2B9\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC774\uC81C \uBD84\uC591 \uB9E4\uBB3C\uC744 \uB4F1\uB85D\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")'
      ).bind(user_id).run();
      return createResponse({ success: true, message: "\uD310\uB9E4\uC790 \uC790\uACA9 \uC2E0\uCCAD\uC774 \uC2B9\uC778 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse({ error: `\uC2B9\uC778 \uCC98\uB9AC \uC911 \uC624\uB958: ${err.message}` }, 500);
    }
  }
  if (action === "reject_app") {
    const { id, reason } = body;
    if (!id || !reason) {
      return createResponse({ error: "\uC2E0\uCCAD\uC11C ID\uC640 \uBC18\uB824 \uC0AC\uC720\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const app = await env.DB.prepare("SELECT user_id FROM business_applications WHERE id = ?").bind(id).first();
      if (!app) {
        return createResponse({ error: "\uD574\uB2F9 \uC2E0\uCCAD\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
      }
      await env.DB.prepare('UPDATE business_applications SET status = "rejected", rejected_reason = ? WHERE id = ?').bind(reason, id).run();
      await env.DB.prepare(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, "system", ?)'
      ).bind(app.user_id, `\uD310\uB9E4\uC790 \uC790\uACA9 \uC2E0\uCCAD\uC774 \uBC18\uB824\uB418\uC5C8\uC2B5\uB2C8\uB2E4. (\uBC18\uB824\uC0AC\uC720: ${reason})`).run();
      return createResponse({ success: true, message: "\uD310\uB9E4\uC790 \uC790\uACA9 \uC2E0\uCCAD\uC774 \uBC18\uB824 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse({ error: `\uBC18\uB824 \uCC98\uB9AC \uC911 \uC624\uB958: ${err.message}` }, 500);
    }
  }
  if (action === "update_grade") {
    const { user_id, grade } = body;
    if (!user_id || !grade) {
      return createResponse({ error: "\uC720\uC800 ID\uC640 \uB4F1\uAE09 \uBA85\uCE6D\uC740 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      await env.DB.prepare("UPDATE profiles SET grade = ? WHERE id = ?").bind(grade, user_id).run();
      return createResponse({ success: true, message: `\uC0AC\uC6A9\uC790 \uB4F1\uAE09\uC774 ${grade}(\uC73C)\uB85C \uC131\uACF5\uC801\uC73C\uB85C \uC870\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` });
    } catch (err) {
      return createResponse({ error: `\uB4F1\uAE09 \uC870\uC815 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "create_coupon") {
    const { name, discount_rate, code } = body;
    if (!name || discount_rate === void 0 || !code) {
      return createResponse({ error: "\uCFE0\uD3F0 \uC774\uB984, \uD560\uC778\uC728, \uCF54\uB4DC\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      await env.DB.prepare("INSERT INTO coupons (name, discount_rate, code) VALUES (?, ?, ?)").bind(name, discount_rate, code).run();
      return createResponse({ success: true, message: "\uCFE0\uD3F0\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse({ error: `\uCFE0\uD3F0 \uC0DD\uC131 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "issue_all") {
    const { coupon_id } = body;
    if (!coupon_id) {
      return createResponse({ error: "\uBC1C\uD589\uD560 \uCFE0\uD3F0 ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      await env.DB.prepare(
        "INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, ?, 0 FROM profiles"
      ).bind(coupon_id).run();
      return createResponse({ success: true, message: "\uBAA8\uB4E0 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uCFE0\uD3F0\uC774 \uC815\uC0C1 \uBC1C\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse({ error: `\uC804\uCCB4 \uCFE0\uD3F0 \uBC1C\uAE09 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "issue_user") {
    const { coupon_id, user_id } = body;
    if (!coupon_id || !user_id) {
      return createResponse({ error: "\uCFE0\uD3F0 ID\uC640 \uC0AC\uC6A9\uC790 ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      await env.DB.prepare("INSERT INTO user_coupons (user_id, coupon_id, is_used) VALUES (?, ?, 0)").bind(user_id, coupon_id).run();
      return createResponse({ success: true, message: "\uB300\uC0C1 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uCFE0\uD3F0\uC774 \uC815\uC0C1 \uBC1C\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse({ error: `\uAC1C\uBCC4 \uCFE0\uD3F0 \uBC1C\uAE09 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAD00\uB9AC\uC790 \uC694\uCCAD \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
function verifyToken2(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken2, "verifyToken2");
__name2(verifyToken2, "verifyToken");
function getAuthenticatedUser(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken2(token);
}
__name(getAuthenticatedUser, "getAuthenticatedUser");
__name2(getAuthenticatedUser, "getAuthenticatedUser");
function createResponse2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse2, "createResponse2");
__name2(createResponse2, "createResponse");
async function onRequestOptions2() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions2, "onRequestOptions2");
__name2(onRequestOptions2, "onRequestOptions");
async function onRequestPost2(context) {
  const { request, env } = context;
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse2({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  const { title, budget, duration } = body;
  if (!title || budget === void 0 || !duration) {
    return createResponse2({ error: "\uAD11\uACE0 \uC81C\uBAA9, \uC608\uC0B0, \uAE30\uAC04 \uC815\uBCF4\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
  }
  try {
    await env.DB.prepare(
      'INSERT INTO advertisements (user_id, title, status, budget, duration) VALUES (?, ?, "pending", ?, ?)'
    ).bind(authUser.id, title, budget, duration).run();
    return createResponse2({ success: true, message: "\uAD11\uACE0 \uC2E0\uCCAD\uC774 \uC815\uC0C1\uC801\uC73C\uB85C \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uAD00\uB9AC\uC790 \uC2B9\uC778 \uD6C4 \uC9D1\uD589\uB429\uB2C8\uB2E4." });
  } catch (err) {
    return createResponse2({ error: `\uAD11\uACE0 \uC2E0\uCCAD \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
function verifyToken3(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken3, "verifyToken3");
__name2(verifyToken3, "verifyToken");
function getAuthenticatedUser2(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken3(token);
}
__name(getAuthenticatedUser2, "getAuthenticatedUser2");
__name2(getAuthenticatedUser2, "getAuthenticatedUser");
function createResponse3(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse3, "createResponse3");
__name2(createResponse3, "createResponse");
async function onRequestOptions3() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions3, "onRequestOptions3");
__name2(onRequestOptions3, "onRequestOptions");
async function onRequestPost3(context) {
  const { request, env } = context;
  const authUser = getAuthenticatedUser2(request);
  const userId = authUser ? authUser.id : null;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  const { dog_id, breed, action_type } = body;
  if (!dog_id || !breed) {
    return createResponse3({ error: "\uB9E4\uBB3C ID(dog_id)\uC640 \uACAC\uC885(breed)\uC740 \uD544\uC218 \uC815\uBCF4\uC785\uB2C8\uB2E4." }, 400);
  }
  try {
    await env.DB.prepare(
      "INSERT INTO analytics_logs (user_id, dog_id, breed, action_type) VALUES (?, ?, ?, ?)"
    ).bind(userId, dog_id, breed, action_type || "view").run();
    return createResponse3({ success: true, message: "\uD589\uB3D9\uB85C\uADF8\uAC00 \uC815\uC0C1\uC801\uC73C\uB85C \uAE30\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  } catch (err) {
    return createResponse3({ success: false, error: err.message }, 200);
  }
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
__name2(hashPassword, "hashPassword");
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
    // 7일 유효
  };
  const utf8Bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  const len = utf8Bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}
__name(generateToken, "generateToken");
__name2(generateToken, "generateToken");
function verifyToken4(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken4, "verifyToken4");
__name2(verifyToken4, "verifyToken");
function getAuthenticatedUser3(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken4(token);
}
__name(getAuthenticatedUser3, "getAuthenticatedUser3");
__name2(getAuthenticatedUser3, "getAuthenticatedUser");
function createResponse4(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse4, "createResponse4");
__name2(createResponse4, "createResponse");
async function onRequestOptions4() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions4, "onRequestOptions4");
__name2(onRequestOptions4, "onRequestOptions");
async function onRequestGet2(context) {
  const { request, env } = context;
  const user = getAuthenticatedUser3(request);
  if (!user) {
    return createResponse4({ error: "\uC778\uC99D \uC138\uC158\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }, 401);
  }
  try {
    const dbUser = await env.DB.prepare("SELECT id, email, nickname, phone, address, profile_image, role, grade, completed_adoption_count, created_at FROM profiles WHERE id = ?").bind(user.id).first();
    if (!dbUser) {
      return createResponse4({ error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uC0AC\uC6A9\uC790 \uACC4\uC815\uC785\uB2C8\uB2E4." }, 404);
    }
    return createResponse4({ user: dbUser });
  } catch (err) {
    return createResponse4({ error: `DB \uC870\uD68C \uC624\uB958: ${err.message}` }, 500);
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequestPost4(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "signup") {
    const { email, password, nickname, phone, address, profile_image } = body;
    if (!email || !password) {
      return createResponse4({ error: "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB294 \uD544\uC218 \uC785\uB825\uC0AC\uD56D\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const existing = await env.DB.prepare("SELECT id FROM profiles WHERE email = ?").bind(email).first();
      if (existing) {
        return createResponse4({ error: "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC774\uBA54\uC77C \uC8FC\uC18C\uC785\uB2C8\uB2E4." }, 409);
      }
      const userId = crypto.randomUUID();
      const hashedPassword = await hashPassword(password);
      await env.DB.prepare(
        "INSERT INTO profiles (id, email, password, nickname, phone, address, profile_image, role, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(userId, email, hashedPassword, nickname || "", phone || "", address || "", profile_image || "", "buyer", "\uC77C\uBC18").run();
      const newUser = { id: userId, email, nickname, phone, address, profile_image, role: "buyer", grade: "\uC77C\uBC18" };
      const token = generateToken(newUser);
      return createResponse4({ user: newUser, token });
    } catch (err) {
      return createResponse4({ error: `\uD68C\uC6D0\uAC00\uC785 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "login") {
    const { email, password } = body;
    if (!email || !password) {
      return createResponse4({ error: "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574 \uC8FC\uC138\uC694." }, 400);
    }
    try {
      const hashedPassword = await hashPassword(password);
      const user = await env.DB.prepare("SELECT * FROM profiles WHERE email = ? AND password = ?").bind(email, hashedPassword).first();
      if (!user) {
        return createResponse4({ error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }, 401);
      }
      const cleanUser = { ...user };
      delete cleanUser.password;
      const token = generateToken(cleanUser);
      return createResponse4({ user: cleanUser, token });
    } catch (err) {
      return createResponse4({ error: `\uB85C\uADF8\uC778 \uC624\uB958: ${err.message}` }, 500);
    }
  }
  if (action === "logout") {
    return createResponse4({ success: true });
  }
  if (action === "update_profile") {
    const authUser = getAuthenticatedUser3(request);
    if (!authUser)
      return createResponse4({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
    const { nickname, phone, address, profile_image } = body;
    try {
      await env.DB.prepare(
        "UPDATE profiles SET nickname = COALESCE(?, nickname), phone = COALESCE(?, phone), address = COALESCE(?, address), profile_image = COALESCE(?, profile_image) WHERE id = ?"
      ).bind(nickname, phone, address, profile_image, authUser.id).run();
      const updatedUser = await env.DB.prepare("SELECT id, email, nickname, phone, address, profile_image, role, grade, completed_adoption_count, created_at FROM profiles WHERE id = ?").bind(authUser.id).first();
      return createResponse4(updatedUser);
    } catch (err) {
      return createResponse4({ error: `\uD504\uB85C\uD544 \uC218\uC815 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "update_password") {
    const authUser = getAuthenticatedUser3(request);
    if (!authUser)
      return createResponse4({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
    const { password } = body;
    if (!password) {
      return createResponse4({ error: "\uC0C8\uB85C\uC6B4 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694." }, 400);
    }
    try {
      const hashedPassword = await hashPassword(password);
      await env.DB.prepare("UPDATE profiles SET password = ? WHERE id = ?").bind(hashedPassword, authUser.id).run();
      return createResponse4({ success: true, message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC548\uC804\uD558\uAC8C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse4({ error: `\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse4({ error: "\uC9C0\uC6D0\uB418\uC9C0 \uC54A\uB294 \uC694\uCCAD \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestPost4, "onRequestPost4");
__name2(onRequestPost4, "onRequestPost");
function verifyToken5(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken5, "verifyToken5");
__name2(verifyToken5, "verifyToken");
function getAuthenticatedUser4(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken5(token);
}
__name(getAuthenticatedUser4, "getAuthenticatedUser4");
__name2(getAuthenticatedUser4, "getAuthenticatedUser");
function createResponse5(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse5, "createResponse5");
__name2(createResponse5, "createResponse");
async function onRequestOptions5() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions5, "onRequestOptions5");
__name2(onRequestOptions5, "onRequestOptions");
async function onRequestGet3(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser4(request);
  if (!authUser) {
    return createResponse5({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  if (action === "check") {
    const dogId = url.searchParams.get("dog_id");
    if (!dogId) {
      return createResponse5({ error: "\uB9E4\uBB3C ID(dog_id)\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const row = await env.DB.prepare("SELECT 1 FROM bookmarks WHERE user_id = ? AND dog_id = ?").bind(authUser.id, dogId).first();
      return createResponse5({ bookmarked: !!row });
    } catch (err) {
      return createResponse5({ bookmarked: false, error: err.message }, 500);
    }
  }
  try {
    const { results } = await env.DB.prepare(
      "SELECT d.* FROM bookmarks b JOIN dogs d ON b.dog_id = d.id WHERE b.user_id = ? ORDER BY b.created_at DESC"
    ).bind(authUser.id).all();
    const cleanResults = results.map((dog) => {
      let images = [];
      if (dog.images) {
        try {
          images = JSON.parse(dog.images);
        } catch (e) {
          images = dog.images.split(",").filter(Boolean);
        }
      }
      return { ...dog, images };
    });
    return createResponse5(cleanResults);
  } catch (err) {
    return createResponse5({ error: `\uBD81\uB9C8\uD06C \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequestPost5(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser4(request);
  if (!authUser) {
    return createResponse5({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "toggle") {
    const { dog_id } = body;
    if (!dog_id) {
      return createResponse5({ error: "\uB9E4\uBB3C ID(dog_id)\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const row = await env.DB.prepare("SELECT id FROM bookmarks WHERE user_id = ? AND dog_id = ?").bind(authUser.id, dog_id).first();
      if (row) {
        await env.DB.prepare("DELETE FROM bookmarks WHERE user_id = ? AND dog_id = ?").bind(authUser.id, dog_id).run();
        return createResponse5({ bookmarked: false, message: "\uBD81\uB9C8\uD06C\uAC00 \uD574\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        await env.DB.prepare("INSERT INTO bookmarks (user_id, dog_id) VALUES (?, ?)").bind(authUser.id, dog_id).run();
        return createResponse5({ bookmarked: true, message: "\uBD81\uB9C8\uD06C\uC5D0 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      }
    } catch (err) {
      return createResponse5({ error: `\uBD81\uB9C8\uD06C \uBCC0\uACBD \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse5({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC694\uCCAD \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestPost5, "onRequestPost5");
__name2(onRequestPost5, "onRequestPost");
function verifyToken6(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken6, "verifyToken6");
__name2(verifyToken6, "verifyToken");
function getAuthenticatedUser5(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken6(token);
}
__name(getAuthenticatedUser5, "getAuthenticatedUser5");
__name2(getAuthenticatedUser5, "getAuthenticatedUser");
function createResponse6(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse6, "createResponse6");
__name2(createResponse6, "createResponse");
async function onRequestOptions6() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions6, "onRequestOptions6");
__name2(onRequestOptions6, "onRequestOptions");
async function onRequestGet4(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser5(request);
  if (!authUser) {
    return createResponse6({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  if (action === "last_application") {
    try {
      const app = await env.DB.prepare(
        "SELECT id, user_id, business_name, biz_no, animal_sale_no, status, rejected_reason, created_at FROM business_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
      ).bind(authUser.id).first();
      return createResponse6(app || null);
    } catch (err) {
      return createResponse6({ error: `\uC2E0\uCCAD \uB0B4\uC5ED \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse6({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC694\uCCAD \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
async function onRequestPost6(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser5(request);
  if (!authUser) {
    return createResponse6({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "apply") {
    const { business_name, biz_no, animal_sale_no } = body;
    if (!business_name || !biz_no || !animal_sale_no) {
      return createResponse6({ error: "\uC0C1\uD638\uBA85, \uC0AC\uC5C5\uC790 \uBC88\uD638, \uD310\uB9E4\uC5C5 \uD5C8\uAC00 \uBC88\uD638\uB294 \uD544\uC218 \uC785\uB825 \uC0AC\uD56D\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const existing = await env.DB.prepare(
        'SELECT status FROM business_applications WHERE user_id = ? AND status IN ("pending", "approved")'
      ).bind(authUser.id).first();
      if (existing) {
        if (existing.status === "approved") {
          return createResponse6({ error: "\uC774\uBBF8 \uD310\uB9E4\uC790 \uC2B9\uC778\uC774 \uC644\uB8CC\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4." }, 400);
        } else {
          return createResponse6({ error: "\uC774\uBBF8 \uC2EC\uC0AC \uC911\uC778 \uC2E0\uCCAD\uC11C\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC\uB9CC \uAE30\uB2E4\uB824 \uC8FC\uC138\uC694." }, 400);
        }
      }
      await env.DB.prepare(
        'INSERT INTO business_applications (user_id, business_name, biz_no, animal_sale_no, status) VALUES (?, ?, ?, ?, "pending")'
      ).bind(authUser.id, business_name, biz_no, animal_sale_no).run();
      return createResponse6({ success: true, message: "\uD310\uB9E4\uC790 \uC790\uACA9 \uC2E0\uCCAD\uC11C\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse6({ error: `\uC2E0\uCCAD\uC11C \uC81C\uCD9C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse6({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC694\uCCAD \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestPost6, "onRequestPost6");
__name2(onRequestPost6, "onRequestPost");
function verifyToken7(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken7, "verifyToken7");
__name2(verifyToken7, "verifyToken");
function getAuthenticatedUser6(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken7(token);
}
__name(getAuthenticatedUser6, "getAuthenticatedUser6");
__name2(getAuthenticatedUser6, "getAuthenticatedUser");
function createResponse7(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse7, "createResponse7");
__name2(createResponse7, "createResponse");
async function onRequestOptions7() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions7, "onRequestOptions7");
__name2(onRequestOptions7, "onRequestOptions");
async function onRequestGet5(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser6(request);
  if (!authUser) {
    return createResponse7({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  if (action === "messages") {
    const roomId = url.searchParams.get("room_id");
    if (!roomId) {
      return createResponse7({ error: "\uCC44\uD305\uBC29 ID(room_id)\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const { results: messages } = await env.DB.prepare(
        "SELECT m.id, m.room_id, m.sender_id, m.message, m.created_at, p.nickname AS sender_nickname, p.profile_image AS sender_profile_image FROM chat_messages m LEFT JOIN profiles p ON m.sender_id = p.id WHERE m.room_id = ? ORDER BY m.created_at ASC"
      ).bind(roomId).all();
      return createResponse7(messages);
    } catch (err) {
      return createResponse7({ error: `\uBA54\uC2DC\uC9C0 \uB0B4\uC5ED \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  try {
    const { results: rooms } = await env.DB.prepare(
      `SELECT r.id, r.seller_id, r.buyer_id, r.dog_id, r.last_message, r.updated_at, r.created_at,
              p_buyer.nickname AS buyer_nickname, p_buyer.profile_image AS buyer_profile_image,
              p_seller.nickname AS seller_nickname, p_seller.profile_image AS seller_profile_image,
              d.nickname AS dog_nickname, d.breed AS dog_breed
       FROM chat_rooms r
       LEFT JOIN profiles p_buyer ON r.buyer_id = p_buyer.id
       LEFT JOIN profiles p_seller ON r.seller_id = p_seller.id
       LEFT JOIN dogs d ON r.dog_id = d.id
       WHERE r.buyer_id = ? OR r.seller_id = ?
       ORDER BY r.updated_at DESC`
    ).bind(authUser.id, authUser.id).all();
    return createResponse7(rooms);
  } catch (err) {
    return createResponse7({ error: `\uCC44\uD305\uBC29 \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestGet5, "onRequestGet5");
__name2(onRequestGet5, "onRequestGet");
async function onRequestPost7(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser6(request);
  if (!authUser) {
    return createResponse7({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "create_room") {
    const { seller_id, buyer_id, dog_id } = body;
    if (!seller_id || !buyer_id || !dog_id) {
      return createResponse7({ error: "\uD310\uB9E4\uC790, \uAD6C\uB9E4\uC790, \uB9E4\uBB3C ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    const roomId = `${buyer_id}_${seller_id}_${dog_id}`;
    try {
      const existing = await env.DB.prepare("SELECT id FROM chat_rooms WHERE id = ?").bind(roomId).first();
      if (existing) {
        return createResponse7({ success: true, room_id: roomId, created: false });
      }
      await env.DB.prepare(
        'INSERT INTO chat_rooms (id, seller_id, buyer_id, dog_id, last_message) VALUES (?, ?, ?, ?, "")'
      ).bind(roomId, seller_id, buyer_id, dog_id).run();
      return createResponse7({ success: true, room_id: roomId, created: true });
    } catch (err) {
      return createResponse7({ error: `\uCC44\uD305\uBC29 \uC0DD\uC131 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "send_message") {
    const { room_id, message } = body;
    if (!room_id || !message) {
      return createResponse7({ error: "\uCC44\uD305\uBC29 ID\uC640 \uBA54\uC2DC\uC9C0 \uB0B4\uC6A9\uC740 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      await env.DB.prepare(
        "INSERT INTO chat_messages (room_id, sender_id, message) VALUES (?, ?, ?)"
      ).bind(room_id, authUser.id, message).run();
      await env.DB.prepare(
        "UPDATE chat_rooms SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(message, room_id).run();
      const room = await env.DB.prepare("SELECT seller_id, buyer_id, dog_id FROM chat_rooms WHERE id = ?").bind(room_id).first();
      if (room) {
        const targetUserId = authUser.id === room.buyer_id ? room.seller_id : room.buyer_id;
        await env.DB.prepare(
          'INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, "chat", ?, 0)'
        ).bind(targetUserId, `${authUser.nickname || "\uB204\uAD70\uAC00"}\uB2D8\uC73C\uB85C\uBD80\uD130 \uC0C8\uB85C\uC6B4 \uCC44\uD305 \uBA54\uC2DC\uC9C0\uAC00 \uB3C4\uCC29\uD588\uC2B5\uB2C8\uB2E4.`).run();
      }
      return createResponse7({ success: true, message: "\uBA54\uC2DC\uC9C0\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC804\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse7({ error: `\uBA54\uC2DC\uC9C0 \uC804\uC1A1 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse7({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC694\uCCAD \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestPost7, "onRequestPost7");
__name2(onRequestPost7, "onRequestPost");
function verifyToken8(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken8, "verifyToken8");
__name2(verifyToken8, "verifyToken");
function getAuthenticatedUser7(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken8(token);
}
__name(getAuthenticatedUser7, "getAuthenticatedUser7");
__name2(getAuthenticatedUser7, "getAuthenticatedUser");
function createResponse8(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse8, "createResponse8");
__name2(createResponse8, "createResponse");
async function onRequestOptions8() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions8, "onRequestOptions8");
__name2(onRequestOptions8, "onRequestOptions");
async function onRequestGet6(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    try {
      const dog = await env.DB.prepare("SELECT * FROM dogs WHERE id = ?").bind(id).first();
      if (!dog) {
        return createResponse8({ error: "\uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
      }
      let images = [];
      if (dog.images) {
        try {
          images = JSON.parse(dog.images);
        } catch (e) {
          images = dog.images.split(",").filter(Boolean);
        }
      }
      const enrichedDog = {
        ...dog,
        images,
        image_url: images[0] || "",
        additional_images: images.slice(1)
      };
      return createResponse8(enrichedDog);
    } catch (err) {
      return createResponse8({ error: `\uB9E4\uBB3C \uC0C1\uC138 \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  const breed = url.searchParams.get("breed");
  const gender = url.searchParams.get("gender");
  const status = url.searchParams.get("status");
  const seller_id = url.searchParams.get("seller_id");
  try {
    let sql = "SELECT * FROM dogs WHERE 1=1";
    const bindings = [];
    if (breed) {
      sql += " AND breed = ?";
      bindings.push(breed);
    }
    if (gender) {
      sql += " AND gender = ?";
      bindings.push(gender);
    }
    if (status) {
      sql += " AND status = ?";
      bindings.push(status);
    }
    if (seller_id) {
      sql += " AND seller_id = ?";
      bindings.push(seller_id);
    }
    sql += " ORDER BY created_at DESC";
    const { results } = await env.DB.prepare(sql).bind(...bindings).all();
    const cleanResults = results.map((dog) => {
      let images = [];
      if (dog.images) {
        try {
          images = JSON.parse(dog.images);
        } catch (e) {
          images = dog.images.split(",").filter(Boolean);
        }
      }
      return {
        ...dog,
        images,
        image_url: images[0] || "",
        additional_images: images.slice(1)
      };
    });
    return createResponse8(cleanResults);
  } catch (err) {
    return createResponse8({ error: `\uB9E4\uBB3C \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestGet6, "onRequestGet6");
__name2(onRequestGet6, "onRequestGet");
async function onRequestPost8(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser7(request);
  if (!authUser) {
    return createResponse8({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "update_status") {
    const { id, status } = body;
    if (!id || !status) {
      return createResponse8({ error: "\uB9E4\uBB3C ID\uC640 \uBCC0\uACBD\uD560 \uC0C1\uD0DC\uAC12\uC740 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const dog = await env.DB.prepare("SELECT seller_id FROM dogs WHERE id = ?").bind(id).first();
      if (!dog) {
        return createResponse8({ error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uB9E4\uBB3C\uC785\uB2C8\uB2E4." }, 404);
      }
      if (dog.seller_id !== authUser.id && authUser.role !== "admin") {
        return createResponse8({ error: "\uBCF8\uC778\uC758 \uB9E4\uBB3C \uC0C1\uD0DC\uB9CC \uC218\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }, 403);
      }
      await env.DB.prepare("UPDATE dogs SET status = ? WHERE id = ?").bind(status, id).run();
      return createResponse8({ success: true, id, status });
    } catch (err) {
      return createResponse8({ error: `\uC0C1\uD0DC \uC218\uC815 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  if (action === "update") {
    const {
      id,
      breed: breed2,
      nickname: nickname2,
      price: price2,
      original_price: original_price2,
      birthday: birthday2,
      is_negotiable: is_negotiable2,
      video_url: video_url2,
      region: region2,
      gender: gender2,
      age: age2,
      vaccine: vaccine2,
      neutered: neutered2,
      description: description2,
      images: images2
    } = body;
    if (!id || !breed2 || !nickname2) {
      return createResponse8({ error: "\uB9E4\uBB3C ID, \uACAC\uC885, \uAC15\uC544\uC9C0 \uC774\uB984\uC740 \uD544\uC218 \uD56D\uBAA9\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      const dog = await env.DB.prepare("SELECT seller_id FROM dogs WHERE id = ?").bind(id).first();
      if (!dog) {
        return createResponse8({ error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uB9E4\uBB3C\uC785\uB2C8\uB2E4." }, 404);
      }
      if (dog.seller_id !== authUser.id && authUser.role !== "admin") {
        return createResponse8({ error: "\uC218\uC815 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }, 403);
      }
      const imagesStr = Array.isArray(images2) ? JSON.stringify(images2) : "[]";
      await env.DB.prepare(
        `UPDATE dogs SET 
          breed = ?, 
          nickname = ?, 
          price = ?, 
          original_price = ?, 
          birthday = ?, 
          is_negotiable = ?, 
          video_url = ?, 
          region = ?, 
          gender = ?, 
          age = ?, 
          vaccine = ?, 
          neutered = ?, 
          description = ?, 
          images = ?
        WHERE id = ?`
      ).bind(
        breed2,
        nickname2,
        price2 !== void 0 ? Number(price2) : 0,
        original_price2 !== void 0 && original_price2 !== null ? Number(original_price2) : null,
        birthday2 || null,
        is_negotiable2 ? 1 : 0,
        video_url2 || null,
        region2 || "",
        gender2 || "\uB0A8\uC544",
        age2 || "",
        vaccine2 || "",
        neutered2 ? 1 : 0,
        description2 || "",
        imagesStr,
        id
      ).run();
      return createResponse8({ success: true, id, nickname: nickname2 });
    } catch (err) {
      return createResponse8({ error: `\uB9E4\uBB3C \uC218\uC815 \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  const {
    breed,
    nickname,
    price,
    original_price,
    birthday,
    is_negotiable,
    video_url,
    region,
    gender,
    age,
    vaccine,
    neutered,
    description,
    images
  } = body;
  if (!breed || !nickname) {
    return createResponse8({ error: "\uACAC\uC885\uACFC \uAC15\uC544\uC9C0 \uC774\uB984\uC740 \uD544\uC218 \uC785\uB825 \uD56D\uBAA9\uC785\uB2C8\uB2E4." }, 400);
  }
  try {
    const profile = await env.DB.prepare("SELECT role FROM profiles WHERE id = ?").bind(authUser.id).first();
    if (!profile || profile.role !== "seller" && profile.role !== "admin") {
      return createResponse8({ error: "\uD310\uB9E4\uC790 \uC790\uACA9 \uC2E0\uCCAD \uC2B9\uC778 \uC644\uB8CC \uD6C4 \uB9E4\uBB3C\uC744 \uB4F1\uB85D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }, 403);
    }
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : "[]";
    const result = await env.DB.prepare(
      `INSERT INTO dogs (
        breed, nickname, price, original_price, birthday, 
        is_negotiable, video_url, region, gender, age, 
        vaccine, neutered, description, images, status, seller_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      breed,
      nickname,
      price !== void 0 ? Number(price) : 0,
      original_price !== void 0 && original_price !== null ? Number(original_price) : null,
      birthday || null,
      is_negotiable ? 1 : 0,
      video_url || null,
      region || "",
      gender || "\uB0A8\uC544",
      age || "",
      vaccine || "",
      neutered ? 1 : 0,
      description || "",
      imagesStr,
      "available",
      authUser.id
    ).run();
    const newId = result.meta.last_row_id;
    return createResponse8({ success: true, id: newId, nickname });
  } catch (err) {
    return createResponse8({ error: `\uB9E4\uBB3C \uB4F1\uB85D \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestPost8, "onRequestPost8");
__name2(onRequestPost8, "onRequestPost");
async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const authUser = getAuthenticatedUser7(request);
  if (!authUser) {
    return createResponse8({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  if (!id) {
    return createResponse8({ error: "\uC0AD\uC81C\uD560 \uB9E4\uBB3C ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }, 400);
  }
  try {
    const dog = await env.DB.prepare("SELECT seller_id FROM dogs WHERE id = ?").bind(id).first();
    if (!dog) {
      return createResponse8({ error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uB9E4\uBB3C\uC785\uB2C8\uB2E4." }, 404);
    }
    if (dog.seller_id !== authUser.id && authUser.role !== "admin") {
      return createResponse8({ error: "\uC0AD\uC81C \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }, 403);
    }
    await env.DB.prepare("DELETE FROM dogs WHERE id = ?").bind(id).run();
    return createResponse8({ success: true, message: "\uB9E4\uBB3C\uC774 \uC548\uC804\uD558\uAC8C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  } catch (err) {
    return createResponse8({ error: `\uB9E4\uBB3C \uC0AD\uC81C \uC624\uB958: ${err.message}` }, 500);
  }
}
__name(onRequestDelete, "onRequestDelete");
__name2(onRequestDelete, "onRequestDelete");
function createResponse9(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(createResponse9, "createResponse9");
__name2(createResponse9, "createResponse");
async function onRequestOptions9() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions9, "onRequestOptions9");
__name2(onRequestOptions9, "onRequestOptions");
async function onRequestGet7(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return createResponse9({ error: "\uC870\uD68C\uD560 \uD30C\uC77C Key\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }, 400);
  }
  if (!env.R2) {
    return createResponse9({ error: "R2 \uC2A4\uD1A0\uB9AC\uC9C0 \uBC14\uC778\uB529\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 500);
  }
  try {
    const object = await env.R2.get(key);
    if (!object) {
      return createResponse9({ error: "\uD574\uB2F9 \uC774\uBBF8\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=86400");
    return new Response(object.body, {
      headers
    });
  } catch (err) {
    return createResponse9({ error: `\uC774\uBBF8\uC9C0 \uC870\uD68C \uC911 \uC624\uB958 \uBC1C\uC0DD: ${err.message}` }, 500);
  }
}
__name(onRequestGet7, "onRequestGet7");
__name2(onRequestGet7, "onRequestGet");
function verifyToken9(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken9, "verifyToken9");
__name2(verifyToken9, "verifyToken");
function getAuthenticatedUser8(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken9(token);
}
__name(getAuthenticatedUser8, "getAuthenticatedUser8");
__name2(getAuthenticatedUser8, "getAuthenticatedUser");
function createResponse10(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse10, "createResponse10");
__name2(createResponse10, "createResponse");
async function onRequestOptions10() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions10, "onRequestOptions10");
__name2(onRequestOptions10, "onRequestOptions");
async function onRequestGet8(context) {
  const { request, env } = context;
  const authUser = getAuthenticatedUser8(request);
  if (!authUser) {
    return createResponse10({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, user_id, type, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(authUser.id).all();
    return createResponse10(results);
  } catch (err) {
    return createResponse10({ error: `\uC54C\uB9BC \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestGet8, "onRequestGet8");
__name2(onRequestGet8, "onRequestGet");
async function onRequestPost9(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser8(request);
  if (!authUser) {
    return createResponse10({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "read_all") {
    try {
      await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").bind(authUser.id).run();
      return createResponse10({ success: true, message: "\uBAA8\uB4E0 \uC54C\uB9BC\uC744 \uC77D\uC74C \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse10({ error: `\uC54C\uB9BC \uC77D\uC74C \uCC98\uB9AC \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  const { user_id, type, message } = body;
  if (!user_id || !message) {
    return createResponse10({ error: "\uB300\uC0C1 \uC720\uC800 ID\uC640 \uC54C\uB9BC \uBA54\uC2DC\uC9C0\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
  }
  try {
    await env.DB.prepare("INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, ?, ?, 0)").bind(user_id, type || "system", message).run();
    return createResponse10({ success: true, message: "\uC54C\uB9BC\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  } catch (err) {
    return createResponse10({ error: `\uC54C\uB9BC \uB4F1\uB85D \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestPost9, "onRequestPost9");
__name2(onRequestPost9, "onRequestPost");
function verifyToken10(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken10, "verifyToken10");
__name2(verifyToken10, "verifyToken");
function getAuthenticatedUser9(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken10(token);
}
__name(getAuthenticatedUser9, "getAuthenticatedUser9");
__name2(getAuthenticatedUser9, "getAuthenticatedUser");
function createResponse11(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse11, "createResponse11");
__name2(createResponse11, "createResponse");
async function onRequestOptions11() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions11, "onRequestOptions11");
__name2(onRequestOptions11, "onRequestOptions");
async function onRequestPost10(context) {
  const { request, env } = context;
  const authUser = getAuthenticatedUser9(request);
  if (!authUser) {
    return createResponse11({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  const { target_id, type, reason } = body;
  if (!target_id || !type) {
    return createResponse11({ error: "\uC2E0\uACE0 \uB300\uC0C1 \uB9E4\uBB3C ID\uC640 \uC2E0\uACE0 \uC0AC\uC720 \uC720\uD615\uC740 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
  }
  try {
    await env.DB.prepare(
      "INSERT INTO reports (user_id, target_id, type, reason) VALUES (?, ?, ?, ?)"
    ).bind(authUser.id, target_id, type, reason || "").run();
    return createResponse11({ success: true, message: "\uC2E0\uACE0\uAC00 \uC815\uC0C1\uC801\uC73C\uB85C \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC601\uC9C4\uC774 \uAC80\uD1A0\uD560 \uC608\uC815\uC785\uB2C8\uB2E4." });
  } catch (err) {
    return createResponse11({ error: `\uC2E0\uACE0 \uC811\uC218 \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestPost10, "onRequestPost10");
__name2(onRequestPost10, "onRequestPost");
function verifyToken11(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken11, "verifyToken11");
__name2(verifyToken11, "verifyToken");
function getAuthenticatedUser10(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken11(token);
}
__name(getAuthenticatedUser10, "getAuthenticatedUser10");
__name2(getAuthenticatedUser10, "getAuthenticatedUser");
function createResponse12(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse12, "createResponse12");
__name2(createResponse12, "createResponse");
async function onRequestOptions12() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions12, "onRequestOptions12");
__name2(onRequestOptions12, "onRequestOptions");
async function onRequestGet9(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const sellerId = url.searchParams.get("seller_id");
  if (!sellerId) {
    return createResponse12({ error: "\uD310\uB9E4\uC790 ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
  }
  if (action === "reviews") {
    try {
      const { results: reviews } = await env.DB.prepare(
        "SELECT r.id, r.seller_id, r.reviewer_id, r.rating, r.content, r.created_at, p.nickname, p.profile_image FROM store_reviews r LEFT JOIN profiles p ON r.reviewer_id = p.id WHERE r.seller_id = ? ORDER BY r.created_at DESC"
      ).bind(sellerId).all();
      return createResponse12(reviews);
    } catch (err) {
      return createResponse12({ error: `\uB9AC\uBDF0 \uBAA9\uB85D \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  try {
    const profile = await env.DB.prepare("SELECT id, email, nickname, phone, address, profile_image, role, grade, completed_adoption_count, created_at FROM profiles WHERE id = ?").bind(sellerId).first();
    if (!profile) {
      return createResponse12({ error: "\uC0C1\uC810\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
    }
    const biz = await env.DB.prepare('SELECT business_name, biz_no, animal_sale_no FROM business_applications WHERE user_id = ? AND status = "approved"').bind(sellerId).first();
    return createResponse12({
      profile,
      biz: biz || null
    });
  } catch (err) {
    return createResponse12({ error: `\uC0C1\uC810 \uC815\uBCF4 \uC870\uD68C \uC2E4\uD328: ${err.message}` }, 500);
  }
}
__name(onRequestGet9, "onRequestGet9");
__name2(onRequestGet9, "onRequestGet");
async function onRequestPost11(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const authUser = getAuthenticatedUser10(request);
  if (!authUser) {
    return createResponse12({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  if (action === "create_review") {
    const { seller_id, rating, content } = body;
    if (!seller_id || rating === void 0) {
      return createResponse12({ error: "\uD310\uB9E4\uC790 ID\uC640 \uD3C9\uC810\uC740 \uD544\uC218 \uC785\uB825 \uC0AC\uD56D\uC785\uB2C8\uB2E4." }, 400);
    }
    try {
      if (seller_id === authUser.id) {
        return createResponse12({ error: "\uC790\uC2E0\uC758 \uC0C1\uC810\uC5D0\uB294 \uB9AC\uBDF0\uB97C \uC791\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 400);
      }
      await env.DB.prepare(
        "INSERT INTO store_reviews (seller_id, reviewer_id, rating, content) VALUES (?, ?, ?, ?)"
      ).bind(seller_id, authUser.id, rating, content || "").run();
      return createResponse12({ success: true, message: "\uB9AC\uBDF0\uAC00 \uC815\uC0C1\uC801\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (err) {
      return createResponse12({ error: `\uB9AC\uBDF0 \uB4F1\uB85D \uC2E4\uD328: ${err.message}` }, 500);
    }
  }
  return createResponse12({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC694\uCCAD \uC561\uC158\uC785\uB2C8\uB2E4." }, 400);
}
__name(onRequestPost11, "onRequestPost11");
__name2(onRequestPost11, "onRequestPost");
function verifyToken12(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch (e) {
    return null;
  }
}
__name(verifyToken12, "verifyToken12");
__name2(verifyToken12, "verifyToken");
function getAuthenticatedUser11(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return null;
  const token = authHeader.split(" ")[1];
  return verifyToken12(token);
}
__name(getAuthenticatedUser11, "getAuthenticatedUser11");
__name2(getAuthenticatedUser11, "getAuthenticatedUser");
function createResponse13(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(createResponse13, "createResponse13");
__name2(createResponse13, "createResponse");
async function onRequestOptions13() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(onRequestOptions13, "onRequestOptions13");
__name2(onRequestOptions13, "onRequestOptions");
async function onRequestPost12(context) {
  const { request, env } = context;
  const authUser = getAuthenticatedUser11(request);
  if (!authUser) {
    return createResponse13({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC791\uC5C5\uC785\uB2C8\uB2E4." }, 401);
  }
  if (!env.R2) {
    return createResponse13({ error: "R2 \uC2A4\uD1A0\uB9AC\uC9C0 \uBC14\uC778\uB529\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 500);
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return createResponse13({ error: "\uC5C5\uB85C\uB4DC\uD560 \uD30C\uC77C\uC774 \uC804\uC1A1\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return createResponse13({ error: "\uD30C\uC77C \uD06C\uAE30\uB294 \uCD5C\uB300 5MB\uAE4C\uC9C0 \uAC00\uB2A5\uD569\uB2C8\uB2E4." }, 400);
    }
    const fileExt = file.name.split(".").pop() || "jpg";
    const randomId = Math.random().toString(36).substring(2, 8);
    const key = `dogs/${authUser.id}_${Date.now()}_${randomId}.${fileExt}`;
    await env.R2.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "image/jpeg" }
    });
    const publicUrl = `/api/images?key=${encodeURIComponent(key)}`;
    return createResponse13({ success: true, url: publicUrl, key });
  } catch (err) {
    return createResponse13({ error: `\uD30C\uC77C \uC5C5\uB85C\uB4DC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${err.message}` }, 500);
  }
}
__name(onRequestPost12, "onRequestPost12");
__name2(onRequestPost12, "onRequestPost");
var routes = [
  {
    routePath: "/api/admin",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/admin",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/ads",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/ads",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/analytics",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/analytics",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/bookmarks",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/bookmarks",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions5]
  },
  {
    routePath: "/api/bookmarks",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/business",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/business",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions6]
  },
  {
    routePath: "/api/business",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions7]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/dogs",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/dogs",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/dogs",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions8]
  },
  {
    routePath: "/api/dogs",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/images",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/images",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions9]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions10]
  },
  {
    routePath: "/api/notifications",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/reports",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions11]
  },
  {
    routePath: "/api/reports",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/store",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/store",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions12]
  },
  {
    routePath: "/api/store",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  },
  {
    routePath: "/api/upload",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions13]
  },
  {
    routePath: "/api/upload",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost12]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = /* @__PURE__ */ __name(class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
}, "__Facade_ScheduledController__");
__name2(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-bxzGDF/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-bxzGDF/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__2, "__Facade_ScheduledController__");
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.7622226114961816.js.map
