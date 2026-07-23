import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'gemma4:e2b'; // Gemma 4 E2B variant
const USE_FAST_MODE = false; // Must use real Gemma 4 for hackathon

/**
 * Call Gemma 4 via Ollama API
 * Optimized for faster responses while maintaining quality
 */
export async function callGemma(prompt, systemPrompt = '', options = {}) {
  // Fast mode: use fallback for instant responses during demo
  if (USE_FAST_MODE) {
    console.log('⚡ Fast mode enabled - using rule-based responses');
    return getFallbackResponse(prompt);
  }
  
  // Default options for chat responses (optimized for 8GB RAM, CPU-only)
  const defaultOptions = {
    temperature: 0.7,
    top_p: 0.9,
    num_predict: 60,         // Reduced for faster generation
    num_ctx: 512,            // Smaller context for less RAM usage
    top_k: 10,               // Lower sampling = faster generation
    repeat_penalty: 1.2,     // Reduce repetition
    num_thread: 6,           // Increased threads for better CPU utilization (adjust based on CPU cores)
  };
  
  // Merge with custom options
  const gemmaOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: systemPrompt + '\n\n' + prompt,
      stream: false,
      options: gemmaOptions
    }, {
      timeout: 180000  // 3 minutes timeout for CPU-only processing
    });

    console.log(' DEBUG Ollama response:', JSON.stringify(response.data, null, 2));
    
    const result = response.data.response || '';
    console.log(` Gemma response length: ${result.length} chars`);
    
    if (result.length === 0) {
      console.error(' Gemma returned empty response, using fallback');
      return getFallbackResponse(prompt);
    }
    
    return result;
  } catch (error) {
    console.error(' Gemma API error:', error.message);
    console.log('⚡ Falling back to rule-based response');
    
    // Fallback to rule-based response if Gemma fails
    return getFallbackResponse(prompt);
  }
}

/**
 * Call Gemma for letter generation (longer output)
 */
export async function callGemmaForLetter(prompt, systemPrompt = '') {
  return callGemma(prompt, systemPrompt, {
    num_predict: 600,        // Allow longer output for full letters
    num_ctx: 2048,           // Larger context for letter details
    temperature: 0.7,        // Moderate creativity for natural variation (not 0 - too rigid)
    top_k: 40,               // More variety in word choice
    repeat_penalty: 1.1,     // Prevent repetition
  });
}

/**
 * Fallback response when Gemma is not available or in fast mode
 * This ensures the demo still works with instant responses
 */
function getFallbackResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  // Check if this is a follow-up with details
  const hasDetails = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(prompt) || // Has name
                     /[UPG]\d{2}[A-Z]{2}\d{4}/.test(prompt) ||     // Has U-format matric
                     /ABU\/[A-Z]+\/\d+/.test(prompt) ||            // Has ABU matric
                     /\d00\s*level/i.test(prompt);                 // Has level

  if (hasDetails) {
    return "Thank you for providing those details. I have enough information to draft your letter now. Let me prepare it for you.";
  }

  // First interaction - identify issue type
  if (lowerPrompt.includes('hostel') || lowerPrompt.includes('roommate') || lowerPrompt.includes('porter')) {
    return "I understand you're having a hostel issue. To help you draft a formal complaint letter, I need a few details:\n\n1. What is your name and matric number?\n2. Which hostel and room are you in?\n3. When did this issue start?";
  } 
  
  if (lowerPrompt.includes('exam') || lowerPrompt.includes('defer') || lowerPrompt.includes('postpone')) {
    return "I can help you request an exam deferral. Please provide:\n\n1. Your name, matric number, and department\n2. Which exam/course do you need to defer?\n3. What is the reason for the deferral?";
  } 
  
  if (lowerPrompt.includes('transcript') || lowerPrompt.includes('certificate')) {
    return "I'll help you request a transcript. I need:\n\n1. Your full name and matric number\n2. Your department and year of graduation\n3. Where should the transcript be sent or collected?";
  } 
  
  if (lowerPrompt.includes('bursary') || lowerPrompt.includes('financial') || lowerPrompt.includes('fee')) {
    return "I can help you write a bursary appeal. Please tell me:\n\n1. Your name, matric number, and department\n2. What financial assistance do you need?\n3. What is your current situation?";
  } 
  
  if (lowerPrompt.includes('registration') || lowerPrompt.includes('course') || lowerPrompt.includes('portal')) {
    return "I'll help with your course registration issue. I need:\n\n1. Your name, matric number, and level\n2. What is the registration issue?\n3. Which course(s) are affected?";
  }
  
  // Generic welcome
  return "Welcome to Sakon ABU! I help ABU students draft formal letters. What kind of letter do you need? For example:\n\n• Hostel complaint\n• Exam deferral request\n• Bursary/financial aid appeal\n• Transcript request\n• Course registration issue";
}

/**
 * Call Gemma with function calling support
 * This demonstrates how to use Gemma 4's native function calling
 */
export async function callGemmaWithTools(prompt, tools, systemPrompt = '') {
  try {
    // Format tools in Ollama's expected format
    const formattedTools = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));

    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      tools: formattedTools,
      stream: false,
    });

    return response.data;
  } catch (error) {
    console.error('Gemma function calling error:', error.message);
    return null;
  }
}
