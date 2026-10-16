import * as core from "@actions/core";
import * as github from "@actions/github";
import OpenAI from "openai";

async function run() {
  try {
    const xaiKey = core.getInput("xai-api-key", { required: true });
    const token = core.getInput("github-token", { required: true });
    const mode = core.getInput("mode") || "auto";
    const model = core.getInput("model") || "grok-3";

    const octokit = github.getOctokit(token);
    const context = github.context;

    const client = new OpenAI({
      apiKey: xaiKey,
      baseURL: "https://api.x.ai/v1",
    });

    const eventName = context.eventName;

    if (eventName === "pull_request" && (mode === "auto" || mode === "review")) {
      await handlePullRequest(client, octokit, context, model);
    } else if (eventName === "issues" && (mode === "auto" || mode === "triage")) {
      await handleIssue(client, octokit, context, model);
    } else {
      core.info(`No action for event=${eventName} mode=${mode}`);
    }
  } catch (err: any) {
    core.setFailed(err.message);
  }
}

async function handlePullRequest(
  client: OpenAI,
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context,
  model: string
) {
  const pr = context.payload.pull_request;
  if (!pr) return;

  const { data: files } = await octokit.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
  });

  const diffSummary = files
    .slice(0, 30)
    .map((f) => `### ${f.filename} (${f.status})\n${f.patch?.slice(0, 1500) || "(binary or too large)"}`)
    .join("\n\n");

  const prompt = `You are Agent Alpha Dolly, a senior code reviewer powered by Grok.
Review the following pull request and give a concise, constructive review.
Focus on bugs, security, performance, and clarity. Use markdown.

PR Title: ${pr.title}
PR Body: ${pr.body || "(none)"}

Changed files and patches:
${diffSummary}

Respond with:
1. Summary (1-2 sentences)
2. Strengths
3. Suggestions / Issues (if any)
4. Overall recommendation (Approve / Request changes / Comment)`;

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
  });

  const review = completion.choices[0]?.message?.content || "No review generated.";

  await octokit.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pr.number,
    body: `## 🤖 Agent Alpha Dolly (Grok) Review\n\n${review}\n\n---\n*Powered by [xAI Grok](https://x.ai) · [agentalphadolly-github-action](https://github.com/getachewnohe-debug/agentalphadolly-github-action)*`,
  });

  core.info("Posted Grok PR review");
}

async function handleIssue(
  client: OpenAI,
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context,
  model: string
) {
  const issue = context.payload.issue;
  if (!issue) return;

  const prompt = `You are Agent Alpha Dolly, a helpful triage bot powered by Grok.
Analyze this GitHub issue and suggest:
1. A short triage summary
2. Suggested labels (from common ones: bug, enhancement, documentation, question, good first issue)
3. A short helpful first response the maintainers can post

Issue Title: ${issue.title}
Issue Body: ${issue.body || "(none)"}

Respond in markdown.`;

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
  });

  const triage = completion.choices[0]?.message?.content || "No triage generated.";

  await octokit.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issue.number,
    body: `## 🤖 Agent Alpha Dolly Triage\n\n${triage}\n\n---\n*Powered by [xAI Grok](https://x.ai)*`,
  });

  core.info("Posted Grok issue triage");
}

run();
