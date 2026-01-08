import { useState, useEffect } from 'react';
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

export const useDentalData = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [requests, setRequests] = useState<XrayRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Subscribe to Patients
    useEffect(() => {
        const q = query(collection(db, 'patients'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
            setPatients(ps);
        });
        return () => unsubscribe();
    }, []);

    // Subscribe to Requests
    useEffect(() => {
        const q = query(collection(db, 'requests'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
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
        });
        return () => unsubscribe();
    }, []);

    const savePatient = async (patient: Patient) => {
        await setDoc(doc(db, 'patients', patient.id), patient, { merge: true });
    };

    const deletePatient = async (patientId: string) => {
        await deleteDoc(doc(db, 'patients', patientId));
    };

    const addRequest = async (request: XrayRequest) => {
        await setDoc(doc(db, 'requests', request.id), {
            ...request,
            timestamp: Timestamp.fromDate(request.timestamp)
        });
    };

    const updateRequest = async (request: XrayRequest) => {
        await setDoc(doc(db, 'requests', request.id), {
            ...request,
            timestamp: Timestamp.fromDate(request.timestamp)
        }, { merge: true });
    };

    return {
        patients,
        requests,
        loading,
        savePatient,
        deletePatient,
        addRequest,
        updateRequest
    };
};
