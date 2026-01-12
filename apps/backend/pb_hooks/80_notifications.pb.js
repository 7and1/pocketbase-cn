/// <reference path="../types.d.ts" />

// User notification system for plugin/showcase status changes.
// Sends email notifications via Resend when items are approved or rejected.
// Keep ES5-compatible syntax (Goja).

(function () {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  function trim(s) {
    return String(s || "").replace(/^\s+|\s+$/g, "");
  }

  function siteUrl() {
    return trim(pbcn.env("PUBLIC_SITE_URL", pbcn.env("SITE_URL", ""))).replace(
      /\/+$/g,
      "",
    );
  }

  // Read email template from file system
  function readTemplate(name) {
    try {
      var tmplPath = __hooks + "/../templates/emails/" + name + ".html";
      var fs = require("fs");
      var content = fs.readFileSync(tmplPath, "utf8");
      return content;
    } catch (e) {
      console.log("[NOTIFICATIONS] Template not found: " + name);
      return null;
    }
  }

  // Replace placeholders in template
  function renderTemplate(html, data) {
    var result = String(html || "");
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var placeholder = "{{" + key + "}}";
        var value = String(data[key] || "");
        result = result.split(placeholder).join(value);
      }
    }
    return result;
  }

  // Send email via Resend API
  function sendEmail(to, subject, html) {
    var apiKey = pbcn.env("RESEND_API_KEY", "");
    if (!apiKey) {
      console.log(
        "[NOTIFICATIONS] RESEND_API_KEY not configured, skipping email",
      );
      return false;
    }

    var from = pbcn.env(
      "RESEND_FROM_EMAIL",
      pbcn.env("NEWSLETTER_FROM", "noreply@pocketbase.cn"),
    );
    if (!from) from = "noreply@pocketbase.cn";

    var payload = {
      from: from,
      to: [String(to)],
      subject: String(subject),
      html: String(html),
    };

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
      var success = res && res.statusCode >= 200 && res.statusCode < 300;
      if (!success) {
        console.log(
          "[NOTIFICATIONS] Email failed: " +
            (res ? res.statusCode : "unknown") +
            " to=" +
            to,
        );
      }
      return success;
    } catch (e) {
      console.log("[NOTIFICATIONS] Email error: " + (e.message || String(e)));
      return false;
    }
  }

  // Get user email from author ID
  function getUserEmail(authorId) {
    try {
      var user = $app.findRecordById("users", authorId);
      return user.get("email") || null;
    } catch (e) {
      console.log("[NOTIFICATIONS] User not found: " + authorId);
      return null;
    }
  }

  // Check if status changed to a specific value
  function didStatusChange(e, toStatus) {
    try {
      var oldStatus = e.record ? trim(e.record.get("status")) : "";
      var newStatus =
        e.requestInfo && e.requestInfo.body
          ? trim(e.requestInfo.body.status || "")
          : "";
      return oldStatus !== toStatus && newStatus === toStatus;
    } catch (e2) {
      return false;
    }
  }

  // Get rejection reason from request
  function getRejectionReason(e) {
    try {
      var info = e.requestInfo || {};
      var body = info.body || {};
      var reason = trim(body.rejection_reason || body.reason || "");
      if (!reason) {
        reason =
          "Please review the submission guidelines and update your submission.";
      }
      return reason;
    } catch (e2) {
      return "Please review the submission guidelines and update your submission.";
    }
  }

  // Handler: Plugin approved
  function handlePluginApproved(e) {
    var record = e.record;
    var authorId = record ? trim(record.get("author")) : "";
    if (!authorId) return;

    var email = getUserEmail(authorId);
    if (!email) return;

    var tmpl = readTemplate("plugin-approved");
    if (!tmpl) return;

    var base = siteUrl();
    var slug = trim(record.get("slug"));
    var html = renderTemplate(tmpl, {
      plugin_name: record.get("name") || "Untitled",
      plugin_description: trim(record.get("description") || "").substring(
        0,
        200,
      ),
      plugin_url: base ? base + "/plugins/" + slug : "",
    });

    sendEmail(email, "Your Plugin Has Been Approved!", html);
    console.log("[NOTIFICATIONS] Plugin approved email sent to: " + email);
  }

  // Handler: Plugin rejected
  function handlePluginRejected(e) {
    var record = e.record;
    var authorId = record ? trim(record.get("author")) : "";
    if (!authorId) return;

    var email = getUserEmail(authorId);
    if (!email) return;

    var tmpl = readTemplate("plugin-rejected");
    if (!tmpl) return;

    var base = siteUrl();
    var slug = trim(record.get("slug"));
    var reason = getRejectionReason(e);
    var html = renderTemplate(tmpl, {
      plugin_name: record.get("name") || "Untitled",
      rejection_reason: reason,
      edit_url: base ? base + "/plugins/" + slug + "/edit" : "",
    });

    sendEmail(email, "Action Required: Plugin Submission Update", html);
    console.log("[NOTIFICATIONS] Plugin rejected email sent to: " + email);
  }

  // Handler: Showcase approved
  function handleShowcaseApproved(e) {
    var record = e.record;
    var authorId = record ? trim(record.get("author")) : "";
    if (!authorId) return;

    var email = getUserEmail(authorId);
    if (!email) return;

    var tmpl = readTemplate("showcase-approved");
    if (!tmpl) return;

    var base = siteUrl();
    var slug = trim(record.get("slug"));
    var html = renderTemplate(tmpl, {
      showcase_title: record.get("title") || "Untitled",
      showcase_description: trim(record.get("description") || "").substring(
        0,
        200,
      ),
      showcase_url: base ? base + "/showcase/" + slug : "",
    });

    sendEmail(email, "Your Showcase Has Been Approved!", html);
    console.log("[NOTIFICATIONS] Showcase approved email sent to: " + email);
  }

  // Handler: Showcase rejected
  function handleShowcaseRejected(e) {
    var record = e.record;
    var authorId = record ? trim(record.get("author")) : "";
    if (!authorId) return;

    var email = getUserEmail(authorId);
    if (!email) return;

    var tmpl = readTemplate("showcase-rejected");
    if (!tmpl) return;

    var base = siteUrl();
    var slug = trim(record.get("slug"));
    var reason = getRejectionReason(e);
    var html = renderTemplate(tmpl, {
      showcase_title: record.get("title") || "Untitled",
      rejection_reason: reason,
      edit_url: base ? base + "/showcase/" + slug + "/edit" : "",
    });

    sendEmail(email, "Action Required: Showcase Submission Update", html);
    console.log("[NOTIFICATIONS] Showcase rejected email sent to: " + email);
  }

  // Listen for plugin status changes (after update succeeds)
  onRecordAfterUpdateSuccess(function (e) {
    if (!e.collection || !e.collection.name) return;
    if (String(e.collection.name) !== "plugins") return;

    // Only staff can change status, so we check for status transitions
    if (didStatusChange(e, "approved")) {
      handlePluginApproved(e);
    } else if (didStatusChange(e, "rejected")) {
      handlePluginRejected(e);
    }
  });

  // Listen for showcase status changes (after update succeeds)
  onRecordAfterUpdateSuccess(function (e) {
    if (!e.collection || !e.collection.name) return;
    if (String(e.collection.name) !== "showcase") return;

    if (didStatusChange(e, "approved")) {
      handleShowcaseApproved(e);
    } else if (didStatusChange(e, "rejected")) {
      handleShowcaseRejected(e);
    }
  });

  // Admin API endpoint for manual notification trigger
  routerAdd("POST", "/api/notifications/resend", function (c) {
    var authRecord = c.auth || null;
    if (!authRecord) {
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    var pbcn = require(__hooks + "/lib/pbcn.js");
    if (!pbcn.isStaff(authRecord)) {
      return c.json(403, {
        error: { code: "FORBIDDEN", message: "Staff only" },
      });
    }

    var info = c.requestInfo() || {};
    var body = info.body || {};

    var type = trim(body.type || ""); // "plugin" or "showcase"
    var action = trim(body.action || ""); // "approved" or "rejected"
    var recordId = trim(body.id || "");

    if (!type || !action || !recordId) {
      return c.json(400, {
        error: {
          code: "INVALID_BODY",
          message: "Missing type, action, or id",
        },
      });
    }

    if (type !== "plugin" && type !== "showcase") {
      return c.json(400, {
        error: {
          code: "INVALID_TYPE",
          message: "Type must be plugin or showcase",
        },
      });
    }

    if (action !== "approved" && action !== "rejected") {
      return c.json(400, {
        error: {
          code: "INVALID_ACTION",
          message: "Action must be approved or rejected",
        },
      });
    }

    var collection = type === "plugin" ? "plugins" : "showcase";
    var record = null;
    try {
      record = $app.findRecordById(collection, recordId);
    } catch (e2) {
      return c.json(404, {
        error: { code: "NOT_FOUND", message: "Record not found" },
      });
    }

    // Create mock event object
    var mockEvent = {
      record: record,
      requestInfo: function () {
        return {
          body: { status: action, rejection_reason: body.reason || "" },
        };
      },
    };

    try {
      if (type === "plugin") {
        if (action === "approved") {
          handlePluginApproved(mockEvent);
        } else {
          handlePluginRejected(mockEvent);
        }
      } else {
        if (action === "approved") {
          handleShowcaseApproved(mockEvent);
        } else {
          handleShowcaseRejected(mockEvent);
        }
      }
      return c.json(200, { data: { ok: true, sent: true } });
    } catch (e3) {
      console.log(
        "[NOTIFICATIONS] Manual send error: " + (e3.message || String(e3)),
      );
      return c.json(500, {
        error: { code: "SEND_FAILED", message: "Failed to send notification" },
      });
    }
  });
})();
