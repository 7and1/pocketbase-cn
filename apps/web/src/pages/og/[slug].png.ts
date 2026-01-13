import React from "react";
import { ImageResponse } from "@vercel/og";
import { getCollection } from "astro:content";

export const prerender = true;

interface Context {
  params: { slug: string };
}

export async function GET(context: Context) {
  const { slug } = context.params;

  // Try to find blog post
  const posts = await getCollection("blog");
  const post = posts.find((p: { slug: string }) => p.slug === slug);

  const title = post?.data.title || "PocketBase.cn";
  const description =
    post?.data.description ||
    "PocketBase 中文文档、插件市场、案例展示与下载镜像";
  const category = post?.data.category || "";

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
      },
      [
        // Header bar
        React.createElement("div", {
          key: "header-bar",
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background:
              "linear-gradient(90deg, #3366ff 0%, #6366f1 100%)",
          },
        }),
        // Logo badge
        React.createElement(
          "div",
          {
            key: "logo-badge",
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "32px",
            },
          },
          [
            React.createElement(
              "div",
              {
                key: "logo-icon",
                style: {
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  backgroundColor: "#3366ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#ffffff",
                },
              },
              "PB",
            ),
            React.createElement(
              "div",
              {
                key: "logo-text",
                style: {
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#ffffff",
                },
              },
              "PocketBase.cn",
            ),
          ],
        ),
        // Category badge
        category
          ? React.createElement(
              "div",
              {
                key: "category-badge",
                style: {
                  padding: "8px 20px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  color: "#a5b4fc",
                  fontSize: "16px",
                  fontWeight: "500",
                  marginBottom: "24px",
                },
              },
              category,
            )
          : null,
        // Title
        React.createElement(
          "div",
          {
            key: "title",
            style: {
              fontSize: post && title.length > 30 ? "42px" : "56px",
              fontWeight: "700",
              color: "#ffffff",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: "1.2",
              marginBottom: "20px",
              padding: "0 40px",
            },
          },
          title,
        ),
        // Description
        React.createElement(
          "div",
          {
            key: "description",
            style: {
              fontSize: "20px",
              color: "#94a3b8",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: "1.5",
              padding: "0 40px",
            },
          },
          description,
        ),
        // Footer
        React.createElement(
          "div",
          {
            key: "footer",
            style: {
              position: "absolute",
              bottom: "40px",
              fontSize: "16px",
              color: "#64748b",
            },
          },
          "pocketbase.cn",
        ),
      ].filter(Boolean),
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
