import { letterTemplates } from './templates.js';

/**
 * Function: classify_letter_type
 * Determines which type of letter the student needs based on conversation context
 */
export async function classifyLetterType(userContext) {
  const context = userContext.toLowerCase();

  // Simple keyword-based classification
  // In production, would use Gemma's function calling for this
  if (context.includes('hostel') || context.includes('roommate') || 
      context.includes('porter') || context.includes('accommodation')) {
    return 'hostel_complaint';
  } else if (context.includes('exam') || context.includes('defer') || 
             context.includes('postpone') || context.includes('reschedule')) {
    return 'exam_deferral';
  } else if (context.includes('bursary') || context.includes('financial') || 
             context.includes('fee') || context.includes('scholarship')) {
    return 'bursary_appeal';
  } else if (context.includes('transcript') || context.includes('certificate') || 
             context.includes('record')) {
    return 'transcript_request';
  } else if (context.includes('registration') || context.includes('course') || 
             context.includes('add') || context.includes('drop')) {
    return 'registration_issue';
  }

  return 'unknown';
}

/**
 * Function: fill_template
 * Populates the appropriate letter template with extracted fields
 */
export function fillTemplate(letterType, fields) {
  const template = letterTemplates[letterType];
  
  if (!template) {
    throw new Error(`Unknown letter type: ${letterType}`);
  }

  let filledLetter = template;

  // Replace all field placeholders
  Object.keys(fields).forEach(key => {
    const placeholder = `{${key}}`;
    const value = fields[key] || `[${key.toUpperCase()}]`;
    filledLetter = filledLetter.replace(new RegExp(placeholder, 'g'), value);
  });

  return filledLetter;
}

/**
 * Function: check_register
 * Reviews the draft against formal letter conventions and corrects issues
 * IMPORTANT: This must actually check the content, not just return static results
 */
export function checkRegister(draftLetter, originalUserInput = '') {
  const flagged_issues = [];
  let corrected_letter = draftLetter;

  // Check 1: Formal salutation
  if (corrected_letter.match(/Dear (Sir|Madam)/)) {
    flagged_issues.push({
      status: 'passed',
      message: 'Formal salutation present'
    });
  } else {
    flagged_issues.push({
      status: 'warning',
      message: 'Missing formal salutation'
    });
  }

  // Check 2: Subject line present
  if (corrected_letter.match(/RE:|SUBJECT:/i)) {
    flagged_issues.push({
      status: 'passed',
      message: 'Subject line present'
    });
  } else {
    flagged_issues.push({
      status: 'warning',
      message: 'Subject line missing'
    });
  }

  // Check 3: Formal closing
  if (corrected_letter.match(/Yours (faithfully|sincerely)/)) {
    flagged_issues.push({
      status: 'passed',
      message: 'Formal closing used'
    });
  } else {
    flagged_issues.push({
      status: 'warning',
      message: 'Incorrect closing - should be "Yours faithfully"'
    });
    corrected_letter = corrected_letter.replace(
      /Best regards|Thanks|Cheers/gi,
      'Yours faithfully'
    );
  }

  // Check 4: Grammar - uncapitalized "i" (very informal)
  const uncapitalizedI = corrected_letter.match(/\bi\s+(?:will|am|was|have|had|can|would)/gi);
  if (!uncapitalizedI) {
    flagged_issues.push({
      status: 'passed',
      message: 'No grammar errors (capitalization)'
    });
  } else {
    flagged_issues.push({
      status: 'error',
      message: `Found ${uncapitalizedI.length} uncapitalized "i" - highly informal`
    });
  }

  // Check 5: Detect raw chat input dumped into body - ACTUAL CHECK
  if (originalUserInput && originalUserInput.length > 20) {
    // Extract potential raw phrases from user input (15+ char substrings)
    const userWords = originalUserInput.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const letterWords = corrected_letter.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    
    // Check if a substantial sequence of user words appears verbatim in the letter
    let maxMatchLength = 0;
    for (let i = 0; i < userWords.length - 3; i++) {
      const phrase = userWords.slice(i, i + 5).join(' ');
      if (phrase.length > 20 && corrected_letter.toLowerCase().includes(phrase)) {
        maxMatchLength = Math.max(maxMatchLength, phrase.length);
      }
    }
    
    // Also check for suspicious comma-separated patterns
    const suspiciousPatterns = [
      /[a-z]+,[A-Z]\d{2}[A-Z]{2}\d{3,5},/i,  // name,matric, pattern
      /room \d+,\w+/i,  // room number followed by commas
      /,\s*[a-z]+\s*,/i,  // generic comma-separated casual text
    ];
    
    const hasCommaPattern = suspiciousPatterns.some(pattern => pattern.test(corrected_letter));
    
    if (maxMatchLength > 25 || hasCommaPattern) {
      flagged_issues.push({
        status: 'error',
        message: 'Body contains raw chat text instead of composed formal sentences'
      });
    } else {
      flagged_issues.push({
        status: 'passed',
        message: 'No raw chat text in body'
      });
    }
  } else {
    // If we don't have original input to compare, just check for comma patterns
    const suspiciousPatterns = [
      /[a-z]+,[A-Z]\d{2}[A-Z]{2}\d{3,5},/i,
      /room \d+,\w+/i,
    ];
    
    const hasCommaPattern = suspiciousPatterns.some(pattern => pattern.test(corrected_letter));
    
    if (hasCommaPattern) {
      flagged_issues.push({
        status: 'error',
        message: 'Body may contain raw chat text'
      });
    } else {
      flagged_issues.push({
        status: 'passed',
        message: 'No raw chat text detected'
      });
    }
  }

  // Check 6: Avoid contractions
  const contractions = corrected_letter.match(/\b(don't|can't|won't|you're|we're|they're)\b/gi);
  if (!contractions) {
    flagged_issues.push({
      status: 'passed',
      message: 'No informal contractions'
    });
  } else {
    flagged_issues.push({
      status: 'warning',
      message: `Found ${contractions.length} contraction(s) - should be expanded`
    });
    corrected_letter = corrected_letter
      .replace(/don't/gi, 'do not')
      .replace(/can't/gi, 'cannot')
      .replace(/won't/gi, 'will not')
      .replace(/you're/gi, 'you are')
      .replace(/we're/gi, 'we are')
      .replace(/they're/gi, 'they are');
  }

  // Check 7: Appropriate formal tone
  const informalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'nah', 'ok', 'btw'];
  const foundInformal = informalWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(corrected_letter)
  );
  
  if (foundInformal.length === 0) {
    flagged_issues.push({
      status: 'passed',
      message: 'Appropriate formal tone maintained'
    });
  } else {
    flagged_issues.push({
      status: 'error',
      message: `Informal words found: ${foundInformal.join(', ')}`
    });
  }

  // Check 8: Specificity - detect overly generic filler language
  const genericPhrases = [
    /this matter requires (?:your )?attention/i,
    /i (?:would )?appreciate your (?:prompt )?consideration/i,
    /thank you for your (?:time and )?attention/i,
    /i am available (?:to provide )?(?:any )?additional information/i
  ];
  
  // Count how many generic phrases appear
  const genericCount = genericPhrases.filter(phrase => phrase.test(corrected_letter)).length;
  
  // Also check if the letter has ANY specific details (dates, courses, locations, specific issues)
  const hasSpecifics = /(?:June|July|January|February|March|April|May|August|September|October|November|December)\s+\d{4}|[A-Z]{3,4}\s*\d{3}|Room\s+\d+|since\s+\w+\s+\d{4}/i.test(corrected_letter);
  
  if (genericCount <= 2 && hasSpecifics) {
    flagged_issues.push({
      status: 'passed',
      message: 'Letter contains specific details, not generic filler'
    });
  } else if (!hasSpecifics) {
    flagged_issues.push({
      status: 'warning',
      message: 'Letter lacks specific details (dates, courses, locations)'
    });
  } else {
    flagged_issues.push({
      status: 'passed',
      message: 'Reasonable balance of formal language and specifics'
    });
  }

  return {
    flagged_issues,
    corrected_letter
  };
}
