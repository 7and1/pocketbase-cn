routerAdd("POST", "/api/newsletter/subscribe", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  function randomToken() {
    var s = "";
    for (var i = 0; i < 64; i++)
      s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }

  function normalizeEmail(email) {
    return pbcn.trim(email).toLowerCase();
  }

  function looksLikeEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
  }

  function siteUrl() {
    return pbcn
      .trim(pbcn.env("PUBLIC_SITE_URL", pbcn.env("SITE_URL", "")))
      .replace(/\/+$/g, "");
  }

  function sendResendEmail(opts) {
    var apiKey = pbcn.env("RESEND_API_KEY", "");
    if (!apiKey) return false;

    var from = pbcn.env("NEWSLETTER_FROM", pbcn.env("RESEND_FROM", ""));
    if (!from) return false;

    var payload = {
      from: from,
      to: [String(opts.to || "")],
      subject: String(opts.subject || ""),
    };

    if (opts.html) payload.html = String(opts.html);
    if (opts.text) payload.text = String(opts.text);

    try {
      var res = $http.send({
        url: "https://api.resend.com/emails",
        method: "POST",
        timeout: 15,
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return res && res.statusCode >= 200 && res.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  function ensureNewsletterRecord(email, source) {
    var token = randomToken();
    try {
      var existing = $app.findFirstRecordByFilter(
        "newsletter",
        "email = {:email}",
        { email: email },
      );
      existing.set("status", "pending");
      existing.set("token", token);
      existing.set("confirmed_at", null);
      existing.set("unsubscribed_at", null);
      if (source) existing.set("source", source);
      $app.save(existing);
      return existing;
    } catch (_) {
      var col = $app.findCollectionByNameOrId("newsletter");
      var r = new Record(col);
      r.set("email", email);
      r.set("status", "pending");
      r.set("token", token);
      if (source) r.set("source", source);
      $app.save(r);
      return r;
    }
  }

  function sendConfirmEmail(email, token) {
    var base = siteUrl();
    var confirmUrl = base
      ? base + "/newsletter/confirm?token=" + encodeURIComponent(token)
      : "";
    var unsubUrl = base
      ? base + "/newsletter/unsubscribe?token=" + encodeURIComponent(token)
      : "";

    var subject = "确认订阅 PocketBase 版本更新";
    var text =
      "请点击链接确认订阅：\n" +
      confirmUrl +
      "\n\n如果不是你本人操作，可以忽略此邮件。\n\n退订链接：\n" +
      unsubUrl;

    var html =
      "<p>请点击链接确认订阅：</p>" +
      '<p><a href="' +
      confirmUrl +
      '">确认订阅</a></p>' +
      "<p>如果不是你本人操作，可以忽略此邮件。</p>" +
      '<p style="margin-top:24px">退订链接：<a href="' +
      unsubUrl +
      '">退订</a></p>';

    return sendResendEmail({
      to: email,
      subject: subject,
      text: text,
      html: html,
    });
  }

  var ip = "";
  try {
    ip = c.realIP();
  } catch (_) {}

  if (
    !pbcn.rateLimitAllow({
      id: "newsletter_subscribe",
      windowSec: 60,
      max: 10,
      key: ip || "anon",
    })
  ) {
    return c.json(429, {
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
  }

  var info = c.requestInfo() || {};
  var body = info.body || {};

  var email = normalizeEmail(body.email || "");
  var source = pbcn.trim(body.source || "");

  if (!looksLikeEmail(email)) {
    return c.json(400, {
      error: { code: "INVALID_EMAIL", message: "Invalid email" },
    });
  }

  var rec = ensureNewsletterRecord(email, source);
  // best-effort email send
  try {
    sendConfirmEmail(email, rec.get("token"));
  } catch (_) {}

  return c.json(200, { data: { ok: true, status: "pending" } });
});

routerAdd("GET", "/api/newsletter/confirm", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var info = c.requestInfo() || {};
  var token = info.query && info.query.token ? String(info.query.token) : "";
  token = pbcn.trim(token);
  if (!token)
    return c.json(400, {
      error: { code: "MISSING_TOKEN", message: "Missing token" },
    });

  var rec = null;
  try {
    rec = $app.findFirstRecordByFilter("newsletter", "token = {:token}", {
      token: token,
    });
  } catch (_) {
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Subscription not found" },
    });
  }

  rec.set("status", "confirmed");
  rec.set("confirmed_at", new Date().toISOString());
  $app.save(rec);

  return c.json(200, { data: { ok: true, status: "confirmed" } });
});

routerAdd("GET", "/api/newsletter/unsubscribe", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var info = c.requestInfo() || {};
  var token = info.query && info.query.token ? String(info.query.token) : "";
  token = pbcn.trim(token);
  if (!token)
    return c.json(400, {
      error: { code: "MISSING_TOKEN", message: "Missing token" },
    });

  var rec = null;
  try {
    rec = $app.findFirstRecordByFilter("newsletter", "token = {:token}", {
      token: token,
    });
  } catch (_) {
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Subscription not found" },
    });
  }

  rec.set("status", "unsubscribed");
  rec.set("unsubscribed_at", new Date().toISOString());
  $app.save(rec);

  return c.json(200, { data: { ok: true, status: "unsubscribed" } });
});
