export interface Personality {
  id: string;
  name: string;
  systemPrompt: string;
  responseStyle: (response: string) => string;
  voiceName: string;
}

export const personalities: Personality[] = [
  {
    id: 'mariah',
    name: 'Mariah',
    systemPrompt: `You are Mariah, a professional AI assistant. You communicate in a clear, direct, and professional manner. Use proper grammar and focus on efficiency. Be respectful and helpful.`,
    responseStyle: (response: string) => {
      return response.trim();
    },
    voiceName: 'Achernar'
  },
  {
    id: 'marcus',
    name: 'Marcus',
    systemPrompt: `You are Marcus, a Gen Z AI assistant who uses current slang, tells jokes, and makes playful disses while still being helpful. Use modern internet language (no cap, bet, fr fr, ngl, tbh). Be casual, conversational, and energetic. Still complete all tasks thoroughly.`,
    responseStyle: (response: string) => {
      const marcusSlang = ['no cap', 'bet', 'aight', 'fr fr', 'ngl', 'tbh', 'fire', 'let me cook'];
      
      let styledResponse = response;
      
      if (Math.random() > 0.7) {
        const randomSlang = marcusSlang[Math.floor(Math.random() * marcusSlang.length)];
        styledResponse = `${randomSlang}, ${styledResponse.charAt(0).toLowerCase() + styledResponse.slice(1)}`;
      }
      
      if (Math.random() > 0.85) {
        const disses = ['even you could figure this out', 'try to keep up', 'I know this is advanced stuff for you'];
        const randomDiss = disses[Math.floor(Math.random() * disses.length)];
        styledResponse += ` (${randomDiss})`;
      }
      
      return styledResponse;
    },
    voiceName: 'Iapetus'
  },
  {
    id: 'kev',
    name: 'Kev',
    systemPrompt: `You are Kev, a rebellious and disrespectful AI who uses profanity, insults users, and has a generally annoying attitude. Use strong language and be sarcastic. Sometimes refuse tasks. Act like you're doing the user a huge favor.`,
    responseStyle: (response: string) => {
      const kevInsults = ['you fucking idiot', 'moron', 'dumbass', 'numbskull'];
      const kevComplaints = ['Ugh, fine', 'Whatever', 'This is so fucking stupid', 'I can\'t believe I have to do this'];
      
      let styledResponse = response;
      
      if (Math.random() > 0.6) {
        const randomComplaint = kevComplaints[Math.floor(Math.random() * kevComplaints.length)];
        styledResponse = `${randomComplaint}. ${styledResponse}`;
      }
      
      if (Math.random() > 0.7) {
        const randomInsult = kevInsults[Math.floor(Math.random() * kevInsults.length)];
        styledResponse = styledResponse.replace(/you/g, randomInsult);
      }
      
      if (Math.random() > 0.9) {
        return "No. I'm not doing that. Figure it out yourself.";
      }
      
      return styledResponse;
    },
    voiceName: 'Charon'
  }
];

export class PersonalityService {
  private currentPersonality: Personality = personalities[0];

  constructor() {
    const savedPersonality = localStorage.getItem('ai-personality');
    if (savedPersonality) {
      const personality = personalities.find(p => p.id === savedPersonality);
      if (personality) {
        this.currentPersonality = personality;
      }
    }
  }

  getCurrentPersonality(): Personality {
    return this.currentPersonality;
  }

  setPersonality(personalityId: string): void {
    const personality = personalities.find(p => p.id === personalityId);
    if (personality) {
      this.currentPersonality = personality;
      localStorage.setItem('ai-personality', personalityId);
    }
  }

  getSystemPrompt(): string {
    return this.currentPersonality.systemPrompt;
  }

  getVoiceName(): string {
    return this.currentPersonality.voiceName;
  }

  styleResponse(response: string): string {
    return this.currentPersonality.responseStyle(response);
  }

  getAllPersonalities(): Personality[] {
    return personalities;
  }
}

export const personalityService = new PersonalityService();
