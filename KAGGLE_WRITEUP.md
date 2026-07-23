# Sakon ABU - AI-Powered Formal Letter Assistant for University Students

**Subtitle:** Gemma 4-powered conversational agent that generates context-aware formal petitions and letters for Nigerian university students

---

## Executive Summary

Sakon ABU is a conversational AI application that helps university students draft formal letters and petitions using Google's Gemma 4 language model. Built during a 1-day hackathon sprint, this project addresses a real challenge faced by students: the need to write formal, properly-structured letters for various academic and administrative purposes (exam deferrals, hostel complaints, financial aid appeals, transcript requests, and registration issues).

The application combines natural language conversation with Gemma 4's generation capabilities to transform casual student descriptions into professionally formatted, formal letters that adhere to Nigerian university letter-writing conventions.

---

## Architecture Overview

### System Design

**Frontend:**
- React 18 with Vite for fast development and hot module replacement
- Component-based architecture for modularity
- Real-time preview of generated letters
- Offline-first design with send queue for network resilience

**Backend:**
- Node.js + Express REST API
- SQLite database for conversation history and session management
- Axios for Gemma 4 API communication
- Better-SQLite3 for synchronous, performant database operations

**AI Layer:**
- Gemma 4 E2B (7GB model) via Ollama
- Dual-purpose usage: conversational chat + formal body generation
- Optimized inference parameters for CPU-only hardware

### Data Flow

1. **User Input** → React frontend captures student's request in natural language
2. **Session Management** → Backend creates/retrieves conversation session
3. **Gemma Chat Response** → Gemma 4 analyzes input and asks clarifying questions
4. **Field Extraction** → Backend parses conversation to extract structured data (name, matric number, department, issue details)
5. **Letter Classification** → System determines letter type (exam deferral, hostel complaint, etc.)
6. **Body Generation** → Gemma 4 generates formal letter body from extracted context
7. **Template Assembly** → Structured letter template populated with AI-generated content
8. **Quality Check** → Register validation ensures formal tone and structure
9. **Preview & Send** → User reviews and can queue for offline sending

---

## How We Specifically Used Gemma 4

### Dual-Role Implementation

Gemma 4 serves two distinct purposes in our architecture:

**1. Conversational Agent (Chat Mode)**
- **Purpose:** Natural dialogue to collect required information
- **Configuration:** Short responses (60 tokens), low context window (512 tokens)
- **Prompt Engineering:** System prompt defines agent role, required fields per letter type, and conversational style
- **Example Flow:**
  - Student: "I need to defer my exam"
  - Gemma: "I can help you request an exam deferral. Please provide: your name, matric number, department, level, which course, and the reason."

**2. Formal Body Generator (Letter Mode)**
- **Purpose:** Transform casual descriptions into formal academic prose
- **Configuration:** Longer responses (600 tokens), expanded context (2048 tokens)
- **Prompt Engineering:** Explicit instructions for formal register, capitalization rules, and university letter conventions
- **Example Transformation:**
  - Input: "i fell sick yesterday, cant write exam"
  - Output: "I am writing to respectfully request deferral of my examination. I recently became unwell and am currently unable to sit for the scheduled examination..."

### Optimization for Resource Constraints

**Challenge:** 8GB RAM, no dedicated GPU, 7GB model size

**Solutions Implemented:**
- Reduced `num_ctx` from 1024 to 512 tokens (50% memory reduction)
- Reduced `num_predict` from 80 to 60 tokens (faster generation)
- Increased `num_thread` to 6 for better CPU utilization
- Extended timeout to 180 seconds (realistic for CPU inference)
- Implemented intelligent fallback for empty/timeout responses

**Result:** ~60 second response time per query on CPU-only hardware

---

## Challenges Overcome in 1-Day Sprint

### Challenge 1: Session State Bleed
**Problem:** When students requested multiple letter types in the same conversation, issue-specific details from the first letter contaminated the second letter.

**Solution:** 
- Implemented field categorization: persistent fields (name, matric, department) vs. per-letter fields (issue, dates, course)
- Letter type change detection with automatic reset of per-letter fields
- Scoped extraction: new letter types only extract details from recent messages, not entire history

### Challenge 2: Ambiguous Date Fields
**Problem:** Generic "relevant_dates" field caused confusion - students provided multiple dates with unclear purposes (exam date vs. illness start date).

**Solution:**
- Letter-type-specific date fields: `exam_date`, `incident_date`, `deadline_date`
- Specific clarifying questions: "What date is the exam?" instead of "provide relevant dates"
- Pattern-based extraction supporting multiple formats (DD/MM/YYYY, Month Day Year, contextual phrases)

### Challenge 3: Conversational Leakage into Formal Letters
**Problem:** Gemma sometimes included chatbot phrases like "thank you for providing" or "I'll draft this" in the letter body.

**Solution:**
- Separate generation steps: chat response vs. body paragraphs
- Validation layer detecting conversational patterns with regex filters
- Template structure that isolates AI-generated content from fixed formal elements
- Automatic fallback to template if leakage detected

### Challenge 4: Gemma 4 Performance on Limited Hardware
**Problem:** 7GB model timing out or returning empty responses on 8GB RAM, CPU-only laptop.

**Solution:**
- Context window reduction (1024 → 512 tokens)
- Thread optimization (6 threads for better CPU saturation)
- Timeout extension (60s → 180s)
- Debug logging to identify response format issues
- Graceful degradation with rule-based fallback

---

## Why Our Technical Choices Were Right

### Choice 1: Gemma 4 E2B Over Smaller Models
**Rationale:** 
- Hackathon requirement mandated Gemma 4
- E2B variant provides instruction-following capabilities essential for formal tone transformation
- Larger context window supports complex letter requirements
- Strong performance on English formal writing tasks

**Trade-off:** Slower inference on CPU, but acceptable for letter-writing use case (not real-time chat)

### Choice 2: SQLite Over NoSQL/Cloud Database
**Rationale:**
- Zero-configuration persistence
- ACID transactions for conversation consistency
- Embedded deployment (no external dependencies)
- Perfect for session management and conversation history
- Synchronous API matches Node.js event loop for predictable performance

**Trade-off:** Not horizontally scalable, but appropriate for student-facing tool with moderate concurrent users

### Choice 3: Template + AI Hybrid Over Pure AI Generation
**Rationale:**
- Ensures structural consistency (letterhead, recipient, closing)
- Reduces generation cost (AI only generates body, not entire letter)
- Prevents formatting errors (date formats, address blocks)
- Faster inference (fewer tokens to generate)
- Easier to validate and correct (known template structure)

**Trade-off:** Less flexible than pure generation, but reliability and consistency are paramount for formal documents

### Choice 4: Offline Queue Over Real-Time Sending Only
**Rationale:**
- Nigerian university context: intermittent network connectivity
- Resilience: letters aren't lost if network fails during send
- User experience: student can continue working while letters queue
- Demonstrates production-ready thinking beyond demo scope

**Trade-off:** Additional complexity, but critical for real-world deployment

---

## Technical Implementation Details

### Gemma 4 API Configuration

```javascript
// Chat mode - fast, short responses
{
  temperature: 0.7,
  top_p: 0.9,
  num_predict: 60,
  num_ctx: 512,
  top_k: 10,
  repeat_penalty: 1.2,
  num_thread: 6
}

// Letter generation mode - longer, detailed
{
  temperature: 0.7,
  top_k: 40,
  num_predict: 600,
  num_ctx: 2048,
  repeat_penalty: 1.1
}
```

### Field Extraction Pipeline

1. **Conversation Parsing:** Split messages by role (user/assistant)
2. **Pattern Matching:** Regex extraction for matric numbers, dates, course codes
3. **NLP Heuristics:** Department inference from explicit statements only
4. **Validation:** Required field checking before letter generation
5. **Stale Data Prevention:** Cross-letter contamination detection

### Quality Assurance Checks

- Formal salutation presence (Dear Sir/Madam)
- Subject line format (RE: UPPERCASE TITLE)
- Formal closing (Yours faithfully)
- No contractions (don't → do not)
- No informal words (gonna, wanna, yeah)
- Capitalization correctness (no lowercase "i")
- Specific details present (dates, names, locations)
- No placeholder text in final output

---

## Key Features

1. **Intelligent Field Extraction:** Automatically extracts name, matric number, department, level, and issue details from natural conversation
2. **Letter Type Classification:** Identifies whether student needs exam deferral, hostel complaint, bursary appeal, transcript, or registration assistance
3. **Formal Tone Transformation:** Converts casual student language ("i fell sick") into formal academic prose ("I became unwell")
4. **Template-Based Structure:** Ensures letters follow Nigerian university formal letter conventions
5. **Offline Queue:** Allows letter sending even with intermittent connectivity
6. **Session Persistence:** Maintains conversation history across page refreshes
7. **Real-Time Preview:** Students see letter being generated as they provide information

---

## Impact & Use Case

**Target Users:** 50,000+ students at Ahmadu Bello University (ABU), extensible to other Nigerian universities

**Problem Solved:** Many students struggle with formal letter writing, leading to rejected applications, delayed processes, or intimidation that prevents them from seeking help. Sakon ABU democratizes access to proper formal communication.

**Real-World Scenarios:**
- Student becomes ill the day before exam → needs immediate deferral letter
- Hostel facilities broken for weeks → needs complaint letter with proper escalation language
- Financial hardship prevents fee payment → needs persuasive, respectful bursary appeal
- Graduating student needs transcript for job applications → needs properly formatted request

---

## Lessons Learned

1. **Prompt Engineering is Critical:** Explicit instructions about capitalization, formal equivalents, and structure are necessary - Gemma 4 doesn't automatically infer "formal Nigerian university letter" from context alone.

2. **State Management in Conversational AI:** Multi-turn conversations require careful state scoping. What persists across turns, what resets per-task, and what's contextual must be explicitly designed.

3. **CPU Inference is Viable:** With proper optimization, even a 7GB model can run acceptably on consumer hardware. Context window reduction and thread tuning matter more than expected.

4. **Validation Layers are Non-Negotiable:** AI output must be validated structurally and semantically. Template + AI hybrid provides natural validation boundaries.

5. **User Trust Requires Transparency:** Showing extraction results and allowing preview before sending builds confidence in AI-generated formal documents.

---

## Future Enhancements

- Multi-language support (Hausa, Yoruba, Igbo → English translation)
- Voice input via Whisper.cpp for accessibility
- PDF export with university letterhead
- Integration with university portals for direct submission
- Historical letter tracking and reuse
- Batch letter generation for multiple courses/issues

---

## Conclusion

Sakon ABU demonstrates that Gemma 4 can be effectively deployed in resource-constrained environments to solve real-world problems. By carefully engineering prompts, optimizing inference parameters, and building robust validation layers, we created a production-viable tool in a single-day sprint.

The hybrid approach (template structure + AI body generation) proves that practical AI applications often benefit from bounded generation rather than pure end-to-end generation. This balance between AI creativity and structured reliability is key to building trustworthy tools for formal, consequential documents like university petitions.

**Word Count:** ~1,480 words

---

## Project Links

- **GitHub Repository:** https://github.com/code3ks/Sakon
- **Live Demo:** [Add your video demo link or hosted URL]
- **Track:** Education / Productivity

---

## Technical Stack Summary

- **Frontend:** React 18, Vite
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **AI Model:** Gemma 4 E2B (7GB) via Ollama
- **Deployment:** Local (Ollama dependency)
- **Testing:** Manual QA with 5 letter type scenarios

---

## Team

[Add your name/team name here]

**Developed in:** 24 hours
**Primary Challenge:** Optimizing Gemma 4 for CPU-only hardware
**Key Innovation:** Dual-mode Gemma usage (chat + generation) with hybrid template approach
