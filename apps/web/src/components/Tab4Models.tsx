import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle, Upload, Play, RefreshCw, ShieldCheck, AlertCircle, HardDrive, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ModelCheckpoint {
  id: string;
  name: string;
  file_path: string;
  sha256: string;
  dataset_sha256: string;
  cv_auc?: number;
  test_balanced_acc?: number;
  test_auc?: number;
  latency_ms?: number;
  status: 'active' | 'candidate' | 'archived';
  created_at: string;
}

const DEFAULT_CHECKPOINTS: ModelCheckpoint[] = [
  {
    id: 'p300_lda_baseline',
    name: 'Shrinkage LDA Baseline (6x6 Matrix)',
    file_path: 'models/checkpoints/p300_lda_baseline.pkl',
    sha256: 'f20b7ce237ac415e8a25c2a510d738dbfcc3f6c2cf6687eddbe4f8fb2761052e',
    dataset_sha256: 'beddf78f1834ddef1361b782970725a388f615fbf05f4e15647c0b050d249f3e',
    cv_auc: 0.9612,
    test_balanced_acc: 0.8000,
    test_auc: 0.8900,
    latency_ms: 0.119,
    status: 'active',
    created_at: '2026-11-09T00:26:00Z',
  },
  {
    id: 'candidate_lda_0.1_20hz',
    name: 'Candidate LDA (Causal Bandpass 0.1–20 Hz)',
    file_path: 'models/checkpoints/candidate_lda_0.1_20hz.pkl',
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    dataset_sha256: 'beddf78f1834ddef1361b782970725a388f615fbf05f4e15647c0b050d249f3e',
    cv_auc: 0.9540,
    test_balanced_acc: 0.7850,
    test_auc: 0.8820,
    latency_ms: 0.125,
    status: 'candidate',
    created_at: '2026-11-09T00:30:00Z',
  },
];

interface Tab4ModelsProps {
  authToken?: string;
  userRole?: string;
}

export const Tab4Models: React.FC<Tab4ModelsProps> = ({
  authToken,
  userRole = 'researcher',
}) => {
  const toast = useToast();
  const [checkpoints, setCheckpoints] = useState<ModelCheckpoint[]>(DEFAULT_CHECKPOINTS);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadHash, setUploadHash] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isCaregiver = userRole === 'caregiver';
  const apiBase = '/api/v1/models';

  // Fetch checkpoints
  const fetchCheckpoints = async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBase}/`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCheckpoints(data);
        }
      }
    } catch {
      // Use initial state
    }
  };

  useEffect(() => {
    fetchCheckpoints();
  }, [authToken]);

  // Activate checkpoint
  const handleActivate = async (ckptId: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBase}/${ckptId}/activate`, { method: 'POST', headers });
      if (res.ok) {
        setCheckpoints((prev) =>
          prev.map((c) => ({
            ...c,
            status: c.id === ckptId ? 'active' : c.status === 'active' ? 'candidate' : c.status,
          }))
        );
        toast.success(`Đã kích hoạt mô hình checkpoint ${ckptId}.`);
      }
    } catch (err) {
      console.error('Failed to activate checkpoint:', err);
      toast.error('Không thể kích hoạt mô hình.');
    }
  };

  // Trigger Retraining Job
  const handleRetrain = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBase}/retrain`, { method: 'POST', headers });
      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.job_id);
        setJobProgress(5);
        setJobStatus('RUNNING');
        toast.info('Đã khởi động tiến trình huấn luyện mô hình nền.');
      }
    } catch (err) {
      console.error('Failed to trigger retrain:', err);
      toast.error('Không thể bắt đầu huấn luyện.');
    }
  };

  // Poll active background job
  useEffect(() => {
    if (!activeJobId || jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const headers: Record<string, string> = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const res = await fetch(`/api/v1/jobs/${activeJobId}`, { headers });
        if (res.ok) {
          const jobData = await res.json();
          setJobProgress(jobData.progress);
          setJobStatus(jobData.status);
          if (jobData.status === 'COMPLETED') {
            clearInterval(interval);
            fetchCheckpoints();
            toast.success('Tiến trình huấn luyện mô hình hoàn tất.');
          } else if (jobData.status === 'FAILED') {
            clearInterval(interval);
            toast.error('Tiến trình huấn luyện thất bại.');
          }
        }
      } catch {
        // Continue polling
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeJobId, jobStatus, authToken]);

  // Handle Secure Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatus(null);
    setUploadError(null);

    if (!uploadFile) {
      setUploadError('Vui lòng chọn tệp mô hình (.pkl hoặc .safetensors).');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('model_name', uploadName || uploadFile.name);
    if (uploadHash) {
      formData.append('expected_sha256', uploadHash.trim());
    }

    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadStatus(`Tải lên thành công: ${data.name}`);
        toast.success(`Đã tải lên mô hình ${data.name}.`);
        setUploadFile(null);
        setUploadName('');
        setUploadHash('');
        fetchCheckpoints();
      } else {
        const err = await res.json();
        setUploadError(err.detail || 'Tải lên mô hình thất bại.');
        toast.error(err.detail || 'Lỗi kiểm tra toàn vẹn mã băm.');
      }
    } catch {
      setUploadError('Lỗi kết nối máy chủ khi tải lên.');
      toast.error('Lỗi mạng khi tải lên tệp.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Checkpoints Inventory Table */}
      <div className="bg-white rounded-2xl border border-clinical-border p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-clinical-border pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-clinical-text text-sm uppercase tracking-wider">
              Danh Mục Checkpoints & Chỉ Số Đánh Giá Độc Lập
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleRetrain}
              disabled={isCaregiver || (activeJobId !== null && jobStatus === 'RUNNING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 ${
                isCaregiver
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-clinical-border'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RETRAIN MODEL</span>
            </button>
          </div>
        </div>

        {/* Retrain Progress Bar */}
        {activeJobId && (
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2 text-xs">
            <div className="flex justify-between font-mono text-indigo-900 font-semibold">
              <span>Tiến trình huấn luyện (Mã: {activeJobId}):</span>
              <span>{jobProgress}% [{jobStatus}]</span>
            </div>
            <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${jobProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-clinical-border text-clinical-secondary font-mono">
                <th className="py-3 px-3">Tên Checkpoint</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3">CV AUC</th>
                <th className="py-3 px-3">Held-out AUC</th>
                <th className="py-3 px-3">Balanced Acc</th>
                <th className="py-3 px-3">Độ Trễ</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinical-border font-mono">
              {checkpoints.map((ckpt) => {
                const isActive = ckpt.status === 'active';
                return (
                  <tr key={ckpt.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-clinical-text font-sans block text-sm">{ckpt.name}</span>
                      <span className="text-[10px] text-clinical-secondary">{ckpt.file_path}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-clinical-secondary border border-gray-200'
                        }`}
                      >
                        {ckpt.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-clinical-text font-bold">
                      {ckpt.cv_auc !== undefined ? ckpt.cv_auc.toFixed(4) : '—'}
                    </td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">
                      {ckpt.test_auc !== undefined ? ckpt.test_auc.toFixed(4) : '—'}
                    </td>
                    <td className="py-3 px-3 text-clinical-blue font-bold">
                      {ckpt.test_balanced_acc !== undefined ? `${(ckpt.test_balanced_acc * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-clinical-secondary">
                      {ckpt.latency_ms !== undefined ? `${ckpt.latency_ms.toFixed(3)}ms` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleActivate(ckpt.id)}
                          disabled={isCaregiver}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            isCaregiver
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-clinical-blue hover:bg-clinical-blueHover text-white'
                          }`}
                        >
                          Kích Hoạt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Upload Form */}
      <div className="bg-white rounded-2xl border border-clinical-border p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-clinical-border pb-3">
          <Upload className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-clinical-text text-sm uppercase tracking-wider">
            Tải Lên Checkpoint Mới An Toàn (Kèm Mã Băm SHA-256)
          </h3>
        </div>

        {uploadStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
            {uploadStatus}
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-semibold">
            {uploadError}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-clinical-text block">Tên Checkpoint / Nhãn Mô Hình</label>
              <input
                type="text"
                placeholder="Ví dụ: LDA_Causal_v2_Bandpass"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                disabled={isCaregiver}
                className="w-full px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text text-xs focus:outline-none focus:border-clinical-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-clinical-text block">Mã Băm Kỳ Vọng (SHA-256 Hash)</label>
              <input
                type="text"
                placeholder="64 ký tự hex"
                value={uploadHash}
                onChange={(e) => setUploadHash(e.target.value)}
                disabled={isCaregiver}
                className="w-full px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text font-mono text-xs focus:outline-none focus:border-clinical-blue"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-clinical-text block">Tệp Mô Hình (.pkl hoặc .safetensors)</label>
            <input
              type="file"
              accept=".pkl,.safetensors"
              onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
              disabled={isCaregiver}
              className="w-full text-xs text-clinical-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-clinical-border file:text-xs file:font-semibold file:bg-gray-50 file:text-clinical-text hover:file:bg-gray-100"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isCaregiver || !uploadFile}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isCaregiver || !uploadFile
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-clinical-border'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
