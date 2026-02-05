import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    setDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient, XrayRequest } from '../types';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

export const useDentalData = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [requests, setRequests] = useState<XrayRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Toast管理
    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, message }]);
        // 3秒後に自動削除
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Subscribe to Patients
    useEffect(() => {
        const q = query(collection(db, 'patients'), orderBy('name'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const ps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
                setPatients(ps);
            },
            (error) => {
                console.error('患者データの取得に失敗:', error);
                addToast('error', '患者データの取得に失敗しました');
            }
        );
        return () => unsubscribe();
    }, [addToast]);

    // Subscribe to Requests
    useEffect(() => {
        const q = query(collection(db, 'requests'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const rs = snapshot.docs.map(d => {
                    const data = d.data();
                    return {
                        ...data,
                        id: d.id,
                        timestamp: data.timestamp?.toDate() || new Date(),
                    } as XrayRequest;
                });
                setRequests(rs);
                setLoading(false);
            },
            (error) => {
                console.error('依頼データの取得に失敗:', error);
                addToast('error', '依頼データの取得に失敗しました');
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [addToast]);

    const savePatient = async (patient: Patient) => {
        try {
            await setDoc(doc(db, 'patients', patient.id), patient, { merge: true });
        } catch (error) {
            console.error('患者の保存に失敗:', error);
            addToast('error', '患者の保存に失敗しました');
            throw error;
        }
    };

    const deletePatient = async (patientId: string) => {
        try {
            await deleteDoc(doc(db, 'patients', patientId));
            addToast('success', '患者を削除しました');
        } catch (error) {
            console.error('患者の削除に失敗:', error);
            addToast('error', '患者の削除に失敗しました');
            throw error;
        }
    };

    const addRequest = async (request: XrayRequest) => {
        try {
            await setDoc(doc(db, 'requests', request.id), {
                ...request,
                timestamp: Timestamp.fromDate(request.timestamp)
            });
            addToast('success', '撮影依頼を送信しました');
        } catch (error) {
            console.error('依頼の保存に失敗:', error);
            addToast('error', '依頼の保存に失敗しました');
            throw error;
        }
    };

    const updateRequest = async (request: XrayRequest) => {
        try {
            await setDoc(doc(db, 'requests', request.id), {
                ...request,
                timestamp: Timestamp.fromDate(request.timestamp)
            }, { merge: true });
            addToast('success', '撮影記録を保存しました');
        } catch (error) {
            console.error('依頼の更新に失敗:', error);
            addToast('error', '依頼の更新に失敗しました');
            throw error;
        }
    };

    return {
        patients,
        requests,
        loading,
        toasts,
        removeToast,
        savePatient,
        deletePatient,
        addRequest,
        updateRequest
    };
};
