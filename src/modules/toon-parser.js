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
      const arrayMatch = trimmed.match(/^([a-zA-Z0-9_]+)\[(\d+)\]\{([^}]+)\}:$/);
      if (arrayMatch) {
        const [_, name, count, fields] = arrayMatch;
        if (!result[name]) result[name] = [];
        arraySchema = { name, fields: fields.split(','), items: result[name] };
        currentSection = name;
        continue;
      }

      // Array item (CSV format)
      if (arraySchema && !trimmed.includes(':') && currentSection === arraySchema.name) {
        const values = this.parseCSVLine(trimmed);
        const obj = {};
        arraySchema.fields.forEach((field, i) => {
          if (i < values.length) {
            obj[field] = this.coerceType(values[i]);
          }
        });
        arraySchema.items.push(obj);
        continue;
      }

      // Key-value pair or Section Start
      if (trimmed.includes(':')) {
        const firstColonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, firstColonIndex).trim();
        const value = trimmed.substring(firstColonIndex + 1).trim();

        if (arraySchema && key !== arraySchema.name) arraySchema = null;

        if (value === '') {
          currentSection = key;
          result[key] = {}; // Initialize as object to support nested keys
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
