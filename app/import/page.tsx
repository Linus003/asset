'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { addAsset, addImportHistory, deleteImportedFile, getAssets, getImportHistory, initializeStore, subscribeToStoreChanges } from '@/lib/store';
import { importAssets, KEMU_TEMPLATE_HEADERS, parseCSVData } from '@/lib/import-engine';
import { Asset } from '@/lib/types';
import { AlertCircle, Check, Edit2, FileSpreadsheet, Trash2, Upload } from 'lucide-react';

type ImportStep = 'upload' | 'preview' | 'confirm' | 'complete';

type ImportResult = ReturnType<typeof importAssets>;

function signatureFor(name: string, text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  return `${name}:${text.length}:${hash}`;
}

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSignature, setFileSignature] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [histories, setHistories] = useState(getImportHistory());

  useEffect(() => {
    initializeStore();
    setHistories(getImportHistory());
    return subscribeToStoreChanges(() => setHistories(getImportHistory()));
  }, []);

  const duplicateFile = useMemo(
    () => histories.find((history) => history.fileSignature === fileSignature),
    [fileSignature, histories],
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setFileName(file.name);
      setFileSignature(signatureFor(file.name, text));
      setImportResult(null);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const result = importAssets(csvText, getAssets());
    setImportResult(result);
    setStep('confirm');
  };

  const updatePreviewAsset = (id: string, updates: Partial<Asset>) => {
    setImportResult((current) => current ? {
      ...current,
      assets: current.assets.map((asset) => asset.id === id ? { ...asset, ...updates } : asset),
    } : current);
  };

  const handleConfirmImport = () => {
    if (!importResult?.assets.length || duplicateFile) return;
    const sourceFileId = fileSignature;

    importResult.assets.forEach((asset) => {
      addAsset({
        assetTag: asset.assetTag,
        serialNo: asset.serialNo,
        model: asset.model,
        assignedTo: asset.assignedTo,
        logNumber: asset.logNumber,
        sourceFileId,
        sourceFileName: fileName,
        name: asset.name,
        category: asset.category,
        description: asset.description,
        location: asset.location,
        status: asset.status,
        purchaseDate: asset.purchaseDate,
        purchasePrice: asset.purchasePrice,
        supplier: asset.supplier,
        warranty: asset.warranty,
      });
    });

    addImportHistory({
      fileName,
      fileSignature,
      timestamp: new Date().toISOString(),
      rowsImported: importResult.assets.length,
      rowsSkipped: importResult.errors.length,
      errors: importResult.errors,
      importedBy: 'current-user',
    });
    setStep('complete');
  };

  const rows = parseCSVData(csvText);
  const previewRows = rows.slice(1, 6);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        <Header title="Import Assets & Equipment" description="Upload KeMU inventory logs using the approved spreadsheet layout" />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {['Upload file', 'Preview layout', 'Validate & edit', 'Complete'].map((label, index) => (
              <div key={label} className={`rounded-lg border p-4 ${index <= ['upload','preview','confirm','complete'].indexOf(step) ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                <p className="text-sm font-semibold text-foreground">{index + 1}. {label}</p>
              </div>
            ))}
          </div>

          {step === 'upload' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-card border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">Upload the KeMU asset log</p>
                  <p className="text-muted-foreground mb-4">CSV, tab-delimited Excel exports, or pasted spreadsheet text</p>
                  <input id="file-upload" type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-primary" />Required layout</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {KEMU_TEMPLATE_HEADERS.map((header) => <span key={header} className="rounded bg-secondary px-3 py-2 text-foreground">{header}</span>)}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="font-medium text-foreground">File: <span className="text-primary">{fileName}</span></p>
                <p className="text-muted-foreground text-sm">Found {Math.max(rows.length - 1, 0)} data rows using the uploaded spreadsheet layout.</p>
                {duplicateFile && <p className="mt-2 text-red-600 text-sm font-medium">Duplicate file detected: this file was already uploaded on {new Date(duplicateFile.timestamp).toLocaleString()}.</p>}
              </div>
              <div className="bg-card border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-primary text-primary-foreground">{(rows[0] || KEMU_TEMPLATE_HEADERS).map((h, i) => <th key={i} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
                  <tbody>{previewRows.map((row, i) => <tr key={i} className="border-b border-border">{row.map((cell, c) => <td key={c} className="px-4 py-3 text-foreground">{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <button onClick={handleImport} disabled={!!duplicateFile} className="px-6 py-2 bg-primary disabled:opacity-50 text-primary-foreground rounded-lg font-medium">Validate records</button>
            </div>
          )}

          {step === 'confirm' && importResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="Assets ready" value={importResult.assets.length} />
                <Stat label="Duplicates skipped" value={importResult.duplicates} />
                <Stat label="Issues" value={importResult.errors.length} />
              </div>
              <div className="bg-card border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-secondary"><th className="px-3 py-3">Log #</th><th>Name</th><th>Tag</th><th>Serial</th><th>Model</th><th>Category</th><th>Status</th><th>Check Out To</th><th>Location</th><th>Action</th></tr></thead>
                  <tbody>{importResult.assets.map((asset) => {
                    const editing = editingAssetId === asset.id;
                    return <tr key={asset.id} className="border-b border-border">{(['logNumber','name','assetTag','serialNo','model','category','status','assignedTo','location'] as const).map((field) => <td key={field} className="px-3 py-2">{editing ? <input className="w-32 bg-secondary border border-border rounded px-2 py-1" value={(asset[field] as string) || ''} onChange={(e) => updatePreviewAsset(asset.id, { [field]: e.target.value } as Partial<Asset>)} /> : <span>{(asset[field] as string) || '—'}</span>}</td>)}<td><button className="text-primary" onClick={() => setEditingAssetId(editing ? null : asset.id)}><Edit2 className="w-4 h-4" /></button></td></tr>;
                  })}</tbody>
                </table>
              </div>
              {importResult.errors.length > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{importResult.errors.slice(0, 8).map((e, i) => <p key={i}><AlertCircle className="inline w-4 h-4 mr-1" />Row {e.row}: {e.reason}</p>)}</div>}
              <button onClick={handleConfirmImport} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"><Check className="inline w-4 h-4 mr-2" />Import into inventory</button>
            </div>
          )}

          {step === 'complete' && <div className="bg-card border border-border rounded-lg p-8 text-center"><Check className="w-14 h-14 mx-auto text-primary mb-4" /><h3 className="text-2xl font-bold">Import complete</h3><p className="text-muted-foreground">Dashboard widgets and asset logs have updated in real time.</p></div>}

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Uploaded files</h3>
            <div className="space-y-2">{histories.map((history) => <div key={history.id} className="flex items-center justify-between rounded-lg bg-secondary p-3"><div><p className="font-medium text-foreground">{history.fileName}</p><p className="text-xs text-muted-foreground">{history.rowsImported} imported • {history.rowsSkipped} skipped</p></div><button onClick={() => confirm('Delete this uploaded file and all its assets?') && deleteImportedFile(history.fileSignature || history.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-5 h-5" /></button></div>)}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="bg-card border border-border rounded-lg p-5"><p className="text-muted-foreground text-sm">{label}</p><p className="text-3xl font-bold text-primary">{value}</p></div>;
}
