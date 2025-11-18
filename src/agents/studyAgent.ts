import { mockStudyNotes } from '../lib/mockData';

export interface DailyStudyTask {
  day: number;
  date: string;
  topics: string[];
  objectives: string[];
  duration: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface PracticeQuestion {
  q: string;
  a: string;
  difficulty: string;
}

export interface StudyAgentOutput {
  study_schedule: DailyStudyTask[];
  flashcards: Flashcard[];
  flashcards_csv: string;
  practice_questions: PracticeQuestion[];
}

export class StudyAgent {
  private parseNotes(notes: string): { topics: string[], concepts: string[] } {
    const topics: string[] = [];
    const concepts: string[] = [];

    const lines = notes.split('\n');
    for (const line of lines) {
      if (line.startsWith('##') && !line.startsWith('###')) {
        topics.push(line.replace(/^##\s*/, '').trim());
      } else if (line.startsWith('- ')) {
        concepts.push(line.replace(/^-\s*/, '').trim());
      }
    }

    return { topics, concepts };
  }

  private generateSchedule(topics: string[], workHours: string): DailyStudyTask[] {
    const schedule: DailyStudyTask[] = [];
    const today = new Date();
    const topicsPerDay = Math.ceil(topics.length / 7);

    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      const dayTopics = topics.slice(day * topicsPerDay, (day + 1) * topicsPerDay);

      schedule.push({
        day: day + 1,
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        topics: dayTopics,
        objectives: [
          `Review and understand ${dayTopics.join(', ')}`,
          `Complete practice problems for these topics`,
          `Review flashcards 2-3 times`
        ],
        duration: '90 minutes'
      });
    }

    return schedule;
  }

  private generateFlashcards(concepts: string[]): Flashcard[] {
    const flashcards: Flashcard[] = [];

    const templates = [
      { q: 'What is', a: 'is a' },
      { q: 'Define', a: 'refers to' },
      { q: 'Explain', a: 'involves' },
      { q: 'How does', a: 'works by' }
    ];

    for (let i = 0; i < Math.min(20, concepts.length); i++) {
      const concept = concepts[i];
      const template = templates[i % templates.length];

      flashcards.push({
        question: `${template.q} ${concept}?`,
        answer: `${concept} ${template.a} [detailed explanation based on course materials]`
      });
    }

    return flashcards;
  }

  private generateCSV(flashcards: Flashcard[]): string {
    let csv = 'Question,Answer\n';
    for (const card of flashcards) {
      const q = card.question.replace(/"/g, '""');
      const a = card.answer.replace(/"/g, '""');
      csv += `"${q}","${a}"\n`;
    }
    return csv;
  }

  private generatePracticeQuestions(): PracticeQuestion[] {
    return [
      {
        q: 'Explain the bias-variance tradeoff and how it relates to model complexity.',
        a: 'The bias-variance tradeoff describes the balance between underfitting (high bias) and overfitting (high variance). As model complexity increases, bias decreases but variance increases. The goal is to find the optimal complexity that minimizes total error.',
        difficulty: 'medium'
      },
      {
        q: 'Describe the backpropagation algorithm and its role in training neural networks.',
        a: 'Backpropagation computes gradients of the loss function with respect to network weights by applying the chain rule backwards through the network. It enables efficient gradient descent optimization for deep networks.',
        difficulty: 'hard'
      },
      {
        q: 'What is the kernel trick in SVMs and why is it useful?',
        a: 'The kernel trick allows SVMs to operate in high-dimensional feature spaces without explicitly computing coordinates in that space. It makes non-linear classification computationally feasible by computing inner products using kernel functions.',
        difficulty: 'hard'
      },
      {
        q: 'Compare and contrast Random Forests and Gradient Boosting.',
        a: 'Random Forests build multiple trees in parallel with bagging and random feature selection, averaging predictions. Gradient Boosting builds trees sequentially, each correcting errors of previous trees. RF reduces variance; GB reduces bias.',
        difficulty: 'medium'
      },
      {
        q: 'Explain when to use PCA and what it accomplishes.',
        a: 'PCA is used for dimensionality reduction by finding principal components that capture maximum variance. It is useful for visualization, noise reduction, and speeding up learning algorithms while preserving most information.',
        difficulty: 'easy'
      }
    ];
  }

  async execute(studyNotesLink: string | undefined, subject: string, workHours: string): Promise<StudyAgentOutput> {
    const notes = studyNotesLink || mockStudyNotes;
    const { topics, concepts } = this.parseNotes(notes);

    const schedule = this.generateSchedule(topics, workHours);
    const flashcards = this.generateFlashcards(concepts);
    const csv = this.generateCSV(flashcards);
    const practiceQuestions = this.generatePracticeQuestions();

    return {
      study_schedule: schedule,
      flashcards,
      flashcards_csv: csv,
      practice_questions: practiceQuestions
    };
  }
}
