import { Asset, AssetCategory, ImportError, ImportHistory } from './types';
import { addAsset, addImportHistory, getCurrentUser } from './store';

export const KEMU_TEMPLATE_HEADERS = ['Log #', 'Asset Name', 'Asset Tag', 'Serial No', 'Model', 'Category', 'Status', 'Check Out To', 'Location'];

export interface ColumnMapping {
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

export const IMPORT_FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  logNumber: 'Log #',
  assetTag: 'Asset Tag',
  serialNo: 'Serial No',
  model: 'Model',
  assignedTo: 'Check Out To',
  name: 'Asset Name',
  category: 'Category',
  description: 'Description',
  location: 'Location',
  status: 'Status',
  purchaseDate: 'Purchase Date',
  purchasePrice: 'Purchase Price',
  supplier: 'Supplier / Vendor',
  warranty: 'Warranty Expiry',
};

export const REQUIRED_IMPORT_FIELDS: (keyof ColumnMapping)[] = ['name', 'assetTag', 'serialNo', 'model', 'assignedTo', 'location'];


// Fuzzy string matching for column detection
function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[#/\\_-]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeHeader(str1);
  const s2 = normalizeHeader(str2);
  
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
    assetTag: ['asset tag', 'asset number', 'asset no', 'asset id', 'tag', 'assetid', 'asset_id', 'property tag', 'inventory tag'],
    serialNo: ['serial no', 'serial number', 'serial', 'serialno', 's/n', 'sn', 'service tag'],
    model: ['model', 'make model', 'equipment model', 'model no', 'model number'],
    assignedTo: ['check out to', 'checkout to', 'checked out to', 'checkedout to', 'check-out to', 'assignee', 'assigned to', 'issued to', 'custodian', 'user', 'employee'],
    name: ['asset name', 'equipment name', 'item name', 'name', 'description', 'title'],
    category: ['category', 'type', 'asset type', 'asset category', 'class'],
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
      
      if (similarity >= 0.85) {
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
  const delimiter = detectDelimiter(csvText);
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

function detectDelimiter(csvText: string): string {
  const candidates = [',', '\t', ';'];
  const sampleLines = csvText.split(/\r?\n/).filter((line) => line.trim()).slice(0, 10);

  return candidates.reduce((bestDelimiter, delimiter) => {
    const bestScore = sampleLines.reduce((score, line) => score + splitLineForScore(line, bestDelimiter).length, 0);
    const candidateScore = sampleLines.reduce((score, line) => score + splitLineForScore(line, delimiter).length, 0);
    return candidateScore > bestScore ? delimiter : bestDelimiter;
  }, ',');
}

function splitLineForScore(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let insideQuotes = false;
  let currentCell = '';

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
      cells.push(currentCell);
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  cells.push(currentCell);
  return cells;
}

function countDetectedColumns(mapping: ColumnMapping): number {
  return Object.values(mapping).filter(Boolean).length;
}

export function findHeaderRow(rows: string[][]): { headerIndex: number; headers: string[]; mapping: ColumnMapping } {
  let bestMatch = { headerIndex: 0, headers: rows[0] || [], mapping: autoDetectColumns(rows[0] || []), score: 0 };
  bestMatch.score = countDetectedColumns(bestMatch.mapping);

  rows.slice(0, 10).forEach((row, index) => {
    const mapping = autoDetectColumns(row);
    const score = countDetectedColumns(mapping);

    if (score > bestMatch.score) {
      bestMatch = { headerIndex: index, headers: row, mapping, score };
    }
  });

  return bestMatch;
}

export interface ImportResult {
  assets: Asset[];
  errors: ImportError[];
  duplicates: number;
  mapping: ColumnMapping;
  headers: string[];
  headerIndex: number;
}

// Intelligent import with validation and duplicate detection
export function importAssets(csvText: string, existingAssets: Asset[], manualMapping?: ColumnMapping, manualHeaderIndex?: number): ImportResult {
  const rows = parseCSVData(csvText);
  
  if (rows.length < 2) {
    return { assets: [], errors: [{ row: 1, field: 'all', value: '', reason: 'No data rows found' }], duplicates: 0, mapping: {}, headers: [], headerIndex: 0 };
  }

  const detected = findHeaderRow(rows);
  const headerIndex = manualHeaderIndex ?? detected.headerIndex;
  const headers = rows[headerIndex] || detected.headers;
  const mapping = manualMapping || detected.mapping;
  const assets: Asset[] = [];
  const errors: ImportError[] = [];
  const existingTags = new Set(existingAssets.map(a => a.assetTag).filter(Boolean));
  const existingSerials = new Set(existingAssets.map(a => a.serialNo).filter(Boolean));
  let duplicateCount = 0;

  if (!mapping.name && !mapping.assetTag && !mapping.serialNo && !mapping.model) {
    return {
      assets: [],
      errors: [{ row: headerIndex + 1, field: 'headers', value: headers.join(', '), reason: 'Could not detect asset columns. Please include headers like Asset Name, Serial No, Model, Category, and Check Out To.' }],
      duplicates: 0,
      mapping,
      headers,
      headerIndex,
    };
  }

  const dataRows = rows.slice(headerIndex + 1);

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex];
    const rowNum = headerIndex + rowIndex + 2; // Row number in spreadsheet (1-indexed, accounting for header)
    
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

  return { assets, errors, duplicates: duplicateCount, mapping, headers, headerIndex };
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
      campusId: asset.campusId,
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
