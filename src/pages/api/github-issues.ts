import type { APIRoute } from "astro";

const GITHUB_OWNER = import.meta.env.GITHUB_OWNER || "your-github-username";
const GITHUB_REPO = import.meta.env.GITHUB_REPO || "your-repo-name";
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN || undefined; // 可选

export const GET: APIRoute = async () => {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=100`;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }
  try {
    const resp = await fetch(apiUrl, { headers });
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `GitHub API error: ${resp.status}` }), { status: 500 });
    }
    const issues = await resp.json();
    // 只保留必要字段
    const bookmarks = issues.map((issue: any) => ({
      id: issue.id,
      url: issue.html_url,
      title: issue.title,
      body: issue.body,
      labels: issue.labels.map((l: any) => l.name),
      created_at: issue.created_at,
      user: issue.user?.login,
    }));
    return new Response(JSON.stringify({ bookmarks }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
