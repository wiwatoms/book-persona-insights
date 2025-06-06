
export class RobustJSONParser {
  static parseAIResponse(content: string): any {
    if (!content) {
      throw new Error('Empty response from AI');
    }

    // Try to parse the entire content first
    try {
      return JSON.parse(content.trim());
    } catch (e) {
      // If that fails, try to extract JSON from the content
    }

    // Remove common AI conversational prefixes/suffixes
    const cleanedContent = content
      .replace(/^(Here is the|Here's the|The|This is the).*?JSON.*?[:\n]/gmi, '')
      .replace(/^(```json\s*)/gmi, '')
      .replace(/(\s*```\s*)$/gmi, '')
      .replace(/^.*?(?=\{)/s, '') // Remove everything before first {
      .replace(/\}[^}]*$/s, '}') // Remove everything after last }
      .trim();

    // Try multiple JSON extraction patterns
    const patterns = [
      /\{[\s\S]*\}/, // Complete JSON object
      /\[[\s\S]*\]/, // JSON array
      /\{[^{}]*\{[^{}]*\}[^{}]*\}/, // Nested object
    ];

    for (const pattern of patterns) {
      const match = cleanedContent.match(pattern);
      if (match) {
        try {
          const jsonStr = match[0];
          return JSON.parse(jsonStr);
        } catch (e) {
          console.warn('Failed to parse extracted JSON:', e);
          continue;
        }
      }
    }

    // Last resort: try to fix common JSON issues
    try {
      const fixedJson = cleanedContent
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      
      return JSON.parse(fixedJson);
    } catch (e) {
      console.error('All JSON parsing attempts failed. Original content:', content);
      throw new Error(`Failed to parse AI response as JSON. Content preview: ${content.substring(0, 200)}...`);
    }
  }

  static safeParseWithFallback<T>(content: string, fallback: T): T {
    try {
      return this.parseAIResponse(content);
    } catch (e) {
      console.warn('JSON parsing failed, using fallback:', e);
      return fallback;
    }
  }
}
