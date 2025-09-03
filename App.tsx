
import React, { useState, useEffect } from 'react';
import type { Student, ExamResult, Book, DailyLog } from './types';
import { AddStudentModal } from './components/AddStudentModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { StudentDetailView } from './components/StudentDetailView';
import { LogoIcon, UserPlusIcon, UsersIcon } from './components/icons';

const App: React.FC = () => {
    const [students, setStudents] = useState<Student[]>(() => {
        const savedStudents = localStorage.getItem('yks-students');
        return savedStudents ? JSON.parse(savedStudents) : [];
    });
    
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    useEffect(() => {
        localStorage.setItem('yks-students', JSON.stringify(students));
    }, [students]);

    useEffect(() => {
        if(students.length > 0 && selectedStudentId === null) {
            setSelectedStudentId(students[0].id);
        }
        if(students.length === 0) {
            setSelectedStudentId(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students]);

    const addStudent = (name: string) => {
        const newStudent: Student = {
            id: `student-${Date.now()}`,
            name,
            examResults: [],
            books: [],
            dailyLogs: []
        };
        setStudents(prev => [...prev, newStudent]);
        setSelectedStudentId(newStudent.id);
    };

    const handleDeleteRequest = (student: Student) => {
        setStudentToDelete(student);
    };

    const confirmDeleteStudent = () => {
        if (!studentToDelete) return;

        setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));

        if (selectedStudentId === studentToDelete.id) {
            setSelectedStudentId(students.length > 1 ? students.find(s => s.id !== studentToDelete.id)!.id : null);
        }
        setStudentToDelete(null);
    };

    const updateStudent = (updatedStudent: Student) => {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    };

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <LogoIcon className="h-8 w-8 text-indigo-600" />
                    <h1 className="ml-3 text-xl font-bold text-slate-800">YKS Koçluk</h1>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Öğrenciler</h2>
                        <ul>
                            {students.map(student => (
                                <li key={student.id}>
                                    <button
                                        onClick={() => setSelectedStudentId(student.id)}
                                        className={`w-full text-left px-4 py-2.5 rounded-md text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150 flex items-center justify-between group ${selectedStudentId === student.id ? 'bg-indigo-100 text-indigo-800 font-semibold' : ''}`}
                                    >
                                        <span>{student.name}</span>
                                        <span 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(student); }}
                                            className="text-slate-400 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                        >
                                           Kaldır
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Yeni Öğrenci Ekle
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                {selectedStudent ? (
                    <StudentDetailView
                        key={selectedStudent.id}
                        student={selectedStudent}
                        updateStudent={updateStudent}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                        <UsersIcon className="h-24 w-24 mb-4 text-slate-300" />
                        <h2 className="text-2xl font-bold text-slate-700">Koçluk Paneline Hoş Geldiniz</h2>
                        <p className="mt-2 max-w-md">Başlamak için sol menüden yeni bir öğrenci ekleyin. Öğrencilerinizin gelişimini buradan takip edebilirsiniz.</p>
                    </div>
                )}
            </main>

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={addStudent}
            />

            <ConfirmationModal
                isOpen={!!studentToDelete}
                onClose={() => setStudentToDelete(null)}
                onConfirm={confirmDeleteStudent}
                title="Öğrenciyi Sil"
                message={`'${studentToDelete?.name}' adlı öğrenciyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
            />
        </div>
    );
};

export default App;
