import { MOCK_APPLICATIONS, MOCK_PROFILE } from "../data/mockData";
import { addTask, getTasks, completeTask } from "./taskStore";

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
  create_task: {
    name: "create_task",
    description: "Creates a new todo task",
    icon: "plus",
    color: "emerald",
    duration: 600,
  },
  list_tasks: {
    name: "list_tasks",
    description: "Shows all your tasks",
    icon: "checklist",
    color: "brand",
    duration: 400,
  },
  complete_task: {
    name: "complete_task",
    description: "Marks a task as completed",
    icon: "check",
    color: "emerald",
    duration: 300,
  },
  run_pipeline: {
    name: "run_pipeline",
    description: "Executes pipeline workflow steps",
    icon: "play",
    color: "purple",
    duration: 3000,
  },
  export_resume: {
    name: "export_resume",
    description: "Exports your resume as a PDF document",
    icon: "download",
    color: "brand",
    duration: 2000,
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUserIntent(message) {
  const lower = message.toLowerCase();

  if (lower.includes("create") && (lower.includes("task") || lower.includes("todo"))) {
    const taskText = message.replace(/create\s+(a\s+)?(task|todo)\s*:?\s*/i, "").trim();
    return { tool: "create_task", params: { text: taskText || "New task" } };
  }
  if (lower.includes("list") && lower.includes("task")) {
    return { tool: "list_tasks", params: {} };
  }
  if (lower.includes("complete") && lower.includes("task")) {
    const tasks = getTasks();
    const pending = tasks.find((t) => !t.completed);
    return { tool: "complete_task", params: { taskId: pending?.id } };
  }
  if (lower.includes("run") && lower.includes("pipeline")) {
    return { tool: "run_pipeline", params: {} };
  }
  if (lower.includes("export") && lower.includes("resume")) {
    return { tool: "export_resume", params: {} };
  }
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

async function executeTool(toolName, params) {
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
    case "create_task": {
      const task = addTask({ text: params?.text || "New task" });
      return {
        success: true,
        data: { task },
      };
    }
    case "list_tasks": {
      const tasks = getTasks();
      return {
        success: true,
        data: { tasks, total: tasks.length },
      };
    }
    case "complete_task": {
      if (params?.taskId) {
        completeTask(params.taskId);
        return { success: true, data: { message: "Task completed" } };
      }
      return { success: false, error: "No task specified" };
    }
    case "run_pipeline": {
      const steps = ["Discover", "Score", "Analyze", "Prepare", "Apply", "Track", "Interview Prep", "Interview", "Offer", "Decide"];
      return {
        success: true,
        data: { steps, currentStep: 0 },
      };
    }
    case "export_resume": {
      return {
        success: true,
        data: { message: "Resume exported successfully" },
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

    case "get_applications": {
      const statusList = Object.entries(result.data.byStatus)
        .map(([status, count]) => `- ${status}: ${count}`)
        .join("\n");
      return `You have **${result.data.total}** applications:

${statusList}

Keep up the momentum!`;
    }

    case "create_task":
      return `Task created: **"${result.data.task.text}"**

You can ask me to list your tasks or mark them as complete.`;

    case "list_tasks": {
      if (result.data.tasks.length === 0) {
        return "You don't have any tasks yet. Ask me to create one!";
      }
      const taskList = result.data.tasks
        .map((t) => `- ${t.completed ? "✅" : "⬜"} ${t.text}`)
        .join("\n");
      return `You have **${result.data.total}** tasks:

${taskList}`;
    }

    case "complete_task":
      return "Task marked as complete! ✅";

    case "run_pipeline":
      return `Starting pipeline execution...

I'll guide you through these steps:
${result.data.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Say "start pipeline" to begin, or ask me to run a specific step.`;

    case "export_resume":
      return `Resume exported successfully! 📄

Your resume has been generated as a PDF file. You can find it in your downloads folder.`;

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
      content: "I can help you with:\n\n• **Analyze a job** — Paste a job description\n• **Cover letter** — Generate a tailored letter\n• **Recruiter message** — Draft outreach messages\n• **Interview prep** — Prepare for interviews\n• **View profile** — See your career summary\n• **View applications** — Check your application status\n• **Create task** — Add a todo item\n• **List tasks** — See your tasks\n• **Run pipeline** — Execute workflow steps\n• **Export resume** — Download your resume\n\nWhat would you like to do?",
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

  if (intent.tool === "create_task" && result.success) {
    yield { type: "task_created", task: result.data.task };
  }

  if (intent.tool === "run_pipeline" && result.success) {
    yield { type: "pipeline_start", steps: result.data.steps };
  }
}

export function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}
