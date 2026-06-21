export const speechDictionary: Record<string, string> = {
  "ml": "ML",
  "ai": "AI",
  "api": "API",
  "ui": "UI",
  "ux": "UX",
};

export const normalizeSpeechText = (text: string): string => {
  if (!text) return "";
  return text
    .split(/\s+/)
    .map(word => {
      // Separate leading and trailing punctuation from the alphanumeric core
      const punctuationMatch = word.match(/^([^\w]*)(.*?)([^\w]*)$/);
      if (!punctuationMatch) return word;
      const leading = punctuationMatch[1];
      const core = punctuationMatch[2];
      const trailing = punctuationMatch[3];
      
      const lowerCore = core.toLowerCase();
      if (speechDictionary[lowerCore]) {
        return leading + speechDictionary[lowerCore] + trailing;
      }
      return word;
    })
    .join(" ");
};
