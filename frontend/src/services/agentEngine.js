import { MOCK_APPLICATIONS, MOCK_PROFILE } from "../data/mockData";

const TOOL_DEFINITIONS = {
  analyze_job: {
    name: "analyze_job",
    description: "Analyzes a job description against your career profile",
    icon: "search",
    color: "brand",
    duration: 1500,
  },
  generate_cover_letter: {
    name: "generate_cover_letter",
    description: "Generates a tailored cover letter for a specific role",
    icon: "edit",
    color: "emerald",
    duration: 2000,
  },
  generate_recruiter_msg: {
    name: "generate_recruiter_msg",
    description: "Drafts a recruiter outreach message",
    icon: "message",
    color: "purple",
    duration: 1200,
  },
  prepare_interview: {
    name: "prepare_interview",
    description: "Generates interview preparation materials",
    icon: "book",
    color: "amber",
    duration: 2500,
  },
  get_profile: {
    name: "get_profile",
    description: "Fetches your career profile data",
    icon: "user",
    color: "gray",
    duration: 500,
  },
  get_applications: {
    name: "get_applications",
    description: "Lists your job applications",
    icon: "list",
    color: "gray",
    duration: 800,
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUserIntent(message) {
  const lower = message.toLowerCase();

  if (lower.includes("analyze") && (lower.includes("job") || lower.includes("description") || lower.includes("jd"))) {
    return { tool: "analyze_job", params: { jobDescription: message } };
  }
  if (lower.includes("cover letter") || lower.includes("cover-letter")) {
    return { tool: "generate_cover_letter", params: {} };
  }
  if (lower.includes("recruiter") || lower.includes("outreach") || lower.includes("linkedin")) {
    return { tool: "generate_recruiter_msg", params: {} };
  }
  if (lower.includes("interview") || lower.includes("prep") || lower.includes("prepare")) {
    return { tool: "prepare_interview", params: {} };
  }
  if (lower.includes("profile") || lower.includes("resume") || lower.includes("skills")) {
    return { tool: "get_profile", params: {} };
  }
  if (lower.includes("application") || lower.includes("job") || lower.includes("apply")) {
    return { tool: "get_applications", params: {} };
  }
  return null;
}

async function executeTool(toolName) {
  const tool = TOOL_DEFINITIONS[toolName];
  if (!tool) return { success: false, error: "Unknown tool" };

  await delay(tool.duration);

  switch (toolName) {
    case "analyze_job": {
      const app = MOCK_APPLICATIONS[Math.floor(Math.random() * MOCK_APPLICATIONS.length)];
      return {
        success: true,
        data: {
          company: app.company,
          role: app.role,
          matchScore: Math.round(app.match_score * 100),
          analysis: app.match_analysis,
        },
      };
    }
    case "generate_cover_letter": {
      const app = MOCK_APPLICATIONS[Math.floor(Math.random() * MOCK_APPLICATIONS.length)];
      return {
        success: true,
        data: { coverLetter: app.cover_letter },
      };
    }
    case "generate_recruiter_msg": {
      const app = MOCK_APPLICATIONS[Math.floor(Math.random() * MOCK_APPLICATIONS.length)];
      return {
        success: true,
        data: { message: app.recruiter_msg },
      };
    }
    case "prepare_interview": {
      const app = MOCK_APPLICATIONS[Math.floor(Math.random() * MOCK_APPLICATIONS.length)];
      return {
        success: true,
        data: {
          company: app.company,
          questions: 8,
          starAnswers: 3,
          readiness: Math.floor(Math.random() * 30) + 70,
        },
      };
    }
    case "get_profile": {
      return {
        success: true,
        data: {
          name: "John Doe",
          skills: MOCK_PROFILE.skills,
          experience: MOCK_PROFILE.experience.length,
        },
      };
    }
    case "get_applications": {
      return {
        success: true,
        data: {
          total: MOCK_APPLICATIONS.length,
          byStatus: MOCK_APPLICATIONS.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
          }, {}),
        },
      };
    }
    default:
      return { success: false, error: "Tool not found" };
  }
}

function generateAgentResponse(toolName, result) {
  if (!result.success) {
    return `I encountered an error: ${result.error}. Please try again.`;
  }

  switch (toolName) {
    case "analyze_job":
      return `I've analyzed the job posting for **${result.data.company}** — ${result.data.role}.

**Match Score: ${result.data.matchScore}%**

${result.data.analysis}

Would you like me to generate a cover letter or prepare interview materials?`;

    case "generate_cover_letter":
      return `Here's your tailored cover letter:

---

${result.data.coverLetter}

---

Would you like me to also generate a recruiter outreach message?`;

    case "generate_recruiter_msg":
      return `Here's your recruiter outreach message:

"${result.data.message}"

You can copy this and send it via LinkedIn or email.`;

    case "prepare_interview":
      return `I've prepared interview materials for **${result.data.company}**:

- **${result.data.questions}** practice questions generated
- **${result.data.starAnswers}** STAR method answers prepared
- **Readiness score: ${result.data.readiness}%**

Check the Interview Hub for the full preparation kit.`;

    case "get_profile":
      return `Here's your career profile summary:

- **Name:** ${result.data.name}
- **Skills:** ${result.data.skills.join(", ")}
- **Experience:** ${result.data.experience} positions

Your profile is looking strong!`;

    case "get_applications":
      const statusList = Object.entries(result.data.byStatus)
        .map(([status, count]) => `- ${status}: ${count}`)
        .join("\n");
      return `You have **${result.data.total}** applications:

${statusList}

Keep up the momentum!`;

    default:
      return "Task completed successfully.";
  }
}

export async function* processMessage(message) {
  const intent = parseUserIntent(message);

  if (!intent) {
    yield { type: "thinking", content: "Processing your request..." };
    await delay(1000);
    yield {
      type: "response",
      content: "I can help you with:\n\n• **Analyze a job** — Paste a job description\n• **Cover letter** — Generate a tailored letter\n• **Recruiter message** — Draft outreach messages\n• **Interview prep** — Prepare for interviews\n• **View profile** — See your career summary\n• **View applications** — Check your application status\n\nWhat would you like to do?",
    };
    return;
  }

  yield { type: "thinking", content: `Using tool: ${TOOL_DEFINITIONS[intent.tool].description}` };
  await delay(500);

  yield { type: "tool_start", tool: intent.tool, description: TOOL_DEFINITIONS[intent.tool].description };

  const result = await executeTool(intent.tool, intent.params);

  yield { type: "tool_end", tool: intent.tool, success: result.success };

  await delay(300);

  const response = generateAgentResponse(intent.tool, result);
  yield { type: "response", content: response };
}

export function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}
