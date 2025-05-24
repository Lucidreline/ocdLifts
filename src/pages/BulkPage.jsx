// src/pages/BulkPage.jsx
import React, { useRef, useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const BulkPage = () => {
  const fileInputRefs = {
    exercises: useRef(),
    sessions: useRef(),
    sets: useRef(),
  };
  const [status, setStatus] = useState({ exercises: '', sessions: '', sets: '' });

  const handleFileUpload = (type) => async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setStatus((prev) => ({ ...prev, [type]: 'No file selected.' }));
      return;
    }

    try {
      const text = await file.text();
      const [headerLine, ...lines] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(',');
      const rawObjects = lines.map((line) => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] !== undefined && values[i] !== '' ? values[i] : null;
        });
        return obj;
      });

      const nowIso = new Date().toISOString();
      const colRef = collection(db, type);
      for (const obj of rawObjects) {
        const payload = { ...obj, createdAt: obj.createdAt || nowIso };
        if (type === 'exercises') {
          payload.pr = obj.pr
            ? JSON.parse(obj.pr)
            : { reps: null, resistanceWeight: null, resistanceHeight: null, lastUpdated: nowIso };
        }
        if (type === 'sessions') {
          payload.session_notes = obj.session_notes || '';
          payload.set_ids = obj.set_ids ? JSON.parse(obj.set_ids) : [];
        }
        if (type === 'sets') {
          payload.timestamp = obj.timestamp || nowIso;
        }
        await addDoc(colRef, payload);
      }

      setStatus((prev) => ({ ...prev, [type]: `Imported ${rawObjects.length} ${type}.` }));
    } catch (err) {
      console.error(err);
      setStatus((prev) => ({ ...prev, [type]: `Error importing ${type}: ${err.message}` }));
    } finally {
      e.target.value = null;
    }
  };

  const handleExport = (type) => async () => {
    try {
      const snap = await getDocs(collection(db, type));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        setStatus((prev) => ({ ...prev, [type]: `No ${type} to export.` }));
        return;
      }
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\r\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus((prev) => ({ ...prev, [type]: `Exported ${data.length} ${type}.` }));
    } catch (err) {
      console.error(err);
      setStatus((prev) => ({ ...prev, [type]: `Error exporting ${type}: ${err.message}` }));
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl">Bulk Upload & Export</h1>
      {['exercises', 'sessions', 'sets'].map((type) => (
        <div key={type} className="flex items-center space-x-2">
          {/* hidden file input */}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRefs[type]}
            onChange={handleFileUpload(type)}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRefs[type].current.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Bulk Upload {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>

          <button
            onClick={handleExport(type)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>

          {status[type] && (
            <span className="ml-4 text-sm text-gray-700">{status[type]}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default BulkPage;
