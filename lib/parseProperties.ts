import { Property } from "@/types/property";

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
    
    // Extract bedrooms
    const bedroomsMatch = objStr.match(/bedrooms:\s*(\d+)/);
    if (bedroomsMatch) obj.bedrooms = parseInt(bedroomsMatch[1]);
    
    // Extract bathrooms
    const bathroomsMatch = objStr.match(/bathrooms:\s*(\d+)/);
    if (bathroomsMatch) obj.bathrooms = parseInt(bathroomsMatch[1]);
    
    // Extract price (currency, min/max, monthly/yearly)
    const priceCurrencyMatch = objStr.match(/currency:\s*"([^"]+)"/);
    const priceMinMatch = objStr.match(/price:\s*\{[\s\S]*?min:\s*(\d+)/);
    const priceMonthlyMatch = objStr.match(/monthly:\s*(\d+)/);
    const priceYearlyMatch = objStr.match(/yearly:\s*(\d+)/);
    const priceForSaleMatch = objStr.match(/forSale:\s*(\d+)/);
    obj.price = {
      currency: priceCurrencyMatch ? priceCurrencyMatch[1] : "IDR",
    };
    if (priceMinMatch) obj.price.min = parseInt(priceMinMatch[1]);
    if (priceMonthlyMatch) obj.price.monthly = parseInt(priceMonthlyMatch[1]);
    if (priceYearlyMatch) obj.price.yearly = parseInt(priceYearlyMatch[1]);
    if (priceForSaleMatch) obj.price.forSale = parseInt(priceForSaleMatch[1]);
    
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
    
    // Extract features
    obj.features = {
      bathtub: /bathtub:\s*true/.test(objStr),
      carPark: /carPark:\s*true/.test(objStr),
      desk: /desk:\s*true/.test(objStr),
      natureView: /natureView:\s*true/.test(objStr),
      pool: /pool:\s*true/.test(objStr),
    };
    if (/closedKitchen:\s*true/.test(objStr)) obj.features.closedKitchen = true;
    if (/enclosedLivingArea:\s*true/.test(objStr)) obj.features.enclosedLivingArea = true;
    if (/garage:\s*true/.test(objStr)) obj.features.garage = true;
    if (/highSpeedWifi:\s*true/.test(objStr)) obj.features.highSpeedWifi = true;
    if (/petFriendly:\s*true/.test(objStr)) obj.features.petFriendly = true;
    if (/washingMachine:\s*true/.test(objStr)) obj.features.washingMachine = true;
    
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
