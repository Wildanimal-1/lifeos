export interface MockEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date: Date;
  unread: boolean;
  priority: 'urgent' | 'normal' | 'low';
}

export interface MockCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  priority: 'high' | 'medium' | 'low';
}

export function generateMockEmails(): MockEmail[] {
  const now = new Date();
  return [
    {
      id: 'email-1',
      from: 'professor@university.edu',
      subject: 'URGENT: ML Midterm Reschedule to Monday',
      snippet: 'The midterm has been moved to Monday. Please confirm attendance.',
      body: 'Dear students, due to unforeseen circumstances, the ML midterm has been rescheduled to Monday at 10 AM. Please confirm your attendance.',
      date: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      unread: true,
      priority: 'urgent'
    },
    {
      id: 'email-2',
      from: 'team-lead@company.com',
      subject: 'Sprint Review Meeting Tomorrow',
      snippet: 'Please prepare your updates for tomorrow\'s sprint review.',
      body: 'Hi team, reminder about our sprint review meeting tomorrow at 2 PM. Please have your updates ready.',
      date: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      unread: true,
      priority: 'normal'
    },
    {
      id: 'email-3',
      from: 'recruiter@techcorp.com',
      subject: 'Interview Opportunity - Senior Developer',
      snippet: 'We have an exciting opportunity that matches your profile.',
      body: 'Hello, we came across your profile and think you would be a great fit for our Senior Developer position.',
      date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      unread: true,
      priority: 'normal'
    },
    {
      id: 'email-4',
      from: 'newsletter@techblog.com',
      subject: 'Weekly Tech Digest',
      snippet: 'Top 10 articles this week on AI and Machine Learning',
      body: 'Here are the most popular articles from this week covering AI, ML, and software development trends.',
      date: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      unread: true,
      priority: 'low'
    },
    {
      id: 'email-5',
      from: 'client@startup.io',
      subject: 'Project Deadline Extension Request',
      snippet: 'Can we discuss extending the project deadline?',
      body: 'Hi, we are facing some challenges with requirements and would like to discuss a possible deadline extension.',
      date: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      unread: true,
      priority: 'urgent'
    },
    {
      id: 'email-6',
      from: 'mentor@university.edu',
      subject: 'Research Paper Review',
      snippet: 'I\'ve reviewed your draft and have some feedback.',
      body: 'Great work on the draft! I have a few suggestions for improvement that we should discuss.',
      date: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      unread: true,
      priority: 'normal'
    }
  ];
}

export function generateMockCalendarEvents(): MockCalendarEvent[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      id: 'event-1',
      title: 'Team Standup',
      start: new Date(startOfDay.getTime() + 10 * 60 * 60 * 1000),
      end: new Date(startOfDay.getTime() + 10.5 * 60 * 60 * 1000),
      description: 'Daily standup meeting',
      priority: 'medium'
    },
    {
      id: 'event-2',
      title: 'Coffee Chat with Marketing',
      start: new Date(startOfDay.getTime() + 11 * 60 * 60 * 1000),
      end: new Date(startOfDay.getTime() + 12 * 60 * 60 * 1000),
      description: 'Casual discussion about Q4 campaigns',
      priority: 'low'
    },
    {
      id: 'event-3',
      title: 'Sprint Planning',
      start: new Date(startOfDay.getTime() + 14 * 60 * 60 * 1000),
      end: new Date(startOfDay.getTime() + 16 * 60 * 60 * 1000),
      description: 'Plan next sprint tasks',
      priority: 'high'
    },
    {
      id: 'event-4',
      title: 'Optional: Team Building Activity',
      start: new Date(startOfDay.getTime() + 16 * 60 * 60 * 1000),
      end: new Date(startOfDay.getTime() + 17 * 60 * 60 * 1000),
      description: 'Voluntary team activity',
      priority: 'low'
    },
    {
      id: 'event-5',
      title: 'One-on-One with Manager',
      start: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
      description: 'Monthly check-in',
      priority: 'high'
    },
    {
      id: 'event-6',
      title: 'Lunch with Sales Team',
      start: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
      description: 'Informal lunch meeting',
      priority: 'low'
    }
  ];
}

export const mockStudyNotes = `
# Machine Learning Midterm - Study Guide

## Week 1-2: Fundamentals
- Supervised vs Unsupervised Learning
- Linear Regression: concepts, cost function, gradient descent
- Logistic Regression: sigmoid function, decision boundary
- Overfitting and Regularization (L1, L2)

## Week 3-4: Neural Networks
- Perceptrons and activation functions
- Backpropagation algorithm
- Deep learning architectures
- Convolutional Neural Networks (CNNs)

## Week 5: Support Vector Machines
- Linear SVM
- Kernel trick
- Soft margin classification

## Week 6: Ensemble Methods
- Decision Trees
- Random Forests
- Gradient Boosting
- XGBoost

## Week 7: Unsupervised Learning
- K-Means Clustering
- Hierarchical Clustering
- Principal Component Analysis (PCA)
- t-SNE for visualization

## Important Concepts
- Bias-Variance Tradeoff
- Cross-validation techniques
- Feature engineering
- Model evaluation metrics (precision, recall, F1-score, ROC-AUC)
`;
