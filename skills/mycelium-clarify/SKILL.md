---
name: mycelium-clarify
description: Asks clarifying questions ONE at a time to understand user requirements, using cached capabilities from context loading. Use when user says "clarify this", "what do you need to know", "ask me questions", or when requirements are ambiguous. Determines if external research (Phase 1.5) is needed before planning.
license: MIT
version: 0.9.0
allowed-tools: ["Read", "AskUserQuestion", "WebSearch", "WebFetch"]
metadata:
  author: Jason Hsieh
  category: planning
  tags: [clarification, requirements, research, question-asking, phase-1]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Clarify Request

Ask clarifying questions ONE at a time to understand user requirements and determine if external research is needed.

## Core Principle

**Ambiguity is the enemy of good implementation. Clarify first, build second.**

This skill implements Phase 1 (and optionally Phase 1.5: Research) of the mycelium workflow, ensuring that:
- Requirements are crystal clear before planning
- Questions are asked ONE at a time for focused answers
- Available capabilities are known (loaded in Phase 0)
- External research is done only when needed

## Your Task

1. **Update session state** - Write `invocation_mode: "single"` to [state.json][session-state-schema]

2. **Load cached capabilities:**
   - Read `discovered_capabilities` from state.json
   - If missing: error and suggest running `/mycelium-context-load` first
   - Use cached capabilities to inform questions

3. **Ask clarifying questions** following the process below:
   - ONE question at a time (use AskUserQuestion)
   - Wait for answer before next question
   - Continue until requirements are clear

4. **Determine if research needed (Phase 1.5):**
   - If user mentions unfamiliar tech: research needed
   - If requirements reference external APIs: research needed
   - Otherwise: skip research

5. **Execute research if needed:**
   - Use WebSearch for general information
   - Use WebFetch for specific documentation
   - Summarize findings in state.json

6. **Hand off to next phase:**
   - Update `current_phase: "planning"` in state.json
   - If `invocation_mode == "full"`: Invoke `mycelium-plan`
   - If `invocation_mode == "single"`: Suggest `/mycelium-plan`

---

## Step 1: Load Cached Capabilities

**Read from state.json:**

```json
{
  "discovered_capabilities": {
    "skills": [...],
    "agents": [...],
    "mcp_tools": [...]
  }
}
```

**Validation:**

```javascript
const capabilities = state.discovered_capabilities

if (!capabilities || !capabilities.skills) {
  error("❌ Capabilities not cached. Run /mycelium-context-load first.")
  return
}

// Continue with clarification...
```

**Why cache is needed:**
- Can ask "Which skill should handle X?" using known skills
- Can suggest capabilities user might not know about
- Avoids re-scanning filesystem

---

## Step 2: Ask Clarifying Questions

### When to Ask Questions

**Ambiguous requirements:**
- ❌ "Add user authentication" → Which method? (OAuth, JWT, session)
- ❌ "Fix the bug" → Which bug? Where?
- ❌ "Optimize the API" → Which endpoint? What metric?

**Clear requirements:**
- ✅ "Add JWT authentication with bcrypt password hashing"
- ✅ "Fix N+1 query in user list endpoint (GET /api/users)"
- ✅ "Reduce user list API response time from 500ms to <100ms"

### Question Strategy

**ONE at a time:**

```javascript
// WRONG: Asking multiple questions at once
AskUserQuestion([
  { question: "Which auth method?", options: [...] },
  { question: "Include registration?", options: [...] },
  { question: "Password requirements?", options: [...] }
])

// RIGHT: One question at a time
AskUserQuestion([
  { question: "Which auth method?", options: [...] }
])

// Wait for answer, then ask next question
AskUserQuestion([
  { question: "Include registration?", options: [...] }
])
```

**Progressive disclosure:**

```javascript
// Question 1: High-level approach
"Which authentication method?"
Options:
- JWT tokens (stateless, recommended)
- Session-based (stateful)
- OAuth (third-party)

// Question 2: Details based on answer
if (answer == "JWT") {
  "Which password hashing?"
  Options:
  - bcrypt (recommended)
  - argon2 (more secure)
  - pbkdf2 (legacy)
}
```

### Using Cached Capabilities

**Reference known skills:**

```javascript
// User: "Add authentication"
// Clarification using cached skills

AskUserQuestion([{
  question: "Which authentication approach?",
  header: "Auth Method",
  options: [
    {
      label: "JWT (Recommended)",
      description: "Stateless tokens. We have patterns for this (see jwt-auth pattern)."
    },
    {
      label: "Session-based",
      description: "Stateful sessions. Common but requires session storage."
    },
    {
      label: "OAuth",
      description: "Third-party auth (Google, GitHub). Requires external integration."
    }
  ]
}])
```

**Suggest relevant capabilities:**

```javascript
// After clarification
output("✅ Requirements clear: JWT authentication with bcrypt")
output("")
output("💡 Available capabilities for this task:")
output("  • Skills: tdd, verification")
output("  • Patterns: jwt-auth (see critical-patterns.md)")
output("  • Agents: general-purpose (for implementation)")
```

### Save Clarified Requirements

**Update state.json:**

```json
{
  "requirements_clarified": true,
  "clarified_requirements": {
    "task": "Add user authentication",
    "approach": "JWT tokens",
    "password_hashing": "bcrypt",
    "include_registration": true,
    "password_requirements": "8+ chars, 1 uppercase, 1 number"
  }
}
```

---

## Step 3: Determine If Research Needed (Phase 1.5)

### Research Gate

**When to research:**
- User mentions unfamiliar technology
- User references external APIs or services
- Solution requires knowledge not in context or learned/

**When to skip research:**
- Requirements use familiar tech from tech-stack.md
- Solution pattern exists in solutions/ or learned/
- All information available in local context

### Examples

**Research needed:**
```javascript
// User: "Integrate with Stripe API for payments"
// Unfamiliar external API → research needed

if (!patterns.includes("stripe-integration")) {
  needs_research = true
  research_topics = [
    "Stripe API authentication",
    "Stripe payment intent flow",
    "Stripe webhook handling"
  ]
}
```

**Research NOT needed:**
```javascript
// User: "Add JWT authentication"
// Known pattern → skip research

if (patterns.includes("jwt-auth")) {
  needs_research = false
  output("✅ JWT auth pattern found in critical-patterns.md. Using existing pattern.")
}
```

### Set Research Flag

**Update state.json:**

```json
{
  "external_research_needed": true,
  "research_topics": [
    "Stripe API authentication",
    "Stripe payment intent flow",
    "Stripe webhook handling"
  ]
}
```

---

## Step 4: Execute Research (If Needed)

### Research Process

**1. Search for information:**

```javascript
// For each research topic
for (topic of research_topics) {
  // Use WebSearch
  results = WebSearch(topic + " 2026 best practices")

  // Summarize key findings
  summary = summarize(results)

  // Save to state
  research_findings[topic] = summary
}
```

**2. Fetch specific documentation:**

```javascript
// If official docs found
if (found_official_docs_url) {
  // Use WebFetch
  docs = WebFetch(url, "Extract: authentication flow, code examples")

  // Save relevant sections
  research_findings.documentation = docs
}
```

**3. Update state with findings:**

```json
{
  "external_research_done": true,
  "research_findings": {
    "Stripe API authentication": "Use API keys (pk_test_xxx for test). Create Payment Intent on server...",
    "Stripe payment intent flow": "1. Create Intent 2. Confirm payment 3. Handle webhook...",
    "Stripe webhook handling": "Verify signature using webhook secret. Return 200 within 15s..."
  }
}
```

**4. Show summary to user:**

```
✅ Research Complete

Learned about Stripe integration:

**Authentication:**
- Use API keys (pk_test_xxx for test, pk_live_xxx for prod)
- Store secret key in environment variable

**Payment Flow:**
1. Create Payment Intent on server
2. Send client_secret to frontend
3. Confirm payment with Stripe.js
4. Handle webhook for completion

**Webhooks:**
- Verify signature using webhook secret
- Must respond within 15 seconds
- Handle payment_intent.succeeded event

Proceeding to planning with this knowledge...
```

---

## Step 5: Phase Handoff

**Update state:**

```json
{
  "current_phase": "planning",
  "checkpoints": {
    "context_loading_complete": "2026-02-13T10:00:00Z",
    "clarify_complete": "2026-02-13T10:10:00Z"
  },
  "requirements_clarified": true,
  "external_research_done": false
}
```

**Chain or suggest:**

```javascript
if (invocation_mode == "full") {
  // Full workflow mode - automatically chain to planning
  output("✅ Requirements clarified. Starting planning...")
  invoke("mycelium-plan")
} else {
  // Single phase mode - suggest next step
  output("✅ Requirements clarified. Continue with: /mycelium-plan")
}
```

---

## Output Examples

### Example 1: Simple Clarification (No Research)

```
🔍 Clarifying Requirements

Task: "Add user authentication"

❓ Which authentication method?
   A) JWT tokens (stateless, recommended)
   B) Session-based (stateful)
   C) OAuth (third-party)

> User selects: A) JWT tokens

✅ Requirements Clear

What: JWT-based authentication
Stack: Existing patterns found (jwt-auth)
Research: Not needed (pattern exists)

Next: /mycelium-plan
```

### Example 2: Complex Clarification (With Research)

```
🔍 Clarifying Requirements

Task: "Integrate Stripe payments"

❓ What type of payment flow?
   A) One-time payments (recommended for simple checkouts)
   B) Subscriptions (recurring billing)
   C) Both

> User selects: A) One-time payments

✅ Requirements Clear

What: Stripe one-time payments
Research: Needed (unfamiliar API)

🔬 Researching...

Searched: "Stripe API authentication 2026 best practices"
Searched: "Stripe payment intent flow"
Fetched: https://stripe.com/docs/payments/accept-a-payment

✅ Research Complete

Key Findings:
- Use Payment Intent API (recommended)
- Authenticate with API keys (env vars)
- Handle webhooks for completion
- Client-side: Stripe.js for security

Next: /mycelium-plan (with research findings)
```

---

## Error Handling

**Capabilities not cached:**

```
❌ Error: Capabilities not cached

Cannot proceed with clarification without knowing available capabilities.

Please run: /mycelium-context-load

This will:
- Load project context
- Discover skills, agents, MCP tools
- Cache capabilities for this phase
```

**User provides unclear answer:**

```
❓ Which authentication method?

> User: "Something secure"

⚠️ Answer unclear. Please select a specific option:
   A) JWT tokens (stateless, recommended)
   B) Session-based (stateful)
   C) OAuth (third-party)
```

**Research fails:**

```
⚠️ Research Warning

Could not fetch documentation from https://example.com/docs

Proceeding with general knowledge. You may need to:
- Verify implementation against official docs
- Test thoroughly
- Consult documentation manually
```

---

## Quick Examples

```bash
# Clarify ambiguous request
/mycelium-clarify

# After user provides request like "add auth"
# System asks: "Which auth method?"
# User answers
# System asks next question
# ...until clear
```

## Important Notes

- **ONE question at a time** - Never overwhelm with multiple questions
- **Use cached capabilities** - Reference known skills/patterns
- **Research when needed** - Don't guess about unfamiliar tech
- **Save everything to state** - Next phase needs all clarifications
- **Be conversational** - Natural dialogue, not interrogation
- **Progressive disclosure** - Ask high-level first, drill down based on answers

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Critical patterns][critical-patterns]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[critical-patterns]: ../../.mycelium/solutions/patterns/critical-patterns.md
