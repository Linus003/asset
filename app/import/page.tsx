'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { initializeStore, getAssets, addAsset, addImportHistory } from '@/lib/store';
import { importAssets, autoDetectColumns, parseCSVData } from '@/lib/import-engine';
import { Upload, Check, AlertCircle, ChevronRight } from 'lucide-react';

type ImportStep = 'upload' | 'preview' | 'confirm' | 'complete';

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    initializeStore();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setFileName(file.name);
      
      // Auto-detect columns
      const rows = parseCSVData(text);
      if (rows.length > 0) {
        const headers = rows[0];
        autoDetectColumns(headers);
      }

      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const existingAssets = getAssets();
    const result = importAssets(csvText, existingAssets);
    setImportResult(result);
    setStep('confirm');
  };

  const handleConfirmImport = () => {
    if (importResult?.assets) {
      importResult.assets.forEach((asset: any) => {
        addAsset({
          assetTag: asset.assetTag,
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
        timestamp: new Date().toISOString(),
        rowsImported: importResult.assets.length,
        rowsSkipped: importResult.errors.length,
        errors: importResult.errors,
        importedBy: 'current-user',
      });

      setStep('complete');
    }
  };

  const rows = parseCSVData(csvText);
  const previewRows = rows.slice(1, 6);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto flex flex-col">
        <Header
          title="Import Assets"
          description="Bulk import assets from CSV or Excel files"
        />

        <div className="flex-1 p-6">
          {/* Step Indicator */}
          <div className="mb-8 flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step !== 'upload' ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'
            }`}>
              <Check className="w-5 h-5" />
            </div>
            <ChevronRight className={`w-5 h-5 ${step === 'upload' ? 'text-muted-foreground' : 'text-primary'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step === 'preview' || step === 'confirm' || step === 'complete'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}>
              2
            </div>
            <ChevronRight className={`w-5 h-5 ${
              step === 'confirm' || step === 'complete' ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step === 'confirm' || step === 'complete'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}>
              3
            </div>
            <ChevronRight className={`w-5 h-5 ${
              step === 'complete' ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step === 'complete'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}>
              <Check className="w-5 h-5" />
            </div>
          </div>

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">Drop your CSV or Excel file here</p>
                  <p className="text-muted-foreground mb-4">or click to browse</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-secondary rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Supported Format
                </h4>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• CSV files with headers in first row</li>
                  <li>• Excel files (.xlsx, .xls)</li>
                  <li>• Common column names: Asset Tag, Name, Category, Location, etc.</li>
                  <li>• System will automatically detect and match columns</li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-secondary border border-border rounded-lg p-4">
                <p className="text-foreground font-medium">File: <span className="text-primary">{fileName}</span></p>
                <p className="text-muted-foreground text-sm">Found {rows.length - 1} data rows</p>
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary border-b border-border">
                        {rows[0].map((header, idx) => (
                          <th key={idx} className="px-6 py-3 text-left font-semibold text-foreground">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-secondary/50">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-6 py-3 text-foreground truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setStep('upload'); setCsvText(''); }}
                  className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium ml-auto"
                >
                  Continue to Confirmation
                </button>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && importResult && (
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6">
                  <p className="text-emerald-300 text-sm font-medium">Valid Records</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">{importResult.assets.length}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                  <p className="text-red-300 text-sm font-medium">Issues Found</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{importResult.errors.length}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-foreground mb-4">Issues to Review</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error: any, idx: number) => (
                      <div key={idx} className="flex gap-3 text-sm p-3 bg-secondary rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium">Row {error.row}</p>
                          <p className="text-muted-foreground text-xs">{error.reason}</p>
                        </div>
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-muted-foreground text-sm text-center py-2">
                        +{importResult.errors.length - 10} more issues...
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('preview')}
                  className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium ml-auto"
                  disabled={importResult.assets.length === 0}
                >
                  Import {importResult.assets.length} Assets
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="max-w-2xl text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Import Successful!</h3>
              <p className="text-muted-foreground">
                {importResult?.assets.length} assets have been imported and added to your inventory.
              </p>

              <div className="bg-secondary rounded-lg p-6 text-left">
                <h4 className="font-semibold text-foreground mb-3">Summary</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">{importResult?.assets.length}</span> assets imported
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">{importResult?.errors.length}</span> records skipped
                  </p>
                  <p className="text-muted-foreground">
                    File: <span className="text-foreground font-medium">{fileName}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => { 
                    setStep('upload'); 
                    setCsvText('');
                    setFileName('');
                    setImportResult(null);
                  }}
                  className="flex-1 px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors font-medium"
                >
                  Import Another File
                </button>
                <a
                  href="/assets"
                  className="flex-1 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium text-center"
                >
                  View All Assets
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
