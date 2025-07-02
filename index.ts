#!/usr/bin/env bun
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  // defaults to process.env["ANTHROPIC_API_KEY"]
  // apiKey: "my_api_key",
});

async function write_commit(diff: string): Promise<string> {
  const contents = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 20000,
    temperature: 1,
    messages: [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text":
              `You are tasked with writing a commit message that follows the Conventional Commits specification based on a given git diff. The commit message should accurately describe the changes made in the code while adhering to the specified format.\n\nHere's a summary of the Conventional Commits specification:\n\n1. The commit message should have this structure:\n   <type>[optional scope]: <description>\n\n   [optional body]\n\n   [optional footer(s)]\n\n2. Types include: fix, feat, build, chore, ci, docs, style, refactor, perf, test\n3. A scope may be provided after the type, within parentheses\n4. The description should be a short summary of the code changes\n5. A longer commit body may be provided after the short description\n6. Footer(s) may be provided one blank line after the body\n7. Breaking changes must be indicated by \"!\" after the type/scope, or \"BREAKING CHANGE:\" in the footer\n\nNow, analyze the following git diff:\n\n<git_diff>\n${diff}\n</git_diff>\n\nTo write an appropriate commit message:\n\n1. Examine the changes in the git diff carefully\n2. Determine the primary purpose of the changes (e.g., bug fix, new feature, refactor)\n3. Identify the appropriate type based on the changes\n4. If applicable, determine a relevant scope\n5. Write a concise description of the changes\n6. If necessary, add a more detailed explanation in the commit body\n7. Include any relevant footer information, especially for breaking changes\n\nYour task is to write a commit message that follows the Conventional Commits specification based on the provided git diff. The commit message should accurately describe the changes while adhering to the specified format.\n\nProvide your commit message within <commit_message> tags. Do not include any explanation or reasoning outside of these tags; the commit message itself should be the only output.`,
          },
        ],
      },
    ],
    thinking: {
      "type": "enabled",
      "budget_tokens": 16000,
    },
  });

  const firstTextBlock = contents.content.find((block) =>
    block.type === "text"
  );

  if (!firstTextBlock) {
    throw new Error("No text block found");
  }

  return firstTextBlock.text;
}

async function main() {
  const diff = process.argv[2];

  if (!diff) {
    console.error("Please provide a diff as a command-line argument.");
    process.exit(1);
  }

  try {
    const commitMessage = await write_commit(diff);
    const message = commitMessage.match(
      /<commit_message>([\s\S]*)<\/commit_message>/,
    );
    if (message && message[1]) {
      console.log(message[1].trim());
    } else {
      console.log(commitMessage.trim());
    }
  } catch (error) {
    console.error("Error generating commit message:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
