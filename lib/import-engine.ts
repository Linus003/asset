import { Asset, AssetCategory, ImportError, ImportHistory } from './types';
import { addAsset, addImportHistory, getCurrentUser } from './store';

export const KEMU_TEMPLATE_HEADERS = ['Log #', 'Asset Name', 'Asset Tag', 'Serial No', 'Model', 'Category', 'Status', 'Check Out To', 'Location'];

interface ColumnMapping {
  logNumber?: string;
  serialNo?: string;
  model?: string;
  assignedTo?: string;
  assetTag?: string;
  name?: string;
  category?: string;
  description?: string;
  location?: string;
  status?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  supplier?: string;
  warranty?: string;
}

// Fuzzy string matching for column detection
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Check for partial matches
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = getLevenshteinDistance(longer, shorter);
  return 1 - editDistance / longer.length;
}

function getLevenshteinDistance(s1: string, s2: string): number {
  const distances: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    distances[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    distances[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        distances[i][j] = distances[i - 1][j - 1];
      } else {
        distances[i][j] = Math.min(
          distances[i - 1][j] + 1,
          distances[i][j - 1] + 1,
          distances[i - 1][j - 1] + 1
        );
      }
    }
  }
  
  return distances[s1.length][s2.length];
}

// Detect columns automatically with fuzzy matching
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const fieldPatterns: Record<string, string[]> = {
    logNumber: ['log #', 'log no', 'log number', 'log', '#'],
    assetTag: ['asset tag', 'asset number', 'asset id', 'tag', 'assetid', 'asset_id'],
    serialNo: ['serial no', 'serial number', 'serial', 'serialno', 's/n'],
    model: ['model', 'make model', 'equipment model'],
    assignedTo: ['check out to', 'checked out to', 'assignee', 'assigned to', 'custodian', 'user'],
    name: ['asset name', 'equipment name', 'name', 'description', 'title'],
    category: ['category', 'type', 'asset type', 'class'],
    description: ['description', 'details', 'notes', 'remarks'],
    location: ['location', 'department', 'dept', 'building', 'room', 'office'],
    status: ['status', 'state', 'condition'],
    purchaseDate: ['purchase date', 'purchase', 'date', 'purchased', 'purchase_date', 'date purchased'],
    purchasePrice: ['price', 'cost', 'purchase price', 'purchase_price', 'amount'],
    supplier: ['supplier', 'vendor', 'manufacturer', 'brand'],
    warranty: ['warranty', 'warranty date', 'warranty expiry', 'expiry'],
  };

  const mapping: ColumnMapping = {};
  const used = new Set<number>();

  // First pass: exact or high-confidence matches
  Object.entries(fieldPatterns).forEach(([field, patterns]) => {
    for (let i = 0; i < headers.length; i++) {
      if (used.has(i)) continue;
      
      const similarity = Math.max(...patterns.map(p => calculateSimilarity(headers[i], p)));
      
      if (similarity > 0.85) {
        mapping[field as keyof ColumnMapping] = headers[i];
        used.add(i);
        break;
      }
    }
  });

  return mapping;
}

// Auto-categorize assets
export function categorizeAsset(name: string, description: string): AssetCategory {
  const text = `${name} ${description}`.toLowerCase();
  
  if (/cpu|desktop|computer|pro 3|pro 34|pro 35|pro 31/i.test(text)) return 'cpu';
  if (/monitor|display|screen/i.test(text)) return 'monitor';
  if (/keyboard|pr1101u/i.test(text)) return 'keyboard';
  if (/mouse|modguo/i.test(text)) return 'mouse';
  if (/ip phone|phone|cisco phone|7940|7911/i.test(text)) return 'ip-phone';
  if (/switch|cisco switch/i.test(text)) return 'switch';
  if (/printer|scanner/i.test(text)) return 'printer';
  if (/ups|battery backup/i.test(text)) return 'ups';
  if (/laptop|desktop|computer|tablet|electronics/i.test(text)) {
    return 'electronics';
  }
  if (/desk|chair|table|shelf|cabinet|sofa|bench|rack/i.test(text)) {
    return 'furniture';
  }
  if (/tool|hammer|drill|screwdriver|wrench|saw|level|tape/i.test(text)) {
    return 'tools';
  }
  if (/vehicle|car|truck|van|bicycle|forklift/i.test(text)) {
    return 'vehicles';
  }
  
  return 'other';
}

// Parse CSV/Excel data
export function parseCSVData(csvText: string): string[][] {
  const delimiter = csvText.includes('\t') && !csvText.includes(',') ? '\t' : ',';
  const lines = csvText.trim().split(/\r?\n/);
  const rows: string[][] = [];
  
  let currentRow: string[] = [];
  let insideQuotes = false;
  let currentCell = '';

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    currentRow.push(currentCell.trim());
    currentCell = '';
    
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
      currentRow = [];
    }

    insideQuotes = false;
  }

  return rows;
}

interface ImportResult {
  assets: Asset[];
  errors: ImportError[];
  duplicates: number;
}

// Intelligent import with validation and duplicate detection
export function importAssets(csvText: string, existingAssets: Asset[]): ImportResult {
  const rows = parseCSVData(csvText);
  
  if (rows.length < 2) {
    return { assets: [], errors: [{ row: 1, field: 'all', value: '', reason: 'No data rows found' }], duplicates: 0 };
  }

  const headers = rows[0];
  const mapping = autoDetectColumns(headers);
  const assets: Asset[] = [];
  const errors: ImportError[] = [];
  const existingTags = new Set(existingAssets.map(a => a.assetTag).filter(Boolean));
  const existingSerials = new Set(existingAssets.map(a => a.serialNo).filter(Boolean));
  let duplicateCount = 0;

  const dataRows = rows.slice(1);

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex];
    const rowNum = rowIndex + 2; // Row number in spreadsheet (1-indexed, accounting for header)
    
    try {
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      // Extract values using mapping
      const logNumber = rowData[mapping.logNumber || ''] || String(rowIndex + 1);
      const serialNo = rowData[mapping.serialNo || ''] || '';
      const model = rowData[mapping.model || ''] || '';
      const assignedTo = rowData[mapping.assignedTo || ''] || '';
      const assetTag = rowData[mapping.assetTag || ''] || serialNo || `AUTO-${Date.now()}-${rowIndex}`;
      const name = rowData[mapping.name || ''] || model || 'Unknown';
      const description = rowData[mapping.description || ''] || [model, serialNo, assignedTo && `Checked out to ${assignedTo}`].filter(Boolean).join(' • ');
      const location = rowData[mapping.location || ''] || 'Unassigned';
      const purchaseDate = rowData[mapping.purchaseDate || ''] || new Date().toISOString().split('T')[0];
      const purchasePrice = parseFloat(rowData[mapping.purchasePrice || '0'] || '0') || 0;
      const supplier = rowData[mapping.supplier || ''] || '';
      const warranty = rowData[mapping.warranty || ''] || '';
      const rawStatus = (rowData[mapping.status || ''] || 'Working').toLowerCase();
      const status = rawStatus.includes('working') ? 'working' : rawStatus.includes('maintenance') ? 'maintenance' : rawStatus.includes('retired') ? 'retired' : rawStatus.includes('lost') ? 'lost' : 'active';

      // Validation
      if (!name || name.length === 0) {
        errors.push({
          row: rowNum,
          field: 'name',
          value: name,
          reason: 'Asset name is required',
        });
        continue;
      }

      // Duplicate detection
      if ((assetTag && existingTags.has(assetTag)) || (serialNo && existingSerials.has(serialNo))) {
        errors.push({
          row: rowNum,
          field: 'assetTag',
          value: assetTag,
          reason: serialNo && existingSerials.has(serialNo) ? 'Serial number already exists' : 'Asset tag already exists',
        });
        duplicateCount++;
        continue;
      }

      const asset: Asset = {
        id: `asset-${Date.now()}-${rowIndex}`,
        assetTag,
        serialNo,
        model,
        assignedTo,
        logNumber,
        name,
        category: (rowData[mapping.category || ''] ? categorizeAsset(rowData[mapping.category || ''], `${name} ${description}`) : categorizeAsset(name, description)),
        description,
        location,
        status: status as Asset['status'],
        purchaseDate,
        purchasePrice,
        supplier,
        warranty,
        lastModified: new Date().toISOString(),
        createdBy: 'import',
      };

      assets.push(asset);
      existingTags.add(assetTag);
      if (serialNo) existingSerials.add(serialNo);
    } catch (error) {
      errors.push({
        row: rowNum,
        field: 'all',
        value: row.join(','),
        reason: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return { assets, errors, duplicates: duplicateCount };
}

// Save imported assets
export function saveImportedAssets(assets: Asset[], fileName: string): ImportHistory {
  const currentUser = getCurrentUser();
  
  assets.forEach(asset => {
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

  const history = addImportHistory({
    fileName,
    timestamp: new Date().toISOString(),
    rowsImported: assets.length,
    rowsSkipped: 0,
    errors: [],
    importedBy: currentUser?.email || 'system',
  });

  return history;
}
