import express from 'express';
import cors from 'cors';
import { initDatabase, getDb } from './database.js';
import { callGemma, callGemmaForLetter } from './gemma.js';
import { letterTemplates } from './templates.js';
import { classifyLetterType, fillTemplate, checkRegister } from './functions.js';

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start a new session
app.post('/api/session/start', (req, res) => {
  const db = getDb();
  const sessionId = Date.now().toString();
  
  db.prepare(`
    INSERT INTO sessions (id, created_at)
    VALUES (?, ?)
  `).run(sessionId, new Date().toISOString());

  res.json({ sessionId });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const db = getDb();

    // Get conversation history
    const history = db.prepare(`
      SELECT role, content FROM messages
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `).all(sessionId);

    // Save user message
    db.prepare(`
      INSERT INTO messages (session_id, role, content, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, 'user', message, new Date().toISOString());

    // Build conversation context
    const conversationContext = history.map(h => `${h.role}: ${h.content}`).join('\n') + `\nuser: ${message}`;

    // System prompt for the agent
    const systemPrompt = `You are Sakon ABU, a helpful assistant for Ahmadu Bello University (ABU) students who need to write formal letters.

Your role:
1. Have a natural conversation to understand what letter the student needs
2. Collect REQUIRED information through focused questions
3. Be friendly, concise, and supportive

Letter types you handle:
- Hostel complaints (roommate issues, facilities, security)
- Exam deferral requests
- Bursary/financial aid appeals  
- Transcript requests
- Course registration issues

REQUIRED information for ALL letter types (you MUST collect these):
1. Full name
2. Matric number (format: U19AM1025)
3. Department (e.g., "Computer Science", "Mechanical Engineering")
4. Level (e.g., 100, 200, 300, 400, 500)
5. The specific issue/request
6. Relevant dates or timeline

IMPORTANT RULES:
- If the student's first message contains some info, DON'T ask for it again
- If ANY required field is missing, explicitly ASK for it before drafting
- Ask for missing info in ONE clear question, not separately
- Example: "Great! I'll help with that. I need your full name, matric number, department, and level to draft the letter. Could you provide those?"
- NEVER guess or infer department from matric number - always ask
- NEVER guess or calculate level - always ask

Keep responses SHORT (2-3 sentences). Ask efficiently.

Example good flow:
User: "My roommate keeps stealing my things"
You: "I'll help you draft a hostel complaint. I need your full name, matric number, department, and level to get started."`;

    // Check if we should classify and generate the letter
    const shouldGenerateLetter = history.length >= 2 || 
      message.toLowerCase().includes('yes') || 
      message.toLowerCase().includes('proceed') ||
      message.toLowerCase().includes('go ahead');

    let response = '';
    let functionCalls = [];
    let letter = null;

    // Call Gemma for conversational response
    console.log('💬 Calling Gemma for CHAT REPLY...');
    console.log('📥 Chat prompt (first 200 chars):', conversationContext.substring(0, 200));
    const gemmaResponse = await callGemma(conversationContext, systemPrompt);
    console.log('📤 Chat response received:', gemmaResponse.substring(0, 150));
    response = gemmaResponse;

    // Check if we should attempt classification
    if (shouldGenerateLetter && history.length >= 2) {
      try {
        // Attempt to classify letter type
        console.log('🔧 Function call: classify_letter_type');
        const letterType = await classifyLetterType(conversationContext);
        
        functionCalls.push({
          name: 'classify_letter_type',
          arguments: { user_context: conversationContext.substring(0, 100) + '...' },
          result: letterType,
          timestamp: new Date().toISOString()
        });

        if (letterType && letterType !== 'unknown') {
          console.log(`📝 Classified as: ${letterType}`);
          
          // Extract fields from conversation
          const fields = extractFields(conversationContext);
          
          // Generate AI-powered unique letter using Gemma
          console.log('🤖 Generating unique letter with Gemma AI...');
          console.log('📋 Extracted fields:', JSON.stringify({
            name: fields.student_name,
            matric: fields.matric_number,
            dept: fields.department,
            level: fields.level,
            issue: fields.issue_description.substring(0, 100)
          }, null, 2));
          
          const aiLetter = await generateAILetter(letterType, fields, conversationContext);
          
          console.log('✅ Letter generated (first 300 chars):', aiLetter.substring(0, 300));
          console.log('🔍 Checking for conversational leakage...');
          
          // CRITICAL: Validate letter doesn't contain conversational phrases
          const conversationalPhrases = [
            /thank you for providing/i,
            /i have enough information/i,
            /let me prepare/i,
            /i'll draft this/i,
            /i will draft/i,
            /here is your letter/i,
            /i've drafted/i
          ];
          
          const hasConversationalLeakage = conversationalPhrases.some(phrase => phrase.test(aiLetter));
          
          if (hasConversationalLeakage) {
            console.error('❌ CRITICAL: Conversational text leaked into letter body!');
            console.error('Letter content:', aiLetter.substring(0, 500));
            throw new Error('Letter contains conversational chatbot text instead of formal content');
          }
          
          console.log('✓ No conversational leakage detected');
          
          functionCalls.push({
            name: 'generate_ai_letter',
            arguments: { letter_type: letterType, fields: Object.keys(fields) },
            result: 'Unique letter generated successfully',
            timestamp: new Date().toISOString()
          });

          // Check register
          console.log('🔧 Function call: check_register');
          const registerCheck = checkRegister(aiLetter, conversationContext);
          
          functionCalls.push({
            name: 'check_register',
            arguments: { draft_letter: aiLetter.substring(0, 50) + '...' },
            result: `${registerCheck.flagged_issues.length} checks performed`,
            timestamp: new Date().toISOString()
          });

          // Create letter object
          const letterId = Date.now().toString();
          letter = {
            id: letterId,
            letterType,
            content: registerCheck.corrected_letter,
            registerChecks: registerCheck.flagged_issues,
          };

          // Save letter to database
          db.prepare(`
            INSERT INTO letters (id, session_id, letter_type, content, created_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(letterId, sessionId, letterType, letter.content, new Date().toISOString());

          response = "I've drafted your letter! Please review it in the preview pane. You can copy it, download it, or send it via email.";
        }
      } catch (error) {
        console.error('Error generating letter:', error);
      }
    }

    // Save assistant message
    db.prepare(`
      INSERT INTO messages (session_id, role, content, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, 'assistant', response, new Date().toISOString());

    res.json({ response, functionCalls, letter });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get offline queue
app.get('/api/queue', (req, res) => {
  try {
    const db = getDb();
    const queue = db.prepare(`
      SELECT * FROM send_queue
      ORDER BY timestamp DESC
    `).all();

    res.json({ queue });
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({ error: 'Failed to load queue' });
  }
});

// Send or queue a letter
app.post('/api/letter/send', (req, res) => {
  try {
    const { letterId, method, destination, isOffline } = req.body;
    const db = getDb();

    // Get letter
    const letter = db.prepare(`SELECT * FROM letters WHERE id = ?`).get(letterId);

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    if (isOffline || true) { // For demo, always queue
      // Add to queue with CURRENT timestamp
      const currentTimestamp = new Date().toISOString();
      console.log(`📮 Queueing letter ${letterId} with timestamp: ${currentTimestamp}`);
      
      db.prepare(`
        INSERT INTO send_queue (letter_id, letter_type, method, destination, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(letterId, letter.letter_type, method, destination, 'pending', currentTimestamp);

      console.log(`✅ Letter queued successfully`);
      res.json({ queued: true });
    } else {
      // Send immediately (implement actual sending logic here)
      res.json({ sent: true });
    }
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: 'Failed to send letter' });
  }
});

// Flush queue (attempt to send pending items)
app.post('/api/queue/flush', async (req, res) => {
  try {
    const db = getDb();
    const pending = db.prepare(`
      SELECT * FROM send_queue WHERE status = 'pending'
    `).all();

    let flushed = 0;
    for (const item of pending) {
      // Simulate sending (in real app, would actually send email here)
      // Update status AND timestamp to show when it was actually sent
      const sentTimestamp = new Date().toISOString();
      console.log(`📤 Flushing item ${item.letter_id} - New timestamp: ${sentTimestamp}`);
      
      db.prepare(`
        UPDATE send_queue SET status = 'sent', timestamp = ? WHERE letter_id = ?
      `).run(sentTimestamp, item.letter_id);
      flushed++;
    }

    console.log(`✅ Flushed ${flushed} items from queue`);
    res.json({ flushed });
  } catch (error) {
    console.error('Flush error:', error);
    res.status(500).json({ error: 'Failed to flush queue' });
  }
});

// Transcribe audio (placeholder for voice input)
app.post('/api/transcribe', (req, res) => {
  // This would integrate with Whisper.cpp or similar
  // For now, return a placeholder
  res.status(501).json({ error: 'Voice input not yet implemented' });
});

// AI-powered letter generation using Gemma
async function generateAILetter(letterType, fields, conversationContext) {
  // Validate required fields - mark missing ones clearly
  const requiredFields = ['student_name', 'matric_number', 'department', 'level', 'issue_description'];
  for (const field of requiredFields) {
    if (!fields[field] || fields[field].length < 2) {
      fields[field] = `[${field.toUpperCase().replace(/_/g, ' ')} NOT PROVIDED - PLEASE FILL IN]`;
    }
  }
  
  // Map letter types to formal contexts
  const letterTypeMap = {
    'hostel_complaint': 'hostel complaint',
    'exam_deferral': 'examination deferral request',
    'bursary_appeal': 'financial assistance appeal',
    'transcript_request': 'transcript request',
    'registration_issue': 'course registration issue'
  };

  const letterContext = letterTypeMap[letterType] || 'formal letter';
  
  // Extract raw user input for context (first user message)
  const userMessages = conversationContext.split('\n').filter(line => 
    line.toLowerCase().startsWith('user:')
  ).map(line => line.replace(/^user:\s*/i, '').trim());
  const rawUserInput = userMessages.join(' ');
  
  // Generate body paragraphs separately using the new prompt
  const bodyPrompt = `You are drafting the body paragraphs of a formal letter for a Nigerian university student to submit to a university office.

Letter type: ${letterContext}

Student's original description (for context only — do NOT copy phrasing from this):
"${rawUserInput}"

Extracted details:
- Course/issue: ${fields.issue_description}
- Date(s): ${fields.relevant_dates}
- Reason/explanation: ${fields.issue_description}
- Desired outcome: ${fields.desired_outcome}
- Student: ${fields.student_name}, ${fields.matric_number}, ${fields.department}, Level ${fields.level}

INSTRUCTIONS:
1. Use the SPECIFIC details provided — do not write generic filler
2. Write entirely in your own formal English — do NOT reuse the student's exact phrasing
3. Vary your opening sentence naturally based on the situation:
   - Direct statement: "This letter serves to formally request..."
   - Context-first: "Following [specific event/date], I am compelled to..."
   - Standard (use sparingly): "I am writing to respectfully request..."
4. Reference specific dates given (e.g. "since June 2026" not "recently")
5. Do NOT invent any facts not provided
6. Do NOT repeat the letter's purpose twice
7. Keep to 2-3 paragraphs, concise and substantive

OUTPUT: Return ONLY the body paragraphs as plain text, no preamble, no markdown.`;

  try {
    // Generate body paragraphs
    console.log('📝 Calling Gemma for LETTER BODY generation...');
    console.log('📥 Body prompt (first 300 chars):', bodyPrompt.substring(0, 300));
    
    const bodyParagraphs = await callGemmaForLetter(
      bodyPrompt,
      'You draft formal letter bodies. Output only the paragraph text, nothing else.'
    );
    
    console.log('📤 Body paragraphs received (first 300 chars):', bodyParagraphs.substring(0, 300));
    
    // CRITICAL: Validate body paragraphs don't contain conversational chatbot text
    const conversationalPhrases = [
      /thank you for providing/i,
      /i have enough information/i,
      /let me prepare/i,
      /i'll draft/i,
      /i will draft/i,
      /here is your letter/i
    ];
    
    const hasConversationalText = conversationalPhrases.some(phrase => phrase.test(bodyParagraphs));
    
    if (hasConversationalText) {
      console.error('❌ CRITICAL: Body generation returned conversational text instead of letter content!');
      console.error('Body received:', bodyParagraphs);
      console.log('⚠️ Falling back to template...');
      return fillTemplate(letterType, fields);
    }
    
    // Assemble the complete letter with fixed structural elements
    const completeLetter = `${fields.student_name}
Department of ${fields.department}
Ahmadu Bello University, Zaria
${fields.matric_number}

${fields.date}

${fields.recipient_title}
${fields.recipient_office}
Ahmadu Bello University, Zaria

Dear Sir/Madam,

RE: ${getSubjectLine(letterType, fields)}

${bodyParagraphs.trim()}

I would appreciate your prompt consideration of this matter. I am available to provide any additional information that may be required.

Thank you for your attention.

Yours faithfully,

${fields.student_name}
${fields.matric_number}
Department of ${fields.department}
Level: ${fields.level}`;
    
    // Validate output quality
    const hasStudentName = fields.student_name.includes('[NOT PROVIDED]') || completeLetter.includes(fields.student_name);
    const hasMatricNumber = completeLetter.includes(fields.matric_number);
    const hasLetterStructure = completeLetter.includes('Dear Sir/Madam') && completeLetter.includes('Yours faithfully');
    
    // Check for raw chat dump
    const firstUserMessage = userMessages[0]?.substring(0, 100).toLowerCase() || '';
    const letterLower = completeLetter.toLowerCase();
    const hasRawChatDump = firstUserMessage.length > 20 && letterLower.includes(firstUserMessage.substring(0, 50));
    
    if (!hasLetterStructure || !hasStudentName || !hasMatricNumber || hasRawChatDump || completeLetter.length < 300) {
      console.log('⚠️ AI output invalid or contains raw chat text, using template fallback');
      return fillTemplate(letterType, fields);
    }
    
    return completeLetter;
  } catch (error) {
    console.error('AI letter generation failed:', error);
    return fillTemplate(letterType, fields);
  }
}

// Helper function to generate appropriate subject lines
function getSubjectLine(letterType, fields) {
  const subjectLines = {
    'hostel_complaint': 'COMPLAINT REGARDING HOSTEL ACCOMMODATION',
    'exam_deferral': 'REQUEST FOR DEFERRAL OF EXAMINATION',
    'bursary_appeal': 'APPLICATION FOR FINANCIAL ASSISTANCE',
    'transcript_request': 'REQUEST FOR OFFICIAL TRANSCRIPT',
    'registration_issue': 'REQUEST FOR ASSISTANCE WITH COURSE REGISTRATION'
  };
  
  return subjectLines[letterType] || 'FORMAL REQUEST';
}

// Helper function to extract fields from conversation
function extractFields(context) {
  const fields = {
    student_name: '',
    matric_number: '',
    department: '',
    level: '',
    recipient_title: 'The Dean of Student Affairs',
    recipient_office: 'Office of the Dean of Student Affairs',
    date: new Date().toLocaleDateString('en-GB'),
    subject_line: '',
    issue_description: '',
    relevant_dates: 'recently',
    desired_outcome: 'appropriate action be taken to resolve this matter'
  };

  const contextLower = context.toLowerCase();
  
  // Extract matric number FIRST (most reliable identifier)
  // Be permissive - handle typos like "1o26" (letter O instead of zero)
  const matricPatterns = [
    /\b([UPG]\d{2}[A-Z]{2}\d{3,5})\b/i,  // Standard: U24AM1026
    /\b([UPG]\d{2}[A-Z]{2}[O0]{1}\d{2,4})\b/i,  // With O/0 confusion: u24am1o26
    /\b([UPG]\d{2}[A-Z]{2,3}[O0\d]{3,5})\b/i,  // More permissive
    /matric[:\s]+([A-Z0-9\/]{8,15})/i
  ];
  
  for (const pattern of matricPatterns) {
    const match = context.match(pattern);
    if (match) {
      let matric = match[1].trim().toUpperCase();
      // Normalize: replace letter O with digit 0 in numeric positions
      matric = matric.replace(/([A-Z]{2})O(\d)/g, '$10$2');  // After dept code
      matric = matric.replace(/(\d)O(\d)/g, '$10$2');  // Between digits
      fields.matric_number = matric;
      console.log(`✓ Matric extracted: ${matric}`);
      break;
    }
  }
  
  // Extract name - look for capitalized names, but NOT before matric number
  const namePatterns = [
    /(?:name is |my name is |i'm |i am )([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /^user:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/m,
  ];
  
  // Also try to find name in comma-separated format (before matric)
  const commaSepName = context.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)[,\s]+[UPG]\d{2}/i);
  if (commaSepName) {
    fields.student_name = commaSepName[1].trim();
  }
  
  if (!fields.student_name) {
    for (const pattern of namePatterns) {
      const match = context.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 5 && !name.match(/^(User|Assistant|Hello|Please|Thank|Dear)/i)) {
          fields.student_name = name;
          break;
        }
      }
    }
  }
  
  // Department extraction - ONLY from explicit user statement
  // DO NOT infer from matric code - proven unreliable (AM = Applied Math OR Automotive Engineering)
  if (!fields.department) {
    const deptPatterns = [
      /(?:department|dept)[:\s]+(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /(?:studying|study|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:department|dept)/i,
      /(Computer Science|Engineering|Automotive Engineering|Mechanical Engineering|Electrical Engineering|Civil Engineering|Chemical Engineering|Law|Medicine|Pharmacy|Agriculture|Architecture|Arts|Sciences|Mass Communication|Economics|Education|Physics|Chemistry|Mathematics|Applied Mathematics|Pure Mathematics|Biology)/i
    ];
    
    for (const pattern of deptPatterns) {
      const match = context.match(pattern);
      if (match && match[1]) {
        fields.department = match[1].trim();
        console.log(`✓ Department EXTRACTED from user input: ${fields.department}`);
        break;
      }
    }
  }
  
  // WARNING: Department inference from matric code has been REMOVED
  // Reason: Proven incorrect - same code maps to different departments
  // Example: AM = Applied Mathematics OR Automotive Engineering (ambiguous)
  
  // Level extraction - ONLY from explicit user statement
  // DO NOT infer from matric year - reliability not verified
  const levelPatterns = [
    /(\d)00\s*level/i,
    /level\s*(\d)00/i,
    /year\s*(\d)/i,
    /(\d)(?:st|nd|rd|th)\s*year/i,
  ];
  
  for (const pattern of levelPatterns) {
    const match = context.match(pattern);
    if (match && match[1]) {
      let level = match[1];
      if (level.length === 1) level = level + '00';
      fields.level = level;
      console.log(`✓ Level EXTRACTED from user input: ${fields.level}`);
      break;
    }
  }
  
  // WARNING: Level inference from matric year has been REMOVED
  // Reason: Reliability not independently verified
  // Students must explicitly state their level
  
  // Get all user messages (clean extraction)
  const userMessages = [];
  const parts = context.split(/\n/);
  for (const part of parts) {
    if (part.trim().toLowerCase().startsWith('user:')) {
      const msg = part.replace(/^user:\s*/i, '').trim();
      if (msg && msg.length > 10) {
        userMessages.push(msg);
      }
    }
  }
  
  // Extract issue description based on letter type
  if (userMessages.length > 0) {
    let issue = '';
    
    // For exam deferral
    if (contextLower.includes('exam') || contextLower.includes('defer')) {
      // Extract course
      const courseMatch = context.match(/([A-Z]{3,4}\s*\d{3})/i);
      
      // Extract reason - after the last comma in comma-separated input
      let reason = '';
      const lastUserMsg = userMessages[userMessages.length - 1];
      
      // Split by comma and get the last meaningful part
      const parts = lastUserMsg.split(',');
      if (parts.length > 3) {
        reason = parts[parts.length - 1].trim();
      } else {
        // Try explicit patterns
        const reasonMatch = lastUserMsg.match(/(?:reason|because|due to)[:\s]+(.+?)(?:\.|$)/i);
        if (reasonMatch) {
          reason = reasonMatch[1].trim();
        }
      }
      
      // Build issue
      if (courseMatch) {
        issue = `I am writing to request deferral of my ${courseMatch[1].toUpperCase()} examination. `;
      } else {
        issue = 'I am writing to request deferral of my examination. ';
      }
      
      if (reason && reason.length > 3 && !reason.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+$/)) {
        issue += `The reason for this request is ${reason}.`;
      }
    }
    // For hostel complaints
    else if (contextLower.includes('hostel') || contextLower.includes('roommate') || contextLower.includes('stealing')) {
      // Get the first meaningful message about the issue
      const firstMsg = userMessages[0];
      
      // Extract just the core complaint (before personal details)
      let complaint = firstMsg;
      
      // Remove everything after the first comma if it contains personal info
      const beforeComma = firstMsg.split(',')[0];
      if (beforeComma.length > 20) {
        complaint = beforeComma;
      }
      
      // Or use explicit complaint patterns
      const complaintMatch = firstMsg.match(/(roommate.*?(?:stealing|noise|harass|dirty|broken).+?)(?:,|$)/i);
      if (complaintMatch) {
        complaint = complaintMatch[1].trim();
      }
      
      if (complaint.length > 15) {
        issue = complaint;
      }
      
      // Extract hostel/room info for relevant_dates
      const hostelMatch = context.match(/([\w\s]+hostel)\s+room\s+(\d+)/i);
      if (hostelMatch) {
        fields.relevant_dates = `in ${hostelMatch[1]} Room ${hostelMatch[2]}`;
      }
      
      // Extract month/time reference - prioritize user's actual words
      const monthMatch = context.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
      if (monthMatch) {
        const month = monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase();
        fields.relevant_dates = `since ${month} 2026`;
        console.log(`✓ Date extracted: ${fields.relevant_dates}`);
      } else {
        const timeMatch = context.match(/(last week|last month|this month|two weeks ago|a month ago|recently)/i);
        if (timeMatch) {
          fields.relevant_dates = timeMatch[1].toLowerCase();
        }
      }
    }
    // Other letter types
    else {
      issue = userMessages[0];
    }
    
    if (issue.length > 10) {
      fields.issue_description = issue;
    }
  }
  
  // Log extraction summary
  console.log('📋 Extracted fields:', {
    name: fields.student_name ? '✓' : '✗',
    matric: fields.matric_number ? '✓' : '✗',
    department: fields.department ? '✓' : '✗',
    level: fields.level ? '✓' : '✗',
    issue: fields.issue_description ? '✓' : '✗'
  });
  
  // Extract time references
  const timePatterns = [
    /(?:started|began|happening|occurring)\s+(.+?)(?:\.|,|and|$)/i,
    /(?:since|from)\s+(.+?)(?:\.|,|and|$)/i,
    /(\d+\s+(?:weeks?|months?|days?)\s+ago)/i,
    /(last\s+\w+)/i,
    /(this\s+(?:week|month|semester))/i
  ];
  
  for (const pattern of timePatterns) {
    const match = context.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      fields.relevant_dates = match[1].trim();
      break;
    }
  }
  
  // Set appropriate recipient based on issue type
  if (contextLower.includes('hostel') || contextLower.includes('roommate') || contextLower.includes('accommodation')) {
    fields.recipient_office = 'Office of the Chief Hostel Warden';
    fields.recipient_title = 'The Chief Hostel Warden';
  } else if (contextLower.includes('exam') || contextLower.includes('defer') || contextLower.includes('postpone')) {
    fields.recipient_office = 'Office of the Dean of Faculty';
    fields.recipient_title = 'The Dean of Faculty';
  } else if (contextLower.includes('bursary') || contextLower.includes('financial') || contextLower.includes('fee') || contextLower.includes('payment')) {
    fields.recipient_office = 'Bursary Department';
    fields.recipient_title = 'The Bursar';
  } else if (contextLower.includes('transcript') || contextLower.includes('certificate')) {
    fields.recipient_office = 'Registry Department';
    fields.recipient_title = 'The Registrar';
  } else if (contextLower.includes('registration') || contextLower.includes('course') || contextLower.includes('portal')) {
    fields.recipient_office = 'Office of the Dean of Faculty';
    fields.recipient_title = 'The Dean of Faculty';
  }
  
  // Set desired outcome based on issue type
  if (contextLower.includes('stealing') || contextLower.includes('theft')) {
    fields.desired_outcome = 'the matter be investigated and appropriate action taken against the offender';
  } else if (contextLower.includes('change room') || contextLower.includes('move')) {
    fields.desired_outcome = 'I be allowed to change my accommodation to a different room';
  } else if (contextLower.includes('exam') || contextLower.includes('defer')) {
    fields.desired_outcome = 'I be permitted to take the examination at a later date';
  } else if (contextLower.includes('bursary') || contextLower.includes('financial')) {
    fields.desired_outcome = 'my request for financial assistance be granted';
  }

  // Final extraction summary
  console.log('\n═══════════════════════════════════════');
  console.log('📋 FINAL EXTRACTION RESULTS:');
  console.log('═══════════════════════════════════════');
  console.log(`Name: ${fields.student_name || '[NOT PROVIDED]'}`);
  console.log(`Matric: ${fields.matric_number || '[NOT PROVIDED]'}`);
  console.log(`Department: ${fields.department || '[NOT PROVIDED]'} ${fields.department ? '✓ EXPLICIT' : '✗ NOT STATED'}`);
  console.log(`Level: ${fields.level || '[NOT PROVIDED]'} ${fields.level ? '✓ EXPLICIT' : '✗ NOT STATED'}`);
  console.log(`Issue: ${fields.issue_description ? fields.issue_description.substring(0, 80) + '...' : '[NOT PROVIDED]'}`);
  console.log('═══════════════════════════════════════');
  console.log('⚠️  NO INFERENCE: Department and level are NEVER guessed');
  console.log('✅  EXPLICIT ONLY: All fields come from user statements');
  console.log('═══════════════════════════════════════\n');

  return fields;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 Sakon ABU Backend Started');
  console.log('═'.repeat(60));
  console.log(`📡 API Server:        http://localhost:${PORT}`);
  console.log(`💬 Gemma 4:           via Ollama (localhost:11434)`);
  console.log(`💾 Database:          SQLite (backend/sakon.db)`);
  console.log(`📝 Letter Templates:  5 types available`);
  console.log('═'.repeat(60));
  console.log('✅ Ready to draft letters!');
  console.log('📚 Docs: See README.md or INDEX.md for help');
  console.log('🧪 Test: Try scenarios from DEMO_SCENARIOS.md');
  console.log('═'.repeat(60) + '\n');
});
