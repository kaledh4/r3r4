class TOONParser {
  /**
   * Parse TOON format to JavaScript object
   * Example input:
   * categories[3]{id,name,color}:
   *   neuro,Neuroradiology,#3498db
   *   chest,Chest Imaging,#e74c3c
   */

  static parse(toonString) {
    const lines = toonString.split('\n');
    const result = {};
    let currentSection = null;
    let arraySchema = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Array declaration: name[count]{fields}:
      // Regex modified to be more robust
      // Relaxed regex to allow spaces between components
      const arrayMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*\[(\d*)\]\s*\{([^}]+)\}\s*:?$/);
      if (arrayMatch) {
        const [_, name, count, fields] = arrayMatch;
        // If we are already in this section, it might be a redundant header from an append
        if (name === currentSection && arraySchema) {
          continue;
        }

        if (!result[name]) result[name] = [];
        arraySchema = { name, fields: fields.split(','), items: result[name] };
        currentSection = name;
        continue;
      }

      // Skip markdown artifacts like 'json' or '```'
      if (trimmed === 'json' || trimmed === 'toon' || trimmed.startsWith('```')) continue;

      // Array Item Parsing (CSV or Key-Value)
      if (currentSection && arraySchema) {
        if (trimmed === '') continue;

        // Check if line is a Key: Value pair (New LLM Format)
        const kvMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*(.+)$/);

        if (kvMatch) {
          // We are in Key-Value mode
          if (!this.currentKVObject) {
            this.currentKVObject = {};
            arraySchema.items.push(this.currentKVObject);
          }
          // Check if we started a new item (heuristic: if key matches first field or common start keys)
          if ((kvMatch[1].toLowerCase() === 'id' || kvMatch[1].toLowerCase().includes('id_') || kvMatch[1].toLowerCase() === 'title') && Object.keys(this.currentKVObject).length > 2) {
            this.currentKVObject = {};
            arraySchema.items.push(this.currentKVObject);
          }

          const key = kvMatch[1].toLowerCase().replace(' ', '_'); // Normalize key
          this.currentKVObject[key] = this.coerceType(kvMatch[2]);
          continue;
        } else {
          // Reset KV mode if we hit a non-KV line (unless it's just a text wrap)
          if (!trimmed.includes(':') && this.currentKVObject) {
            // append to last key? No, safer to ignore or treat as CSV if legitimate
          } else {
            this.currentKVObject = null;
          }
        }

        // Fallback to CSV (Legacy Format)
        if (!this.currentKVObject) {
          const values = this.parseCSVLine(trimmed);
          if (values.length >= 1) { // Allow partial matches
            const obj = {};
            arraySchema.fields.forEach((field, i) => {
              if (i < values.length) {
                obj[field.trim()] = this.coerceType(values[i]);
              }
            });
            arraySchema.items.push(obj);
          }
        }
        continue;
      }

      // Key-value pair or Section Start
      if (trimmed.includes(':')) {
        const firstColonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, firstColonIndex).trim();
        const value = trimmed.substring(firstColonIndex + 1).trim();

        if (arraySchema && key !== arraySchema.name) arraySchema = null;

        if (value === '' || value === '|') {
          currentSection = key;
          result[key] = value === '|' ? '' : {}; // text block vs object, but let's init as empty string if pipe is used? 
          // Actually, if pipe is used, we expect text lines following. 
          // If we init as {}, the next logic `typeof result[curr] === 'object'` might trigger key-value parsing which is wrong for text.
          // Let's force it to empty string if pipe.
          if (value === '|') result[key] = '';
          else result[key] = {};
        } else {
          if (currentSection && typeof result[currentSection] === 'object' && !Array.isArray(result[currentSection])) {
            result[currentSection][key] = this.coerceType(value);
          } else {
            currentSection = null;
            result[key] = this.coerceType(value);
          }
        }
      } else if (currentSection && !arraySchema) {
        // Multi-line text accumulation
        const lineContent = trimmed;
        if (typeof result[currentSection] === 'string') {
          result[currentSection] += (result[currentSection] ? ' ' : '') + lineContent;
        } else if (typeof result[currentSection] === 'object' && result[currentSection] !== null) {
          // If it was initialized as object but we found a text line, this format might be ambiguous.
          // For RadRes, we treat 'summary:' followed by text as a string.
          result[currentSection] = lineContent;
        }
      }
    }

    return result;
  }

  static parseCSVLine(line) {
    // Handle quoted strings with commas
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  static coerceType(value) {
    if (value === undefined || value === null) return null;

    // Numbers
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    // Booleans
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    // Null
    if (value.toLowerCase() === 'null') return null;
    // Strings (remove quotes if present)
    return value.replace(/^["']|["']$/g, '');
  }

  static stringify(obj, indent = 0) {
    let toon = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        // Array of objects - use compact format
        const fields = Object.keys(value[0]);
        toon += `${spaces}${key}[${value.length}]{${fields.join(',')}}:\n`;
        for (const item of value) {
          const values = fields.map(f => {
            const v = item[f];
            if (v === null || v === undefined) return 'null';
            const strV = String(v);
            return strV.includes(',') || strV.includes('"') ? `"${strV.replace(/"/g, '""')}"` : strV;
          });
          toon += `${spaces}  ${values.join(',')}\n`;
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        toon += `${spaces}${key}:\n`;
        toon += this.stringify(value, indent + 1);
      } else {
        toon += `${spaces}${key}: ${value}\n`;
      }
    }

    return toon;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOONParser;
} else {
  // Browser global
  window.TOONParser = TOONParser;
}
