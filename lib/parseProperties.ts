import { Property } from "@/types/property";
import { PROPERTY_FEATURE_KEYS, type FeatureTriState } from "@/lib/featureState";

function parseFeatureFromObjectString(objStr: string, key: string): FeatureTriState {
  if (new RegExp(`${key}:\\s*"yes"`).test(objStr)) return "yes";
  if (new RegExp(`${key}:\\s*"no"`).test(objStr)) return "no";
  if (new RegExp(`${key}:\\s*"unknown"`).test(objStr)) return "unknown";
  if (new RegExp(`${key}:\\s*true`).test(objStr)) return "yes";
  /** Legacy `false` in TS file = unchecked → unknown, not “confirmed no” */
  if (new RegExp(`${key}:\\s*false`).test(objStr)) return "unknown";
  return "unknown";
}

// Parse properties from TypeScript file - improved version
export function parsePropertiesFile(content: string): Property[] {
  try {
    // Find "export const properties: Property[] = [" then extract array by bracket matching
    // (regex with ]; would break when ]; appears inside a description string)
    const startMarker = "export const properties: Property[] = [";
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) {
      console.error("Could not find properties array in file");
      return [];
    }
    const arrayStart = startIdx + startMarker.length - 1; // index of [
    let depth = 0;
    let inStr = false;
    let strChar = "";
    let i = arrayStart;
    while (i < content.length) {
      const c = content[i];
      if (inStr) {
        if (c === "\\") { i++; continue; }
        if (c === strChar) inStr = false;
        i++;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        inStr = true;
        strChar = c;
        i++;
        continue;
      }
      if (c === "[") { depth++; i++; continue; }
      if (c === "]") {
        depth--;
        if (depth === 0) break;
        i++;
        continue;
      }
      i++;
    }
    const arrayContent = content.slice(arrayStart + 1, i).trim();

    const properties: Property[] = [];
    
    // Find each property object by tracking braces
    let objDepth = 0;
    let currentObj = '';
    let inString = false;
    let stringChar = '';
    let escapeNext = false;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      
      if (escapeNext) {
        currentObj += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentObj += char;
        continue;
      }
      
      // Handle strings
      if ((char === '"' || char === "'" || char === '`') && !escapeNext) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        currentObj += char;
        continue;
      }
      
      if (inString) {
        currentObj += char;
        continue;
      }
      
      // Track object depth
      if (char === '{') {
        if (objDepth === 0) {
          currentObj = '';
        }
        objDepth++;
        currentObj += char;
      } else if (char === '}') {
        currentObj += char;
        objDepth--;
        if (objDepth === 0) {
          // Try to parse this object
          try {
            const parsed = parsePropertyObject(currentObj);
            if (parsed) {
              properties.push(parsed);
            }
          } catch (e) {
            console.error("Error parsing property object:", e);
          }
          currentObj = '';
        }
      } else {
        if (objDepth > 0) {
          currentObj += char;
        }
      }
    }

    return properties;
  } catch (error) {
    console.error("Error parsing properties file:", error);
    return [];
  }
}

/** Slice `    price: { ... }` so price regexes never match text inside `description`. */
function extractTopLevelPriceBlock(objStr: string): string | null {
  const marker = "    price: {";
  const start = objStr.indexOf(marker);
  if (start === -1) return null;
  const openIdx = start + marker.length - 1;
  let depth = 0;
  let inStr = false;
  let strCh = "";
  let esc = false;
  for (let i = openIdx; i < objStr.length; i++) {
    const c = objStr[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = true;
      strCh = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return objStr.slice(start, i + 1);
    }
  }
  return null;
}

const PRICE_NUM_RE = "([0-9]+(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)";

function parseRoundedPriceInt(m: RegExpMatchArray | null): number | undefined {
  if (!m) return undefined;
  const v = parseFloat(m[1]);
  if (!Number.isFinite(v)) return undefined;
  return Math.round(v);
}

// Parse a single property object from string - improved regex-based version
function parsePropertyObject(objStr: string): Property | null {
  try {
    const obj: any = {};
    
    // Extract id
    const idMatch = objStr.match(/id:\s*"([^"]+)"/);
    if (idMatch) obj.id = idMatch[1];
    
    // Extract title (optional — can be auto-generated from villaNumber + params)
    const titleMatch = objStr.match(/title:\s*"([^"]*)"/);
    if (titleMatch) obj.title = titleMatch[1];
    // Extract villaNumber (required for display; default "" for old data)
    const villaNumberMatch = objStr.match(/villaNumber:\s*"([^"]*)"/);
    obj.villaNumber = villaNumberMatch ? villaNumberMatch[1] : "";
    // Extract internalName (optional, admin-only)
    const internalNameMatch = objStr.match(/internalName:\s*"([^"]*)"/);
    if (internalNameMatch) obj.internalName = internalNameMatch[1];
    
    // Extract description - improved to handle \n and escaped characters
    // Match from description: " to the closing " (handling escaped quotes)
    let descStart = objStr.indexOf('description:');
    if (descStart !== -1) {
      descStart = objStr.indexOf('"', descStart);
      if (descStart !== -1) {
        descStart++; // Skip opening quote
        let descEnd = descStart;
        let escaped = false;
        
        // Find the closing quote (not escaped)
        while (descEnd < objStr.length) {
          if (escaped) {
            escaped = false;
          } else if (objStr[descEnd] === '\\') {
            escaped = true;
          } else if (objStr[descEnd] === '"') {
            break;
          }
          descEnd++;
        }
        
        if (descEnd < objStr.length) {
          let desc = objStr.substring(descStart, descEnd);
          // Unescape
          desc = desc.replace(/\\n/g, '\n')
                     .replace(/\\"/g, '"')
                     .replace(/\\'/g, "'")
                     .replace(/\\\\/g, '\\');
          obj.description = desc;
        }
      }
    }
    
    // Extract types (array) - new structure
    const typesMatch = objStr.match(/types:\s*\[([^\]]+)\]/);
    if (typesMatch) {
      const arrayContent = typesMatch[1];
      const items: string[] = [];
      let currentItem = '';
      let inQuotes = false;
      let escaped = false;
      
      for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i];
        if (escaped) {
          currentItem += char;
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
          currentItem += char;
        } else if (char === '"') {
          inQuotes = !inQuotes;
          currentItem += char;
        } else if (char === ',' && !inQuotes) {
          if (currentItem.trim()) {
            items.push(currentItem.trim().replace(/^"|"$/g, ''));
            currentItem = '';
          }
        } else {
          currentItem += char;
        }
      }
      if (currentItem.trim()) {
        items.push(currentItem.trim().replace(/^"|"$/g, ''));
      }
      obj.types = items.filter(Boolean);
    } else {
      // Fallback: try old structure (single type)
      const typeMatch = objStr.match(/type:\s*"([^"]+)"/);
      if (typeMatch) {
        obj.types = [typeMatch[1]];
      } else {
        obj.types = [];
      }
    }
    
    // Extract mainArea
    const mainAreaMatch = objStr.match(/mainArea:\s*"([^"]+)"/);
    if (mainAreaMatch) {
      obj.mainArea = mainAreaMatch[1];
    } else {
      // Fallback: determine from subArea
      const subAreaMatch = objStr.match(/subArea:\s*"([^"]+)"/);
      if (subAreaMatch) {
        // All current sub-areas are in Ubud
        obj.mainArea = 'ubud';
      }
    }
    
    // Extract subArea
    const subAreaMatch = objStr.match(/subArea:\s*"([^"]+)"/);
    if (subAreaMatch) {
      obj.subArea = subAreaMatch[1];
    } else {
      // Fallback: try old structure (area)
      const areaMatch = objStr.match(/area:\s*"([^"]+)"/);
      if (areaMatch) {
        obj.subArea = areaMatch[1];
        obj.mainArea = 'ubud'; // All current areas are Ubud sub-areas
      }
    }
    // Extract exactLocation (admin-only link, e.g. Google Maps)
    const exactLocationMatch = objStr.match(/exactLocation:\s*"([^"]*)"/);
    if (exactLocationMatch) obj.exactLocation = exactLocationMatch[1];
    // Extract displayLocation (lat,lon for map)
    const displayLocationMatch = objStr.match(/displayLocation:\s*"([^"]*)"/);
    if (displayLocationMatch) obj.displayLocation = displayLocationMatch[1];
    const youtubeVideoUrlMatch = objStr.match(/youtubeVideoUrl:\s*"([^"]*)"/);
    if (youtubeVideoUrlMatch) obj.youtubeVideoUrl = youtubeVideoUrlMatch[1];
    
    // Extract bedrooms
    const bedroomsMatch = objStr.match(/bedrooms:\s*(\d+)/);
    if (bedroomsMatch) obj.bedrooms = parseInt(bedroomsMatch[1]);
    
    // Extract bathrooms
    const bathroomsMatch = objStr.match(/bathrooms:\s*(\d+)/);
    if (bathroomsMatch) obj.bathrooms = parseInt(bathroomsMatch[1]);

    // Extract floors (optional)
    const floorsMatch = objStr.match(/floors:\s*(\d+)/);
    if (floorsMatch) obj.floors = parseInt(floorsMatch[1], 10);

    // Extract price only from the real `price: { }` block (not from description text)
    const priceBlock = extractTopLevelPriceBlock(objStr) ?? objStr;
    const priceCurrencyMatch = priceBlock.match(/currency:\s*"([^"]+)"/);
    const priceMinMatch = priceBlock.match(
      new RegExp(`min:\\s*${PRICE_NUM_RE}`)
    );
    const priceMonthlyMatch = priceBlock.match(
      new RegExp(`monthly:\\s*${PRICE_NUM_RE}`)
    );
    const priceYearlyMatch = priceBlock.match(
      new RegExp(`yearly:\\s*${PRICE_NUM_RE}`)
    );
    const priceForSaleMatch = priceBlock.match(
      new RegExp(`forSale:\\s*${PRICE_NUM_RE}`)
    );
    obj.price = {
      currency: priceCurrencyMatch ? priceCurrencyMatch[1] : "IDR",
    };
    const minParsed = parseRoundedPriceInt(priceMinMatch);
    if (minParsed !== undefined) obj.price.min = minParsed;
    const monthlyParsed = parseRoundedPriceInt(priceMonthlyMatch);
    if (monthlyParsed !== undefined) obj.price.monthly = monthlyParsed;
    const yearlyParsed = parseRoundedPriceInt(priceYearlyMatch);
    if (yearlyParsed !== undefined) obj.price.yearly = yearlyParsed;
    const forSaleParsed = parseRoundedPriceInt(priceForSaleMatch);
    if (forSaleParsed !== undefined) obj.price.forSale = forSaleParsed;
    
    // Extract duration
    const durationMinMatch = objStr.match(/duration:\s*\{[\s\S]*?min:\s*(\d+)/);
    const durationMaxMatch = objStr.match(/max:\s*(\d+)/);
    if (durationMinMatch) {
      obj.duration = {
        min: parseInt(durationMinMatch[1])
      };
      if (durationMaxMatch && objStr.includes('duration:')) {
        obj.duration.max = parseInt(durationMaxMatch[1]);
      }
    }
    
    // Extract features (tri-state strings or legacy booleans)
    obj.features = Object.fromEntries(
      PROPERTY_FEATURE_KEYS.map((k) => [k, parseFeatureFromObjectString(objStr, k)])
    ) as Property["features"];
    
    // Extract images array - same logic
    const imagesMatch = objStr.match(/images:\s*\[([^\]]+)\]/);
    if (imagesMatch) {
      const arrayContent = imagesMatch[1];
      const items: string[] = [];
      let currentItem = '';
      let inQuotes = false;
      let escaped = false;
      
      for (let i = 0; i < arrayContent.length; i++) {
        const char = arrayContent[i];
        if (escaped) {
          currentItem += char;
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
          currentItem += char;
        } else if (char === '"') {
          inQuotes = !inQuotes;
          currentItem += char;
        } else if (char === ',' && !inQuotes) {
          if (currentItem.trim()) {
            items.push(currentItem.trim().replace(/^"|"$/g, ''));
            currentItem = '';
          }
        } else {
          currentItem += char;
        }
      }
      if (currentItem.trim()) {
        items.push(currentItem.trim().replace(/^"|"$/g, ''));
      }
      obj.images = items.filter(Boolean);
    } else {
      obj.images = [];
    }
    
    // Extract order
    const orderMatch = objStr.match(/order:\s*(\d+)/);
    if (orderMatch) {
      obj.order = parseInt(orderMatch[1]);
    }
    
    // Extract dates
    const createdAtMatch = objStr.match(/createdAt:\s*"([^"]+)"/);
    if (createdAtMatch) obj.createdAt = createdAtMatch[1];
    
    const updatedAtMatch = objStr.match(/updatedAt:\s*"([^"]+)"/);
    if (updatedAtMatch) obj.updatedAt = updatedAtMatch[1];

    const archivedMatch = objStr.match(/archived:\s*true/);
    if (archivedMatch) obj.archived = true;

    const availableFromMatch = objStr.match(/availableFrom:\s*"([^"]+)"/);
    if (availableFromMatch) obj.availableFrom = availableFromMatch[1];

    // Validate required fields (title is optional — display title is auto from villaNumber + params)
    if (!obj.id) {
      return null;
    }

    // Ensure types array
    if (!Array.isArray(obj.types) || obj.types.length === 0) {
      obj.types = ['rent']; // Default to rent
    }

    // Ensure mainArea
    if (!obj.mainArea) {
      obj.mainArea = 'ubud'; // Default
    }

    // subArea is optional (e.g. Seminyak has no sub-areas)

    // Ensure price structure
    if (!obj.price) {
      obj.price = { min: 0, currency: "IDR" };
    }

    // Ensure features structure
    if (!obj.features) {
      obj.features = {
        bathtub: false,
        carPark: false,
        desk: false,
        natureView: false,
        pool: false,
      };
    }

    // Ensure arrays
    if (!Array.isArray(obj.images)) {
      obj.images = [];
    }

    return obj as Property;
  } catch (error) {
    console.error("Error parsing property object:", error);
    return null;
  }
}
