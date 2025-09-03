
export interface ExamResult {
    id: string;
    examName: string;
    date: string;
    tytNet: number;
    aytNet: number;
    totalNet: number;
}

export interface Book {
    id: string;
    name: string;
    subject: string;
    status: 'Başlanmadı' | 'Devam Ediyor' | 'Bitti';
}

export interface DailyLog {
    id: string;
    date: string;
    questions: {
        subject: string;
        count: number;
    }[];
    totalQuestions: number;
}

export interface Student {
    id: string;
    name: string;
    examResults: ExamResult[];
    books: Book[];
    dailyLogs: DailyLog[];
}
