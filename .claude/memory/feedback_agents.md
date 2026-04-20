---
name: always_run_all_agents
description: User requires all 4 custom agents to be invoked at their designated stages every issue, no exceptions
type: feedback
---

Always invoke all 4 custom agents at their required stages. Never skip any of them.

| Agent             | Stage                                                           |
| ----------------- | --------------------------------------------------------------- |
| `tdd-runner`      | Any pure logic/business rules — before writing implementation   |
| `code-reviewer`   | After implementation, before committing                         |
| `pr-validator`    | Before opening every PR                                         |
| `context-manager` | When context is large, before compacting, or resuming a session |

**Why:** User explicitly called this out twice — once when pr-validator was skipped, and again after being reminded that only pr-validator was being run. All agents must run, not just pr-validator.

**How to apply:** At each stage of every issue, check which agent is due and invoke it via the Agent tool before moving on. Do not manually replicate what the agents do — delegate to them.
