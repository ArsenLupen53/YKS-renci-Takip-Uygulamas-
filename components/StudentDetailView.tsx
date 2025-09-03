import React, { useState, useMemo } from 'react';
import type { Student, ExamResult, Book, DailyLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ConfirmationModal } from './ConfirmationModal';

interface StudentDetailViewProps {
    student: Student;
    updateStudent: (student: Student) => void;
}

type Tab = 'summary' | 'exams' | 'books' | 'questions';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm rounded-md transition-colors duration-200 ${active ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
    >
        {children}
    </button>
);

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, updateStudent }) => {
    const [activeTab, setActiveTab] = useState<Tab>('summary');
    const [editingExamId, setEditingExamId] = useState<string | null>(null);
    const [examToDeleteId, setExamToDeleteId] = useState<string | null>(null);
    const [examFormState, setExamFormState] = useState<Omit<ExamResult, 'id' | 'totalNet'>>({
        examName: '',
        date: '',
        tytNet: 0,
        aytNet: 0,
    });


    const addNewExam = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const tytNet = parseFloat(formData.get('tytNet') as string) || 0;
        const aytNet = parseFloat(formData.get('aytNet') as string) || 0;
        const newExam: ExamResult = {
            id: `exam-${Date.now()}`,
            examName: formData.get('examName') as string,
            date: formData.get('date') as string,
            tytNet,
            aytNet,
            totalNet: tytNet + aytNet,
        };
        updateStudent({ ...student, examResults: [...student.examResults, newExam].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
        e.currentTarget.reset();
    };

    const handleEditClick = (exam: ExamResult) => {
        setEditingExamId(exam.id);
        setExamFormState({
            examName: exam.examName,
            date: exam.date,
            tytNet: exam.tytNet,
            aytNet: exam.aytNet,
        });
    };
    
    const handleCancelClick = () => {
        setEditingExamId(null);
    };

    const handleSaveClick = (examId: string) => {
        const updatedExam: ExamResult = {
            id: examId,
            ...examFormState,
            totalNet: Number(examFormState.tytNet) + Number(examFormState.aytNet),
        };
        const updatedExams = student.examResults.map(e => e.id === examId ? updatedExam : e);
        updateStudent({ ...student, examResults: updatedExams });
        setEditingExamId(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setExamFormState(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleDeleteClick = (examId: string) => {
        setExamToDeleteId(examId);
    };

    const confirmDeleteExam = () => {
        if (!examToDeleteId) return;
        const updatedExams = student.examResults.filter(e => e.id !== examToDeleteId);
        updateStudent({ ...student, examResults: updatedExams });
        setExamToDeleteId(null);
    };


    const addNewBook = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newBook: Book = {
            id: `book-${Date.now()}`,
            name: formData.get('name') as string,
            subject: formData.get('subject') as string,
            status: formData.get('status') as 'Başlanmadı' | 'Devam Ediyor' | 'Bitti',
        };
        updateStudent({ ...student, books: [...student.books, newBook] });
        e.currentTarget.reset();
    };
    
    const handleBookStatusChange = (bookId: string, newStatus: Book['status']) => {
        const updatedBooks = student.books.map(book =>
            book.id === bookId ? { ...book, status: newStatus } : book
        );
        updateStudent({ ...student, books: updatedBooks });
    };

    const addNewLog = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const date = formData.get('date') as string;
        
        const questions = [
            { subject: 'Türkçe', count: parseInt(formData.get('turkce') as string) || 0 },
            { subject: 'Matematik', count: parseInt(formData.get('matematik') as string) || 0 },
            { subject: 'Fen Bilimleri', count: parseInt(formData.get('fen') as string) || 0 },
            { subject: 'Sosyal Bilimler', count: parseInt(formData.get('sosyal') as string) || 0 },
        ].filter(q => q.count > 0);

        if (questions.length === 0) return;

        const totalQuestions = questions.reduce((sum, q) => sum + q.count, 0);

        const newLog: DailyLog = { id: `log-${Date.now()}`, date, questions, totalQuestions };
        updateStudent({ ...student, dailyLogs: [...student.dailyLogs, newLog] });
        e.currentTarget.reset();
    };
    
    const examChartData = useMemo(() => {
        return student.examResults
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(exam => ({
                name: new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
                'TYT Net': exam.tytNet,
                'AYT Net': exam.aytNet,
            }));
    }, [student.examResults]);

    const totalQuestions = useMemo(() => student.dailyLogs.reduce((sum, log) => sum + log.totalQuestions, 0), [student.dailyLogs]);
    
    const avgQuestionsPerDay = useMemo(() => {
        if (student.dailyLogs.length === 0) return 0;
        return Math.round(totalQuestions / student.dailyLogs.length);
    }, [student.dailyLogs, totalQuestions]);

    const activeBookCount = useMemo(() => {
        return student.books.filter(book => book.status !== 'Bitti').length;
    }, [student.books]);

    const avgTytNet = useMemo(() => {
        if (student.examResults.length === 0) return 'N/A';
        const totalTytNet = student.examResults.reduce((sum, exam) => sum + exam.tytNet, 0);
        return (totalTytNet / student.examResults.length).toFixed(2);
    }, [student.examResults]);

    const avgAytNet = useMemo(() => {
        if (student.examResults.length === 0) return 'N/A';
        const totalAytNet = student.examResults.reduce((sum, exam) => sum + exam.aytNet, 0);
        return (totalAytNet / student.examResults.length).toFixed(2);
    }, [student.examResults]);

    return (
        <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col">
            <header className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800">{student.name}</h2>
                <p className="text-slate-500">Öğrenci Gelişim Paneli</p>
            </header>
            <div className="border-b border-slate-200 mb-6">
                <nav className="flex space-x-2 -mb-px">
                    <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Özet</TabButton>
                    <TabButton active={activeTab === 'exams'} onClick={() => setActiveTab('exams')}>Deneme Sınavları</TabButton>
                    <TabButton active={activeTab === 'books'} onClick={() => setActiveTab('books')}>Kitap Takibi</TabButton>
                    <TabButton active={activeTab === 'questions'} onClick={() => setActiveTab('questions')}>Soru Takibi</TabButton>
                </nav>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                {activeTab === 'summary' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-slate-600">Ortalama Günlük Soru</h3>
                            <p className="text-3xl font-bold text-indigo-600">{avgQuestionsPerDay.toLocaleString('tr-TR')}</p>
                        </div>
                         <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-slate-600">Ortalama TYT Neti</h3>
                            <p className="text-3xl font-bold text-sky-600">{avgTytNet}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-slate-600">Ortalama AYT Neti</h3>
                            <p className="text-3xl font-bold text-teal-600">{avgAytNet}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                             <h3 className="font-semibold text-slate-600">Takip Edilen Kitap</h3>
                            <p className="text-3xl font-bold text-amber-600">{activeBookCount}</p>
                        </div>
                        
                        <div className="md:col-span-2 lg:col-span-2 h-80 bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-slate-600 mb-4">TYT Net Gelişimi</h3>
                            {student.examResults.length > 1 ? (
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={examChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="TYT Net" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    Grafiği görmek için en az 2 deneme sonucu ekleyin.
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 lg:col-span-2 h-80 bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-slate-600 mb-4">AYT Net Gelişimi</h3>
                            {student.examResults.length > 1 ? (
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={examChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="AYT Net" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    Grafiği görmek için en az 2 deneme sonucu ekleyin.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'exams' && (
                     <div>
                        <FormCard title="Yeni Deneme Sonucu Ekle">
                            <form onSubmit={addNewExam} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <input name="examName" placeholder="Deneme Adı" required className="input col-span-2" />
                                <input name="date" type="date" required className="input" />
                                <input name="tytNet" type="number" step="0.25" placeholder="TYT Net" required className="input" />
                                <input name="aytNet" type="number" step="0.25" placeholder="AYT Net" required className="input" />
                                <button type="submit" className="button-primary md:col-start-5">Ekle</button>
                            </form>
                        </FormCard>
                        <DataTable headers={['Deneme Adı', 'Tarih', 'TYT Net', 'AYT Net', 'Toplam Net', 'İşlemler']}>
                           {student.examResults.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exam => (
                                <tr key={exam.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    {editingExamId === exam.id ? (
                                        <>
                                            <td className="table-cell"><input name="examName" value={examFormState.examName} onChange={handleFormChange} className="input w-full" /></td>
                                            <td className="table-cell"><input name="date" type="date" value={examFormState.date} onChange={handleFormChange} className="input w-full" /></td>
                                            <td className="table-cell"><input name="tytNet" type="number" step="0.25" value={examFormState.tytNet} onChange={handleFormChange} className="input w-24" /></td>
                                            <td className="table-cell"><input name="aytNet" type="number" step="0.25" value={examFormState.aytNet} onChange={handleFormChange} className="input w-24" /></td>
                                            <td className="table-cell font-bold">{(Number(examFormState.tytNet) + Number(examFormState.aytNet)).toFixed(2)}</td>
                                            <td className="table-cell">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => handleSaveClick(exam.id)} className="text-green-600 hover:text-green-800 font-semibold text-sm">Kaydet</button>
                                                    <button onClick={handleCancelClick} className="text-slate-500 hover:text-slate-700 text-sm">İptal</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="table-cell">{exam.examName}</td>
                                            <td className="table-cell">{new Date(exam.date).toLocaleDateString('tr-TR')}</td>
                                            <td className="table-cell">{exam.tytNet.toFixed(2)}</td>
                                            <td className="table-cell">{exam.aytNet.toFixed(2)}</td>
                                            <td className="table-cell font-bold">{exam.totalNet.toFixed(2)}</td>
                                            <td className="table-cell">
                                                <div className="flex items-center space-x-4">
                                                    <button onClick={() => handleEditClick(exam)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Düzenle</button>
                                                    <button onClick={() => handleDeleteClick(exam.id)} className="text-red-600 hover:text-red-800 font-semibold text-sm">Sil</button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </DataTable>
                    </div>
                )}
                {activeTab === 'books' && (
                     <div>
                        <FormCard title="Yeni Kitap Ekle">
                            <form onSubmit={addNewBook} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input name="name" placeholder="Kitap Adı" required className="input col-span-2" />
                                <input name="subject" placeholder="Ders" required className="input" />
                                <select name="status" defaultValue="Başlanmadı" className="input">
                                    <option>Başlanmadı</option>
                                    <option>Devam Ediyor</option>
                                    <option>Bitti</option>
                                </select>
                                <button type="submit" className="button-primary md:col-start-4">Ekle</button>
                            </form>
                        </FormCard>
                        <DataTable headers={['Kitap Adı', 'Ders', 'Durum']}>
                            {student.books.map(book => (
                                <tr key={book.id} className="border-b border-slate-200">
                                    <td className="table-cell">{book.name}</td>
                                    <td className="table-cell">{book.subject}</td>
                                    <td className="table-cell">
                                        <select
                                            value={book.status}
                                            onChange={(e) => handleBookStatusChange(book.id, e.target.value as Book['status'])}
                                            className={`status-badge border-0 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-none ${
                                                book.status === 'Bitti' ? 'bg-green-100 text-green-800' : 
                                                book.status === 'Devam Ediyor' ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            <option value="Başlanmadı">Başlanmadı</option>
                                            <option value="Devam Ediyor">Devam Ediyor</option>
                                            <option value="Bitti">Bitti</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </DataTable>
                    </div>
                )}
                {activeTab === 'questions' && (
                    <div>
                        <FormCard title="Günlük Soru Sayısı Ekle">
                            <form onSubmit={addNewLog} className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <input name="date" type="date" required className="input col-span-2" />
                                <input name="turkce" type="number" placeholder="Türkçe" className="input" />
                                <input name="matematik" type="number" placeholder="Matematik" className="input" />
                                <input name="fen" type="number" placeholder="Fen" className="input" />
                                <input name="sosyal" type="number" placeholder="Sosyal" className="input" />
                                <button type="submit" className="button-primary col-span-2 md:col-span-full">Ekle</button>
                            </form>
                        </FormCard>
                        <DataTable headers={['Tarih', 'Dersler', 'Toplam Soru']}>
                             {student.dailyLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                                <tr key={log.id} className="border-b border-slate-200">
                                    <td className="table-cell">{new Date(log.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="table-cell">{log.questions.map(q => `${q.subject}: ${q.count}`).join(', ')}</td>
                                    <td className="table-cell font-bold">{log.totalQuestions}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={!!examToDeleteId}
                onClose={() => setExamToDeleteId(null)}
                onConfirm={confirmDeleteExam}
                title="Deneme Sonucunu Sil"
                message={`Bu deneme sonucunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
            />
        </div>
    );
};

const FormCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-50 rounded-lg p-5 mb-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

const DataTable: React.FC<{ headers: string[], children: React.ReactNode }> = ({ headers, children }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                    {headers.map(header => <th key={header} scope="col" className="px-6 py-3">{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    </div>
);

// Add global styles for reuse
const globalStyles = `
    .input {
        background-color: white;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
        color: #334155;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    .button-primary {
        background-color: #4f46e5;
        color: white;
        font-weight: 600;
        padding: 0.625rem 1rem;
        border-radius: 0.5rem;
        transition: background-color 0.2s;
    }
    .button-primary:hover {
        background-color: #4338ca;
    }
    .table-cell {
        padding: 0.75rem 1.5rem;
        white-space: nowrap;
        vertical-align: middle;
    }
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
    }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = globalStyles;
document.head.appendChild(styleSheet);